import React, { useState, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { api } from './api';
import { Product, Category, StoreSettings, Article, Order, CategoryId } from './types';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CategorySection } from './components/CategorySection';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OrderLookupView } from './components/OrderLookupView';
import { GocAnYenView } from './components/GocAnYenView';
import { AdminPortal } from './components/AdminPortal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SearchModal } from './components/SearchModal';
import { Footer } from './components/Footer';
import { BottomNav } from './components/BottomNav';
import { Sparkles, ArrowRight, Filter, Loader2 } from 'lucide-react';

function MainApp() {
  const { isCheckoutOpen, setIsCheckoutOpen } = useCart();

  // App Navigation State
  const [currentTab, setCurrentTab] = useState<'home' | 'shop' | 'stories' | 'tracking' | 'admin'>('home');

  // Core Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Partial<StoreSettings>>({});
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Shop filter
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');

  // Modals & Active Items
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  // Order lookup prefill
  const [lookupOrderId, setLookupOrderId] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');

  // Admin authentication state
  const [adminPin, setAdminPin] = useState<string>(() => {
    return sessionStorage.getItem('tiem_an_yen_pin') || '';
  });
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [prods, cats, sets, arts] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getPublicSettings(),
        api.getArticles(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setSettings(sets);
      setArticles(arts);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (tab: string) => {
    if (tab === 'admin') {
      if (adminPin) {
        setCurrentTab('admin');
      } else {
        setAdminLoginOpen(true);
      }
    } else {
      setCurrentTab(tab as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAdminLoginSuccess = (pin: string) => {
    setAdminPin(pin);
    sessionStorage.setItem('tiem_an_yen_pin', pin);
    setCurrentTab('admin');
  };

  const handleAdminLogout = () => {
    setAdminPin('');
    sessionStorage.removeItem('tiem_an_yen_pin');
    setCurrentTab('home');
  };

  const handleTrackOrderFromSuccess = (orderId: string, phone: string) => {
    setLookupOrderId(orderId);
    setLookupPhone(phone);
    setCurrentTab('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter & Sort Products for Shop View
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
      return false;
    }
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
    return (b.soldCount || 0) - (a.soldCount || 0);
  });

  const featuredProducts = products.filter((p) => p.isFeatured);
  const newArrivals = products.filter((p) => p.isNewArrival);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E6] text-[#624832] selection:bg-[#C6A667]/30 selection:text-[#241E1A]">
      {/* Header */}
      <Header
        settings={settings}
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchOpen(true)}
        isAdminLoggedIn={!!adminPin}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#35483C]" />
            <p className="font-zen text-base text-[#624832]">Đang tải không gian an yên...</p>
          </div>
        ) : currentTab === 'admin' && adminPin ? (
          /* Admin Dashboard */
          <AdminPortal onLogout={handleAdminLogout} adminPin={adminPin} onPinChange={handleAdminLoginSuccess} />
        ) : currentTab === 'tracking' ? (
          /* Order Tracking View */
          <OrderLookupView
            settings={settings}
            initialOrderId={lookupOrderId}
            initialPhone={lookupPhone}
          />
        ) : currentTab === 'stories' ? (
          /* Góc An Yên Articles */
          <GocAnYenView
            articles={articles}
            products={products}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        ) : currentTab === 'shop' ? (
          /* Shop / Catalog Page */
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <span className="text-xs uppercase tracking-widest text-[#C6A667] font-semibold">
                Tuyển Chọn Tinh Hoa
              </span>
              <h1 className="font-zen text-3xl sm:text-5xl text-[#241E1A] mt-1 mb-2">
                Cửa Tiệm An Yên
              </h1>
              <p className="text-xs sm:text-sm text-[#624832]/80 max-w-lg mx-auto font-light">
                Vật phẩm phong thủy, mặt dây chuyền ngọc tự nhiên và nụ trầm hương thanh khiết.
              </p>
            </div>

            {/* Category Filter Pills & Sorter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-[#FAF6EE] p-4 rounded-2xl border border-[#E2D5C3]">
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                    selectedCategory === 'all'
                      ? 'bg-[#35483C] text-[#F5F0E6]'
                      : 'bg-white text-[#624832] border border-[#D8CEBE] hover:border-[#35483C]'
                  }`}
                >
                  Tất cả ({products.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                      selectedCategory === c.id
                        ? 'bg-[#35483C] text-[#F5F0E6]'
                        : 'bg-white text-[#624832] border border-[#D8CEBE] hover:border-[#35483C]'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
                <span className="text-[#624832]/70">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-[#D8CEBE] bg-white text-xs text-[#241E1A] focus:outline-none"
                >
                  <option value="featured">Nổi bật nhất</option>
                  <option value="price-asc">Giá: Thấp đến Cao</option>
                  <option value="price-desc">Giá: Cao đến Thấp</option>
                  <option value="newest">Mới về</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {sortedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onSelectProduct={(prod) => setSelectedProduct(prod)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Home Page */
          <>
            <HeroBanner
              onExplore={() => handleNavigate('shop')}
              homeHeroQuote={settings.homeHeroQuote}
            />

            {/* 3 Core Categories */}
            <CategorySection
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(catId) => {
                setSelectedCategory(catId);
                handleNavigate('shop');
              }}
            />

            {/* Featured Products Section */}
            {featuredProducts.length > 0 && (
              <section className="py-12 px-4 max-w-6xl mx-auto">
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#C6A667] font-semibold">
                      An Duyên Tuyển Chọn
                    </span>
                    <h2 className="font-zen text-2xl sm:text-4xl text-[#241E1A] mt-1">
                      Sản Phẩm Nổi Bật
                    </h2>
                  </div>
                  <button
                    onClick={() => handleNavigate('shop')}
                    className="text-xs font-semibold text-[#35483C] hover:text-[#C6A667] flex items-center gap-1 transition"
                  >
                    <span>Xem tất cả</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {featuredProducts.slice(0, 4).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onSelectProduct={(prod) => setSelectedProduct(prod)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* New Arrivals Section */}
            {newArrivals.length > 0 && (
              <section className="py-12 px-4 max-w-6xl mx-auto border-t border-[#E5DCB]/50">
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#C6A667] font-semibold">
                      Vừa Về Cửa Tiệm
                    </span>
                    <h2 className="font-zen text-2xl sm:text-4xl text-[#241E1A] mt-1">
                      Vật Phẩm Mới Về
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setSortBy('newest');
                      handleNavigate('shop');
                    }}
                    className="text-xs font-semibold text-[#35483C] hover:text-[#C6A667] flex items-center gap-1 transition"
                  >
                    <span>Xem thêm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {newArrivals.slice(0, 4).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onSelectProduct={(prod) => setSelectedProduct(prod)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Góc An Yên Preview on Home */}
            <section className="py-16 px-4 bg-[#FAF6EE] border-t border-b border-[#E2D5C3]">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                  <span className="text-xs uppercase tracking-widest text-[#C6A667] font-semibold">
                    Chia Sẻ Bình An
                  </span>
                  <h2 className="font-zen text-2xl sm:text-4xl text-[#241E1A] mt-1 mb-2">
                    Góc An Yên
                  </h2>
                  <p className="text-xs sm:text-sm text-[#624832]/80 max-w-lg mx-auto">
                    Những câu chuyện nhẹ nhàng về nghệ thuật thưởng trầm, năng lượng đá và lối sống thiền mộc.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {articles.slice(0, 2).map((art) => (
                    <div
                      key={art.id}
                      onClick={() => handleNavigate('stories')}
                      className="group p-5 rounded-2xl bg-white border border-[#E2D5C3] hover:border-[#C6A667] cursor-pointer transition shadow-xs flex flex-col sm:flex-row gap-4"
                    >
                      <img
                        src={art.image}
                        alt={art.title}
                        className="w-full sm:w-40 h-32 rounded-xl object-cover bg-[#ECE3D4] shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-[#35483C] uppercase tracking-wider block mb-1">
                            {art.category}
                          </span>
                          <h3 className="font-zen text-lg font-bold text-[#241E1A] group-hover:text-[#35483C] transition line-clamp-2">
                            {art.title}
                          </h3>
                          <p className="text-xs text-[#624832]/80 line-clamp-2 mt-1">
                            {art.summary}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-[#35483C] group-hover:text-[#C6A667] transition flex items-center gap-1 mt-2">
                          Đọc tiếp <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Global Footer */}
      <Footer settings={settings} onNavigate={handleNavigate} />

      {/* Mobile Fixed Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onNavigate={handleNavigate}
        isAdminLoggedIn={!!adminPin}
      />

      {/* Modals */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CartDrawer settings={settings} />

      <CheckoutModal
        settings={settings}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(order) => setOrderSuccess(order)}
      />

      <OrderSuccessModal
        order={orderSuccess}
        settings={settings}
        onClose={() => setOrderSuccess(null)}
        onTrackOrder={handleTrackOrderFromSuccess}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={products}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      <AdminLoginModal
        isOpen={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <MainApp />
    </CartProvider>
  );
}
