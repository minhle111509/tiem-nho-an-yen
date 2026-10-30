import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { formatVND, normalizeSearchText } from '../utils/format';
import { Search, X, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const results = query.trim()
    ? products.filter((p) => {
        const q = normalizeSearchText(query);
        return [p.name, p.sku, p.material, p.meaning].some((field) => normalizeSearchText(field).includes(q));
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-xl bg-[#FAF6EE] rounded-3xl shadow-2xl border border-[#C6A667]/40 overflow-hidden text-[#241E1A]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input bar */}
        <div className="p-4 border-b border-[#E2D5C3] flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-[#35483C] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Tìm theo tên đá, thạch anh, ngọc bích, nụ trầm, tỳ hưu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm bg-transparent focus:outline-none text-[#241E1A]"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 text-[#624832]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-2">
          {query.trim() === '' ? (
            <div className="text-center py-8 text-xs text-[#624832]/70">
              <p className="font-medium text-[#241E1A] mb-1">Gợi ý tìm kiếm:</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {['Thạch anh trắng', 'Ngọc bích', 'Nụ trầm hương', 'Lư đồng', 'Tỳ hưu', 'Hoa sen'].map(
                  (tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="px-2.5 py-1 rounded-full bg-[#F0EAE0] hover:bg-[#E5DCB] text-[#624832] transition"
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#624832]">
              Không tìm thấy vật phẩm nào khớp với từ khóa "{query}".
            </div>
          ) : (
            results.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProduct(p);
                  onClose();
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white cursor-pointer transition border border-transparent hover:border-[#E2D5C3]"
              >
                <img
                  src={p.images[0] || '/icon.svg'}
                  alt={p.name}
                  className="w-12 h-12 rounded-lg object-cover bg-[#ECE3D4] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-zen text-sm font-bold text-[#241E1A] truncate">
                    {p.name}
                  </h4>
                  <p className="text-[11px] text-[#624832]/80 truncate">{p.material}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-[#35483C]">{formatVND(p.price)}</span>
                  <span className="text-[10px] text-[#C6A667] flex items-center justify-end gap-0.5 mt-0.5">
                    Xem <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
