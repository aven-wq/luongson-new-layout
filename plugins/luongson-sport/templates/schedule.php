<?php
/**
 * Match schedule markup ("Lịch thi đấu Bóng Đá hôm nay").
 *
 * @var string $img Base URL for match images.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$row = LUONGSON_SPORT_DIR . 'templates/partials/schedule-match-row.php';
?>
<div class="luongson-schedule">
	<div class="framer-6nzkg">
		<div class="ssr-variant">
			<div class="framer-y7mzqb ls-ltd-s8" data-framer-component-type="RichTextContainer">
				<p class="framer-text ls-ltd-s46" dir="auto">Lịch thi đấu Bóng Đá hôm nay mới nhất 24h</p>
			</div>
		</div>
		<div class="framer-rtjghz">
			<button
				aria-label="Ngày trước"
				class="framer-1j0wurm"
				data-border="true"
				data-framer-name="Previous Day"
				type="button"
			>
				<div class="framer-y4X00 framer-18697ez"></div>
			</button>
			<button
				aria-label="Chọn ngày"
				class="framer-fxofsc"
				data-framer-name="Date Picker"
				type="button"
			>
				<div class="framer-deoUy framer-t5wzon"></div>
				<div class="framer-q65yhr ls-ltd-s8" data-framer-component-type="RichTextContainer">
					<p class="framer-text ls-ltd-s47 luongson-schedule__date-label" dir="auto">Hôm nay, 31/07</p>
				</div>
			</button>
			<button
				aria-label="Ngày sau"
				class="framer-1r6vwl8"
				data-border="true"
				data-framer-name="Next Day"
				type="button"
			>
				<div class="framer-Jde4M framer-e8q5vt"></div>
			</button>
		</div>
	</div>

	<?php
	for ( $i = 0; $i < 5; $i++ ) {
		include $row;
	}
	?>
</div>
