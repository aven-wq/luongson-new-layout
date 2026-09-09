/**
 * LuongSon V2 — Shared match statistics hover modal
 */
(function () {
  'use strict';

  // Keys align with upstream match detail: stats.ft / stats.h1 (array [home, away]).
  var STAT_ROWS = [
    { key: 'ballPossession', label: 'TL kiểm soát bóng', isPercent: true, aliases: ['possession'] },
    { key: 'attacks', label: 'Tấn công' },
    { key: 'dangerousAttack', label: 'Tấn công nguy hiểm' },
    { key: 'corner', label: 'Phạt góc' },
    { key: 'yellowCard', label: 'Thẻ vàng' },
    { key: 'redCard', label: 'Thẻ đỏ' },
    { key: 'shots', label: 'Sút bóng' },
    { key: 'shotsOnTarget', label: 'Sút cầu môn' },
    { key: 'shotsOffTarget', label: 'Sút ngoài cầu môn' },
    { key: 'blockedShots', label: 'Sút bị chặn' },
  ];

  var portal = null;
  var bodyEl = null;
  var tabs = null;
  var currentTrigger = null;
  var currentStats = null;
  var activeTab = 'ft';
  var closeTimeout = null;
  var globalListenersBound = false;

  function toNumber(value) {
    var num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  /** Resolve a period stat: [home, away] | {home,away} | legacy object */
  function getStatPair(stat) {
    if (stat == null) return { home: 0, away: 0 };

    if (Array.isArray(stat)) {
      return { home: toNumber(stat[0]), away: toNumber(stat[1]) };
    }

    if (typeof stat === 'object') {
      return {
        home: toNumber(stat.home != null ? stat.home : stat[0]),
        away: toNumber(stat.away != null ? stat.away : stat[1]),
      };
    }

    return { home: 0, away: 0 };
  }

  function getRowStat(tabStats, row) {
    if (!tabStats || !row) return null;
    if (tabStats[row.key] != null) return tabStats[row.key];

    var aliases = row.aliases || [];
    var i;
    for (i = 0; i < aliases.length; i++) {
      if (tabStats[aliases[i]] != null) return tabStats[aliases[i]];
    }
    return null;
  }

  function formatValue(value, isPercent) {
    return isPercent ? String(toNumber(value)) + '%' : String(toNumber(value));
  }

  function calcBarPct(home, away, isPercent) {
    if (isPercent) {
      return {
        left: Math.max(0, Math.min(100, toNumber(home))),
        right: Math.max(0, Math.min(100, toNumber(away))),
      };
    }

    var total = toNumber(home) + toNumber(away);
    if (total <= 0) return { left: 50, right: 50 };

    return {
      left: Math.round((toNumber(home) / total) * 100),
      right: Math.round((toNumber(away) / total) * 100),
    };
  }

  /**
   * Upstream: stats.ft (toàn trận) + stats.h1 (hiệp 1).
   * Legacy: stats.all / stats.h2 still supported if present.
   */
  function getStatsForTab(stats, tab) {
    if (!stats || typeof stats !== 'object') return {};

    if (tab === 'h1' && stats.h1) return stats.h1;
    if (tab === 'h2' && stats.h2) return stats.h2;
    if ((tab === 'ft' || tab === 'all') && (stats.ft || stats.all)) {
      return stats.ft || stats.all;
    }

    // Flat legacy payload (no period keys) — treat as full match.
    if (!stats.ft && !stats.h1 && !stats.h2 && !stats.all) return stats;

    return {};
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
    return (
      '<div class="luongson-match-modal-row" data-stat="' +
      key +
      '">' +
      '<div class="luongson-match-modal-row__labels">' +
      '<span class="is-val is-home">' +
      left +
      '</span>' +
      '<span class="is-label">' +
      label +
      '</span>' +
      '<span class="is-val is-away">' +
      right +
      '</span>' +
      '</div>' +
      '<div class="luongson-match-modal-bars">' +
      '<div class="luongson-match-modal-bar is-home"><span style="width:' +
      leftPct +
      '%"></span></div>' +
      '<div class="luongson-match-modal-bar is-away"><span style="width:' +
      rightPct +
      '%"></span></div>' +
      '</div></div>'
    );
  }

  function renderRows(stats) {
    var tabStats = getStatsForTab(stats, activeTab);
    var html = '';

    STAT_ROWS.forEach(function (row) {
      var pair = getStatPair(getRowStat(tabStats, row));
      var bars = calcBarPct(pair.home, pair.away, row.isPercent);

      html += rowHtml(
        row.key,
        row.label,
        formatValue(pair.home, row.isPercent),
        formatValue(pair.away, row.isPercent),
        bars.left,
        bars.right
      );
    });

    return html;
  }

  function ensurePortal() {
    if (portal) return portal;

    portal = document.createElement('div');
    portal.className = 'luongson-match-modal-portal';
    portal.hidden = true;
    portal.style.cssText =
      'display:none;opacity:0;transform:scale(.96);transform-origin:top center;transition:opacity .15s ease,transform .15s cubic-bezier(.2,0,.2,1);';
    portal.innerHTML =
      '<div class="luongson-match-modal-portal__panel" role="dialog" aria-label="Thống kê trận đấu">' +
      '<div class="luongson-match-modal-tabs">' +
      tabHtml('ft', 'Toàn trận', true) +
      tabHtml('h1', 'Hiệp 1', false) +
      '</div>' +
      '<div class="luongson-match-modal-body"></div>' +
      '</div>';
    document.body.appendChild(portal);

    bodyEl = portal.querySelector('.luongson-match-modal-body');
    tabs = portal.querySelectorAll('.luongson-match-modal-tab');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function (e) {
        e.stopPropagation();
        setActiveTab(tab.getAttribute('data-tab') || 'ft');
      });
    });

    portal.addEventListener('mouseenter', function () {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    });
    portal.addEventListener('mouseleave', hidePopover);

    bindGlobalListeners();
    return portal;
  }

  function setActiveTab(name) {
    activeTab = name === 'all' ? 'ft' : name || 'ft';
    tabs.forEach(function (tab) {
      tab.classList.toggle('is-active', tab.getAttribute('data-tab') === activeTab);
    });
    if (bodyEl) bodyEl.innerHTML = renderRows(currentStats);
    if (currentTrigger && portal && portal.style.display !== 'none') {
      showPopover(currentTrigger);
    }
  }

  function updatePanel(stats) {
    ensurePortal();
    currentStats = stats || {};
    if (bodyEl) bodyEl.innerHTML = renderRows(currentStats);
  }

  function showPopover(trigger) {
    if (!trigger) return;

    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }

    currentTrigger = trigger;
    ensurePortal();
    portal.hidden = false;
    portal.style.display = 'block';

    var rect = trigger.getBoundingClientRect();
    var modalWidth = Math.min(384, window.innerWidth - 24);
    portal.style.width = modalWidth + 'px';
    portal.style.maxWidth = 'calc(100vw - 24px)';
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
    if (!portal) return;

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

  function bindGlobalListeners() {
    if (globalListenersBound) return;
    globalListenersBound = true;

    window.addEventListener(
      'scroll',
      function () {
        if (!portal || portal.style.display === 'none' || !currentTrigger) return;
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
      if (portal && portal.style.display !== 'none' && currentTrigger) {
        showPopover(currentTrigger);
      }
    });
  }

  function bindTriggers(root, selector, getStats) {
    if (!root || !selector) return;

    ensurePortal();

    root.querySelectorAll(selector).forEach(function (trigger) {
      if (trigger.__lsStatsBound) return;
      trigger.__lsStatsBound = true;

      trigger.addEventListener('mouseenter', function () {
        var stats = typeof getStats === 'function' ? getStats(trigger) : null;
        updatePanel(stats);
        showPopover(trigger);
      });
      trigger.addEventListener('mouseleave', hidePopover);
    });
  }

  function setCardStats(cardEl, stats) {
    if (cardEl) cardEl.__lsMatchStats = stats || null;
  }

  window.LuongsonMatchStatsModal = {
    STAT_ROWS: STAT_ROWS,
    ensurePortal: ensurePortal,
    updatePanel: updatePanel,
    showPopover: showPopover,
    hidePopover: hidePopover,
    bindTriggers: bindTriggers,
    setCardStats: setCardStats,
    getStatsForTab: getStatsForTab,
    renderRows: renderRows,
  };
})();

