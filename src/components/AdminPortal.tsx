import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Order, Product, StoreSettings, OrderStatus, PaymentStatus, Category } from '../types';
import { formatVND, formatDate } from '../utils/format';
import { AdminProductModal } from './AdminProductModal';
import { AdminPaymentSettings } from './AdminPaymentSettings';
import {
  ShieldCheck,
  TrendingUp,
  Package,
  ShoppingBag,
  Settings,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Truck,
  XCircle,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Search,
  Copy,
  Eye,
  EyeOff,
  Camera,
  Layers,
  QrCode,
  ArrowRight,
} from 'lucide-react';

interface AdminPortalProps {
  onLogout: () => void;
  adminPin: string;
  onPinChange: (newPin: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onLogout, adminPin, onPinChange }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'settings' | 'payment'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Order filters
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Product filters
  const [productFilter, setProductFilter] = useState<'all' | 'active' | 'draft' | 'low_stock'>('all');
  const [productSearch, setProductSearch] = useState('');

  // Shipping modal
  const [shippingModalOrder, setShippingModalOrder] = useState<Order | null>(null);
  const [carrierInput, setCarrierInput] = useState('GHTK (Giao Hàng Tiết Kiệm)');
  const [trackingCodeInput, setTrackingCodeInput] = useState('');

  // Internal note modal
  const [noteModalOrder, setNoteModalOrder] = useState<Order | null>(null);
  const [internalNoteInput, setInternalNoteInput] = useState('');

