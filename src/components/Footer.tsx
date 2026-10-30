import React, { useState } from 'react';
import { StoreSettings } from '../types';
import { ShieldCheck, Truck, RotateCcw, Heart, Phone, MapPin, Mail, X } from 'lucide-react';

interface FooterProps {
  settings: Partial<StoreSettings>;
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  const [policyModal, setPolicyModal] = useState<{ title: string; content: string } | null>(null);

  const policies = {
    delivery: {
      title: 'Chính Sách Giao Hàng & Đồng Kiểm',
      content: `1. Phạm vi giao hàng: Toàn quốc qua các đơn vị vận chuyển uy tín (Giao Hàng Tiết Kiệm, Viettel Post).
2. Thời gian giao hàng:
- Nội thành TP.HCM & Hà Nội: 1 - 2 ngày làm việc.
- Các tỉnh thành khác: 2 - 4 ngày làm việc.
3. Cước phí vận chuyển:
- Cước cố định: 30.000₫ cho mọi đơn hàng.
- MIỄN PHÍ VẬN CHUYỂN toàn quốc cho đơn hàng từ 500.000₫ trở lên.
4. Quyền lợi đồng kiểm:
Quý khách được quyền mở hộp kiểm tra số lượng và tính nguyên vẹn của sản phẩm trước khi thanh toán cho nhân viên giao hàng.`,
    },
    return: {
      title: 'Chính Sách Đổi Trả & Bảo Hành',
      content: `1. Điều kiện đổi trả:
- Đổi mới 100% trong vòng 7 ngày nếu sản phẩm có lỗi do vận chuyển (nứt, vỡ, mẻ đá) hoặc giao sai mẫu mã so với đơn đặt.
- Đối với nụ trầm hương: Được đổi trả nếu sản phẩm bị ẩm mốc trong quá trình vận chuyển.
2. Quy trình đổi trả:
Chỉ cần liên hệ hotline/Zalo của tiệm, tiệm sẽ điều phối shipper đến tận nhà đổi sản phẩm mới hoàn toàn miễn phí.
3. Cam kết chất lượng:
Tiệm Nhỏ An Yên cam kết 100% đá tự nhiên và trầm hương mộc nguyên chất, không sử dụng hóa chất độc hại.`,
    },
    privacy: {
      title: 'Chính Sách Bảo Mật Thông Tin Khách Hàng',
      content: `1. Mục đích thu thập thông tin:
Họ tên, số điện thoại và địa chỉ nhận hàng của quý khách chỉ được sử dụng duy nhất cho mục đích in vận đơn và giao hàng.
2. Không lưu trữ thông tin ngân hàng nhạy cảm:
Mọi giao dịch chuyển khoản đều được thực hiện trực tiếp giữa ứng dụng ngân hàng của quý khách và tài khoản tiệm qua mã chuẩn VietQR.
3. Cam kết không tiết lộ:
Tiệm tuyệt đối không chia sẻ, bán hay cung cấp thông tin của quý khách cho bất kỳ bên thứ ba nào vì mục đích quảng cáo rác.`,
    },
  };

  return (
    <>
      <footer className="bg-[#241E1A] text-[#FAF6EE] pt-12 pb-24 md:pb-12 border-t border-[#C6A667]/20">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF6EE] p-1.5 flex items-center justify-center">
                <img src="/logo-192.png" alt="Tiệm Nhỏ An Yên" className="w-full h-full object-cover rounded-full" />
              </div>
              <span className="font-zen text-2xl font-bold tracking-wider text-[#FAF6EE]">
                {settings.storeName || 'TIỆM NHỎ AN YÊN'}
              </span>
            </div>

            <p className="font-zen text-base italic text-[#C6A667]">
              "{settings.slogan || 'Một chút an yên, gửi đến bạn.'}"
            </p>

            <p className="text-xs text-[#FAF6EE]/75 max-w-md leading-relaxed font-light">
              Nơi chắt chiu những điều mộc mạc và an lành từ tự nhiên. Từng viên đá thô, chuỗi ngọc hay nụ trầm đều được gói ghém bằng tất cả sự tĩnh tại và lòng trân quý.
            </p>

            <div className="space-y-1.5 text-xs text-[#FAF6EE]/80 pt-2">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C6A667] shrink-0" />
                <span>{settings.address || '36 Đường Bình An, TP. Thủ Đức, TP. Hồ Chí Minh'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C6A667] shrink-0" />
                <span>Hotline / Zalo: {settings.phone || '0909 150 900'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C6A667] shrink-0" />
                <span>{settings.email || 'lienhe@tiemnhoanyen.vn'}</span>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-zen text-base font-bold text-[#C6A667] uppercase tracking-wider">
              Khám Phá
            </h4>
            <ul className="space-y-2 text-xs text-[#FAF6EE]/80">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-[#C6A667] transition">
                  Trang chủ
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop')} className="hover:text-[#C6A667] transition">
                  Vật phẩm phong thủy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop')} className="hover:text-[#C6A667] transition">
                  Mặt dây chuyền ngọc
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop')} className="hover:text-[#C6A667] transition">
                  Nụ trầm hương Quảng Nam
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('stories')} className="hover:text-[#C6A667] transition">
                  Góc An Yên (Câu chuyện)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('tracking')} className="hover:text-[#C6A667] transition">
                  Tra cứu tiến độ đơn
                </button>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div className="space-y-3">
            <h4 className="font-zen text-base font-bold text-[#C6A667] uppercase tracking-wider">
              Chính Sách Tiệm
            </h4>
            <ul className="space-y-2 text-xs text-[#FAF6EE]/80">
              <li>
                <button
                  onClick={() => setPolicyModal(policies.delivery)}
                  className="hover:text-[#C6A667] transition text-left"
                >
                  Chính sách giao hàng & đồng kiểm
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPolicyModal(policies.return)}
                  className="hover:text-[#C6A667] transition text-left"
                >
                  Chính sách đổi trả 7 ngày
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPolicyModal(policies.privacy)}
                  className="hover:text-[#C6A667] transition text-left"
                >
                  Chính sách bảo mật thông tin
                </button>
              </li>
            </ul>

            <div className="pt-4 text-[11px] text-[#FAF6EE]/60 border-t border-[#FAF6EE]/10">
              © {new Date().getFullYear()} TIỆM NHỎ AN YÊN. Giữ trọn sự an nhiên.
            </div>
          </div>
        </div>
      </footer>

      {/* Policy Modal */}
      {policyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF6EE] max-w-lg w-full p-6 sm:p-8 rounded-3xl shadow-2xl border border-[#C6A667]/40 text-[#241E1A]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2D5C3] mb-4">
              <h3 className="font-zen text-xl font-bold text-[#35483C]">{policyModal.title}</h3>
              <button
                onClick={() => setPolicyModal(null)}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#624832]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-[#624832] leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto mb-6">
              {policyModal.content}
            </div>
            <button
              onClick={() => setPolicyModal(null)}
              className="w-full py-2.5 bg-[#35483C] text-white rounded-xl text-xs font-semibold"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
