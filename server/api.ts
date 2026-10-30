// Framework-agnostic HTTP API shared by the Node/Express server and the Cloudflare Worker
import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { Database, StoreData, isOrderStatus, isPaymentStatus } from './db';
import { normalizeSearchText, normalizePhone } from '../src/utils/format';

export interface ApiRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  body: any;
  header: (name: string) => string | undefined;
  ip: string;
}

export interface ApiResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

export interface ImageStore {
  put(name: string, mimeType: string, bytes: Uint8Array): void | Promise<void>;
}

export interface ApiConfig {
  geminiApiKey?: string;
  geminiModel?: string;
  // If set, this PIN always wins over the one saved in settings (lets the owner recover access)
  adminPinOverride?: string;
  maxUploadBytes: number;
}

export const ALLOWED_IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const ok = (body: Record<string, unknown>, status = 200): ApiResponse => ({ status, body: { success: true, ...body } });
const fail = (status: number, error: string, headers?: Record<string, string>): ApiResponse => ({
  status,
  body: { success: false, error },
  headers,
});

// Fixed-window in-memory rate limiter. Fine for one process / one Durable Object.
class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();
  constructor(private max: number, private windowMs: number, private message: string) {}

  // Returns an error response when the caller is over the limit, otherwise null
  hit(ip: string): ApiResponse | null {
    const now = Date.now();
    if (this.hits.size > 10_000) {
      for (const [key, v] of this.hits) if (v.resetAt <= now) this.hits.delete(key);
    }
    const entry = this.hits.get(ip);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(ip, { count: 1, resetAt: now + this.windowMs });
      return null;
    }
    if (++entry.count > this.max) {
      return fail(429, this.message, { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) });
    }
    return null;
  }
}

type Handler = (req: ApiRequest, params: Record<string, string>) => ApiResponse | Promise<ApiResponse>;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  admin: boolean;
  handler: Handler;
}

