/**
 * LuongSon V2 — Shared match statistics hover modal (jQuery)
 */
(function ($) {
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

  var $portal = null;
  var $bodyEl = null;
  var $tabs = null;
  var currentTrigger = null;
  var currentStats = null;
  var activeTab = 'ft';
  var closeTimeout = null;
  var hideAnimTimeout = null;
  var hideGeneration = 0;
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

    $.each(STAT_ROWS, function (_, row) {
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
    if ($portal && $portal.length) return $portal;

    $portal = $('<div>', {
      class: 'luongson-match-modal-portal',
      hidden: true,
    }).css({
      display: 'none',
      opacity: 0,
      transform: 'scale(.96)',
      'transform-origin': 'top center',
      transition: 'opacity .15s ease,transform .15s cubic-bezier(.2,0,.2,1)',
      'pointer-events': 'none',
    });

    $portal.html(
      '<div class="luongson-match-modal-portal__panel" role="dialog" aria-label="Thống kê trận đấu">' +
        '<div class="luongson-match-modal-tabs">' +
        tabHtml('ft', 'Toàn trận', true) +
        tabHtml('h1', 'Hiệp 1', false) +
        '</div>' +
        '<div class="luongson-match-modal-body"></div>' +
        '</div>'
    );
    $('body').append($portal);

    $bodyEl = $portal.find('.luongson-match-modal-body');
    $tabs = $portal.find('.luongson-match-modal-tab');

    $tabs.on('click', function (e) {
      e.stopPropagation();
      setActiveTab($(this).attr('data-tab') || 'ft');
    });

    $portal.on('mouseenter', function () {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    });
    $portal.on('mouseleave', hidePopover);

    bindGlobalListeners();
    return $portal;
  }

  function setActiveTab(name) {
    activeTab = name === 'all' ? 'ft' : name || 'ft';
    $tabs.each(function () {
      $(this).toggleClass('is-active', $(this).attr('data-tab') === activeTab);
    });
    if ($bodyEl && $bodyEl.length) $bodyEl.html(renderRows(currentStats));
    if (currentTrigger && $portal && $portal.css('display') !== 'none') {
      showPopover(currentTrigger);
    }
  }

  function updatePanel(stats) {
    ensurePortal();
    currentStats = stats || {};
    if ($bodyEl && $bodyEl.length) $bodyEl.html(renderRows(currentStats));
  }

  function cancelHideTimers() {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }
    if (hideAnimTimeout) {
      clearTimeout(hideAnimTimeout);
      hideAnimTimeout = null;
    }
    hideGeneration += 1;
  }

  function forceHidePortal() {
    if (!$portal || !$portal.length) return;
    cancelHideTimers();
    // Drop hit-testing immediately so an invisible portal cannot cover
    // league links (framer-styles-preset-1kr0omk) under the live badge.
    $portal
      .attr('hidden', 'hidden')
      .css({
        display: 'none',
        opacity: 0,
        transform: 'scale(0.96)',
        'pointer-events': 'none',
      });
    currentTrigger = null;
  }

  function showPopover(trigger) {
    if (!trigger) return;

    cancelHideTimers();

    currentTrigger = trigger;
    ensurePortal();
    $portal.removeAttr('hidden').css({
      display: 'block',
      'pointer-events': 'auto',
    });

    var rect = trigger.getBoundingClientRect();
    var modalWidth = Math.min(384, $(window).width() - 24);
    $portal.css({
      width: modalWidth + 'px',
      maxWidth: 'calc(100vw - 24px)',
    });
    var modalHeight = $portal.outerHeight() || 440;
    var left = rect.left + rect.width / 2 - modalWidth / 2;
    if (left < 10) left = 10;
    if (left + modalWidth > $(window).width() - 10) {
      left = $(window).width() - modalWidth - 10;
    }

    var top = rect.bottom + 4;
    if (top + modalHeight > $(window).height() - 10 && rect.top - modalHeight - 4 > 0) {
      top = rect.top - modalHeight - 4;
    }

    $portal.css({ left: left + 'px', top: top + 'px' });

    requestAnimationFrame(function () {
      $portal.css({ opacity: 1, transform: 'scale(1)' });
    });
  }

  function hidePopover() {
    if (!$portal || !$portal.length) return;

    cancelHideTimers();
    var generation = hideGeneration;
    closeTimeout = setTimeout(function () {
      closeTimeout = null;
      if (generation !== hideGeneration) return;
      // Disable clicks while fading out — portal sits over the match header.
      $portal.css({
        opacity: 0,
        transform: 'scale(0.96)',
        'pointer-events': 'none',
      });
      hideAnimTimeout = setTimeout(function () {
        hideAnimTimeout = null;
        if (generation !== hideGeneration) return;
        forceHidePortal();
      }, 150);
    }, 120);
  }

  function bindGlobalListeners() {
    if (globalListenersBound) return;
    globalListenersBound = true;

    $(window).on('scroll.lsMatchModal', function () {
      if (!$portal || $portal.css('display') === 'none' || !currentTrigger) return;
      var rect = currentTrigger.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > $(window).height()) {
        forceHidePortal();
      } else {
        showPopover(currentTrigger);
      }
    });

    $(window).on('resize.lsMatchModal', function () {
      if ($portal && $portal.css('display') !== 'none' && currentTrigger) {
        showPopover(currentTrigger);
      }
    });
  }

  function bindTriggers(root, selector, getStats) {
    if (!root || !selector) return;

    ensurePortal();

    $(root)
      .find(selector)
      .each(function () {
        var $trigger = $(this);
        if ($trigger.data('lsStatsBound')) return;
        $trigger.data('lsStatsBound', true);

        $trigger.on('mouseenter', function () {
          var el = this;
          var stats = typeof getStats === 'function' ? getStats(el) : null;
          updatePanel(stats);
          showPopover(el);
        });
        $trigger.on('mouseleave', hidePopover);
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
    forceHidePortal: forceHidePortal,
    bindTriggers: bindTriggers,
    setCardStats: setCardStats,
    getStatsForTab: getStatsForTab,
    renderRows: renderRows,
  };
})(jQuery);

/**
 * LuongSon V2 — Fallback ảnh mặc định khi load lỗi (jQuery)
 */
(function ($) {
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
    if (!img || img.tagName !== 'IMG' || $(img).data('lsImgFallback') === '1') return;

    var fallback = getDefaultImgUrl();
    var $img = $(img);
    var currentSrc = $img.attr('src') || img.currentSrc || img.src || '';

    if (isDefaultImg(currentSrc) || currentSrc === fallback) return;

    $img.data('lsImgFallback', '1').attr('src', fallback);
  }

  function handleImgError(e) {
    applyFallback(e.target);
  }

  function patchBrokenImages(root) {
    var $scope = root ? $(root) : $(document);
    $scope.find('img').each(function () {
      var img = this;
      if (img.complete && img.naturalWidth === 0 && ($(img).attr('src') || img.src)) {
        applyFallback(img);
      }
    });
  }

  function init(root) {
    if (!initialized) {
      initialized = true;
      // Capture phase needed so broken <img> error reaches document before bubble stop.
      document.addEventListener('error', handleImgError, true);
    }

    patchBrokenImages(root);
  }

  window.LuongsonImageFallback = {
    getDefaultImgUrl: getDefaultImgUrl,
    applyFallback: applyFallback,
    init: init,
  };

  $(function () {
    init();
  });
})(jQuery);
