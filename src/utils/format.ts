// Formatting helpers for Vietnamese currency, date, VietQR

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount).replace('₫', '₫');
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

// Generate standard VietQR image link via VietQR QuickLink format
export function getVietQRImageUrl(
  bankCode: string,
  accountNumber: string,
  amount: number,
  memo: string,
  accountHolder?: string
): string {
  const cleanBank = encodeURIComponent(bankCode || 'MB');
  const cleanAcc = encodeURIComponent(accountNumber.replace(/\s+/g, ''));
  const cleanMemo = encodeURIComponent(memo);
  const cleanName = encodeURIComponent(accountHolder || 'TIEM NHO AN YEN');
  return `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-compact2.png?amount=${Math.round(amount)}&addInfo=${cleanMemo}&accountName=${cleanName}`;
}

export interface BankOption {
  code: string;
  name: string;
  shortName: string;
}

export const VIETNAMESE_BANKS: BankOption[] = [
  { code: 'MB', name: 'Ngân hàng Quân Đội (MB Bank)', shortName: 'MB Bank' },
  { code: 'VCB', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)', shortName: 'Vietcombank' },
  { code: 'TCB', name: 'Ngân hàng Kỹ Thương Việt Nam (Techcombank)', shortName: 'Techcombank' },
  { code: 'ACB', name: 'Ngân hàng Á Châu (ACB)', shortName: 'ACB' },
  { code: 'VPB', name: 'Ngân hàng Việt Nam Thịnh Vượng (VPBank)', shortName: 'VPBank' },
  { code: 'TPB', name: 'Ngân hàng Tiên Phong (TPBank)', shortName: 'TPBank' },
  { code: 'ICB', name: 'Ngân hàng Công Thương Việt Nam (VietinBank)', shortName: 'VietinBank' },
  { code: 'BIDV', name: 'Ngân hàng Đầu tư và Phát triển Việt Nam (BIDV)', shortName: 'BIDV' },
  { code: 'VBA', name: 'Ngân hàng Nông nghiệp & PTNT Việt Nam (Agribank)', shortName: 'Agribank' },
  { code: 'HDB', name: 'Ngân hàng Phát triển TP.HCM (HDBank)', shortName: 'HDBank' },
  { code: 'STB', name: 'Ngân hàng Sài Gòn Thương Tín (Sacombank)', shortName: 'Sacombank' },
  { code: 'OCB', name: 'Ngân hàng Phương Đông (OCB)', shortName: 'OCB' },
  { code: 'VIB', name: 'Ngân hàng Quốc tế (VIB)', shortName: 'VIB' },
  { code: 'SHB', name: 'Ngân hàng Sài Gòn - Hà Nội (SHB)', shortName: 'SHB' },
  { code: 'MSB', name: 'Ngân hàng Hàng Hải (MSB)', shortName: 'MSB' },
  { code: 'SEAB', name: 'Ngân hàng Đông Nam Á (SeABank)', shortName: 'SeABank' },
];

export const VIETNAMESE_PROVINCES = [
  'TP. Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Bình Dương',
  'Đồng Nai',
  'Bà Rịa - Vũng Tàu',
  'Lâm Đồng',
  'Khánh Hòa',
  'Quảng Nam',
  'Thừa Thiên Huế',
  'Quảng Ninh',
  'Bắc Ninh',
  'Hải Dương',
  'Thanh Hóa',
  'Nghệ An',
  'An Giang',
  'Kiên Giang',
  'Tây Ninh',
  'Bình Thuận',
  'Bình Phước',
  'Tiền Giang',
  'Bến Tre',
  'Vĩnh Long',
  'Đắk Lắk',
  'Gia Lai',
  'Khác',
];

// Lowercase + strip Vietnamese diacritics so "tram huong" matches "Trầm Hương"
export function normalizeSearchText(text: string | undefined | null): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// Keep digits only; convert +84 / 84 prefix to leading 0
export function normalizePhone(phone: string | undefined | null): string {
  let digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length === 11) digits = '0' + digits.slice(2);
  return digits;
}

export function isValidVietnamesePhone(phone: string): boolean {
  return /^0[35789]\d{8}$/.test(normalizePhone(phone));
}
