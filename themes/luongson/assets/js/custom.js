/**
 * LuongSon notice marquee + home AI prediction height helper.
 * Vanilla JS (no jQuery) — scoped observers, skip work when markup absent.
 */
(function () {
	'use strict';

	function setNoticeMarqueeTransform(track, x) {
		track.style.setProperty('transform', 'translate3d(' + x + 'px,0,0)', 'important');
	}

	function ensureNoticeMarqueeTrack(wrapper) {
		var track = wrapper.querySelector('.gwd-marquee-track');
		if (track) {
			return track;
		}

		track = document.createElement('div');
		track.className = 'gwd-marquee-track';

		while (wrapper.firstChild) {
			track.appendChild(wrapper.firstChild);
		}

		wrapper.appendChild(track);
		return track;
	}

	function hasNoticeMarqueeContent(ins) {
		if (!ins) {
			return false;
		}

		if (ins.offsetWidth > 0 || ins.scrollWidth > 0) {
			return true;
		}

		return ins.textContent.trim().length > 0 || !!ins.querySelector('a, img, span, button');
	}

	function syncNoticeMarqueeClones(track, sourceSegment) {
		track.querySelectorAll(':scope > .gwd-marquee-clone').forEach(function (clone) {
			clone.remove();
		});

		var clone = document.createElement('div');
		clone.className = 'gwd-marquee-segment gwd-marquee-clone';
		clone.setAttribute('aria-hidden', 'true');
		clone.innerHTML = sourceSegment.innerHTML;
		track.appendChild(clone);
	}

	function prepareNoticeMarqueeTrack(track) {
		var sourceSegment = track.querySelector(':scope > .gwd-marquee-segment:not(.gwd-marquee-clone)');

		if (sourceSegment) {
			if (!hasNoticeMarqueeContent(sourceSegment)) {
				return null;
			}

			syncNoticeMarqueeClones(track, sourceSegment);
			return sourceSegment;
		}

		var insList = Array.from(track.querySelectorAll(':scope > ins'));
		var sourceIns = insList[0];

		if (!hasNoticeMarqueeContent(sourceIns)) {
			return null;
		}

		insList.slice(1).forEach(function (ins) {
			ins.remove();
		});

		sourceSegment = document.createElement('div');
		sourceSegment.className = 'gwd-marquee-segment';
		sourceIns = track.querySelector(':scope > ins');

		if (!sourceIns) {
			return null;
		}

		sourceSegment.appendChild(sourceIns);
		track.appendChild(sourceSegment);
		syncNoticeMarqueeClones(track, sourceSegment);

		return sourceSegment;
	}

	function measureNoticeMarqueeLoopDistance(sourceSegment) {
		if (!sourceSegment) {
			return 0;
		}

		var width = sourceSegment.offsetWidth;
		if (width > 0) {
			return width;
		}

		var rect = sourceSegment.getBoundingClientRect();
		return rect.width > 0 ? rect.width : 0;
	}

	function remeasureNoticeMarqueeLoop(track, state) {
		var sourceSegment = track.querySelector(':scope > .gwd-marquee-segment:not(.gwd-marquee-clone)');
		if (!sourceSegment) {
			return false;
		}

		syncNoticeMarqueeClones(track, sourceSegment);

		var loopDistance = measureNoticeMarqueeLoopDistance(sourceSegment);
		if (loopDistance <= 0) {
			return false;
		}

		if (state.singleWidth > 0) {
			var progress = state.offset / state.singleWidth;
			state.offset = progress * loopDistance;
		}

		state.singleWidth = loopDistance;
		return true;
	}

	function initLuongsonNoticeMarqueeWrapper(wrapper) {
		if (wrapper.__lsNoticeMarqueeInit) {
			return true;
		}

		var track = ensureNoticeMarqueeTrack(wrapper);
		var sourceSegment = prepareNoticeMarqueeTrack(track);

		if (!sourceSegment) {
			return false;
		}

		track.style.animation = 'none';
		setNoticeMarqueeTransform(track, 0);

		var singleWidth = measureNoticeMarqueeLoopDistance(sourceSegment);
		if (singleWidth <= 0) {
			return false;
		}

		wrapper.__lsNoticeMarqueeInit = true;
		wrapper.classList.add('gwd-marquee-ready');

		var state = {
			offset: 0,
			singleWidth: singleWidth,
			paused: false,
			speed: 42
		};

		wrapper.__lsNoticeMarqueeState = state;
		wrapper.__lsNoticeMarqueeTrack = track;

		if (typeof MutationObserver !== 'undefined') {
			var contentObserver = new MutationObserver(function () {
				remeasureNoticeMarqueeLoop(track, state);
			});

			contentObserver.observe(sourceSegment, {
				childList: true,
				subtree: true,
				characterData: true
			});
		}

		track.querySelectorAll('img').forEach(function (img) {
			if (img.complete) {
				return;
			}

			img.addEventListener('load', function () {
				remeasureNoticeMarqueeLoop(track, state);
			}, { once: true });
		});

		if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
			wrapper.addEventListener('mouseenter', function () {
				state.paused = true;
			});
			wrapper.addEventListener('mouseleave', function () {
				state.paused = false;
			});
		}

		function tick(ts) {
			if (!tick.last) {
				tick.last = ts;
			}

			var dt = Math.min((ts - tick.last) / 1000, 0.1);
			tick.last = ts;

			if (!state.paused) {
				state.offset -= state.speed * dt;

				while (state.offset <= -state.singleWidth) {
					state.offset += state.singleWidth;
				}

				setNoticeMarqueeTransform(track, state.offset);
			}

			requestAnimationFrame(tick);
		}

		requestAnimationFrame(tick);
		return true;
	}

	function bootLuongsonNoticeMarquee() {
		var roots = document.querySelectorAll('.luongson-notice .gwd-dynamic-html-wrapper');
		if (!roots.length) {
			return;
		}

		var attempts = 0;

		function run() {
			var pending = false;

			roots = document.querySelectorAll('.luongson-notice .gwd-dynamic-html-wrapper');
			roots.forEach(function (wrapper) {
				if (!initLuongsonNoticeMarqueeWrapper(wrapper)) {
					pending = true;
				}
			});

			if (pending && attempts < 30) {
				attempts += 1;
				setTimeout(run, 200);
			}
		}

		run();
	}

	function onReady(fn) {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', fn);
		} else {
			fn();
		}
	}

	onReady(function () {
		var noticeRoot = document.querySelector('.luongson-notice');
		bootLuongsonNoticeMarquee();
		window.addEventListener('load', bootLuongsonNoticeMarquee, { once: true });

		if (noticeRoot && typeof MutationObserver !== 'undefined') {
			var marqueeObserver = new MutationObserver(function () {
				bootLuongsonNoticeMarquee();
			});

			marqueeObserver.observe(noticeRoot, {
				childList: true,
				subtree: true
			});
		}

		var resizeTimer = 0;
		window.addEventListener('resize', function () {
			window.clearTimeout(resizeTimer);
			resizeTimer = window.setTimeout(function () {
				document.querySelectorAll('.luongson-notice .gwd-dynamic-html-wrapper').forEach(function (wrapper) {
					if (!wrapper.__lsNoticeMarqueeState) {
						return;
					}

					var track = wrapper.querySelector('.gwd-marquee-track');
					if (!track) {
						return;
					}

					remeasureNoticeMarqueeLoop(track, wrapper.__lsNoticeMarqueeState);
				});
			}, 100);
		});
	});

	function setAiPredictionMinHeight() {
		if (!document.body.classList.contains('home')) {
			return;
		}

		// Sidebar widget only — header modal also has <ai-prediction-widget>.
		var widget = document.querySelector('.home .luongson-div-2-right ai-prediction-widget');
		if (!widget) {
			return;
		}

		// Match CSS @media (min-width: 1300px).
		if (window.innerWidth < 1300) {
			widget.style.height = '';
			return;
		}

		var leftCol = document.querySelector('.home .luongson-div-2-left .col-inner');
		var rightCol = document.querySelector('.home .luongson-div-2-right .col-inner') ||
			document.querySelector('.home .luongson-div-2-right');
		var prediction = document.querySelector('.home .luongson-div-2-right .top-prediction');
		var banner = document.querySelector('.home .luongson-div-2-right .luongson-live-banner');

		var leftHeight = leftCol ? leftCol.offsetHeight : 0;
		var otherHeight = 0;

		if (prediction && !prediction.contains(widget)) {
			otherHeight += prediction.offsetHeight;
		}
		if (banner && !banner.contains(widget)) {
			otherHeight += banner.offsetHeight;
		}

		// Fallback: subtract every right-col sibling of the widget (gaps excluded).
		if (!otherHeight && rightCol) {
			Array.prototype.forEach.call(rightCol.children, function (child) {
				if (child === widget || child.contains(widget)) {
					return;
				}
				otherHeight += child.offsetHeight;
			});
		}

		var minHeight = leftHeight - otherHeight - 20;
		widget.style.height = minHeight > 0 ? minHeight + 'px' : '';
	}

	function bootAiPredictionMinHeight() {
		setAiPredictionMinHeight();
		window.addEventListener('load', setAiPredictionMinHeight, { once: true });

		var resizeTimer = 0;
		window.addEventListener('resize', function () {
			window.clearTimeout(resizeTimer);
			resizeTimer = window.setTimeout(setAiPredictionMinHeight, 100);
		});

		var leftCol = document.querySelector('.home .luongson-div-2-left .col-inner');
		if (leftCol && typeof ResizeObserver !== 'undefined') {
			var roTimer = 0;
			var leftObserver = new ResizeObserver(function () {
				window.clearTimeout(roTimer);
				roTimer = window.setTimeout(setAiPredictionMinHeight, 50);
			});
			leftObserver.observe(leftCol);
		}
	}

	onReady(bootAiPredictionMinHeight);
})();
