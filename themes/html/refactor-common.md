# PROMPT HƯỚNG DẪN THỐNG NHẤT TOÀN BỘ HTML/CSS CHO CÁC PHẦN DÙNG CHUNG (SHARED COMPONENTS)

> **Mục tiêu**: Xử lý triệt để tình trạng lệch cấu trúc HTML, lệch class names và trùng lặp CSS giữa các trang (`index.html`, `nhandinh.html`, `lichthidau.html`, `tin.html`, `ung-tuyen-blv.html`). Đảm bảo **mọi thành phần dùng chung (cả dùng chung 5/5 trang và dùng chung 2-3 trang) phải có 1 cấu trúc HTML duy nhất (Single Source of Truth) và sử dụng chung 1 bộ CSS chuẩn hóa**.

---

## 1. BỐI CẢNH & VẤN ĐỀ CẦN GIẢI QUYẾT

Khi xuất từ Framer, cùng một component nhưng ở các trang khác nhau lại bị gán các class hash ngẫu nhiên khác nhau và class tiền tố khác nhau:
- `ls-s*` ở `index.html`
- `ls-blog-s*` ở `nhandinh.html` & `tin.html`
- `ls-ut-s*` ở `ung-tuyen-blv.html`
- Class hash dị biệt: `framer-14esc23` vs `framer-1y11z59`, `framer-1edlbah-container` vs `framer-ea4vkm-container`...

Hậu quả:
1. **Lệch cấu trúc HTML**: Cùng nội dung hiển thị nhưng DOM tree khác nhau làm việc bảo trì hoặc sửa component phải lặp lại trên từng file.
2. **Thừa & Trùng lặp CSS**: Mỗi trang lại phải viết thêm hàng trăm dòng CSS trùng nhau trong `blog.css`, `ung-tuyen-blv.css`, `lichthidau.css`, `global.css`.
3. **Lỗi Responsive không đồng bộ**: Khi fix responsive cho component ở trang Home thì các trang Con (Nhận định, Lịch thi đấu, Tin tức...) vẫn bị vỡ giao diện.

---

## 2. BẢNG PHÂN LOẠI TOÀN BỘ CÁC THÀNH PHẦN DÙNG CHUNG (SHARED COMPONENTS)

### NHÓM 1: GLOBAL SHARED COMPONENTS (DÙNG CHUNG TRÊN TOÀN BỘ 5/5 TRANG)

| STT | Tên Component | Phạm vi xuất hiện | Vị trí / Chức năng | Quy chuẩn Class BEM / Root |
| :--- | :--- | :--- | :--- | :--- |
| **1.1** | **Left Sidebar** | 5/5 trang | Cột điều hướng cố định bên trái (Logo, Navigation Links, Live Football Betting Banner) | `.luongson-sidebar-left`, `.luongson-sidebar-nav`, `.luongson-sidebar-banner` |
| **1.2** | **Sidebar Spacer** | 5/5 trang | Khối đệm bù trừ độ rộng của sidebar fixed trên màn hình desktop | `.luongson-sidebar-spacer` |
| **1.3** | **Brand Ambassador & SEO Block** | 5/5 trang | Khối Đại sứ thương hiệu (Phạm Văn Quyến) + Khối Text SEO có thanh cuộn | `.luongson-ambassador-seo-section`, `.luongson-ambassador-block`, `.luongson-seo-block` |
| **1.4** | **Footer** | 5/5 trang | Chân trang: Giới thiệu, Ticker Nhà tài trợ (10 Logo SVG), Địa chỉ, Miễn trừ trách nhiệm, Bản quyền | `.luongson-footer`, `.luongson-footer-content`, `.luongson-footer-sponsors`, `.luongson-footer-info`, `.luongson-footer-copyright` |
| **1.5** | **Catfish Sticky Banner** | 5/5 trang | Banner quảng cáo cố định đáy màn hình (2 banner + nút Đóng) | `.luongson-catfish` |
| **1.6** | **Top Header & Mobile Navigation Drawer** | 5/5 trang | Thanh Header trên cùng (Logo, Search input, Nút mở menu drawer mobile) | `.luongson-header`, `.luongson-mobile-header`, `.mobile-overlay-portal` |

---

### NHÓM 2: MULTI-PAGE SHARED COMPONENTS (DÙNG CHUNG TRÊN 2 - 3 TRANG)

| STT | Tên Component | Phạm vi xuất hiện | Vị trí / Chức năng | Quy chuẩn Class BEM / Root |
| :--- | :--- | :--- | :--- | :--- |
| **2.1** | **Top Nhà Cái Uy Tín (Top Bookmakers Ticker)** | **3 trang** (`index.html`, `nhandinh.html`, `tin.html`) | Dải ticker vô tận hiển thị logo và nút "Cược ngay" của các nhà cái (Haywin, Zowin, Nhatvip, Sunwin, Hitclub, Five88...) | `.luongson-top-bookmakers`, `.luongson-bookmakers-ticker` |
| **2.2** | **Top Bình Luận Viên (Top Commentators List/Carousel)** | **2 trang** (`index.html`, `lichthidau.html`) | Khối hiển thị danh sách BLV nổi bật (Avatar, Tên, Rating sao, Số lượng người theo dõi, Nút Follow) | `.luongson-top-commentators`, `.luongson-commentators-list`, `.luongson-commentator-card` |
| **2.3** | **Right Aside: Live Chat Box** | **2 trang** (`index.html`, `lichthidau.html`) | Khung trò chuyện trực tuyến bên cột phải (Header chat, Danh sách tin nhắn, Khung nhập chat, Nút gửi) | `.luongson-chat-widget`, `.luongson-chat-box` |
| **2.4** | **Right Aside: Bảng Xếp Hạng & Top Ghi Bàn** | **2 trang** (`index.html`, `lichthidau.html`) | Widget cột phải hiển thị BXH các giải đấu (Ngoại hạng Anh, La Liga, C1...) và danh sách Vua phá lưới | `.luongson-ranking-widget`, `.luongson-standings-table` |
| **2.5** | **Live Match Card / Hot Match Card** | **3 trang** (`index.html`, `lichthidau.html`, `nhandinh.html`) | Card hiển thị trận đấu trực tiếp / hot: Tên đội, Logo, Tỷ số/Giờ đá, Tỷ lệ kèo (HDP, O/U, 1X2), Avatar BLV | `.luongson-match-card`, `.luongson-live-grid` |
| **2.6** | **Article Card (Tin tức / Nhận định & Soi kèo)** | **3 trang** (`index.html`, `nhandinh.html`, `tin.html`) | Card bài viết: Thumbnail, Badge giải đấu/chuyên mục, Tiêu đề, Tóm tắt nội dung, Ngày đăng | `.luongson-article-card`, `.luongson-article-grid` |
| **2.7** | **Pagination Bar (Thanh phân trang)** | **2 trang** (`nhandinh.html`, `tin.html`) | Bộ nút chuyển trang (Trang 1, 2, 3... Trang kế) ở cuối danh sách bài viết | `.luongson-pagination` |
| **2.8** | **Marquee Ticker Bar (Dải chữ chạy thông báo)** | **3 trang** (`index.html`, `nhandinh.html`, `tin.html`) | Dải băng chữ chạy tự động thông báo ưu đãi, kèo thơm, tin nóng | `.luongson-marquee-ticker` |

---

## 3. MÃ NGUỒN MẪU CHUẨN HTML (SINGLE SOURCE OF TRUTH TEMPLATES)

