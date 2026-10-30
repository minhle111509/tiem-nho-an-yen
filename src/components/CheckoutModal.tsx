import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { formatVND, VIETNAMESE_PROVINCES, normalizePhone, isValidVietnamesePhone } from '../utils/format';
import { api } from '../api';
import { StoreSettings, Order } from '../types';
import {
  X,
  ShieldCheck,
  Gift,
  QrCode,
  Truck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';

interface CheckoutModalProps {
  settings: Partial<StoreSettings>;
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  settings,
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { items, subtotal, clearCart } = useCart();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [province, setProvince] = useState('TP. Hồ Chí Minh');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  // Gift wrap option
  const [giftWrapEnabled, setGiftWrapEnabled] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER'>('BANK_TRANSFER');

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // `??` (not `||`) so a fee the owner set to 0 stays 0, matching the server calculation
  const freeShippingThreshold = settings.freeShippingThreshold ?? 500000;
  const shippingFlatFee = settings.shippingFlatFee ?? 30000;
  const giftWrapFee = settings.giftWrapFee ?? 35000;

  // Bank transfer needs a configured receiving account; otherwise only COD is offered
  const bankTransferAvailable = Boolean(settings.accountNumber?.trim());
  const effectivePaymentMethod = bankTransferAvailable ? paymentMethod : 'COD';

  const actualShippingFee = subtotal >= freeShippingThreshold ? 0 : shippingFlatFee;
  const actualGiftWrapFee = giftWrapEnabled ? giftWrapFee : 0;
  const totalAmount = subtotal + actualShippingFee + actualGiftWrapFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate phone number
    const cleanPhone = normalizePhone(customerPhone);
    if (!isValidVietnamesePhone(cleanPhone)) {
      setErrorMessage('Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số để tiệm liên hệ giao hàng.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Vui lòng nhập họ tên người nhận.');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Vui lòng nhập số nhà, tên đường cụ thể.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Giỏ hàng của bạn đang trống.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        province,
        district: district.trim(),
        address: address.trim(),
        note: note.trim(),
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          variationId: i.selectedVariation?.id,
        })),
        paymentMethod: effectivePaymentMethod,
        giftWrap: giftWrapEnabled
          ? {
              enabled: true,
              senderName: senderName.trim(),
              receiverName: receiverName.trim(),
              message: giftMessage.trim(),
            }
          : undefined,
      };

      const order = await api.createOrder(orderPayload);
      clearCart();
      onClose();
      onOrderSuccess(order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-[#FAF6EE] rounded-3xl shadow-2xl border border-[#C6A667]/40 overflow-hidden my-auto max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E2D5C3] bg-[#F5F0E6] flex items-center justify-between">
          <div>
            <h2 className="font-zen text-2xl font-bold text-[#241E1A] flex items-center gap-2">
              <span>Đặt Hàng An Yên</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#35483C] text-[#F5F0E6] font-normal">
                Mua nhanh không cần tài khoản
              </span>
            </h2>
            <p className="text-xs text-[#624832]/80 mt-0.5">
              Giao hàng tận nơi toàn quốc • Kiểm tra hàng trước khi nhận
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 text-[#624832] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-7 space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Thông tin người nhận */}
          <div>
            <h3 className="text-xs font-bold text-[#241E1A] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#35483C] text-white flex items-center justify-center text-[11px]">
                1
              </span>
              <span>Thông tin nhận hàng</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#624832] mb-1">
                  Họ và tên người nhận <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn An Nhiên"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CEBE] bg-white text-xs text-[#241E1A] focus:outline-none focus:border-[#35483C] focus:ring-1 focus:ring-[#35483C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#624832] mb-1">
                  Số điện thoại nhận hàng <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0909123456"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CEBE] bg-white text-xs text-[#241E1A] focus:outline-none focus:border-[#35483C] focus:ring-1 focus:ring-[#35483C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#624832] mb-1">
                  Tỉnh / Thành phố <span className="text-red-600">*</span>
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CEBE] bg-white text-xs text-[#241E1A] focus:outline-none focus:border-[#35483C]"
                >
                  {VIETNAMESE_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#624832] mb-1">
                  Quận / Huyện / Thị xã
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Quận 1 / Phường Bến Thành"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CEBE] bg-white text-xs text-[#241E1A] focus:outline-none focus:border-[#35483C]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#624832] mb-1">
                  Số nhà, tên đường chi tiết <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 128 Đường Lê Lợi, Chung cư A, Phòng 402"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CEBE] bg-white text-xs text-[#241E1A] focus:outline-none focus:border-[#35483C]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#624832] mb-1">
                  Ghi chú cho tiệm (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi tới..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CEBE] bg-white text-xs text-[#241E1A] focus:outline-none focus:border-[#35483C]"
                />
              </div>
            </div>
          </div>

          {/* 2. Dịch vụ Gói Quà An Yên */}
          <div className="p-4 rounded-2xl bg-[#FAF0E1] border border-[#E2D5C3]">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={giftWrapEnabled}
                  onChange={(e) => setGiftWrapEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-[#35483C] focus:ring-[#35483C]"
                />
                <span className="text-xs font-bold text-[#241E1A] flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-[#C6A667]" />
                  <span>Dịch vụ "Gói quà An Yên" (+{formatVND(giftWrapFee)})</span>
                </span>
              </label>
            </div>
            <p className="text-[11px] text-[#624832]/80 mt-1 ml-6">
              "Gửi một chút an yên đến người thương" — Hộp quà gói thủ công trang nhã kèm thiệp giấy dó viết tay lời chúc.
            </p>

            {giftWrapEnabled && (
              <div className="mt-3.5 pt-3 border-t border-[#E2D5C3] grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#624832] mb-1">
                    Tên người gửi (bạn)
                  </label>
                  <input
                    type="text"
                    placeholder="Tên của bạn"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8CEBE] bg-white text-xs text-[#241E1A]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#624832] mb-1">
                    Tên người nhận quà
                  </label>
                  <input
                    type="text"
                    placeholder="Tên người nhận"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8CEBE] bg-white text-xs text-[#241E1A]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-[#624832] mb-1">
                    Lời nhắn yêu thương viết lên thiệp
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Chúc bạn luôn tìm thấy an yên trong từng khoảnh khắc..."
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8CEBE] bg-white text-xs text-[#241E1A]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Phương thức thanh toán */}
          <div>
            <h3 className="text-xs font-bold text-[#241E1A] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#35483C] text-white flex items-center justify-center text-[11px]">
                2
              </span>
              <span>Phương thức thanh toán</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* VietQR Chuyển khoản */}
              <div
                onClick={() => bankTransferAvailable && setPaymentMethod('BANK_TRANSFER')}
                aria-disabled={!bankTransferAvailable}
                className={`p-4 rounded-2xl border transition flex items-start gap-3 ${
                  bankTransferAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                } ${
                  effectivePaymentMethod === 'BANK_TRANSFER'
                    ? 'border-[#35483C] bg-white shadow-xs ring-1 ring-[#35483C]'
                    : 'border-[#D8CEBE] bg-white/60 hover:bg-white'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    effectivePaymentMethod === 'BANK_TRANSFER'
                      ? 'bg-[#35483C] text-white'
                      : 'bg-[#F0EAE0] text-[#624832]'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-[#241E1A]">Chuyển Khoản VietQR</h4>
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#C6A667]/20 text-[#624832] rounded font-semibold">
                      Khuyên Dùng
                    </span>
                  </div>
                  <p className="text-[11px] text-[#624832]/80 mt-0.5 leading-relaxed">
                    {bankTransferAvailable
                      ? 'Quét mã QR tự động điền số tiền và mã đơn. Xác nhận nhanh gọn qua app ngân hàng.'
                      : 'Tiệm đang tạm ngưng nhận chuyển khoản, vui lòng chọn thanh toán khi nhận hàng.'}
                  </p>
                </div>
              </div>

              {/* COD */}
              <div
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                  effectivePaymentMethod === 'COD'
                    ? 'border-[#35483C] bg-white shadow-xs ring-1 ring-[#35483C]'
                    : 'border-[#D8CEBE] bg-white/60 hover:bg-white'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    effectivePaymentMethod === 'COD'
                      ? 'bg-[#35483C] text-white'
                      : 'bg-[#F0EAE0] text-[#624832]'
                  }`}
                >
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#241E1A]">Thanh Toán Khi Nhận (COD)</h4>
                  <p className="text-[11px] text-[#624832]/80 mt-0.5 leading-relaxed">
                    Nhận hàng tại nhà, kiểm tra hàng an tâm rồi thanh toán tiền mặt cho shipper.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Tổng kết tiền đơn hàng */}
          <div className="p-4 rounded-2xl bg-[#F0EAE0] border border-[#D8CEBE] space-y-2 text-xs">
            <div className="flex justify-between text-[#624832]">
              <span>Tiền hàng ({items.length} món):</span>
              <span className="font-semibold text-[#241E1A]">{formatVND(subtotal)}</span>
            </div>

            <div className="flex justify-between text-[#624832]">
              <span>Phí vận chuyển:</span>
              <span>
                {actualShippingFee === 0 ? (
                  <span className="text-emerald-700 font-semibold">Miễn phí</span>
                ) : (
                  formatVND(actualShippingFee)
                )}
              </span>
            </div>

            {giftWrapEnabled && (
              <div className="flex justify-between text-[#624832]">
                <span>Phí dịch vụ gói quà:</span>
                <span className="font-semibold text-[#241E1A]">{formatVND(actualGiftWrapFee)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-[#D8CEBE] flex justify-between items-baseline text-sm">
              <span className="font-bold text-[#241E1A]">TỔNG THANH TOÁN:</span>
              <span className="font-bold text-xl text-[#35483C]">{formatVND(totalAmount)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-[#35483C] hover:bg-[#28382E] text-[#F5F0E6] font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang khởi tạo đơn hàng an yên...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[#C6A667]" />
                  <span>XÁC NHẬN ĐẶT HÀNG NGAY</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-[#624832]/70 mt-2">
              Bằng việc bấm xác nhận, đơn hàng của bạn sẽ được gửi thẳng vào hệ thống tiệm xử lý.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
