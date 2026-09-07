# DV2 Livechat Streaming WordPress Plugin

Plugin này giúp tích hợp Livechat Vite vào website WordPress.

## Hướng dẫn cài đặt

1.  **Build dự án React:**
    Tại thư mục gốc của dự án `plugin_livechat`, chạy lệnh:
    ```bash
    npm run build
    ```

2.  **Copy file assets:**
    Sau khi build xong, copy các file `.js` và `.css` từ thư mục `dist/assets/` vào thư mục `wordpress-plugin/assets/`.

3.  **Đóng gói Plugin:**
    Nén thư mục `wordpress-plugin` thành file `.zip`.

4.  **Cài đặt trên WordPress:**
    - Vào trang quản trị WordPress -> Plugins -> Add New -> Upload Plugin.
    - Chọn file `.zip` vừa tạo và cài đặt.
    - Kích hoạt plugin.

5.  **Cấu hình:**
    - Vào menu "DV2 Streaming" ở thanh bên trái.
    - Nhập "Livechat Vite Site ID".
    - Lưu lại.

## Lưu ý
- Plugin tự động tìm file `.js` đầu tiên trong thư mục `assets` để load.
- Đảm bảo Site ID chính xác để chat hoạt động.
