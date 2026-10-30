import React from 'react';
import { useCart } from '../context/CartContext';
import { formatVND } from '../utils/format';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { StoreSettings } from '../types';

interface CartDrawerProps {
  settings: Partial<StoreSettings>;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ settings }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    setIsCheckoutOpen,
  } = useCart();

  if (!isCartOpen) return null;

  const freeShippingThreshold = settings.freeShippingThreshold ?? 500000;
  const remainingForFreeShip = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF6EE] shadow-2xl flex flex-col border-l border-[#C6A667]/30">
          {/* Drawer Header */}
          <div className="p-5 border-b border-[#E2D5C3] flex items-center justify-between bg-[#F5F0E6]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#35483C]" />
              <h2 className="font-zen text-xl font-bold text-[#241E1A]">Giỏ Hàng An Yên</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full hover:bg-black/5 text-[#624832] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="p-3.5 bg-[#FAF0E1] border-b border-[#E2D5C3] text-xs">
            {remainingForFreeShip > 0 ? (
              <p className="text-[#624832] mb-1.5">
                Mua thêm <strong>{formatVND(remainingForFreeShip)}</strong> để được{' '}
                <strong className="text-[#35483C]">MIỄN PHÍ VẬN CHUYỂN</strong>
              </p>
            ) : (
              <p className="text-emerald-800 font-semibold mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Đơn hàng của bạn đã đủ điều kiện MIỄN PHÍ VẬN CHUYỂN!
              </p>
            )}
            <div className="w-full h-1.5 bg-[#E2D5C3] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#35483C] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 text-[#624832]">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F0EAE0] flex items-center justify-center text-[#C6A667]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="font-zen text-xl font-bold mb-1 text-[#241E1A]">Giỏ hàng đang trống</p>
                <p className="text-xs text-[#624832]/80 mb-6">
                  Hãy ghé thăm cửa tiệm để chọn một vật phẩm bình an cho mình.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 rounded-full bg-[#35483C] text-[#F5F0E6] text-xs font-semibold hover:bg-[#28382E] transition shadow-xs"
                >
                  Khám phá cửa tiệm
                </button>
              </div>
            ) : (
              items.map((item, idx) => {
                const itemPrice =
                  item.product.price + (item.selectedVariation?.priceModifier || 0);
                return (
                  <div
                    key={`${item.product.id}-${item.selectedVariation?.id || idx}`}
                    className="flex gap-3.5 p-3 rounded-2xl bg-white/70 border border-[#E2D5C3] shadow-xs"
                  >
                    <img
                      src={item.product.images[0] || '/logo-192.png'}
                      alt={item.product.name}
                      className="w-18 h-18 rounded-xl object-cover bg-[#ECE3D4] shrink-0"
                    />

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-zen text-sm font-semibold text-[#241E1A] line-clamp-1">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() =>
                              removeFromCart(item.product.id, item.selectedVariation?.id)
                            }
                            className="text-[#624832]/40 hover:text-red-600 transition"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {item.selectedVariation && (
                          <span className="text-[11px] text-[#624832]/80 bg-[#F5F0E6] px-2 py-0.5 rounded-md inline-block mt-0.5">
                            {item.selectedVariation.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-[#35483C]">
                          {formatVND(itemPrice)}
                        </span>

                        <div className="flex items-center border border-[#D8CEBE] rounded-lg bg-white overflow-hidden">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity - 1,
                                item.selectedVariation?.id
                              )
                            }
                            className="px-2 py-0.5 text-xs text-[#624832] hover:bg-[#F5F0E6] transition"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-semibold">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity + 1,
                                item.selectedVariation?.id
                              )
                            }
                            disabled={item.quantity >= item.product.stock}
                            className="px-2 py-0.5 text-xs text-[#624832] hover:bg-[#F5F0E6] transition disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer & Checkout Button */}
          {items.length > 0 && (
            <div className="p-5 border-t border-[#E2D5C3] bg-[#F5F0E6] space-y-3">
              <div className="flex items-center justify-between text-sm text-[#624832]">
                <span>Tạm tính hàng:</span>
                <span className="font-bold text-[#241E1A]">{formatVND(subtotal)}</span>
              </div>
              <div className="text-[11px] text-[#624832]/80 flex items-center justify-between">
                <span>Phí vận chuyển:</span>
                <span>
                  {subtotal >= freeShippingThreshold
                    ? 'Miễn phí'
                    : formatVND(settings.shippingFlatFee ?? 30000)}
                </span>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-3.5 rounded-2xl bg-[#35483C] hover:bg-[#28382E] text-[#F5F0E6] font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <span>TIẾN HÀNH ĐẶT HÀNG</span>
                <ArrowRight className="w-4 h-4 text-[#C6A667]" />
              </button>

              <p className="text-[11px] text-center text-[#624832]/70 font-light">
                Đặt hàng dễ dàng không cần đăng ký tài khoản
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
