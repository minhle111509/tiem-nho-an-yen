# Hướng dẫn vận hành Tiệm Nhỏ An Yên

Mọi thao tác quản lý làm ngay trên web, bằng điện thoại hoặc máy tính. **Không cần sửa code.**

## 0. Thông tin cần nhớ

| Mục | Giá trị |
| --- | --- |
| Địa chỉ web | https://tiem-nho-an-yen.minhle111509.workers.dev |
| Vào quản trị | Biểu tượng **chiếc khiên** trên web → mã PIN (mặc định `123456`, nên đổi) |
| Nơi chạy web | Cloudflare → **Workers & Pages** → `tiem-nho-an-yen` |
| Mã nguồn | GitHub `minhle111509/tiem-nho-an-yen` (nhánh `main`) |
| Dữ liệu (sản phẩm, đơn, cài đặt, ảnh) | Lưu trên Cloudflare — **không** nằm trên GitHub |
| Nhận tiền | Vietcombank `0071001151943` – NGUYEN THI KIM NGAN · ví MoMo (mã QR) |
| Trang liên kết | innercode-v2.pages.dev · minhle111509.github.io/innercode-giai-doan-1-v2/ |

## 1. Lịch làm việc gợi ý

**Mỗi ngày**

- Mở thẻ **Tổng Quan**: xem số đơn **Chờ duyệt**, doanh thu, cảnh báo **tồn kho thấp** (≤ 5 món).
- Xử lý đơn mới (mục 5), đối soát tiền chuyển khoản / MoMo (mục 6).

**Mỗi tuần**

- **TẢI BẢN SAO LƯU** (mục 8) và cất vào Google Drive.
- Rà sản phẩm: ẩn món hết hàng lâu, cập nhật giá, thêm hàng mới.

**Khi cần**

- Đổi PIN, phí ship, tài khoản nhận tiền (mục 7).

## 2. Vào và thoát trang quản trị

1. Mở web → bấm biểu tượng **chiếc khiên** (góc phải trên cùng; trên điện thoại là mục **Chủ Tiệm** ở thanh dưới).
2. Bấm bàn phím số để nhập PIN → **Vào Bảng Quản Trị**.
3. Các thẻ: **Tổng Quan · Đơn Hàng · Sản Phẩm · Cài Đặt Tiệm · Tài Khoản & Mã QR**. Nút **Làm mới** để tải số liệu mới nhất.
4. Xong việc bấm **Thoát** — nhất là khi dùng máy người khác.

> Nhập sai PIN 10 lần sẽ bị khóa 15 phút — chờ rồi thử lại.

## 3. Khách hàng mua hàng thế nào (để bạn hướng dẫn khách)

1. Xem sản phẩm ở **Cửa Tiệm**, tìm kiếm được cả khi gõ không dấu (ví dụ `tram huong`).
2. **Thêm vào giỏ** → **TIẾN HÀNH ĐẶT HÀNG** → điền họ tên, SĐT (10 số), địa chỉ; có thể chọn **gói quà** kèm lời chúc.
3. Chọn thanh toán:

    - **Chuyển khoản VietQR**: màn hình hiện mã QR Vietcombank đã điền sẵn **số tiền** và **mã đơn**; bên dưới có thêm **QR MoMo** (khách tự nhập số tiền, lời nhắn ghi mã đơn).
    - **COD**: trả tiền mặt khi nhận hàng.

4. Khách nhận **mã đơn** dạng `AY-261030-K7Q2`. Không cần tạo tài khoản.
5. Mục **Tra Cứu**: nhập mã đơn + SĐT để xem tiến độ, mã vận đơn. Khi đơn còn **Chờ tiệm xác nhận**, khách tự bấm **Yêu cầu hủy đơn** được; sau đó phải gọi tiệm.

Phí ship và miễn phí ship tính tự động theo **Cài Đặt Tiệm**. Khách **không thể** đặt nhiều hơn số hàng còn trong kho.

## 4. Quản lý sản phẩm

### Đăng sản phẩm mới
1. Thẻ **Sản Phẩm** → **📸 Chụp / Đăng Sản Phẩm Mới**.
2. **Ảnh** (bắt buộc, tối đa 10 ảnh): **📸 Chụp Ảnh Ngay** hoặc **🖼️ Chọn Từ Thư Viện**. Ảnh tự nén cho nhẹ.
    Ảnh có nhãn **ẢNH BÌA** hiện ngoài cửa hàng; **Làm bìa** để đổi, ‹ › để sắp xếp, 🔄 để thay, 🗑 để xóa.
