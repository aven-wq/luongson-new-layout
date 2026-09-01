# TÀI LIỆU HƯỚNG DẪN VÀ QUY CHUẨN REFACTOR HTML/CSS (LUONGSON REBUILD)

> **Mục tiêu**: Chuyển đổi mã nguồn HTML/CSS xuất từ Framer (bị trùng lặp 11 phiên bản viewport, class vô nghĩa `framer-*`, inline styles, và responsive bằng JS/DOM ẩn hiện) thành hệ thống mã nguồn **Clean HTML5 / Modular CSS / Vanilla JS** chuẩn công nghiệp:
> 1. **1 Single DOM Tree** duy nhất cho mỗi trang (giảm từ 25,000+ dòng xuống ~500-1000 dòng/trang).
> 2. **Component-Driven**: Tách bạch các thành phần dùng chung (Header, Sidebar, Footer, Match Card, News Card...).
> 3. **100% No Inline Styles & No Framer Hashes**: Quy hoạch theo chuẩn BEM (`.ls-*`) và CSS Variables.
> 4. **Responsive chuẩn CSS `@media`**: Xử lý mượt mà trên mọi kích thước màn hình mà không cần lặp lại HTML.
> 5. **Bảo toàn 100% UI / UX & Animation**: Giữ nguyên vẹn font chữ, màu sắc, hiệu ứng tương tác, modal, tabs, sliders.

---

