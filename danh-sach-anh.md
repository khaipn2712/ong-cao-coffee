# Danh sách ảnh cần chụp

Mỗi dòng là một khung ảnh chờ trên trang (khối có chú thích gạch chân đứt nét). Ảnh dùng ở nhiều nơi chỉ ghi một lần.
Tỉ lệ lấy theo khung lớn nhất mà ảnh xuất hiện; khi chụp nên chừa thêm khoảng trống quanh chủ thể để cắt cho các khung nhỏ hơn.

## Hướng ảnh chung

- **Ánh sáng tự nhiên**, ưu tiên nắng sớm hoặc chiều muộn ở Rừng Lạnh. Không dùng đèn flash.
- **Màu:** để ảnh trong và hơi mát, hợp với nền mực xanh và giấy kem của trang. Tránh tông nâu sepia đậm.
- **Người thật, việc thật:** đôi tay đang làm, khuôn mặt người nhà, dụng cụ cũ. Không dùng ảnh kho (stock).
- **Ảnh tư liệu cũ** (ông Cao, giấy tờ năm 1954, máy rang): scan 600 dpi, giữ nguyên vết thời gian, không tô màu lại.
- **Ảnh nền toàn màn** (hero, các giai đoạn): chủ thể lệch phải hoặc ở nửa trên, chừa góc trái dưới cho chữ.
- **Bao bì sản phẩm:** chụp trên nền giấy trơn màu kem, ánh sáng mềm từ một phía, cùng góc máy cho cả bộ.

## Cách thay ảnh vào trang

1. Xuất ảnh dạng WebP (hoặc JPEG chất lượng khoảng 80) theo chiều ngang gợi ý, lưu vào `assets/img/`.
2. Thay khối `<div class="... ph ..." style="--ph: ...">…</div>` bằng
   `<img class="(giữ class bố cục cũ, bỏ ph)" src="assets/img/ten-anh.webp" alt="mô tả ngắn" width="…" height="…" loading="lazy" decoding="async">`.
3. Ảnh hero đầu trang không đặt `loading="lazy"` và nên thêm `fetchpriority="high"`.

## Danh sách

