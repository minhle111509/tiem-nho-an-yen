import React, { useState } from 'react';
import { Order, StoreSettings } from '../types';
import { MomoPaymentBlock } from './MomoPaymentBlock';
import { formatVND, formatDate, getVietQRImageUrl } from '../utils/format';
import {
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Heart,
  Truck,
  X,
} from 'lucide-react';

interface OrderSuccessModalProps {
  order: Order | null;
  settings: Partial<StoreSettings>;
  onClose: () => void;
  onTrackOrder: (orderId: string, phone: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  settings,
  onClose,
  onTrackOrder,
}) => {
  if (!order) return null;

  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);

  const snapshot = order.bankSnapshot;
  const bankName = snapshot?.bankName || settings.bankName || 'Ngân hàng Quân Đội (MB Bank)';
  const bankCode = snapshot?.bankCode || settings.bankCode || 'MB';
  const accountNumber = snapshot?.accountNumber || settings.accountNumber || '';
  const accountHolder = snapshot?.accountHolder || settings.accountHolder || 'TIEM NHO AN YEN';
  const customQrImage = snapshot?.customQrImage || settings.customQrImage;
  const useDynamicVietQr = snapshot?.useDynamicVietQr !== undefined ? snapshot.useDynamicVietQr : (settings.useDynamicVietQr !== false);

  const qrImageUrl = (!useDynamicVietQr && customQrImage)
    ? customQrImage
    : getVietQRImageUrl(bankCode, accountNumber, order.totalAmount, order.id, accountHolder);

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-[#FAF6EE] rounded-3xl shadow-2xl border border-[#C6A667]/40 overflow-hidden my-auto max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="bg-[#35483C] text-[#F5F0E6] p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-[#F5F0E6]/80 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto rounded-full bg-[#FAF6EE] text-[#35483C] flex items-center justify-center mb-3 shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="font-zen text-2xl sm:text-3xl font-bold tracking-wide">
            Đặt Hàng Thành Công!
          </h2>
          <p className="text-xs text-[#FAF6EE]/80 mt-1">
            Cảm ơn bạn đã hữu duyên chọn Tiệm Nhỏ An Yên
          </p>

          <div className="inline-block mt-3 px-4 py-1.5 rounded-full bg-[#FAF6EE]/20 border border-[#C6A667]/40 text-xs font-mono font-bold tracking-widest text-[#F5F0E6]">
            MÃ ĐƠN: {order.id}
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-5 flex-1 text-xs">
          {/* VietQR Section if BANK_TRANSFER */}
          {order.paymentMethod === 'BANK_TRANSFER' ? (
            <div className="p-4 rounded-2xl bg-white border border-[#C6A667]/60 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#35483C] mb-2">
                <QrCode className="w-4 h-4 text-[#C6A667]" />
                <span>QUÉT MÃ VIETQR ĐỂ HOÀN TẤT THANH TOÁN</span>
              </div>
              <p className="text-[11px] text-[#624832]/80 mb-4 leading-relaxed">
                Mở ứng dụng ngân hàng bất kỳ (MB, Vietcombank, Techcombank, Momo...) và quét mã bên dưới để thanh toán chính xác:
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* QR Code image */}
                <div className="w-44 h-44 rounded-xl overflow-hidden border border-[#D8CEBE] p-1 bg-white shrink-0 shadow-xs">
                  <img
                    src={qrImageUrl}
                    alt="Mã QR Chuyển Khoản"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Bank Details with Copy buttons */}
                <div className="flex-1 w-full space-y-2.5">
                  <div className="p-2 rounded-lg bg-[#FAF6EE] border border-[#E2D5C3]">
                    <span className="text-[10px] text-[#624832]/70 block">Ngân hàng:</span>
                    <strong className="text-[#241E1A] font-semibold">{bankName}</strong>
                  </div>

                  <div className="p-2 rounded-lg bg-[#FAF6EE] border border-[#E2D5C3] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#624832]/70 block">Số tài khoản:</span>
                      <strong className="text-[#35483C] font-mono text-sm font-bold">
                        {accountNumber}
                      </strong>
                    </div>
                    <button
                      onClick={() => copyToClipboard(accountNumber, setCopiedAccount)}
                      className="p-1.5 rounded-md bg-white border border-[#D8CEBE] hover:bg-[#F5F0E6] text-[#624832] transition"
                      title="Sao chép số tài khoản"
                    >
                      {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-2 rounded-lg bg-[#FAF6EE] border border-[#E2D5C3]">
                    <span className="text-[10px] text-[#624832]/70 block">Chủ tài khoản:</span>
                    <strong className="text-[#241E1A] font-semibold">{accountHolder}</strong>
                  </div>

                  <div className="p-2 rounded-lg bg-[#FAF6EE] border border-[#E2D5C3] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#624832]/70 block">Số tiền & Nội dung chuyển:</span>
                      <strong className="text-[#35483C] text-xs font-bold block">
                        {formatVND(order.totalAmount)}
                      </strong>
                      <span className="font-mono text-[#241E1A] font-semibold">{order.id}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(order.id, setCopiedMemo)}
                      className="p-1.5 rounded-md bg-white border border-[#D8CEBE] hover:bg-[#F5F0E6] text-[#624832] transition"
                      title="Sao chép nội dung chuyển khoản"
                    >
                      {copiedMemo ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {settings.momoQrImage && (
                <MomoPaymentBlock qrImage={settings.momoQrImage} amount={order.totalAmount} orderId={order.id} />
              )}

              <div className="mt-3 pt-3 border-t border-[#E2D5C3] text-[11px] text-[#624832]/80 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Chủ tiệm sẽ kiểm tra và xác nhận trạng thái ngay khi giao dịch thành công.</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#FAF0E1] border border-[#E2D5C3] flex items-start gap-3">
              <Truck className="w-5 h-5 text-[#35483C] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#241E1A] text-xs">Phương thức: Thanh toán khi nhận hàng (COD)</h4>
                <p className="text-[11px] text-[#624832]/80 mt-1 leading-relaxed">
                  Tiệm sẽ liên hệ số điện thoại <strong>{order.customerPhone}</strong> để xác nhận đơn và chuẩn bị giao hàng. Quý khách vui lòng chuẩn bị <strong>{formatVND(order.totalAmount)}</strong> khi nhận hàng.
                </p>
              </div>
            </div>
          )}

          {/* Order Summary details */}
          <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E2D5C3] space-y-2">
            <h4 className="font-bold text-[#241E1A] mb-2 uppercase tracking-wider text-[11px]">
              Sản phẩm đã chọn:
            </h4>
            <div className="space-y-2 divide-y divide-[#E2D5C3]">
              {order.items.map((it, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <img src={it.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    <div>
                      <p className="font-medium text-[#241E1A] line-clamp-1">{it.productName}</p>
                      <p className="text-[10px] text-[#624832]/70">
                        {it.variationName ? `${it.variationName} • ` : ''}SL: {it.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-[#35483C]">{formatVND(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#D8CEBE] space-y-1">
              <div className="flex justify-between text-[#624832]">
                <span>Địa chỉ giao hàng:</span>
                <span className="font-medium text-right text-[#241E1A] max-w-[60%]">
                  {order.address}, {order.district ? `${order.district}, ` : ''}{order.province}
                </span>
              </div>
              <div className="flex justify-between text-[#624832]">
                <span>Người nhận:</span>
                <span className="font-medium text-[#241E1A]">{order.customerName} ({order.customerPhone})</span>
              </div>
              {order.giftWrap?.enabled && (
                <div className="flex justify-between text-[#624832]">
                  <span>Gói quà An Yên:</span>
                  <span className="font-semibold text-[#35483C]">Có ({formatVND(order.giftWrapFee)})</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#241E1A] pt-1">
                <span>Tổng cộng:</span>
                <span className="text-[#35483C] text-base">{formatVND(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                onClose();
                onTrackOrder(order.id, order.customerPhone);
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-[#35483C] text-[#F5F0E6] font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#28382E] transition shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-[#C6A667]" />
              <span>Theo dõi tiến độ đơn hàng</span>
            </button>

            <button
              onClick={onClose}
              className="py-3 px-5 rounded-xl border border-[#35483C]/30 text-[#624832] font-semibold text-xs hover:bg-black/5 transition cursor-pointer"
            >
              Tiếp tục dạo xem tiệm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
