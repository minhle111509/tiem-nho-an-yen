import React, { useState } from 'react';
import { Article, Product } from '../types';
import { BookOpen, Calendar, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { formatDate } from '../utils/format';

interface GocAnYenViewProps {
  articles: Article[];
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const GocAnYenView: React.FC<GocAnYenViewProps> = ({
  articles,
  products,
  onSelectProduct,
}) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const getRelatedProducts = (ids?: string[]) => {
    if (!ids || ids.length === 0) return [];
    return products.filter((p) => ids.includes(p.id));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Section Header */}
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-widest text-[#C6A667] font-semibold">
          Tri Thức & Chiêm Nghiệm
        </span>
        <h1 className="font-zen text-3xl sm:text-5xl text-[#241E1A] mt-1 mb-3">
          Góc An Yên
        </h1>
        <p className="text-xs sm:text-base text-[#624832]/80 max-w-xl mx-auto font-light leading-relaxed">
          Nơi sẻ chia những mẩu chuyện về trầm hương, đá quý thiên nhiên và nghệ thuật an trú giữa dòng đời hối hả.
        </p>
        <div className="w-16 h-0.5 bg-[#C6A667] mx-auto mt-4 opacity-70" />
      </div>

      {selectedArticle ? (
        /* Detailed Article View */
        <div className="bg-[#FAF6EE] rounded-3xl p-6 sm:p-10 border border-[#E2D5C3] shadow-sm">
          <button
            onClick={() => setSelectedArticle(null)}
            className="text-xs text-[#35483C] font-semibold mb-6 inline-flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            ← Quay lại danh sách bài viết
          </button>

          <div className="flex items-center gap-2 text-xs text-[#624832]/70 mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-[#35483C]/10 text-[#35483C] font-medium">
              {selectedArticle.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(selectedArticle.publishedAt)}
            </span>
          </div>

          <h2 className="font-zen text-2xl sm:text-4xl font-bold text-[#241E1A] leading-snug mb-6">
            {selectedArticle.title}
          </h2>

          <div className="aspect-video w-full rounded-2xl overflow-hidden mb-8 shadow-sm">
            <img
              src={selectedArticle.image}
              alt={selectedArticle.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="prose prose-stone max-w-none text-[#624832] text-sm sm:text-base leading-relaxed whitespace-pre-line mb-10 font-light">
            {selectedArticle.content}
          </div>

          {/* Related Products within Article */}
          {selectedArticle.relatedProductIds && selectedArticle.relatedProductIds.length > 0 && (
            <div className="pt-8 border-t border-[#E2D5C3]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#35483C] uppercase tracking-wider mb-4">
                <Sparkles className="w-4 h-4 text-[#C6A667]" />
                <span>Vật phẩm an lành gắn liền với câu chuyện:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getRelatedProducts(selectedArticle.relatedProductIds).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectProduct(p)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#E2D5C3] hover:border-[#C6A667] cursor-pointer transition shadow-xs"
                  >
                    <img
                      src={p.images[0] || '/icon.svg'}
                      alt={p.name}
                      className="w-16 h-16 rounded-xl object-cover bg-[#ECE3D4] shrink-0"
                    />
                    <div className="flex-1">
                      <h4 className="font-zen text-sm font-bold text-[#241E1A] line-clamp-1">
                        {p.name}
                      </h4>
                      <p className="text-xs text-[#35483C] font-bold mt-0.5">
                        {p.material}
                      </p>
                      <span className="text-[11px] text-[#C6A667] font-semibold flex items-center gap-1 mt-1">
                        Xem chi tiết <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Articles Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.map((art) => (
            <article
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="group bg-[#FAF6EE] rounded-3xl border border-[#E2D5C3] overflow-hidden hover:border-[#C6A667] hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="aspect-video w-full overflow-hidden relative">
                  <img
                    src={art.image}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#FAF6EE]/90 backdrop-blur-xs text-[#35483C] text-[10px] font-bold tracking-wider">
                    {art.category}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-1 text-[11px] text-[#624832]/70 mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(art.publishedAt)}</span>
                  </div>

                  <h3 className="font-zen text-xl sm:text-2xl font-bold text-[#241E1A] leading-snug group-hover:text-[#35483C] transition mb-3">
                    {art.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#624832]/85 line-clamp-3 leading-relaxed">
                    {art.summary}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 flex items-center justify-between text-xs font-semibold text-[#35483C] group-hover:text-[#C6A667] transition">
                <span>Đọc câu chuyện</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
