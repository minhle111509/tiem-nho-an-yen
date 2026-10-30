export type CategoryId = 'vat-pham-an-lanh' | 'duyen-lanh-ben-minh' | 'huong-tram-tinh-tai';

export interface Category {
  id: CategoryId;
  name: string;
  tagline: string;
  description: string;
  image: string;
}

export interface ProductVariation {
  id: string;
  name: string;
  priceModifier?: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: CategoryId;
  price: number;
  compareAtPrice?: number;
  images: string[];
  stock: number;
  isActive: boolean;
  material: string;
  dimensions: string;
  color: string;
  origin: string;
  description: string;
  meaning: string;
  usageInstructions: string;
  careInstructions: string;
  variations?: ProductVariation[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  soldCount?: number;
  rating?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariation?: ProductVariation;
}

export interface GiftWrapOption {
  enabled: boolean;
  senderName?: string;
  receiverName?: string;
  message?: string;
}

export type OrderStatus =
  | 'pending_confirm' // Chờ xác nhận
  | 'confirmed'       // Đã xác nhận
  | 'preparing'       // Đang chuẩn bị hàng
  | 'shipping'        // Đang giao hàng
  | 'delivered'       // Đã giao thành công
  | 'cancelled'       // Đã hủy (hoàn kho)
  | 'returned';       // Hoàn trả

export type PaymentMethod = 'COD' | 'BANK_TRANSFER';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface OrderItem {
  productId: string;
  sku: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  variationName?: string;
}

export interface OrderLog {
  timestamp: string;
  action: string;
  note?: string;
}

export interface Order {
  id: string; // e.g. AY-202610-8421
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone: string;
  province: string;
  district: string;
  address: string;
  note?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  giftWrapFee: number;
  totalAmount: number;
  giftWrap?: GiftWrapOption;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  shippingCarrier?: string;
  trackingCode?: string;
  shippedDate?: string;
  internalNote?: string;
  history: OrderLog[];
  bankSnapshot?: OrderBankSnapshot;
}

export interface OrderBankSnapshot {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  customQrImage?: string;
  useDynamicVietQr?: boolean;
}

export interface BankingHistoryLog {
  id: string;
  timestamp: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  customQrImage?: string;
  useDynamicVietQr: boolean;
  note?: string;
}

export interface StoreSettings {
  storeName: string;
  slogan: string;
  homeHeroQuote: string;
  phone: string;
  zalo: string;
  facebook: string;
  email: string;
  address: string;
  bankName: string;
  bankCode: string; // for VietQR quick link
  accountNumber: string;
  accountHolder: string;
  customQrImage?: string; // custom QR photo uploaded by store owner
  useDynamicVietQr?: boolean; // toggle dynamic VietQR generation
  bankingHistory?: BankingHistoryLog[];
  shippingFlatFee: number;
  freeShippingThreshold: number;
  giftWrapFee: number;
  adminPin: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  image: string;
  publishedAt: string;
  category: string;
  relatedProductIds?: string[];
}