## MỤC LỤC
1. [Phân Tích Hiện Trạng & Vấn Đề Cần Giải Quyết](#1-phân-tích-hiện-trạng--vấn-đề-cần-giải-quyết)
2. [Cấu Trúc Thư Mục Dự Án Sau Refactor](#2-cấu-trúc-thư-mục-dự-án-sau-refactor)
3. [Hệ Thống Design Tokens (CSS Variables)](#3-hệ-thống-design-tokens-css-variables)
4. [Chiến Lược Responsive & Breakpoints Chuẩn](#4-chiến-lược-responsive--breakpoints-chuẩn)
5. [Quy Chuẩn Layout Shell & Danh Sách Reusable Components](#5-quy-chuẩn-layout-shell--danh-sách-reusable-components)
6. [Mã Nguồn Mẫu Chuẩn (Golden Templates)](#6-mã-nguồn-mẫu-chuẩn-golden-templates)
   - 6.1. Layout Shell Boilerplate (Dùng chung cho toàn bộ trang)
   - 6.2. Component: Sidebar Điều Hướng Trái (Left Sidebar & Mobile Drawer)
   - 6.3. Component: Top Header & Search Bar
   - 6.4. Component: Live Match Card (Trận đấu đang diễn ra)
   - 6.5. Component: Schedule Row (Lịch thi đấu)
   - 6.6. Component: Article Card (Tin tức / Nhận định)
   - 6.7. Component: Footer Dùng Chung
7. [Quy Hoạch JavaScript Tương Tác (Vanilla JS Clean)](#7-quy-hoạch-javascript-tương-tác-vanilla-js-clean)
8. [Lộ Trình Triển Khai Refactor Từng Bước (5 Phases)](#8-lộ-trình-triển-khai-refactor-từng-bước-5-phases)
9. [QA Checklist & Tiêu Chuẩn Nghiệm Thu Pixel-Perfect](#9-qa-checklist--tiêu-chuẩn-nghiệm-thu-pixel-perfect)

---

## 1. PHÂN TÍCH HIỆN TRẠNG & VẤN ĐỀ CẦN GIẢI QUYẾT

| Tiêu chí | Hiện trạng Framer Export | Sau khi Refactor chuẩn |
| :--- | :--- | :--- |
| **DOM Tree** | Mỗi trang có **11 bản sao DOM** (`vp-1440`, `vp-1280`, `vp-1024`, `vp-834`, `vp-768`, `vp-480`, `vp-414`, `vp-390`, `vp-375`, `vp-360`, `vp-320`) → HTML nặng >25,000 dòng/file. | **Chỉ 1 bản DOM duy nhất** (~500 - 1,200 dòng/file). |
| **Responsive** | Dùng CSS ẩn/hiện 11 khối `.variant-wrapper` và JS phải query `.variant-wrapper:visible` để bind sự kiện. | Dùng **CSS Flexbox / CSS Grid + `@media` queries** tự co giãn theo viewport. |
| **Class Names & Styles** | Tên class hash rác (`framer-wh6HR`, `framer-1ei7e2m`, `ls-s1`...) + hàng nghìn thuộc tính `!important` và inline styles. | Chuẩn **BEM Semantic** (`.ls-sidebar`, `.ls-match-card__header`, `.ls-btn--primary`) + 100% CSS tách biệt. |
| **Tính Tái Sử Dụng** | Header, Sidebar, Footer bị copy-paste vào từng trang độc lập, khi sửa phải sửa 5 trang × 11 viewports = 55 lần. | Chia thành **Components / Partials** độc lập, sửa 1 nơi cập nhật toàn bộ hệ thống. |
| **Tối Ưu Tải Trang** | Trình duyệt phải parse hàng chục MB DOM rác, tốn CPU/RAM, SEO kém, khó bảo trì. | DOM siêu nhẹ, load tức thì, thân thiện 100% với SEO và Google Lighthouse > 95 điểm. |

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN SAU REFACTOR

```
project-root/
│
├── assets/
│   ├── fonts/               # Webfonts (Afacad, Momo Trust Sans, Anton SC...)
│   ├── images/              # Banner, logo, background, team crests
│   └── icons/               # SVG sprite hoặc standalone SVGs
│
├── css/
│   ├── tokens/
│   │   ├── variables.css    # Design tokens: colors, spacing, fonts, shadows
│   │   └── reset.css        # Modern CSS reset
│   ├── base/
│   │   ├── typography.css   # Font-family, heading styles, body text
│   │   └── animations.css   # Keyframe animations (pulse, slide, fade, live indicator)
│   ├── layout/
│   │   ├── shell.css        # Cấu trúc 3 cột: Sidebar - Main Content - Right Aside
│   │   └── grid.css         # Responsive utility grid (1col, 2col, 3col, 4col)
│   ├── components/
│   │   ├── sidebar.css      # Sidebar trái + Banner cược
│   │   ├── header.css       # Header mobile, desktop bar, search box
│   │   ├── footer.css       # Footer link, đối tác, bản quyền
│   │   ├── match-card.css   # Card trận đấu live/sắp đá
│   │   ├── schedule-row.css # Bảng lịch thi đấu & filter giải đấu
│   │   ├── article-card.css # Card tin tức & bài phân tích nhận định
│   │   ├── chat-widget.css  # Khung chatbox trực tiếp bên phải
│   │   ├── ranking-box.css  # Bảng xếp hạng / Top ghi bàn
│   │   ├── forms.css        # Input, select, upload của trang Tuyển dụng BLV
│   │   ├── tabs.css         # Tab bar ngày tháng, tab server video
│   │   └── modal.css        # Popup, mobile drawer menu, commentator dropdown
│   └── pages/
│       ├── home.css         # Styles đặc thù cho index.html
│       ├── schedule.css     # Styles đặc thù cho lichthidau.html
│       ├── prediction.css   # Styles đặc thù cho nhandinh.html
│       ├── news.css         # Styles đặc thù cho tin.html
│       └── recruitment.css  # Styles đặc thù cho ung-tuyen-blv.html
│
├── js/
│   ├── modules/
│   │   ├── navigation.js    # Xử lý active nav, mobile drawer menu toggle
│   │   ├── commentator.js   # Dropdown chọn bình luận viên
│   │   ├── match-modal.js   # Popup chi tiết trận đấu
│   │   ├── tabs.js          # Chuyển đổi tab lịch thi đấu / tab nội dung
│   │   └── slider.js        # Slider banner / danh sách hot matches
│   └── main.js              # Entrypoint khởi tạo app
│
├── components/              # (Nếu dùng Template Engine: Nunjucks / EJS / Astro / Vite)
│   ├── sidebar.html
│   ├── header.html
│   ├── footer.html
│   ├── match-card.html
│   └── chat-box.html
│
├── index.html               # Trang chủ
├── lichthidau.html          # Lịch thi đấu
├── nhandinh.html            # Nhận định & Soi kèo
├── tin.html                 # Tin tức bóng đá
└── ung-tuyen-blv.html       # Tuyển dụng BLV
```

---

## 3. HỆ THỐNG DESIGN TOKENS (CSS VARIABLES)

Đặt file tại `css/tokens/variables.css` để quản lý toàn bộ hệ giá trị cốt lõi:

```css
:root {
  /* Colors - Brand & Backgrounds */
  --ls-bg-main: #0a0e1a;
  --ls-bg-surface: #121829;
  --ls-bg-surface-elevated: #1a2238;
  --ls-bg-card: rgba(255, 255, 255, 0.04);
  --ls-bg-card-hover: rgba(255, 255, 255, 0.08);

  /* Brand Sidebar Gradient */
  --ls-gradient-sidebar: linear-gradient(180deg, #0800a6 0%, #002c42 100%);
  --ls-gradient-accent: linear-gradient(90deg, #ff9800 0%, #ff5722 100%);
  --ls-gradient-live: linear-gradient(90deg, #e53935 0%, #d81b60 100%);

  /* Accent Colors */
  --ls-color-primary: #ffdf29;       /* Vàng thương hiệu */
  --ls-color-primary-dark: #e5c510;
  --ls-color-accent-blue: #00e5ff;   /* Xanh cyan */
  --ls-color-live: #ff2d55;          /* Đỏ trực tiếp */
  --ls-color-success: #00e676;       /* Xanh lá win/live */

  /* Text Colors */
  --ls-text-primary: #ffffff;
  --ls-text-secondary: rgba(255, 255, 255, 0.7);
  --ls-text-muted: rgba(255, 255, 255, 0.45);
  --ls-text-dark: #071a4f;

  /* Borders & Dividers */
  --ls-border-color: rgba(255, 255, 255, 0.1);
  --ls-border-subtle: rgba(255, 255, 255, 0.06);
  --ls-border-radius-xs: 4px;
  --ls-border-radius-sm: 8px;
  --ls-border-radius-md: 12px;
  --ls-border-radius-lg: 16px;
  --ls-border-radius-xl: 24px;
  --ls-border-radius-full: 9999px;

  /* Typography */
  --ls-font-main: "Afacad", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --ls-font-heading: "Momo Trust Sans", "Afacad", sans-serif;
  --ls-font-impact: "Anton SC", "Momo Trust Sans", sans-serif;

  /* Layout Dimensions */
  --ls-sidebar-width: 220px;
  --ls-right-aside-width: 340px;
  --ls-header-height-mobile: 56px;
  --ls-max-content-width: 1440px;

  /* Shadows */
  --ls-shadow-card: 0 4px 20px rgba(0, 0, 0, 0.25);
  --ls-shadow-glow: 0 0 15px rgba(255, 223, 41, 0.35);

  /* Transitions */
  --ls-transition-fast: 0.15s ease;
  --ls-transition-normal: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --ls-transition-slow: 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  /* Z-indexes */
  --ls-z-base: 1;
  --ls-z-sticky: 100;
  --ls-z-drawer: 500;
  --ls-z-modal: 1000;
  --ls-z-toast: 2000;
}
```

---

## 4. CHIẾN LƯỢC RESPONSIVE & BREAKPOINTS CHUẨN

Thay thế toàn bộ 11 breakpoints của Framer bằng **4 breakpoint chuẩn** trực quan:

```
        320px         768px             1024px            1280px            1440px+
          ├─────────────┼─────────────────┼─────────────────┼──────────────────┤
          │   MOBILE    │  TABLET PORTRAIT│ TABLET LANDSCAPE│     DESKTOP      │
          │  (1 Column) │ (2 Col / Compact│  / LAPTOP       │  (Full 3 Columns)│
          │  Drawer Nav │   Collapsible)  │ (Sticky Nav)    │ (Sidebar + Main  │
          │             │                 │                 │    + Right Chat) │
```

### Bảng cấu hình hành vi hiển thị:

| Kích thước màn hình | Media Query | Left Sidebar | Main Content | Right Aside (Chat/BXH) |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop Widescreen** (>= 1280px) | `@media (min-width: 1280px)` | Cố định bên trái (`220px`), bo góc 24px | Grid 3-4 cột trận đấu | Hiển thị cố định (`340px`) |
| **Laptop / Small Desktop** (1024px - 1279px) | `@media (min-width: 1024px) and (max-width: 1279.98px)` | Cố định bên trái (`200px`) | Grid 2-3 cột | Thu gọn dưới dạng tab/accordion |
| **Tablet Portrait** (768px - 1023px) | `@media (min-width: 768px) and (max-width: 1023.98px)` | Thu gọn dạng icon hoặc ẩn | Grid 2 cột | Chuyển xuống dưới hoặc tab phụ |
| **Mobile** (< 768px) | `@media (max-width: 767.98px)` | Ẩn, mở qua Hamburger Drawer | 1 Cột full width | Nằm trong Tab hoặc Modal |

---

## 5. QUY CHUẨN LAYOUT SHELL & DANH SÁCH REUSABLE COMPONENTS

### 5.1. Mô hình Page Shell tổng thể
Mọi trang (`index.html`, `lichthidau.html`, `nhandinh.html`, `tin.html`, `ung-tuyen-blv.html`) đều sử dụng chung một khung HTML:

```html
<div class="ls-app-root">
  <!-- 1. LEFT SIDEBAR (Dùng chung cho cả 5 trang) -->
  <aside class="ls-sidebar" id="appSidebar">
    <!-- Logo, Menu Navigation, Banner Cược -->
  </aside>

  <!-- 2. MAIN CONTAINER -->
  <div class="ls-main-wrapper">
    <!-- Top Header (Chứa Search, Mobile Hamburger, Profile/Auth) -->
    <header class="ls-header">
      <!-- Search bar, Header Actions -->
    </header>

    <!-- NỘI DUNG ĐẶC THÙ RIÊNG CỦA TỪNG TRANG -->
    <main class="ls-page-content">
      <!-- Index / Schedule / News / Recruitment Content -->
    </main>

    <!-- 3. FOOTER (Dùng chung cho cả 5 trang) -->
    <footer class="ls-footer">
      <!-- Footer content -->
    </footer>
  </div>

  <!-- 4. RIGHT ASIDE (Tùy chọn: chỉ có ở Trang Chủ xem trận) -->
  <aside class="ls-right-aside" id="appRightAside">
    <!-- Chat box, BXH -->
  </aside>

  <!-- 5. GLOBAL OVERLAY & MODALS -->
  <div class="ls-overlay" id="appOverlay"></div>
  <div class="ls-modal-container" id="appModalContainer"></div>
</div>
```

---

## 6. MÃ NGUỒN MẪU CHUẨN (GOLDEN TEMPLATES)

Dưới đây là mã nguồn chuẩn hóa không có inline styles, tên class BEM tường minh, bảo toàn từng pixel thiết kế.

### 6.1. Layout Shell Boilerplate (`index.html` hoặc bất kỳ trang nào)

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lương Sơn TV - Bóng đá trực tiếp & Tỷ lệ kèo</title>
    
    <!-- CSS Core Tokens & Reset -->
    <link rel="stylesheet" href="css/tokens/reset.css" />
    <link rel="stylesheet" href="css/tokens/variables.css" />
    <link rel="stylesheet" href="css/base/typography.css" />
    <link rel="stylesheet" href="css/base/animations.css" />
    
    <!-- Layout & Components -->
    <link rel="stylesheet" href="css/layout/shell.css" />
    <link rel="stylesheet" href="css/components/sidebar.css" />
    <link rel="stylesheet" href="css/components/header.css" />
    <link rel="stylesheet" href="css/components/footer.css" />
    <link rel="stylesheet" href="css/components/match-card.css" />
    <link rel="stylesheet" href="css/components/modal.css" />
    
    <!-- Page Specific CSS -->
    <link rel="stylesheet" href="css/pages/home.css" />
  </head>
  <body class="ls-theme-dark">
    <div class="ls-app-root">
      
      <!-- Component Sidebar Trái -->
      <!--#include virtual="components/sidebar.html" -->
      
      <div class="ls-main-wrapper">
        <!-- Component Header -->
        <!--#include virtual="components/header.html" -->

        <!-- Nội dung chính -->
        <main class="ls-page-content">
          <!-- Live Matches, Hot Schedule, Video Player... -->
        </main>

        <!-- Component Footer -->
        <!--#include virtual="components/footer.html" -->
      </div>

      <!-- Overlay & Drawer cho Mobile -->
      <div class="ls-drawer-backdrop" id="drawerBackdrop" aria-hidden="true"></div>
    </div>

    <!-- Scripts -->
    <script src="js/main.js" defer></script>
  </body>
</html>
```

---

### 6.2. Component: Sidebar Điều Hướng Trái (`components/sidebar.html`)

```html
<aside class="ls-sidebar" id="lsSidebar" aria-label="Main Navigation">
  <!-- Background Pattern -->
  <div class="ls-sidebar__bg-pattern" aria-hidden="true"></div>

  <!-- Brand Logo -->
  <div class="ls-sidebar__brand">
    <a href="index.html" class="ls-sidebar__logo-link">
      <img
        src="./assets/images/8suNKBFdLKs23ISzr0C36SqrXFU_8543fca5.png"
        alt="Lương Sơn TV"
        class="ls-sidebar__logo"
        width="150"
        height="36"
      />
    </a>
  </div>

  <!-- Navigation Menu List -->
  <nav class="ls-sidebar__nav">
    <ul class="ls-sidebar__menu">
      <li class="ls-sidebar__item">
        <a href="index.html" class="ls-sidebar__link ls-sidebar__link--active">
          <span class="ls-icon ls-icon--home"></span>
          <span class="ls-sidebar__text">Trang chủ</span>
        </a>
      </li>
      <li class="ls-sidebar__item">
        <a href="lichthidau.html" class="ls-sidebar__link">
          <span class="ls-icon ls-icon--calendar"></span>
          <span class="ls-sidebar__text">Lịch thi đấu</span>
        </a>
      </li>
      <li class="ls-sidebar__item">
        <a href="highlights.html" class="ls-sidebar__link">
          <span class="ls-icon ls-icon--video"></span>
          <span class="ls-sidebar__text">Highlights</span>
        </a>
      </li>
      <li class="ls-sidebar__item">
        <a href="aff.html" class="ls-sidebar__link">
          <span class="ls-icon ls-icon--trophy"></span>
          <span class="ls-sidebar__text">AFF Cup</span>
        </a>
      </li>
      <li class="ls-sidebar__item">
        <a href="nhandinh.html" class="ls-sidebar__link">
          <span class="ls-icon ls-icon--analysis"></span>
          <span class="ls-sidebar__text">Nhận định</span>
        </a>
      </li>
      <li class="ls-sidebar__item">
        <a href="soikeo.html" class="ls-sidebar__link">
          <span class="ls-icon ls-icon--odds"></span>
          <span class="ls-sidebar__text">Soi kèo</span>
        </a>
      </li>
      <li class="ls-sidebar__item">
        <a href="tin.html" class="ls-sidebar__link">
          <span class="ls-icon ls-icon--news"></span>
          <span class="ls-sidebar__text">Tin tức</span>
        </a>
      </li>
      <li class="ls-sidebar__item">
        <a href="khuyen-mai.html" class="ls-sidebar__link">
          <span class="ls-icon ls-icon--gift"></span>
          <span class="ls-sidebar__text">Khuyến mãi</span>
        </a>
      </li>
      <li class="ls-sidebar__item">
        <a href="ung-tuyen-blv.html" class="ls-sidebar__link">
          <span class="ls-icon ls-icon--mic"></span>
          <span class="ls-sidebar__text">Ứng tuyển BLV</span>
        </a>
      </li>
    </ul>
  </nav>

  <!-- Football Betting Promo Banner -->
  <div class="ls-sidebar__banner">
    <div class="ls-sidebar__banner-tag">LIVE FOOTBALL</div>
    <div class="ls-sidebar__banner-title">BÓNG ĐÁ ĐỈNH CAO</div>
    <div class="ls-sidebar__banner-desc">Cược thả ga</div>
    <a href="https://luongson.tv" target="_blank" rel="noopener" class="ls-sidebar__banner-btn" aria-label="Xem cược"></a>
  </div>
</aside>
```

#### CSS tương ứng (`css/components/sidebar.css`):
```css
.ls-sidebar {
  width: var(--ls-sidebar-width);
  min-height: 100vh;
  position: sticky;
  top: 0;
  left: 0;
  background: var(--ls-gradient-sidebar);
  border-top-right-radius: var(--ls-border-radius-xl);
  border-bottom-right-radius: var(--ls-border-radius-xl);
  border-right: 2px solid var(--ls-border-color);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  z-index: var(--ls-z-sticky);
  flex-shrink: 0;
  overflow-y: auto;
}

.ls-sidebar__brand {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ls-sidebar__logo {
  max-width: 100%;
  height: auto;
  display: block;
}

.ls-sidebar__menu {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ls-sidebar__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--ls-border-radius-sm);
  color: var(--ls-text-primary);
  text-decoration: none;
  font-family: var(--ls-font-heading);
  font-size: 15px;
  font-weight: 700;
  transition: background-color var(--ls-transition-fast), color var(--ls-transition-fast);
}

.ls-sidebar__link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.ls-sidebar__link--active {
  background-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.ls-sidebar__banner {
  margin-top: auto;
  background-color: var(--ls-color-primary);
  border-radius: var(--ls-border-radius-lg);
  padding: 14px;
  text-align: center;
  color: var(--ls-text-dark);
  position: relative;
  overflow: hidden;
  box-shadow: var(--ls-shadow-glow);
}

.ls-sidebar__banner-tag {
  font-family: var(--ls-font-heading);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.6px;
  opacity: 0.7;
}

.ls-sidebar__banner-title {
  font-family: var(--ls-font-impact);
  font-size: 20px;
  line-height: 1.1;
  margin: 4px 0;
}

.ls-sidebar__banner-desc {
  font-family: var(--ls-font-heading);
  font-size: 11px;
  font-weight: 700;
}

/* Mobile & Tablet Responsive */
@media (max-width: 1023.98px) {
  .ls-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 260px;
    transform: translateX(-100%);
    transition: transform var(--ls-transition-normal);
    z-index: var(--ls-z-drawer);
    border-radius: 0;
  }

  .ls-sidebar.is-open {
    transform: translateX(0);
  }
}
```

---

### 6.3. Component: Top Header & Search Bar (`components/header.html`)

```html
<header class="ls-header">
  <div class="ls-header__container">
    <!-- Hamburger Button (Mobile / Tablet) -->
    <button class="ls-header__toggle-btn" id="sidebarToggle" aria-label="Mở menu">
      <span class="ls-hamburger-line"></span>
      <span class="ls-hamburger-line"></span>
      <span class="ls-hamburger-line"></span>
    </button>

    <!-- Mobile Logo (Hiện khi màn hình nhỏ) -->
    <div class="ls-header__mobile-logo">
      <a href="index.html">
        <img src="./assets/images/8suNKBFdLKs23ISzr0C36SqrXFU_8543fca5.png" alt="Logo" width="110" height="26" />
      </a>
    </div>

    <!-- Live League Bar / Quick Filter -->
    <div class="ls-header__quick-leagues">
      <button class="ls-league-tag ls-league-tag--active">Tất cả</button>
      <button class="ls-league-tag">Ngoại Hạng Anh</button>
      <button class="ls-league-tag">Champions League</button>
      <button class="ls-league-tag">La Liga</button>
      <button class="ls-league-tag">Serie A</button>
      <button class="ls-league-tag">Bundesliga</button>
    </div>

    <!-- Search Input -->
    <div class="ls-header__search">
      <span class="ls-icon ls-icon--search" aria-hidden="true"></span>
      <input
        type="search"
        class="ls-header__search-input"
        placeholder="Tìm kiếm trận đấu, đội bóng, giải đấu..."
        aria-label="Tìm kiếm"
      />
    </div>

    <!-- Header Actions -->
    <div class="ls-header__actions">
      <a href="ung-tuyen-blv.html" class="ls-btn ls-btn--accent">
        <span class="ls-icon ls-icon--mic"></span>
        <span>Ứng Tuyển BLV</span>
      </a>
    </div>
  </div>
</header>
```

---

### 6.4. Component: Live Match Card (`components/match-card.html`)

```html
<article class="ls-match-card ls-match-card--live">
  <!-- Card Header: Tournament & Live Indicator -->
  <div class="ls-match-card__meta">
    <div class="ls-match-card__tournament">
      <img src="./assets/images/tournament-icon.png" alt="Premier League" class="ls-match-card__tournament-logo" width="16" height="16" />
      <span class="ls-match-card__tournament-name">Ngoại Hạng Anh</span>
    </div>
    <div class="ls-badge ls-badge--live">
      <span class="ls-badge__dot"></span>
      <span class="ls-badge__text">TRỰC TIẾP</span>
    </div>
  </div>

  <!-- Card Body: Teams, Logos, Score, Match Time -->
  <div class="ls-match-card__content">
    <!-- Home Team -->
    <div class="ls-match-card__team ls-match-card__team--home">
      <img src="./assets/images/arsenal.png" alt="Arsenal" class="ls-match-card__team-logo" width="40" height="40" />
      <span class="ls-match-card__team-name">Arsenal</span>
    </div>

    <!-- Score & Time Status -->
    <div class="ls-match-card__score-box">
      <div class="ls-match-card__score">2 - 1</div>
      <div class="ls-match-card__minute">Phút 68'</div>
    </div>

    <!-- Away Team -->
    <div class="ls-match-card__team ls-match-card__team--away">
      <img src="./assets/images/chelsea.png" alt="Chelsea" class="ls-match-card__team-logo" width="40" height="40" />
      <span class="ls-match-card__team-name">Chelsea</span>
    </div>
  </div>

  <!-- Card Footer: Commentator, Stream Servers & Action CTA -->
  <div class="ls-match-card__footer">
    <div class="ls-match-card__commentator">
      <span class="ls-badge-blv">BLV</span>
      <span class="ls-match-card__blv-name">Batman & Captain</span>
    </div>
    <div class="ls-match-card__actions">
      <a href="xem-truc-tiep.html?id=123" class="ls-btn ls-btn--watch" aria-label="Xem ngay trận Arsenal vs Chelsea">
        Xem Ngay
      </a>
    </div>
  </div>
</article>
```

#### CSS Grid trận đấu tự co giãn (`css/components/match-card.css`):
```css
.ls-live-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1439.98px) {
  .ls-live-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1023.98px) {
  .ls-live-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 639.98px) {
  .ls-live-grid {
    grid-template-columns: 1fr;
  }
}

.ls-match-card {
  background: var(--ls-bg-surface);
  border: 1px solid var(--ls-border-color);
  border-radius: var(--ls-border-radius-md);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform var(--ls-transition-fast), border-color var(--ls-transition-fast), box-shadow var(--ls-transition-fast);
}

.ls-match-card:hover {
  transform: translateY(-2px);
  border-color: var(--ls-color-primary);
  box-shadow: var(--ls-shadow-card);
}
```

---

### 6.5. Component: Footer Dùng Chung (`components/footer.html`)

```html
<footer class="ls-footer">
  <div class="ls-footer__container">
    <div class="ls-footer__grid">
      <!-- Col 1: Brand Info -->
      <div class="ls-footer__brand-col">
        <img src="./assets/images/8suNKBFdLKs23ISzr0C36SqrXFU_8543fca5.png" alt="Lương Sơn TV" class="ls-footer__logo" width="160" height="38" />
        <p class="ls-footer__desc">
          Lương Sơn TV - Kênh xem trực tiếp bóng đá tốc độ cao số 1 Việt Nam, cập nhật liên tục lịch thi đấu, tỷ lệ kèo và nhận định chuyên sâu.
        </p>
      </div>

      <!-- Col 2: Navigation Links -->
      <div class="ls-footer__links-col">
        <h3 class="ls-footer__title">Chuyên Mục</h3>
        <ul class="ls-footer__list">
          <li><a href="index.html">Trực tiếp bóng đá</a></li>
          <li><a href="lichthidau.html">Lịch thi đấu hôm nay</a></li>
          <li><a href="nhandinh.html">Nhận định & Soi kèo</a></li>
          <li><a href="tin.html">Tin tức bóng đá 24h</a></li>
        </ul>
      </div>

      <!-- Col 3: Support & Policy -->
      <div class="ls-footer__links-col">
        <h3 class="ls-footer__title">Thông Tin</h3>
        <ul class="ls-footer__list">
          <li><a href="ung-tuyen-blv.html">Ứng tuyển BLV</a></li>
          <li><a href="dieu-khoan.html">Điều khoản sử dụng</a></li>
          <li><a href="chinh-sach.html">Chính sách bảo mật</a></li>
          <li><a href="lien-he.html">Liên hệ quảng cáo</a></li>
        </ul>
      </div>

      <!-- Col 4: Disclaimer & Partners -->
      <div class="ls-footer__partners-col">
        <h3 class="ls-footer__title">Đối Tác Đồng Hành</h3>
        <div class="ls-footer__partners-logos">
          <span class="ls-partner-badge">Premier League</span>
          <span class="ls-partner-badge">La Liga</span>
          <span class="ls-partner-badge">UEFA Champions League</span>
        </div>
      </div>
    </div>

    <!-- Bottom Copyright -->
    <div class="ls-footer__bottom">
      <p class="ls-footer__copyright">© 2026 LuongSon TV. All rights reserved. Trực tiếp bóng đá chất lượng full HD.</p>
    </div>
  </div>
</footer>
```

---

## 7. QUY HOẠCH JAVASCRIPT TƯƠNG TÁC (VANILLA JS CLEAN)

Loại bỏ hoàn toàn các logic `document.querySelectorAll('.variant-wrapper:visible')`. Sử dụng kiến trúc module gọn gàng:

### `js/modules/navigation.js`:
```javascript
export function initNavigation() {
  const sidebar = document.getElementById('lsSidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const backdrop = document.getElementById('drawerBackdrop');

  if (!sidebar || !toggleBtn) return;

  function openSidebar() {
    sidebar.classList.add('is-open');
    if (backdrop) backdrop.classList.add('is-active');
    document.body.classList.add('sidebar-locked');
  }

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    if (backdrop) backdrop.classList.remove('is-active');
    document.body.classList.remove('sidebar-locked');
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
  });

  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  // Tự đóng khi click link nav trên mobile
  sidebar.querySelectorAll('.ls-sidebar__link').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 1024) closeSidebar();
    });
  });
}
```

### `js/modules/tabs.js`:
```javascript
export function initTabs(containerSelector = '[data-tabs]') {
  const containers = document.querySelectorAll(containerSelector);

  containers.forEach((container) => {
    const tabs = container.querySelectorAll('[data-tab-target]');
    const contents = container.querySelectorAll('[data-tab-content]');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tabTarget;

        tabs.forEach((t) => t.classList.remove('is-active'));
        contents.forEach((c) => c.classList.remove('is-active'));

        tab.classList.add('is-active');
        const targetContent = container.querySelector(`[data-tab-content="${target}"]`);
        if (targetContent) targetContent.classList.add('is-active');
      });
    });
  });
}
```

### `js/main.js`:
```javascript
import { initNavigation } from './modules/navigation.js';
import { initTabs } from './modules/tabs.js';
import { initCommentatorDropdown } from './modules/commentator.js';
import { initMatchModal } from './modules/match-modal.js';

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initTabs();
  initCommentatorDropdown();
  initMatchModal();
  console.log('LuongSon App Ready - 100% Clean Modular HTML/CSS/JS');
});
```

---

## 8. LỘ TRÌNH TRIỂN KHAI REFACTOR TỪNG BƯỚC (5 PHASES)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   PHASE 1    │ ──> │   PHASE 2    │ ──> │   PHASE 3    │ ──> │   PHASE 4    │ ──> │   PHASE 5    │
│ Setup Tokens │     │ Build Common │     │ Page Refactor│     │  JS Modules  │     │ Visual QA &  │
│  & Reset CSS │     │  Components  │     │  (5 Pages)   │     │ & Interaction│     │ Optimization │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### Phase 1: Chuẩn bị Base & Design Tokens
1. Tạo thư mục `css/tokens/` và viết `variables.css`, `reset.css`.
2. Tạo `css/base/typography.css` chứa đầy đủ `@font-face` (Afacad, Momo Trust Sans, Anton SC).
3. Đảm bảo toàn bộ asset font và image nằm đúng đường dẫn cục bộ trong `assets/`.

### Phase 2: Xây dựng Layout Shell & Core Components
1. Tạo layout 3 cột trong `css/layout/shell.css` hỗ trợ Flexbox/CSS Grid.
2. Cắt component: **Left Sidebar** + **Top Header** + **Footer** + **Mobile Drawer**.
3. Cắt các Atom/Molecule components: Button (`.ls-btn`), Badge (`.ls-badge`), Tag (`.ls-league-tag`), Match Card (`.ls-match-card`).

### Phase 3: Refactor từng trang (Đơn lẻ DOM)
- **Trang 1: `index.html` (Trang chủ)**
  - Tích hợp Live Match Carousel, Top Matches Grid, Video Stream Area, Right Chat Box, BXH.
- **Trang 2: `lichthidau.html` (Lịch thi đấu)**
  - Tích hợp Date Filter Bar, Tournament Group Accordion, Match Rows.
- **Trang 3: `nhandinh.html` (Nhận định / Soi kèo)**
  - Tích hợp Article Grid, Featured Analysis Banner, Sidebar Hot Predictions.
- **Trang 4: `tin.html` (Tin tức)**
  - Tích hợp News Grid, Top Trending News, Category Filters.
- **Trang 5: `ung-tuyen-blv.html` (Ứng tuyển BLV)**
  - Tích hợp Application Form, Custom Input/Select/File Upload, Requirement Box.

### Phase 4: Viết lại JS tương tác tinh gọn
1. Thay thế toàn bộ code JS cũ sang ES Modules trong `js/modules/`.
2. Kiểm tra các tương tác: Drawer menu mobile, Tab chọn ngày, Dropdown đổi BLV, Modal xem nhanh trận đấu.

### Phase 5: Pixel-Perfect Visual QA & Tối ưu hóa
1. Chạy so khớp giao diện trên tất cả các độ phân giải: `375px`, `414px`, `768px`, `1024px`, `1280px`, `1440px`, `1920px`.
2. Kiểm tra Lighthouse: Performance, Accessibility, Best Practices, SEO.

---

## 9. QA CHECKLIST & TIÊU CHUẨN NGHIỆM THU PIXEL-PERFECT

### Bảng Kiểm Tra Tiêu Chuẩn Nghiệm Thu (Acceptance Criteria)

- [ ] **1. Kiểm tra DOM**: Mỗi file HTML chỉ chứa **1 thẻ `<main>` duy nhất**, tuyệt đối không còn bất kỳ class `.vp-1440`, `.vp-1280`, `.vp-768`, `.vp-375` hay `.variant-wrapper`.
- [ ] **2. Kiểm tra Inline Styles**: Không có bất kỳ thuộc tính `style="..."` nào trong mã nguồn HTML.
- [ ] **3. Kiểm tra Tái Sử Dụng**:
  - `index.html`, `lichthidau.html`, `nhandinh.html`, `tin.html`, `ung-tuyen-blv.html` đều dùng chung 100% markup và class của Sidebar, Header và Footer.
- [ ] **4. Kiểm tra Responsive Media Queries**:
  - Resize màn hình mượt mà từ `320px` đến `2560px` không bị vỡ layout, không tràn ngang (`overflow-x: hidden`).
  - Trên mobile (< 768px): Hamburger menu mở mượt mà, backdrop làm mờ nền, click ngoài tự đóng.
  - Trên desktop (>= 1280px): Sidebar bên trái hiển thị cố định và nội dung chính căn giữa cân đối.
- [ ] **5. Kiểm tra Tương Tác & Hiệu Ứng**:
  - Hover các match card, news card có hiệu ứng nâng nhẹ (`translateY(-2px)`), sáng viền theo token vàng `--ls-color-primary`.
  - Nút trực tiếp có chấm tròn đỏ nhấp nháy (`animation: pulse 1.5s infinite`).
  - Dropdown chọn bình luận viên và popup chi tiết trận đấu hoạt động trơn tru.
- [ ] **6. So sánh hình ảnh (Visual Regression)**: Độ khớp giao diện đạt **99.9%** so với bản thiết kế gốc từ Framer.

---
*Tài liệu này là quy chuẩn kỹ thuật chính thức dùng cho việc refactor mã nguồn HTML/CSS của dự án LuongSon TV.*



Tôi muốn biết kĩ thuật test-results bạn dùng để compare gọi là gì để lần sau tôi guid bạn cắt html hay refactor tiếp