### 3.1. Template Top Nhà Cái Uy Tín (`.luongson-top-bookmakers`)
> Dùng chung cho: `index.html`, `nhandinh.html`, `tin.html`
```html
<div class="framer-1a48m3p luongson-top-bookmakers">
  <div class="framer-WnCbM framer-jomkig framer-v-jomkig ls-s61" data-framer-name="Variant 1">
    <div class="framer-11vqsuc ls-s6" data-framer-name="Frame 5">
      <div class="framer-12yjqms ls-s62" data-framer-component-type="RichTextContainer" data-framer-name="Top">
        <p class="framer-text ls-s63"><span class="framer-text ls-s64">Top</span></p>
      </div>
      <div class="framer-b9mrqv ls-s65" data-framer-component-type="RichTextContainer" data-framer-name="nhà cái">
        <p class="framer-text ls-s66"><span class="framer-text ls-s67">nhà cái</span></p>
      </div>
      <div class="framer-gg6s9k ls-s68" data-framer-component-type="RichTextContainer" data-framer-name="uy tín">
        <p class="framer-text ls-s63"><span class="framer-text ls-s69" data-text-fill="true"><span class="framer-text ls-s70">uy tín</span></span></p>
      </div>
      <div class="framer-yvgt5m ls-s71">
        <div class="framer-xktb8h ls-s72" data-framer-component-type="SVG" data-framer-name="Star 1" aria-hidden="true">
          <div class="svgContainer ls-s73">
            <svg class="ls-s74" height="100%" preserveaspectratio="none" viewbox="0 0 21 21" width="100%">
              <path d="M10.5 1l2.936 5.949 6.564.954-4.75 4.63 1.121 6.538-5.871-3.087-5.871 3.087 1.121-6.538-4.75-4.63 6.564-.954L10.5 1z" fill="#FFC107" />
            </svg>
          </div>
        </div>
      </div>
    </div>
    <div class="framer-wpr0vp ls-s6 luongson-bookmakers-ticker" data-framer-name="Frame 7">
      <div class="framer-czcwzc ls-s75" data-framer-name="Brand" data-hide-scrollbars="true" draggable="false">
        <ul class="ls-s76">
          <!-- Item 1: Haywin -->
          <li aria-hidden="false" aria-posinset="1" aria-setsize="10" class="ticker-item ls-s77">
            <div class="framer-14efk8f ls-s78" data-framer-name="Frame 6">
              <div class="framer-1agm7zv ls-s79" data-border="true" data-framer-name="Logo">
                <div class="framer-1qel9h2 ls-s80" data-framer-name="Haywin 1">
                  <div class="framer-1mxabhp ls-s78" data-framer-name="Haywin 1" draggable="false">
                    <div class="ls-s4" data-framer-background-image-wrapper="true">
                      <img class="ls-s5" alt="Haywin" decoding="auto" draggable="false" height="1086" sizes="70px" src="./assets/images/E1I8BJYWVAxr1BL4kvm6fgXL6NI_7ec01d10.png?width=1593&amp;height=1086" width="1593" />
                    </div>
                  </div>
                </div>
              </div>
              <div class="framer-17nafjs ls-s81" data-framer-name="Logo">
                <a href="#" target="_blank" rel="noopener" class="framer-1c4pzc4 ls-s82" data-framer-component-type="RichTextContainer" data-framer-name="Cược ngay">
                  <p class="framer-text ls-s83" dir="auto">Cược ngay</p>
                </a>
              </div>
            </div>
          </li>
          <!-- Item 2: Zowin -->
          <li aria-hidden="false" aria-posinset="2" aria-setsize="10" class="ticker-item ls-s77">
            <div class="framer-1jpixx9 ls-s78" data-framer-name="Frame 8">
              <div class="framer-n35489 ls-s79" data-border="true" data-framer-name="Logo">
                <div class="framer-cupalj ls-s78" data-framer-name="Logo Zowin">
                  <div class="framer-1fnk0tz ls-s80" data-framer-name="main-logo 1" draggable="false">
                    <div class="ls-s4" data-framer-background-image-wrapper="true">
                      <img class="ls-s5" alt="Zowin" decoding="auto" draggable="false" height="1654" sizes="62px" src="./assets/images/WxHlJr9T6VzgNQKC6joChFwEA_f55c0508.png?width=1794&amp;height=1654" width="1794" />
                    </div>
                  </div>
                </div>
              </div>
              <div class="framer-aqmfr1 ls-s81" data-framer-name="Logo">
                <a href="#" target="_blank" rel="noopener" class="framer-1e8r8pt ls-s82" data-framer-component-type="RichTextContainer" data-framer-name="Cược ngay">
                  <p class="framer-text ls-s83" dir="auto">Cược ngay</p>
                </a>
              </div>
            </div>
          </li>
          <!-- Item 3: Nhatvip -->
          <li aria-hidden="false" aria-posinset="3" aria-setsize="10" class="ticker-item ls-s25">
            <div class="framer-1oj0s5k ls-s78" data-framer-name="Frame 9">
              <div class="framer-bic7d7 ls-s79" data-border="true" data-framer-name="Logo">
                <div class="framer-roat20 ls-s78" data-framer-name="Nhatvip">
                  <div class="framer-w9s8jx ls-s80" data-framer-name="image 1268363663" draggable="false">
                    <div class="ls-s4" data-framer-background-image-wrapper="true">
                      <img class="ls-s5" alt="Nhatvip" decoding="auto" draggable="false" height="1118" sizes="49px" src="./assets/images/ojOswWpgtF6A5PUR68iMbahdfAE_3f968412.png?width=1269&amp;height=1118" width="1269" />
                    </div>
                  </div>
                </div>
              </div>
              <div class="framer-1y8l9lx ls-s81" data-framer-name="Logo">
                <a href="#" target="_blank" rel="noopener" class="framer-1h3xllt ls-s82" data-framer-component-type="RichTextContainer" data-framer-name="Cược ngay">
                  <p class="framer-text ls-s83" dir="auto">Cược ngay</p>
                </a>
              </div>
            </div>
          </li>
          <!-- Item 4: Sunwin -->
          <li aria-hidden="false" aria-posinset="4" aria-setsize="10" class="ticker-item ls-s25">
            <div class="framer-1bkwy9s ls-s78" data-framer-name="Frame 10">
              <div class="framer-9610lg ls-s79" data-border="true" data-framer-name="Logo">
                <div class="framer-2kw60q ls-s78" data-framer-name="Logo Sunwin">
                  <div class="framer-ljahjn ls-s80" data-framer-name="sunwin 1" draggable="false">
                    <div class="ls-s4" data-framer-background-image-wrapper="true">
                      <img class="ls-s5" alt="Sunwin" decoding="auto" draggable="false" height="1069" sizes="46px" src="./assets/images/gK5DyMgZgLcvaGfXtH9DXigwVQ_120a9590.png?width=1098&amp;height=1069" width="1098" />
                    </div>
                  </div>
                </div>
              </div>
              <div class="framer-ktulmd ls-s81" data-framer-name="Logo">
                <a href="#" target="_blank" rel="noopener" class="framer-1r14nln ls-s82" data-framer-component-type="RichTextContainer" data-framer-name="Cược ngay">
                  <p class="framer-text ls-s83" dir="auto">Cược ngay</p>
                </a>
              </div>
            </div>
          </li>
          <!-- Item 5: Hitclub -->
          <li aria-hidden="false" aria-posinset="5" aria-setsize="10" class="ticker-item ls-s25">
            <div class="framer-1w6udpm ls-s78" data-framer-name="Frame 7">
              <div class="framer-24pmgd ls-s79" data-border="true" data-framer-name="Logo">
                <div class="framer-1k4c88r ls-s78" data-framer-name="Hitclub logo">
                  <div class="framer-dstk51 ls-s78" data-framer-name="hit.club 1" draggable="false">
                    <div class="ls-s4" data-framer-background-image-wrapper="true">
                      <img class="ls-s5" alt="Hitclub" decoding="auto" draggable="false" height="412" src="./assets/images/ODJXc3KrHBbOhKCnNbyhI9fhI_ed4db1b0.png?width=460&amp;height=412" width="460" />
                    </div>
                  </div>
                </div>
              </div>
              <div class="framer-t1xqe9 ls-s81" data-framer-name="Logo">
                <a href="#" target="_blank" rel="noopener" class="framer-8056f9 ls-s82" data-framer-component-type="RichTextContainer" data-framer-name="Cược ngay">
                  <p class="framer-text ls-s83" dir="auto">Cược ngay</p>
                </a>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>
```

