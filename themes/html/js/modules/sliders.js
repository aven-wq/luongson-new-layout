/**
 * LuongSon TV - Common Ticker & Slider Module
 * Provides seamless infinite marquee scrolling, touch/drag swipe support,
 * hover pause, and commentator slider controls.
 */

/**
 * Creates an infinite seamless horizontal ticker on matching elements.
 * @param {Object} options
 * @param {string} options.selector - Parent container selector
 * @param {string} [options.trackSelector] - Child track selector (default: 'ul')
 * @param {number} [options.speed] - Speed in pixels per second (default: 40)
 * @param {number} [options.direction] - Direction: -1 for left, 1 for right (default: -1)
 * @param {boolean} [options.pauseOnHover] - Whether to pause on hover (default: true)
 * @param {boolean} [options.draggable] - Whether mouse/touch drag is enabled (default: true)
 */
export function createInfiniteTicker(options) {
  const {
    selector,
    trackSelector = 'ul',
    speed = 40,
    direction = -1,
    pauseOnHover = true,
    draggable = true
  } = options;

  const containers = document.querySelectorAll(selector);

  containers.forEach((container) => {
    const track = container.querySelector(trackSelector) || container.querySelector('ul') || container.firstElementChild;
    if (!track) return;
    if (track.__lsTickerInit) return;
    track.__lsTickerInit = true;

    // Filter out existing clone items to get unique items
    const originalChildren = Array.from(track.children).filter(
      (child) => !child.classList.contains('clone-item') && child.getAttribute('aria-hidden') !== 'true'
    );

    if (originalChildren.length === 0) return;

    // Remove any hardcoded clone items
    Array.from(track.children).forEach((child) => {
      if (child.classList.contains('clone-item') || child.getAttribute('aria-hidden') === 'true') {
        child.remove();
      }
    });

    // Make sure original children have ticker-item class
    originalChildren.forEach((child) => {
      if (!child.classList.contains('ticker-item')) {
        child.classList.add('ticker-item');
      }
    });

    let singleSetWidth = 0;
    let totalClones = 0;

    function buildClones() {
      // Remove previously added clones
      Array.from(track.querySelectorAll('.clone-item')).forEach((c) => c.remove());

      if (originalChildren.length === 0) return;

      const isCommentators = container.classList.contains('luongson-commentators-list') || container.classList.contains('framer-3bgk2l');
      const containerWidth = container.offsetWidth || window.innerWidth;
      const computedStyle = window.getComputedStyle(track);
      const gap = parseFloat(computedStyle.gap) || parseFloat(computedStyle.columnGap) || 10;

      if (isCommentators && containerWidth > 0) {
        const cols = containerWidth >= 1024 ? 3 : (containerWidth >= 640 ? 2 : 1);
        const cardWidth = Math.floor((containerWidth - (cols - 1) * gap) / cols);
        originalChildren.forEach((child) => {
          child.style.setProperty('width', cardWidth + 'px', 'important');
          child.style.setProperty('flex', '0 0 ' + cardWidth + 'px', 'important');
          child.style.setProperty('min-width', cardWidth + 'px', 'important');
          child.style.setProperty('max-width', cardWidth + 'px', 'important');
        });
      }

      // Measure width of original set
      const firstChild = originalChildren[0];
      const lastChild = originalChildren[originalChildren.length - 1];
      const firstLeft = firstChild.offsetLeft;
      const lastRight = lastChild.offsetLeft + lastChild.offsetWidth;

      const firstRect = firstChild.getBoundingClientRect();
      const lastRect = lastChild.getBoundingClientRect();
      if (firstRect.width > 0 && (lastRect.right - firstRect.left) > 0) {
        singleSetWidth = (lastRect.right - firstRect.left) + gap;
      } else {
        singleSetWidth = (lastRight - firstLeft) + gap;
      }
      if (singleSetWidth <= 0 || isNaN(singleSetWidth)) {
        singleSetWidth = originalChildren.reduce((acc, el) => acc + (el.offsetWidth || 280) + gap, 0);
      }
      if (singleSetWidth <= 0) return;

      // Ensure total width has enough clones to cover at least 2 full container widths
      const neededCopies = Math.max(2, Math.ceil((containerWidth * 2) / singleSetWidth) + 1);

      for (let i = 0; i < neededCopies; i++) {
        originalChildren.forEach((child) => {
          const clone = child.cloneNode(true);
          clone.classList.add('clone-item');
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);
          totalClones++;
        });
      }
    }

    buildClones();

    // Motion State
    let currentX = 0;
    let isHovered = false;
    let isDragging = false;
    let startX = 0;
    let dragStartX = 0;
    let dragDistance = 0;
    let lastTimestamp = null;
    let rafId = null;

    function animate(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;

      if (!isHovered && !isDragging && singleSetWidth > 0) {
        currentX += direction * speed * dt;

        // Wrap seamlessly around singleSetWidth
        if (direction < 0) {
          while (currentX <= -singleSetWidth) {
            currentX += singleSetWidth;
          }
        } else {
          while (currentX >= 0) {
            currentX -= singleSetWidth;
          }
        }

        track.style.setProperty('transform', `translate3d(${currentX}px, 0, 0)`, 'important');
      }

      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    // Hover Interaction
    if (pauseOnHover) {
      container.addEventListener('mouseenter', () => { isHovered = true; });
      container.addEventListener('mouseleave', () => { isHovered = false; });
    }

    // Touch & Mouse Drag Interaction
    if (draggable) {
      function onPointerStart(e) {
        isDragging = true;
        startX = e.touches ? e.touches[0].clientX : e.clientX;
        dragStartX = currentX;
        dragDistance = 0;
        track.style.cursor = 'grabbing';
      }

      function onPointerMove(e) {
        if (!isDragging) return;
        const currentClientX = e.touches ? e.touches[0].clientX : e.clientX;
        const diff = currentClientX - startX;
        dragDistance += Math.abs(diff);
        currentX = dragStartX + diff;

        if (singleSetWidth > 0) {
          while (currentX <= -singleSetWidth) currentX += singleSetWidth;
          while (currentX > 0) currentX -= singleSetWidth;
        }

        track.style.setProperty('transform', `translate3d(${currentX}px, 0, 0)`, 'important');
      }

      function onPointerEnd() {
        if (!isDragging) return;
        isDragging = false;
        track.style.cursor = '';
      }

      track.addEventListener('mousedown', onPointerStart);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerEnd);

      track.addEventListener('touchstart', onPointerStart, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerEnd, { passive: true });

      // Prevent accidental clicks when dragging
      track.addEventListener('click', (e) => {
        if (dragDistance > 6) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    }

    // Window Resize Handling (debounced)
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        buildClones();
      }, 150);
    });

    // Visibility API - Pause RAF when tab is inactive to save resources
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        lastTimestamp = null;
      }
    });
  });
}

