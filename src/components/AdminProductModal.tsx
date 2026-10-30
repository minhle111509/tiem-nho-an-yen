import React, { useState, useRef } from 'react';
import { Product, Category } from '../types';
import { optimizeImageFile, OptimizedImageResult } from '../utils/imageCompressor';
import { api } from '../api';
import { formatVND } from '../utils/format';
import {
  X,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  FileCheck,
  RefreshCw,
} from 'lucide-react';

interface AdminProductModalProps {
  product: Product | null;
  categories: Category[];
  adminPin: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  product,
  categories,
  adminPin,
  isOpen,
  onClose,
  onSaved,
}) => {
  if (!isOpen) return null;

  const isEditing = !!product;

  // Form states
  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || `AY-${Date.now().toString().slice(-4)}`);
  const [categoryId, setCategoryId] = useState<Category['id']>(
    product?.categoryId || 'vat-pham-an-lanh'
  );
  const [price, setPrice] = useState<number>(product?.price || 280000);
  const [compareAtPrice, setCompareAtPrice] = useState<number>(product?.compareAtPrice || 0);
  const [stock, setStock] = useState<number>(product ? product.stock : 10);
  const [material, setMaterial] = useState(product?.material || '');
  const [dimensions, setDimensions] = useState(product?.dimensions || '');
  const [color, setColor] = useState(product?.color || '');
  const [origin, setOrigin] = useState(product?.origin || 'Việt Nam');
  const [meaning, setMeaning] = useState(product?.meaning || '');
  const [description, setDescription] = useState(product?.description || '');
  const [usageInstructions, setUsageInstructions] = useState(
    product?.usageInstructions || 'Đặt nơi thông thoáng, sạch sẽ hoặc đeo bên người mỗi ngày.'
  );
  const [careInstructions, setCareInstructions] = useState(
    product?.careInstructions || 'Lau nhẹ bằng khăn vải mềm khô ráo, tránh hóa chất tẩy rửa mạnh.'
  );
  const [isFeatured, setIsFeatured] = useState<boolean>(!!product?.isFeatured);
  const [isNewArrival, setIsNewArrival] = useState<boolean>(
    product ? !!product.isNewArrival : true
  );

  // Photos list (up to 10)
  const [images, setImages] = useState<string[]>(
    product?.images && product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=900&q=80']
  );

  // Processing & UI states
  const [isCompressing, setIsCompressing] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File input refs for mobile
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState<number | null>(null);

  // Handle mobile files (from camera or gallery)
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    setIsCompressing(true);

    try {
      const remainingSlots = 10 - images.length;
      if (remainingSlots <= 0) {
        setErrorMessage('Sản phẩm đã đạt giới hạn tối đa 10 ảnh. Vui lòng xóa bớt ảnh cũ trước.');
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      const newUrls: string[] = [];

      for (const file of filesToProcess) {
        // Optimize & compress on mobile canvas
        const optimized = await optimizeImageFile(file, 1200, 0.82);

        // Upload to server
        try {
          const serverUrl = await api.uploadAdminImage(adminPin, optimized.dataUrl, optimized.fileName);
          newUrls.push(serverUrl);
        } catch (uploadErr) {
          // Fallback to optimized dataUrl if upload network fails so user doesn't lose photo
          console.warn('Server upload fallback to dataUrl:', uploadErr);
          newUrls.push(optimized.dataUrl);
        }
      }

      setImages((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể xử lý hình ảnh. Vui lòng thử lại.');
    } finally {
      setIsCompressing(false);
      // Reset inputs
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // Replace single image
  const handleReplaceFileSelected = async (files: FileList | null) => {
    if (!files || files.length === 0 || replaceTargetIndex === null) return;
    setIsCompressing(true);
    try {
      const file = files[0];
      const optimized = await optimizeImageFile(file, 1200, 0.82);
      let targetUrl = optimized.dataUrl;

      try {
        targetUrl = await api.uploadAdminImage(adminPin, optimized.dataUrl, optimized.fileName);
      } catch (e) {
        console.warn('Fallback dataUrl for replace');
      }

      setImages((prev) => {
        const next = [...prev];
        next[replaceTargetIndex] = targetUrl;
        return next;
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể thay thế ảnh');
    } finally {
      setIsCompressing(false);
      setReplaceTargetIndex(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  // Reorder photos
  const moveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const setAsCover = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const selected = next.splice(index, 1)[0];
      next.unshift(selected);
      return next;
    });
  };

  const removeImage = (index: number) => {
    if (images.length <= 1) {
      if (!window.confirm('Đây là bức ảnh duy nhất. Bạn có chắc muốn xóa không?')) return;
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // AI Suggestion trigger
  const handleAiSuggest = async () => {
    if (images.length === 0) {
      setErrorMessage('Vui lòng chụp hoặc tải lên ít nhất 1 ảnh sản phẩm để AI nhận diện.');
      return;
    }

    setErrorMessage(null);
    setIsAiGenerating(true);
    setAiMessage(null);

    try {
      const mainImage = images[0];
      const suggestion = await api.aiSuggestProduct(adminPin, mainImage, categoryId, name);

      if (suggestion) {
        if (suggestion.name) setName(suggestion.name);
        if (suggestion.categoryId) setCategoryId(suggestion.categoryId);
        if (suggestion.material) setMaterial(suggestion.material);
        if (suggestion.dimensions) setDimensions(suggestion.dimensions);
        if (suggestion.color) setColor(suggestion.color);
        if (suggestion.origin) setOrigin(suggestion.origin);
        if (suggestion.meaning) setMeaning(suggestion.meaning);
        if (suggestion.description) setDescription(suggestion.description);
        if (suggestion.usageInstructions) setUsageInstructions(suggestion.usageInstructions);
        if (suggestion.careInstructions) setCareInstructions(suggestion.careInstructions);
        if (suggestion.suggestedPrice && (!price || price === 280000)) {
          setPrice(suggestion.suggestedPrice);
          setCompareAtPrice(Math.round(suggestion.suggestedPrice * 1.25 / 10000) * 10000);
        }

        setAiMessage('✨ AI đã gợi ý thông tin hoàn tất! Bạn có thể xem lại và điều chỉnh trước khi đăng.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi kết nối trợ lý AI.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Save product (with isActive explicitly set)
  const handleSave = async (publishImmediately: boolean) => {
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên sản phẩm.');
      return;
    }

    if (images.length === 0) {
      setErrorMessage('Vui lòng tải lên ít nhất 1 hình ảnh sản phẩm.');
      return;
    }

    if (price <= 0) {
      setErrorMessage('Vui lòng nhập giá bán hợp lệ.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim() || `AY-${Date.now().toString().slice(-4)}`,
        categoryId,
        price: Number(price),
        compareAtPrice: Number(compareAtPrice) > 0 ? Number(compareAtPrice) : undefined,
        stock: Math.max(0, Number(stock)),
        isActive: publishImmediately,
        material: material.trim(),
        dimensions: dimensions.trim(),
        color: color.trim(),
        origin: origin.trim(),
        meaning: meaning.trim(),
        description: description.trim(),
        usageInstructions: usageInstructions.trim(),
        careInstructions: careInstructions.trim(),
        images,
        isFeatured,
        isNewArrival,
      };

      if (isEditing && product) {
        await api.updateAdminProduct(adminPin, product.id, payload);
      } else {
        await api.createAdminProduct(adminPin, payload as any);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu sản phẩm. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Hidden file inputs for Mobile Camera & Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="hidden"
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleReplaceFileSelected(e.target.files)}
        className="hidden"
      />

      <div
        className="relative w-full max-w-3xl bg-[#FAF6EE] rounded-3xl shadow-2xl border border-[#C6A667]/40 overflow-hidden my-auto max-h-[96vh] flex flex-col text-[#241E1A]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2D5C3] bg-[#F5F0E6] flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#35483C] text-white flex items-center justify-center">
              <Layers className="w-5 h-5 text-[#C6A667]" />
            </div>
            <div>
              <h2 className="font-zen text-lg sm:text-2xl font-bold leading-tight">
                {isEditing ? `Chỉnh Sửa: ${product.name}` : 'Thêm Sản Phẩm Mới'}
              </h2>
              <p className="text-[11px] text-[#624832]/80">
                Tối ưu hóa thao tác trực tiếp trên điện thoại
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 text-[#624832] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-4 sm:p-7 space-y-6 flex-1 text-xs">
          {/* Error & AI Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {aiMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{aiMessage}</span>
            </div>
          )}

          {/* 1. SECTION: HÌNH ẢNH SẢN PHẨM (Max 10) */}
          <div className="p-4 rounded-2xl bg-white border border-[#E2D5C3] shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#241E1A] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#35483C] text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Hình Ảnh Sản Phẩm ({images.length}/10 ảnh)</span>
                </h3>
                <p className="text-[11px] text-[#624832]/70 mt-0.5">
                  Ảnh đầu tiên là ảnh đại diện. Bấm "Đặt làm ảnh chính" để thay đổi.
                </p>
              </div>

              {/* AI Auto-generate button */}
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={isAiGenerating || images.length === 0}
                className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-semibold text-xs flex items-center gap-1.5 hover:bg-amber-100 transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                    <span>AI đang chiêm nghiệm ảnh...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#C6A667]" />
                    <span>AI Gợi Ý Tên & Mô Tả</span>
                  </>
                )}
              </button>
            </div>

            {/* Mobile Touch Action Buttons for Camera & Gallery */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isCompressing || images.length >= 10}
                className="py-3 px-3 rounded-xl bg-[#FAF6EE] border-2 border-dashed border-[#C6A667] text-[#35483C] hover:bg-[#F0EAE0] font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#C6A667]" />
                <span>📸 Chụp Ảnh Ngay</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isCompressing || images.length >= 10}
                className="py-3 px-3 rounded-xl bg-[#FAF6EE] border-2 border-dashed border-[#35483C]/40 text-[#35483C] hover:bg-[#F0EAE0] font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-[#35483C]" />
                <span>🖼️ Chọn Từ Thư Viện</span>
              </button>
            </div>

            {isCompressing && (
              <div className="p-2.5 mb-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tự động nén và tối ưu ảnh cho điện thoại...</span>
              </div>
            )}

            {/* Photo Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((imgUrl, index) => {
                const isCover = index === 0;
                return (
                  <div
                    key={index}
                    className={`relative rounded-xl overflow-hidden border-2 bg-[#ECE3D4] flex flex-col group transition ${
                      isCover ? 'border-[#C6A667] ring-2 ring-[#C6A667]/30' : 'border-[#E2D5C3]'
                    }`}
                  >
                    {/* Image preview */}
                    <div className="aspect-square w-full relative overflow-hidden">
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                      {isCover && (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#C6A667] text-[#241E1A] font-bold text-[9px] flex items-center gap-1 shadow-xs">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>ẢNH BÌA</span>
                        </span>
                      )}
                    </div>

                    {/* Touch Action Controls on Photo */}
                    <div className="p-1.5 bg-[#FAF6EE] flex items-center justify-between gap-1 border-t border-[#E2D5C3]">
                      <div className="flex items-center gap-0.5">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => moveImage(index, 'left')}
                            className="p-1 rounded hover:bg-black/10 text-[#624832]"
                            title="Di chuyển trước"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {index < images.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveImage(index, 'right')}
                            className="p-1 rounded hover:bg-black/10 text-[#624832]"
                            title="Di chuyển sau"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {!isCover && (
                          <button
                            type="button"
                            onClick={() => setAsCover(index)}
                            className="px-1.5 py-0.5 rounded bg-white border border-[#D8CEBE] hover:bg-[#F0EAE0] text-[9px] font-bold text-[#35483C]"
                            title="Đặt làm ảnh bìa"
                          >
                            Làm bìa
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setReplaceTargetIndex(index);
                            replaceInputRef.current?.click();
                          }}
                          className="p-1 rounded text-[#624832] hover:bg-black/10"
                          title="Thay ảnh này"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-1 rounded text-red-600 hover:bg-red-50"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. SECTION: THÔNG TIN BÁN HÀNG */}
          <div className="p-4 rounded-2xl bg-white border border-[#E2D5C3] space-y-3.5 shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#241E1A] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#35483C] text-white flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Thông Tin Cốt Lõi</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1 text-[#624832]">
                  Tên sản phẩm <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Quả Cầu Thạch Anh Trắng Thiên Nhiên Tĩnh Tâm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-xs font-semibold text-[#241E1A] focus:outline-none focus:border-[#35483C]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-[#624832]">
                  Mã SKU sản phẩm <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-xs font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-[#624832]">
                  Danh mục chính <span className="text-red-600">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-xs font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1 text-[#624832]">
                  Giá bán (₫) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={10000}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-xs font-bold text-[#35483C]"
                />
                <span className="text-[10px] text-[#624832]/70 mt-0.5 block">
                  Hiển thị: {formatVND(price)}
                </span>
              </div>

              <div>
                <label className="block font-medium mb-1 text-[#624832]">
                  Giá niêm yết cũ (để hiển thị giảm giá)
                </label>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-xs"
                />
                {compareAtPrice > price && (
                  <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                    Giảm ~{Math.round(((compareAtPrice - price) / compareAtPrice) * 100)}%
                  </span>
                )}
              </div>

              <div>
                <label className="block font-medium mb-1 text-[#624832]">
                  Số lượng tồn kho thực tế <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-xs font-semibold"
                />
                {stock <= 5 && stock > 0 && (
                  <span className="text-[10px] text-amber-700 font-medium mt-0.5 block">
                    Cảnh báo: Tồn kho thấp
                  </span>
                )}
              </div>

              <div>
                <label className="block font-medium mb-1 text-[#624832]">
                  Xuất xứ nguồn gốc
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Khai thác mỏ đá Đắk Lắk, Tiên Phước Quảng Nam..."
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-xs"
                />
              </div>
            </div>
          </div>

          {/* 3. SECTION: CHI TIẾT & Ý NGHĨA PHONG THỦY */}
          <div className="p-4 rounded-2xl bg-white border border-[#E2D5C3] space-y-3.5 shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#241E1A] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#35483C] text-white flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Đặc Tính & Ý Nghĩa An Yên</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-medium mb-1 text-[#624832]">Chất liệu</label>
                <input
                  type="text"
                  placeholder="Thạch anh tự nhiên, ngọc bích, trầm hương nguyên chất..."
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-xs"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-[#624832]">Kích thước</label>
                <input
                  type="text"
                  placeholder="Đường kính 6.5cm, cao 4cm, nặng 350g..."
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium mb-1 text-[#624832]">
                  Ý nghĩa biểu tượng truyền thống
                </label>
                <input
                  type="text"
                  placeholder="Vật phẩm mang năng lượng bình an, thanh tẩy uế khí..."
                  value={meaning}
                  onChange={(e) => setMeaning(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-xs italic"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium mb-1 text-[#624832]">
                  Mô tả chi tiết sản phẩm
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả vẻ đẹp, vân đá, làn khói trầm mộc mạc..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-xs"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#35483C]"
                  />
                  <span className="font-semibold text-xs">Sản phẩm Nổi Bật (Trang chủ)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                    className="w-4 h-4 rounded text-[#35483C]"
                  />
                  <span className="font-semibold text-xs">Gắn nhãn Mới Về</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sticky Action Footer (LƯU NHÁP / ĐĂNG BÁN) */}
        <div className="p-4 sm:p-5 border-t border-[#E2D5C3] bg-[#F5F0E6] flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-10">
          <div className="text-[11px] text-[#624832]/80 hidden sm:block">
            {isEditing ? 'Đang cập nhật sản phẩm hiện có' : 'Sản phẩm mới sẽ lưu vào cơ sở dữ liệu'}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(false)}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl border border-[#35483C]/40 bg-white hover:bg-[#F0EAE0] text-[#35483C] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <FileCheck className="w-4 h-4" />
              <span>LƯU BẢN NHÁP</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#35483C] hover:bg-[#28382E] text-[#F5F0E6] text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C6A667]" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#C6A667]" />
                  <span>ĐĂNG BÁN NGAY</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