---

### 3.2. Template Top Bình Luận Viên (`.luongson-top-commentators`)
> Dùng chung cho: `index.html`, `lichthidau.html`
```html
<div class="framer-1t71pqu luongson-top-commentators">
  <div class="framer-p00d8d luongson-commentators-header" data-border="true">
    <svg class="framer-1hcfw4b ls-s156" role="presentation" viewbox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <div class="framer-ic54v4 ls-s26" data-framer-component-type="RichTextContainer">
      <p class="framer-text ls-s157" dir="auto">Top bình luận viên</p>
    </div>
  </div>
  <div class="framer-3bgk2l luongson-commentators-list">
    <div class="ssr-variant">
      <div class="framer-5zry8q">
        <!-- BLV 1: Shelby (Blue) -->
        <div class="framer-24z3t0 luongson-commentator-card is-blue" data-framer-name="Commentator Profile">
          <div class="framer-hgq8kk luongson-commentator-avatar" data-border="true" data-framer-name="Commentator Avatar" draggable="false">
            <div class="ls-s4" data-framer-background-image-wrapper="true">
              <img class="ls-s158" alt="BLV Shelby" decoding="auto" draggable="false" height="360" loading="lazy" src="./assets/images/wIKNhKyKJ9nlZZOnf2LaeteFjyk_f44a3706.jpg?width=240&amp;height=360" width="240" />
            </div>
          </div>
          <div class="framer-154d6k3 luongson-commentator-info" data-framer-name="Commentator Info">
            <div class="framer-1gg3oxg ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s159" dir="auto">Shelby</p></div>
            <div class="framer-1abikv4 ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s160" dir="auto">★ 4.9 · 2.4K người theo dõi</p></div>
          </div>
          <button class="framer-1tp7z3x luongson-commentator-follow-btn" data-framer-name="Follow Button" data-reset="button" tabindex="0">
            <div class="framer-1pj3jne ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s161" dir="auto">♥️ Follow</p></div>
          </button>
        </div>

        <!-- BLV 2: Gia Cát Lượng (Teal) -->
        <div class="framer-24z3t0 luongson-commentator-card is-teal" data-framer-name="Commentator Profile">
          <div class="framer-hgq8kk luongson-commentator-avatar" data-border="true" data-framer-name="Commentator Avatar" draggable="false">
            <div class="ls-s4" data-framer-background-image-wrapper="true">
              <img class="ls-s158" alt="BLV Gia Cát Lượng" decoding="auto" draggable="false" height="523" loading="lazy" sizes="60px" src="./assets/images/ftE6EP9wNhOHQhEsRJCuIRV2uk_4ee7751d.png?width=587&amp;height=523" width="587" />
            </div>
          </div>
          <div class="framer-154d6k3 luongson-commentator-info" data-framer-name="Commentator Info">
            <div class="framer-1gg3oxg ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s159" dir="auto">Gia Cát Lượng</p></div>
            <div class="framer-1abikv4 ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s160" dir="auto">★ 4.9 · 2.4K người theo dõi</p></div>
          </div>
          <button class="framer-1tp7z3x luongson-commentator-follow-btn" data-framer-name="Follow Button" data-reset="button" tabindex="0">
            <div class="framer-1pj3jne ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s161" dir="auto">♥️ Follow</p></div>
          </button>
        </div>

        <!-- BLV 3: Thầy Gióng / Lưu Bang (Green) -->
        <div class="framer-24z3t0 luongson-commentator-card is-green" data-framer-name="Commentator Profile">
          <div class="framer-hgq8kk luongson-commentator-avatar" data-border="true" data-framer-name="Commentator Avatar" draggable="false">
            <div class="ls-s4" data-framer-background-image-wrapper="true">
              <img class="ls-s158" alt="BLV Thầy Gióng" decoding="auto" draggable="false" height="523" loading="lazy" sizes="60px" src="./assets/images/q0H8vN84FjO78wPzK5Y4qRz0_2d1a3b8c.png?width=587&amp;height=523" width="587" />
            </div>
          </div>
          <div class="framer-154d6k3 luongson-commentator-info" data-framer-name="Commentator Info">
            <div class="framer-1gg3oxg ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s159" dir="auto">Thầy Gióng</p></div>
            <div class="framer-1abikv4 ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s160" dir="auto">★ 4.8 · 1.9K người theo dõi</p></div>
          </div>
          <button class="framer-1tp7z3x luongson-commentator-follow-btn" data-framer-name="Follow Button" data-reset="button" tabindex="0">
            <div class="framer-1pj3jne ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s161" dir="auto">♥️ Follow</p></div>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

### 3.3. Template Right Aside: Live Chat Box & Bảng Xếp Hạng (`.luongson-right-aside`)
> Dùng chung cho: `index.html`, `lichthidau.html`
```html
<div class="framer-1ui58fi luongson-right-aside">
  <!-- Widget 1: Premier League Identity Banner -->
  <div class="framer-qgh5ep">
    <div class="framer-1r3hxba" data-framer-name="320x100">
      <div class="ls-s4" data-framer-background-image-wrapper="true">
        <img class="ls-s5" alt="" decoding="auto" height="225" src="./assets/images/TLYFUMGSZBIBvfZ9oM9mDi5GP0_57272bcd.jpg?width=720&amp;height=225" width="720" />
      </div>
      <div class="framer-tvdf0n" data-framer-name="Premier League Identity">
        <div class="framer-16hfvfs ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s87" dir="auto">Cược ngay</p></div>
      </div>
    </div>
  </div>

  <!-- Widget 2: Live Chat Box -->
  <div class="framer-chat-widget luongson-chat-widget" data-border="true">
    <div class="framer-chat-header">
      <div class="framer-chat-title"><span class="live-dot"></span> Trò chuyện trực tiếp</div>
      <div class="framer-chat-online">1.2K online</div>
    </div>
    <div class="framer-chat-messages" data-hide-scrollbars="true">
      <div class="chat-msg"><span class="chat-user">ThanhBinh:</span> Man City đá kinh thật!</div>
      <div class="chat-msg"><span class="chat-user">MinhVuong:</span> Kèo tài nổ chắc rồi ae</div>
    </div>
    <div class="framer-chat-input-box">
      <input type="text" placeholder="Gửi tin nhắn..." class="chat-input" />
      <button class="chat-send-btn" aria-label="Gửi tin nhắn"><svg viewBox="0 0 24 24" class="send-icon"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg></button>
    </div>
  </div>

  <!-- Widget 3: Bảng Xếp Hạng & Top Ghi Bàn -->
  <div class="framer-ranking-widget luongson-ranking-widget" data-border="true">
    <div class="framer-ranking-header">
      <h3>BẢNG XẾP HẠNG</h3>
      <div class="framer-ranking-tabs">
        <button class="active">NHA</button>
        <button>La Liga</button>
        <button>C1</button>
      </div>
    </div>
    <div class="framer-ranking-table">
      <div class="ranking-row ranking-head"><span>#</span><span>CLB</span><span>Trận</span><span>Điểm</span></div>
      <div class="ranking-row"><span class="rank-num top-1">1</span><span class="team-name">Liverpool</span><span>24</span><span class="pts">57</span></div>
      <div class="ranking-row"><span class="rank-num top-2">2</span><span class="team-name">Man City</span><span>24</span><span class="pts">53</span></div>
      <div class="ranking-row"><span class="rank-num top-3">3</span><span class="team-name">Arsenal</span><span>24</span><span class="pts">50</span></div>
    </div>
  </div>