3. *(Tùy chọn)* **AI Gợi Ý Tên & Mô Tả** — AI xem ảnh và điền sẵn. **Luôn đọc lại và sửa**, nhất là giá và chất liệu.
4. **Thông Tin Cốt Lõi** (* là bắt buộc):

    | Ô | Ghi gì |
    | --- | --- |
    | Tên sản phẩm | Tên khách nhìn thấy |
    | Mã SKU | Mã riêng để quản lý kho, ví dụ `AY-TRAM-045`. Không trùng nhau |
    | Danh mục chính | Vật Phẩm An Lành / Duyên Lành Bên Mình / Hương Trầm Tĩnh Tại |
    | Giá bán (₫) | Chỉ gõ số, không dấu chấm: `480000` |
    | Giá niêm yết cũ | Để trống nếu không giảm giá; cao hơn giá bán → web tự hiện "Giảm ~X%" |
    | Số lượng tồn kho | Số món đang có thật |
    | Xuất xứ | Ví dụ: Tiên Phước, Quảng Nam |

5. **Đặc Tính & Ý Nghĩa An Yên**: chất liệu, kích thước, màu, ý nghĩa, mô tả, cách dùng, cách bảo quản.
6. Tùy chọn: **Sản phẩm Nổi Bật (Trang chủ)**, **Gắn nhãn Mới Về**.
7. **ĐĂNG BÁN NGAY** (khách thấy ngay) hoặc **LƯU BẢN NHÁP** (khách chưa thấy).

### Cập nhật hằng ngày

| Việc cần làm | Bấm |
| --- | --- |
| Đổi giá, ảnh, mô tả, **nhập thêm hàng** | **Sửa** → chỉnh → **ĐĂNG BÁN NGAY** |
| Tạm ngưng bán | **Ẩn** (mở lại bằng **Bật bán**) |
| Thêm mẫu gần giống | **Nhân bản** → bản sao lưu dạng nháp, tên có "(Bản sao)" → **Sửa** tên, SKU, ảnh, giá → **ĐĂNG BÁN NGAY** |
| Bỏ hẳn | 🗑 **Xóa** (không hoàn tác; đơn cũ vẫn giữ) |

- **Nên dùng "Ẩn" thay vì "Xóa".**
- Nhãn trạng thái: **ĐANG BÁN** (khách thấy) · **BẢN NHÁP / ẨN** (khách không thấy).

### Tồn kho tự động
- Khách đặt → **tự trừ**; hủy đơn → **tự cộng lại**.
- Bạn chỉ **Sửa → đổi "Số lượng tồn kho"** khi nhập hàng mới hoặc bán ngoài web (tại tiệm, Facebook...).

## 5. Xử lý đơn hàng

Thẻ **Đơn Hàng** có bộ lọc: **Tất cả · Chờ duyệt · Đã duyệt · Đang gói · Đang giao · Đã giao · Đã hủy**, và ô tìm theo mã đơn / tên / SĐT.

1. Đơn mới ở **Chờ duyệt** → gọi / Zalo xác nhận với khách → **Xác nhận đơn**.
2. Khi đóng gói → **Đang gói hàng**.
3. Giao cho shipper → **Giao hàng (Nhập VĐ)** → nhập đơn vị vận chuyển + mã vận đơn → **Xác nhận giao hàng**. Khách tra cứu được mã vận đơn.
4. Khách nhận hàng → **Giao thành công**.
5. **Ghi chú** → ghi chú nội bộ (khách **không** thấy) → **Lưu ghi chú**.
6. **Hủy đơn** → tồn kho tự cộng lại.

Mỗi thao tác được ghi vào **lịch sử đơn** kèm giờ.

## 6. Đối soát tiền

- Đơn **chuyển khoản / MoMo**: mở app Vietcombank hoặc MoMo, tìm giao dịch có **nội dung = mã đơn** và **đúng số tiền** → về web bấm **✓ Đã nhận tiền**. Bấm nhầm → **Bỏ đánh dấu TT**.
- Khách chuyển thiếu / sai nội dung: gọi khách, ghi vào **Ghi chú** nội bộ, chỉ bấm Đã nhận tiền khi đủ.
- Đơn **COD**: khi shipper trả tiền về thì bấm **✓ Đã nhận tiền**.
- **Tổng Quan** tách: doanh thu **đã thu** · tổng giá trị đơn · tiền **chờ thanh toán**.

## 7. Cài đặt

- **Cài Đặt Tiệm**: tên tiệm, slogan, hotline, Zalo, địa chỉ, phí ship cố định, ngưỡng miễn phí ship, phí gói quà → **LƯU TẤT CẢ CÀI ĐẶT**.
- **Đổi mã PIN**: Cài Đặt Tiệm → **Mã PIN Quản Trị Mới** → **đúng 6 chữ số** → **LƯU TẤT CẢ CÀI ĐẶT**. Bạn vẫn đăng nhập tiếp được; máy khác phải đăng nhập lại bằng PIN mới.
- **Tài Khoản & Mã QR**: ngân hàng, số tài khoản, **tên chủ tài khoản (IN HOA KHÔNG DẤU)**, bật/tắt VietQR tự điền số tiền, ảnh QR MoMo (**Đổi ảnh khác** / **Tắt MoMo**) → **LƯU THAY ĐỔI VÀO CƠ SỞ DỮ LIỆU**.
  Xóa số tài khoản → web tự chỉ nhận COD. Mọi lần đổi tài khoản được ghi vào lịch sử bên dưới.
