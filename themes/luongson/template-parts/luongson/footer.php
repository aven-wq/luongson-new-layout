<?php
/**
 * Site footer.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

$logo_url = luongson_asset_url( 'images/8suNKBFdLKs23ISzr0C36SqrXFU_8543fca5.png?width=600&height=142' );
?>
<div class="framer-i8gs3c-container luongson-footer">
	<div class="framer-MvKn2 framer-bk5noi framer-v-bk5noi ls-s166" data-framer-name="Variant 1">
		<div class="framer-11ith8a ls-s6 luongson-footer-content" data-framer-name="Nội dung Footer">
			<div class="framer-1edc2lu ls-s6" data-framer-name="Menu LS">
				<div class="framer-15go9be ls-s6" data-framer-name="Logo">
					<div class="ls-s4" data-framer-background-image-wrapper="true">
						<img class="ls-s5" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" decoding="auto" height="142" width="600" loading="lazy" src="<?php echo esc_url( $logo_url ); ?>" />
					</div>
				</div>
			</div>
			<div class="framer-tbtyc1 ls-s6" data-framer-name="Giới thiệu">
				<div class="framer-elwd3r ls-s167" data-framer-component-type="RichTextContainer" data-framer-name="Tiêu đề Footer">
					<h2 class="framer-text ls-s168" dir="auto">LƯƠNG SƠN TV — XEM BÓNG ĐÁ TRỰC TIẾP MIỄN PHÍ</h2>
				</div>
				<div class="framer-mnehk6 ls-s169" data-framer-component-type="RichTextContainer" data-framer-name="Mô tả">
					<p class="framer-text ls-s170" dir="auto">Lương Sơn TV mang đến trải nghiệm xem bóng đá trực tiếp miễn phí với lịch thi đấu, tỷ số và thông tin trận đấu được cập nhật liên tục. Chúng tôi ưu tiên tốc độ, sự thuận tiện và khả năng theo dõi các giải đấu nổi bật trên nhiều thiết bị.</p>
				</div>
			</div>
			<div class="framer-1f6jmnw ls-s171 luongson-footer-sponsors" data-border="true" data-framer-name="Nhà tài trợ">
				<div class="framer-3aed5t ls-s172" data-framer-component-type="RichTextContainer" data-framer-name="Nhãn Nhà tài trợ">
					<h3 class="framer-text ls-s173" dir="auto">ĐỐI TÁC &amp; NHÀ TÀI TRỢ</h3>
				</div>
				<div class="framer-35hpbh ls-s174" data-framer-name="Logo Nhà tài trợ" draggable="false">
					<ul class="ls-s175">
						<?php
						/**
						 * Filter sponsor logos HTML for footer ticker.
						 * Default: empty — add markup via child theme or plugin.
						 */
						echo apply_filters( 'luongson_footer_sponsor_items', '' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						?>
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
					<div class="framer-1cry8qw ls-s179" data-framer-component-type="RichTextContainer">
						<p class="framer-text ls-s180" dir="auto">Lương Sơn TV — Trung tâm nội dung thể thao trực tuyến. Liên hệ hỗ trợ và hợp tác qua các kênh chính thức được công bố trên website.</p>
						<p class="framer-text ls-s181" dir="auto">Địa chỉ: Số 99 Nguyễn Chánh, Hà Nội</p>
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
					<div class="framer-1fyyc0t ls-s182" data-framer-component-type="RichTextContainer">
						<p class="framer-text ls-s180" dir="auto">Lương Sơn TV không sở hữu bản quyền các nội dung phát sóng từ bên thứ ba. Website chỉ tổng hợp và cung cấp thông tin tham khảo; người dùng tự chịu trách nhiệm khi truy cập các liên kết bên ngoài và cần tuân thủ quy định pháp luật tại nơi cư trú.</p>
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
