# Hướng dẫn quản lý Tiệm Nhỏ An Yên

Mọi thao tác làm ngay trên web, bằng điện thoại hoặc máy tính. Không cần sửa code.

## 1. Vào trang quản trị

1. Mở web → bấm biểu tượng **chiếc khiên** (góc phải trên cùng, hoặc mục **Chủ Tiệm** ở thanh dưới trên điện thoại).
2. Bấm bàn phím số để nhập mã PIN (hiện tại: `123456`) → **Vào Bảng Quản Trị**.
3. Các thẻ phía trên: **Tổng Quan · Đơn Hàng · Sản Phẩm · Cài Đặt Tiệm · Tài Khoản & Mã QR**.
4. Xong việc bấm **Thoát** (nhất là khi dùng máy người khác).

> Nhập sai PIN 10 lần sẽ bị khóa 15 phút — chờ rồi thử lại.

## 2. Đăng sản phẩm mới

1. Thẻ **Sản Phẩm** → bấm **📸 Chụp / Đăng Sản Phẩm Mới**.
2. **Ảnh** (bắt buộc, tối đa 10 ảnh):
   - **📸 Chụp Ảnh Ngay** để chụp bằng camera, hoặc **🖼️ Chọn Từ Thư Viện**.
   - Ảnh được tự động nén cho nhẹ. Ảnh có nhãn **ẢNH BÌA** là ảnh hiện ngoài cửa hàng;
     bấm **Làm bìa** ở ảnh khác để đổi, dùng mũi tên ‹ › để sắp xếp, 🔄 để thay, 🗑 để xóa.
3. *(Tùy chọn)* Bấm **AI Gợi Ý Tên & Mô Tả** — AI Gemini xem ảnh và tự điền tên, chất liệu,
   ý nghĩa, mô tả, giá gợi ý. **Luôn đọc lại và sửa** trước khi đăng, nhất là giá và chất liệu.
4. **Thông Tin Cốt Lõi** (có dấu * là bắt buộc):
   | Ô | Ghi gì |
   | --- | --- |
   | Tên sản phẩm | Tên khách nhìn thấy |
   | Mã SKU | Mã riêng để bạn quản lý kho, ví dụ `AY-TRAM-045`. Không trùng nhau |
   | Danh mục chính | Vật Phẩm An Lành / Duyên Lành Bên Mình / Hương Trầm Tĩnh Tại |
   | Giá bán (₫) | Chỉ gõ số, không dấu chấm: `480000` |
   | Giá niêm yết cũ | Để trống nếu không giảm giá. Nhập giá cao hơn giá bán → web tự hiện "Giảm ~X%" |
   | Số lượng tồn kho | Số món đang có thật trong tiệm |
   | Xuất xứ | Ví dụ: Tiên Phước, Quảng Nam |
5. **Đặc Tính & Ý Nghĩa An Yên**: chất liệu, kích thước, màu, ý nghĩa, mô tả, cách dùng, cách bảo quản.
6. Đánh dấu nếu muốn:
   - **Sản phẩm Nổi Bật (Trang chủ)** → hiện ở mục nổi bật trang chủ.
   - **Gắn nhãn Mới Về** → hiện ở mục hàng mới.
7. Bấm:
   - **ĐĂNG BÁN NGAY** → khách thấy và mua được ngay.
   - **LƯU BẢN NHÁP** → lưu lại nhưng khách chưa thấy (để hoàn thiện sau).

## 3. Cập nhật sản phẩm hằng ngày

Trong thẻ **Sản Phẩm**, mỗi sản phẩm có các nút:

| Việc cần làm | Bấm |
| --- | --- |
| Đổi giá, ảnh, mô tả, **nhập thêm hàng** (tăng tồn kho) | **Sửa** → chỉnh → **ĐĂNG BÁN NGAY** |
| Tạm ngưng bán (hết hàng lâu, chưa muốn xóa) | **Ẩn** — bấm **Bật bán** để mở lại |
| Thêm mẫu gần giống sản phẩm cũ | **Nhân bản** → bản sao được lưu dạng nháp, tên có chữ "(Bản sao)" → **Sửa** lại tên, SKU, ảnh, giá → **ĐĂNG BÁN NGAY** |
| Bỏ hẳn sản phẩm | 🗑 **Xóa** (không hoàn tác được; đơn cũ vẫn giữ nguyên) |