  // Mobile Product Editor Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Store Settings form
  const [settingsForm, setSettingsForm] = useState<StoreSettings | null>(null);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, [adminPin]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, ordersData, productsData, settingsData, catData] = await Promise.all([
        api.getAdminStats(adminPin),
        api.getAdminOrders(adminPin),
        api.getAdminProducts(adminPin),
        api.getAdminSettings(adminPin),
        api.getCategories(),
      ]);
      setStats(statsData);
      setOrders(ordersData);
      setProducts(productsData);
      setSettings(settingsData);
      setSettingsForm(settingsData);
      setCategories(catData);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tải dữ liệu quản trị');
      // Stale/wrong PIN (e.g. changed on another device): force a fresh login
      if (/PIN/i.test(err.message || '')) onLogout();
    } finally {
      setLoading(false);
    }
  };

  // Order Operations
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, note?: string) => {
    try {
      const updated = await api.updateAdminOrderStatus(adminPin, orderId, { status, note });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleConfirmShipping = async () => {
    if (!shippingModalOrder) return;
    try {
      const updated = await api.updateAdminOrderStatus(adminPin, shippingModalOrder.id, {
        status: 'shipping',
        shippingCarrier: carrierInput,
        trackingCode: trackingCodeInput,
        note: `Bàn giao đối tác: ${carrierInput} (Mã vận đơn: ${trackingCodeInput})`,
      });
      setOrders((prev) => prev.map((o) => (o.id === shippingModalOrder.id ? updated : o)));
      if (selectedOrder?.id === shippingModalOrder.id) setSelectedOrder(updated);
      setShippingModalOrder(null);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu thông tin vận chuyển');
    }
  };

  const handleUpdatePayment = async (orderId: string, paymentStatus: PaymentStatus) => {
    try {
      const updated = await api.updateAdminOrderPayment(adminPin, orderId, { paymentStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật thanh toán');
    }
  };

  const handleSaveInternalNote = async () => {
    if (!noteModalOrder) return;
    try {
      const updated = await api.updateAdminOrderNote(adminPin, noteModalOrder.id, internalNoteInput);
      setOrders((prev) => prev.map((o) => (o.id === noteModalOrder.id ? updated : o)));
      if (selectedOrder?.id === noteModalOrder.id) setSelectedOrder(updated);
      setNoteModalOrder(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu ghi chú');
    }
  };

  // Product Operations
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductModalOpen(true);
  };

  const handleToggleProductStatus = async (p: Product) => {
    try {
      const updated = await api.toggleAdminProductStatus(adminPin, p.id);
      setProducts((prev) => prev.map((item) => (item.id === p.id ? updated : item)));
    } catch (err: any) {
      alert(err.message || 'Không thể đổi trạng thái sản phẩm');
    }
  };

  const handleDuplicateProduct = async (p: Product) => {
    try {
      const duplicated = await api.duplicateAdminProduct(adminPin, p.id);
      setProducts((prev) => [duplicated, ...prev]);
      alert(`Đã nhân bản "${p.name}". Bản sao mới được tạo ở trạng thái Bản nháp để bạn có thể kiểm tra.`);
    } catch (err: any) {
      alert(err.message || 'Không thể nhân bản sản phẩm');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống? Các đơn hàng cũ đã mua vẫn được lưu an toàn.')) return;
    try {
      await api.deleteAdminProduct(adminPin, id);
      setProducts((prev) => prev.filter((item) => item.id !== id));
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa sản phẩm');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    try {
      const updated = await api.updateAdminSettings(adminPin, settingsForm);
      setSettings(updated);
      // Keep this session working after the owner changes the PIN
      if (updated.adminPin && updated.adminPin !== adminPin) onPinChange(updated.adminPin);
      setSaveSettingsSuccess(true);
      setTimeout(() => setSaveSettingsSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu cài đặt');
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesFilter = orderFilter === 'all' || o.status === orderFilter;
    const cleanSearch = orderSearch.toLowerCase().trim();
    const matchesSearch =
      !cleanSearch ||
      o.id.toLowerCase().includes(cleanSearch) ||
      o.customerName.toLowerCase().includes(cleanSearch) ||
      o.customerPhone.includes(cleanSearch);
    return matchesFilter && matchesSearch;
  });

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (productFilter === 'active' && !p.isActive) return false;
    if (productFilter === 'draft' && p.isActive) return false;
    if (productFilter === 'low_stock' && p.stock > 5) return false;

    const q = productSearch.toLowerCase().trim();
    if (q) {
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 pb-28">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#35483C] text-[#F5F0E6] shadow-md mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FAF6EE] text-[#35483C] flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-zen text-xl sm:text-2xl font-bold leading-tight">
              Bàn Quản Trị Chủ Tiệm
            </h1>
            <p className="text-xs text-[#FAF6EE]/80">
              Vận hành bán hàng • Chụp ảnh đăng bán trực tiếp trên điện thoại
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllAdminData}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F5F0E6] text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Thoát</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Mobile-Scrollable) */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#35483C] text-[#F5F0E6] shadow-xs'
              : 'bg-[#FAF6EE] text-[#624832] border border-[#E2D5C3] hover:border-[#35483C]'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-[#C6A667]" />
          <span>Tổng Quan</span>
          {stats?.newOrders > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px]">
              {stats.newOrders}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-[#35483C] text-[#F5F0E6] shadow-xs'
              : 'bg-[#FAF6EE] text-[#624832] border border-[#E2D5C3] hover:border-[#35483C]'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-[#C6A667]" />
          <span>Đơn Hàng ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'products'
              ? 'bg-[#35483C] text-[#F5F0E6] shadow-xs'
              : 'bg-[#FAF6EE] text-[#624832] border border-[#E2D5C3] hover:border-[#35483C]'
          }`}
        >
          <Package className="w-4 h-4 text-[#C6A667]" />
          <span>Sản Phẩm ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#35483C] text-[#F5F0E6] shadow-xs'
              : 'bg-[#FAF6EE] text-[#624832] border border-[#E2D5C3] hover:border-[#35483C]'
          }`}
        >
          <Settings className="w-4 h-4 text-[#C6A667]" />
          <span>Cài Đặt Tiệm</span>
        </button>

        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'payment'
              ? 'bg-[#35483C] text-[#F5F0E6] shadow-xs'
              : 'bg-[#FAF6EE] text-[#624832] border border-[#E2D5C3] hover:border-[#35483C]'
          }`}
        >
          <QrCode className="w-4 h-4 text-[#C6A667]" />
          <span>Tài Khoản & Mã QR</span>
        </button>
      </div>

      {/* --- TAB 1: OVERVIEW DASHBOARD --- */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {stats.newOrders > 0 && (
            <div className="p-5 rounded-2xl bg-amber-500 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-full">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    Có {stats.newOrders} đơn hàng mới đang chờ tiệm xác nhận!
                  </h3>
                  <p className="text-xs text-white/90">
                    Khách vừa đặt đơn, vui lòng kiểm tra và liên hệ giao hàng sớm.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setOrderFilter('pending_confirm');
                  setActiveTab('orders');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-amber-900 font-bold text-xs uppercase tracking-wider hover:bg-amber-100 transition shadow-sm cursor-pointer"
              >
                XEM ĐƠN HÀNG MỚI NGAY
              </button>
            </div>
          )}

          {/* Quick Product Add Button on Overview */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF6EE] to-[#FAF0E1] border border-[#C6A667]/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#35483C] text-white flex items-center justify-center">
                <Camera className="w-5 h-5 text-[#C6A667]" />
              </div>
              <div>
                <h4 className="font-zen text-base font-bold text-[#241E1A]">Vừa có hàng mới về tiệm?</h4>
                <p className="text-xs text-[#624832]/80">
                  Mở camera chụp ảnh, nhập giá và đăng bán ngay lập tức trên điện thoại.
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenAddProduct}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#35483C] text-[#F5F0E6] text-xs font-bold hover:bg-[#28382E] transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#C6A667]" />
              <span>Chụp / Đăng Sản Phẩm Mới</span>
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E2D5C3] shadow-xs">
              <span className="text-[11px] font-semibold text-[#624832]/70 uppercase tracking-wider">
                Doanh thu thực nhận
              </span>
              <p className="font-zen text-2xl font-bold text-[#35483C] mt-1">
                {formatVND(stats.realizedRevenue)}
              </p>
              <p className="text-[10px] text-emerald-700 font-medium mt-1">
                Đã thu tiền (VietQR/COD)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E2D5C3] shadow-xs">
              <span className="text-[11px] font-semibold text-[#624832]/70 uppercase tracking-wider">
                Tổng giá trị đơn
              </span>
              <p className="font-zen text-2xl font-bold text-[#241E1A] mt-1">
                {formatVND(stats.grossOrderValue)}
              </p>
              <p className="text-[10px] text-[#624832]/70 mt-1">
                Bao gồm đơn đang xử lý
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E2D5C3] shadow-xs">
              <span className="text-[11px] font-semibold text-[#624832]/70 uppercase tracking-wider">
                Đang giao hàng
              </span>
              <p className="font-zen text-2xl font-bold text-indigo-800 mt-1">
                {stats.shippingOrders} đơn
              </p>
              <p className="text-[10px] text-[#624832]/70 mt-1">
                Đã giao shipper
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E2D5C3] shadow-xs">
              <span className="text-[11px] font-semibold text-[#624832]/70 uppercase tracking-wider">
                Đã giao thành công
              </span>
              <p className="font-zen text-2xl font-bold text-emerald-800 mt-1">
                {stats.deliveredOrders} đơn
              </p>
              <p className="text-[10px] text-emerald-700 mt-1">
                Hoàn tất trọn vẹn
              </p>
            </div>
          </div>

          {stats.lowStockCount > 0 && (
            <div className="p-5 rounded-2xl bg-[#FAF0E1] border border-amber-300">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Cảnh báo tồn kho thấp ({stats.lowStockCount} sản phẩm):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {stats.lowStockProducts.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl bg-white border border-[#E2D5C3] flex justify-between items-center"
                  >
                    <span className="font-medium text-[#241E1A] truncate">{p.name}</span>
                    <span className="font-bold text-red-600 ml-2">Còn {p.stock} món</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: ORDER MANAGEMENT --- */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#624832]/60" />
              <input
                type="text"
                placeholder="Tìm mã đơn, tên khách, số điện thoại..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D8CEBE] bg-white text-xs text-[#241E1A]"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'pending_confirm', label: 'Chờ duyệt' },
                { id: 'confirmed', label: 'Đã duyệt' },
                { id: 'preparing', label: 'Đang gói' },
                { id: 'shipping', label: 'Đang giao' },
                { id: 'delivered', label: 'Đã giao' },
                { id: 'cancelled', label: 'Đã hủy' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOrderFilter(f.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                    orderFilter === f.id
                      ? 'bg-[#35483C] text-white'
                      : 'bg-[#FAF6EE] text-[#624832] border border-[#E2D5C3]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-[#FAF6EE] rounded-2xl border border-[#E2D5C3] text-[#624832]">
                <ShoppingBag className="w-8 h-8 mx-auto text-[#C6A667] mb-2" />
                <p className="text-sm font-semibold">Không tìm thấy đơn hàng nào phù hợp.</p>
              </div>
            ) : (
              filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#FAF6EE] border border-[#E2D5C3] hover:border-[#C6A667] transition shadow-xs flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E2D5C3]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#241E1A]">{ord.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          ord.status === 'pending_confirm'
                            ? 'bg-amber-100 text-amber-800'
                            : ord.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : ord.status === 'preparing'
                            ? 'bg-indigo-100 text-indigo-800'
                            : ord.status === 'shipping'
                            ? 'bg-purple-100 text-purple-800'
                            : ord.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {ord.status === 'pending_confirm'
                          ? 'Chờ duyệt'
                          : ord.status === 'confirmed'
                          ? 'Đã duyệt'
                          : ord.status === 'preparing'
                          ? 'Đang gói'
                          : ord.status === 'shipping'
                          ? 'Đang giao'
                          : ord.status === 'delivered'
                          ? 'Đã giao'
                          : 'Đã hủy'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#624832]/70">{formatDate(ord.createdAt)}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          ord.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.paymentStatus === 'paid'
                          ? 'Đã TT'
                          : ord.paymentMethod === 'BANK_TRANSFER'
                          ? 'QR Chưa TT'
                          : 'COD Chưa TT'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="font-bold text-[#241E1A]">{ord.customerName}</p>
                      <a
                        href={`tel:${ord.customerPhone}`}
                        className="text-[#35483C] font-mono font-semibold underline"
                      >
                        {ord.customerPhone}
                      </a>
                      <p className="text-[11px] text-[#624832]/80 mt-1 line-clamp-1">
                        {ord.address}, {ord.district ? `${ord.district}, ` : ''}{ord.province}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-[#241E1A] mb-1">
                        Sản phẩm ({ord.items.length}):
                      </p>
                      <ul className="space-y-0.5 text-[11px] text-[#624832]">
                        {ord.items.map((it, idx) => (
                          <li key={idx} className="line-clamp-1">
                            • {it.quantity}x {it.productName}
                          </li>
                        ))}
                      </ul>
                      {ord.giftWrap?.enabled && (
                        <span className="inline-block mt-1 text-[10px] bg-[#C6A667]/20 text-[#241E1A] px-1.5 py-0.2 rounded font-semibold">
                          🎁 Kèm gói quà & thiệp
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col justify-between sm:items-end">
                      <div className="sm:text-right">
                        <span className="text-[11px] text-[#624832]">Tổng thanh toán:</span>
                        <p className="font-bold text-base text-[#35483C]">{formatVND(ord.totalAmount)}</p>
                      </div>

                      {ord.trackingCode && (
                        <p className="text-[11px] text-purple-800 font-mono font-medium">
                          Mã VĐ: {ord.trackingCode}
                        </p>
                      )}
                    </div>
                  </div>

                  {ord.internalNote && (
                    <div className="p-2 rounded-xl bg-amber-50 text-[11px] text-amber-900 border border-amber-200">
                      <strong>Ghi chú nội bộ:</strong> {ord.internalNote}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2D5C3]">
                    <div className="flex flex-wrap gap-1.5">
                      {ord.status === 'pending_confirm' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'confirmed')}
                          className="px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition cursor-pointer"
                        >
                          Xác nhận đơn
                        </button>
                      )}

                      {ord.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                          className="px-3 py-1.5 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 transition cursor-pointer"
                        >
                          Đang gói hàng
                        </button>
                      )}

                      {(ord.status === 'preparing' || ord.status === 'confirmed') && (
                        <button
                          onClick={() => {
                            setShippingModalOrder(ord);
                            setTrackingCodeInput(ord.trackingCode || '');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Giao hàng (Nhập VĐ)</span>
                        </button>
                      )}

                      {ord.status === 'shipping' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Giao thành công</span>
                        </button>
                      )}

                      {ord.paymentStatus !== 'paid' ? (
                        <button
                          onClick={() => handleUpdatePayment(ord.id, 'paid')}
                          className="px-2.5 py-1.5 rounded-lg border border-emerald-600 text-emerald-800 hover:bg-emerald-50 text-xs font-medium transition cursor-pointer"
                        >
                          ✓ Đã nhận tiền
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdatePayment(ord.id, 'unpaid')}
                          className="px-2 py-1.5 rounded-lg border text-stone-500 text-xs hover:bg-stone-100 transition cursor-pointer"
                        >
                          Bỏ đánh dấu TT
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setNoteModalOrder(ord);
                          setInternalNoteInput(ord.internalNote || '');
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-[#D8CEBE] text-[#624832] text-xs hover:bg-black/5 transition cursor-pointer"
                      >
                        Ghi chú
                      </button>
                    </div>

                    {ord.status !== 'cancelled' && ord.status !== 'delivered' && (
                      <button
                        onClick={() => {
                          if (window.confirm('Hủy đơn hàng này? Hệ thống sẽ tự động hoàn kho lại số lượng sản phẩm.')) {
                            handleUpdateOrderStatus(ord.id, 'cancelled', 'Chủ tiệm hủy đơn');
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-medium transition cursor-pointer"
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: PRODUCT MANAGEMENT (MOBILE-FIRST) --- */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Top Bar with Big Touch Button to Snap Photo / Add Product */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-zen text-xl sm:text-2xl font-bold text-[#241E1A]">
                Quản Lý Sản Phẩm Tiệm ({products.length})
              </h2>
              <p className="text-xs text-[#624832]/80">
                Chụp ảnh, định giá và đăng bán trực tiếp trên điện thoại
              </p>
            </div>

            <button
              onClick={handleOpenAddProduct}
              className="py-3 px-5 rounded-2xl bg-[#35483C] hover:bg-[#28382E] text-[#F5F0E6] text-xs font-bold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <Camera className="w-4 h-4 text-[#C6A667]" />
              <span>📸 Chụp / Đăng Sản Phẩm Mới</span>
            </button>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row gap-3 bg-[#FAF6EE] p-3 rounded-2xl border border-[#E2D5C3]">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#624832]/60" />
              <input
                type="text"
                placeholder="Tìm theo tên sản phẩm, mã SKU hoặc chất liệu..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D8CEBE] bg-white text-xs text-[#241E1A]"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: `Tất cả (${products.length})` },
                { id: 'active', label: `Đang bán (${products.filter((p) => p.isActive).length})` },
                { id: 'draft', label: `Bản nháp/Tạm ẩn (${products.filter((p) => !p.isActive).length})` },
                { id: 'low_stock', label: `Sắp hết (<5)` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setProductFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                    productFilter === f.id
                      ? 'bg-[#35483C] text-white'
                      : 'bg-white text-[#624832] border border-[#D8CEBE]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map((p) => {
              const mainImg = p.images[0] || '/icon.svg';
              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl bg-[#FAF6EE] border transition shadow-xs flex flex-col justify-between gap-3 ${
                    p.isActive ? 'border-[#E2D5C3] hover:border-[#C6A667]' : 'border-dashed border-stone-400 bg-stone-100/70'
                  }`}
                >
                  <div className="flex gap-3.5">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#ECE3D4] shrink-0 border border-[#D8CEBE]">
                      <img src={mainImg} alt={p.name} className="w-full h-full object-cover" />
                      {p.images.length > 1 && (
                        <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/60 text-white text-[9px] font-mono">
                          +{p.images.length - 1} ảnh
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] text-[#624832]/70 font-mono tracking-wider uppercase">
                          {p.sku}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            p.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {p.isActive ? 'ĐANG BÁN' : 'BẢN NHÁP / ẨN'}
                        </span>
                      </div>

                      <h3 className="font-zen text-sm font-bold text-[#241E1A] line-clamp-1 mt-0.5">
                        {p.name}
                      </h3>

                      <p className="text-[11px] text-[#624832]/80 line-clamp-1 mt-0.5">
                        {p.material || 'Chưa cập nhật chất liệu'}
                      </p>

                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-bold text-[#35483C]">
                          {formatVND(p.price)}
                        </span>
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <span className="text-[10px] text-[#624832]/60 line-through">
                            {formatVND(p.compareAtPrice)}
                          </span>
                        )}
                        <span
                          className={`text-xs ml-auto font-semibold ${
                            p.stock <= 5 ? 'text-red-600 font-bold' : 'text-[#624832]'
                          }`}
                        >
                          Kho: {p.stock} món
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#E2D5C3] text-xs">
                    {/* Toggle Visibility */}
                    <button
                      type="button"
                      onClick={() => handleToggleProductStatus(p)}
                      className={`px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1 transition cursor-pointer ${
                        p.isActive
                          ? 'border-stone-300 text-stone-600 hover:bg-stone-200/50'
                          : 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                      }`}
                      title={p.isActive ? 'Ẩn sản phẩm khỏi cửa hàng' : 'Bật hiển thị bán sản phẩm'}
                    >
                      {p.isActive ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                          <span>Ẩn</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Bật bán</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Duplicate product */}
                      <button
                        type="button"
                        onClick={() => handleDuplicateProduct(p)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#D8CEBE] bg-white hover:bg-[#F0EAE0] text-[#35483C] font-medium flex items-center gap-1 transition cursor-pointer"
                        title="Nhân bản sản phẩm tương tự"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Nhân bản</span>
                      </button>

                      {/* Edit product */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditProduct(p)}
                        className="px-3 py-1.5 rounded-lg bg-[#35483C] text-white hover:bg-[#28382E] font-medium flex items-center gap-1 transition cursor-pointer"
                        title="Chỉnh sửa chi tiết"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#C6A667]" />
                        <span>Sửa</span>
                      </button>

                      {/* Delete product */}
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 4: STORE SETTINGS & VIETQR --- */}
      {activeTab === 'settings' && settingsForm && (
        <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-[#FAF6EE] border border-[#E2D5C3] shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2D5C3]">
            <div>
              <h2 className="font-zen text-xl font-bold text-[#241E1A]">Cài Đặt Cửa Tiệm & Hoạt Động</h2>
              <p className="text-xs text-[#624832]/80">Cấu hình thông tin liên hệ, phí vận chuyển và chính sách cửa tiệm.</p>
            </div>
            {saveSettingsSuccess && (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                ✓ Đã lưu thành công
              </span>
            )}
          </div>

          {/* Quick jump to Payment & QR Management */}
          <div className="p-4 rounded-2xl bg-[#FAF0E1] border border-[#C6A667] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-[#624832]/70 uppercase tracking-wider font-bold">
                <span>QUẢN TRỊ</span>
                <span>→</span>
                <span>CÀI ĐẶT CỬA HÀNG</span>
                <span>→</span>
                <span className="text-[#35483C]">THANH TOÁN / MÃ QR</span>
              </div>
              <h3 className="font-bold text-xs text-[#241E1A] flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#C6A667]" />
                <span>Chuyên mục Quản Lý Mã QR & Tài Khoản Ngân Hàng</span>
              </h3>
              <p className="text-[11px] text-[#624832]/80">
                Cho phép đổi ngân hàng, số tài khoản, tải lên ảnh QR riêng từ máy, xem trước trực tiếp và xem lịch sử đối soát.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className="px-4 py-2 rounded-xl bg-[#35483C] text-[#F5F0E6] text-xs font-bold hover:bg-[#28382E] transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              <span>Vào Quản Lý QR</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C6A667]" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#624832] mb-1">Tên cửa hàng</label>
              <input
                type="text"
                value={settingsForm.storeName}
                onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-white text-[#241E1A]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#624832] mb-1">Slogan</label>
              <input
                type="text"
                value={settingsForm.slogan}
                onChange={(e) => setSettingsForm({ ...settingsForm, slogan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-white text-[#241E1A]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#624832] mb-1">Hotline / Số điện thoại</label>
              <input
                type="text"
                value={settingsForm.phone}
                onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-white text-[#241E1A]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#624832] mb-1">Zalo hỗ trợ</label>
              <input
                type="text"
                value={settingsForm.zalo}
                onChange={(e) => setSettingsForm({ ...settingsForm, zalo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-white text-[#241E1A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#624832] mb-1">Địa chỉ cửa hàng</label>
              <input
                type="text"
                value={settingsForm.address}
                onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-white text-[#241E1A]"
              />
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-[#E2D5C3]">
              <h3 className="font-bold text-[#35483C] text-sm uppercase tracking-wider mb-2">
                Thông Tin Ngân Hàng Nhận Tiền VietQR
              </h3>
            </div>

            <div>
              <label className="block font-semibold text-[#624832] mb-1">Tên Ngân hàng</label>
              <input
                type="text"
                value={settingsForm.bankName}
                onChange={(e) => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-white text-[#241E1A]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#624832] mb-1">Mã Ngân hàng (MB, VCB, TCB...)</label>
              <input
                type="text"
                value={settingsForm.bankCode}
                onChange={(e) => setSettingsForm({ ...settingsForm, bankCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-white text-[#241E1A] font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#624832] mb-1">Số tài khoản</label>
              <input
                type="text"
                value={settingsForm.accountNumber}
                onChange={(e) => setSettingsForm({ ...settingsForm, accountNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-white text-[#241E1A] font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#624832] mb-1">Tên chủ tài khoản (In hoa không dấu)</label>
              <input
                type="text"
                value={settingsForm.accountHolder}
                onChange={(e) => setSettingsForm({ ...settingsForm, accountHolder: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-white text-[#241E1A]"
              />
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-[#E2D5C3]">
              <h3 className="font-bold text-[#35483C] text-sm uppercase tracking-wider mb-2">
                Phí Vận Chuyển & Dịch Vụ
              </h3>
            </div>

            <div>
              <label className="block font-semibold text-[#624832] mb-1">Phí vận chuyển cố định (₫)</label>
              <input
                type="number"
                value={settingsForm.shippingFlatFee}
                onChange={(e) => setSettingsForm({ ...settingsForm, shippingFlatFee: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-white text-[#241E1A]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#624832] mb-1">Ngưỡng Miễn Phí Vận Chuyển (₫)</label>
              <input
                type="number"
                value={settingsForm.freeShippingThreshold}
                onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-white text-[#241E1A]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#624832] mb-1">Phí Dịch vụ Gói Quà An Yên (₫)</label>
              <input
                type="number"
                value={settingsForm.giftWrapFee}
                onChange={(e) => setSettingsForm({ ...settingsForm, giftWrapFee: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-white text-[#241E1A]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#624832] mb-1">Mã PIN Quản Trị Mới</label>
              <input
                type="text"
                value={settingsForm.adminPin}
                onChange={(e) => setSettingsForm({ ...settingsForm, adminPin: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-white text-[#241E1A] font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#35483C] text-[#F5F0E6] text-xs font-bold hover:bg-[#28382E] transition shadow-md cursor-pointer"
          >
            LƯU TẤT CẢ CÀI ĐẶT
          </button>
        </form>
      )}

      {/* --- TAB 5: PAYMENT & QR SETTINGS --- */}
      {activeTab === 'payment' && (settings || settingsForm) && (
        <AdminPaymentSettings
          settings={settings || settingsForm!}
          adminPin={adminPin}
          onUpdate={(updated) => {
            setSettings(updated);
            setSettingsForm(updated);
          }}
        />
      )}

      {/* Shipping Input Modal */}
      {shippingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF6EE] max-w-sm w-full p-6 rounded-2xl shadow-2xl border border-[#C6A667]/40 text-[#241E1A]">
            <h3 className="font-zen text-lg font-bold mb-3">Bàn Giao Vận Chuyển: {shippingModalOrder.id}</h3>
            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="block font-medium mb-1">Đơn vị vận chuyển:</label>
                <input
                  type="text"
                  value={carrierInput}
                  onChange={(e) => setCarrierInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-white"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Mã vận đơn:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: GHTK12345678"
                  value={trackingCodeInput}
                  onChange={(e) => setTrackingCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border bg-white font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmShipping}
                className="flex-1 py-2 bg-[#35483C] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Xác nhận giao hàng
              </button>
              <button
                onClick={() => setShippingModalOrder(null)}
                className="px-3 py-2 border rounded-xl text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal Note Modal */}
      {noteModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF6EE] max-w-sm w-full p-6 rounded-2xl shadow-2xl border border-[#C6A667]/40 text-[#241E1A]">
            <h3 className="font-zen text-lg font-bold mb-3">Ghi chú nội bộ: {noteModalOrder.id}</h3>
            <textarea
              rows={3}
              value={internalNoteInput}
              onChange={(e) => setInternalNoteInput(e.target.value)}
              placeholder="Nhập ghi chú cho nhân viên tiệm..."
              className="w-full px-3 py-2 rounded-lg border bg-white text-xs mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveInternalNote}
                className="flex-1 py-2 bg-[#35483C] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Lưu ghi chú
              </button>
              <button
                onClick={() => setNoteModalOrder(null)}
                className="px-3 py-2 border rounded-xl text-xs cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-first Product Editor Modal */}
      <AdminProductModal
        product={editingProduct}
        categories={categories}
        adminPin={adminPin}
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSaved={loadAllAdminData}
      />
    </div>
  );
};
