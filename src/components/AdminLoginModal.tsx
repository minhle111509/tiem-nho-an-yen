import React, { useState } from 'react';
import { api } from '../api';
import { ShieldCheck, Lock, X, Loader2, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;

    setLoading(true);
    setError(null);
    try {
      await api.adminLogin(pin);
      onSuccess(pin);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Mã PIN quản trị không đúng.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + val);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="bg-[#FAF6EE] max-w-sm w-full p-6 sm:p-8 rounded-3xl shadow-2xl border border-[#C6A667]/40 text-[#241E1A]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#35483C] text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-zen text-xl font-bold">Chủ Tiệm Đăng Nhập</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 text-[#624832]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#624832]/80 mb-5 leading-relaxed">
          Nhập mã PIN quản trị để vào bảng điều khiển đơn hàng và kho sản phẩm trên điện thoại.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PIN Dots Indicator */}
          <div className="flex justify-center gap-3 my-4">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border border-[#35483C] transition-all ${
                  idx < pin.length ? 'bg-[#35483C] scale-110' : 'bg-transparent'
                }`}
              />
            ))}
          </div>

          {/* Touch Number Pad for Mobile */}
          <div className="grid grid-cols-3 gap-2.5 my-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  if (k === 'C') setPin('');
                  else if (k === '⌫') handleBackspace();
                  else handleKeypadPress(k);
                }}
                className="py-3 rounded-xl bg-white hover:bg-[#F0EAE0] border border-[#D8CEBE] font-bold text-base text-[#241E1A] shadow-xs active:bg-[#E5DCB] transition cursor-pointer"
              >
                {k}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || pin.length === 0}
            className="w-full py-3.5 rounded-xl bg-[#35483C] text-[#F5F0E6] text-xs font-bold hover:bg-[#28382E] transition shadow-md flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 text-[#C6A667]" />}
            <span>Vào Bảng Quản Trị</span>
          </button>
        </form>
      </div>
    </div>
  );
};
