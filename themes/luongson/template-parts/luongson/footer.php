<?php
/**
 * Site footer.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

$logo           = luongson_get_site_logo();
$logo_url       = $logo ? $logo['url'] : '';
$logo_w         = $logo ? $logo['width'] : 600;
$logo_h         = $logo ? $logo['height'] : 142;
$footer_content   = luongson_get_footer_content();
$ambassador_seo   = luongson_get_ambassador_seo_content();
$ambassador_image = luongson_get_ambassador_seo_image_attrs();
?>

<div class="framer-1y11z59 luongson-ambassador-seo-section">
	<div class="framer-1th9ham luongson-ambassador-block">
		<div class="framer-s44gus">
			<div class="framer-1y0t7xv ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s162" dir="auto"><?php echo esc_html( $ambassador_seo['title'] ); ?></p></div>
			<div class="framer-1p5kmug ls-s26" data-framer-component-type="RichTextContainer">
				<?php
				echo wp_kses_post(
					luongson_format_footer_rich_text(
						$ambassador_seo['description'],
						'ls-s163'
					)
				);
				?>
			</div>
		</div>
		<?php if ( $ambassador_image ) : ?>
		<div class="ssr-variant">
			<div class="framer-y3mx44" data-framer-name="Image">
				<div class="ls-s4" data-framer-background-image-wrapper="true">
					<img
						class="ls-s164"
						alt="<?php echo esc_attr( $ambassador_image['alt'] ); ?>"
						decoding="auto"
						height="<?php echo esc_attr( (string) $ambassador_image['height'] ); ?>"
						loading="lazy"
						sizes="<?php echo esc_attr( $ambassador_image['sizes'] ); ?>"
						src="<?php echo esc_url( $ambassador_image['src'] ); ?>"
						<?php if ( ! empty( $ambassador_image['srcset'] ) ) : ?>
						srcset="<?php echo esc_attr( $ambassador_image['srcset'] ); ?>"
						<?php endif; ?>
						width="<?php echo esc_attr( (string) $ambassador_image['width'] ); ?>"
					/>
				</div>
			</div>
		</div>
		<?php endif; ?>
	</div>
	<div class="framer-1p0eiqb luongson-seo-block" data-framer-name="Block SEO" data-hide-scrollbars="true">
		<div class="framer-9y2ron">
			<?php echo wp_kses_post( $ambassador_seo['seo_content'] ); ?>
		</div>
	</div>
</div>

<div class="framer-i8gs3c-container luongson-footer">
	<div class="framer-MvKn2 framer-bk5noi framer-v-bk5noi ls-s166" data-framer-name="Variant 1">
		<div class="framer-11ith8a ls-s6 luongson-footer-content" data-framer-name="Nội dung Footer">
			<div class="framer-1edc2lu ls-s6" data-framer-name="Menu LS">
				<div class="framer-15go9be ls-s6" data-framer-name="Logo">
					<div class="ls-s4" data-framer-background-image-wrapper="true">
						<?php if ( $logo_url ) : ?>
						<img class="ls-s5" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" decoding="auto" height="<?php echo esc_attr( $logo_h ); ?>" width="<?php echo esc_attr( $logo_w ); ?>" loading="lazy" src="<?php echo esc_url( $logo_url ); ?>" />
						<?php endif; ?>
					</div>
				</div>
			</div>
			<div class="framer-tbtyc1 ls-s6" data-framer-name="Giới thiệu">
				<div class="framer-elwd3r ls-s167" data-framer-component-type="RichTextContainer" data-framer-name="Tiêu đề Footer">
					<h2 class="framer-text ls-s168" dir="auto"><?php echo esc_html( $footer_content['intro_title'] ); ?></h2>
				</div>
				<div class="framer-mnehk6 ls-s169 luongson-footer-rich-text luongson-footer-rich-text--intro" data-framer-component-type="RichTextContainer" data-framer-name="Mô tả">
					<?php
					echo wp_kses_post(
						luongson_format_footer_rich_text(
							$footer_content['intro_description'],
							'ls-s170'
						)
					);
					?>
				</div>
			</div>
			<div class="framer-1f6jmnw ls-s171 luongson-footer-sponsors" data-border="true" data-framer-name="Nhà tài trợ">
				<div class="framer-3aed5t ls-s172" data-framer-component-type="RichTextContainer" data-framer-name="Nhãn Nhà tài trợ">
					<h3 class="framer-text ls-s173" dir="auto">ĐỐI TÁC &amp; NHÀ TÀI TRỢ</h3>
				</div>
				<div class="framer-35hpbh ls-s174" data-framer-name="Logo Nhà tài trợ" draggable="false">
					<ul class="ls-s175">
						<?php echo luongson_get_sponsor_ticker_items_html(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</ul>
				</div>
			</div>
			<div class="framer-16lrusw ls-s6 luongson-footer-info" data-framer-name="Thông tin Footer">
				<div class="framer-n1onuo ls-s6" data-framer-name="Địa chỉ">
					<div class="framer-183na5w ls-s6" data-framer-name="Tiêu đề Địa chỉ">
						<svg class="framer-qQVrM framer-11wbq6j ls-s176" role="presentation" viewBox="0 0 24 24">
							<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
						</svg>
						<div class="framer-stxi73 ls-s177" data-framer-component-type="RichTextContainer">
							<h3 class="framer-text ls-s178" dir="auto">ĐỊA CHỈ LIÊN HỆ</h3>
						</div>
					</div>
					<div class="framer-1cry8qw ls-s179 luongson-footer-rich-text luongson-footer-rich-text--info" data-framer-component-type="RichTextContainer">
						<?php
						echo wp_kses_post(
							luongson_format_footer_rich_text(
								$footer_content['contact_content'],
								'ls-s180',
								array( 'ls-s180', 'ls-s181' )
							)
						);
						?>
					</div>
				</div>
				<div class="framer-1w9dy4s ls-s6 luongson-footer-disclaimer" data-framer-name="Miễn trừ trách nhiệm">
					<div class="framer-132mdyl ls-s6" data-framer-name="Tiêu đề Miễn trừ">
						<svg class="framer-RfWXp framer-qql6d4 ls-s176" role="presentation" viewBox="0 0 24 24">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
							<path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
						<div class="framer-d41qj ls-s177" data-framer-component-type="RichTextContainer">
							<h3 class="framer-text ls-s178" dir="auto">MIỄN TRỪ TRÁCH NHIỆM</h3>
						</div>
					</div>
					<div class="framer-1fyyc0t ls-s182 luongson-footer-rich-text luongson-footer-rich-text--info" data-framer-component-type="RichTextContainer">
						<?php
						echo wp_kses_post(
							luongson_format_footer_rich_text(
								$footer_content['disclaimer_content'],
								'ls-s180'
							)
						);
						?>
					</div>
				</div>
			</div>
			<div class="framer-q8zpn5 ls-s183 luongson-footer-copyright" data-border="true" data-framer-name="Bản quyền">
				<div class="framer-1x4mo7v ls-s184" data-framer-component-type="RichTextContainer">
					<p class="framer-text ls-s185" dir="auto">&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php echo esc_html( get_bloginfo( 'name' ) ); ?>. Bảo lưu mọi quyền.</p>
				</div>
			</div>
		</div>
	</div>
</div>
