/**
 * LuongSon Sport — Match schedule date picker + status hover modal
 */
(function () {
  'use strict';

  var cfg = window.luongsonSchedule || {};
  var IMG = cfg.imgUrl || '';

  function img(file) {
    return IMG + file;
  }

  var MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function isSameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function formatLabel(date) {
    var today = new Date();
    var dm = pad(date.getDate()) + '/' + MONTHS[date.getMonth()];
    if (isSameDay(date, today)) {
      return 'Hôm nay, ' + dm;
    }
    var yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(date, yesterday)) {
      return 'Hôm qua, ' + dm;
    }
    var tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (isSameDay(date, tomorrow)) {
      return 'Ngày mai, ' + dm;
    }
    return dm + '/' + date.getFullYear();
  }

  /* ------------------------------------------------------------------------ */
  /* Static mock rows (replace with API when ready)                           */
  /* ------------------------------------------------------------------------ */

  function buildScheduleMatchRowHtml() {
    return (
      '<div class="framer-w4nh6l">' +
      '<div class="framer-10q8rqr" data-framer-name="Live Match Header">' +
      '<div class="ssr-variant"><div class="framer-1u3bdzr-container">' +
      '<div class="framer-iz7ZB framer-3i8edo framer-v-3i8edo ls-ltd-s48 luongson-match-status" data-framer-name="Tất cả" data-highlight="true">' +
      '<div class="framer-9wekp1 ls-ltd-s49"></div>' +
      '<div class="framer-oy32wj ls-ltd-s50" data-framer-component-type="RichTextContainer">' +
      '<p class="framer-text ls-ltd-s51" dir="auto">Hiệp 2 - 72’</p></div></div></div></div>' +
      '<div class="framer-fo8uj4 ls-ltd-s8" data-framer-component-type="RichTextContainer">' +
      '<p class="framer-text ls-ltd-s52" dir="auto">' +
      '<a class="framer-text framer-styles-preset-1kr0omk" data-styles-preset="aObUTo9X9" href="#">AUS VIC Women\'s Premier League</a>' +
      '</p></div>' +
      '<div class="framer-1s265wr">' +
      '<div class="framer-ptrkjg ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s53" dir="auto">15:30</p></div>' +
      '<div class="framer-wjt7qo ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s52" dir="auto">15.08</p></div>' +
      '</div></div>' +
      '<div aria-hidden="true" class="framer-1fb9lh6 ls-ltd-s54" data-framer-component-type="SVG"></div>' +
      '<div class="framer-6y1vgx">' +
      '<div class="framer-f916c2" data-framer-name="Man City">' +
      '<div class="framer-lpvq2y ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s55" dir="auto">1</p></div>' +
      '<div class="framer-k4r736" data-framer-name="Man City Logo"><div class="ssr-variant"><div class="framer-4svd1w" data-framer-name="Image">' +
      '<div class="ls-ltd-s3" data-framer-background-image-wrapper="true">' +
      '<img alt="" class="ls-ltd-s4" decoding="async" height="325" src="' +
      img('f6O1RC012JUvScTVjvuSVD2fa8g_f64310a4.png') +
      '" width="306" /></div></div></div></div>' +
      '<div class="framer-12jd5dg ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s56" dir="auto">Keilor Park Women</p></div>' +
      '<div class="framer-1qcymno" data-framer-name="Live Score">' +
      '<div class="framer-1n2kznj">' +
      '<svg class="framer-bSUln framer-lwakex" role="presentation" viewBox="0 0 24 24"><path d="M5 21V4m0 0l13 4.5L5 13V4z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" /></svg>' +
      '<div class="ssr-variant"><div class="framer-1vimra6 ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s57" dir="auto">6</p></div></div></div>' +
      '<div class="framer-1l567ap"><div aria-hidden="true" class="framer-16c3b9w ls-ltd-s58" data-framer-component-type="SVG"></div>' +
      '<div class="framer-jj8xat ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s57" dir="auto">2</p></div></div>' +
      '<div class="framer-1gv02xo"><div aria-hidden="true" class="framer-1naohdo ls-ltd-s65" data-framer-component-type="SVG"></div>' +
      '<div class="framer-10qz6z5 ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s57" dir="auto">1</p></div></div>' +
      '</div></div>' +
      '<div class="framer-14yunt6" data-framer-name="Liverpool">' +
      '<div class="framer-pvvwao ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s55" dir="auto">0</p></div>' +
      '<div class="framer-rnop1x" data-framer-name="Liverpool Logo"><div class="ssr-variant"><div class="framer-14v5o2a" data-framer-name="Wolverhampton Wanderers">' +
      '<div class="ls-ltd-s3" data-framer-background-image-wrapper="true">' +
      '<img alt="" class="ls-ltd-s4" decoding="async" height="204" src="' +
      img('FIczztJVnGEBQ3TM8WvjBhtLM_b12db86a.png') +
      '" width="186" /></div></div></div></div>' +
      '<div class="framer-167qswu ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s56" dir="auto">Heidelberg United Women</p></div>' +
      '<div class="framer-1nt9csj" data-framer-name="Live Score">' +
      '<div class="framer-1er19rb">' +
      '<svg class="framer-bSUln framer-bgyb85" role="presentation" viewBox="0 0 24 24"><path d="M5 21V4m0 0l13 4.5L5 13V4z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" /></svg>' +
      '<div class="framer-1dcwg5u ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s57" dir="auto">8</p></div></div>' +
      '<div class="framer-nkqsx9"><div aria-hidden="true" class="framer-1ctyskl ls-ltd-s58" data-framer-component-type="SVG"></div>' +
      '<div class="framer-1qkfb9p ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s57" dir="auto">3</p></div></div>' +
      '</div></div></div>' +
      '<div class="framer-1rwoktm">' +
      '<div class="framer-kvg3eg" data-framer-name="Live Score">' +
      '<div class="framer-1fj6fv7">' +
      '<div class="framer-45zk6d ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s59" dir="auto">HT</p></div>' +
      '<div class="framer-7rm2ei ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s59" dir="auto">0.95</p></div>' +
      '<div class="framer-16mpmbs ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s62" dir="auto">0.25</p></div>' +
      '<div class="framer-1nam7at ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s59" dir="auto">0.85</p></div></div>' +
      '<div class="framer-11m1cm9">' +
      '<div class="framer-lgis4k ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s59" dir="auto">FT</p></div>' +
      '<div class="framer-5l2cc9 ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s60" dir="auto">0.97</p></div>' +
      '<div class="framer-vvlwst ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s62" dir="auto">0.25</p></div>' +
      '<div class="framer-1yur8au ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s61" dir="auto">0.83</p></div></div></div>' +
      '<div class="framer-1fh56dl" data-framer-name="Live Score">' +
      '<div class="framer-hewvbf">' +
      '<div class="framer-7ilrx5 ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s59" dir="auto">HT</p></div>' +
      '<div class="framer-g7imbk ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s60" dir="auto">0.96</p></div>' +
      '<div class="framer-1nuh4c9 ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s62" dir="auto">0.25</p></div>' +
      '<div class="framer-h0x5kk ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s59" dir="auto">0.85</p></div></div>' +
      '<div class="framer-130lxau">' +
      '<div class="framer-ya78b ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s59" dir="auto">FT</p></div>' +
      '<div class="framer-rbcqob ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s60" dir="auto">0.97</p></div>' +
      '<div class="framer-1xvm2dx ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s62" dir="auto">0.25</p></div>' +
      '<div class="framer-xs9xlf ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s61" dir="auto">0.83</p></div></div></div></div>' +
      '<div class="framer-9iptzt">' +
      '<div class="framer-1k1h91o" data-border="true" data-framer-name="Bet button">' +
      '<div class="ssr-variant"><div class="framer-lrcy3t" data-framer-name="Image">' +
      '<div class="ls-ltd-s3" data-framer-background-image-wrapper="true">' +
      '<img alt="" class="ls-ltd-s4" decoding="async" height="150" src="' +
      img('TtSpXaqqwKEewlPr41OF4DTPA_802653d7.png') +
      '" width="300" /></div></div></div>' +
      '<div class="framer-uwn2lx ls-ltd-s63" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s64" dir="auto">cược</p></div></div>' +
      '<div class="framer-3xtg2y" data-border="true" data-framer-name="Bet button">' +
      '<div class="ssr-variant"><div class="framer-1b7t7uc ls-ltd-s63" data-framer-name="Logo Vic88">' +
      '<div class="ls-ltd-s3" data-framer-background-image-wrapper="true">' +
      '<img alt="" class="ls-ltd-s4" decoding="async" height="68" src="' +
      img('KB717wZbU63tSAHyTm9pLUqxM_b79bb177.png') +
      '" width="280" /></div></div></div>' +
      '<div class="framer-iwh02n ls-ltd-s63" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s64" dir="auto">cược</p></div></div></div></div>'
    );
  }

  function renderStaticMockRows(root) {
    if (!root || root.dataset.staticRendered) return;
    root.dataset.staticRendered = '1';

    var rowHtml = buildScheduleMatchRowHtml();
    var i;
    for (i = 0; i < 5; i++) {
      root.insertAdjacentHTML('beforeend', rowHtml);
    }
  }

  function initSchedule(root) {
    if (!root || root.__lsScheduleInit) return;
    root.__lsScheduleInit = true;

    var label = root.querySelector('.luongson-schedule__date-label');
    var prev = root.querySelector('[data-framer-name="Previous Day"]');
    var next = root.querySelector('[data-framer-name="Next Day"]');
    if (!label || !prev || !next) return;

    var current = new Date();
    current.setHours(0, 0, 0, 0);

    function render() {
      label.textContent = formatLabel(current);
    }

    prev.addEventListener('click', function (e) {
      e.preventDefault();
      current.setDate(current.getDate() - 1);
      render();
    });

    next.addEventListener('click', function (e) {
      e.preventDefault();
      current.setDate(current.getDate() + 1);
      render();
    });

    render();
  }

  /* ------------------------------------------------------------------------ */
  /* Match status modal (hover on live badge — same as list-matches / HTML)   */
  /* ------------------------------------------------------------------------ */

  function initMatchModal(root) {
    if (!root || root.__lsScheduleModalInit) return;
    root.__lsScheduleModalInit = true;

    var portal = document.querySelector('.luongson-match-modal-portal');
    if (!portal) {
      portal = document.createElement('div');
      portal.className = 'luongson-match-modal-portal';
      portal.hidden = true;
      portal.style.cssText =
        'display:none;opacity:0;transform:scale(.96);transform-origin:top center;transition:opacity .15s ease,transform .15s cubic-bezier(.2,0,.2,1);';
      portal.innerHTML =
        '<div class="luongson-match-modal-portal__panel" role="dialog">' +
        '<div class="luongson-match-modal-tabs">' +
        tabHtml('all', 'Tất cả', true) +
        tabHtml('h1', 'Hiệp 1', false) +
        tabHtml('h2', 'Hiệp 2', false) +
        '</div>' +
        rowHtml('possession', 'TL kiểm soát bóng', '57%', '43%', 57, 43) +
        rowHtml(null, 'Phạt góc', '4', '1', 80, 20) +
        rowHtml(null, 'Thẻ vàng', '2', '0', 100, 0) +
        rowHtml(null, 'Sút bóng', '7', '3', 70, 30) +
        rowHtml(null, 'Sút cầu môn', '4', '1', 80, 20) +
        rowHtml(null, 'Sút ngoài cầu môn', '3', '2', 60, 40) +
        rowHtml(null, 'Tấn công', '19', '17', 53, 47) +
        rowHtml(null, 'Tấn công nguy hiểm', '23', '8', 74, 26) +
        '</div>';
      document.body.appendChild(portal);
    }

    function tabHtml(id, label, active) {
      return (
        '<button type="button" class="luongson-match-modal-tab' +
        (active ? ' is-active' : '') +
        '" data-tab="' +
        id +
        '" data-border="true">' +
        label +
        '</button>'
      );
    }

    function rowHtml(key, label, left, right, leftPct, rightPct) {
      var leftCls = key ? 'stat-val-left-' + key + ' is-val' : 'is-val';
      var rightCls = key ? 'stat-val-right-' + key + ' is-val' : 'is-val';
      var leftBarCls = key ? 'stat-bar-left-' + key : '';
      var rightBarCls = key ? 'stat-bar-right-' + key : '';
      return (
        '<div class="luongson-match-modal-row">' +
        '<div class="luongson-match-modal-row__labels">' +
        '<span class="' +
        leftCls +
        '">' +
        left +
        '</span>' +
        '<span class="is-label">' +
        label +
        '</span>' +
        '<span class="' +
        rightCls +
        '">' +
        right +
        '</span>' +
        '</div>' +
        '<div class="luongson-match-modal-bars">' +
        '<div class="luongson-match-modal-bar is-home"><span class="' +
        leftBarCls +
        '" style="width:' +
        leftPct +
        '%"></span></div>' +
        '<div class="luongson-match-modal-bar is-away"><span class="' +
        rightBarCls +
        '" style="width:' +
        rightPct +
        '%"></span></div>' +
        '</div></div>'
      );
    }

    var leftText = portal.querySelector('.stat-val-left-possession');
    var rightText = portal.querySelector('.stat-val-right-possession');
    var leftBar = portal.querySelector('.stat-bar-left-possession');
    var rightBar = portal.querySelector('.stat-bar-right-possession');
    var tabs = portal.querySelectorAll('.luongson-match-modal-tab');
    var tabData = {
      all: { leftText: '57%', rightText: '43%', leftWidth: '57%', rightWidth: '43%' },
      h1: { leftText: '70%', rightText: '30%', leftWidth: '70%', rightWidth: '30%' },
      h2: { leftText: '45%', rightText: '55%', leftWidth: '45%', rightWidth: '55%' },
    };

    function setTab(name) {
      tabs.forEach(function (t) {
        t.classList.toggle('is-active', t.getAttribute('data-tab') === name);
      });
      var data = tabData[name] || tabData.all;
      if (leftText) leftText.textContent = data.leftText;
      if (rightText) rightText.textContent = data.rightText;
      if (leftBar) leftBar.style.width = data.leftWidth;
      if (rightBar) rightBar.style.width = data.rightWidth;
    }

    if (!portal.__lsTabsBound) {
      portal.__lsTabsBound = true;
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function (e) {
          e.stopPropagation();
          setTab(tab.getAttribute('data-tab'));
        });
      });
    }

    var currentTrigger = null;
    var closeTimeout = null;

    function showPopover(trigger) {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
      currentTrigger = trigger;
      portal.hidden = false;
      portal.style.display = 'block';

      var rect = trigger.getBoundingClientRect();
      var modalWidth = Math.min(384, window.innerWidth - 24);
      var modalHeight = portal.offsetHeight || 440;
      var left = rect.left + rect.width / 2 - modalWidth / 2;
      if (left < 10) left = 10;
      if (left + modalWidth > window.innerWidth - 10) {
        left = window.innerWidth - modalWidth - 10;
      }

      var top = rect.bottom + 4;
      if (top + modalHeight > window.innerHeight - 10 && rect.top - modalHeight - 4 > 0) {
        top = rect.top - modalHeight - 4;
      }

      portal.style.left = left + 'px';
      portal.style.top = top + 'px';

      requestAnimationFrame(function () {
        portal.style.opacity = '1';
        portal.style.transform = 'scale(1)';
      });
    }

    function hidePopover() {
      if (closeTimeout) clearTimeout(closeTimeout);
      closeTimeout = setTimeout(function () {
        portal.style.opacity = '0';
        portal.style.transform = 'scale(0.96)';
        setTimeout(function () {
          if (portal.style.opacity === '0') {
            portal.style.display = 'none';
            portal.hidden = true;
            currentTrigger = null;
          }
        }, 150);
      }, 120);
    }

    if (!portal.__lsHoverBound) {
      portal.__lsHoverBound = true;
      portal.addEventListener('mouseenter', function () {
        if (closeTimeout) {
          clearTimeout(closeTimeout);
          closeTimeout = null;
        }
      });
      portal.addEventListener('mouseleave', hidePopover);
    }

    root.querySelectorAll('.luongson-match-status, .framer-iz7ZB.framer-3i8edo').forEach(function (badge) {
      if (badge.__lsBound) return;
      badge.__lsBound = true;
      badge.addEventListener('mouseenter', function () {
        showPopover(badge);
      });
      badge.addEventListener('mouseleave', hidePopover);
    });

    window.addEventListener(
      'scroll',
      function () {
        if (portal.style.display === 'none' || !currentTrigger) return;
        var rect = currentTrigger.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          portal.style.display = 'none';
          portal.style.opacity = '0';
          currentTrigger = null;
        } else {
          showPopover(currentTrigger);
        }
      },
      { passive: true }
    );

    window.addEventListener('resize', function () {
      if (portal.style.display !== 'none' && currentTrigger) showPopover(currentTrigger);
    });
  }

  function initAll() {
    document.querySelectorAll('.luongson-schedule').forEach(function (root) {
      renderStaticMockRows(root);
      initSchedule(root);
      initMatchModal(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
