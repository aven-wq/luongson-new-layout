/**
 * LuongSon layout navigation — sidebar active state, mobile drawer, footer sponsor ticker.
 */
(function () {
  'use strict';

  function getCurrentPath() {
    var path = window.location.pathname.replace(/\/+$/, '') || '/';
    return path;
  }

  function normalizeHref(href) {
    if (!href) return '';
    try {
      var url = new URL(href, window.location.origin);
      var path = url.pathname.replace(/\/+$/, '') || '/';
      return path;
    } catch (e) {
      return href;
    }
  }

  function setActiveNavLinks() {
    var current = getCurrentPath();
    var navItems = document.querySelectorAll('.luongson-sidebar-nav a');

    navItems.forEach(function (item) {
      var href = normalizeHref(item.getAttribute('href'));
      var isHome = current === '/' && (href === '/' || href === '/index.html');
      var isActive = isHome || (href !== '/' && current === href);

      if (isActive) {
        item.setAttribute('data-framer-page-link-current', 'true');
        item.classList.add('is-active');
      } else {
        item.removeAttribute('data-framer-page-link-current');
        item.classList.remove('is-active');
      }
    });
  }

  function buildDrawerHtml() {
    var sidebar = document.querySelector('.luongson-sidebar-left .luongson-sidebar-nav');
    if (!sidebar) return '';

    var navClone = sidebar.cloneNode(true);
    var assetBase = (window.luongsonNav && window.luongsonNav.assetBase) || '';
    var bgUrl = assetBase + 'images/pTd7CCLT508FqMHQ7dFkL9QKk_8ddf363d.png?width=4775&height=7432';

    return (
      '<div class="framer-GRble framer-v-4lv5aa mobile-overlay-portal" data-framer-portal-id="mobile-menu" style="top:44px;right:10px;visibility:visible;width:200px;height:auto;position:fixed;z-index:9999;">' +
        '<div class="mobile-overlay-backdrop" aria-hidden="true" style="position:fixed;inset:0;z-index:-1;"></div>' +
        '<div class="framer-9mqwgf" role="dialog">' +
          '<div class="framer-1pxqhkz-container">' +
            '<div class="framer-QbuP0 framer-1ei7e2m framer-v-1ji60ut ls-s2" data-border="true">' +
              '<div class="framer-1omzemv ls-s3" data-framer-name="Image" style="filter:blur(1px);opacity:0.6;">' +
                '<div class="ls-s4" data-framer-background-image-wrapper="true">' +
                  '<img class="ls-s5" alt="" decoding="auto" src="' + bgUrl + '" />' +
                '</div>' +
              '</div>' +
              navClone.outerHTML +
              '<div class="framer-1fs5sty ls-s13"></div>' +
              '<div class="framer-174nt9o ls-s14 luongson-sidebar-banner">' +
                '<div class="framer-1u5fm4z ls-s15"><p class="framer-text ls-s16">LIVE FOOTBALL</p></div>' +
                '<div class="framer-1k52wdm ls-s17"><p class="framer-text ls-s18">BÓNG ĐÁ ĐỈNH CAO</p></div>' +
                '<div class="framer-arse6 ls-s19"><p class="framer-text ls-s10">Cược thả ga</p></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function closeAllOverlays() {
    document.querySelectorAll('.mobile-overlay-portal').forEach(function (portal) {
      portal.remove();
    });
    document.body.classList.remove('menu-open');
  }

  function openMenuDrawer(triggerElement) {
    var existing = document.querySelector('[data-framer-portal-id="mobile-menu"]');
    if (existing) {
      closeAllOverlays();
      return;
    }

    var html = buildDrawerHtml();
    if (!html) return;

    var container = document.getElementById('overlay') || document.body;
    var temp = document.createElement('div');
    temp.innerHTML = html.trim();
    var portal = temp.firstElementChild;

    if (triggerElement) {
      var rect = triggerElement.getBoundingClientRect();
      portal.style.top = Math.max(44, rect.bottom + 4) + 'px';
      portal.style.right = '10px';
      portal.style.left = 'auto';
    }

    var backdrop = portal.querySelector('.mobile-overlay-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', function (e) {
        e.stopPropagation();
        closeAllOverlays();
      });
    }

    portal.querySelectorAll('.luongson-sidebar-nav a').forEach(function (link) {
      link.addEventListener('click', closeAllOverlays);
    });

    container.appendChild(portal);
    document.body.classList.add('menu-open');
    setActiveNavLinks();
  }

  function bindMobileMenu() {
    document.querySelectorAll('#sidebarToggle, .framer-q2hsys').forEach(function (btn) {
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openMenuDrawer(btn);
      });
    });

    document.querySelectorAll('.luongson-mobile-header .framer-1byd5n2').forEach(function (logoWrap) {
      logoWrap.style.cursor = 'pointer';
      logoWrap.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        e.preventDefault();
        openMenuDrawer(logoWrap);
      });
    });
  }

  function setTickerTransform(track, x) {
    track.style.setProperty('transform', 'translate3d(' + x + 'px,0,0)', 'important');
  }

  function measureTickerWidth(originals, gap) {
    if (!originals.length) return 0;

    var first = originals[0];
    var last = originals[originals.length - 1];
    var firstRect = first.getBoundingClientRect();
    var lastRect = last.getBoundingClientRect();

    if (firstRect.width > 0 && (lastRect.right - firstRect.left) > 0) {
      return (lastRect.right - firstRect.left) + gap;
    }

    return originals.reduce(function (acc, el) {
      return acc + (el.offsetWidth || 0) + gap;
    }, 0);
  }

  function initFooterSponsorTickerContainer(container) {
    var track = container.querySelector('.framer-35hpbh ul, ul');
    if (!track || track.__lsTickerInit) return;

    var originals = Array.from(track.children).filter(function (child) {
      return !child.classList.contains('clone-item');
    });
    if (!originals.length) return;

    var computed = window.getComputedStyle(track);
    var gap = parseFloat(computed.gap) || parseFloat(computed.columnGap) || 28;
    var singleWidth = measureTickerWidth(originals, gap);

    if (singleWidth <= 0) return false;

    track.__lsTickerInit = true;

    originals.forEach(function (child) {
      if (!child.classList.contains('ticker-item')) {
        child.classList.add('ticker-item');
      }
    });

    var copies = Math.max(2, Math.ceil(((container.offsetWidth || window.innerWidth) * 2) / singleWidth) + 1);
    for (var i = 0; i < copies; i++) {
      originals.forEach(function (child) {
        var clone = child.cloneNode(true);
        clone.classList.add('clone-item');
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
    }

    var offset = 0;
    var speed = 32;
    var paused = false;

    container.addEventListener('mouseenter', function () { paused = true; });
    container.addEventListener('mouseleave', function () { paused = false; });

    function tick(ts) {
      if (!tick.last) tick.last = ts;
      var dt = Math.min((ts - tick.last) / 1000, 0.1);
      tick.last = ts;

      if (!paused) {
        offset -= speed * dt;
        if (offset <= -singleWidth) offset += singleWidth;
        setTickerTransform(track, offset);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    return true;
  }

  function initFooterSponsorTicker() {
    var containers = document.querySelectorAll('.luongson-footer-sponsors, .framer-1f6jmnw');
    if (!containers.length) return;

    var attempts = 0;

    function boot() {
      var pending = false;

      containers.forEach(function (container) {
        var track = container.querySelector('.framer-35hpbh ul, ul');
        if (!track || track.__lsTickerInit) return;

        if (!initFooterSponsorTickerContainer(container)) {
          pending = true;
        }
      });

      if (pending && attempts < 20) {
        attempts += 1;
        requestAnimationFrame(boot);
      }
    }

    boot();
  }

  function onReady() {
    setActiveNavLinks();
    bindMobileMenu();
    initFooterSponsorTicker();

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllOverlays();
    });
    window.addEventListener('resize', closeAllOverlays);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
