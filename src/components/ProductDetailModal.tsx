import React, { useState } from 'react';
import { Product, ProductVariation } from '../types';
import { formatVND } from '../utils/format';
import { useCart } from '../context/CartContext';
import {
  X,
  ShoppingBag,
  Zap,
  CheckCircle2,
  Share2,
  AlertCircle,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  const { addToCart, buyNow } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | undefined>(
    product.variations && product.variations.length > 0 ? product.variations[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const currentPrice = product.price + (selectedVariation?.priceModifier || 0);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-[#FAF6EE] rounded-3xl shadow-2xl border border-[#C6A667]/40 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#FAF6EE]/80 hover:bg-[#E5DCB] text-[#241E1A] transition shadow-xs"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-5 sm:p-8 flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Image Gallery */}
          <div className="flex flex-col gap-3">
            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-[#ECE3D4] border border-[#E0D5C3] relative">
              <img
                src={product.images[selectedImage] || '/icon.svg'}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute bottom-3 left-3 px-3 py-1 bg-[#241E1A]/70 text-[#F5F0E6] text-xs rounded-full backdrop-blur-xs">
                Ảnh {selectedImage + 1}/{product.images.length || 1}
              </div>
            </div>

            {/* Thumbnail Row */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                      selectedImage === idx ? 'border-[#35483C]' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Natural Material Disclaimer */}
            <div className="p-3.5 rounded-xl bg-[#F0E8DC] border border-[#D8CEBE] text-xs text-[#624832] flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#C6A667] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#241E1A] mb-0.5">Lưu ý tự nhiên độc bản:</p>
                <p className="text-[11px] leading-relaxed">
                  {product.categoryId === 'huong-tram-tinh-tai'
                    ? '100% trầm hương tự nhiên không tẩm hương liệu hoá chất. Thắp nơi thông thoáng.'
                    : 'Mỗi viên đá tự nhiên được tích tụ linh khí ngàn năm, mang vân đá và sắc thái độc bản riêng biệt.'}
                </p>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2 pt-2 text-xs text-[#624832]">
              <span className="flex items-center gap-1 text-[11px] font-medium">
                <Share2 className="w-3.5 h-3.5" /> Chia sẻ:
              </span>
              <button
                onClick={handleShareFacebook}
                className="px-2.5 py-1 rounded-md bg-[#FAF0E1] border border-[#D8CEBE] hover:bg-[#EFE5D5] transition"
              >
                Facebook
              </button>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-md bg-[#FAF0E1] border border-[#D8CEBE] hover:bg-[#EFE5D5] transition"
              >
                {copiedLink ? 'Đã sao chép liên kết!' : 'Sao chép link'}
              </button>
            </div>
          </div>

          {/* Right Column: Specs & Actions */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#624832]/70 mb-1.5">
                <span className="font-mono tracking-wider font-semibold">SKU: {product.sku}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-medium ${
                    isOutOfStock
                      ? 'bg-red-100 text-red-700'
                      : product.stock <= 5
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isOutOfStock
                    ? 'Tạm hết hàng'
                    : product.stock <= 5
                    ? `Chỉ còn ${product.stock} món`
                    : `Còn ${product.stock} món`}
                </span>
              </div>

              <h2 className="font-zen text-2xl sm:text-3xl font-bold text-[#241E1A] leading-snug mb-3">
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-5 p-3 rounded-xl bg-[#F0EAE0]/80">
                <span className="text-2xl sm:text-3xl font-bold text-[#35483C]">
                  {formatVND(currentPrice)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > currentPrice && (
                  <span className="text-sm text-[#624832]/60 line-through">
                    {formatVND(product.compareAtPrice)}
                  </span>
                )}
              </div>

              {/* Variations selector if applicable */}
              {product.variations && product.variations.length > 0 && (
                <div className="mb-5">
                  <label className="block text-xs font-bold text-[#241E1A] uppercase tracking-wider mb-2">
                    Lựa chọn phân loại:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variations.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariation(v)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                          selectedVariation?.id === v.id
                            ? 'bg-[#35483C] text-white border-[#35483C] shadow-xs'
                            : 'bg-white/80 text-[#624832] border-[#D8CEBE] hover:border-[#35483C]'
                        }`}
                      >
                        {v.name}{' '}
                        {v.priceModifier && v.priceModifier > 0 ? `(+${formatVND(v.priceModifier)})` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Meaning & Spiritual significance */}
              {product.meaning && (
                <div className="mb-4 p-3.5 rounded-xl bg-[#FAF0E1] border border-[#E2D5C3]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#35483C] uppercase tracking-wider mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#C6A667]" />
                    <span>Ý Nghĩa Biểu Tượng Truyền Thống</span>
                  </div>
                  <p className="text-xs text-[#624832] leading-relaxed italic">
                    "{product.meaning}"
                  </p>
                </div>
              )}

              {/* Detailed Specs list */}
              <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-[#E2D5C3] mb-4 text-[#624832]">
                <div>
                  <span className="font-semibold text-[#241E1A]">Chất liệu:</span> {product.material}
                </div>
                <div>
                  <span className="font-semibold text-[#241E1A]">Kích thước:</span> {product.dimensions}
                </div>
                <div>
                  <span className="font-semibold text-[#241E1A]">Màu sắc:</span> {product.color}
                </div>
                <div>
                  <span className="font-semibold text-[#241E1A]">Xuất xứ:</span> {product.origin}
                </div>
              </div>

              {/* Description */}
              <div className="text-xs text-[#624832]/90 leading-relaxed mb-4">
                <p className="font-semibold text-[#241E1A] mb-1">Mô tả chi tiết:</p>
                <p>{product.description}</p>
              </div>

              {/* Instructions */}
              <div className="text-xs text-[#624832]/80 leading-relaxed mb-6 space-y-1">
                <p>
                  <strong className="text-[#241E1A]">Hướng dẫn an yên:</strong> {product.usageInstructions}
                </p>
                <p>
                  <strong className="text-[#241E1A]">Bảo quản:</strong> {product.careInstructions}
                </p>
              </div>
            </div>

            {/* Bottom Actions Sticky Container */}
            <div className="pt-4 border-t border-[#E2D5C3] flex flex-col gap-3">
              {/* Quantity selector */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#241E1A]">Số lượng:</span>
                <div className="flex items-center border border-[#D8CEBE] rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1 text-sm font-bold text-[#624832] hover:bg-[#F5F0E6] transition"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-xs font-semibold text-[#241E1A]">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="px-3 py-1 text-sm font-bold text-[#624832] hover:bg-[#F5F0E6] transition disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    addToCart(product, quantity, selectedVariation);
                    onClose();
                  }}
                  disabled={isOutOfStock}
                  className="py-3 px-4 rounded-xl border border-[#35483C] text-[#35483C] hover:bg-[#35483C]/10 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>THÊM VÀO GIỎ</span>
                </button>

                <button
                  onClick={() => {
                    buyNow(product, quantity, selectedVariation);
                    onClose();
                  }}
                  disabled={isOutOfStock}
                  className="py-3 px-4 rounded-xl bg-[#35483C] hover:bg-[#28382E] text-[#F5F0E6] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-[#C6A667]" />
                  <span>MUA NGAY</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
