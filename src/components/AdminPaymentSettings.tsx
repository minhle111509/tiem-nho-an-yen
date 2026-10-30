import React, { useState, useRef } from 'react';
import { StoreSettings, BankingHistoryLog } from '../types';
import { VIETNAMESE_BANKS, getVietQRImageUrl, formatVND, formatDate } from '../utils/format';
import { optimizeImageFile } from '../utils/imageCompressor';
import { api } from '../api';
import {
  QrCode,
  Building2,
  Upload,
  Camera,
  CheckCircle2,
  History,
  Eye,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';

interface AdminPaymentSettingsProps {
  settings: StoreSettings;
  adminPin: string;
  onUpdate: (updated: StoreSettings) => void;
}

export const AdminPaymentSettings: React.FC<AdminPaymentSettingsProps> = ({
  settings,
  adminPin,
  onUpdate,
}) => {
  // Form fields
  const [bankCode, setBankCode] = useState(settings.bankCode || 'MB');
  const [bankName, setBankName] = useState(
    settings.bankName || 'Ngân hàng Quân Đội (MB Bank)'
  );
  const [accountNumber, setAccountNumber] = useState(settings.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState(settings.accountHolder || 'TIEM NHO AN YEN');
  const [customQrImage, setCustomQrImage] = useState(settings.customQrImage || '');
  const [useDynamicVietQr, setUseDynamicVietQr] = useState(settings.useDynamicVietQr !== false);

  // Preview tab state: 'dynamic' or 'custom'
  const [previewTab, setPreviewTab] = useState<'dynamic' | 'custom'>('dynamic');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File input ref for QR image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sample order for live preview
  const demoAmount = 520000;
  const demoOrderId = 'AY-TEST-88';
  const dynamicQrUrl = getVietQRImageUrl(bankCode, accountNumber, demoAmount, demoOrderId, accountHolder);

  const handleBankSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = VIETNAMESE_BANKS.find((b) => b.code === e.target.value);
    if (selected) {
      setBankCode(selected.code);
      setBankName(selected.name);
    } else {
      setBankCode(e.target.value);
    }
  };

  const handleQrUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    setIsUploading(true);

    try {
      const file = files[0];
      const optimized = await optimizeImageFile(file, 1000, 0.85);

      try {
        const uploadedUrl = await api.uploadAdminImage(adminPin, optimized.dataUrl, optimized.fileName);
        setCustomQrImage(uploadedUrl);
        setPreviewTab('custom');
      } catch (err) {
        // Fallback to dataUrl if direct save had network issue
        setCustomQrImage(optimized.dataUrl);
        setPreviewTab('custom');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể xử lý hình ảnh mã QR');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!accountNumber.trim()) {
      setErrorMessage('Vui lòng nhập số tài khoản ngân hàng.');
      return;
    }

    if (!accountHolder.trim()) {
      setErrorMessage('Vui lòng nhập tên chủ tài khoản.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<StoreSettings> = {
        bankName,
        bankCode,
        accountNumber: accountNumber.trim().replace(/\s+/g, ''),
        accountHolder: accountHolder.trim().toUpperCase(),
        customQrImage: customQrImage || undefined,
        useDynamicVietQr,
      };

      const updated = await api.updateAdminSettings(adminPin, payload);
      onUpdate(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu thông tin thanh toán');
    } finally {
      setIsSaving(false);
    }
  };

  const historyLogs = settings.bankingHistory || [];

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleQrUpload(e.target.files)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleQrUpload(e.target.files)}
        className="hidden"
      />

      {/* Breadcrumb Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF6EE] border border-[#E2D5C3] shadow-xs">
        <div className="flex items-center gap-1.5 text-[11px] text-[#624832]/70 uppercase tracking-wider mb-1 font-semibold">
          <span>QUẢN TRỊ</span>
          <span>→</span>
          <span>CÀI ĐẶT CỬA HÀNG</span>
          <span>→</span>
          <span className="text-[#35483C]">THANH TOÁN & MÃ QR</span>
        </div>
        <h2 className="font-zen text-xl sm:text-2xl font-bold text-[#241E1A] flex items-center gap-2">
          <span>Quản Lý Tài Khoản Ngân Hàng & Mã QR</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold font-sans">
            Bảo Mật
          </span>
        </h2>
        <p className="text-xs text-[#624832]/80 mt-1">
          Cấu hình tài khoản nhận tiền và mã QR hiển thị tự động khi khách đặt hàng. Các đơn hàng cũ luôn được bảo toàn thông tin tại thời điểm mua.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>Đã lưu thành công!</strong> Mã QR và thông tin tài khoản mới sẽ được áp dụng cho toàn bộ đơn hàng phát sinh từ bây giờ.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Form and Preview Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Bank Information */}
          <div className="p-5 rounded-2xl bg-white border border-[#E2D5C3] shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#241E1A] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#C6A667]" />
              <span>1. Thông Tin Tài Khoản Nhận Tiền</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[#624832] mb-1">
                  Chọn Ngân hàng nhận tiền: <span className="text-red-600">*</span>
                </label>
                <select
                  value={bankCode}
                  onChange={handleBankSelect}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-[#241E1A] font-semibold text-xs focus:outline-none focus:border-[#35483C]"
                >
                  {VIETNAMESE_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                  <option value="CUSTOM">-- Ngân hàng khác --</option>
                </select>
              </div>

              {bankCode === 'CUSTOM' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block font-medium text-[#624832] mb-1">Mã ngân hàng (Viết tắt):</label>
                    <input
                      type="text"
                      placeholder="VD: VIB, OCB..."
                      value={bankCode}
                      onChange={(e) => setBankCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#624832] mb-1">Tên đầy đủ ngân hàng:</label>
                    <input
                      type="text"
                      placeholder="VD: Ngân hàng Quốc Tế VIB"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-[#624832] mb-1">
                  Số tài khoản ngân hàng: <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 9909150900"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-sm font-mono font-bold text-[#35483C] focus:outline-none focus:border-[#35483C]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#624832] mb-1">
                  Tên chủ tài khoản (In hoa không dấu): <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: TIEM NHO AN YEN hoặc NGUYEN VAN A"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CEBE] bg-[#FAF6EE] text-xs font-bold text-[#241E1A] uppercase focus:outline-none focus:border-[#35483C]"
                />
              </div>
            </div>
          </div>

          {/* Card 2: QR Mode & Custom QR Upload */}
          <div className="p-5 rounded-2xl bg-white border border-[#E2D5C3] shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#241E1A] flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#C6A667]" />
              <span>2. Chế Độ Hiển Thị Mã QR & Tải Ảnh Lên</span>
            </h3>

            {/* Toggle Dynamic VietQR */}
            <div className="p-3.5 rounded-xl bg-[#FAF0E1] border border-[#E2D5C3] space-y-2 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useDynamicVietQr}
                  onChange={(e) => setUseDynamicVietQr(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-[#35483C] focus:ring-[#35483C]"
                />
                <div>
                  <span className="font-bold text-[#241E1A] block">
                    Bật mã VietQR động theo đơn hàng (Khuyên dùng)
                  </span>
                  <p className="text-[11px] text-[#624832]/80 mt-0.5 leading-relaxed">
                    Hệ thống sẽ tự động tạo mã QR chứa chính xác số tiền cần thanh toán và nội dung mã đơn hàng. Khách hàng quét mã là chuyển đúng tiền ngay, không phải nhập số thủ công.
                  </p>
                </div>
              </label>
            </div>

            {/* Upload Custom QR Photo from phone/computer */}
            <div>
              <label className="block text-xs font-semibold text-[#624832] mb-1.5">
                Tải lên ảnh mã QR của tiệm (tùy chọn):
              </label>
              <p className="text-[11px] text-[#624832]/70 mb-3">
                Bạn có thể chụp hoặc tải ảnh mã QR tài khoản lưu sẵn từ ứng dụng ngân hàng của bạn.
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploading}
                  className="py-3 px-3 rounded-xl bg-[#FAF6EE] border-2 border-dashed border-[#C6A667] text-[#35483C] hover:bg-[#F0EAE0] font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-[#C6A667]" />
                  <span>Chụp Mã QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="py-3 px-3 rounded-xl bg-[#FAF6EE] border-2 border-dashed border-[#35483C]/40 text-[#35483C] hover:bg-[#F0EAE0] font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#35483C]" />
                  <span>Chọn Ảnh QR Từ Máy</span>
                </button>
              </div>

              {isUploading && (
                <div className="p-2.5 mt-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tải và tối ưu ảnh mã QR...</span>
                </div>
              )}

              {customQrImage && (
                <div className="mt-3 p-3 rounded-xl bg-[#FAF6EE] border border-[#E2D5C3] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={customQrImage}
                      alt="Custom QR"
                      className="w-12 h-12 object-contain rounded-lg border bg-white p-0.5"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#241E1A]">Ảnh mã QR đã tải lên</p>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('custom')}
                        className="text-[11px] text-[#35483C] underline font-semibold"
                      >
                        Bấm để xem trước ảnh này
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomQrImage('');
                      setPreviewTab('dynamic');
                    }}
                    className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                  >
                    Xóa ảnh này
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 rounded-2xl bg-[#35483C] hover:bg-[#28382E] text-[#F5F0E6] text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C6A667]" />
                  <span>Đang lưu thông tin thanh toán...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#C6A667]" />
                  <span>LƯU THAY ĐỔI VÀO CƠ SỞ DỮ LIỆU</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-[#624832]/70 mt-2">
              Dữ liệu được lưu vĩnh viễn trên máy chủ, không cần sửa mã nguồn.
            </p>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-[#C6A667] shadow-md sticky top-20 text-xs">
            <div className="flex items-center justify-between border-b border-[#E2D5C3] pb-3 mb-3">
              <div className="flex items-center gap-1.5 font-bold text-[#35483C] uppercase tracking-wider text-[11px]">
                <Eye className="w-4 h-4 text-[#C6A667]" />
                <span>Xem Trước Mã QR Khách Hàng Nhìn Thấy</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                Thực Tế
              </span>
            </div>

            {/* Switch preview tabs if custom QR exists */}
            {customQrImage && (
              <div className="grid grid-cols-2 gap-1 bg-[#FAF6EE] p-1 rounded-xl mb-4 border border-[#E2D5C3]">
                <button
                  type="button"
                  onClick={() => setPreviewTab('dynamic')}
                  className={`py-1.5 rounded-lg text-[11px] font-bold transition ${
                    previewTab === 'dynamic'
                      ? 'bg-[#35483C] text-white shadow-xs'
                      : 'text-[#624832] hover:bg-black/5'
                  }`}
                >
                  VietQR Tự Động
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('custom')}
                  className={`py-1.5 rounded-lg text-[11px] font-bold transition ${
                    previewTab === 'custom'
                      ? 'bg-[#35483C] text-white shadow-xs'
                      : 'text-[#624832] hover:bg-black/5'
                  }`}
                >
                  Ảnh QR Của Tiệm
                </button>
              </div>
            )}

            {/* QR Card Mockup */}
            <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E2D5C3] flex flex-col items-center text-center">
              <div className="w-48 h-48 bg-white p-2 rounded-2xl border border-[#D8CEBE] shadow-xs mb-3 flex items-center justify-center">
                {previewTab === 'custom' && customQrImage ? (
                  <img
                    src={customQrImage}
                    alt="Mã QR tải lên"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={dynamicQrUrl}
                    alt="VietQR Demo"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="w-full space-y-1.5 text-left text-xs bg-white p-3 rounded-xl border border-[#E2D5C3]">
                <div className="flex justify-between">
                  <span className="text-[#624832]/70">Ngân hàng:</span>
                  <strong className="text-[#241E1A]">{bankName} ({bankCode})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#624832]/70">Số tài khoản:</span>
                  <strong className="font-mono text-[#35483C]">{accountNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#624832]/70">Chủ tài khoản:</span>
                  <strong className="text-[#241E1A] uppercase">{accountHolder}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#E2D5C3]">
                  <span className="text-[#624832]/70">Số tiền mẫu:</span>
                  <strong className="text-[#35483C]">{formatVND(demoAmount)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#624832]/70">Nội dung mẫu:</span>
                  <strong className="font-mono text-[#241E1A]">{demoOrderId}</strong>
                </div>
              </div>

              <p className="text-[10px] text-[#624832]/70 mt-2.5">
                {previewTab === 'dynamic'
                  ? '✓ Mã QR này tự động cập nhật số tiền và mã đơn hàng của từng vị khách.'
                  : '✓ Ảnh mã QR do tiệm tự tải lên.'}
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* 3. SECTION: LỊCH SỬ THAY ĐỔI TÀI KHOẢN (AUDIT LOG) */}
      <div className="p-5 rounded-2xl bg-white border border-[#E2D5C3] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2D5C3] pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#C6A667]" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#241E1A]">
              Lịch Sử Thay Đổi Tài Khoản Nhận Tiền ({historyLogs.length})
            </h3>
          </div>
          <span className="text-[11px] text-[#624832]/70">
            Lưu vết tự động để đối soát khi cần
          </span>
        </div>

        {historyLogs.length === 0 ? (
          <div className="text-center py-6 text-[#624832]/70 text-xs">
            Chưa có lịch sử thay đổi nào. Khi bạn cập nhật tài khoản, hệ thống sẽ tự động ghi vết tại đây.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {historyLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-[#FAF6EE] border border-[#E2D5C3] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-[#241E1A]">
                      {log.bankName} ({log.bankCode})
                    </span>
                    <span className="font-mono text-[#35483C] font-semibold">
                      STK: {log.accountNumber}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-[#624832] font-semibold">
                      {log.accountHolder}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#624832]/80">
                    {log.note || 'Cập nhật tài khoản'} • {log.useDynamicVietQr ? 'Dùng VietQR động' : 'Dùng ảnh QR tải lên'}
                  </p>
                </div>

                <div className="text-[11px] text-[#624832]/70 font-mono shrink-0">
                  {formatDate(log.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
