/**
 * LuongSon Sport — Home Featured Match
 * Ads ticker infinite scroll (from themes/html/js/modules/sliders.js)
 */
(function () {
  'use strict';

  function createFeaturedAdsTicker(container) {
    var track = container.querySelector('ul');
    if (!track || track.__lsHomeMatchTickerInit) return;
    track.__lsHomeMatchTickerInit = true;

    var originalChildren = Array.prototype.slice.call(track.children).filter(function (child) {
      return !child.classList.contains('clone-item') && child.getAttribute('aria-hidden') !== 'true';
    });

    if (originalChildren.length === 0) return;

    Array.prototype.slice.call(track.children).forEach(function (child) {
      if (child.classList.contains('clone-item') || child.getAttribute('aria-hidden') === 'true') {
        child.remove();
      }
    });

    originalChildren.forEach(function (child) {
      if (!child.classList.contains('ticker-item')) {
        child.classList.add('ticker-item');
      }
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

    function buildClones() {
      Array.prototype.slice.call(track.querySelectorAll('.clone-item')).forEach(function (c) {
        c.remove();
      });

      if (originalChildren.length === 0) return;

      var containerWidth = container.offsetWidth || window.innerWidth;
      var computedStyle = window.getComputedStyle(track);
      var gap = parseFloat(computedStyle.gap) || parseFloat(computedStyle.columnGap) || 12;

      var firstChild = originalChildren[0];
      var lastChild = originalChildren[originalChildren.length - 1];
      var firstRect = firstChild.getBoundingClientRect();
      var lastRect = lastChild.getBoundingClientRect();

      if (firstRect.width > 0 && lastRect.right - firstRect.left > 0) {
        singleSetWidth = lastRect.right - firstRect.left + gap;
      } else {
        singleSetWidth =
          lastChild.offsetLeft + lastChild.offsetWidth - firstChild.offsetLeft + gap;
      }

      if (singleSetWidth <= 0 || isNaN(singleSetWidth)) {
        singleSetWidth = originalChildren.reduce(function (acc, el) {
          return acc + (el.offsetWidth || 80) + gap;
        }, 0);
      }

      if (singleSetWidth <= 0) return;

      var neededCopies = Math.max(2, Math.ceil((containerWidth * 2) / singleSetWidth) + 1);

      for (var i = 0; i < neededCopies; i++) {
        originalChildren.forEach(function (child) {
          var clone = child.cloneNode(true);
          clone.classList.add('clone-item');
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);
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
        track.style.setProperty('transform', 'translate3d(' + currentX + 'px, 0, 0)', 'important');
      }

      rafId = requestAnimationFrame(animate);
    }

    container.addEventListener('mouseenter', function () {
      isHovered = true;
    });
    container.addEventListener('mouseleave', function () {
      isHovered = false;
      lastTimestamp = null;
    });

    function onPointerDown(e) {
      isDragging = true;
      dragDistance = 0;
      startX = e.type.indexOf('touch') === 0 ? e.touches[0].clientX : e.clientX;
      dragStartX = currentX;
      track.style.cursor = 'grabbing';
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      var clientX = e.type.indexOf('touch') === 0 ? e.touches[0].clientX : e.clientX;
      var dx = clientX - startX;
      dragDistance = Math.abs(dx);
      currentX = dragStartX + dx;

      if (singleSetWidth > 0) {
        while (currentX <= -singleSetWidth) currentX += singleSetWidth;
        while (currentX > 0) currentX -= singleSetWidth;
      }

      track.style.setProperty('transform', 'translate3d(' + currentX + 'px, 0, 0)', 'important');
      if (e.cancelable && e.type.indexOf('touch') === 0) {
        e.preventDefault();
      }
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      track.style.cursor = '';
      lastTimestamp = null;
    }

    track.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    track.addEventListener('touchstart', onPointerDown, { passive: true });
    track.addEventListener('touchmove', onPointerMove, { passive: false });
    track.addEventListener('touchend', onPointerUp);

    track.addEventListener(
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
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildClones();
        lastTimestamp = null;
      }, 150);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        lastTimestamp = null;
      }
    });

    buildClones();
    rafId = requestAnimationFrame(animate);

    return function destroy() {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }

  function initAll() {
    var tickers = document.querySelectorAll(
      '.luongson-home-match .luongson-featured-ads-ticker, .luongson-home-match .framer-cfqyq6'
    );
    tickers.forEach(function (el) {
      createFeaturedAdsTicker(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
