import { Product, StoreSettings, Article, Category, Order, OrderStatus, PaymentStatus } from './types';

export const api = {
  // Public Products
  async getProducts(params?: { category?: string; search?: string; featured?: boolean; newArrival?: boolean }) {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.featured) query.append('featured', 'true');
    if (params?.newArrival) query.append('newArrival', 'true');

    const res = await fetch(`/api/products?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi khi tải sản phẩm');
    return data.products as Product[];
  },

  async getProduct(id: string) {
    const res = await fetch(`/api/products/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi khi tải chi tiết sản phẩm');
    return data.product as Product;
  },

  async getCategories() {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi khi tải danh mục');
    return data.categories as Category[];
  },

  async getPublicSettings() {
    const res = await fetch('/api/settings/public');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi khi tải thông tin cửa hàng');
    return data.settings as Omit<StoreSettings, 'adminPin'>;
  },

  async getArticles() {
    const res = await fetch('/api/articles');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi khi tải bài viết');
    return data.articles as Article[];
  },

  async createOrder(orderPayload: {
    customerName: string;
    customerPhone: string;
    province: string;
    district: string;
    address: string;
    note?: string;
    items: { productId: string; quantity: number; variationId?: string }[];
    paymentMethod: 'COD' | 'BANK_TRANSFER';
    giftWrap?: { enabled: boolean; senderName?: string; receiverName?: string; message?: string };
  }) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Đặt hàng không thành công');
    }
    return data.order as Order;
  },

  async lookupOrder(phone: string, orderId: string) {
    const res = await fetch('/api/orders/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, orderId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Không tìm thấy thông tin đơn hàng');
    }
    return data.order as Order;
  },

  async cancelOrderRequest(orderId: string, phone: string) {
    const res = await fetch(`/api/orders/${orderId}/cancel-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Không thể hủy đơn hàng');
    }
    return data.order as Order;
  },

  // Admin APIs
  async adminLogin(pin: string) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Mã PIN không đúng');
    }
    return true;
  },

  async getAdminStats(pin: string) {
    const res = await fetch('/api/admin/stats', {
      headers: { 'x-admin-pin': pin },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi tải thống kê');
    return data.stats;
  },

  async getAdminOrders(pin: string) {
    const res = await fetch('/api/admin/orders', {
      headers: { 'x-admin-pin': pin },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi tải danh sách đơn hàng');
    return data.orders as Order[];
  },

  async updateAdminOrderStatus(
    pin: string,
    orderId: string,
    payload: { status: OrderStatus; note?: string; shippingCarrier?: string; trackingCode?: string }
  ) {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật trạng thái đơn');
    return data.order as Order;
  },

  async updateAdminOrderPayment(pin: string, orderId: string, payload: { paymentStatus: PaymentStatus; note?: string }) {
    const res = await fetch(`/api/admin/orders/${orderId}/payment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật thanh toán');
    return data.order as Order;
  },

  async updateAdminOrderNote(pin: string, orderId: string, internalNote: string) {
    const res = await fetch(`/api/admin/orders/${orderId}/note`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
      body: JSON.stringify({ internalNote }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật ghi chú');
    return data.order as Order;
  },

  async getAdminProducts(pin: string) {
    const res = await fetch('/api/admin/products', {
      headers: { 'x-admin-pin': pin },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi tải sản phẩm quản trị');
    return data.products as Product[];
  },

  async createAdminProduct(pin: string, product: Omit<Product, 'id'>) {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi tạo sản phẩm mới');
    return data.product as Product;
  },

  async updateAdminProduct(pin: string, id: string, product: Partial<Product>) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật sản phẩm');
    return data.product as Product;
  },

  async deleteAdminProduct(pin: string, id: string) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': pin },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi xóa sản phẩm');
    return true;
  },

  async duplicateAdminProduct(pin: string, id: string) {
    const res = await fetch(`/api/admin/products/${id}/duplicate`, {
      method: 'POST',
      headers: { 'x-admin-pin': pin },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi nhân bản sản phẩm');
    return data.product as Product;
  },

  async toggleAdminProductStatus(pin: string, id: string) {
    const res = await fetch(`/api/admin/products/${id}/toggle-status`, {
      method: 'PUT',
      headers: { 'x-admin-pin': pin },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi thay đổi trạng thái sản phẩm');
    return data.product as Product;
  },

  async uploadAdminImage(pin: string, imageBase64: string, fileName?: string) {
    const res = await fetch('/api/admin/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin,
      },
      body: JSON.stringify({ imageBase64, fileName }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Lỗi khi tải ảnh lên máy chủ');
    }
    return data.url as string;
  },

  async aiSuggestProduct(pin: string, imageBase64: string, currentCategory?: string, currentName?: string) {
    const res = await fetch('/api/admin/ai-suggest-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin,
      },
      body: JSON.stringify({ imageBase64, currentCategory, currentName }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Không thể tạo gợi ý từ AI');
    }
    return data.suggestion;
  },

  async getAdminSettings(pin: string) {
    const res = await fetch('/api/admin/settings', {
      headers: { 'x-admin-pin': pin },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi tải cài đặt');
    return data.settings as StoreSettings;
  },

  async exportAdminData(pin: string) {
    const res = await fetch('/api/admin/export', { headers: { 'x-admin-pin': pin } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi tải bản sao lưu');
    return data;
  },

  async importAdminData(pin: string, data: unknown) {
    const res = await fetch('/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
      body: JSON.stringify({ data, confirm: 'REPLACE_ALL_DATA' }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Lỗi khôi phục dữ liệu');
    return result as { products: number; orders: number };
  },

  async updateAdminSettings(pin: string, settings: Partial<StoreSettings>) {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật cài đặt');
    return data.settings as StoreSettings;
  },
};
