/**
 * LuongSon Sport — Top bình luận viên
 * Load from API + infinite horizontal ticker + Follow button toggle
 */
(function () {
  'use strict';

  var MOBILE_MQ = '(max-width: 809.98px)';
  var BASE =
    typeof window.BASE_API_URL !== 'undefined' && window.BASE_API_URL
      ? String(window.BASE_API_URL).replace(/\/+$/, '')
      : 'https://vsc-apidev.helizones.com';
  var COMMENTATORS_API = BASE + '/api/admin/streams/commentators';
  var FALLBACK_AVATAR =
    'https://sta.vnres.co/file/common/20250410/000bfdfc22afe0f322140fabd2228aec.jpg';
  var CARD_VARIANTS = ['is-blue', 'is-teal', 'is-green'];

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
    var avatar = (blv && blv.avatar) || FALLBACK_AVATAR;
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
      '" width="240" onerror="this.onerror=null;this.src=\'' +
      FALLBACK_AVATAR +
      '\'" />' +
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
    var track = container.querySelector('.luongson-commentators-track');
    if (!track || track.__lsSportTickerInit) return;
    track.__lsSportTickerInit = true;

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
      originalChildren.forEach(function (child) {
        child.style.removeProperty('width');
        child.style.removeProperty('flex');
        child.style.removeProperty('min-width');
        child.style.removeProperty('max-width');
      });
      track.style.removeProperty('transform');
      singleSetWidth = 0;
      currentX = 0;
    }

    function buildClones() {
      Array.prototype.slice.call(track.querySelectorAll('.clone-item')).forEach(function (c) {
        c.remove();
      });

      if (originalChildren.length === 0) return;

      if (window.matchMedia(MOBILE_MQ).matches) {
        disabled = true;
        clearInlineCardSizes();
        return;
      }

      disabled = false;

      var containerWidth = container.offsetWidth || window.innerWidth;
      var computedStyle = window.getComputedStyle(track);
      var gap = parseFloat(computedStyle.gap) || parseFloat(computedStyle.columnGap) || 10;

      if (containerWidth > 0) {
        var cols = containerWidth >= 1024 ? 3 : containerWidth >= 640 ? 2 : 1;
        var cardWidth = Math.floor((containerWidth - (cols - 1) * gap) / cols);
        originalChildren.forEach(function (child) {
          child.style.setProperty('width', cardWidth + 'px', 'important');
          child.style.setProperty('flex', '0 0 ' + cardWidth + 'px', 'important');
          child.style.setProperty('min-width', cardWidth + 'px', 'important');
          child.style.setProperty('max-width', cardWidth + 'px', 'important');
        });
      }

      var firstChild = originalChildren[0];
      var lastChild = originalChildren[originalChildren.length - 1];
      var firstRect = firstChild.getBoundingClientRect();
      var lastRect = lastChild.getBoundingClientRect();
      var gapVal = gap;

      if (firstRect.width > 0 && lastRect.right - firstRect.left > 0) {
        singleSetWidth = lastRect.right - firstRect.left + gapVal;
      } else {
        singleSetWidth =
          lastChild.offsetLeft + lastChild.offsetWidth - firstChild.offsetLeft + gapVal;
      }

      if (singleSetWidth <= 0 || isNaN(singleSetWidth)) {
        singleSetWidth = originalChildren.reduce(function (acc, el) {
          return acc + (el.offsetWidth || 280) + gapVal;
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
      if (disabled) return;
      if (e.target.closest('.luongson-commentator-follow-btn')) return;
      isDragging = true;
      dragDistance = 0;
      startX = e.type.indexOf('touch') === 0 ? e.touches[0].clientX : e.clientX;
      dragStartX = currentX;
      track.style.cursor = 'grabbing';
    }

    function onPointerMove(e) {
      if (!isDragging || disabled) return;
      var clientX = e.type.indexOf('touch') === 0 ? e.touches[0].clientX : e.clientX;
      var dx = clientX - startX;
      dragDistance = Math.abs(dx);
      currentX = dragStartX + dx;
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

      if (singleSetWidth > 0) {
        while (currentX <= -singleSetWidth) currentX += singleSetWidth;
        while (currentX > 0) currentX -= singleSetWidth;
      }
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

  function initFollowButtons() {
    if (document.__lsSportFollowInit) return;
    document.__lsSportFollowInit = true;

    document.addEventListener('click', function (e) {
      var btn = e.target.closest(
        '.luongson-top-commentators .luongson-commentator-follow-btn, .luongson-top-commentators [data-framer-name="Follow Button"]'
      );
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      var isFollowed = btn.classList.toggle('followed');
      var textEl = btn.querySelector('.luongson-commentator-follow-btn__label, p, span');
      if (textEl) {
        textEl.textContent = isFollowed ? '♥️ Đã theo dõi' : '♥️ Follow';
      }
    });
  }

  function initTickers() {
    var lists = document.querySelectorAll(
      '.luongson-top-commentators .luongson-commentators-list'
    );
    lists.forEach(function (list) {
      createCommentatorsTicker(list);
    });
  }

  function renderCommentators(commentators) {
    var tracks = document.querySelectorAll(
      '.luongson-top-commentators .luongson-commentators-track'
    );
    if (!tracks.length) return;

    var html = commentators
      .map(function (blv, index) {
        return buildCommentatorCard(blv, index);
      })
      .join('');

    tracks.forEach(function (track) {
      track.innerHTML = html;
    });

    initTickers();
    initFollowButtons();
  }

  function showTrackMessage(message) {
    var tracks = document.querySelectorAll(
      '.luongson-top-commentators .luongson-commentators-track'
    );
    tracks.forEach(function (track) {
      track.innerHTML =
        '<div class="luongson-commentators-empty" style="padding:24px 12px;text-align:center;color:#666;width:100%;">' +
        escapeHtml(message) +
        '</div>';
    });
  }

  function loadCommentators() {
    showTrackMessage('Đang tải danh sách bình luận viên...');

    fetch(COMMENTATORS_API, { method: 'GET' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
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
      .catch(function () {
        showTrackMessage('Lỗi khi tải danh sách bình luận viên');
      });
  }

  function initAll() {
    loadCommentators();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
