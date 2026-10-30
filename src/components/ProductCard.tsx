import React from 'react';
import { Product } from '../types';
import { formatVND } from '../utils/format';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Eye, Zap } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct }) => {
  const { addToCart, buyNow } = useCart();

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  return (
    <div className="group relative flex flex-col rounded-2xl bg-[#FAF6EE] border border-[#E3D7C4] overflow-hidden hover:border-[#C6A667] hover:shadow-lg transition-all duration-300">
      {/* Product Image Container */}
      <div
        onClick={() => onSelectProduct(product)}
        className="relative w-full aspect-square overflow-hidden bg-[#ECE3D4] cursor-pointer"
      >
        <img
          src={product.images[0] || '/logo-192.png'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {discountPercent && (
            <span className="px-2 py-0.5 rounded-md bg-[#35483C] text-[#F5F0E6] text-[10px] font-bold tracking-wider shadow-xs">
              -{discountPercent}%
            </span>
          )}
          {product.isNewArrival && (
            <span className="px-2 py-0.5 rounded-md bg-[#C6A667] text-[#241E1A] text-[10px] font-bold tracking-wider shadow-xs">
              MỚI VỀ
            </span>
          )}
        </div>

        {/* Quick View Button on Hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectProduct(product);
          }}
          className="absolute bottom-3 right-3 p-2 rounded-full bg-[#FAF6EE]/90 text-[#241E1A] opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md hover:bg-white"
          title="Xem chi tiết"
          aria-label="Xem chi tiết"
        >
          <Eye className="w-4 h-4 text-[#35483C]" />
        </button>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
            <span className="px-3 py-1 bg-red-800 text-white text-xs font-semibold rounded-full">
              Tạm hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-[#624832]/70 mb-1">
            <span className="uppercase tracking-wider">{product.sku}</span>
            {isLowStock && (
              <span className="text-amber-700 font-medium">Chỉ còn {product.stock} món</span>
            )}
          </div>

          <h3
            onClick={() => onSelectProduct(product)}
            className="font-zen text-base sm:text-lg font-semibold text-[#241E1A] line-clamp-2 hover:text-[#35483C] cursor-pointer transition mb-2"
          >
            {product.name}
          </h3>

          <p className="text-xs text-[#624832]/80 line-clamp-1 mb-3">
            {product.material}
          </p>
        </div>

        {/* Price & CTA Buttons */}
        <div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base sm:text-lg font-bold text-[#35483C]">
              {formatVND(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-[#624832]/60 line-through">
                {formatVND(product.compareAtPrice)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addToCart(product, 1)}
              disabled={isOutOfStock}
              className="py-2 px-2.5 rounded-xl border border-[#35483C]/30 bg-transparent hover:bg-[#35483C]/10 text-[#35483C] text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Thêm vào giỏ"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="truncate">Thêm Giỏ</span>
            </button>

            <button
              onClick={() => buyNow(product, 1)}
              disabled={isOutOfStock}
              className="py-2 px-2.5 rounded-xl bg-[#35483C] hover:bg-[#28382E] text-[#F5F0E6] text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-[#C6A667]" />
              <span className="truncate">MUA NGAY</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