</div>
```

---

### 3.4. Template Article Card & Pagination (`.luongson-article-card`, `.luongson-pagination`)
> Dùng chung cho: `index.html`, `nhandinh.html`, `tin.html`
```html
<!-- Article Card Grid Item -->
<div class="framer-zecxh3 luongson-article-grid">
  <article class="framer-14k2j3s luongson-article-card" data-framer-name="Article Item">
    <div class="ssr-variant">
      <div class="framer-c8jbtw">
        <div class="ls-s4" data-framer-background-image-wrapper="true">
          <img class="ls-s5" decoding="auto" width="685" height="457" src="./assets/images/LSBa0Otc9szxlPcCeiWAgmtlPQU_46d990f3.jpg?width=685&amp;height=457" alt="Inter tăng tốc chuẩn bị mùa giải mới" />
        </div>
      </div>
    </div>
    <div class="framer-1km6fjy">
      <div class="framer-sk2i1y ls-s26" data-framer-component-type="RichTextContainer">
        <h3 class="framer-text ls-s105">Inter tăng tốc chuẩn bị mùa giải mới, tuyến giữa là tâm điểm 27/08/2026</h3>
      </div>
      <div class="framer-h88xtu">
        <div class="framer-1grmeb ls-s26" data-framer-component-type="RichTextContainer">
          <p class="framer-text ls-s106">Đội bóng nước Ý đang đẩy nhanh quá trình hoàn thiện lối chơi, với khả năng kiểm soát khu trung tuyến được đặt lên hàng đầu.</p>
        </div>
      </div>
    </div>
  </article>
</div>

<!-- Pagination Component (nhandinh.html & tin.html) -->
<nav class="framer-uby5ae luongson-pagination" aria-label="Phân trang bài viết">
  <div class="framer-1lxlkp5 active" data-framer-name="Page 1">
    <div class="framer-124nkcx ls-s119" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s120">1</p></div>
  </div>
  <div class="framer-16tltrl" data-framer-name="Page 2">
    <div class="framer-olf3h7 ls-s119" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s120">2</p></div>
  </div>
  <div class="framer-1m2mzr8" data-framer-name="Page 3">
    <div class="framer-1bptarv ls-s119" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s120">3</p></div>
  </div>
  <div class="framer-1d5fv15" data-framer-name="Dots">
    <div class="framer-1u0mcat ls-s119" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s120">…</p></div>
  </div>
  <div class="framer-dw03lu" data-framer-name="Page 20">
    <div class="framer-1au5fcs ls-s119" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s120">20</p></div>
  </div>
  <div class="framer-zyn4vx" data-framer-name="Next Page">
    <div class="framer-i86kpt"><svg viewBox="0 0 24 24" class="ls-s121"><path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>
  </div>
</nav>
```

---

### 3.5. Template Left Sidebar & Sidebar Spacer (`.luongson-sidebar-left`, `.luongson-sidebar-spacer`)
> Dùng chung cho: toàn bộ 5/5 trang
```html
<!-- Left Sidebar Component -->
<div class="framer-ea4vkm-container hidden-gimj73 hidden-f1vof3 luongson-sidebar-left">
  <div class="framer-QbuP0 framer-1ei7e2m framer-v-1ei7e2m ls-s2" data-border="true" data-framer-name="Desktop">
    <div class="framer-1omzemv ls-s3" data-framer-name="Image">
      <div class="ls-s4" data-framer-background-image-wrapper="true">
        <img class="ls-s5" alt="" decoding="auto" height="7432" src="./assets/images/pTd7CCLT508FqMHQ7dFkL9QKk_8ddf363d.png?width=4775&amp;height=7432" width="4775" />
      </div>
    </div>
    <div class="framer-1supw53 ls-s6" data-framer-name="Menu LS">
      <div class="framer-pr73oa ls-s6" data-framer-name="Logo">
        <div class="ls-s4" data-framer-background-image-wrapper="true">
          <img class="ls-s5" alt="" decoding="auto" height="142" src="./assets/images/8suNKBFdLKs23ISzr0C36SqrXFU_8543fca5.png?width=600&amp;height=142" width="600" />
        </div>
      </div>
    </div>
    <div class="framer-xuduv3 ls-s6 luongson-sidebar-nav" data-framer-name="Navigation Items">
      <!-- Item: Trang chủ -->
      <a class="framer-k92g5e framer-qohcna ls-s7" data-framer-name="Tổng quan" href="index.html">
        <div class="framer-BHaPX framer-an6fg4 ls-s8"></div>
        <div class="framer-527tjl ls-s9" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s10" dir="auto">Trang chủ</p></div>
      </a>
      <!-- Item: Lịch thi đấu -->
      <a class="framer-qweaht framer-qohcna ls-s7" data-framer-name="Trận đấu" href="lichthidau.html">
        <div class="framer-deoUy framer-17bmagu ls-s8"></div>
        <div class="framer-pdwkbf ls-s9" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s10" dir="auto">Lịch thi đấu</p></div>
      </a>
      <!-- Item: Highlights -->
      <a class="framer-fm51jy framer-qohcna ls-s7" data-framer-name="Highlights" href="./highlights">
        <div class="framer-ry8uE framer-cr94t6 ls-s8"></div>
        <div class="framer-1f8d32j ls-s9" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s10" dir="auto">Highlights</p></div>
      </a>
      <!-- Item: AFF Cup -->
      <a class="framer-rtdaqv framer-qohcna ls-s7" data-framer-name="Bảng xếp hạng" href="./aff">
        <div class="framer-1p5zqos ls-s11">
          <div class="framer-3yq53u ls-s12" data-framer-name="Image">
            <div class="ls-s4" data-framer-background-image-wrapper="true">
              <img class="ls-s5" alt="" decoding="auto" height="1205" src="./assets/images/PuTsiLumL1D8AfGmuOinRVCOIj8_beaad5ce.png?width=1280&amp;height=1205" width="1280" />
            </div>
          </div>
        </div>
        <div class="framer-1w0oiiz ls-s9" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s10" dir="auto">AFF Cup</p></div>
      </a>
      <!-- Item: Nhận định -->
      <a class="framer-17zqi0c framer-qohcna ls-s7" data-framer-name="Dự đoán" href="nhandinh.html">
        <div class="framer-mh61q framer-e15086 ls-s8"></div>
        <div class="framer-1wh0vnl ls-s9" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s10" dir="auto">Nhận định</p></div>
      </a>
      <!-- Item: Soi kèo -->
      <a class="framer-n8ithq framer-qohcna ls-s7" data-framer-name="Cộng đồng" href="./soikeo">
        <div class="framer-8myKw framer-1oy5sfo ls-s8"></div>
        <div class="framer-bnvzw0 ls-s9" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s10" dir="auto">Soi kèo</p></div>
      </a>
      <!-- Item: Tin tức -->
      <a class="framer-mzboi1 framer-qohcna ls-s7" data-framer-name="Tin tức" href="tin.html">
        <div class="framer-p1WUs framer-jal8by ls-s8"></div>
        <div class="framer-2fyly2 ls-s9" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s10" dir="auto">Tin tức</p></div>
      </a>
      <!-- Item: Khuyến mãi -->
      <a class="framer-o1anxw framer-qohcna ls-s7" data-framer-name="Yêu thích" href="./km">
        <div class="framer-i1TDP framer-10iggq5 ls-s8"></div>
        <div class="framer-7anvse ls-s9" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s10" dir="auto">Khuyến mãi</p></div>
      </a>
      <!-- Item: Ứng tuyển BLV -->
      <a class="framer-1ryvz9p framer-qohcna ls-s7" data-framer-name="Cài đặt" href="ung-tuyen-blv.html">
        <div class="framer-sQNpM framer-n6e0s1 ls-s8"></div>
        <div class="framer-ld3gan ls-s9" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s10" dir="auto">Ứng tuyển BLV</p></div>
      </a>
    </div>
    <div class="framer-1fs5sty ls-s13"></div>
    <div class="framer-174nt9o ls-s14 luongson-sidebar-banner" data-framer-name="Football Betting Banner">
      <div class="framer-1u5fm4z ls-s15" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s16" dir="auto">LIVE FOOTBALL</p></div>
      <div class="framer-1k52wdm ls-s17" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s18" dir="auto">BÓNG ĐÁ ĐỈNH CAO</p></div>
      <div class="framer-arse6 ls-s17" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s19" dir="auto">Cược thả ga</p></div>
    </div>
  </div>
