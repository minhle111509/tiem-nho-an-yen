import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { Product, StoreSettings, Article, Category, Order, OrderStatus, PaymentStatus, BankingHistoryLog } from '../src/types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_ARTICLES } from './initialData';
import { normalizePhone, isValidVietnamesePhone } from '../src/utils/format';

const ORDER_STATUSES: OrderStatus[] = ['pending_confirm', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled', 'returned'];
const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'paid', 'refunded'];
const MAX_QTY_PER_LINE = 99;
const MAX_LINES_PER_ORDER = 50;

export const isOrderStatus = (v: unknown): v is OrderStatus => ORDER_STATUSES.includes(v as OrderStatus);
export const isPaymentStatus = (v: unknown): v is PaymentStatus => PAYMENT_STATUSES.includes(v as PaymentStatus);

// Trim and cap free-text input from customers
const cleanText = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

interface StoreData {
  categories: Category[];
  products: Product[];
  settings: StoreSettings;
  articles: Article[];
  orders: Order[];
}

// DATA_DIR lets hosting mount a persistent disk (and tests use a temp folder)
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// Initialize sample order for immediate testing
const INITIAL_ORDERS: Order[] = [
  {
    id: 'AY-9104',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    customerName: 'Nguyễn Thanh Trúc',
    customerPhone: '0988776655',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    address: '128 Nguyễn Thị Minh Khai, Phường Bến Thành',
    note: 'Giao giờ hành chính giúp em, em cảm ơn tiệm.',
    items: [
      {
        productId: 'prod-003',
        sku: 'AY-TRAM-NU-QUANGNAM-03',
        productName: 'Nụ Trầm Hương Rừng Tự Nhiên Tiên Phước Xông Nhà (Hộp 45 Nụ)',
        price: 290000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=80',
        variationName: 'Hộp 45 nụ chuẩn mộc',
      },
      {
        productId: 'prod-006',
        sku: 'AY-LU-DONG-THIEN-06',
        productName: 'Lư Đốt Trầm Hương Đồng Thau Cổ Điển Điêu Khắc Hoa Văn Sen Mộc',
        price: 380000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=900&q=80',
      },
    ],
    subtotal: 670000,
    shippingFee: 0, // > 500k free shipping
    discount: 0,
    giftWrapFee: 35000,
    totalAmount: 705000,
    giftWrap: {
      enabled: true,
      senderName: 'Trúc',
      receiverName: 'Chị Mai',
      message: 'Chúc chị luôn an yên, tĩnh tại và vạn sự hanh thông!',
    },
    paymentMethod: 'BANK_TRANSFER',
    paymentStatus: 'paid',
    status: 'preparing',
    shippingCarrier: 'GHTK (Giao Hàng Tiết Kiệm)',
    trackingCode: 'BK778899VN',
    internalNote: 'Đã xác nhận thanh toán qua VietQR. Khách nhờ gói thiệp nơ hoa sen cẩn thận.',
    history: [
      {
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        action: 'Đặt đơn hàng mới',
        note: 'Khách hàng đặt đơn qua ứng dụng web',
      },
      {
        timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(),
        action: 'Xác nhận thanh toán',
        note: 'Chủ tiệm xác nhận nhận đủ 705.000₫ qua VietQR MB Bank',
      },
      {
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        action: 'Chuyển trạng thái: Đang chuẩn bị hàng',
        note: 'Đang gói quà thiệp An Yên',
      },
    ],
  },
];

