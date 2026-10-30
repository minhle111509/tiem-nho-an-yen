# Tiệm Nhỏ An Yên 🪷

Web bán vật phẩm phong thủy, mặt dây chuyền và nụ trầm hương — "Một chút an yên, gửi đến bạn."

**Tính năng:** danh mục & tìm kiếm sản phẩm (gõ không dấu được), giỏ hàng, đặt hàng không cần tài khoản,
thanh toán COD hoặc chuyển khoản VietQR, gói quà, tra cứu / tự hủy đơn, trang quản trị (đơn hàng, kho,
sản phẩm, cài đặt, tài khoản nhận tiền), AI Gemini gợi ý thông tin sản phẩm từ ảnh, cài như app (PWA).

**Thanh toán:** COD, chuyển khoản VietQR (tự điền số tiền + mã đơn), hoặc quét QR ví MoMo.

**Công nghệ:** React 19 + Vite + Tailwind (giao diện), Express (máy chủ), dữ liệu lưu trong `data/store.json`.

📖 **Hướng dẫn đăng / sửa sản phẩm, xử lý đơn, đổi PIN:** xem [HUONG_DAN_QUAN_LY.md](HUONG_DAN_QUAN_LY.md)

## Chạy trên máy Windows

1. Cài **Node.js 22 LTS** tại https://nodejs.org. Mở PowerShell, kiểm tra: `node -v` (phải ra v22.x).
2. Mở PowerShell trong thư mục dự án, cài thư viện:
   ```powershell
   npm install
   ```
3. Tạo file cấu hình: `copy .env.example .env` rồi mở `.env` bằng Notepad, điền:
   - `GEMINI_API_KEY` — lấy miễn phí tại https://aistudio.google.com/apikey (không bắt buộc).
   - `ADMIN_PIN` — mã PIN quản trị 6 số của bạn.
4. Chạy thử: `npm run dev` → mở http://localhost:3000

## Đưa lên mạng (production)

```powershell
npm install
npm run build
npm start
```

- Lần chạy đầu tiên, web tự tạo `data/store.json` với sản phẩm mẫu, tài khoản Vietcombank
  `0071001151943` và mã QR MoMo (`public/momo-qr.jpg`). Đổi tài khoản / tên chủ TK / ảnh MoMo trong
  **Quản trị → Tài Khoản & Mã QR**. Nếu xóa số tài khoản, web tự chuyển sang chỉ nhận COD.
- Hosting phải có **ổ đĩa lưu trữ lâu dài** (VPS, Render Disk, Railway Volume...) và đặt `DATA_DIR`
  trỏ vào đó; nếu không, đơn hàng sẽ mất mỗi lần deploy lại.
- Ảnh upload nằm ở `public/uploads/` — cần sao lưu cùng `data/`.

## Bảo mật — đọc kỹ

- **Không bao giờ** đưa file `.env` và thư mục `data/` lên GitHub (đã có sẵn trong `.gitignore`).
  `data/store.json` chứa tên, SĐT khách hàng và mã PIN.
- PIN mặc định là `123456`. Đổi bất cứ lúc nào trong **Quản trị → Cài Đặt Tiệm → Mã PIN Quản Trị Mới** (6 chữ số).
  Chỉ đặt biến `ADMIN_PIN` nếu muốn khóa PIN ở hosting (khi đó không đổi trong web được).
- Nhập sai PIN 10 lần sẽ bị khóa 15 phút.
- Nếu lỡ để lộ `GEMINI_API_KEY`, vào Google AI Studio xóa key cũ và tạo key mới.

## Lệnh hữu ích

| Lệnh | Tác dụng |
| --- | --- |
| `npm run dev` | Chạy chế độ phát triển |
| `npm run build` | Đóng gói giao diện vào `dist/` |
| `npm start` | Chạy bản chính thức (cần `build` trước) |
| `npm test` | Chạy kiểm thử tự động |
| `npm run lint` | Kiểm tra lỗi TypeScript |