</div>

<!-- Sidebar Spacer Component -->
<div class="framer-10rzk9d hidden-gimj73 hidden-f1vof3 luongson-sidebar-spacer" data-framer-name="Sidebar Spacer"></div>
```

---

### 3.6. Template Brand Ambassador & SEO Block (`.luongson-ambassador-seo-section`)
> Dùng chung cho: toàn bộ 5/5 trang
```html
<div class="framer-1y11z59 luongson-ambassador-seo-section">
  <!-- Khối 1: Đại sứ thương hiệu -->
  <div class="framer-1th9ham luongson-ambassador-block">
    <div class="framer-s44gus">
      <div class="framer-1y0t7xv ls-s26" data-framer-component-type="RichTextContainer">
        <p class="framer-text ls-s162" dir="auto">Đại sứ thương hiệu</p>
      </div>
      <div class="framer-1p5kmug ls-s26" data-framer-component-type="RichTextContainer">
        <p class="framer-text ls-s163" dir="auto">
          Bước sang năm 2026, cựu tiền đạo huyền thoại <strong class="framer-text">Phạm Văn Quyến</strong> tiếp tục khẳng định sức hút bền bỉ và tình yêu dành cho trái bóng tròn khi tiếp tục đồng hành trong vai trò <strong class="framer-text">đại sứ thương hiệu của Lương Sơn TV</strong>.
        </p>
      </div>
    </div>
    <div class="ssr-variant">
      <div class="framer-y3mx44" data-framer-name="Image">
        <div class="ls-s4" data-framer-background-image-wrapper="true">
          <img class="ls-s164" alt="Đại sứ Phạm Văn Quyến" decoding="auto" height="523" loading="lazy" src="./assets/images/BuOUAoMl1ki9kf7JxKwzmz1Og_93d1f8ef.png?width=527&amp;height=523" width="527" />
        </div>
      </div>
    </div>
  </div>

  <!-- Khối 2: Text SEO Block có thanh cuộn -->
  <div class="framer-1p0eiqb luongson-seo-block" data-framer-name="Block SEO" data-hide-scrollbars="true">
    <div class="framer-9y2ron">
      <div class="framer-rl1hba ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s162" dir="auto">Giải Nghĩa Kèo Nhà Cái Là Gì?</p></div>
      <div class="framer-98qyuq ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s163" dir="auto">Kèo nhà cái là tỷ lệ cược được đặt ra bởi các nhà cái để người chơi tham chiếu và đặt cược cho các trận đấu bóng đá. Mỗi loại kèo phản ánh nhận định của nhà cái về xác suất thắng thua của hai đội, dựa trên phân tích chuyên sâu từ đội ngũ chuyên gia và dữ liệu thống kê thực tế.</p></div>
      <div class="framer-erb97x ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s162" dir="auto">Kèo Nhà Cái - Chuyên Trang Soi Kèo Bóng Đá Trực Tuyến Hàng Đầu</p></div>
      <div class="framer-1orf0ln ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s163" dir="auto">Đam mê trái bóng tròn và muốn tìm kiếm một địa chỉ đáng tin cậy để theo dõi <strong class="framer-text">tỷ lệ kèo</strong> cũng như <strong class="framer-text">nhận định trận đấu</strong>? <strong class="framer-text">Keonhacai</strong> chính là điểm đến lý tưởng dành cho bạn. Chúng tôi tự hào là chuyên trang soi kèo bóng đá uy tín, cung cấp thông tin đa chiều và cập nhật biến động tỷ lệ cược nhanh chóng, chính xác nhất hiện nay.</p></div>
      <div class="framer-15s0yyc ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s162" dir="auto">🏆 Tại Sao Bạn Nên Đồng Hành Cùng Keonhacai?</p></div>
      <div class="framer-1y3idz ls-s26" data-framer-component-type="RichTextContainer">
        <ul class="framer-text ls-s163" dir="auto">
          <li class="framer-text"><p class="framer-text"><strong class="framer-text">Cập nhật bảng kèo siêu tốc:</strong> Hệ thống bảng tỷ lệ cược (Kèo Châu Á, Kèo Châu Âu, Kèo Tài Xỉu, Kèo Phạt Góc,...) được đồng bộ trực tiếp từ các nhà cái lớn.</p></li>
          <li class="framer-text"><p class="framer-text"><strong class="framer-text">Soi kèo &amp; Nhận định chuyên sâu:</strong> Trước mỗi giờ bóng lăn, đội ngũ chuyên gia giàu kinh nghiệm mang đến những bài phân tích chi tiết về phong độ, chiến thuật.</p></li>
          <li class="framer-text"><p class="framer-text"><strong class="framer-text">Phủ sóng mọi giải đấu đỉnh cao:</strong> Ngoại Hạng Anh, Cúp C1, La Liga, Serie A, V-League, AFF Cup...</p></li>
        </ul>
      </div>
    </div>
  </div>