Mẹo:
- **Nên dùng "Ẩn" thay vì "Xóa"** — sau này có hàng lại chỉ cần bật lên.
- Nhãn trạng thái: **ĐANG BÁN** (khách thấy) · **BẢN NHÁP / ẨN** (khách không thấy).
- Sản phẩm còn **≤ 5 món** sẽ có cảnh báo tồn kho thấp ở thẻ **Tổng Quan**.

### Tồn kho tự động — không cần trừ tay
- Khách đặt hàng → web **tự trừ** tồn kho.
- Bạn (hoặc khách) **hủy đơn** → web **tự cộng lại** tồn kho.
- Khách không thể đặt nhiều hơn số còn trong kho.
- Bạn chỉ cần **Sửa → tăng "Số lượng tồn kho"** khi nhập hàng mới về,
  hoặc giảm khi bán trực tiếp ngoài web (bán tại tiệm, qua Facebook...).

## 4. Xử lý đơn hàng

Thẻ **Đơn Hàng** — đơn mới nằm ở trạng thái **Chờ xác nhận**:
1. Gọi / nhắn Zalo xác nhận với khách → bấm **Xác nhận đơn** → khi đóng gói bấm **Đang gói hàng**.
2. Đơn chuyển khoản / MoMo: kiểm tra app ngân hàng / MoMo, thấy tiền có nội dung đúng **mã đơn**
   (dạng `AY-261030-K7Q2`) → bấm **✓ Đã nhận tiền** (bấm nhầm thì **Bỏ đánh dấu TT**).
3. Giao cho shipper → **Giao hàng (Nhập VĐ)**: nhập đơn vị vận chuyển + mã vận đơn → **Xác nhận giao hàng**
   (khách tự tra cứu được ở mục Tra Cứu).
4. Khách nhận hàng → **Giao thành công**.
5. **Ghi chú** → ghi chú nội bộ (khách không nhìn thấy) → **Lưu ghi chú**.
6. **Hủy đơn** → tồn kho tự cộng lại.

## 5. Cài đặt tiệm & đổi mã PIN

- Thẻ **Cài Đặt Tiệm**: tên tiệm, hotline, Zalo, địa chỉ, phí ship, ngưỡng miễn phí ship, phí gói quà.
- **Đổi mã PIN**: Cài Đặt Tiệm → ô **Mã PIN Quản Trị Mới** → nhập **đúng 6 chữ số** → **LƯU TẤT CẢ CÀI ĐẶT**.
  Bạn vẫn đăng nhập tiếp được; lần sau dùng PIN mới.
  (Nếu trên hosting có đặt biến `ADMIN_PIN` thì phải đổi PIN ở hosting, không đổi trong web được.)
- Thẻ **Tài Khoản & Mã QR**: số tài khoản Vietcombank, tên chủ tài khoản, ảnh QR MoMo (đổi ảnh / tắt MoMo).

## 6. Sao lưu — rất quan trọng

Toàn bộ sản phẩm, đơn hàng, cài đặt nằm trong `data/store.json`; ảnh bạn chụp tải lên nằm trong `public/uploads/`.
**Mỗi tuần tải 2 thư mục này về máy** (hoặc nhờ người quản lý hosting làm).
Mất 2 thư mục này là mất sản phẩm và đơn hàng — GitHub **không** lưu chúng.

## Gặp lỗi thường gặp

| Hiện tượng | Cách xử lý |
| --- | --- |
| Báo "Mã PIN quản trị không chính xác" khi đang dùng | PIN vừa bị đổi ở máy khác → Thoát, đăng nhập lại bằng PIN mới |
| Không tải được ảnh | Chỉ nhận JPG, PNG, WEBP, tối đa 5MB/ảnh (ảnh điện thoại thường tự nén đủ nhỏ) |
| AI gợi ý ra nội dung chung chung | Hosting chưa có `GEMINI_API_KEY` hoặc key hết hạn → kiểm tra lại key |
| Giá hiện sai | Gõ số liền, không dấu chấm/phẩy: `1250000` |
| Khách báo không đặt được vì hết hàng | Sửa → tăng tồn kho |
