# Tiệm Nhỏ An Yên 🪷

Web bán vật phẩm phong thủy, mặt dây chuyền và nụ trầm hương — "Một chút an yên, gửi đến bạn."

**Tính năng:** danh mục & tìm kiếm sản phẩm (gõ không dấu được), giỏ hàng, đặt hàng không cần tài khoản,
thanh toán COD hoặc chuyển khoản VietQR, gói quà, tra cứu / tự hủy đơn, trang quản trị (đơn hàng, kho,
sản phẩm, cài đặt, tài khoản nhận tiền), AI Gemini gợi ý thông tin sản phẩm từ ảnh, cài như app (PWA).

**Công nghệ:** React 19 + Vite + Tailwind (giao diện), Express (máy chủ), dữ liệu lưu trong `data/store.json`.

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

- Lần chạy đầu tiên, web tự tạo `data/store.json` với sản phẩm mẫu và **chưa có số tài khoản ngân hàng**
  → chỉ nhận COD cho đến khi bạn vào **Quản trị → Thanh toán** nhập tài khoản nhận tiền.
- Hosting phải có **ổ đĩa lưu trữ lâu dài** (VPS, Render Disk, Railway Volume...) và đặt `DATA_DIR`
  trỏ vào đó; nếu không, đơn hàng sẽ mất mỗi lần deploy lại.
- Ảnh upload nằm ở `public/uploads/` — cần sao lưu cùng `data/`.

## Bảo mật — đọc kỹ

- **Không bao giờ** đưa file `.env` và thư mục `data/` lên GitHub (đã có sẵn trong `.gitignore`).
  `data/store.json` chứa tên, SĐT khách hàng và mã PIN.
- PIN mặc định khi chưa cấu hình là `123456` — **phải đổi** (đặt `ADMIN_PIN` hoặc đổi trong Quản trị → Cài đặt).
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
