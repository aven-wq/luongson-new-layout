/**
 * LuongSon Sport — Top bình luận viên (jQuery)
 * Load from API + infinite horizontal ticker + Follow button toggle
 */
(function ($) {
  'use strict';

  var MOBILE_MQ = '(max-width: 809.98px)';
  // Server-side proxy keeps X-API-Key off the browser.
  // Public: GET /api/dv2-streaming-plugin/commentators
  var PROXY_BASE =
    typeof window.DV2_PROXY_API_BASE !== 'undefined' && window.DV2_PROXY_API_BASE
      ? String(window.DV2_PROXY_API_BASE).replace(/\/+$/, '')
      : '/api/dv2-streaming-plugin';
  var COMMENTATORS_API = PROXY_BASE + '/commentators';
  var CARD_VARIANTS = ['is-blue', 'is-teal', 'is-green'];

  function getFallbackAvatar() {
    if (window.LuongsonImageFallback && window.LuongsonImageFallback.getDefaultImgUrl) {
      return window.LuongsonImageFallback.getDefaultImgUrl();
    }

    var pluginUrl =
      (typeof window.DV2_STREAMING_PLUGIN_URL !== 'undefined' && window.DV2_STREAMING_PLUGIN_URL) ||
      (window.dv2Streaming && window.dv2Streaming.pluginUrl) ||
      '';

    if (pluginUrl && pluginUrl.slice(-1) !== '/') {
      pluginUrl += '/';
    }

    return pluginUrl
      ? pluginUrl + 'assets/images/default-img.png'
      : '../../assets/images/default-img.png';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var RATING_OPTIONS = [
    { stars: '4.8', followers: '2.4K' },
    { stars: '4.9', followers: '3K' },
    { stars: '5.0', followers: '5K' },
  ];

  function formatMeta() {
    var pick = RATING_OPTIONS[Math.floor(Math.random() * RATING_OPTIONS.length)];
    return '★ ' + pick.stars + ' · ' + pick.followers + ' người theo dõi';
  }

  function buildCommentatorCard(blv, index) {
    var name = blv && blv.name ? String(blv.name) : 'Bình luận viên';
    var avatar = (blv && blv.avatar) || getFallbackAvatar();
    var meta = formatMeta();
    var variant = CARD_VARIANTS[index % CARD_VARIANTS.length];
    var id = blv && blv.id != null ? String(blv.id) : '';

    return (
      '<div class="luongson-commentator-card ' +
      variant +
      '"' +
      (id ? ' data-id="' + escapeHtml(id) + '"' : '') +
      '>' +
      '<div class="luongson-commentator-avatar" data-border="true">' +
      '<div class="luongson-commentator-avatar__media">' +
      '<img alt="' +
      escapeHtml(name) +
      '" decoding="async" draggable="false" height="360" loading="lazy" src="' +
      escapeHtml(avatar) +
      '" width="240" />' +
      '</div>' +
      '</div>' +
      '<div class="luongson-commentator-info">' +
      '<div class="luongson-commentator-info__name"><p>' +
      escapeHtml(name) +
      '</p></div>' +
      '<div class="luongson-commentator-info__meta"><p>' +
      escapeHtml(meta) +
      '</p></div>' +
      '</div>' +
      '<button type="button" class="luongson-commentator-follow-btn" data-framer-name="Follow Button">' +
      '<span class="luongson-commentator-follow-btn__label">♥️ Follow</span>' +
      '</button>' +
      '</div>'
    );
  }

  function createCommentatorsTicker(container) {
    var $container = $(container);
    var $track = $container.find('.luongson-commentators-track').first();
    if (!$track.length || $track.data('lsSportTickerInit')) return;
    $track.data('lsSportTickerInit', true);

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

    var speed = 35;
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
    var disabled = false;

    function clearInlineCardSizes() {
      $originalChildren.each(function () {
        this.style.removeProperty('width');
        this.style.removeProperty('flex');
        this.style.removeProperty('min-width');
        this.style.removeProperty('max-width');
      });
      $track.get(0).style.removeProperty('transform');
      singleSetWidth = 0;
      currentX = 0;
    }

    function buildClones() {
      $track.find('.clone-item').remove();

      if (!$originalChildren.length) return;

      if (window.matchMedia(MOBILE_MQ).matches) {
        disabled = true;
        clearInlineCardSizes();
        return;
      }

      disabled = false;

      var containerWidth = $container.outerWidth() || $(window).width();
      var computedStyle = window.getComputedStyle($track.get(0));
      var gap = parseFloat(computedStyle.gap) || parseFloat(computedStyle.columnGap) || 10;

      if (containerWidth > 0) {
        var cols = containerWidth >= 1024 ? 3 : containerWidth >= 640 ? 2 : 1;
        var cardWidth = Math.floor((containerWidth - (cols - 1) * gap) / cols);
        $originalChildren.each(function () {
          this.style.setProperty('width', cardWidth + 'px', 'important');
          this.style.setProperty('flex', '0 0 ' + cardWidth + 'px', 'important');
          this.style.setProperty('min-width', cardWidth + 'px', 'important');
          this.style.setProperty('max-width', cardWidth + 'px', 'important');
        });
      }

      var firstChild = $originalChildren.get(0);
      var lastChild = $originalChildren.get($originalChildren.length - 1);
      var firstRect = firstChild.getBoundingClientRect();
      var lastRect = lastChild.getBoundingClientRect();
      var gapVal = gap;

      if (firstRect.width > 0 && lastRect.right - firstRect.left > 0) {
        singleSetWidth = lastRect.right - firstRect.left + gapVal;
      } else {
        singleSetWidth = lastChild.offsetLeft + lastChild.offsetWidth - firstChild.offsetLeft + gapVal;
      }

      if (singleSetWidth <= 0 || isNaN(singleSetWidth)) {
        singleSetWidth = $originalChildren.toArray().reduce(function (acc, el) {
          return acc + (el.offsetWidth || 280) + gapVal;
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

      if (!disabled && !isHovered && !isDragging && singleSetWidth > 0) {
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
      if (disabled) return;
      if ($(e.target).closest('.luongson-commentator-follow-btn').length) return;
      isDragging = true;
      dragDistance = 0;
      startX = pointerClientX(e);
      dragStartX = currentX;
      $track.css('cursor', 'grabbing');
    }

    function onPointerMove(e) {
      if (!isDragging || disabled) return;
      var clientX = pointerClientX(e);
      var dx = clientX - startX;
      dragDistance = Math.abs(dx);
      currentX = dragStartX + dx;
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

      if (singleSetWidth > 0) {
        while (currentX <= -singleSetWidth) currentX += singleSetWidth;
        while (currentX > 0) currentX -= singleSetWidth;
      }
    }

    var trackEl = $track.get(0);

    $track.on('mousedown', onPointerDown);
    $(window).on('mousemove.lsCommentatorsTicker', onPointerMove);
    $(window).on('mouseup.lsCommentatorsTicker', onPointerUp);

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
    $(window).on('resize.lsCommentatorsTicker', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildClones();
        lastTimestamp = null;
      }, 150);
    });

    $(document).on('visibilitychange.lsCommentatorsTicker', function () {
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

  function initFollowButtons() {
    if ($(document).data('lsSportFollowInit')) return;
    $(document).data('lsSportFollowInit', true);

    $(document).on(
      'click.lsSportFollow',
      '.luongson-top-commentators .luongson-commentator-follow-btn, .luongson-top-commentators [data-framer-name="Follow Button"]',
      function (e) {
        e.preventDefault();
        e.stopPropagation();

        var $btn = $(this);
        var isFollowed = $btn.toggleClass('followed').hasClass('followed');
        var $textEl = $btn.find('.luongson-commentator-follow-btn__label, p, span').first();
        if ($textEl.length) {
          $textEl.text(isFollowed ? '♥️ Đã theo dõi' : '♥️ Follow');
        }
      }
    );
  }

  function initTickers() {
    $('.luongson-top-commentators .luongson-commentators-list').each(function () {
      createCommentatorsTicker(this);
    });
  }

  function renderCommentators(commentators) {
    var $tracks = $('.luongson-top-commentators .luongson-commentators-track');
    if (!$tracks.length) return;

    var html = $.map(commentators, function (blv, index) {
      return buildCommentatorCard(blv, index);
    }).join('');

    $tracks.html(html);

    initTickers();
    initFollowButtons();
  }

  function showTrackMessage(message) {
    $('.luongson-top-commentators .luongson-commentators-track').html(
      '<div class="luongson-commentators-empty" style="padding:24px 12px;text-align:center;color:#666;width:100%;">' +
        escapeHtml(message) +
        '</div>'
    );
  }

  function loadCommentators() {
    showTrackMessage('Đang tải danh sách bình luận viên...');

    $.ajax({
      url: COMMENTATORS_API,
      method: 'GET',
      dataType: 'json',
    })
      .done(function (data) {
        if (!data || data.message !== 'success' || !Array.isArray(data.commentators)) {
          showTrackMessage('Không có dữ liệu bình luận viên');
          return;
        }
        if (!data.commentators.length) {
          showTrackMessage('Không có bình luận viên nào');
          return;
        }
        renderCommentators(data.commentators);
      })
      .fail(function () {
        showTrackMessage('Lỗi khi tải danh sách bình luận viên');
      });
  }

  function initAll() {
    if (!$('.luongson-top-commentators .luongson-commentators-track').length) {
      return;
    }
    loadCommentators();
  }

  $(initAll);
})(jQuery);
