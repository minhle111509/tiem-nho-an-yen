import React from 'react';
import { Home, Store, BookOpen, Search, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface BottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  isAdminLoggedIn: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onNavigate,
  isAdminLoggedIn,
}) => {
  const { itemCount, setIsCartOpen } = useCart();

  const navItems = [
    { id: 'home', label: 'Trang Chủ', icon: Home },
    { id: 'shop', label: 'Cửa Tiệm', icon: Store },
    { id: 'stories', label: 'Góc An Yên', icon: BookOpen },
    { id: 'tracking', label: 'Tra Cứu', icon: Search },
    { id: 'admin', label: 'Chủ Tiệm', icon: ShieldCheck },
  ];

  return (
    <>
      {/* Floating Cart Button for Mobile when items exist */}
      {itemCount > 0 && currentTab !== 'admin' && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-20 right-4 z-40 md:hidden p-3.5 rounded-full bg-[#35483C] text-[#F5F0E6] shadow-xl border-2 border-[#C6A667] flex items-center justify-center transition-transform active:scale-95"
          aria-label="Xem giỏ hàng"
        >
          <ShoppingBag className="w-5 h-5 text-[#C6A667]" />
          <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
            {itemCount}
          </span>
        </button>
      )}

      {/* Fixed Bottom Navigation Bar for Mobile Phones */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF6EE]/95 backdrop-blur-md border-t border-[#E2D5C3] md:hidden px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
                isActive
                  ? 'text-[#35483C] font-bold'
                  : 'text-[#624832]/70 hover:text-[#241E1A]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] text-[#35483C]' : ''}`} />
                {item.id === 'admin' && isAdminLoggedIn && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
