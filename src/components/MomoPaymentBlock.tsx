import React, { useState } from 'react';
import { formatVND } from '../utils/format';
import { Wallet, Copy, Check } from 'lucide-react';

interface MomoPaymentBlockProps {
  qrImage: string;
  amount: number;
  orderId: string;
  className?: string;
}

// Static MoMo QR cannot carry amount/memo, so we spell both out with copy buttons
export const MomoPaymentBlock: React.FC<MomoPaymentBlockProps> = ({
  qrImage,
  amount,
  orderId,
  className = 'mt-4 pt-4 border-t border-[#E2D5C3]',
}) => {
  const [copied, setCopied] = useState<'amount' | 'memo' | null>(null);

  const copy = (text: string, which: 'amount' | 'memo') => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 text-xs font-bold text-[#35483C] mb-3">
        <Wallet className="w-4 h-4 text-[#C6A667]" />
        <span>HOẶC THANH TOÁN QUA VÍ MOMO</span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-36 h-36 rounded-xl overflow-hidden border border-[#D8CEBE] p-1 bg-white shrink-0">
          <img src={qrImage} alt="Mã QR MoMo" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 w-full space-y-2 text-[11px] text-[#624832]/90 leading-relaxed">
          <p>
            Mở app <strong>MoMo</strong> → quét mã → bấm <strong>"Thêm số tiền"</strong> và nhập đúng số tiền, lời nhắn ghi mã đơn:
          </p>
          <div className="p-2 rounded-lg bg-[#FAF6EE] border border-[#E2D5C3] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#624832]/70 block">Số tiền:</span>
              <strong className="text-[#35483C] text-xs font-bold">{formatVND(amount)}</strong>
            </div>
            <button
              type="button"
              onClick={() => copy(String(amount), 'amount')}
              className="p-1.5 rounded-md bg-white border border-[#D8CEBE] hover:bg-[#F5F0E6] text-[#624832] transition"
              title="Sao chép số tiền"
            >
              {copied === 'amount' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="p-2 rounded-lg bg-[#FAF6EE] border border-[#E2D5C3] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#624832]/70 block">Lời nhắn:</span>
              <span className="font-mono text-[#241E1A] font-semibold">{orderId}</span>
            </div>
            <button
              type="button"
              onClick={() => copy(orderId, 'memo')}
              className="p-1.5 rounded-md bg-white border border-[#D8CEBE] hover:bg-[#F5F0E6] text-[#624832] transition"
              title="Sao chép mã đơn"
            >
              {copied === 'memo' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
