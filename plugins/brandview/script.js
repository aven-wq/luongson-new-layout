(function () {
    'use strict';

    function initMarquee() {
        document.querySelectorAll('.tf-title, .tf-desc').forEach(function (el) {
            var inner = el.querySelector('.tf-title-inner, .tf-desc-inner');
            if (!inner) return;

            inner.style.animation = 'none';
            inner.style.removeProperty('--tf-scroll');
            void inner.offsetWidth;

            var innerW = inner.getBoundingClientRect().width;
            var elW = el.getBoundingClientRect().width;
            if (innerW <= elW) return;

            el.style.overflow = 'hidden';

            var dist = innerW - elW;
            var dur = Math.max(4, dist / 30);

            inner.style.setProperty('--tf-scroll', '-' + dist + 'px');
            inner.style.animation = 'tf-scroll ' + dur + 's ease-in-out infinite';
            inner.style.animationDelay = '1s';
        });
    }

    var style = document.createElement('style');
    style.textContent = '@keyframes tf-scroll { 0% { transform: translateX(0); } 40% { transform: translateX(var(--tf-scroll)); } 60% { transform: translateX(var(--tf-scroll)); } 100% { transform: translateX(0); } }';
    document.head.appendChild(style);

    var AJAX_URL = typeof tfTrack !== 'undefined' && tfTrack.ajaxurl ? tfTrack.ajaxurl : '';

    function initClickTracking() {
        if (!AJAX_URL) return;
        document.querySelectorAll('.tf-item, .tf-s3-item').forEach(function (link) {
            link.addEventListener('click', function (e) {
                var code = this.getAttribute('data-code') || '';
                var domain = '';
                try { domain = new URL(this.href).hostname; } catch (e) {}

                var data = new URLSearchParams();
                data.append('action', 'tf_track_click');
                data.append('domain', domain);
                data.append('brand', code);
                data.append('target_url', this.href);

                fetch(AJAX_URL, { method: 'POST', body: data, keepalive: true });
            });
        });
    }

    function updateCtaVisibility() {
        document.querySelectorAll('.tf-section').forEach(function (section) {
            var w = section.clientWidth;
            var isSlider = section.classList.contains('tf-theme-style3') || section.classList.contains('tf-theme-style4');
            section.style.display = w < 280 ? 'none' : '';
            if (isSlider) {
                section.classList.toggle('tf-s3-small', section.style.display !== 'none' && w < 390);
            } else {
                section.classList.toggle('tf-cta-hidden', w < 360);
            }
        });
    }

    var roTimer;
    function initSlider(section) {
        var track = section.querySelector('.tf-s3-track');
        var prev = section.querySelector('.tf-s3-prev');
        var next = section.querySelector('.tf-s3-next');
        var wrap = section.querySelector('.tf-s3-track-wrap');
        if (!track || !prev || !next || !wrap) return;

        var items = track.children;
        if (items.length === 0) return;

        fillTrack();
        var currentPos = 0;
        var autoTimer = null;

        function fillTrack() {
            var wrapW = wrap.getBoundingClientRect().width;
            var gap = getGap();
            var totalW = 0;
            var originals = Array.from(items);
            if (originals.length === 0) return;
            for (var i = 0; i < originals.length; i++) {
                totalW += originals[i].offsetWidth;
                if (i < originals.length - 1) totalW += gap;
            }
            var minClones = 1;
            var clonesAdded = 0;
            while ((totalW < wrapW || clonesAdded < minClones) && clonesAdded < 20) {
                for (var i = 0; i < originals.length && (totalW < wrapW || clonesAdded < minClones); i++) {
                    var clone = originals[i].cloneNode(true);
                    track.appendChild(clone);
                    totalW += originals[i].offsetWidth + gap;
                }
                clonesAdded++;
            }
        }

        function getItemWidth() {
            if (items.length === 0) return 0;
            return items[0].getBoundingClientRect().width;
        }

        function getGap() {
            return parseFloat(getComputedStyle(track).gap) || 0;
        }

        function getItemsPerView() {
            var wrapW = wrap.getBoundingClientRect().width;
            var itemW = getItemWidth();
            var gap = getGap();
            var step = itemW + gap;
            if (step <= 0) return 1;
            return Math.max(1, Math.floor(wrapW / step));
        }

        function getMaxTranslate() {
            var wrapW = wrap.getBoundingClientRect().width;
            var gap = getGap();
            var totalItemW = 0;
            for (var i = 0; i < items.length; i++) {
                totalItemW += items[i].getBoundingClientRect().width;
            }
            var totalGaps = (items.length - 1) * gap;
            return Math.max(0, totalItemW + totalGaps - wrapW);
        }

        function getStep() {
            var perView = getItemsPerView();
            return perView >= 4 ? 2 : 1;
        }

        function update(instant) {
            if (section.offsetParent === null) return;
            var prevTransition = track.style.transition;
            if (instant) {
                track.style.transition = 'none';
            }
            var itemW = getItemWidth();
            var gap = getGap();
            var step = itemW + gap;
            if (step <= 0) return;
            var maxTx = getMaxTranslate();
            var maxPos = maxTx > 0 ? Math.ceil(maxTx / step) : 0;
            if (currentPos > maxPos) currentPos = 0;
            if (currentPos < 0) currentPos = maxPos;
            var tx = Math.min(currentPos * step, maxTx);
            track.style.transform = 'translateX(-' + tx + 'px)';
            if (instant) {
                void track.offsetHeight;
                track.style.transition = prevTransition;
            }
        }

        function goNext() {
            var s = getStep();
            var maxTx = getMaxTranslate();
            var step = getItemWidth() + getGap();
            var maxPos = maxTx > 0 ? Math.ceil(maxTx / step) : 0;
            if (currentPos >= maxPos) {
                currentPos = 0;
                update(true);
            } else {
                currentPos = Math.min(currentPos + s, maxPos);
                update();
            }
        }

        function goPrev() {
            var s = getStep();
            var maxTx = getMaxTranslate();
            var step = getItemWidth() + getGap();
            var maxPos = maxTx > 0 ? Math.ceil(maxTx / step) : 0;
            if (currentPos <= 0) {
                currentPos = maxPos;
                update(true);
            } else {
                currentPos = Math.max(currentPos - s, 0);
                update();
            }
        }

        function startAuto() {
            stopAuto();
            autoTimer = setInterval(goNext, 3000);
        }

        function stopAuto() {
            if (autoTimer) {
                clearInterval(autoTimer);
                autoTimer = null;
            }
        }

        next.addEventListener('click', function () { stopAuto(); goNext(); });
        prev.addEventListener('click', function () { stopAuto(); goPrev(); });

        section.addEventListener('mouseenter', stopAuto);
        section.addEventListener('mouseleave', startAuto);

        var startX = 0, isDragging = false;
        track.addEventListener('touchstart', function (e) {
            stopAuto();
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true });

        track.addEventListener('touchend', function (e) {
            if (!isDragging) return;
            isDragging = false;
            var endX = e.changedTouches[0].clientX;
            var diff = startX - endX;
            if (Math.abs(diff) >= 50) {
                var maxTx = getMaxTranslate();
                var step = getItemWidth() + getGap();
                var maxPos = maxTx > 0 ? Math.ceil(maxTx / step) : 0;
                if (diff > 0) {
                    if (currentPos >= maxPos) { currentPos = 0; update(true); }
                    else { currentPos = Math.min(currentPos + getStep(), maxPos); update(); }
                } else {
                    if (currentPos <= 0) { currentPos = maxPos; update(true); }
                    else { currentPos = Math.max(currentPos - getStep(), 0); update(); }
                }
            }
            startAuto();
        }, { passive: true });

        update();
        startAuto();
        return { update: update, destroy: stopAuto };
    }

    var sliders = [];

    function initAll() {
        initMarquee();
        initClickTracking();
        updateCtaVisibility();
        var sections = document.querySelectorAll('.tf-section');
        sections.forEach(function (section) {
            if (section.classList.contains('tf-theme-style3') || section.classList.contains('tf-theme-style4')) {
                var sl = initSlider(section);
                if (sl) sliders.push(sl);
            }
        });
    }

    var ro = new ResizeObserver(function () {
        clearTimeout(roTimer);
        roTimer = setTimeout(function () {
            initMarquee();
            updateCtaVisibility();
            sliders.forEach(function (s) { if (s.update) s.update(); });
        }, 150);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initAll();
            var section = document.querySelector('.tf-section');
            if (section) ro.observe(section);
        });
    } else {
        initAll();
        var section = document.querySelector('.tf-section');
        if (section) ro.observe(section);
    }
})();