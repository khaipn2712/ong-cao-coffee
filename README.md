# Ông Cao Coffee

Website bản thử của Ông Cao Coffee: HTML, CSS và JavaScript thuần, không cần bước build.

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
| `assets/styles.css` | Kiểu dùng chung và trang chủ; **hệ màu nằm ở đầu file** |
| `assets/pages.css` | Kiểu riêng của các trang con |
| `assets/main.js` | Hiệu ứng dùng chung cho mọi trang và trang chủ |
| `assets/pages.js` | Hiệu ứng riêng của các trang con |
| `noi-dung-website.md` | Bảng nội dung cũ của trang chủ (chưa cập nhật theo bản mới) |

## Chạy thử trên máy

```bash
python3 -m http.server 8123 --bind 127.0.0.1
```

Rồi mở <http://localhost:8123>.

## Đưa lên mạng

Mỗi lần `git push` lên nhánh `main`, trang tự cập nhật (sau khi đã nối GitHub Pages hoặc Hostinger).

- **GitHub Pages:** Settings → Pages → Deploy from a branch → `main`, thư mục `/ (root)`.
- **Hostinger:** hPanel → Advanced → Git → dán địa chỉ repo, nhánh `main`, thư mục `public_html`, bật Auto Deployment.

## Lưu ý khi sửa

- **Tăng số phiên bản** sau mỗi lần sửa CSS hoặc JS, ví dụ `styles.css?v=91` → `?v=92`, trong **cả 7 file HTML**, để trình duyệt không dùng bản cũ.
- **Header và footer được chép lại trong cả 7 file HTML.** Sửa menu hay footer thì sửa ở mọi file.
- **Nội dung tạm** có class `tam` (gạch chân chấm). Thay bằng nội dung thật rồi bỏ class.
- **Khi ra mắt chính thức:** xoá dòng `<meta name="robots" content="noindex, nofollow">` ở đầu mỗi file HTML và xoá khối `draft-note` ("Bản thử…").
