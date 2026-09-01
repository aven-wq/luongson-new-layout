# Toplist Frontend

WordPress plugin hiển thị Top List nhà cái linh hoạt trên website.

## Tính năng

### Frontend

- **Shortcode `[toplist]`** — Giao diện sáng (Light Sidebar), phù hợp đặt ở sidebar hoặc nội dung trang.
- **Shortcode `[toplist_style2]`** — Giao diện tối (Dark Sidebar).
- **Shortcode `[toplist_style3]`** — Thanh slider ngang sáng (Light Header).
- **Shortcode `[toplist_style4]`** — Thanh slider ngang tối (Dark Header).
- **Tự động ẩn** khi khung chứa hẹp hơn 280px.
- **Lọc theo loại** — Tham số `type` (mặc định `type=G` cho Game, `type=S` cho Sport).
- **Giới hạn số lượng** — Tham số `limit`.
- **Tuỳ chỉnh tiêu đề** — Tham số `title`.

### Admin

- **Quản lý link** — Chỉnh sửa trực tiếp Mlink và Review Link cho từng domain ngay trên bảng (inline edit).
- **Filter tabs** — Lọc danh sách theo nhóm: All, Game, Sport, GBĐT.
- **Cột GBĐT** — Hiển thị biểu tượng sao vàng cho các mục GBĐT.
- **Xoá cache** — Nút Clear cache xoá dữ liệu tạm và tải lại từ API.
- **Hướng dẫn shortcode** — Các thẻ shortcode kèm nút sao chép, tham số tuỳ chỉnh.

### Hệ thống

- **Cache dữ liệu** — Tự động cache API, giảm tải request. Cache tự động xoá khi thay đổi cài đặt qua Settings.
- **Auto-update** — Cập nhật plugin tự động qua GitHub Releases (cần tạo release với tag version, ví dụ `v1.0.1`).

## Shortcode

```
[toplist]
[toplist limit=5]
[toplist title="Top 10" limit=3]
[toplist type=S]
[toplist_style2]
[toplist_style3 limit=4]
[toplist_style4]
```

## Tham số

| Tham số | Mô tả | Mặc định |
|---------|-------|----------|
| `limit` | Giới hạn số lượng hiển thị | 0 (không giới hạn) |
| `title` | Tiêu đề tuỳ chỉnh. Nếu không set sẽ lấy tiêu đề từ cài đặt | — |
| `type` | Lọc theo loại: `G` (Game) hoặc `S` (Sport) | `G` |

## Hướng dẫn sử dụng

1. Kích hoạt plugin, vào menu **Toplist - GBDT** trong Admin.
2. Bảng hiển thị danh sách các item từ API, kèm cột Mlink và Review Link để chỉnh sửa.
3. Click vào giá trị Mlink hoặc Review Link để sửa trực tiếp (inline edit).
4. Dùng filter tabs **All / Game / Sport / GBĐT** để lọc danh sách.
5. Dùng shortcode `[toplist]` để hiển thị ở trang hoặc widget.

## Cấu hình

```php
define('TF_API_URL', 'https://...');     // API endpoint lấy dữ liệu
define('TF_CACHE_TIME', 10);             // Thời gian cache (phút)
define('TF_CACHE_KEY', 'tf_data');       // Transient key
```

## Yêu cầu

- WordPress 5.0+
- PHP 7.4+

## Phát triển

Tạo release trên GitHub với tag `v<version>` để kích hoạt auto-update.