/**
 * Global Follow Button Interaction (delegated for original + cloned cards)
 */
export function initFollowButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-framer-name="Follow Button"], .framer-1tp7z3x, .framer-1l5csht, .framer-bbuwzs');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const isFollowed = btn.classList.toggle('followed');
    const textEl = btn.querySelector('p, span');
    if (textEl) {
      textEl.textContent = isFollowed ? '♥️ Đã theo dõi' : '♥️ Follow';
    }
  });
}

/**
 * Initializes Match Card Vertical Bet Slider (toggle logo Vic88 / Bet247)
 */
export function initMatchBetSlideshow() {
  const slideshows = document.querySelectorAll('.framer-slideshow-axis-y');

  slideshows.forEach((slideshow) => {
    const track = slideshow.querySelector('ul');
    if (!track || track.__slideshowInit) return;
    track.__slideshowInit = true;

    const items = track.querySelectorAll('li');
    if (items.length <= 1) return;

    let currentIndex = 0;
    const totalItems = items.length;

    setInterval(() => {
      currentIndex = (currentIndex + 1) % totalItems;
      const percentage = -(currentIndex * 100);
      track.style.setProperty('transform', `translate3d(0, ${percentage}%, 0)`, 'important');
    }, 3500);
  });
}

/**
 * Master initializer for all tickers & sliders
 */
export function initAllTickersAndSliders() {
  // 1. Top Marquee Ticker Bar
  createInfiniteTicker({
    selector: '.luongson-marquee-ticker, .framer-1ecegz2, .framer-16stqci, .framer-gvq6hs, .framer-1p0iri9, .framer-197sjsc',
    trackSelector: 'ul',
    speed: 42,
    direction: -1,
    pauseOnHover: true,
    draggable: true
  });

  // 2. Featured Match Ads Ticker (Score Bar)
  createInfiniteTicker({
    selector: '.luongson-featured-ads-ticker, .framer-cfqyq6',
    trackSelector: 'ul',
    speed: 38,
    direction: -1,
    pauseOnHover: true,
    draggable: true
  });

  // 3. Top Bookmakers Ticker
  createInfiniteTicker({
    selector: '.luongson-top-bookmakers, .framer-1lnj4y4-container, .framer-ioysu6-container, .framer-srbwl7-container, .framer-yy5utx-container',
    trackSelector: '.framer-czcwzc ul, ul',
    speed: 36,
    direction: -1,
    pauseOnHover: true,
    draggable: true
  });

  // 4. Footer Sponsors Logo Ticker
  createInfiniteTicker({
    selector: '.luongson-footer-sponsors, .framer-1f6jmnw',
    trackSelector: '.framer-35hpbh ul, ul',
    speed: 32,
    direction: -1,
    pauseOnHover: true,
    draggable: true
  });

  // Commentators List is responsive grid/flex (no auto-scroll)

  // Match Bet Button Slideshows
  initMatchBetSlideshow();

  // Follow Buttons Handler
  initFollowButtons();
}
