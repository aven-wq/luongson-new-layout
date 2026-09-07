jQuery(function ($) {
	function initLuongsonNoticeMarquee() {
		document.querySelectorAll('.luongson-notice .gwd-dynamic-html-wrapper').forEach(function (wrapper) {
			if (wrapper.querySelector('.gwd-marquee-track')) {
				return;
			}

			var track = document.createElement('div');
			track.className = 'gwd-marquee-track';

			while (wrapper.firstChild) {
				track.appendChild(wrapper.firstChild);
			}

			wrapper.appendChild(track);
		});
	}

	initLuongsonNoticeMarquee();
	$(window).on('load', initLuongsonNoticeMarquee);

	if (typeof MutationObserver !== 'undefined') {
		var marqueeObserver = new MutationObserver(function () {
			initLuongsonNoticeMarquee();
		});

		marqueeObserver.observe(document.body, {
			childList: true,
			subtree: true
		});
	}

	function setAiPredictionMinHeight() {
		var $widget = $('.home ai-prediction-widget');
		if (!$widget.length) {
			return;
		}

		if (window.innerWidth <= 1300) {
			$widget.css('height', auto);
			return;
		}

		var leftHeight = $('.home .luongson-div-2-left .col-inner').outerHeight() || 0;
		var predictionHeight = $('.home .luongson-div-2-right .top-prediction').outerHeight() || 0;
		var bannerHeight = $('.home .luongson-div-2-right .luongson-live-banner').outerHeight() || 0;
		var minHeight = leftHeight - predictionHeight - bannerHeight - 20;

		$widget.css('height', minHeight > 0 ? minHeight + 'px' : '');
	}

	setAiPredictionMinHeight();
	$(window).on('load resize', setAiPredictionMinHeight);
});
