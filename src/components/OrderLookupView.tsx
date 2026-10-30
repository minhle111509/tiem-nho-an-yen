import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { MomoPaymentBlock } from './MomoPaymentBlock';
import { Order, StoreSettings } from '../types';
import { formatVND, formatDate, getVietQRImageUrl } from '../utils/format';
import {
  Search,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertCircle,
  Loader2,
  QrCode,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface OrderLookupViewProps {
  settings: Partial<StoreSettings>;
  initialOrderId?: string;
  initialPhone?: string;
}

export const OrderLookupView: React.FC<OrderLookupViewProps> = ({
  settings,
  initialOrderId = '',
  initialPhone = '',
}) => {
  const [orderId, setOrderId] = useState(initialOrderId);
  const [phone, setPhone] = useState(initialPhone);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (initialOrderId && initialPhone) {
      handleLookup(initialOrderId, initialPhone);
    }
  }, [initialOrderId, initialPhone]);

  const handleLookup = async (lookupId?: string, lookupPhone?: string) => {
    const idToUse = (lookupId || orderId).trim();
    const phoneToUse = (lookupPhone || phone).trim().replace(/\D/g, '');

    if (!idToUse || !phoneToUse) {
      setErrorMessage('Vui lòng nhập đầy đủ Mã đơn hàng và Số điện thoại đã dùng khi đặt hàng.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await api.lookupOrder(phoneToUse, idToUse);
      setOrder(result);
    } catch (err: any) {
      setOrder(null);
      setErrorMessage(err.message || 'Không tìm thấy đơn hàng khớp với thông tin đã nhập.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const updated = await api.cancelOrderRequest(order.id, order.customerPhone);
      setOrder(updated);
      setShowCancelConfirm(false);
    } catch (err: any) {
      alert(err.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending_confirm':
        return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold text-xs">Chờ tiệm xác nhận</span>;
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs">Tiệm đã xác nhận</span>;
      case 'preparing':
        return <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 font-semibold text-xs">Đang chuẩn bị hàng</span>;
      case 'shipping':
        return <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-semibold text-xs">Đang giao hàng</span>;
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs">Giao hàng thành công</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-semibold text-xs">Đơn đã hủy</span>;
      case 'returned':
        return <span className="px-2.5 py-1 rounded-full bg-stone-200 text-stone-800 font-semibold text-xs">Đơn hoàn trả</span>;
    }
  };

  const steps = [
    { key: 'pending_confirm', title: 'Chờ xác nhận', icon: Clock },
    { key: 'confirmed', title: 'Đã xác nhận', icon: CheckCircle2 },
    { key: 'preparing', title: 'Đang gói hàng', icon: Package },
    { key: 'shipping', title: 'Đang giao', icon: Truck },
    { key: 'delivered', title: 'Đã giao', icon: CheckCircle },
  ];

  const getStepIndex = (status: Order['status']) => {
    if (status === 'cancelled' || status === 'returned') return -1;
    return steps.findIndex((s) => s.key === status);
  };

  const currentStepIdx = order ? getStepIndex(order.status) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="text-center mb-8">
        <span className="text-xs uppercase tracking-widest text-[#C6A667] font-semibold">
          Minh Bạch & An Tâm
        </span>
        <h2 className="font-zen text-3xl sm:text-4xl text-[#241E1A] mt-1 mb-2">
          Tra Cứu Tiến Độ Đơn Hàng
        </h2>
        <p className="text-xs sm:text-sm text-[#624832]/80 max-w-lg mx-auto">
          Bảo mật thông tin: Quý khách vui lòng nhập chính xác Mã đơn hàng và Số điện thoại đã đặt.
        </p>
      </div>

      {/* Lookup Card Form */}
      <div className="p-6 rounded-3xl bg-[#FAF6EE] border border-[#E2D5C3] shadow-sm mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="grid grid-cols-1 sm:grid-cols-5 gap-3"
        >
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#624832] mb-1">
              Mã đơn hàng:
            </label>
            <input
              type="text"
              placeholder="Ví dụ: AY-9104"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CEBE] bg-white text-xs font-mono uppercase text-[#241E1A]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#624832] mb-1">
              Số điện thoại người nhận:
            </label>
            <input
              type="tel"
              placeholder="Số điện thoại đặt đơn..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CEBE] bg-white text-xs text-[#241E1A]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#35483C] text-[#F5F0E6] text-xs font-bold hover:bg-[#28382E] transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 text-[#C6A667]" />
                  <span>Tra Cứu</span>
                </>
              )}
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Result Order Details */}
      {order && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF6EE] border border-[#C6A667]/40 shadow-md space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E2D5C3]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-lg font-bold text-[#241E1A]">{order.id}</span>
                {getStatusBadge(order.status)}
              </div>
              <p className="text-xs text-[#624832]/70">
                Ngày đặt: {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#624832]">Thanh toán:</span>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                  order.paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.paymentStatus === 'paid'
                  ? 'Đã thanh toán'
                  : order.paymentStatus === 'refunded'
                  ? 'Đã hoàn tiền'
                  : 'Chưa thanh toán'}
              </span>
            </div>
          </div>

          {/* Interactive Progress Bar */}
          {order.status !== 'cancelled' && order.status !== 'returned' ? (
            <div className="py-2">
              <div className="grid grid-cols-5 gap-2 relative">
                {steps.map((st, idx) => {
                  const Icon = st.icon;
                  const isDone = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div key={st.key} className="flex flex-col items-center text-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-[#35483C] text-white shadow-xs'
                            : 'bg-[#E5DCB] text-[#624832]/50'
                        } ${isCurrent ? 'ring-4 ring-[#C6A667]/30 scale-110' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[11px] mt-2 font-medium ${
                          isDone ? 'text-[#241E1A] font-semibold' : 'text-[#624832]/50'
                        }`}
                      >
                        {st.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>Đơn hàng này hiện ở trạng thái: {order.status === 'cancelled' ? 'ĐÃ HỦY' : 'HOÀN TRẢ'}.</span>
            </div>
          )}

          {/* Shipping Carrier & Tracking info */}
          {order.trackingCode && (
            <div className="p-4 rounded-2xl bg-[#FAF0E1] border border-[#E2D5C3] flex items-start gap-3">
              <Truck className="w-5 h-5 text-[#35483C] shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-[#241E1A] mb-0.5">Thông tin vận chuyển:</p>
                <p className="text-[#624832]">
                  Đơn vị: <strong>{order.shippingCarrier || 'Đối tác vận chuyển'}</strong>
                </p>
                <p className="text-[#624832]">
                  Mã vận đơn: <strong className="font-mono text-[#35483C]">{order.trackingCode}</strong>
                </p>
                {order.shippedDate && (
                  <p className="text-[11px] text-[#624832]/70 mt-1">
                    Bàn giao ngày: {formatDate(order.shippedDate)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* VietQR reminder if unpaid bank transfer */}
          {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus === 'unpaid' && (() => {
            const snapshot = order.bankSnapshot;
            const bankName = snapshot?.bankName || settings.bankName || 'Ngân hàng Quân Đội (MB Bank)';
            const bankCode = snapshot?.bankCode || settings.bankCode || 'MB';
            const accountNumber = snapshot?.accountNumber || settings.accountNumber || '';
            const accountHolder = snapshot?.accountHolder || settings.accountHolder || 'TIEM NHO AN YEN';
            const customQrImage = snapshot?.customQrImage || settings.customQrImage;
            const useDynamicVietQr = snapshot?.useDynamicVietQr !== undefined ? snapshot.useDynamicVietQr : (settings.useDynamicVietQr !== false);

            const lookupQrUrl = (!useDynamicVietQr && customQrImage)
              ? customQrImage
              : getVietQRImageUrl(bankCode, accountNumber, order.totalAmount, order.id, accountHolder);

            return (
              <>
              <div className="p-4 rounded-2xl bg-white border border-[#C6A667] flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={lookupQrUrl}
                  alt="VietQR"
                  className="w-32 h-32 object-contain border p-1 rounded-xl bg-white shadow-xs"
                />
                <div className="text-xs space-y-1 text-[#624832]">
                  <p className="font-bold text-[#241E1A] text-sm">Chưa hoàn tất thanh toán</p>
                  <p>Ngân hàng: <strong>{bankName}</strong></p>
                  <p>Số tài khoản: <strong className="font-mono text-sm text-[#35483C]">{accountNumber}</strong></p>
                  <p>Chủ tài khoản: <strong className="uppercase">{accountHolder}</strong></p>
                  <p>Số tiền: <strong className="text-[#35483C] text-sm">{formatVND(order.totalAmount)}</strong></p>
                  <p>Nội dung chuyển khoản: <strong className="font-mono text-[#241E1A]">{order.id}</strong></p>
                </div>
              </div>
              {settings.momoQrImage && (
                <MomoPaymentBlock
                  qrImage={settings.momoQrImage}
                  amount={order.totalAmount}
                  orderId={order.id}
                  className="p-4 rounded-2xl bg-white border border-[#C6A667]"
                />
              )}
              </>
            );
          })()}

          {/* Items breakdown */}
          <div>
            <h4 className="text-xs font-bold text-[#241E1A] uppercase tracking-wider mb-2">
              Danh sách vật phẩm:
            </h4>
            <div className="space-y-2 divide-y divide-[#E2D5C3]">
              {order.items.map((it, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <img src={it.image} alt="" className="w-10 h-10 rounded-xl object-cover bg-[#E5DCB]" />
                    <div>
                      <p className="font-semibold text-[#241E1A]">{it.productName}</p>
                      <p className="text-[11px] text-[#624832]/70">
                        {it.variationName ? `${it.variationName} • ` : ''}Số lượng: {it.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-[#35483C]">{formatVND(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Gift wrap info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-[#E2D5C3]">
            <div>
              <p className="font-semibold text-[#241E1A] mb-1">Địa chỉ nhận hàng:</p>
              <p className="text-[#624832]">{order.customerName} - {order.customerPhone}</p>
              <p className="text-[#624832]">{order.address}, {order.district ? `${order.district}, ` : ''}{order.province}</p>
              {order.note && <p className="text-[11px] text-[#624832]/80 italic mt-1">Ghi chú: "{order.note}"</p>}
            </div>

            <div>
              <p className="font-semibold text-[#241E1A] mb-1">Chi phí đơn hàng:</p>
              <div className="space-y-1 text-[#624832]">
                <div className="flex justify-between">
                  <span>Tiền hàng:</span>
                  <span>{formatVND(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vận chuyển:</span>
                  <span>{order.shippingFee === 0 ? 'Miễn phí' : formatVND(order.shippingFee)}</span>
                </div>
                {order.giftWrapFee > 0 && (
                  <div className="flex justify-between">
                    <span>Gói quà An Yên:</span>
                    <span>{formatVND(order.giftWrapFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-[#35483C] pt-1 border-t border-[#E2D5C3]">
                  <span>Tổng tiền:</span>
                  <span>{formatVND(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gift wrap message preview if present */}
          {order.giftWrap?.enabled && order.giftWrap.message && (
            <div className="p-3.5 rounded-xl bg-[#FAF0E1] border border-[#E2D5C3] text-xs">
              <p className="font-bold text-[#35483C] mb-1">Lời nhắn thiệp giấy dó:</p>
              <p className="italic text-[#624832]">"{order.giftWrap.message}"</p>
              <p className="text-[10px] text-[#624832]/70 text-right mt-1">
                Từ: {order.giftWrap.senderName || 'Người thương'} gửi đến: {order.giftWrap.receiverName || 'Bạn'}
              </p>
            </div>
          )}

          {/* Cancellation section */}
          {order.status === 'pending_confirm' && (
            <div className="pt-4 border-t border-[#E2D5C3] flex items-center justify-between">
              <p className="text-xs text-[#624832]">
                Đơn hàng đang chờ tiệm xác nhận. Bạn có thể hủy nếu đổi ý.
              </p>
              {showCancelConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="px-3 py-1.5 rounded-lg bg-red-700 text-white text-xs font-semibold hover:bg-red-800 transition"
                  >
                    {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-2 py-1.5 rounded-lg border text-xs hover:bg-black/5"
                  >
                    Giữ lại
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs font-medium transition cursor-pointer"
                >
                  Yêu cầu hủy đơn
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
