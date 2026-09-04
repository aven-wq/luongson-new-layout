<?php
/**
 * Top bình luận viên markup.
 *
 * @var string $img Base URL for commentator images.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="luongson-top-commentators">
	<div class="luongson-commentators-header">
		<img src="<?php echo esc_url( $img . 'svg-blv.svg' ); ?>" alt="Top commentators" />
		<div class="luongson-commentators-header__title">
			<p>Top bình luận viên</p>
		</div>
	</div>

	<div class="luongson-commentators-list">
		<div class="luongson-commentators-track">
			<div class="luongson-commentator-card is-blue">
				<div class="luongson-commentator-avatar" data-border="true">
					<div class="luongson-commentator-avatar__media">
						<img alt="Shelby" decoding="async" draggable="false" height="360" loading="lazy" src="<?php echo esc_url( $img . 'shelby.jpg' ); ?>" width="240" />
					</div>
				</div>
				<div class="luongson-commentator-info">
					<div class="luongson-commentator-info__name"><p>Shelby</p></div>
					<div class="luongson-commentator-info__meta"><p>★ 4.9 · 2.4K người theo dõi</p></div>
				</div>
				<button type="button" class="luongson-commentator-follow-btn" data-framer-name="Follow Button">
					<span class="luongson-commentator-follow-btn__label">♥️ Follow</span>
				</button>
			</div>

			<div class="luongson-commentator-card is-teal">
				<div class="luongson-commentator-avatar" data-border="true">
					<div class="luongson-commentator-avatar__media">
						<img alt="Gia Cát Lượng" decoding="async" draggable="false" height="523" loading="lazy" src="<?php echo esc_url( $img . 'gia-cat-luong.png' ); ?>" width="587" />
					</div>
				</div>
				<div class="luongson-commentator-info">
					<div class="luongson-commentator-info__name"><p>Gia Cát Lượng</p></div>
					<div class="luongson-commentator-info__meta"><p>★ 4.9 · 2.4K người theo dõi</p></div>
				</div>
				<button type="button" class="luongson-commentator-follow-btn" data-framer-name="Follow Button">
					<span class="luongson-commentator-follow-btn__label">♥️ Follow</span>
				</button>
			</div>

			<div class="luongson-commentator-card is-green">
				<div class="luongson-commentator-avatar" data-border="true">
					<div class="luongson-commentator-avatar__media">
						<img alt="Lưu Bang" decoding="async" draggable="false" height="472" loading="lazy" src="<?php echo esc_url( $img . 'luu-bang.png' ); ?>" width="400" />
					</div>
				</div>
				<div class="luongson-commentator-info">
					<div class="luongson-commentator-info__name"><p>Lưu Bang</p></div>
					<div class="luongson-commentator-info__meta"><p>★ 4.9 · 1.2K người theo dõi</p></div>
				</div>
				<button type="button" class="luongson-commentator-follow-btn" data-framer-name="Follow Button">
					<span class="luongson-commentator-follow-btn__label">♥️ Follow</span>
				</button>
			</div>
		</div>
	</div>
</div>