/**
 * LuongSon V2 — Fallback ảnh mặc định khi load lỗi
 */
(function () {
  'use strict';

  var DEFAULT_IMG = null;
  var initialized = false;

  function getPluginUrl() {
    var pluginUrl =
      (typeof window.DV2_STREAMING_PLUGIN_URL !== 'undefined' && window.DV2_STREAMING_PLUGIN_URL) ||
      (window.dv2Streaming && window.dv2Streaming.pluginUrl) ||
      '';

    if (pluginUrl && pluginUrl.slice(-1) !== '/') {
      pluginUrl += '/';
    }

    return pluginUrl;
  }

  function getDefaultImgUrl() {
    if (DEFAULT_IMG) return DEFAULT_IMG;

    var pluginUrl = getPluginUrl();
    DEFAULT_IMG = pluginUrl
      ? pluginUrl + 'assets/images/default-img.png'
      : '../../assets/images/default-img.png';

    return DEFAULT_IMG;
  }

  function isDefaultImg(src) {
    return !src || src.indexOf('default-img.png') !== -1;
  }

  function applyFallback(img) {
    if (!img || img.tagName !== 'IMG' || img.dataset.lsImgFallback === '1') return;

    var fallback = getDefaultImgUrl();
    var currentSrc = img.getAttribute('src') || img.currentSrc || img.src || '';

    if (isDefaultImg(currentSrc) || currentSrc === fallback) return;

    img.dataset.lsImgFallback = '1';
    img.src = fallback;
  }

  function handleImgError(e) {
    applyFallback(e.target);
  }

  function patchBrokenImages(root) {
    var scope = root || document;
    scope.querySelectorAll('img').forEach(function (img) {
      if (img.complete && img.naturalWidth === 0 && (img.getAttribute('src') || img.src)) {
        applyFallback(img);
      }
    });
  }

  function init(root) {
    if (!initialized) {
      initialized = true;
      document.addEventListener('error', handleImgError, true);
    }

    patchBrokenImages(root);
  }

  window.LuongsonImageFallback = {
    getDefaultImgUrl: getDefaultImgUrl,
    applyFallback: applyFallback,
    init: init,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else {
    init();
  }
})();
