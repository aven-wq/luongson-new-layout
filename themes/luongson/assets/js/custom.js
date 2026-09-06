jQuery(function ($) {
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
