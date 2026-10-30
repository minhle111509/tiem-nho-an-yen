import React from 'react';
import { ArrowRight, Compass, Shield, HeartHandshake } from 'lucide-react';

interface HeroBannerProps {
  onExplore: () => void;
  homeHeroQuote?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExplore, homeHeroQuote }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#ECE4D5]/70 via-[#F5F0E6] to-[#F5F0E6] border-b border-[#E5DCB]/40 py-12 md:py-20 px-4">
      {/* Subtle Zen Watermark Background */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 opacity-5 pointer-events-none">
        <img src="/icon.svg" alt="" className="w-full h-full object-contain filter grayscale" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF6EE] border border-[#C6A667]/50 text-xs font-medium text-[#35483C] mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#C6A667] animate-ping" />
          <span>Zen Vintage & Oriental Minimalism</span>
        </div>

        <h1 className="font-zen text-3xl sm:text-5xl md:text-6xl font-normal text-[#241E1A] tracking-tight leading-tight sm:leading-snug mb-6">
          {homeHeroQuote || 'Giữa những bộn bề, dành một khoảng nhỏ cho bình yên.'}
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-[#624832]/90 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
          Nơi lưu giữ nét đẹp thanh khiết của đá phong thủy thiên nhiên, trang sức ngọc bình an và những làn khói trầm mộc mạc thơm ngát cho tâm hồn tĩnh tại.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onExplore}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#35483C] text-[#F5F0E6] font-medium text-sm hover:bg-[#28382E] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 group cursor-pointer"
          >
            <span>KHÁM PHÁ CỬA TIỆM</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-[#C6A667]" />
          </button>

          <a
            href="#categories"
            className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#FAF6EE] text-[#624832] border border-[#C6A667]/40 font-medium text-sm hover:bg-[#F2ECE0] transition text-center"
          >
            Xem 3 Danh Mục Chính
          </a>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 pt-8 border-t border-[#E0D5C3]/60 text-left">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF6EE]/70 border border-[#E0D5C3]/30">
            <div className="p-2 rounded-lg bg-[#35483C]/10 text-[#35483C] shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#241E1A] uppercase tracking-wider mb-0.5">Năng lượng thuần mộc</h4>
              <p className="text-xs text-[#624832]/80">100% đá tự nhiên & trầm hương nguyên chất không tẩm ướp hóa mỹ phẩm.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF6EE]/70 border border-[#E0D5C3]/30">
            <div className="p-2 rounded-lg bg-[#35483C]/10 text-[#35483C] shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#241E1A] uppercase tracking-wider mb-0.5">Đặt hàng tinh giản</h4>
              <p className="text-xs text-[#624832]/80">Không cần đăng ký tài khoản. Hỗ trợ thanh toán VietQR & COD an tâm.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF6EE]/70 border border-[#E0D5C3]/30">
            <div className="p-2 rounded-lg bg-[#35483C]/10 text-[#35483C] shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#241E1A] uppercase tracking-wider mb-0.5">Gói quà An Yên</h4>
              <p className="text-xs text-[#624832]/80">Hộp quà trang nhã cùng thiệp giấy dó viết tay gửi gắm tâm tình thương mến.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
