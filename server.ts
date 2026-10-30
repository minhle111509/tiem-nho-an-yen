import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import { db, isOrderStatus, isPaymentStatus } from './server/db';
import { normalizeSearchText, normalizePhone } from './src/utils/format';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const port = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const app = express();
app.set('trust proxy', 1); // correct client IP behind Render/Railway/Nginx for rate limiting

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Minimal in-memory fixed-window rate limiter (enough for a single-instance shop)
function rateLimit(name: string, max: number, windowMs: number, message: string) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [key, v] of hits) if (v.resetAt <= now) hits.delete(key);
  }, windowMs).unref();

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = `${name}:${req.ip}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (++entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ success: false, error: message });
    }
    next();
  };
}

const loginLimiter = rateLimit('login', 10, 15 * 60_000, 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.');
const lookupLimiter = rateLimit('lookup', 30, 15 * 60_000, 'Bạn tra cứu quá nhiều lần. Vui lòng thử lại sau ít phút.');
const orderLimiter = rateLimit('order', 10, 10 * 60_000, 'Bạn đặt hàng quá nhiều lần liên tiếp. Vui lòng thử lại sau ít phút.');
const aiLimiter = rateLimit('ai', 30, 60 * 60_000, 'Đã dùng AI gợi ý quá nhiều trong 1 giờ, vui lòng thử lại sau.');

// Ensure uploads directory exists and mount static route
const UPLOADS_DIR = path.resolve(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// --- PUBLIC APIS ---

// Get all active products
app.get('/api/products', (req, res) => {
  const { category, search, featured, newArrival } = req.query;
  let products = db.getProducts().filter((p) => p.isActive);

  if (category && typeof category === 'string' && category !== 'all') {
    products = products.filter((p) => p.categoryId === category);
  }

  if (featured === 'true') {
    products = products.filter((p) => p.isFeatured);
  }

  if (newArrival === 'true') {
    products = products.filter((p) => p.isNewArrival);
  }

  if (search && typeof search === 'string') {
    const q = normalizeSearchText(search);
    products = products.filter((p) =>
      [p.name, p.sku, p.material, p.meaning].some((field) => normalizeSearchText(field).includes(q))
    );
  }

  res.json({ success: true, products });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm.' });
  }
  res.json({ success: true, product });
});

// Get categories
app.get('/api/categories', (req, res) => {
  res.json({ success: true, categories: db.getCategories() });
});

// Public store settings (excludes adminPin for security)
app.get('/api/settings/public', (req, res) => {
  const settings = db.getSettings();
  const { adminPin, ...publicSettings } = settings;
  res.json({ success: true, settings: publicSettings });
});

// Articles (Góc An Yên)
app.get('/api/articles', (req, res) => {
  res.json({ success: true, articles: db.getArticles() });
});

app.get('/api/articles/:id', (req, res) => {
  const articles = db.getArticles();
  const article = articles.find((a) => a.id === req.params.id || a.slug === req.params.id);
  if (!article) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy bài viết.' });
  }
  res.json({ success: true, article });
});

// Safe Customer Order Lookup (Requires BOTH phone and orderId to prevent enumeration)
app.post('/api/orders/lookup', lookupLimiter, (req, res) => {
  const { phone, orderId } = req.body;
  if (typeof phone !== 'string' || typeof orderId !== 'string' || !phone.trim() || !orderId.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng cung cấp cả Mã đơn hàng và Số điện thoại đã đặt hàng.',
    });
  }

  const order = db.findOrderByPhoneAndCode(phone, orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy đơn hàng khớp với Mã đơn và Số điện thoại đã cung cấp.',
    });
  }

  // Return order details without sensitive internal notes
  const { internalNote, ...customerSafeOrder } = order;
  res.json({ success: true, order: customerSafeOrder });
});

// Create Order (Guest checkout, server-side stock check)
app.post('/api/orders', orderLimiter, (req, res) => {
  const result = db.createOrder(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.status(201).json(result);
});

// Customer can cancel order ONLY if still pending_confirm
app.post('/api/orders/:id/cancel-request', lookupLimiter, (req, res) => {
  const { phone } = req.body;
  const order = db.getOrderById(req.params.id);

  if (!order || typeof phone !== 'string' || normalizePhone(order.customerPhone) !== normalizePhone(phone)) {
    return res.status(403).json({ success: false, error: 'Thông tin xác minh không hợp lệ.' });
  }

  if (order.status !== 'pending_confirm') {
    return res.status(400).json({
      success: false,
      error: 'Đơn hàng đã được tiệm xử lý, không thể tự hủy. Vui lòng liên hệ hotline tiệm để được hỗ trợ.',
    });
  }

  const updated = db.updateOrderStatus(order.id, 'cancelled', 'Khách hàng tự hủy đơn trước khi tiệm xác nhận');
  const { internalNote, ...customerSafeOrder } = updated!;
  res.json({ success: true, order: customerSafeOrder });
});

// --- ADMIN APIS (Protected by simple PIN header) ---

// ADMIN_PIN env var (if set) always wins, so the owner can recover access from the hosting dashboard
const getAdminPin = () => process.env.ADMIN_PIN?.trim() || db.getSettings().adminPin;

const isValidAdminPin = (pin: unknown): boolean => {
  if (typeof pin !== 'string' || !pin) return false;
  const expected = Buffer.from(getAdminPin());
  const given = Buffer.from(pin);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
};

// Wrong PINs on any admin route count toward the login limiter, so the header can't be brute-forced either
const verifyAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (isValidAdminPin(req.headers['x-admin-pin'])) return next();
  loginLimiter(req, res, () => {
    res.status(401).json({ success: false, error: 'Mã PIN quản trị không chính xác.' });
  });
};

// Admin Login Check
app.post('/api/admin/login', (req, res) => {
  if (isValidAdminPin(req.body?.pin)) {
    return res.json({ success: true, message: 'Đăng nhập thành công' });
  }
  loginLimiter(req, res, () => {
    res.status(401).json({ success: false, error: 'Mã PIN không đúng.' });
  });
});

// Admin Dashboard stats
app.get('/api/admin/stats', verifyAdmin, (req, res) => {
  res.json({ success: true, stats: db.getDashboardStats() });
});

// Admin list all orders
app.get('/api/admin/orders', verifyAdmin, (req, res) => {
  res.json({ success: true, orders: db.getOrders() });
});

// Admin update order status
app.put('/api/admin/orders/:id/status', verifyAdmin, (req, res) => {
  const { status, note, shippingCarrier, trackingCode } = req.body;
  if (!isOrderStatus(status)) {
    return res.status(400).json({ success: false, error: 'Trạng thái đơn hàng không hợp lệ' });
  }
  const updated = db.updateOrderStatus(req.params.id, status, note, {
    carrier: shippingCarrier,
    trackingCode,
  });

  if (!updated) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' });
  }
  res.json({ success: true, order: updated });
});

// Admin update order payment
app.put('/api/admin/orders/:id/payment', verifyAdmin, (req, res) => {
  const { paymentStatus, note } = req.body;
  if (!isPaymentStatus(paymentStatus)) {
    return res.status(400).json({ success: false, error: 'Trạng thái thanh toán không hợp lệ' });
  }
  const updated = db.updateOrderPayment(req.params.id, paymentStatus, note);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' });
  }
  res.json({ success: true, order: updated });
});

// Admin update internal note
app.put('/api/admin/orders/:id/note', verifyAdmin, (req, res) => {
  const { internalNote } = req.body;
  const updated = db.updateInternalNote(req.params.id, internalNote);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' });
  }
  res.json({ success: true, order: updated });
});

// Admin Products CRUD
app.get('/api/admin/products', verifyAdmin, (req, res) => {
  res.json({ success: true, products: db.getProducts() });
});

app.post('/api/admin/products', verifyAdmin, (req, res) => {
  try {
    const product = db.createProduct(req.body);
    res.status(201).json({ success: true, product });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Lỗi thêm sản phẩm' });
  }
});

app.put('/api/admin/products/:id', verifyAdmin, (req, res) => {
  try {
    const updated = db.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });
    }
    res.json({ success: true, product: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Lỗi cập nhật sản phẩm' });
  }
});

app.delete('/api/admin/products/:id', verifyAdmin, (req, res) => {
  const success = db.deleteProduct(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });
  }
  res.json({ success: true, message: 'Đã xóa sản phẩm' });
});

// Admin Duplicate Product (Nhân bản sản phẩm)
app.post('/api/admin/products/:id/duplicate', verifyAdmin, (req, res) => {
  const duplicated = db.duplicateProduct(req.params.id);
  if (!duplicated) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm để nhân bản' });
  }
  res.status(201).json({ success: true, product: duplicated });
});

// Admin Toggle Product Visibility (Ẩn/Hiện sản phẩm)
app.put('/api/admin/products/:id/toggle-status', verifyAdmin, (req, res) => {
  const updated = db.toggleProductStatus(req.params.id);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });
  }
  res.json({ success: true, product: updated });
});

// Admin Upload Image (Lưu ảnh sản phẩm lên máy chủ từ camera/thư viện)
app.post('/api/admin/upload-image', verifyAdmin, (req, res) => {
  try {
    const { imageBase64, fileName } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Dữ liệu ảnh không hợp lệ' });
    }

    const matches = typeof imageBase64 === 'string' ? imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/) : null;
    const ext = matches ? ALLOWED_IMAGE_TYPES[matches[1].toLowerCase()] : undefined;
    if (!matches || !ext) {
      return res.status(400).json({ success: false, error: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP' });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
      return res.status(400).json({ success: false, error: 'Ảnh rỗng hoặc lớn hơn 5MB' });
    }

    const uniqueName = `ay-prod-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueName);
    fs.writeFileSync(filePath, buffer);

    res.json({
      success: true,
      url: `/uploads/${uniqueName}`,
      fileName: fileName || uniqueName,
    });
  } catch (err: any) {
    console.error('Upload image error:', err);
    res.status(500).json({ success: false, error: 'Lỗi khi lưu ảnh lên máy chủ' });
  }
});

