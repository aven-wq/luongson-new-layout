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

/**
 * LuongSon V2 — Featured ads bar (shared ticker + HTML partial mounts)
 */
(function ($) {
  'use strict';

  var PARTIAL_DEFAULT = 'partials/featured-ads-bar.html';
  var readyDeferred = $.Deferred();

  function createFeaturedAdsTicker(container) {
    var $container = $(container);
    var $track = $container.find('ul').first();
    if (!$track.length || $track.data('lsFeaturedAdsTickerInit')) return;
    $track.data('lsFeaturedAdsTickerInit', true);

    var $originalChildren = $track.children().filter(function () {
      return !$(this).hasClass('clone-item') && $(this).attr('aria-hidden') !== 'true';
    });

    if (!$originalChildren.length) return;

    $track.children().each(function () {
      var $child = $(this);
      if ($child.hasClass('clone-item') || $child.attr('aria-hidden') === 'true') {
        $child.remove();
      }
    });

    $originalChildren.each(function () {
      $(this).addClass('ticker-item');
    });

    var speed = 38;
    var direction = -1;
    var singleSetWidth = 0;
    var currentX = 0;
    var isHovered = false;
    var isDragging = false;
    var startX = 0;
    var dragStartX = 0;
    var dragDistance = 0;
    var lastTimestamp = null;
    var rafId = null;
    var ns = '.lsFeaturedAdsTicker' + String(Math.random()).slice(2, 8);

    function buildClones() {
      $track.find('.clone-item').remove();

      if (!$originalChildren.length) return;

      var containerWidth = $container.outerWidth() || $(window).width();
      var computedStyle = window.getComputedStyle($track.get(0));
      var gap = parseFloat(computedStyle.gap) || parseFloat(computedStyle.columnGap) || 12;

      var firstChild = $originalChildren.get(0);
      var lastChild = $originalChildren.get($originalChildren.length - 1);
      var firstRect = firstChild.getBoundingClientRect();
      var lastRect = lastChild.getBoundingClientRect();

      if (firstRect.width > 0 && lastRect.right - firstRect.left > 0) {
        singleSetWidth = lastRect.right - firstRect.left + gap;
      } else {
        singleSetWidth = lastChild.offsetLeft + lastChild.offsetWidth - firstChild.offsetLeft + gap;
      }

      if (singleSetWidth <= 0 || isNaN(singleSetWidth)) {
        singleSetWidth = $originalChildren.toArray().reduce(function (acc, el) {
          return acc + (el.offsetWidth || 80) + gap;
        }, 0);
      }

      if (singleSetWidth <= 0) return;

      var neededCopies = Math.max(2, Math.ceil((containerWidth * 2) / singleSetWidth) + 1);
      var i;

      for (i = 0; i < neededCopies; i++) {
        $originalChildren.each(function () {
          var $clone = $(this).clone().addClass('clone-item').attr('aria-hidden', 'true');
          $track.append($clone);
        });
      }
    }

    function animate(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      var dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;

      if (!isHovered && !isDragging && singleSetWidth > 0) {
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
        $track.get(0).style.setProperty('transform', 'translate3d(' + currentX + 'px, 0, 0)', 'important');
      }

      rafId = requestAnimationFrame(animate);
    }

    $container.on('mouseenter', function () {
      isHovered = true;
    });
    $container.on('mouseleave', function () {
      isHovered = false;
      lastTimestamp = null;
    });

    function pointerClientX(e) {
      var oe = e.originalEvent || e;
      if (oe.touches && oe.touches.length) return oe.touches[0].clientX;
      if (oe.changedTouches && oe.changedTouches.length) return oe.changedTouches[0].clientX;
      return e.clientX;
    }

    function onPointerDown(e) {
      isDragging = true;
      dragDistance = 0;
      startX = pointerClientX(e);
      dragStartX = currentX;
      $track.css('cursor', 'grabbing');
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      var clientX = pointerClientX(e);
      var dx = clientX - startX;
      dragDistance = Math.abs(dx);
      currentX = dragStartX + dx;

      if (singleSetWidth > 0) {
        while (currentX <= -singleSetWidth) currentX += singleSetWidth;
        while (currentX > 0) currentX -= singleSetWidth;
      }

      $track.get(0).style.setProperty('transform', 'translate3d(' + currentX + 'px, 0, 0)', 'important');
      var oe = e.originalEvent || e;
      if (oe.cancelable && String(e.type || '').indexOf('touch') === 0) {
        e.preventDefault();
      }
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      $track.css('cursor', '');
      lastTimestamp = null;
    }

    var trackEl = $track.get(0);

    $track.on('mousedown', onPointerDown);
    $(window).on('mousemove' + ns, onPointerMove);
    $(window).on('mouseup' + ns, onPointerUp);

    trackEl.addEventListener('touchstart', function (e) {
      onPointerDown($.event.fix(e));
    }, { passive: true });
    trackEl.addEventListener('touchmove', function (e) {
      onPointerMove($.event.fix(e));
    }, { passive: false });
    trackEl.addEventListener('touchend', function (e) {
      onPointerUp($.event.fix(e));
    });

    trackEl.addEventListener(
      'click',
      function (e) {
        if (dragDistance > 6) {
          e.preventDefault();
          e.stopPropagation();
        }
        dragDistance = 0;
      },
      true
    );

    var resizeTimer = null;
    $(window).on('resize' + ns, function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildClones();
        lastTimestamp = null;
      }, 150);
    });

    $(document).on('visibilitychange' + ns, function () {
      if (document.hidden) {
        lastTimestamp = null;
      }
    });

    buildClones();
    rafId = requestAnimationFrame(animate);

    return function destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      $(window).off(ns);
      $(document).off(ns);
    };
  }

  function initTickers(root) {
    var $root = root ? $(root) : $(document);
    $root
      .find('.luongson-featured-ads-ticker, .framer-cfqyq6')
      .addBack()
      .filter('.luongson-featured-ads-ticker, .framer-cfqyq6')
      .each(function () {
        createFeaturedAdsTicker(this);
      });
  }

  function fillPartial(html, opts) {
    opts = opts || {};
    var extra = opts.extraClass ? String(opts.extraClass) : '';
    var playId = opts.playCtaId ? String(opts.playCtaId) : '';
    return String(html || '')
      .replace(/__EXTRA_CLASS__/g, extra)
      .replace(/__PLAY_CTA_ID_ATTR__/g, playId ? 'id="' + playId.replace(/"/g, '') + '"' : '');
  }

  function mountPartials() {
    var mounts = document.querySelectorAll('[data-luongson-featured-ads-bar]');
    if (!mounts.length) {
      return $.Deferred().resolve().promise();
    }

    var url = mounts[0].getAttribute('data-luongson-featured-ads-bar') || PARTIAL_DEFAULT;
    return $.get(url)
      .then(function (html) {
        Array.prototype.forEach.call(mounts, function (el) {
          var filled = fillPartial(html, {
            extraClass: el.getAttribute('data-extra-class') || '',
            playCtaId: el.getAttribute('data-play-cta-id') || '',
          });
          el.outerHTML = filled;
        });
      })
      .fail(function () {
        console.warn('[LuongSon] Failed to load featured ads bar partial:', url);
      });
  }

  function whenReady(cb) {
    readyDeferred.done(cb);
  }

  // Resolve after DOM + optional partial mounts (pages wait before ticker/init).
  $(function () {
    mountPartials().always(function () {
      readyDeferred.resolve();
    });
  });

  window.LuongsonFeaturedAdsBar = {
    createTicker: createFeaturedAdsTicker,
    initTickers: initTickers,
    whenReady: whenReady,
    ready: readyDeferred.promise(),
  };
})(jQuery);