- Đơn đã đặt **giữ nguyên** thông tin tài khoản lúc đặt, kể cả khi bạn đổi tài khoản sau đó.

## 8. Sao lưu và khôi phục — rất quan trọng

Toàn bộ sản phẩm, đơn hàng, cài đặt nằm trên Cloudflare. GitHub **không** lưu chúng.

- **Sao lưu (mỗi tuần):** **Cài Đặt Tiệm** → kéo xuống **Sao Lưu & Khôi Phục Dữ Liệu** → **TẢI BẢN SAO LƯU**. Máy tải file `tiem-nho-an-yen-backup-<ngày>.json` — cất vào Google Drive / máy tính.
  File có SĐT khách và mã PIN: **không gửi cho ai, không đưa lên GitHub**.
- **Khôi phục:** cùng chỗ → **KHÔI PHỤC TỪ FILE...** → chọn file → xác nhận. **Thay thế toàn bộ** dữ liệu hiện tại → tải bản sao lưu mới nhất trước khi khôi phục. Sau khôi phục web tự thoát, đăng nhập lại (PIN là PIN trong file sao lưu).
- File sao lưu **không chứa ảnh**, chỉ chứa đường dẫn ảnh. Giữ ảnh gốc trong điện thoại.

## 9. Quản lý trên Cloudflare (ít khi cần)

Vào https://dash.cloudflare.com → **Workers & Pages** → **tiem-nho-an-yen**.

| Việc | Ở đâu |
| --- | --- |
| Xem web có đang cập nhật / lỗi không | Thẻ **Deployments** (bản mới nhất có dấu ✓ là thành công) |
| Quay về bản trước nếu bản mới có lỗi | **Deployments** → bản cũ → **⋯** → **Rollback** (dữ liệu không đổi) |
| Thêm / đổi khóa AI Gemini | **Settings** → **Variables and Secrets** → `GEMINI_API_KEY` (Type **Secret**) |
| Gắn tên miền riêng | Thẻ **Domains** → **Add** → **Custom domain** |
| Xem lượt truy cập | Thẻ **Metrics** |

- Mỗi lần code mới lên GitHub, Cloudflare **tự cập nhật web** sau 2–3 phút. Bản lỗi sẽ không thay bản đang chạy.
- **Không** bấm **Enable Access** ở mục Worker URL (khách sẽ phải đăng nhập mới xem được web).
- Gói miễn phí đủ cho tiệm nhỏ (khoảng 100.000 lượt truy cập/ngày).

## 10. Bảo mật

- Đổi PIN khỏi `123456` khi bán thật; không chia sẻ PIN qua tin nhắn công khai.
- Khóa API Gemini chỉ nằm trong **Secret** của Cloudflare — không dán vào code, không gửi qua chat.
- Lộ khóa Gemini → vào https://aistudio.google.com/apikey xóa khóa cũ, tạo khóa mới, cập nhật Secret.
- Khi tự sửa file trên GitHub: **tắt tự dịch** của trình duyệt (nó từng đổi `main` thành "chủ yếu").

## 11. Gặp lỗi thường gặp

| Hiện tượng | Cách xử lý |
| --- | --- |
| "Mã PIN quản trị không chính xác" khi đang dùng | PIN vừa đổi ở máy khác → **Thoát**, đăng nhập lại bằng PIN mới |
| Bị khóa đăng nhập 15 phút | Nhập sai quá 10 lần → chờ 15 phút |
| Không tải được ảnh | Chỉ nhận JPG, PNG, WEBP, tối đa 2MB/ảnh (web tự nén ảnh điện thoại) |
| AI gợi ý ra nội dung chung chung | Chưa có Secret `GEMINI_API_KEY` hoặc khóa hết hạn |
| Giá hiện sai | Gõ số liền, không dấu chấm/phẩy: `1250000` |
| Khách báo không đặt được vì hết hàng | **Sửa** → tăng tồn kho |
| Khách không thấy lựa chọn chuyển khoản | Chưa có số tài khoản trong **Tài Khoản & Mã QR** |
| Web không vào được / báo lỗi | Cloudflare → **Deployments** xem bản mới nhất; lỗi thì **Rollback** bản trước và nhắn Claude |
| Lỡ xóa / sửa nhầm dữ liệu | **KHÔI PHỤC TỪ FILE...** bằng bản sao lưu gần nhất |

## 12. Cần sửa hoặc thêm tính năng

Nhắn Claude mô tả việc cần làm. Claude sửa code, chạy kiểm tra, đẩy lên GitHub → Cloudflare tự cập nhật web, **dữ liệu giữ nguyên**.
Với 2 web Inner Code v2: Claude gửi ảnh xem trước và chờ bạn "ok" rồi mới cập nhật.