// Admin AI Suggest Product from Photo (AI gợi ý tên, mô tả từ hình ảnh)
app.post('/api/admin/ai-suggest-product', verifyAdmin, aiLimiter, async (req, res) => {
  try {
    const { imageBase64, currentCategory, currentName } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Vui lòng chọn hoặc chụp ảnh sản phẩm trước' });
    }

    let mimeType = 'image/jpeg';
    let rawBase64 = imageBase64;
    const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      rawBase64 = matches[2];
    }

    const hasValidGeminiKey =
      Boolean(process.env.GEMINI_API_KEY) &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY!.trim().length > 15;

    if (hasValidGeminiKey) {
      try {
        const prompt = `Bạn là chuyên gia thẩm định và sáng tạo nội dung của "TIỆM NHỎ AN YÊN" — thương hiệu chuyên kinh doanh vật phẩm phong thủy đá tự nhiên, mặt dây chuyền ngọc tự nhiên và nụ trầm hương mang phong cách Zen Vintage & Oriental Minimalism ("Một chút an yên, gửi đến bạn").
Hãy quan sát bức ảnh sản phẩm này và đề xuất thông tin bán hàng trang nhã, đúng tinh thần phương Đông thanh tịnh và mộc mạc.
Danh mục sản phẩm chỉ được chọn 1 trong 3 mã sau:
- "vat-pham-an-lanh" (nếu là đá tự nhiên, quả cầu, tượng tỳ hưu, hồ ly...)
- "duyen-lanh-ben-minh" (nếu là mặt dây chuyền ngọc, trang sức hộ mệnh...)
- "huong-tram-tinh-tai" (nếu là nụ trầm hương, lư đốt trầm, bộ thưởng trầm...)

Trả về kết quả dưới định dạng JSON hợp lệ:
{
  "name": "Tên sản phẩm tao nhã, chuẩn phong cách Zen",
  "categoryId": "vat-pham-an-lanh",
  "material": "Chất liệu ước tính từ ảnh",
  "dimensions": "Kích thước ước lượng phù hợp",
  "color": "Màu sắc tự nhiên",
  "origin": "Xuất xứ ước lượng",
  "meaning": "Ý nghĩa biểu tượng truyền thống sâu lắng, nhắc nhở tâm an định, không mê tín dị đoan",
  "description": "Mô tả chi tiết 2-3 câu giàu chất thơ, mộc mạc và an nhiên",
  "usageInstructions": "Hướng dẫn sử dụng an yên",
  "careInstructions": "Hướng dẫn bảo quản giữ gìn",
  "suggestedPrice": 380000
}`;

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI Request Timeout')), 15000)
        );

        const geminiPromise = ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: rawBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
          },
        });

        const geminiResponse: any = await Promise.race([geminiPromise, timeoutPromise]);
        const textOutput = geminiResponse.text?.trim() || '{}';
        const cleaned = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        const validCategories = db.getCategories().map((c) => c.id as string);
        if (!validCategories.includes(parsed.categoryId)) {
          parsed.categoryId = currentCategory || 'vat-pham-an-lanh';
        }
        const price = Math.round(Number(parsed.suggestedPrice));
        parsed.suggestedPrice = Number.isFinite(price) && price > 0 ? price : undefined;

        return res.json({
          success: true,
          suggestion: parsed,
          source: 'gemini',
        });
      } catch (aiErr) {
        console.warn('Gemini call error or timeout, falling back to smart zen preset:', aiErr);
      }
    }

    const fallbackCat = currentCategory || 'vat-pham-an-lanh';
    const fallback = {
      name: currentName || (fallbackCat === 'huong-tram-tinh-tai' ? 'Nụ Trầm Hương Rừng Tự Nhiên Tiên Phước' : fallbackCat === 'duyen-lanh-ben-minh' ? 'Mặt Dây Chuyền Bạch Ngọc Tinh Khôi' : 'Vật Phẩm Đá Tự Nhiên Tĩnh Tâm'),
      categoryId: fallbackCat,
      material: fallbackCat === 'huong-tram-tinh-tai' ? '100% bột trầm hương tự nhiên không tẩm ướp' : 'Đá tự nhiên tuyển chọn nguyên khối',
      dimensions: 'Kích thước chuẩn hài hòa',
      color: 'Sắc thái mộc ấm nguyên bản',
      origin: fallbackCat === 'huong-tram-tinh-tai' ? 'Tiên Phước, Quảng Nam' : 'Việt Nam',
      meaning: 'Theo quan niệm phương Đông, vật phẩm mang năng lượng thanh khiết, giúp tâm trí định tĩnh và an trú trong hiện tại.',
      description: 'Từng đường nét được giữ trọn vẻ đẹp tự nhiên mộc mạc. Mang đến sự an lành cho không gian sống và tâm hồn.',
      usageInstructions: 'Đặt nơi thanh tịnh, thoáng khí hoặc đeo bên mình.',
      careInstructions: 'Lau nhẹ bằng khăn vải mềm ẩm, tránh hóa chất tẩy rửa mạnh.',
      suggestedPrice: fallbackCat === 'huong-tram-tinh-tai' ? 290000 : 480000,
    };

    return res.json({
      success: true,
      suggestion: fallback,
      source: 'preset',
    });
  } catch (err: any) {
    console.error('AI Suggest error:', err);
    res.status(500).json({ success: false, error: 'Không thể tạo gợi ý AI' });
  }
});