export function createApi(db: Database, images: ImageStore, config: ApiConfig) {
  const loginLimiter = new RateLimiter(10, 15 * 60_000, 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.');
  const lookupLimiter = new RateLimiter(30, 15 * 60_000, 'Bạn tra cứu quá nhiều lần. Vui lòng thử lại sau ít phút.');
  const orderLimiter = new RateLimiter(10, 10 * 60_000, 'Bạn đặt hàng quá nhiều lần liên tiếp. Vui lòng thử lại sau ít phút.');
  const aiLimiter = new RateLimiter(30, 60 * 60_000, 'Đã dùng AI gợi ý quá nhiều trong 1 giờ, vui lòng thử lại sau.');

  const geminiKey = config.geminiApiKey?.trim();
  const hasValidGeminiKey = Boolean(geminiKey) && geminiKey !== 'MY_GEMINI_API_KEY' && geminiKey!.length > 15;
  const ai = hasValidGeminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;
  const geminiModel = config.geminiModel?.trim() || 'gemini-3.8-flash';

  const getAdminPin = () => config.adminPinOverride?.trim() || db.getSettings().adminPin;

  const isValidAdminPin = (pin: unknown): boolean => {
    if (typeof pin !== 'string' || !pin) return false;
    const expected = Buffer.from(getAdminPin());
    const given = Buffer.from(pin);
    return expected.length === given.length && crypto.timingSafeEqual(expected, given);
  };

  const customerSafe = (order: NonNullable<ReturnType<Database['getOrderById']>>) => {
    const { internalNote, ...rest } = order;
    return rest;
  };

  const routes: Route[] = [];
  const add = (method: string, path: string, handler: Handler, admin = false) => {
    const keys: string[] = [];
    const pattern = new RegExp(
      '^' + path.replace(/:(\w+)/g, (_, key) => (keys.push(key), '([^/]+)')) + '/?$'
    );
    routes.push({ method, pattern, keys, admin, handler });
  };

  // --- PUBLIC APIS ---

  add('GET', '/api/products', (req) => {
    const category = req.query.get('category');
    const search = req.query.get('search');
    let products = db.getProducts().filter((p) => p.isActive);

    if (category && category !== 'all') products = products.filter((p) => p.categoryId === category);
    if (req.query.get('featured') === 'true') products = products.filter((p) => p.isFeatured);
    if (req.query.get('newArrival') === 'true') products = products.filter((p) => p.isNewArrival);
    if (search) {
      const q = normalizeSearchText(search);
      products = products.filter((p) =>
        [p.name, p.sku, p.material, p.meaning].some((field) => normalizeSearchText(field).includes(q))
      );
    }
    return ok({ products });
  });

  add('GET', '/api/products/:id', (_req, { id }) => {
    const product = db.getProductById(id);
    if (!product || !product.isActive) return fail(404, 'Không tìm thấy sản phẩm.');
    return ok({ product });
  });

  add('GET', '/api/categories', () => ok({ categories: db.getCategories() }));

  // Public store settings (never expose the admin PIN)
  add('GET', '/api/settings/public', () => {
    const { adminPin, ...settings } = db.getSettings();
    return ok({ settings });
  });

  add('GET', '/api/articles', () => ok({ articles: db.getArticles() }));

  add('GET', '/api/articles/:id', (_req, { id }) => {
    const article = db.getArticles().find((a) => a.id === id || a.slug === id);
    if (!article) return fail(404, 'Không tìm thấy bài viết.');
    return ok({ article });
  });

  // Order lookup requires BOTH phone and order ID to prevent enumeration
  add('POST', '/api/orders/lookup', (req) => {
    const limited = lookupLimiter.hit(req.ip);
    if (limited) return limited;
    const { phone, orderId } = req.body || {};
    if (typeof phone !== 'string' || typeof orderId !== 'string' || !phone.trim() || !orderId.trim()) {
      return fail(400, 'Vui lòng cung cấp cả Mã đơn hàng và Số điện thoại đã đặt hàng.');
    }
    const order = db.findOrderByPhoneAndCode(phone, orderId);
    if (!order) return fail(404, 'Không tìm thấy đơn hàng khớp với Mã đơn và Số điện thoại đã cung cấp.');
    return ok({ order: customerSafe(order) });
  });

  // Guest checkout; prices, fees and stock are all computed server-side
  add('POST', '/api/orders', (req) => {
    const limited = orderLimiter.hit(req.ip);
    if (limited) return limited;
    const result = db.createOrder(req.body || {});
    return result.success ? { status: 201, body: result } : { status: 400, body: result };
  });

  // Customer can cancel only while the order is still pending_confirm
  add('POST', '/api/orders/:id/cancel-request', (req, { id }) => {
    const limited = lookupLimiter.hit(req.ip);
    if (limited) return limited;
    const phone = req.body?.phone;
    const order = db.getOrderById(id);
    if (!order || typeof phone !== 'string' || normalizePhone(order.customerPhone) !== normalizePhone(phone)) {
      return fail(403, 'Thông tin xác minh không hợp lệ.');
    }
    if (order.status !== 'pending_confirm') {
      return fail(400, 'Đơn hàng đã được tiệm xử lý, không thể tự hủy. Vui lòng liên hệ hotline tiệm để được hỗ trợ.');
    }
    const updated = db.updateOrderStatus(order.id, 'cancelled', 'Khách hàng tự hủy đơn trước khi tiệm xác nhận');
    return ok({ order: customerSafe(updated!) });
  });

  // --- ADMIN APIS (PIN in x-admin-pin header) ---

  add('POST', '/api/admin/login', (req) => {
    if (isValidAdminPin(req.body?.pin)) return ok({ message: 'Đăng nhập thành công' });
    return loginLimiter.hit(req.ip) || fail(401, 'Mã PIN không đúng.');
  });

  add('GET', '/api/admin/stats', () => ok({ stats: db.getDashboardStats() }), true);
  add('GET', '/api/admin/orders', () => ok({ orders: db.getOrders() }), true);

  add(
    'PUT',
    '/api/admin/orders/:id/status',
    (req, { id }) => {
      const { status, note, shippingCarrier, trackingCode } = req.body || {};
      if (!isOrderStatus(status)) return fail(400, 'Trạng thái đơn hàng không hợp lệ');
      const updated = db.updateOrderStatus(id, status, note, { carrier: shippingCarrier, trackingCode });
      return updated ? ok({ order: updated }) : fail(404, 'Không tìm thấy đơn hàng');
    },
    true
  );

  add(
    'PUT',
    '/api/admin/orders/:id/payment',
    (req, { id }) => {
      const { paymentStatus, note } = req.body || {};
      if (!isPaymentStatus(paymentStatus)) return fail(400, 'Trạng thái thanh toán không hợp lệ');
      const updated = db.updateOrderPayment(id, paymentStatus, note);
      return updated ? ok({ order: updated }) : fail(404, 'Không tìm thấy đơn hàng');
    },
    true
  );

  add(
    'PUT',
    '/api/admin/orders/:id/note',
    (req, { id }) => {
      const updated = db.updateInternalNote(id, String(req.body?.internalNote ?? ''));
      return updated ? ok({ order: updated }) : fail(404, 'Không tìm thấy đơn hàng');
    },
    true
  );

  add('GET', '/api/admin/products', () => ok({ products: db.getProducts() }), true);

  add(
    'POST',
    '/api/admin/products',
    (req) => {
      try {
        return ok({ product: db.createProduct(req.body || {}) }, 201);
      } catch (err: any) {
        return fail(400, err.message || 'Lỗi thêm sản phẩm');
      }
    },
    true
  );

  add(
    'PUT',
    '/api/admin/products/:id',
    (req, { id }) => {
      try {
        const updated = db.updateProduct(id, req.body || {});
        return updated ? ok({ product: updated }) : fail(404, 'Không tìm thấy sản phẩm');
      } catch (err: any) {
        return fail(400, err.message || 'Lỗi cập nhật sản phẩm');
      }
    },
    true
  );

  add(
    'DELETE',
    '/api/admin/products/:id',
    (_req, { id }) => (db.deleteProduct(id) ? ok({ message: 'Đã xóa sản phẩm' }) : fail(404, 'Không tìm thấy sản phẩm')),
    true
  );

  add(
    'POST',
    '/api/admin/products/:id/duplicate',
    (_req, { id }) => {
      const duplicated = db.duplicateProduct(id);
      return duplicated ? ok({ product: duplicated }, 201) : fail(404, 'Không tìm thấy sản phẩm để nhân bản');
    },
    true
  );

  add(
    'PUT',
    '/api/admin/products/:id/toggle-status',
    (_req, { id }) => {
      const updated = db.toggleProductStatus(id);
      return updated ? ok({ product: updated }) : fail(404, 'Không tìm thấy sản phẩm');
    },
    true
  );

  add(
    'POST',
    '/api/admin/upload-image',
    async (req) => {
      const { imageBase64, fileName } = req.body || {};
      const matches = typeof imageBase64 === 'string' ? imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/) : null;
      const ext = matches ? ALLOWED_IMAGE_TYPES[matches[1].toLowerCase()] : undefined;
      if (!matches || !ext) return fail(400, 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP');

      const bytes = Buffer.from(matches[2], 'base64');
      if (bytes.length === 0 || bytes.length > config.maxUploadBytes) {
        return fail(400, `Ảnh rỗng hoặc lớn hơn ${Math.floor(config.maxUploadBytes / 1024 / 1024)}MB`);
      }

      const uniqueName = `ay-prod-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
      await images.put(uniqueName, matches[1].toLowerCase(), bytes);
      return ok({ url: `/uploads/${uniqueName}`, fileName: fileName || uniqueName });
    },
    true
  );

  // AI product suggestion from a photo (Gemini, with a preset fallback when unavailable)
  add(
    'POST',
    '/api/admin/ai-suggest-product',
    async (req) => {
      const limited = aiLimiter.hit(req.ip);
      if (limited) return limited;
      const { imageBase64, currentCategory, currentName } = req.body || {};
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return fail(400, 'Vui lòng chọn hoặc chụp ảnh sản phẩm trước');
      }

      let mimeType = 'image/jpeg';
      let rawBase64 = imageBase64;
      const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        rawBase64 = matches[2];
      }

      if (ai) {
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
            model: geminiModel,
            contents: { parts: [{ inlineData: { mimeType, data: rawBase64 } }, { text: prompt }] },
            config: { responseMimeType: 'application/json' },
          });

          const geminiResponse: any = await Promise.race([geminiPromise, timeoutPromise]);
          const textOutput = geminiResponse.text?.trim() || '{}';
          const parsed = JSON.parse(textOutput.replace(/```json/g, '').replace(/```/g, '').trim());

          const validCategories = db.getCategories().map((c) => c.id as string);
          if (!validCategories.includes(parsed.categoryId)) {
            parsed.categoryId = currentCategory || 'vat-pham-an-lanh';
          }
          const price = Math.round(Number(parsed.suggestedPrice));
          parsed.suggestedPrice = Number.isFinite(price) && price > 0 ? price : undefined;

          return ok({ suggestion: parsed, source: 'gemini' });
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

      return ok({ suggestion: fallback, source: 'preset' });
    },
    true
  );

  add('GET', '/api/admin/settings', () => ok({ settings: db.getSettings() }), true);

  add(
    'PUT',
    '/api/admin/settings',
    (req) => {
      const body = req.body || {};
      if (config.adminPinOverride?.trim() && body.adminPin !== undefined && body.adminPin !== db.getSettings().adminPin) {
        return fail(400, 'Mã PIN đang được đặt bằng biến môi trường ADMIN_PIN trên máy chủ, hãy đổi ở đó.');
      }
      try {
        return ok({ settings: db.updateSettings(body) });
      } catch (err: any) {
        return fail(400, err.message || 'Lỗi cập nhật cài đặt');
      }
    },
    true
  );

  add('POST', '/api/admin/articles', (req) => ok({ article: db.createArticle(req.body || {}) }, 201), true);

  // Full backup (products, orders, settings...). Uploaded image files are not included.
  add(
    'GET',
    '/api/admin/export',
    () => ({
      status: 200,
      body: db.exportData(),
      headers: {
        'Content-Disposition': `attachment; filename="tiem-nho-an-yen-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    }),
    true
  );

  // Restore a backup: replaces ALL data. Optional images: [{ name, base64 }]
  add(
    'POST',
    '/api/admin/import',
    async (req) => {
      const { data, images: imageList, confirm } = req.body || {};
      if (confirm !== 'REPLACE_ALL_DATA') {
        return fail(400, 'Thiếu xác nhận ghi đè toàn bộ dữ liệu.');
      }
      try {
        for (const img of Array.isArray(imageList) ? imageList : []) {
          const ext = String(img?.name || '').split('.').pop()?.toLowerCase();
          const mime = Object.keys(ALLOWED_IMAGE_TYPES).find((m) => ALLOWED_IMAGE_TYPES[m] === (ext === 'jpeg' ? 'jpg' : ext));
          if (!mime || !/^[\w.-]+$/.test(img.name)) continue;
          const bytes = Buffer.from(String(img.base64 || ''), 'base64');
          if (bytes.length > 0 && bytes.length <= config.maxUploadBytes) await images.put(img.name, mime, bytes);
        }
        db.importData(data as StoreData);
        return ok({ products: db.getProducts().length, orders: db.getOrders().length });
      } catch (err: any) {
        return fail(400, err.message || 'Không thể khôi phục dữ liệu');
      }
    },
    true
  );

  return async function handle(req: ApiRequest): Promise<ApiResponse> {
    try {
      const candidates = routes.filter((r) => r.pattern.test(req.path));
      if (candidates.length === 0) return fail(404, 'Không tìm thấy API');
      const route = candidates.find((r) => r.method === req.method);
      if (!route) return fail(405, 'Phương thức không được hỗ trợ');

      // Wrong PINs count toward the login limiter, so the header can't be brute-forced either
      if (route.admin && !isValidAdminPin(req.header('x-admin-pin'))) {
        return loginLimiter.hit(req.ip) || fail(401, 'Mã PIN quản trị không chính xác.');
      }

      const match = route.pattern.exec(req.path)!;
      const params: Record<string, string> = {};
      route.keys.forEach((key, i) => (params[key] = decodeURIComponent(match[i + 1])));
      return await route.handler(req, params);
    } catch (err: any) {
      console.error('API error:', err);
      return fail(500, err?.message || 'Lỗi máy chủ');
    }
  };
}

export type ApiHandler = ReturnType<typeof createApi>;
