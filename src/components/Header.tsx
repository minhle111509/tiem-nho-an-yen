import React from 'react';
import { ShoppingBag, Search, ShieldCheck, Sparkles, Download } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { StoreSettings } from '../types';

interface HeaderProps {
  settings: Partial<StoreSettings>;
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenSearch: () => void;
  isAdminLoggedIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentTab,
  onNavigate,
  onOpenSearch,
  isAdminLoggedIn,
}) => {
  const { itemCount, setIsCartOpen } = useCart();
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = React.useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#F5F0E6]/95 backdrop-blur-md border-b border-[#E5DCB/40] border-amber-900/10 transition-all">
        {/* Top Serene Announcement bar */}
        <div className="bg-[#35483C] text-[#F5F0E6] text-xs py-1.5 px-4 text-center tracking-wide font-light flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#C6A667] animate-pulse" />
          <span>
            {settings.slogan || 'Một chút an yên, gửi đến bạn.'} • Miễn phí vận chuyển cho đơn từ 500.000₫
          </span>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo & Brand Identity */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <div className="w-10 h-10 rounded-full bg-[#FAF6EE] border border-[#C6A667]/40 flex items-center justify-center p-1.5 shadow-sm group-hover:border-[#C6A667] transition">
              <img src="/icon.svg" alt="Tiệm Nhỏ An Yên" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-zen text-xl sm:text-2xl font-bold tracking-wider text-[#241E1A] leading-tight">
                {settings.storeName || 'TIỆM NHỎ AN YÊN'}
              </div>
              <div className="text-[11px] text-[#624832]/80 tracking-widest uppercase font-light hidden sm:block">
                Zen Vintage & Oriental Calm
              </div>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#624832]">
            <button
              onClick={() => onNavigate('home')}
              className={`transition hover:text-[#35483C] ${currentTab === 'home' ? 'text-[#35483C] font-semibold border-b-2 border-[#35483C]' : ''}`}
            >
              Trang Chủ
            </button>
            <button
              onClick={() => onNavigate('shop')}
              className={`transition hover:text-[#35483C] ${currentTab === 'shop' ? 'text-[#35483C] font-semibold border-b-2 border-[#35483C]' : ''}`}
            >
              Cửa Tiệm
            </button>
            <button
              onClick={() => onNavigate('stories')}
              className={`transition hover:text-[#35483C] ${currentTab === 'stories' ? 'text-[#35483C] font-semibold border-b-2 border-[#35483C]' : ''}`}
            >
              Góc An Yên
            </button>
            <button
              onClick={() => onNavigate('tracking')}
              className={`transition hover:text-[#35483C] ${currentTab === 'tracking' ? 'text-[#35483C] font-semibold border-b-2 border-[#35483C]' : ''}`}
            >
              Tra Cứu Đơn
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button if available */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#FAF6EE] text-[#35483C] border border-[#35483C]/30 hover:bg-[#35483C] hover:text-[#F5F0E6] transition shadow-xs"
                title="Cài đặt ứng dụng về màn hình chính"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Cài App</span>
              </button>
            )}

            {!isInstalled && isIOS && (
              <button
                onClick={() => setShowIOSModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#FAF6EE] text-[#35483C] border border-[#35483C]/30 hover:bg-[#35483C] hover:text-[#F5F0E6] transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Cài iOS</span>
              </button>
            )}

            {/* Search Icon */}
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-full hover:bg-black/5 text-[#624832] transition"
              title="Tìm kiếm vật phẩm"
              aria-label="Tìm kiếm"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Cart Icon with Counter */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-black/5 text-[#241E1A] transition"
              title="Giỏ hàng"
              aria-label="Giỏ hàng"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#35483C] text-[#F5F0E6] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-[#F5F0E6] shadow-sm">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Admin Entrance */}
            <button
              onClick={() => onNavigate('admin')}
              className={`p-2 rounded-full transition ${
                isAdminLoggedIn || currentTab === 'admin'
                  ? 'bg-[#35483C] text-[#F5F0E6]'
                  : 'hover:bg-black/5 text-[#624832]/80'
              }`}
              title="Trang quản trị chủ tiệm"
              aria-label="Quản trị"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* iOS Installation Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-[#FAF6EE] max-w-sm w-full p-6 rounded-2xl shadow-2xl border border-[#C6A667]/40 text-[#241E1A]">
            <h3 className="font-zen text-xl font-bold mb-2">Thêm Tiệm Nhỏ An Yên vào Màn Hình Chính</h3>
            <p className="text-sm text-[#624832] mb-4 leading-relaxed">
              1. Bấm vào biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh công cụ dưới Safari.
              <br />
              2. Kéo xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-[#35483C] text-[#F5F0E6] rounded-xl font-medium text-sm hover:bg-[#28382E] transition"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
