/**
 * LuongSon Sport — Home Featured Match (jQuery)
 * Ads ticker infinite scroll (from themes/html/js/modules/sliders.js)
 */
(function ($) {
  'use strict';

  function createFeaturedAdsTicker(container) {
    var $container = $(container);
    var $track = $container.find('ul').first();
    if (!$track.length || $track.data('lsHomeMatchTickerInit')) return;
    $track.data('lsHomeMatchTickerInit', true);

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
    $(window).on('mousemove.lsHomeMatchTicker', onPointerMove);
    $(window).on('mouseup.lsHomeMatchTicker', onPointerUp);

    // Native listeners keep passive:false so touch drag can call preventDefault.
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
    $(window).on('resize.lsHomeMatchTicker', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildClones();
        lastTimestamp = null;
      }, 150);
    });

    $(document).on('visibilitychange.lsHomeMatchTicker', function () {
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
    $(
      '.luongson-home-match .luongson-featured-ads-ticker, .luongson-home-match .framer-cfqyq6'
    ).each(function () {
      createFeaturedAdsTicker(this);
    });
  }

  $(initAll);
})(jQuery);
