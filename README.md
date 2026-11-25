# Ông Cao Coffee

Website bản thử của Ông Cao Coffee: HTML, CSS và JavaScript thuần, không cần bước build.

## Hai phiên bản

| Tên | Ở đâu | Nội dung |
|---|---|---|
| `original` | nhánh `original` và tag `original` | Bản gốc trước khi sửa theo bảng tiêu chí "$10K Checklist" |
| `10kweb` | nhánh `10kweb` | Bản sửa theo bảng tiêu chí: màu tiết chế, 2 họ chữ, ít chuyển động, font tự lưu, thẻ chia sẻ |

Quay lại bản gốc trên máy:

```bash
git switch original
```

Đưa trang đang chạy trên GitHub Pages về bản gốc (ghi đè nhánh `main`, chỉ làm khi chắc chắn):

```bash
git switch main && git reset --hard refs/tags/original && git push --force-with-lease origin main
```

## Cấu trúc

| File | Nội dung |
|---|---|
| `index.html` | Trang chủ |
| `lich-su.html` | Lịch sử: từ 1954, chuyện nhà trong từng mẻ rang |
| `ve-ong-cao.html` | Về thương hiệu |
| `san-pham.html` | Sản phẩm |
| `van-hoa.html` | Văn hoá cà phê và hướng dẫn pha |
| `mot-nam.html` | Một năm trên đất Đức An |
| `nhat-ky.html` | Nhật ký (bản tin) |
| `assets/styles.css` | Kiểu dùng chung và trang chủ; **hệ màu và font nằm ở đầu file** |
| `assets/pages.css` | Kiểu riêng của các trang con |
| `assets/main.js` | Hiệu ứng dùng chung cho mọi trang và trang chủ |
| `assets/pages.js` | Hiệu ứng riêng của các trang con |
| `assets/fonts/` | Fraunces và Archivo, tự lưu, chỉ giữ bộ ký tự Latin và tiếng Việt |
| `assets/img/` | Họa tiết đường đồng mức, favicon, icon, ảnh chia sẻ (OG) |
| `danh-sach-anh.md` | Danh sách ảnh cần chụp: nội dung, tỉ lệ, kích thước xuất |
| `noi-dung-website.md` | Bảng nội dung cũ của trang chủ (chưa cập nhật theo bản mới) |

## Hệ thiết kế (bản 10kweb)

- **Màu:** mực xanh (`--sky-*`), đỏ con dấu (`--cherry-*`, chỉ để nhấn), giấy (`--paper-*`), sương (`--mist`). Màu từng dòng sản phẩm chỉ nằm trên bao bì.
- **Chữ:** Fraunces cho tiêu đề, Archivo cho chữ thường và nhãn. Không thêm họ chữ thứ ba.
- **Chuyển động:** giữ 3 hiệu ứng đặc trưng (thẻ kính footer, chuyển trang, ảnh mở theo mặt nạ). Chữ không ẩn chờ cuộn.
- **Ảnh chờ:** khối `.ph` có đường đồng mức mờ; thay bằng ảnh thật theo `danh-sach-anh.md`.

## Chạy thử trên máy

```bash
python3 -m http.server 8123 --bind 127.0.0.1
```

Rồi mở <http://localhost:8123>.

## Đưa lên mạng

Mỗi lần `git push` lên nhánh `main`, trang tự cập nhật (sau khi đã nối GitHub Pages hoặc Hostinger).

- **GitHub Pages:** Settings → Pages → Deploy from a branch → `main`, thư mục `/ (root)`. File `.nojekyll` giúp GitHub phục vụ thẳng HTML tĩnh.
- **Hostinger:** hPanel → Advanced → Git → dán địa chỉ repo, nhánh `main`, thư mục `public_html`, bật Auto Deployment.

## Lưu ý khi sửa

- **Tăng số phiên bản** sau mỗi lần sửa CSS hoặc JS, ví dụ `styles.css?v=100` → `?v=101`, trong **cả 7 file HTML**, để trình duyệt không dùng bản cũ.
- **Header và footer được chép lại trong cả 7 file HTML.** Sửa menu hay footer thì sửa ở mọi file.
- **Nội dung tạm** có class `tam` (gạch chân chấm). Thay bằng nội dung thật rồi bỏ class.
- **Link chưa có đích** (bài viết, chi tiết sản phẩm, chính sách, mạng xã hội) mang `aria-disabled="true"` và không có `href`. Khi có trang thật, thêm `href` và bỏ thuộc tính này.
- **Khi có tên miền riêng:** thay `https://khaipn2712.github.io/ong-cao-coffee/` trong thẻ `canonical`, `og:url`, `og:image` và khối JSON-LD ở đầu mỗi file HTML.
- **Khi ra mắt chính thức:** xoá dòng `<meta name="robots" content="noindex, nofollow">` ở đầu mỗi file HTML và xoá khối `draft-note` ("Bản thử…").
