import React from 'react';
import { Category, CategoryId } from '../types';
import { ArrowUpRight } from 'lucide-react';

interface CategorySectionProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: CategoryId | 'all') => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section id="categories" className="py-12 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <span className="text-xs uppercase tracking-widest text-[#C6A667] font-semibold">
          Không Gian Tĩnh Tại
        </span>
        <h2 className="font-zen text-2xl sm:text-4xl text-[#241E1A] mt-1 mb-3">
          Ba Dòng Vật Phẩm Cốt Lõi
        </h2>
        <div className="w-16 h-0.5 bg-[#C6A667] mx-auto opacity-70" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, idx) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer bg-[#FAF6EE] border transition-all duration-300 shadow-sm hover:shadow-xl ${
                isSelected
                  ? 'border-[#35483C] ring-2 ring-[#35483C]/30'
                  : 'border-[#E2D8C6] hover:border-[#C6A667]'
              }`}
            >
              {/* Image banner with overlay */}
              <div className="h-52 w-full overflow-hidden relative">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#241E1A]/80 via-[#241E1A]/20 to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#FAF6EE]/90 text-[#35483C] text-[10px] font-bold tracking-wider">
                  DANH MỤC 0{idx + 1}
                </span>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="font-zen text-xl sm:text-2xl font-bold tracking-wide">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#FAF6EE]/90 line-clamp-1">{cat.tagline}</p>
                </div>
              </div>

              {/* Content text & link */}
              <div className="p-5 flex flex-col justify-between">
                <p className="text-xs text-[#624832]/85 line-clamp-2 leading-relaxed mb-4">
                  {cat.description}
                </p>
                <div className="flex items-center justify-between text-xs font-semibold text-[#35483C] group-hover:text-[#C6A667] transition">
                  <span>Khám phá bộ sưu tập</span>
                  <div className="w-7 h-7 rounded-full bg-[#EFE8DC] flex items-center justify-center group-hover:bg-[#35483C] group-hover:text-white transition">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