| # | Nội dung ảnh | Dùng ở | Tỉ lệ | Chiều ngang xuất |
|---|---|---|---|---|
| 1 | Ông Cao (ảnh sepia) đứng cạnh các cháu hôm nay | Trang chủ · Hero, ảnh nền toàn màn | 16:9 | 2880 px |
| 2 | Mầm cà phê non trong bầu đất | Trang chủ · Hero, ảnh nền toàn màn | 16:9 | 2880 px |
| 3 | Hoa trắng phủ kín cành cà phê | Trang chủ · Hero, ảnh nền toàn màn | 16:9 | 2880 px |
| 4 | Chùm quả Robusta chín đỏ | Trang chủ · Hero, ảnh nền toàn màn | 16:9 | 2880 px |
| 5 | Đôi tay đảo hạt trong mẻ rang | Trang chủ · Hero, ảnh nền toàn màn | 16:9 | 2880 px |
| 6 | Ảnh mùa hái | Trang chủ · Hero, ô kính nhỏ | 3:2 | 1200 px |
| 7 | Ảnh shop | Trang chủ · Hero, ô kính nhỏ | 16:9 | 1200 px |
| 8 | Gói Signature | Trang chủ · Hero, ô kính nhỏ | 3:2 | 1200 px |
| 9 | Ảnh ông Cao | Trang chủ · Hero, ô kính nhỏ | 4:5 | 1200 px |
| 10 | Ảnh nhật ký | Trang chủ · Hero, ô kính nhỏ | 4:5 | 1200 px |
| 11 | Hoa cà phê trắng phủ kín vườn | Trang chủ · Một năm trên đất Đức An (nền) | 5:4 | 2880 px |
| 12 | Vườn mùa mưa, quả xanh trên cành | Trang chủ · Một năm trên đất Đức An (nền) | 5:4 | 2880 px |
| 13 | Tay người nhà hái giữa vườn | Trang chủ · Một năm trên đất Đức An (nền) | 5:4 | 2880 px |
| 14 | Sân phơi rực nắng, đầy quả | Trang chủ · Một năm trên đất Đức An (nền) | 5:4 | 2880 px |
| 15 | Góc xưởng rang của nhà | Trang chủ · Một năm trên đất Đức An (nền) | 5:4 | 2880 px |
| 16 | Chân dung ông Nguyễn Bá Cao (1930–2009) | Trang chủ · Chuyện ông Cao (tư liệu) | 4:5 | 1200 px |
| 17 | Ông Cao thời trẻ | Trang chủ · Chuyện ông Cao (tư liệu) | 4:5 | 1200 px |
| 18 | Một trang giấy có chữ tay của ông | Trang chủ · Chuyện ông Cao (tư liệu)<br>Lịch sử · Chương 4 | 3:4 | 1200 px |
| 19 | Ông Cao thuở làm nông ở Đức Lập | Trang chủ · Chuyện ông Cao (tư liệu)<br>Lịch sử · Chương 2<br>Về Ông Cao · Đầu trang (tư liệu) | 4:5 | 1200 px |
| 20 | Chiếc máy rang cũ, vẫn còn nhớ mùi | Trang chủ · Chuyện ông Cao (tư liệu)<br>Lịch sử · Chương 3 | 1:1 | 1200 px |
| 21 | Nhà mình năm 1997 | Trang chủ · Chuyện ông Cao (tư liệu)<br>Lịch sử · Chương 3 | 3:2 | 1400 px |
| 22 | Những hàng cà phê đầu tiên ở Đức An | Trang chủ · Chuyện ông Cao (tư liệu)<br>Lịch sử · Chương 4 | 3:2 | 1400 px |
| 23 | Lối đi giữa vườn cà phê ở nông trại | Trang chủ · Nông trại và cửa hàng | 3:2 | 1200 px |
| 24 | Cửa hàng đang được xây | Trang chủ · Nông trại và cửa hàng<br>Lịch sử · Chương 5 | 3:2 | 1400 px |
| 25 | Cả nhà bên chiếc máy rang cũ | Lịch sử · Ảnh bìa | 21:9 | 2300 px |
| 26 | Quê nhà của ông | Lịch sử · Chương 1 | 4:3 | 1400 px |
| 27 | Giấy tờ đi đường năm 1954 | Lịch sử · Chương 1 | 3:4 | 1200 px |
| 28 | Vùng Đắk Mil những năm đầu | Lịch sử · Chương 2 | 3:2 | 1400 px |
| 29 | Những gói cà phê Ông Cao đầu tiên | Lịch sử · Chương 5 | 4:3 | 1400 px |
| 30 | Vườn cà phê Rừng Lạnh | Về Ông Cao · Đầu trang (tư liệu) | 1:1 | 1200 px |
| 31 | Gói cà phê đầu tiên của nhà | Về Ông Cao · Đầu trang (tư liệu) | 4:3 | 1200 px |
| 32 | Mẻ rang buổi sáng | Về Ông Cao · Đầu trang (tư liệu)<br>Một năm · Thẻ giai đoạn (nền) | 16:9 | 2400 px |
| 33 | Phin nhôm trên bàn | Về Ông Cao · Đầu trang (tư liệu) | 1:1 | 1200 px |
| 34 | Quả chín đỏ trên cành | Về Ông Cao · Đầu trang (tư liệu) | 5:4 | 1200 px |
| 35 | Cả nhà tiếp khách ở nông trại | Về Ông Cao · Bốn điều nhà mình giữ | 4:5 | 1200 px |
| 36 | Ngày rang ghi tay trên gói | Về Ông Cao · Bốn điều nhà mình giữ | 4:5 | 1200 px |
| 37 | Đảo mẻ rang bằng tay | Về Ông Cao · Bốn điều nhà mình giữ | 4:5 | 1200 px |
| 38 | Cây che bóng giữa vườn | Về Ông Cao · Bốn điều nhà mình giữ | 4:5 | 1200 px |
| 39 | Cành trắng hoa | Một năm · Thẻ giai đoạn (nền) | 16:9 | 2400 px |
| 40 | Chùm quả xanh | Một năm · Thẻ giai đoạn (nền) | 16:9 | 2400 px |
| 41 | Quả đỏ trên cành | Một năm · Thẻ giai đoạn (nền) | 16:9 | 2400 px |
| 42 | Sân phơi lúc bình minh | Một năm · Thẻ giai đoạn (nền) | 16:9 | 2400 px |

## Ảnh theo bài và theo giai đoạn

- **Ảnh minh hoạ bài nhật ký:** mỗi bài một ảnh ngang tỉ lệ 4:3, xuất 1200 px (bài nổi bật 1600 px). Hiện có 13 bài mẫu ở trang Nhật ký và 3 bài ở trang chủ.
- **Ba ảnh in ở section "Một năm trên đất Đức An" (trang chủ):** đổi theo 5 giai đoạn, mỗi giai đoạn 3 ảnh dọc tỉ lệ 4:5, xuất 1200 px.
  Nội dung từng ảnh nằm trong `assets/main.js`, mục `STAGES` → `photos`.
- **Ba ảnh nhỏ dưới hero** cắt từ ba ảnh hero tương ứng, không cần chụp riêng.
