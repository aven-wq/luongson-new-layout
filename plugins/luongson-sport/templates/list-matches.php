<?php
/**
 * Live matches list markup ("Đang phát sóng").
 *
 * @var string $img Base URL for match images.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$card = LUONGSON_SPORT_DIR . 'templates/partials/match-card.php';
?>
<div class="luongson-list-matches">
	<div class="luongson-list-matches__header">
		<span class="luongson-list-matches__live-dot" aria-hidden="true"></span>
		<h2 class="luongson-list-matches__title">Đang phát sóng</h2>
	</div>

	<div class="luongson-live-grid">
		<?php
		for ( $i = 0; $i < 6; $i++ ) {
			include $card;
		}
		?>

		<div class="luongson-live-ads" data-framer-name="Ads">
			<a class="luongson-live-ad" href="#">
				<img alt="" decoding="async" height="200" src="<?php echo esc_url( $img . 'ViT7ao3HygkYxpd18HxMZ7J8Xg_aeeeed03.png' ); ?>" width="1572" />
			</a>
			<a class="luongson-live-ad" href="#">
				<img alt="" decoding="async" height="180" src="<?php echo esc_url( $img . 'Zb2hW4nkvPuYMPWvi0DWT9DMZus_14af5193.png' ); ?>" width="1456" />
			</a>
			<a class="luongson-live-ad luongson-live-ad--wide" href="#">
				<img alt="" decoding="async" height="200" src="<?php echo esc_url( $img . '8j10V9okmTsSFcWZ0yrFXX1Lw_1196fab1.png' ); ?>" width="1572" />
			</a>
		</div>

		<?php
		for ( $i = 0; $i < 6; $i++ ) {
			include $card;
		}
		?>
	</div>
</div>
