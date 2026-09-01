// Navigation Module - Active links & Mobile menu overlay handling
export function initNavigation() {
  // Desktop sidebar navigation active link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navItems = document.querySelectorAll('.luongson-sidebar-nav a, [data-framer-name="Navigation Items"] a');
  navItems.forEach((item) => {
    const href = item.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      item.setAttribute('data-framer-page-link-current', 'true');
      item.classList.add('is-active');
    } else {
      item.removeAttribute('data-framer-page-link-current');
      item.classList.remove('is-active');
    }
    item.addEventListener('click', () => {
      navItems.forEach((i) => {
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
    document.querySelectorAll('.mobile-overlay-portal').forEach((p) => {
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
    drawerLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === currentPath || (currentPath === '' && href === 'index.html')) {
        link.setAttribute('data-framer-page-link-current', 'true');
      } else {
        link.removeAttribute('data-framer-page-link-current');
      }
      link.addEventListener('click', () => {
        closeAllOverlays();
      });
    });

    // Position relative to trigger if available
    if (triggerElement) {
      const rect = triggerElement.getBoundingClientRect();
      const topPos = Math.max(44, rect.bottom + 4);
      portal.style.top = `${topPos}px`;
      portal.style.right = '10px';
      portal.style.left = 'auto';
    }

    // Backdrop click listener
    const backdrop = portal.querySelector('.mobile-overlay-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllOverlays();
      });
    }

    container.appendChild(portal);
    document.body.classList.add('menu-open');
  }

  // Bind click on mobile menu buttons
  const menuIcons = document.querySelectorAll('.framer-q2hsys, [id$="-q2hsys"], #sidebarToggle');
  menuIcons.forEach((btn) => {
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openMenuDrawer(btn);
    });
  });

  const mobileLogos = document.querySelectorAll('.framer-1byd5n2, [data-framer-name="Phone"] .framer-1byd5n2, [data-framer-name="Tablet"] .framer-1byd5n2');
  mobileLogos.forEach((btn) => {
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openMenuDrawer(btn);
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllOverlays();
    }
  });

  // Close on resize
  window.addEventListener('resize', () => {
    closeAllOverlays();
  });

  // Floating Catfish Close Action
  const closeCatfishBtn = document.querySelector('.framer-hsrn5s, [aria-label="Đóng quảng cáo"]');
  if (closeCatfishBtn) {
    closeCatfishBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const banner = closeCatfishBtn.closest('.luongson-catfish, .framer-9hgzo');
      if (banner) {
        banner.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        banner.style.transform = 'translateY(100%)';
        banner.style.opacity = '0';
        setTimeout(() => {
          banner.style.display = 'none';
        }, 300);
      }
    });
  }

  // Marquee Ticker Close Action
  const closeTickerBtns = document.querySelectorAll('.luongson-marquee-ticker svg');
  closeTickerBtns.forEach((btn) => {
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const ticker = btn.closest('.luongson-marquee-ticker');
      if (ticker) {
        ticker.style.transition = 'opacity 0.2s ease, max-height 0.2s ease';
        ticker.style.opacity = '0';
        setTimeout(() => {
          ticker.style.display = 'none';
        }, 200);
      }
    });
  });
}