class Database {
  private data: StoreData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): StoreData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error loading data file, falling back to initial data:', err);
    }

    // Fresh install: seed demo catalog; the sample order is only added outside production
    const defaultData: StoreData = {
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      settings: { ...INITIAL_SETTINGS, adminPin: process.env.ADMIN_PIN?.trim() || INITIAL_SETTINGS.adminPin },
      articles: INITIAL_ARTICLES,
      orders: process.env.NODE_ENV === 'production' ? [] : INITIAL_ORDERS,
    };
    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(dataToSave: StoreData = this.data) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      // Write to a temp file then rename, so a crash mid-write never leaves a truncated store.json
      const tmpFile = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DATA_FILE);
    } catch (err) {
      console.error('Failed to save data to file:', err);
      throw new Error('Không thể lưu dữ liệu, vui lòng thử lại.');
    }
  }

  // --- PRODUCTS ---
  getProducts(): Product[] {
    return this.data.products;
  }

  getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  private generateId(prefix: string, exists: (id: string) => boolean): string {
    let id: string;
    do {
      id = `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
    } while (exists(id));
    return id;
  }

  private newProductId(): string {
    return this.generateId('prod', (id) => Boolean(this.getProductById(id)));
  }

  createProduct(product: Omit<Product, 'id'>): Product {
    if (!product?.name?.trim()) throw new Error('Vui lòng nhập tên sản phẩm.');
    if (!Number.isInteger(product.price) || product.price < 0) throw new Error('Giá bán phải là số nguyên không âm.');
    const newId = this.newProductId();
    const newProduct: Product = {
      ...product,
      id: newId,
      stock: Math.max(0, Math.floor(Number(product.stock) || 0)),
      sku: product.sku || `AY-${Date.now().toString().slice(-4)}`,
      isActive: product.isActive !== undefined ? product.isActive : true,
      soldCount: 0,
      rating: 5.0,
    };
    this.data.products.unshift(newProduct);
    this.saveData();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const index = this.data.products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const { id: _ignoredId, ...safeUpdates } = updates;
    if (safeUpdates.price !== undefined && (!Number.isInteger(safeUpdates.price) || safeUpdates.price < 0)) {
      throw new Error('Giá bán phải là số nguyên không âm.');
    }
    if (safeUpdates.stock !== undefined) safeUpdates.stock = Math.max(0, Math.floor(Number(safeUpdates.stock) || 0));
    this.data.products[index] = { ...this.data.products[index], ...safeUpdates };
    this.saveData();
    return this.data.products[index];
  }

  deleteProduct(id: string): boolean {
    const prevLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.products.length !== prevLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  duplicateProduct(id: string): Product | null {
    const original = this.getProductById(id);
    if (!original) return null;

    const newId = this.newProductId();
    const newSku = `AY-SAO-${Date.now().toString().slice(-4)}`;
    const duplicated: Product = {
      ...original,
      id: newId,
      sku: newSku,
      name: `${original.name} (Bản sao)`,
      isActive: false, // Save as draft initially so store owner can adjust before publishing
      soldCount: 0,
      stock: original.stock > 0 ? original.stock : 10,
    };
    this.data.products.unshift(duplicated);
    this.saveData();
    return duplicated;
  }

  toggleProductStatus(id: string): Product | null {
    const product = this.getProductById(id);
    if (!product) return null;
    product.isActive = !product.isActive;
    this.saveData();
    return product;
  }

  // --- CATEGORIES ---
  getCategories(): Category[] {
    return this.data.categories;
  }

  // --- SETTINGS ---
  getSettings(): StoreSettings {
    return this.data.settings;
  }

  updateSettings(rawUpdates: Partial<StoreSettings>): StoreSettings {
    // bankingHistory is server-managed; never accept it from the client
    const { bankingHistory: _ignored, ...updates } = rawUpdates;
    if (updates.adminPin !== undefined) {
      updates.adminPin = String(updates.adminPin).trim();
      if (!/^\d{6}$/.test(updates.adminPin)) throw new Error('Mã PIN quản trị phải gồm đúng 6 chữ số.');
    }
    for (const key of ['shippingFlatFee', 'freeShippingThreshold', 'giftWrapFee'] as const) {
      if (updates[key] !== undefined) {
        const n = Number(updates[key]);
        if (!Number.isInteger(n) || n < 0) throw new Error('Phí vận chuyển / gói quà phải là số nguyên không âm.');
        updates[key] = n;
      }
    }
    const oldSettings = this.data.settings;
    const isBankingChanged =
      (updates.bankName !== undefined && updates.bankName !== oldSettings.bankName) ||
      (updates.bankCode !== undefined && updates.bankCode !== oldSettings.bankCode) ||
      (updates.accountNumber !== undefined && updates.accountNumber !== oldSettings.accountNumber) ||
      (updates.accountHolder !== undefined && updates.accountHolder !== oldSettings.accountHolder) ||
      (updates.customQrImage !== undefined && updates.customQrImage !== oldSettings.customQrImage) ||
      (updates.useDynamicVietQr !== undefined && updates.useDynamicVietQr !== oldSettings.useDynamicVietQr);

    if (isBankingChanged) {
      const historyLog: BankingHistoryLog = {
        id: `bh-${Date.now()}`,
        timestamp: new Date().toISOString(),
        bankName: updates.bankName || oldSettings.bankName,
        bankCode: updates.bankCode || oldSettings.bankCode,
        accountNumber: updates.accountNumber !== undefined ? updates.accountNumber : oldSettings.accountNumber,
        accountHolder: updates.accountHolder || oldSettings.accountHolder,
        customQrImage: updates.customQrImage !== undefined ? updates.customQrImage : oldSettings.customQrImage,
        useDynamicVietQr: updates.useDynamicVietQr !== undefined ? updates.useDynamicVietQr : (oldSettings.useDynamicVietQr !== false),
        note: 'Chủ tiệm cập nhật tài khoản ngân hàng / mã QR nhận tiền',
      };
      this.data.settings.bankingHistory = [historyLog, ...(this.data.settings.bankingHistory || [])].slice(0, 50);
    }

    this.data.settings = { ...this.data.settings, ...updates };
    this.saveData();
    return this.data.settings;
  }

  // --- ARTICLES ---
  getArticles(): Article[] {
    return this.data.articles;
  }

  createArticle(article: Omit<Article, 'id'>): Article {
    const newArticle: Article = {
      ...article,
      id: `art-${Date.now().toString().slice(-5)}`,
      publishedAt: new Date().toISOString().split('T')[0],
    };
    this.data.articles.unshift(newArticle);
    this.saveData();
    return newArticle;
  }

  // --- ORDERS & TRANSACTION INTEGRITY ---
  getOrders(): Order[] {
    return this.data.orders;
  }

  getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id);
  }

  findOrderByPhoneAndCode(phone: string, orderId: string): Order | null {
    const cleanPhone = normalizePhone(phone);
    const cleanOrderId = orderId.trim().toUpperCase();

    const order = this.data.orders.find((o) => {
      const matchId = o.id.toUpperCase() === cleanOrderId;
      const matchPhone = normalizePhone(o.customerPhone) === cleanPhone;
      return matchId && matchPhone;
    });

    return order || null;
  }

  private generateOrderId(): string {
    // Unambiguous charset (no 0/O/1/I) so customers can read the code over the phone
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const vnDate = new Date(Date.now() + 7 * 3600_000).toISOString().slice(2, 10).replace(/-/g, '');
    let id: string;
    do {
      let suffix = '';
      for (let i = 0; i < 4; i++) suffix += chars[crypto.randomInt(chars.length)];
      id = `AY-${vnDate}-${suffix}`;
    } while (this.getOrderById(id));
    return id;
  }

  createOrder(orderPayload: {
    customerName: string;
    customerPhone: string;
    province: string;
    district: string;
    address: string;
    note?: string;
    items: { productId: string; quantity: number; variationId?: string }[];
    paymentMethod: 'COD' | 'BANK_TRANSFER';
    giftWrap?: { enabled: boolean; senderName?: string; receiverName?: string; message?: string };
  }): { success: boolean; order?: Order; error?: string } {
    // 1. Validate inputs (never trust the client payload)
    const customerName = cleanText(orderPayload?.customerName, 100);
    const customerPhone = normalizePhone(cleanText(orderPayload?.customerPhone, 20));
    const province = cleanText(orderPayload?.province, 100);
    const district = cleanText(orderPayload?.district, 100);
    const address = cleanText(orderPayload?.address, 300);
    const note = cleanText(orderPayload?.note, 1000);
    const paymentMethod = orderPayload?.paymentMethod;

    if (!customerName || !customerPhone) {
      return { success: false, error: 'Vui lòng cung cấp đầy đủ họ tên và số điện thoại.' };
    }
    if (!isValidVietnamesePhone(customerPhone)) {
      return { success: false, error: 'Số điện thoại không hợp lệ (cần 10 số, ví dụ 0909123456).' };
    }
    if (!province || !address) {
      return { success: false, error: 'Vui lòng nhập đầy đủ địa chỉ giao hàng.' };
    }
    if (paymentMethod !== 'COD' && paymentMethod !== 'BANK_TRANSFER') {
      return { success: false, error: 'Phương thức thanh toán không hợp lệ.' };
    }
    // Never fall back to a placeholder account: customers would transfer money to a stranger
    if (paymentMethod === 'BANK_TRANSFER' && !this.data.settings.accountNumber?.trim()) {
      return { success: false, error: 'Tiệm chưa mở nhận chuyển khoản, vui lòng chọn thanh toán khi nhận hàng (COD).' };
    }

    if (!Array.isArray(orderPayload.items) || orderPayload.items.length === 0) {
      return { success: false, error: 'Giỏ hàng của bạn đang trống.' };
    }
    if (orderPayload.items.length > MAX_LINES_PER_ORDER) {
      return { success: false, error: 'Đơn hàng có quá nhiều sản phẩm, vui lòng tách đơn.' };
    }

    // 2. Server-side price & stock verification
    const orderItems: Order['items'] = [];
    const qtyByProduct = new Map<string, number>(); // variations share one stock pool
    let subtotal = 0;

    for (const item of orderPayload.items) {
      const quantity = Number(item?.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_LINE) {
        return { success: false, error: `Số lượng sản phẩm không hợp lệ (từ 1 đến ${MAX_QTY_PER_LINE}).` };
      }

      const product = this.getProductById(String(item.productId));
      if (!product || !product.isActive) {
        return { success: false, error: `Sản phẩm ${product?.name || ''} hiện không khả dụng, vui lòng xóa khỏi giỏ hàng.` };
      }

      const totalQty = (qtyByProduct.get(product.id) || 0) + quantity;
      if (product.stock < totalQty) {
        return {
          success: false,
          error: `Sản phẩm "${product.name}" chỉ còn ${product.stock} món trong kho. Vui lòng giảm số lượng.`,
        };
      }
      qtyByProduct.set(product.id, totalQty);

      let itemPrice = product.price;
      let variationName = undefined;

      if (item.variationId) {
        const variation = product.variations?.find((v) => v.id === item.variationId);
        if (!variation) {
          return { success: false, error: `Phân loại của "${product.name}" không còn tồn tại, vui lòng chọn lại.` };
        }
        variationName = variation.name;
        if (variation.priceModifier) {
          itemPrice += variation.priceModifier;
        }
      }

      orderItems.push({
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        price: itemPrice,
        quantity,
        image: product.images[0] || '',
        variationName,
      });

      subtotal += itemPrice * quantity;
    }

    const giftWrap = orderPayload.giftWrap?.enabled
      ? {
          enabled: true,
          senderName: cleanText(orderPayload.giftWrap.senderName, 100),
          receiverName: cleanText(orderPayload.giftWrap.receiverName, 100),
          message: cleanText(orderPayload.giftWrap.message, 500),
        }
      : undefined;

    // 3. Server-side calculation of shipping & gift wrap
    const settings = this.getSettings();
    const shippingFee = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFlatFee;
    const giftWrapFee = giftWrap ? settings.giftWrapFee : 0;
    const totalAmount = subtotal + shippingFee + giftWrapFee;

    // 4. Decrement inventory (single-threaded JS: no await between check and decrement)
    for (const [productId, qty] of qtyByProduct) {
      const product = this.getProductById(productId)!;
      product.stock -= qty;
      product.soldCount = (product.soldCount || 0) + qty;
    }

    // 5. Unique, hard-to-guess order ID e.g. AY-261030-K7Q2
    const newOrderId = this.generateOrderId();

    const bankSnapshot = {
      bankName: settings.bankName || 'Ngân hàng Quân Đội (MB Bank)',
      bankCode: settings.bankCode || 'MB',
      accountNumber: settings.accountNumber,
      accountHolder: settings.accountHolder || 'TIEM NHO AN YEN',
      customQrImage: settings.customQrImage,
      useDynamicVietQr: settings.useDynamicVietQr !== false,
    };

    const newOrder: Order = {
      id: newOrderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerName,
      customerPhone,
      province,
      district,
      address,
      note,
      items: orderItems,
      subtotal,
      shippingFee,
      discount: 0,
      giftWrapFee,
      totalAmount,
      giftWrap,
      paymentMethod,
      paymentStatus: 'unpaid',
      status: 'pending_confirm',
      bankSnapshot,
      history: [
        {
          timestamp: new Date().toISOString(),
          action: 'Đặt hàng thành công',
          note: `Khách hàng tạo đơn (${paymentMethod === 'COD' ? 'Thanh toán COD' : 'Chuyển khoản VietQR'})`,
        },
      ],
    };

    this.data.orders.unshift(newOrder);
    this.saveData();

    return { success: true, order: newOrder };
  }

  updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    shippingInfo?: { carrier?: string; trackingCode?: string }
  ): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    const oldStatus = order.status;

    // Handle automated restock if cancelled
    if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
      for (const item of order.items) {
        const prod = this.getProductById(item.productId);
        if (prod) {
          prod.stock += item.quantity;
          prod.soldCount = Math.max(0, (prod.soldCount || 0) - item.quantity);
        }
      }
    } else if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
      // Re-deduct if uncancelled
      for (const item of order.items) {
        const prod = this.getProductById(item.productId);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - item.quantity);
          prod.soldCount = (prod.soldCount || 0) + item.quantity;
        }
      }
    }

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();

    if (shippingInfo?.carrier) order.shippingCarrier = shippingInfo.carrier;
    if (shippingInfo?.trackingCode) {
      order.trackingCode = shippingInfo.trackingCode;
      order.shippedDate = new Date().toISOString();
    }

    const actionText =
      newStatus === 'confirmed'
        ? 'Xác nhận đơn hàng'
        : newStatus === 'preparing'
        ? 'Đang chuẩn bị gói hàng'
        : newStatus === 'shipping'
        ? 'Bàn giao đơn vị vận chuyển'
        : newStatus === 'delivered'
        ? 'Giao hàng thành công'
        : newStatus === 'cancelled'
        ? 'Đã hủy đơn hàng (Đã hoàn lại kho hàng)'
        : newStatus === 'returned'
        ? 'Khách hoàn trả hàng'
        : `Chuyển trạng thái sang: ${newStatus}`;

    order.history.unshift({
      timestamp: new Date().toISOString(),
      action: actionText,
      note: note || undefined,
    });

    this.saveData();
    return order;
  }

  updateOrderPayment(orderId: string, paymentStatus: PaymentStatus, note?: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    order.paymentStatus = paymentStatus;
    order.updatedAt = new Date().toISOString();

    order.history.unshift({
      timestamp: new Date().toISOString(),
      action:
        paymentStatus === 'paid'
          ? 'Xác nhận đã thanh toán'
          : paymentStatus === 'refunded'
          ? 'Đã hoàn tiền'
          : 'Cập nhật chưa thanh toán',
      note,
    });

    this.saveData();
    return order;
  }

  updateInternalNote(orderId: string, internalNote: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    order.internalNote = internalNote;
    this.saveData();
    return order;
  }

  getDashboardStats() {
    const orders = this.data.orders;
    const newOrders = orders.filter((o) => o.status === 'pending_confirm').length;
    const confirmedOrders = orders.filter((o) => o.status === 'confirmed').length;
    const preparingOrders = orders.filter((o) => o.status === 'preparing').length;
    const shippingOrders = orders.filter((o) => o.status === 'shipping').length;
    const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;

    // Realized revenue: orders that are marked 'paid'
    const realizedRevenue = orders
      .filter((o) => o.paymentStatus === 'paid' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Total gross order value (excluding cancelled)
    const grossOrderValue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Pending payment revenue
    const pendingPaymentValue = orders
      .filter((o) => o.paymentStatus === 'unpaid' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Low stock warnings
    const lowStockProducts = this.data.products.filter((p) => p.isActive && p.stock <= 5);

    return {
      newOrders,
      confirmedOrders,
      preparingOrders,
      shippingOrders,
      deliveredOrders,
      cancelledOrders,
      totalOrders: orders.length,
      realizedRevenue,
      grossOrderValue,
      pendingPaymentValue,
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.map((p) => ({ id: p.id, name: p.name, stock: p.stock, sku: p.sku })),
    };
  }
}

export const db = new Database();
