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

    var modal = window.LuongsonMatchStatsModal;
    if (!modal) return;

    modal.bindTriggers(root, '.luongson-match-status, .framer-iz7ZB.framer-3i8edo', function (trigger) {
      var card = trigger.closest('[data-match-id], .luongson-match-card, .framer-1x0sw3m');
      return card && card.__lsMatchStats ? card.__lsMatchStats : null;
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
