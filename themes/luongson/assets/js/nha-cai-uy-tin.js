/**
 * LuongSon — Top Nhà Cái Uy Tín infinite ticker.
 */
(function () {
  'use strict';

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

  function initBookmakerClickTracking(container) {
    var ajaxUrl = typeof tfTrack !== 'undefined' && tfTrack.ajaxurl ? tfTrack.ajaxurl : '';
    if (!ajaxUrl) return;

    container.addEventListener('click', function (e) {
      var link = e.target.closest('.luongson-bookmaker-item-link');
      if (!link) return;

      var code = link.getAttribute('data-code') || '';
      var domain = '';

      try {
        domain = new URL(link.href).hostname;
      } catch (err) {
        domain = '';
      }

      var data = new URLSearchParams();
      data.append('action', 'tf_track_click');
      data.append('domain', domain);
      data.append('brand', code);
      data.append('target_url', link.href);

      fetch(ajaxUrl, { method: 'POST', body: data, keepalive: true });
    });
  }

  function initTopBookmakersTickerContainer(container) {
    var track = container.querySelector('.framer-czcwzc ul, ul');
    if (!track || track.__lsTickerInit) return true;

    Array.from(track.children).forEach(function (child) {
      if (child.classList.contains('clone-item') || child.getAttribute('aria-hidden') === 'true') {
        child.remove();
      }
    });

    var originals = Array.from(track.children).filter(function (child) {
      return !child.classList.contains('clone-item');
    });
    if (!originals.length) return false;

    var computed = window.getComputedStyle(track);
    var gap = parseFloat(computed.gap) || parseFloat(computed.columnGap) || 8;
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
    var speed = 36;
    var paused = false;
    var dragging = false;
    var startX = 0;
    var dragStart = 0;
    var dragDistance = 0;

    container.addEventListener('mouseenter', function () { paused = true; });
    container.addEventListener('mouseleave', function () { paused = false; });

    function onPointerStart(e) {
      dragging = true;
      paused = true;
      startX = e.touches ? e.touches[0].clientX : e.clientX;
      dragStart = offset;
      dragDistance = 0;
      track.style.cursor = 'grabbing';
    }

    function onPointerMove(e) {
      if (!dragging) return;
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var diff = clientX - startX;
      dragDistance += Math.abs(diff);
      offset = dragStart + diff;
      while (offset <= -singleWidth) offset += singleWidth;
      while (offset > 0) offset -= singleWidth;
      setTickerTransform(track, offset);
    }

    function onPointerEnd() {
      if (!dragging) return;
      dragging = false;
      paused = false;
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

    function tick(ts) {
      if (!tick.last) tick.last = ts;
      var dt = Math.min((ts - tick.last) / 1000, 0.1);
      tick.last = ts;

      if (!paused && !dragging) {
        offset -= speed * dt;
        if (offset <= -singleWidth) offset += singleWidth;
        setTickerTransform(track, offset);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    initBookmakerClickTracking(container);

    return true;
  }

  function getBookmakerContainers(root) {
    if (root && root.nodeType === 1) {
      if (root.matches('.luongson-top-bookmakers, .framer-1lnj4y4-container')) {
        return [root];
      }
      return Array.from(root.querySelectorAll('.luongson-top-bookmakers, .framer-1lnj4y4-container'));
    }

    return Array.from(document.querySelectorAll('.luongson-top-bookmakers, .framer-1lnj4y4-container'));
  }

  function initTopBookmakersTicker(root) {
    var containers = getBookmakerContainers(root);
    if (!containers.length) return;

    var attempts = 0;

    function boot() {
      var pending = false;
      var current = getBookmakerContainers(root);

      current.forEach(function (container) {
        var track = container.querySelector('.framer-czcwzc ul, ul');
        if (!track || track.__lsTickerInit) return;

        if (!initTopBookmakersTickerContainer(container)) {
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

  function observeDynamicBookmakers() {
    if (!window.MutationObserver || !document.body) return;

    var timer = null;

    function scheduleInit() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        initTopBookmakersTicker();
      }, 50);
    }

    function nodeHasBookmakers(node) {
      if (!node || node.nodeType !== 1) return false;
      if (node.matches && node.matches('.luongson-top-bookmakers, .framer-1lnj4y4-container')) {
        return true;
      }
      return !!(node.querySelector && node.querySelector('.luongson-top-bookmakers, .framer-1lnj4y4-container'));
    }

    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (nodeHasBookmakers(added[j])) {
            scheduleInit();
            return;
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.luongsonInitNhaCaiUyTin = initTopBookmakersTicker;

  function bootAll() {
    initTopBookmakersTicker();
    observeDynamicBookmakers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
})();