// Admin Settings
app.get('/api/admin/settings', verifyAdmin, (req, res) => {
  res.json({ success: true, settings: db.getSettings() });
});

app.put('/api/admin/settings', verifyAdmin, (req, res) => {
  try {
    if (
      process.env.ADMIN_PIN?.trim() &&
      req.body?.adminPin !== undefined &&
      req.body.adminPin !== db.getSettings().adminPin
    ) {
      return res.status(400).json({
        success: false,
        error: 'Mã PIN đang được đặt bằng biến môi trường ADMIN_PIN trên máy chủ, hãy đổi ở đó.',
      });
    }
    const updated = db.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Lỗi cập nhật cài đặt' });
  }
});

// Admin Articles CRUD
app.post('/api/admin/articles', verifyAdmin, (req, res) => {
  const article = db.createArticle(req.body);
  res.status(201).json({ success: true, article });
});

// --- FRONTEND INTEGRATION (Dev / Prod) ---
// Unknown API routes return JSON 404 instead of the SPA's index.html
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'Không tìm thấy API' });
});

// Last-resort JSON error handler (bad JSON body, oversized payload, failed disk write...)
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('Unhandled error:', err);
  const message =
    err.type === 'entity.too.large' ? 'Dữ liệu gửi lên quá lớn' : status < 500 ? 'Yêu cầu không hợp lệ' : err.message || 'Lỗi máy chủ';
  res.status(status).json({ success: false, error: message });
});

async function startServer() {
  if (getAdminPin() === '123456') {
    console.warn('[CẢNH BÁO] Mã PIN quản trị đang là 123456 (mặc định). Hãy đổi trong Admin > Cài đặt hoặc đặt biến ADMIN_PIN.');
  }

  if (isProduction) {
    const distDir = path.resolve(__dirname, 'dist');
    if (!fs.existsSync(path.join(distDir, 'index.html'))) {
      throw new Error('Chưa có thư mục dist. Hãy chạy "npm run build" trước khi "npm start".');
    }
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[TIỆM NHỎ AN YÊN] Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