</div>
```

---

### 3.7. Template Footer Dùng Chung (`.luongson-footer`)
> Dùng chung cho: toàn bộ 5/5 trang
```html
<div class="framer-16se0wf-container luongson-footer">
  <div class="framer-MvKn2 framer-bk5noi framer-v-bk5noi ls-s166" data-framer-name="Variant 1">
    <div class="framer-11ith8a luongson-footer-content ls-s6" data-framer-name="Nội dung Footer">
      <div class="framer-1edc2lu ls-s6" data-framer-name="Menu LS">
        <div class="framer-1nyp06b ls-s6" data-framer-name="Logo">
          <div class="ls-s4" data-framer-background-image-wrapper="true">
            <img class="ls-s5" alt="" decoding="auto" height="142" loading="lazy" src="./assets/images/8suNKBFdLKs23ISzr0C36SqrXFU_8543fca5.png?width=600&amp;height=142" width="600" />
          </div>
        </div>
      </div>
      <div class="framer-1a7x738 ls-s6" data-framer-name="Giới thiệu">
        <div class="framer-12n0l35 ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s167" dir="auto">Lương Sơn TV — Kênh trực tiếp bóng đá miễn phí full HD</p></div>
        <div class="framer-3iuknd ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s168" dir="auto">Trực tiếp bóng đá hôm nay tốc độ cao, bình luận tiếng Việt cuốn hút. Cập nhật lịch thi đấu, bảng xếp hạng, tỷ lệ kèo và tin tức thể thao mới nhất 24/7.</p></div>
      </div>
      <div class="framer-x13v1n luongson-footer-sponsors ls-s6" data-framer-name="Nhà tài trợ">
        <div class="framer-7jfc9v ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s169" dir="auto">NHÀ TÀI TRỢ CHÍNH THỨC</p></div>
        <div class="framer-w09493 ls-s170" data-framer-name="Brand" data-hide-scrollbars="true" draggable="false">
          <ul class="ls-s171">
            <li class="ticker-item ls-s25" aria-hidden="false" aria-posinset="1" aria-setsize="10"><img alt="" class="framer-kpFKO framer-52cg6i ls-s6" src="data:image/svg+xml,..." /></li>
            <li class="ticker-item ls-s25" aria-hidden="false" aria-posinset="2" aria-setsize="10"><img alt="" class="framer-5adbp framer-5zv3g2 ls-s6" src="data:image/svg+xml,..." /></li>
            <li class="ticker-item ls-s25" aria-hidden="false" aria-posinset="3" aria-setsize="10"><img alt="" class="framer-e67D9 framer-8fy4vk ls-s6" src="data:image/svg+xml,..." /></li>
            <li class="ticker-item ls-s25" aria-hidden="false" aria-posinset="4" aria-setsize="10"><img alt="" class="framer-aO08L framer-17ehsae ls-s6" src="data:image/svg+xml,..." /></li>
            <li class="ticker-item ls-s25" aria-hidden="false" aria-posinset="5" aria-setsize="10"><img alt="" class="framer-DU9qf framer-15yuv3b ls-s6" src="data:image/svg+xml,..." /></li>
            <li class="ticker-item ls-s25" aria-hidden="false" aria-posinset="6" aria-setsize="10"><img alt="" class="framer-R2J9X framer-112l93l ls-s6" src="data:image/svg+xml,..." /></li>
            <li class="ticker-item ls-s25" aria-hidden="false" aria-posinset="7" aria-setsize="10"><img alt="" class="framer-QkEPm framer-8x93qk ls-s6" src="data:image/svg+xml,..." /></li>
            <li class="ticker-item ls-s25" aria-hidden="false" aria-posinset="8" aria-setsize="10"><img alt="" class="framer-13x69l2 framer-1j0o49o ls-s6" src="data:image/svg+xml,..." /></li>
            <li class="ticker-item ls-s25" aria-hidden="false" aria-posinset="9" aria-setsize="10"><img alt="" class="framer-iKOY2 framer-1pick2z ls-s6" src="data:image/svg+xml,..." /></li>
            <li class="ticker-item ls-s25" aria-hidden="false" aria-posinset="10" aria-setsize="10"><img alt="" class="framer-LBoof framer-1nl1x9n ls-s6" src="data:image/svg+xml,..." /></li>
          </ul>
        </div>
      </div>
      <div class="framer-16lrusw luongson-footer-info ls-s6" data-framer-name="Thông tin Footer">
        <div class="framer-n1onuo ls-s6" data-framer-name="Địa chỉ">
          <div class="framer-183na5w ls-s6" data-framer-name="Tiêu đề Địa chỉ">
            <svg class="framer-qQVrM framer-11wbq6j ls-s176" role="presentation" viewBox="0 0 24 24"><use href="#2407422285"></use></svg>
            <div class="framer-stxi73 ls-s177" data-framer-component-type="RichTextContainer"><h3 dir="auto" class="framer-text ls-s178">ĐỊA CHỈ LIÊN HỆ</h3></div>
          </div>
          <div class="framer-1cry8qw ls-s179" data-framer-component-type="RichTextContainer"><p dir="auto" class="framer-text ls-s180">Lương Sơn TV — Trung tâm nội dung thể thao trực tuyến. Liên hệ hỗ trợ và hợp tác qua các kênh chính thức được công bố trên website.</p><p dir="auto" class="framer-text ls-s181">Địa chỉ: Số 99 Nguyễn Chánh, Hà Nội</p></div>
        </div>
        <div class="framer-1w9dy4s luongson-footer-disclaimer ls-s6" data-framer-name="Miễn trừ trách nhiệm">
          <div class="framer-132mdyl ls-s6" data-framer-name="Tiêu đề Miễn trừ">
            <svg class="framer-RfWXp framer-qql6d4 ls-s176" role="presentation" viewBox="0 0 24 24"><use href="#275482067"></use></svg>
            <div class="framer-d41qj ls-s177" data-framer-component-type="RichTextContainer"><h3 dir="auto" class="framer-text ls-s178">MIỄN TRỪ TRÁCH NHIỆM</h3></div>
          </div>
          <div class="framer-1fyyc0t ls-s182" data-framer-component-type="RichTextContainer"><p dir="auto" class="framer-text ls-s180">Lương Sơn TV không sở hữu bản quyền các nội dung phát sóng từ bên thứ ba. Website chỉ tổng hợp và cung cấp thông tin tham khảo; người dùng tự chịu trách nhiệm khi truy cập các liên kết bên ngoài và cần tuân thủ quy định pháp luật tại nơi cư trú.</p></div>
        </div>
      </div>
      <div class="framer-q8zpn5 luongson-footer-copyright ls-s183" data-border="true" data-framer-name="Bản quyền">
        <div class="framer-1x4mo7v ls-s184" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s185" dir="auto">© 2026 Lương Sơn TV. Bảo lưu mọi quyền.</p></div>
      </div>
    </div>
  </div>
</div>
```

---

### 3.8. Template Catfish Sticky Banner (`.luongson-catfish`)
> Dùng chung cho: toàn bộ 5/5 trang
```html
<div class="framer-9hgzo luongson-catfish" data-framer-name="Catfish">
  <div class="framer-1ofl1o3 hidden-gimj73 hidden-f1vof3"></div>
  <div class="framer-9pns00">
    <!-- Banner trái -->
    <div class="framer-195wq2k hidden-f1vof3">
      <div class="ssr-variant">
        <div class="framer-1aahoaj" data-framer-name="Color Map">
          <div class="ls-s4" data-framer-background-image-wrapper="true">
            <img class="ls-s5" alt="" decoding="auto" height="135" src="./assets/images/pBYhXA2dOuJep49OzKEN9e6UQ2Y_44fff334.jpg?width=1092&amp;height=135" width="1092" />
          </div>
        </div>
      </div>
    </div>
    <!-- Banner phải -->
    <div class="framer-1dbij14">
      <div class="ssr-variant">
        <div class="framer-90iulr ls-s20" data-framer-name="Image">
          <div class="ls-s4" data-framer-background-image-wrapper="true">
            <img class="ls-s5" alt="" decoding="auto" height="180" src="./assets/images/Zb2hW4nkvPuYMPWvi0DWT9DMZus_14af5193.png?width=1456&amp;height=180" width="1456" />
          </div>
        </div>
      </div>
    </div>
    <!-- Nút đóng quảng cáo -->
    <div aria-label="Đóng quảng cáo" class="framer-hsrn5s" tabindex="0">
      <svg class="framer-KpKpK framer-1d3ejv3" role="presentation" viewbox="0 0 24 24">
        <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
  </div>
  <div class="framer-8fw8a0 hidden-gimj73 hidden-15ovph7 hidden-f1vof3"></div>
