/**
 * LuongSon TV - Main Application Script
 * Standalone standard JS (Works locally via file:// and via HTTP/HTTPS server)
 */
(function () {
  'use strict';

  // 1. Navigation Module - Active links, Mobile drawer & Banner dismissal
  function initNavigation() {
    // Desktop sidebar navigation active link
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navItems = document.querySelectorAll('.luongson-sidebar-nav a, [data-framer-name="Navigation Items"] a');
    navItems.forEach(function (item) {
      const href = item.getAttribute('href');
      if (href === currentPath || (currentPath === '' && href === 'index.html')) {
        item.setAttribute('data-framer-page-link-current', 'true');
        item.classList.add('is-active');
      } else {
        item.removeAttribute('data-framer-page-link-current');
        item.classList.remove('is-active');
      }
      item.addEventListener('click', function () {
        navItems.forEach(function (i) {
          i.removeAttribute('data-framer-page-link-current');
          i.classList.remove('is-active');
        });
        item.setAttribute('data-framer-page-link-current', 'true');
        item.classList.add('is-active');
      });
    });

    // Mobile menu HTML template
    const menuDrawerHtml = `
      <div class="framer-GRble framer-v-4lv5aa mobile-overlay-portal" data-framer-portal-id="mobile-menu" style="top: 44px; right: 10px; visibility: visible; width: 200px; height: auto; position: fixed; z-index: 9999;">
        <div class="mobile-overlay-backdrop" aria-hidden="true" style="position: fixed; inset: 0px; z-index: -1;"></div>
        <div>
          <div class="framer-9mqwgf" role="dialog" style="background-color: rgba(0, 0, 0, 0); border-radius: 20px; box-shadow: none; opacity: 1; transform: none; transform-origin: 50% 0% 0px;">
            <div class="framer-1pxqhkz-container" style="opacity: 1;">
              <div class="framer-QbuP0 framer-1ei7e2m framer-v-1ji60ut ls-s2" data-border="true" data-framer-name="Tablet" style="--border-bottom-width: 0px; --border-color: rgba(255, 255, 255, 0.2); --border-left-width: 0px; --border-right-width: 2px; --border-style: solid; --border-top-width: 0px; background: linear-gradient(rgb(8, 0, 166) 0%, rgb(0, 44, 66) 100%); width: 100%; border-bottom-right-radius: 0px; border-top-right-radius: 0px; opacity: 1;">
                <div class="framer-1omzemv ls-s3" data-framer-name="Image" style="filter: blur(1px); opacity: 0.6;">
                  <div class="ls-s4" data-framer-background-image-wrapper="true">
                    <img class="ls-s5" decoding="auto" width="4775" height="7432" sizes="calc(200px + 419px)" srcset="./assets/images/pTd7CCLT508FqMHQ7dFkL9QKk_8ddf363d.png?scale-down-to=1024&amp;width=4775&amp;height=7432 657w, ./assets/images/pTd7CCLT508FqMHQ7dFkL9QKk_8ddf363d.png?scale-down-to=2048&amp;width=4775&amp;height=7432 1315w, ./assets/images/pTd7CCLT508FqMHQ7dFkL9QKk_8ddf363d.png?scale-down-to=4096&amp;width=4775&amp;height=7432 2631w, ./assets/images/pTd7CCLT508FqMHQ7dFkL9QKk_8ddf363d.png?width=4775&amp;height=7432 4775w" src="./assets/images/pTd7CCLT508FqMHQ7dFkL9QKk_8ddf363d.png?width=4775&amp;height=7432" alt="" style="display: block; width: 100%; height: 100%; border-radius: inherit; corner-shape: inherit; object-position: center center; object-fit: cover;">
                  </div>
                </div>
                <div class="framer-xuduv3 ls-s6 luongson-sidebar-nav" data-framer-name="Navigation Items" style="opacity: 1;">
                  <a class="framer-k92g5e framer-qohcna ls-s7" data-framer-name="Tổng quan" href="index.html" style="border-radius: 8px; opacity: 1;">
                    <div class="framer-BHaPX framer-an6fg4 ls-s8" style="--szd5nr: rgb(255, 255, 255); opacity: 1;"></div>
                    <div class="framer-527tjl ls-s9" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(255, 255, 255); transform: none; opacity: 1;"><p dir="auto" class="framer-text ls-s10" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: &quot;Momo Trust Sans&quot;, &quot;Momo Trust Sans Placeholder&quot;, sans-serif; --framer-font-size: 15px; --framer-font-weight: 700; --framer-text-color: var(--extracted-r6o4lv, rgb(255, 255, 255));">Trang chủ</p></div>
                  </a>
                  <a class="framer-qweaht framer-qohcna ls-s7" data-framer-name="Trận đấu" href="lichthidau.html" style="border-radius: 8px; opacity: 1;">
                    <div class="framer-deoUy framer-17bmagu ls-s8" style="--szd5nr: rgb(255, 255, 255); opacity: 1;"></div>
                    <div class="framer-pdwkbf ls-s9" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(255, 255, 255); transform: none; opacity: 1;"><p dir="auto" class="framer-text ls-s10" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: &quot;Momo Trust Sans&quot;, &quot;Momo Trust Sans Placeholder&quot;, sans-serif; --framer-font-size: 15px; --framer-font-weight: 700; --framer-text-color: var(--extracted-r6o4lv, rgb(255, 255, 255));">Lịch thi đấu</p></div>
                  </a>
                  <a class="framer-fm51jy framer-qohcna ls-s7" data-framer-name="Lịch thi đấu" href="./luongson/highlights" style="border-radius: 8px; opacity: 1;">
                    <div class="framer-ry8uE framer-cr94t6 ls-s8" style="--szd5nr: rgb(255, 255, 255); opacity: 1;"></div>
                    <div class="framer-1f8d32j ls-s9" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(255, 255, 255); transform: none; opacity: 1;"><p dir="auto" class="framer-text ls-s10" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: &quot;Momo Trust Sans&quot;, &quot;Momo Trust Sans Placeholder&quot;, sans-serif; --framer-font-size: 15px; --framer-font-weight: 700; --framer-text-color: var(--extracted-r6o4lv, rgb(255, 255, 255));">Highlights</p></div>
                  </a>
                  <a class="framer-rtdaqv framer-qohcna ls-s7" data-framer-name="Bảng xếp hạng" href="./luongson/aff" style="border-radius: 8px; opacity: 1;">
                    <div class="framer-1p5zqos ls-s11" style="background-color: rgb(255, 255, 255); border-radius: 4px; opacity: 1;"><div class="framer-3yq53u ls-s12" data-framer-name="Image" style="transform: translate(-50%, -50%); opacity: 1;"><div class="ls-s4" data-framer-background-image-wrapper="true"><img class="ls-s5" decoding="auto" width="1280" height="1205" sizes="15px" srcset="./assets/images/PuTsiLumL1D8AfGmuOinRVCOIj8_beaad5ce.png?scale-down-to=512&amp;width=1280&amp;height=1205 512w, ./assets/images/PuTsiLumL1D8AfGmuOinRVCOIj8_beaad5ce.png?scale-down-to=1024&amp;width=1280&amp;height=1205 1024w, ./assets/images/PuTsiLumL1D8AfGmuOinRVCOIj8_beaad5ce.png?width=1280&amp;height=1205 1280w" src="./assets/images/PuTsiLumL1D8AfGmuOinRVCOIj8_beaad5ce.png?width=1280&amp;height=1205" alt="" style="display: block; width: 100%; height: 100%; border-radius: inherit; corner-shape: inherit; object-position: center center; object-fit: cover;"></div></div></div>
                    <div class="framer-1w0oiiz ls-s9" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(255, 255, 255); transform: none; opacity: 1;"><p dir="auto" class="framer-text ls-s10" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: &quot;Momo Trust Sans&quot;, &quot;Momo Trust Sans Placeholder&quot;, sans-serif; --framer-font-size: 15px; --framer-font-weight: 700; --framer-text-color: var(--extracted-r6o4lv, rgb(255, 255, 255));">AFF Cup</p></div>
                  </a>
                  <a class="framer-17zqi0c framer-qohcna ls-s7" data-framer-name="Dự đoán" href="nhandinh.html" style="border-radius: 8px; opacity: 1;">
                    <div class="framer-mh61q framer-e15086 ls-s8" style="--szd5nr: rgb(255, 255, 255); opacity: 1;"></div>
                    <div class="framer-1wh0vnl ls-s9" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(255, 255, 255); transform: none; opacity: 1;"><p dir="auto" class="framer-text ls-s10" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: &quot;Momo Trust Sans&quot;, &quot;Momo Trust Sans Placeholder&quot;, sans-serif; --framer-font-size: 15px; --framer-font-weight: 700; --framer-text-color: var(--extracted-r6o4lv, rgb(255, 255, 255));">Nhận định</p></div>
                  </a>
                  <a class="framer-n8ithq framer-qohcna ls-s7" data-framer-name="Cộng đồng" href="nhandinh.html" style="border-radius: 8px; opacity: 1;">
                    <div class="framer-8myKw framer-1oy5sfo ls-s8" style="--szd5nr: rgb(255, 255, 255); opacity: 1;"></div>
                    <div class="framer-bnvzw0 ls-s9" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(255, 255, 255); transform: none; opacity: 1;"><p dir="auto" class="framer-text ls-s10" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: &quot;Momo Trust Sans&quot;, &quot;Momo Trust Sans Placeholder&quot;, sans-serif; --framer-font-size: 15px; --framer-font-weight: 700; --framer-text-color: var(--extracted-r6o4lv, rgb(255, 255, 255));">Soi kèo</p></div>
                  </a>
                  <a class="framer-mzboi1 framer-qohcna ls-s7" data-framer-name="Tin tức" href="tin.html" style="border-radius: 8px; opacity: 1;">
                    <div class="framer-p1WUs framer-jal8by ls-s8" style="--szd5nr: rgb(255, 255, 255); opacity: 1;"></div>
                    <div class="framer-2fyly2 ls-s9" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(255, 255, 255); transform: none; opacity: 1;"><p dir="auto" class="framer-text ls-s10" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: &quot;Momo Trust Sans&quot;, &quot;Momo Trust Sans Placeholder&quot;, sans-serif; --framer-font-size: 15px; --framer-font-weight: 700; --framer-text-color: var(--extracted-r6o4lv, rgb(255, 255, 255));">Tin tức</p></div>
                  </a>
                  <a class="framer-o1anxw framer-qohcna ls-s7" data-framer-name="Yêu thích" href="./luongson/km" style="border-radius: 8px; opacity: 1;">
                    <div class="framer-i1TDP framer-10iggq5 ls-s8" style="--szd5nr: rgb(255, 255, 255); opacity: 1;"></div>
                    <div class="framer-7anvse ls-s9" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(255, 255, 255); transform: none; opacity: 1;"><p dir="auto" class="framer-text ls-s10" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: &quot;Momo Trust Sans&quot;, &quot;Momo Trust Sans Placeholder&quot;, sans-serif; --framer-font-size: 15px; --framer-font-weight: 700; --framer-text-color: var(--extracted-r6o4lv, rgb(255, 255, 255));">Khuyến mãi</p></div>
                  </a>
                  <a class="framer-1ryvz9p framer-qohcna ls-s7" data-framer-name="Cài đặt" href="ung-tuyen-blv.html" style="border-radius: 8px; opacity: 1;">
                    <div class="framer-sQNpM framer-n6e0s1 ls-s8" style="--szd5nr: rgb(255, 255, 255); opacity: 1;"></div>
                    <div class="framer-ld3gan ls-s9" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(255, 255, 255); transform: none; opacity: 1;"><p dir="auto" class="framer-text ls-s10" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: &quot;Momo Trust Sans&quot;, &quot;Momo Trust Sans Placeholder&quot;, sans-serif; --framer-font-size: 15px; --framer-font-weight: 700; --framer-text-color: var(--extracted-r6o4lv, rgb(255, 255, 255));">Ứng tuyển BLV</p></div>
                  </a>
                </div>
                <div class="framer-1fs5sty ls-s13" style="border-radius: 16px; opacity: 1;"></div>
                <div class="framer-174nt9o ls-s14 luongson-sidebar-banner" data-framer-name="Football Betting Banner" style="background-color: rgb(255, 223, 41); border-radius: 16px; opacity: 1;">
                  <div class="framer-1u5fm4z ls-s15" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgba(7, 26, 79, 0.68); transform: none; opacity: 1;"><p dir="auto" class="framer-text ls-s16" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTgwMA==; --framer-font-family: &quot;Momo Trust Sans&quot;, &quot;Momo Trust Sans Placeholder&quot;, sans-serif; --framer-font-size: 9px; --framer-font-weight: 800; --framer-letter-spacing: 0.6px; --framer-text-color: var(--extracted-r6o4lv, rgba(7, 26, 79, 0.68));">LIVE FOOTBALL</p></div>
                  <div class="framer-1k52wdm ls-s17" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(7, 26, 79); transform: none; opacity: 1;"><p dir="auto" class="framer-text ls-s18" style="--font-selector: R0Y7QW50b24gU0MtcmVndWxhcg==; --framer-font-family: &quot;Anton SC&quot;, &quot;Anton SC Placeholder&quot;, sans-serif; --framer-font-size: 21px; --framer-line-height: 1em; --framer-text-color: var(--extracted-r6o4lv, rgb(7, 26, 79));">BÓNG ĐÁ ĐỈNH CAO</p></div>
                  <div class="framer-arse6 ls-s19" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(7, 26, 79); transform: none; opacity: 1;"><p dir="auto" class="framer-text ls-s10" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: &quot;Momo Trust Sans&quot;, &quot;Momo Trust Sans Placeholder&quot;, sans-serif; --framer-font-size: 11px; --framer-font-weight: 700; --framer-line-height: 1em; --framer-text-color: var(--extracted-r6o4lv, rgb(7, 26, 79));">Cược thả ga</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    function closeAllOverlays() {
      document.querySelectorAll('.mobile-overlay-portal').forEach(function (p) {
        p.remove();
      });
      document.body.classList.remove('menu-open');
    }

    function openMenuDrawer(triggerElement) {
      const existing = document.querySelector('[data-framer-portal-id="mobile-menu"]');
      if (existing) {
        closeAllOverlays();
        return;
      }

      closeAllOverlays();
      const container = document.getElementById('overlay') || document.body;
      const temp = document.createElement('div');
      temp.innerHTML = menuDrawerHtml.trim();
      const portal = temp.firstElementChild;

      // Set active link in mobile drawer
      const drawerLinks = portal.querySelectorAll('.luongson-sidebar-nav a');
      drawerLinks.forEach(function (link) {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '' && href === 'index.html')) {
          link.setAttribute('data-framer-page-link-current', 'true');
        } else {
          link.removeAttribute('data-framer-page-link-current');
        }
        link.addEventListener('click', function () {
          closeAllOverlays();
        });
      });

      // Position relative to trigger if available
      if (triggerElement) {
        const rect = triggerElement.getBoundingClientRect();
        const topPos = Math.max(44, rect.bottom + 4);
        portal.style.top = topPos + 'px';
        portal.style.right = '10px';
        portal.style.left = 'auto';
      }

      // Backdrop click listener
      const backdrop = portal.querySelector('.mobile-overlay-backdrop');
      if (backdrop) {
        backdrop.addEventListener('click', function (e) {
          e.stopPropagation();
          closeAllOverlays();
        });
      }

      container.appendChild(portal);
      document.body.classList.add('menu-open');
    }

    // Bind click on mobile menu buttons
    const menuIcons = document.querySelectorAll('.framer-q2hsys, [id$="-q2hsys"], #sidebarToggle');
    menuIcons.forEach(function (btn) {
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openMenuDrawer(btn);
      });
    });

    const mobileLogos = document.querySelectorAll('.framer-1byd5n2, [data-framer-name="Phone"] .framer-1byd5n2, [data-framer-name="Tablet"] .framer-1byd5n2');
    mobileLogos.forEach(function (btn) {
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openMenuDrawer(btn);
      });
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeAllOverlays();
      }
    });

    // Close on resize
    window.addEventListener('resize', function () {
      closeAllOverlays();
    });

    // Floating Catfish Close Action
    const closeCatfishBtn = document.querySelector('.framer-hsrn5s, [aria-label="Đóng quảng cáo"]');
    if (closeCatfishBtn) {
      closeCatfishBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const banner = closeCatfishBtn.closest('.luongson-catfish, .framer-9hgzo');
        if (banner) {
          banner.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
          banner.style.transform = 'translateY(100%)';
          banner.style.opacity = '0';
          setTimeout(function () {
            banner.style.display = 'none';
          }, 300);
        }
      });
    }

    // Marquee Ticker Close Action
    const closeTickerBtns = document.querySelectorAll('.luongson-marquee-ticker svg, .framer-1ecegz2 svg, .framer-16stqci svg, .framer-gvq6hs svg, .framer-1p0iri9 svg, .framer-197sjsc svg');
    closeTickerBtns.forEach(function (btn) {
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const ticker = btn.closest('.luongson-marquee-ticker, .framer-1ecegz2, .framer-16stqci, .framer-gvq6hs, .framer-1p0iri9, .framer-197sjsc');
        if (ticker) {
          ticker.style.transition = 'opacity 0.25s ease, max-height 0.25s ease, margin 0.25s ease';
          ticker.style.opacity = '0';
          ticker.style.maxHeight = '0px';
          ticker.style.overflow = 'hidden';
          setTimeout(function () {
            ticker.style.display = 'none';
          }, 250);
        }
      });
    });
  }

  // 2. Tabs Module - Tab switching for schedule, servers, and categories
  function initTabs(containerSelector) {
    const containers = document.querySelectorAll(containerSelector || '[data-tabs]');

    containers.forEach(function (container) {
      const tabs = container.querySelectorAll('[data-tab-target]');
      const contents = container.querySelectorAll('[data-tab-content]');

      tabs.forEach(function (tab) {
        tab.addEventListener('click', function (e) {
          e.preventDefault();
          const targetId = tab.getAttribute('data-tab-target');

          tabs.forEach(function (t) { t.classList.remove('is-active'); });
          contents.forEach(function (c) { c.classList.remove('is-active'); });

          tab.classList.add('is-active');
          const targetContent = container.querySelector('[data-tab-content="' + targetId + '"]');
          if (targetContent) {
            targetContent.classList.add('is-active');
          }
        });
      });
    });
  }

  // 3. Commentator Dropdown Selector - Pixel-perfect Framer Recreation
  function initCommentatorDropdown() {
    const dropdownHtml = `
<div class="framer-dil7X commentator-popover-portal" style="position: fixed; z-index: 99999; pointer-events: auto; display: none; opacity: 0; transform: translateY(-4px) scale(0.98); transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0, 0.8, 0.2, 1); transform-origin: top left;">
  <div class="framer-c71cur" data-border="true" role="dialog" style="--border-bottom-width: 1px; --border-color: rgba(0, 38, 90, 0.14); --border-left-width: 1px; --border-right-width: 1px; --border-style: solid; --border-top-width: 1px; background-color: rgb(255, 255, 255); border-radius: 12px; box-shadow: 0px 8px 20px 0px rgba(0, 25, 70, 0.18); width: 170px; padding: 6px; display: flex; flex-direction: column; gap: 2px; box-sizing: border-box;">
    
    <!-- Option 1: Lưu Bang -->
    <div class="framer-caa1bv commentator-option" data-commentator="Lưu Bang" data-avatar="./assets/images/Yg6nej34YPDDFet4CbXU48kB5MY_5b33b28e.png?width=400&amp;height=472" data-framer-name="Lưu Bang Option" data-highlight="true" style="border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; height: 34px; padding: 5px 8px; box-sizing: border-box; transition: background-color 0.15s ease;">
      <div class="framer-tahklm" data-framer-name="Avatar Lưu Bang" style="border-radius: 100px; width: 24px; height: 24px; flex: none; overflow: hidden; position: relative;">
        <div class="ls-s4" data-framer-background-image-wrapper="true" style="position: absolute; inset: 0px; border-radius: inherit;">
          <img class="ls-s149" alt="" decoding="auto" height="472" src="./assets/images/Yg6nej34YPDDFet4CbXU48kB5MY_5b33b28e.png?width=400&amp;height=472" width="400" style="display: block; width: 100%; height: 100%; border-radius: inherit; object-position: 45.8% 41%; object-fit: cover;" />
        </div>
      </div>
      <div class="framer-hjt0uq" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(16, 39, 70); flex: 1 0 0px; width: 1px; height: auto;">
        <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTYwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 11px; --framer-font-weight: 600; --framer-text-color: var(--extracted-r6o4lv, rgb(16, 39, 70)); color: rgb(16, 39, 70); white-space: nowrap;">Lưu Bang</p>
      </div>
    </div>

    <!-- Option 2: Gia Cát Lượng -->
    <div class="framer-1uakdm5 commentator-option" data-commentator="Gia Cát Lượng" data-avatar="./assets/images/ftE6EP9wNhOHQhEsRJCuIRV2uk_4ee7751d.png?width=587&amp;height=523" data-framer-name="Gia Cát Lượng Option" data-highlight="true" style="border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; height: 34px; padding: 5px 8px; box-sizing: border-box; transition: background-color 0.15s ease;">
      <div class="framer-efylkb" data-framer-name="Avatar Gia Cát Lượng" style="border-radius: 100px; width: 24px; height: 24px; flex: none; overflow: hidden; position: relative;">
        <div class="ls-s4" data-framer-background-image-wrapper="true" style="position: absolute; inset: 0px; border-radius: inherit;">
          <img class="ls-s149" alt="" decoding="auto" height="523" src="./assets/images/ftE6EP9wNhOHQhEsRJCuIRV2uk_4ee7751d.png?width=587&amp;height=523" width="587" style="display: block; width: 100%; height: 100%; border-radius: inherit; object-position: 47.6% 11.9%; object-fit: cover;" />
        </div>
      </div>
      <div class="framer-1kzxccu" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(16, 39, 70); flex: 1 0 0px; width: 1px; height: auto;">
        <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTYwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 11px; --framer-font-weight: 600; --framer-text-color: var(--extracted-r6o4lv, rgb(16, 39, 70)); color: rgb(16, 39, 70); white-space: nowrap;">Gia Cát Lượng</p>
      </div>
    </div>

    <!-- Option 3: Shelby -->
    <div class="framer-11ofke8 commentator-option" data-commentator="Shelby" data-avatar="./assets/images/wIKNhKyKJ9nlZZOnf2LaeteFjyk_f44a3706.jpg?width=240&amp;height=360" data-framer-name="Shelby Option" data-highlight="true" style="border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; height: 34px; padding: 5px 8px; box-sizing: border-box; transition: background-color 0.15s ease;">
      <div class="framer-1lnb1eh" data-framer-name="Avatar Shelby" style="border-radius: 100px; width: 24px; height: 24px; flex: none; overflow: hidden; position: relative;">
        <div class="ls-s4" data-framer-background-image-wrapper="true" style="position: absolute; inset: 0px; border-radius: inherit;">
          <img class="ls-s149" alt="" decoding="auto" height="360" src="./assets/images/wIKNhKyKJ9nlZZOnf2LaeteFjyk_f44a3706.jpg?width=240&amp;height=360" width="240" style="display: block; width: 100%; height: 100%; border-radius: inherit; object-position: 47.3% 26.6%; object-fit: cover;" />
        </div>
      </div>
      <div class="framer-khshqr" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(16, 39, 70); flex: 1 0 0px; width: 1px; height: auto;">
        <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTYwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 11px; --framer-font-weight: 600; --framer-text-color: var(--extracted-r6o4lv, rgb(16, 39, 70)); color: rgb(16, 39, 70); white-space: nowrap;">Shelby</p>
      </div>
    </div>

  </div>
</div>
    `;

    // Create single portal instance in DOM
    let portal = document.querySelector('.commentator-popover-portal');
    if (!portal) {
      const div = document.createElement('div');
      div.innerHTML = dropdownHtml.trim();
      portal = div.firstElementChild;
      document.body.appendChild(portal);
    }

    const options = portal.querySelectorAll('.commentator-option');
    options.forEach(function (opt) {
      opt.addEventListener('mouseenter', function () {
        opt.style.backgroundColor = 'rgb(232, 245, 255)';
      });
      opt.addEventListener('mouseleave', function () {
        opt.style.backgroundColor = 'transparent';
      });
    });

    let activeTrigger = null;

    function openDropdown(trigger) {
      if (activeTrigger === trigger && portal.style.display !== 'none') {
        closeDropdown();
        return;
      }

      activeTrigger = trigger;
      portal.style.display = 'block';

      const rect = trigger.getBoundingClientRect();
      const dropdownWidth = 170;
      const dropdownHeight = portal.offsetHeight || 120;

      let left = rect.left;
      if (left + dropdownWidth > window.innerWidth - 10) {
        left = window.innerWidth - dropdownWidth - 10;
      }
      if (left < 10) left = 10;

      let top = rect.bottom + 6;
      if (top + dropdownHeight > window.innerHeight - 10 && rect.top - dropdownHeight - 6 > 0) {
        top = rect.top - dropdownHeight - 6;
      }

      portal.style.left = left + 'px';
      portal.style.top = top + 'px';

      requestAnimationFrame(function () {
        portal.style.opacity = '1';
        portal.style.transform = 'translateY(0px) scale(1)';
      });
    }

    function closeDropdown() {
      portal.style.opacity = '0';
      portal.style.transform = 'translateY(-4px) scale(0.98)';
      setTimeout(function () {
        if (portal.style.opacity === '0') {
          portal.style.display = 'none';
          activeTrigger = null;
        }
      }, 150);
    }

    // Handle option selection
    options.forEach(function (opt) {
      opt.addEventListener('click', function (e) {
        e.stopPropagation();
        const commentator = opt.getAttribute('data-commentator');
        const avatarSrc = opt.getAttribute('data-avatar');

        if (activeTrigger) {
          // Update name
          const textEl = activeTrigger.querySelector('.framer-pgnkcz p, .framer-text');
          if (textEl) {
            textEl.textContent = commentator;
          }

          // Update avatar image
          const imgEl = activeTrigger.querySelector('.framer-16bmefw img, [data-framer-name^="Avatar"] img');
          if (imgEl) {
            imgEl.src = avatarSrc;
          }

          // Update container data-framer-name
          const parentContainer = activeTrigger.closest('.framer-dil7X');
          if (parentContainer) {
            parentContainer.setAttribute('data-framer-name', commentator);
          }
        }

        closeDropdown();
      });
    });

    // Attach click listener to all commentator triggers
    function attachCommentatorTriggers() {
      const buttons = document.querySelectorAll('.luongson-match-commentator-container, .framer-dil7X .framer-l9nh29, .framer-dil7X[data-framer-name]');
      buttons.forEach(function (btn) {
        const trigger = btn.classList.contains('framer-l9nh29') ? btn : (btn.querySelector('.framer-l9nh29') || btn);
        trigger.style.cursor = 'pointer';

        // Hover background styling
        trigger.addEventListener('mouseenter', function () {
          trigger.style.backgroundColor = 'rgb(0, 166, 255)';
        });
        trigger.addEventListener('mouseleave', function () {
          trigger.style.backgroundColor = 'rgb(0, 110, 219)';
        });

        trigger.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          openDropdown(trigger);
        });
      });
    }

    attachCommentatorTriggers();

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (portal.style.display !== 'none' && !portal.contains(e.target) && (!activeTrigger || !activeTrigger.contains(e.target))) {
        closeDropdown();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && portal.style.display !== 'none') {
        closeDropdown();
      }
    });

    // Reposition / close on scroll
    window.addEventListener('scroll', function () {
      if (portal.style.display !== 'none' && activeTrigger) {
        const rect = activeTrigger.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          portal.style.display = 'none';
          portal.style.opacity = '0';
          activeTrigger = null;
        } else {
          openDropdown(activeTrigger);
        }
      }
    }, { passive: true });

    window.addEventListener('resize', function () {
      if (portal.style.display !== 'none' && activeTrigger) {
        openDropdown(activeTrigger);
      }
    });
  }

  // 4. Match Info Modal Popover on hover - Pixel-perfect Framer Recreation
  function initMatchModal() {
    const popoverHtml = `
<div class="framer-iz7ZB match-info-popover-portal" style="position: fixed; z-index: 99999; pointer-events: auto; display: none; opacity: 0; transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.2, 0, 0.2, 1); transform: scale(0.96); transform-origin: top center;">
  <div class="framer-aojxv6" role="dialog" style="--corner-shape-fallback: 0.796; background-color: rgb(255, 255, 255); border-radius: 20px; box-shadow: 0px 10px 20px 0px rgba(0, 0, 0, 0.05); width: 384px; box-sizing: border-box; padding: 12px 12px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px;">
    <!-- Tabs -->
    <div class="framer-ry4stz">
      <div class="framer-1an5e9x match-modal-tab active" data-tab="all" data-border="true" style="--border-bottom-width: 1px; --border-color: rgb(82, 125, 255); --border-left-width: 1px; --border-right-width: 1px; --border-style: solid; --border-top-width: 1px; background-color: rgb(82, 125, 255); border-radius: 20px; cursor: pointer; padding: 6px 12px; display: flex; align-items: center; justify-content: center; user-select: none;">
        <div class="framer-k00u1l" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(255, 255, 255);">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 14px; --framer-font-weight: 700; --framer-text-color: var(--extracted-r6o4lv, rgb(255, 255, 255)); color: var(--extracted-r6o4lv, rgb(255, 255, 255));">Tất cả</p>
        </div>
      </div>
      <div class="framer-10mbhol match-modal-tab" data-tab="h1" data-border="true" style="--border-bottom-width: 1px; --border-color: rgb(82, 125, 255); --border-left-width: 1px; --border-right-width: 1px; --border-style: solid; --border-top-width: 1px; background-color: rgba(0, 0, 0, 0); border-radius: 20px; cursor: pointer; padding: 6px 12px; display: flex; align-items: center; justify-content: center; user-select: none;">
        <div class="framer-9h3v1m" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 14px; --framer-font-weight: 700; color: rgb(0, 0, 0);">Hiệp 1</p>
        </div>
      </div>
      <div class="framer-1pmanb5 match-modal-tab" data-tab="h2" data-border="true" style="--border-bottom-width: 1px; --border-color: rgb(82, 125, 255); --border-left-width: 1px; --border-right-width: 1px; --border-style: solid; --border-top-width: 1px; background-color: rgba(0, 0, 0, 0); border-radius: 20px; cursor: pointer; padding: 6px 12px; display: flex; align-items: center; justify-content: center; user-select: none;">
        <div class="framer-1907n8s" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 14px; --framer-font-weight: 700; color: rgb(0, 0, 0);">Hiệp 2</p>
        </div>
      </div>
    </div>

    <!-- Row 1: TL kiểm soát bóng -->
    <div class="framer-1trrpnw">
      <div class="framer-lw7m8o">
        <div class="framer-a2fbit" data-framer-component-type="RichTextContainer">
          <p class="framer-text stat-val-left-possession" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">57%</p>
        </div>
        <div class="framer-1vv346m" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">TL kiểm soát bóng</p>
        </div>
        <div class="framer-vu2aff" data-framer-component-type="RichTextContainer">
          <p class="framer-text stat-val-right-possession" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">43%</p>
        </div>
      </div>
      <div class="framer-1amiahw">
        <div class="framer-wtawsi" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1q3228h stat-bar-left-possession" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 57%; transition: width 0.3s ease;"></div>
        </div>
        <div class="framer-1s49rqs" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1mov7wv stat-bar-right-possession" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 43%; transition: width 0.3s ease;"></div>
        </div>
      </div>
    </div>

    <!-- Row 2: Phạt góc -->
    <div class="framer-bgrmuy">
      <div class="framer-1u6jvqj">
        <div class="framer-h1o2hv" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">4</p>
        </div>
        <div class="framer-4rz9po" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Phạt góc</p>
        </div>
        <div class="framer-xx3myi" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">1</p>
        </div>
      </div>
      <div class="framer-1feu85z">
        <div class="framer-178b2zo" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1x604t0" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 80%;"></div>
        </div>
        <div class="framer-17jdo00" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-aefbwd" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 20%;"></div>
        </div>
      </div>
    </div>

    <!-- Row 3: Thẻ vàng -->
    <div class="framer-1587lao">
      <div class="framer-zss6fq">
        <div class="framer-1s3rb2t" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">2</p>
        </div>
        <div class="framer-puwrvi" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Thẻ vàng</p>
        </div>
        <div class="framer-13lnoht" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">0</p>
        </div>
      </div>
      <div class="framer-1aof70k">
        <div class="framer-1yjap8f" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-19t9a93" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 100%;"></div>
        </div>
        <div class="framer-1sexck6" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1hyr9sk" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 0%;"></div>
        </div>
      </div>
    </div>

    <!-- Row 4: Sút bóng -->
    <div class="framer-yce0z5">
      <div class="framer-ty4t7c">
        <div class="framer-1a4u3ke" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">7</p>
        </div>
        <div class="framer-gac7m7" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Sút bóng</p>
        </div>
        <div class="framer-1t89efh" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">3</p>
        </div>
      </div>
      <div class="framer-x8jp9i">
        <div class="framer-183ar8d" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1cg1fl1" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 70%;"></div>
        </div>
        <div class="framer-1qu21oe" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1akp76q" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 30%;"></div>
        </div>
      </div>
    </div>

    <!-- Row 5: Sút cầu môn -->
    <div class="framer-xjkbmx">
      <div class="framer-1sgrvud">
        <div class="framer-1dfupgd" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">4</p>
        </div>
        <div class="framer-b0in9n" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Sút cầu môn</p>
        </div>
        <div class="framer-1uj1trx" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">1</p>
        </div>
      </div>
      <div class="framer-1kb4wjn">
        <div class="framer-zwoy2" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1i0d3s5" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 80%;"></div>
        </div>
        <div class="framer-1ibb5np" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1hrpzha" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 20%;"></div>
        </div>
      </div>
    </div>

    <!-- Row 6: Sút ngoài cầu môn -->
    <div class="framer-bl1n0r">
      <div class="framer-mdn5hv">
        <div class="framer-1v2yfmh" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">3</p>
        </div>
        <div class="framer-bvkwnl" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Sút ngoài cầu môn</p>
        </div>
        <div class="framer-sblwng" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">2</p>
        </div>
      </div>
      <div class="framer-4rigqm">
        <div class="framer-hi9vag" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-p7lsql" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 60%;"></div>
        </div>
        <div class="framer-14qr236" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1kqvqsm" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 40%;"></div>
        </div>
      </div>
    </div>

    <!-- Row 7: Tấn công -->
    <div class="framer-11lb8cc">
      <div class="framer-1q9h07r">
        <div class="framer-d56ahn" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">19</p>
        </div>
        <div class="framer-dws4k8" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Tấn công</p>
        </div>
        <div class="framer-6tmamu" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">17</p>
        </div>
      </div>
      <div class="framer-ui41va">
        <div class="framer-11yx3jj" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1juwgxq" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 53%;"></div>
        </div>
        <div class="framer-va1nw0" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-o67ujt" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 47%;"></div>
        </div>
      </div>
    </div>

    <!-- Row 8: Tấn công nguy hiểm -->
    <div class="framer-nmrzbo">
      <div class="framer-1ibdxtk">
        <div class="framer-rozn0b" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">23</p>
        </div>
        <div class="framer-ysnhtg" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Tấn công nguy hiểm</p>
        </div>
        <div class="framer-rt7wpv" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">8</p>
        </div>
      </div>
      <div class="framer-hlv9iz">
        <div class="framer-1n2ttzj" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1fe3abr" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 74%;"></div>
        </div>
        <div class="framer-18b5mhn" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-pp1e24" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 26%;"></div>
        </div>
      </div>
    </div>

  </div>
</div>
    `;

    // Create single instance in document body
    let portal = document.querySelector('.match-info-popover-portal');
    if (!portal) {
      const div = document.createElement('div');
      div.innerHTML = popoverHtml.trim();
      portal = div.firstElementChild;
      document.body.appendChild(portal);
    }

    const leftPossText = portal.querySelector('.stat-val-left-possession');
    const rightPossText = portal.querySelector('.stat-val-right-possession');
    const leftPossBar = portal.querySelector('.stat-bar-left-possession');
    const rightPossBar = portal.querySelector('.stat-bar-right-possession');
    const tabs = portal.querySelectorAll('.match-modal-tab');

    const tabData = {
      all: { leftText: '57%', rightText: '43%', leftWidth: '57%', rightWidth: '43%' },
      h1: { leftText: '70%', rightText: '30%', leftWidth: '70%', rightWidth: '30%' },
      h2: { leftText: '45%', rightText: '55%', leftWidth: '45%', rightWidth: '55%' }
    };

    function setTab(tabName) {
      tabs.forEach(function (t) {
        const isCur = t.getAttribute('data-tab') === tabName;
        const textEl = t.querySelector('p');
        if (isCur) {
          t.style.backgroundColor = 'rgb(82, 125, 255)';
          if (textEl) textEl.style.color = 'rgb(255, 255, 255)';
        } else {
          t.style.backgroundColor = 'rgba(0, 0, 0, 0)';
          if (textEl) textEl.style.color = 'rgb(0, 0, 0)';
        }
      });

      const data = tabData[tabName] || tabData.all;
      if (leftPossText) leftPossText.textContent = data.leftText;
      if (rightPossText) rightPossText.textContent = data.rightText;
      if (leftPossBar) leftPossBar.style.width = data.leftWidth;
      if (rightPossBar) rightPossBar.style.width = data.rightWidth;
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function (e) {
        e.stopPropagation();
        const tabName = tab.getAttribute('data-tab');
        setTab(tabName);
      });
    });

    let currentTrigger = null;
    let closeTimeout = null;

    function showPopover(trigger) {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }

      currentTrigger = trigger;
      portal.style.display = 'block';

      const rect = trigger.getBoundingClientRect();
      const modalWidth = 384;
      const modalHeight = portal.offsetHeight || 440;

      let left = rect.left + (rect.width / 2) - (modalWidth / 2);
      // Collision detection on horizontal edges
      if (left < 10) left = 10;
      if (left + modalWidth > window.innerWidth - 10) {
        left = window.innerWidth - modalWidth - 10;
      }

      let top = rect.bottom + 4;
      // If overflowing bottom, flip to top
      if (top + modalHeight > window.innerHeight - 10 && rect.top - modalHeight - 4 > 0) {
        top = rect.top - modalHeight - 4;
      }

      portal.style.left = left + 'px';
      portal.style.top = top + 'px';

      // Trigger transition
      requestAnimationFrame(function () {
        portal.style.opacity = '1';
        portal.style.transform = 'scale(1)';
      });
    }

    function hidePopover() {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
      closeTimeout = setTimeout(function () {
        portal.style.opacity = '0';
        portal.style.transform = 'scale(0.96)';
        setTimeout(function () {
          if (portal.style.opacity === '0') {
            portal.style.display = 'none';
            currentTrigger = null;
          }
        }, 150);
      }, 120);
    }

    portal.addEventListener('mouseenter', function () {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    });

    portal.addEventListener('mouseleave', function () {
      hidePopover();
    });

    // Attach hover events to all match badges
    function attachBadges() {
      const badges = document.querySelectorAll('.luongson-match-status-container, .framer-iz7ZB.framer-3i8edo, [data-framer-name="Tất cả"] .framer-oy32wj, .framer-j2pa5u-container .framer-iz7ZB');
      badges.forEach(function (badge) {
        const target = badge.closest('.framer-iz7ZB') || badge;
        target.style.cursor = 'pointer';

        target.addEventListener('mouseenter', function () {
          showPopover(target);
        });

        target.addEventListener('mouseleave', function () {
          hidePopover();
        });
      });
    }

    attachBadges();

    window.addEventListener('scroll', function () {
      if (portal.style.display !== 'none' && currentTrigger) {
        const rect = currentTrigger.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          portal.style.display = 'none';
          portal.style.opacity = '0';
          currentTrigger = null;
        } else {
          showPopover(currentTrigger);
        }
      }
    }, { passive: true });

    window.addEventListener('resize', function () {
      if (portal.style.display !== 'none' && currentTrigger) {
        showPopover(currentTrigger);
      }
    });
  }

  // 5. Common Infinite Ticker & Marquee Engine
  function createInfiniteTicker(options) {
    const selector = options.selector;
    const trackSelector = options.trackSelector || 'ul';
    const speed = typeof options.speed === 'number' ? options.speed : 40;
    const direction = typeof options.direction === 'number' ? options.direction : -1;
    const pauseOnHover = options.pauseOnHover !== false;
    const draggable = options.draggable !== false;

    const containers = document.querySelectorAll(selector);

    containers.forEach(function (container) {
      const track = container.querySelector(trackSelector) || container.querySelector('ul') || container.firstElementChild;
      if (!track) return;
      if (track.__lsTickerInit) return;
      track.__lsTickerInit = true;

      // Extract original children, ignoring pre-existing clones
      const originalChildren = Array.from(track.children).filter(function (child) {
        return !child.classList.contains('clone-item') && child.getAttribute('aria-hidden') !== 'true';
      });

      if (originalChildren.length === 0) return;

      // Remove any static clone items from HTML
      Array.from(track.children).forEach(function (child) {
        if (child.classList.contains('clone-item') || child.getAttribute('aria-hidden') === 'true') {
          child.remove();
        }
      });

      // Mark original children with ticker-item
      originalChildren.forEach(function (child) {
        if (!child.classList.contains('ticker-item')) {
          child.classList.add('ticker-item');
        }
      });

      let singleSetWidth = 0;

      function buildClones() {
        // Clear existing clones
        Array.from(track.querySelectorAll('.clone-item')).forEach(function (c) { c.remove(); });

        if (originalChildren.length === 0) return;

        const isCommentators = container.classList.contains('luongson-commentators-list') || container.classList.contains('framer-3bgk2l');
        const isColumn = window.getComputedStyle(track).flexDirection === 'column';

        if (isColumn) {
          originalChildren.forEach(function (child) {
            child.style.removeProperty('width');
            child.style.removeProperty('flex');
            child.style.removeProperty('min-width');
            child.style.removeProperty('max-width');
          });
          track.style.removeProperty('transform');
          singleSetWidth = 0;
          return;
        }

        const containerWidth = container.offsetWidth || window.innerWidth;
        const computedStyle = window.getComputedStyle(track);
        const gap = parseFloat(computedStyle.gap) || parseFloat(computedStyle.columnGap) || 10;

        if (isCommentators && containerWidth > 0) {
          const cols = containerWidth >= 1024 ? 3 : (containerWidth >= 640 ? 2 : 1);
          const cardWidth = Math.floor((containerWidth - (cols - 1) * gap) / cols);
          originalChildren.forEach(function (child) {
            child.style.setProperty('width', cardWidth + 'px', 'important');
            child.style.setProperty('flex', '0 0 ' + cardWidth + 'px', 'important');
            child.style.setProperty('min-width', cardWidth + 'px', 'important');
            child.style.setProperty('max-width', cardWidth + 'px', 'important');
          });
          singleSetWidth = (cardWidth + gap) * originalChildren.length;
        } else {
          // Measure natural single set width
          const firstChild = originalChildren[0];
          const lastChild = originalChildren[originalChildren.length - 1];
          const firstLeft = firstChild.offsetLeft;
          const lastRight = lastChild.offsetLeft + lastChild.offsetWidth;

          const firstRect = firstChild.getBoundingClientRect();
          const lastRect = lastChild.getBoundingClientRect();
          if (firstRect.width > 0 && (lastRect.right - firstRect.left) > 0) {
            singleSetWidth = (lastRect.right - firstRect.left) + gap;
          } else {
            singleSetWidth = (lastRight - firstLeft) + gap;
          }
          if (singleSetWidth <= 0 || isNaN(singleSetWidth)) {
            singleSetWidth = originalChildren.reduce(function (acc, el) { return acc + (el.offsetWidth || 280) + gap; }, 0);
          }
        }
        if (singleSetWidth <= 0) return;

        const neededCopies = Math.max(2, Math.ceil((containerWidth * 2) / singleSetWidth) + 1);

        for (let i = 0; i < neededCopies; i++) {
          originalChildren.forEach(function (child) {
            const clone = child.cloneNode(true);
            clone.classList.add('clone-item');
            clone.setAttribute('aria-hidden', 'true');
            track.appendChild(clone);
          });
        }
      }

      buildClones();

      // State
      let currentX = 0;
      let isHovered = false;
      let isDragging = false;
      let startX = 0;
      let dragStartX = 0;
      let dragDistance = 0;
      let lastTimestamp = null;
      let rafId = null;

      function animate(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
        lastTimestamp = timestamp;

        if (!isHovered && !isDragging && singleSetWidth > 0) {
          const isColumn = window.getComputedStyle(track).flexDirection === 'column';
          if (isColumn) {
            track.style.removeProperty('transform');
            return;
          }

          currentX += direction * speed * dt;

          if (direction < 0) {
            while (currentX <= -singleSetWidth) {
              currentX += singleSetWidth;
            }
          } else {
            while (currentX >= 0) {
              currentX -= singleSetWidth;
            }
          }

          track.style.setProperty('transform', 'translate3d(' + currentX + 'px, 0, 0)', 'important');
        }

        rafId = requestAnimationFrame(animate);
      }

      rafId = requestAnimationFrame(animate);

      // Hover
      if (pauseOnHover) {
        container.addEventListener('mouseenter', function () { isHovered = true; });
        container.addEventListener('mouseleave', function () { isHovered = false; });
      }

      // Drag
      if (draggable) {
        function onPointerStart(e) {
          isDragging = true;
          startX = e.touches ? e.touches[0].clientX : e.clientX;
          dragStartX = currentX;
          dragDistance = 0;
          track.style.cursor = 'grabbing';
        }

        function onPointerMove(e) {
          if (!isDragging) return;
          const currentClientX = e.touches ? e.touches[0].clientX : e.clientX;
          const diff = currentClientX - startX;
          dragDistance += Math.abs(diff);
          currentX = dragStartX + diff;

          if (singleSetWidth > 0) {
            while (currentX <= -singleSetWidth) currentX += singleSetWidth;
            while (currentX > 0) currentX -= singleSetWidth;
          }

          track.style.setProperty('transform', 'translate3d(' + currentX + 'px, 0, 0)', 'important');
        }

        function onPointerEnd() {
          if (!isDragging) return;
          isDragging = false;
          track.style.cursor = '';
        }

        track.addEventListener('mousedown', onPointerStart);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerEnd);

        track.addEventListener('touchstart', onPointerStart, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerEnd, { passive: true });

        track.addEventListener('click', function (e) {
          if (dragDistance > 6) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, true);
      }

      // Resize
      let resizeTimer = null;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(buildClones, 150);
      });

      // Visibility API
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          lastTimestamp = null;
        }
      });
    });
  }

  // 6. Follow Button Global Delegated Handler
  function initFollowButtons() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-framer-name="Follow Button"], .framer-1tp7z3x, .framer-1l5csht, .framer-bbuwzs');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const isFollowed = btn.classList.toggle('followed');
      const textEl = btn.querySelector('p, span');
      if (textEl) {
        textEl.textContent = isFollowed ? '♥️ Đã theo dõi' : '♥️ Follow';
      }
    });
  }

  // 7. Match Bet Button Slideshow (Vertical flip)
  function initMatchBetSlideshow() {
    const slideshows = document.querySelectorAll('.framer-slideshow-axis-y');

    slideshows.forEach(function (slideshow) {
      const track = slideshow.querySelector('ul');
      if (!track || track.__slideshowInit) return;
      track.__slideshowInit = true;

      const items = track.querySelectorAll('li');
      if (items.length <= 1) return;

      let currentIndex = 0;
      const totalItems = items.length;

      setInterval(function () {
        currentIndex = (currentIndex + 1) % totalItems;
        const percentage = -(currentIndex * 100);
        track.style.setProperty('transform', 'translate3d(0, ' + percentage + '%, 0)', 'important');
      }, 3500);
    });
  }

  // Master Initializer for all Tickers & Sliders
  function initAllTickers() {
    // 1. Top Marquee Ticker Bar
    createInfiniteTicker({
      selector: '.luongson-marquee-ticker, .framer-1ecegz2, .framer-16stqci, .framer-gvq6hs, .framer-1p0iri9, .framer-197sjsc',
      trackSelector: 'ul',
      speed: 42,
      direction: -1,
      pauseOnHover: true,
      draggable: true
    });

    // 2. Featured Match Ads Ticker (Score Bar)
    createInfiniteTicker({
      selector: '.luongson-featured-ads-ticker, .framer-cfqyq6',
      trackSelector: 'ul',
      speed: 38,
      direction: -1,
      pauseOnHover: true,
      draggable: true
    });

    // 3. Top Bookmakers Ticker
    createInfiniteTicker({
      selector: '.luongson-top-bookmakers, .framer-1lnj4y4-container, .framer-ioysu6-container, .framer-srbwl7-container, .framer-yy5utx-container',
      trackSelector: '.framer-czcwzc ul, ul',
      speed: 36,
      direction: -1,
      pauseOnHover: true,
      draggable: true
    });

    // 4. Footer Sponsors Logo Ticker
    createInfiniteTicker({
      selector: '.luongson-footer-sponsors, .framer-1f6jmnw',
      trackSelector: '.framer-35hpbh ul, ul',
      speed: 32,
      direction: -1,
      pauseOnHover: true,
      draggable: true
    });

    // 5. Top Commentators Ticker / Slider
    createInfiniteTicker({
      selector: '.luongson-commentators-list, .framer-3bgk2l',
      trackSelector: '.framer-5zry8q',
      speed: 35,
      direction: -1,
      pauseOnHover: true,
      draggable: true
    });

    // Match Bet Button Slideshows
    initMatchBetSlideshow();

    // Follow Buttons Handler
    initFollowButtons();
  }

  // DOM Ready
  function onReady() {
    initNavigation();
    initTabs();
    initCommentatorDropdown();
    initMatchModal();
    initAllTickers();
    console.log('LuongSon TV App Initialized successfully (All Tickers & Sliders Active).');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
