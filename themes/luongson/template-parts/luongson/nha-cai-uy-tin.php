<?php
/**
 * Top Nhà Cái Uy Tín block.
 *
 * @package LuongSon
 *
 * @var array{items: array<int, array<string, string>>, cta: string} $args
 */

defined( 'ABSPATH' ) || exit;

$items = isset( $args['items'] ) && is_array( $args['items'] ) ? $args['items'] : array();
$cta   = isset( $args['cta'] ) ? (string) $args['cta'] : __( 'Cược ngay', 'luongson' );
$total = count( $items );

if ( 0 === $total ) {
	return;
}
?>
<div class="framer-1lnj4y4-container luongson-top-bookmakers">
	<div class="framer-WnCbM framer-jomkig framer-v-jomkig ls-s61" data-framer-name="Variant 1">
		<div class="framer-11vqsuc ls-s6" data-framer-name="Frame 5">
			<div class="framer-12yjqms ls-s62" data-framer-component-type="RichTextContainer" data-framer-name="Top"><p class="framer-text ls-s63"><span class="framer-text ls-s64">Top</span></p></div>
			<div class="framer-b9mrqv ls-s65" data-framer-component-type="RichTextContainer" data-framer-name="nhà cái"><p class="framer-text ls-s66"><span class="framer-text ls-s67">nhà cái</span></p></div>
			<div class="framer-gg6s9k ls-s68" data-framer-component-type="RichTextContainer" data-framer-name="uy tín"><p class="framer-text ls-s63"><span class="framer-text ls-s69" data-text-fill="true"><span class="framer-text ls-s70">uy tín</span></span></p></div>
			<div class="framer-yvgt5m ls-s71">
				<div aria-hidden="true" class="framer-xktb8h ls-s72" data-framer-component-type="SVG" data-framer-name="Star 1">
					<div class="svgContainer ls-s73">
						<svg class="ls-s74" height="100%" preserveAspectRatio="none" viewBox="0 0 21 21" width="100%">
							<path d="M10.5 1l2.936 5.949 6.564.954-4.75 4.63 1.121 6.538-5.871-3.087-5.871 3.087 1.121-6.538-4.75-4.63 6.564-.954L10.5 1z" fill="#FF2323" />
						</svg>
					</div>
				</div>
			</div>
		</div>
		<div class="framer-wpr0vp ls-s6 luongson-bookmakers-ticker" data-framer-name="Frame 7">
			<div class="framer-czcwzc ls-s75" data-framer-name="Brand" data-hide-scrollbars="true" draggable="false">
				<ul class="ls-s76">
					<?php foreach ( $items as $index => $item ) : ?>
						<?php
						$position  = $index + 1;
						$item_class = $index < 2 ? 'ls-s77' : 'ls-s25';
						$href      = $item['href'] ?? '';
						$icon      = $item['icon'] ?? '';
						$alt       = $item['alt'] ?? '';
						$code      = $item['code'] ?? '';
						?>
						<li aria-hidden="false" aria-posinset="<?php echo esc_attr( (string) $position ); ?>" aria-setsize="<?php echo esc_attr( (string) $total ); ?>" class="ticker-item <?php echo esc_attr( $item_class ); ?>">
							<?php if ( $href ) : ?>
							<a class="framer-14efk8f ls-s78 luongson-bookmaker-item-link" data-framer-name="Frame 6" href="<?php echo esc_url( $href ); ?>" target="_blank" rel="nofollow noopener" data-code="<?php echo esc_attr( $code ); ?>">
								<div class="framer-1agm7zv ls-s79" data-border="true" data-framer-name="Logo">
									<div class="framer-1qel9h2 ls-s80" data-framer-name="Logo">
										<div class="framer-1mxabhp ls-s78" draggable="false">
											<div class="ls-s4" data-framer-background-image-wrapper="true">
												<?php if ( $icon ) : ?>
													<img class="ls-s5" alt="<?php echo esc_attr( $alt ); ?>" decoding="auto" draggable="false" loading="lazy" src="<?php echo esc_url( $icon ); ?>" />
												<?php endif; ?>
											</div>
										</div>
									</div>
								</div>
								<div class="framer-17nafjs ls-s81" data-framer-name="Logo">
									<div class="framer-1c4pzc4 ls-s82" data-framer-component-type="RichTextContainer" data-framer-name="Cược ngay">
										<p class="framer-text ls-s83" dir="auto"><?php echo esc_html( $cta ); ?></p>
									</div>
								</div>
							</a>
							<?php else : ?>
							<div class="framer-14efk8f ls-s78" data-framer-name="Frame 6">
								<div class="framer-1agm7zv ls-s79" data-border="true" data-framer-name="Logo">
									<div class="framer-1qel9h2 ls-s80" data-framer-name="Logo">
										<div class="framer-1mxabhp ls-s78" draggable="false">
											<div class="ls-s4" data-framer-background-image-wrapper="true">
												<?php if ( $icon ) : ?>
													<img class="ls-s5" alt="<?php echo esc_attr( $alt ); ?>" decoding="auto" draggable="false" loading="lazy" src="<?php echo esc_url( $icon ); ?>" />
												<?php endif; ?>
											</div>
										</div>
									</div>
								</div>
								<div class="framer-17nafjs ls-s81" data-framer-name="Logo">
									<div class="framer-1c4pzc4 ls-s82" data-framer-component-type="RichTextContainer" data-framer-name="Cược ngay">
										<p class="framer-text ls-s83" dir="auto"><?php echo esc_html( $cta ); ?></p>
									</div>
								</div>
							</div>
							<?php endif; ?>
						</li>
					<?php endforeach; ?>
				</ul>
			</div>
		</div>
	</div>
</div>