</div>
```

---

### 3.9. Template Marquee Ticker Bar (`.luongson-marquee-ticker`)
> Dùng chung cho: tất cả các trang (`index.html`, `ung-tuyen-blv.html`, `nhandinh.html`, `tin.html`, `lichthidau.html`)
```html
<div class="framer-1ecegz2 luongson-marquee-ticker hidden-gimj73" data-border="true">
  <div class="framer-1dohtau ls-s21">
    <div class="framer-1pdbsjp ls-s22" data-framer-name="Speaker">
      <div class="ls-s4" data-framer-background-image-wrapper="true">
        <img
          class="ls-s5"
          alt=""
          decoding="auto"
          height="3829"
          sizes="(min-width: 1440px) 20px, (min-width: 1280px) and (max-width: 1439.98px) 20px, (min-width: 960px) and (max-width: 1279.98px) 20px, (min-width: 760px) and (max-width: 959.98px) 20px, (max-width: 759.98px) 20px"
          src="./assets/images/oT6qDHjw71MJNgjoTlQB0XzfhuQ_2b6211c2.png?width=3337&amp;height=3829"
          srcset="
            ./assets/images/oT6qDHjw71MJNgjoTlQB0XzfhuQ_2b6211c2.png?scale-down-to=1024&amp;width=3337&amp;height=3829  892w,
            ./assets/images/oT6qDHjw71MJNgjoTlQB0XzfhuQ_2b6211c2.png?scale-down-to=2048&amp;width=3337&amp;height=3829 1784w,
            ./assets/images/oT6qDHjw71MJNgjoTlQB0XzfhuQ_2b6211c2.png?width=3337&amp;height=3829                        3337w
          "
          width="3337"
        />
      </div>
    </div>
  </div>
  <div class="framer-ttnxxk">
    <div class="framer-qw50ff ls-s23">
      <ul class="ls-s24">
        <li aria-hidden="false" aria-posinset="1" aria-setsize="1" class="ticker-item ls-s25"><div class="framer-enr51t ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s27" dir="auto">Domain chính hãng duy nhất SUN.WIN - Dùng <span class="framer-text ls-s28">1.1.1.1</span> để truy cập. Hệ thống sẽ tự động chuyển hướng đến domain mới nhất Sunwin.date, tránh các trang giả mạo.</p></div>
        </li>
        <li aria-hidden="true" class="clone-item ls-s29"><div class="framer-enr51t ls-s30" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s31" dir="auto">Domain chính hãng duy nhất SUN.WIN - Dùng <span class="framer-text ls-s32">1.1.1.1</span> để truy cập. Hệ thống sẽ tự động chuyển hướng đến domain mới nhất Sunwin.date, tránh các trang giả mạo.</p></div>
        </li>
      </ul>
    </div>
  </div>
  <div class="framer-eqp8rt">
    <svg class="framer-KpKpK framer-5ll0lr" role="presentation" viewbox="0 0 24 24">
      <path
        d="M18 6L6 18M6 6l12 12"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</div>
```

---

### 3.10. Template Live Match Card / Hot Match Card (`.luongson-match-card`)
> Dùng chung cho: `index.html`, `lichthidau.html`, `nhandinh.html`
```html
<div class="framer-116k1w1 luongson-match-card" data-border="true">
  <div class="framer-41m6k3" data-framer-name="Premier League Identity">
    <div class="framer-1ls5xev" data-framer-name="Premier League Logo">
      <div class="framer-1j2wjkg ls-s42" data-framer-component-type="SVG" aria-hidden="true"></div>
    </div>
    <div class="framer-1emkd9f hidden-f1vof3 ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s43" dir="auto">Chơi ngay</p></div>
  </div>
  <div class="framer-17ntzdd" data-border="true">
    <!-- Đội nhà -->
    <div class="framer-11ivf5z" data-framer-name="Home Team">
      <div class="framer-16yvchn" data-framer-name="Home Mark">
        <div class="framer-18l4nza">
          <div class="framer-1fo8xy6" data-framer-name="Logobox">
            <div class="ls-s4" data-framer-background-image-wrapper="true">
              <img class="ls-s5" alt="Man City" decoding="auto" height="128" src="./assets/images/bJcztaIO7kLrmSCOWXH87Sh8LvI_8b868b01.png?width=128&amp;height=128" width="128" />
            </div>
          </div>
        </div>
      </div>
      <div class="framer-14gk5iy ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s44" dir="auto">Man City</p></div>
    </div>
    <!-- Tỷ số & Giờ -->
    <div class="framer-v3u6ml" data-framer-name="VS">
      <div class="framer-15zkcwh ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s45" dir="auto">Hôm nay</p></div>
      <div class="framer-1afr6dj ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s46" dir="auto">VS</p></div>
      <div class="framer-uurj9l ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s47" dir="auto">02:00</p></div>
    </div>
    <!-- Đội khách -->
    <div class="framer-1g7hg3k" data-framer-name="Away Team">
      <div class="framer-xfklz9" data-framer-name="Away Mark">
        <div class="framer-1v3vzsg">
          <div class="framer-1yd0ebi ls-s48" data-framer-component-type="SVG" aria-hidden="true"></div>
        </div>
      </div>
      <div class="framer-146zqku ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s44" dir="auto">Liverpool</p></div>
    </div>
    <div class="framer-1qxan8b ls-s20" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s49" dir="auto">Premier League</p></div>
  </div>
  <!-- Tỷ lệ kèo & BLV -->
  <div class="framer-1r6rhfo">
    <div class="framer-1me43v6 hidden-f1vof3 luongson-featured-odds-panel" data-border="true">
      <div class="framer-bvdf9x" data-framer-name="Odds Content">
        <div class="framer-pzjh3k" data-border="true" data-framer-name="Odds Header">
          <div class="framer-184fp7j ls-s26" data-framer-component-type="RichTextContainer"><h3 class="framer-text ls-s50" dir="auto">Tỷ lệ kèo</h3></div>
          <div class="framer-1gtisvf" data-framer-name="Live Market">
            <div class="framer-cza2ti ls-s51"></div>
            <div class="framer-1ri28ev ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s52" dir="auto">LIVE</p></div>
          </div>
        </div>
        <div class="framer-cgedgx" data-framer-name="Odds Markets">
          <div class="framer-koe8n1" data-border="true" data-framer-name="HDP Market">
            <div class="framer-txlr8i ls-s26" data-framer-component-type="RichTextContainer"><h4 class="framer-text ls-s53" dir="auto">1X2</h4></div>
            <div class="framer-17ygpak">
              <div class="framer-4og8nz"><div class="framer-1wem2lt ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s54" dir="auto">2.85</p></div></div>
              <div class="framer-19e1gsv"><div class="framer-104wr5r ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s54" dir="auto">4.25</p></div></div>
              <div class="framer-17i4454"><div class="framer-9v3pxj ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s54" dir="auto">3.70</p></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Avatar Bình luận viên -->
    <div class="framer-6ym17g">
      <div class="framer-woxy63">
        <a class="framer-66unz7 framer-jf66j3" data-framer-name="Commentator 1" href="./player">
          <div class="framer-1bometu" data-framer-name="Avatar Tommy">
            <div class="ls-s4" data-framer-background-image-wrapper="true"><img class="ls-s5" alt="" decoding="auto" height="340" src="./assets/images/1m3VW6PzQZB53ULJFc0dC7abU_a636fa81.jpg?width=240&amp;height=340" width="240" /></div>
          </div>
          <div class="framer-kfdcuv ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s57" dir="auto">Tommy</p></div>
        </a>
      </div>
    </div>
  </div>
</div>
```

---

### 3.11. Template Top Header & Mobile Navigation Drawer (`.luongson-header`, `.mobile-overlay-portal`)
> Dùng chung cho: toàn bộ 5/5 trang
```html
<!-- Top Mobile Header Bar -->
<header class="framer-1rvbi9f-header luongson-mobile-header hidden-desktop">
  <div class="header-inner">
    <button class="mobile-menu-btn" aria-label="Mở menu điều hướng" id="openDrawerBtn">
      <svg viewBox="0 0 24 24" class="menu-icon"><path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <a href="index.html" class="header-logo">
      <img src="./assets/images/8suNKBFdLKs23ISzr0C36SqrXFU_8543fca5.png?width=600&amp;height=142" alt="Lương Sơn TV" height="32" />
    </a>
    <div class="header-actions">
      <button class="search-btn" aria-label="Tìm kiếm"><svg viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" fill="none"/></svg></button>
    </div>
  </div>
</header>

<!-- Mobile Navigation Drawer Portal (Hiển thị khi toggle menu) -->
<div class="mobile-overlay-portal" id="mobileDrawerPortal" style="display: none;">
  <div class="mobile-overlay-backdrop" id="closeDrawerBackdrop"></div>
  <div class="framer-1pxqhkz-container">
    <div class="framer-QbuP0 framer-1ei7e2m framer-v-1ei7e2m ls-s2" data-border="true">
      <!-- Toàn bộ nội dung Navigation Links của Sidebar -->
    </div>
  </div>
</div>
```

---

## 4. BẢNG TRA CỨU ÁNH XẠ CLASS NAMES (CLASS MAPPING MATRIX)

Khi thực hiện refactor trên `nhandinh.html`, `tin.html`, `ung-tuyen-blv.html`, hãy tra cứu bảng này để chuyển đổi toàn bộ class dị biệt cũ sang class SSOT chuẩn hóa:

| Thành phần | Class cũ (`ls-blog-s*` / `ls-ut-s*`) | Class chuẩn hóa SSOT (`ls-s*`) | Semantic Class BEM |
| :--- | :--- | :--- | :--- |
| **Top Bookmakers Star SVG** | `ls-blog-s113`, `ls-blog-s114` | `ls-s73`, `ls-s74` | `.luongson-top-bookmakers` |
| **Top Bookmakers Cược ngay** | `ls-blog-s117`, `ls-blog-s116` | `ls-s83`, `ls-s79` | `.luongson-bookmakers-ticker` |
| **Top Bookmakers Text Ticker** | `ls-blog-s107`, `ls-blog-s111` | `ls-s63`, `ls-s69` | `.luongson-top-bookmakers` |
| **Ticker Item Wrapper** | `ls-blog-s51`, `ls-blog-s97` | `ls-s25`, `ls-s77` | `.ticker-item` |
| **Background Image Wrapper** | `ls-blog-s87`, `ls-ut-s3` | `ls-s4` | `[data-framer-background-image-wrapper]` |
| **Background Image Tag** | `ls-blog-s88`, `ls-ut-s4` | `ls-s5` | `.ls-s5` |
| **Footer Tiêu đề Địa chỉ/Miễn trừ** | `ls-blog-s130` | `ls-s178` | `.luongson-footer-info h3` |
| **Footer Nội dung Text** | `ls-blog-s131`, `ls-blog-s132` | `ls-s180`, `ls-s181` | `.luongson-footer-info p` |
| **Footer Copyright Text** | `ls-blog-s133` | `ls-s185` | `.luongson-footer-copyright p` |
| **Ambassador Title / Heading** | `ls-blog-s98`, `ls-ut-s14` | `ls-s26`, `ls-s162` | `.luongson-ambassador-block` |
| **Ambassador Body Content** | `ls-blog-s106`, `ls-ut-s20` | `ls-s163` | `.luongson-ambassador-block p` |

---

## 5. QUY TRÌNH THỰC HIỆN REFACTOR ĐỒNG BỘ (5 BƯỚC)

### BƯỚC 1: ĐỒNG BỘ HTML THEO SINGLE SOURCE OF TRUTH
1. **Kiểm tra nhóm 5/5 trang**: Thay thế toàn bộ Left Sidebar, Spacer, Khối Đại sứ & SEO, Footer, Catfish theo template chuẩn (đã chuẩn hóa class `ls-s*` và semantic `luongson-*`).
2. **Kiểm tra nhóm 2-3 trang**:
   - Thay thế khối `Top nhà cái uy tín` ở `nhandinh.html` và `tin.html` giống hệt cấu trúc ở `index.html`.
   - Thay thế khối `Top bình luận viên` ở `lichthidau.html` giống hệt cấu trúc ở `index.html`.
   - Đồng bộ `Right Aside (Chatbox & BXH)` giữa `index.html` và `lichthidau.html`.
   - Đồng bộ `Article Card & Pagination` giữa `nhandinh.html`, `tin.html` và `index.html`.

### BƯỚC 2: QUY HOẠCH CSS CHUNG VÀO `css/components.css`
- Gom toàn bộ CSS của các shared components vào `css/components.css`.
- Xóa bỏ việc bọc selector bằng class root riêng lẻ của từng trang (như `.framer-wh6HR .luongson-top-bookmakers` hay `.framer-2Zk3L .luongson-commentator-card`). Thay vào đó dùng selector độc lập:
  - `.luongson-top-bookmakers, .framer-1a48m3p`
  - `.luongson-top-commentators, .framer-1t71pqu`
  - `.luongson-chat-widget`
  - `.luongson-ranking-widget`
  - `.luongson-article-card`
  - `.luongson-pagination`

### BƯỚC 3: QUY HOẠCH RESPONSIVE TRONG `css/responsive.css`
Tập trung toàn bộ media queries điều khiển các shared components vào `css/responsive.css`:
- **Desktop (1440px - 1024px)**: Sidebar mở rộng 200px, Right Aside hiển thị 340px, Main Layout chia 3 cột cân đối.
- **Tablet (1023px - 768px)**: Right Aside ẩn hoặc chuyển xuống dưới, Match Grid 2 cột, Top Bookmakers hiển thị 4 items visible.
- **Mobile (<= 767.98px)**:
  - Sidebar & Spacer ẩn (`display: none !important`).
  - Top Bookmakers ticker cuộn ngang mượt mà.
  - Top Commentators hiển thị dạng carousel 1 hàng ngang cuộn touch.
  - Ambassador & SEO chuyển sang `flex-direction: column`.
  - Catfish co giãn full-width.

### BƯỚC 4: XỬ LÝ ACTIVE STATE CHO LINK MENU & TABS
- Trên từng trang, gắn thuộc tính `data-framer-page-link-current="true"` và class active vào đúng thẻ menu link tương ứng:
  - `index.html` -> Trang chủ
  - `lichthidau.html` -> Lịch thi đấu
  - `nhandinh.html` -> Nhận định
  - `tin.html` -> Tin tức
  - `ung-tuyen-blv.html` -> Ứng tuyển BLV

### BƯỚC 5: DỌN DẸP DEAD CODE (CLEANUP)
- Xóa các class hash dị biệt cũ (`framer-14esc23`, `framer-yap2p`, `ls-blog-s*`, `ls-ut-s*`...).
- Xóa các block CSS trùng lặp thừa thãi trong `blog.css`, `ung-tuyen-blv.css`, `lichthidau.css`, `global.css`.

---

## 6. CHECKLIST NGHIỆM THU CHI TIẾT (ACCEPTANCE CRITERIA)

| Hạng mục kiểm tra | Tiêu chuẩn nghiệm thu |
| :--- | :--- |
| **Top Nhà Cái Uy Tín** | HTML & CSS giống nhau 100% trên cả 3 trang (`index.html`, `nhandinh.html`, `tin.html`). Ticker logo chạy mượt mà, nút "Cược ngay" hover đổi màu chuẩn. |
| **Top Bình Luận Viên** | HTML & CSS giống nhau 100% trên cả 2 trang (`index.html`, `lichthidau.html`). Avatar, tên, rating sao, nút Follow thẳng hàng, responsive mượt. |
| **Right Aside (Chat + BXH)** | Cấu trúc đồng bộ giữa `index.html` và `lichthidau.html`. Chatbox scroll tốt, BXH chuyển tab giải đấu nhanh chóng. |
| **Article Card & Pagination** | Card bài viết và thanh phân trang có cấu trúc đồng bộ trên `nhandinh.html`, `tin.html` và `index.html`. |
| **Sidebar & Ambassador/SEO & Footer & Catfish** | Đồng bộ 100% trên toàn bộ 5 trang. Không còn class dị biệt (`ls-blog-s*`, `ls-ut-s*`). |
| **Responsive Pixel-Perfect** | Kiểm tra trên Desktop (1440, 1280, 1024), Tablet (768), Mobile (414, 375): không vỡ layout, không tràn viền, text co giãn đúng chuẩn. |
| **Active States** | Menu link trên Sidebar và Mobile Drawer sáng đúng trang hiện hành khi chuyển trang. |
| **No Console Error & Broken Asset** | Không còn link ảnh hỏng 404, SVG render đầy đủ không bị mất icon. |
