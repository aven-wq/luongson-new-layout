<?php
/**
 * BLV recruitment registration form.
 *
 * @package LuongSon
 *
 * @var array{
 *     title: string,
 *     description: string,
 *     submit_label: string,
 *     form_id: string
 * } $args
 */

defined( 'ABSPATH' ) || exit;

$title         = isset( $args['title'] ) ? (string) $args['title'] : __( 'ĐĂNG KÝ THÔNG TIN', 'luongson' );
$description   = isset( $args['description'] ) ? (string) $args['description'] : __( 'Hãy điền đầy đủ thông tin dưới đây. Ban nhân sự sẽ liên hệ với các ứng viên phù hợp trong vòng 3 ngày làm việc.', 'luongson' );
$submit_label  = isset( $args['submit_label'] ) ? (string) $args['submit_label'] : __( 'ĐĂNG KÝ NGAY', 'luongson' );
$form_id       = isset( $args['form_id'] ) ? (string) $args['form_id'] : 'luongson-blv-form';
$card_id       = isset( $args['card_id'] ) ? (string) $args['card_id'] : 'blv';
?>
<form
	class="luongson-blv-form"
	id="<?php echo esc_attr( $form_id ); ?>"
	method="post"
	novalidate
>
	<?php wp_nonce_field( 'luongson_blv_form', 'luongson_blv_nonce', false ); ?>
	<input type="hidden" name="action" value="luongson_blv_form_submit" />
	<div class="luongson-blv-form__honeypot" aria-hidden="true">
		<label for="<?php echo esc_attr( $form_id ); ?>-website"><?php esc_html_e( 'Website', 'luongson' ); ?></label>
		<input
			type="text"
			id="<?php echo esc_attr( $form_id ); ?>-website"
			name="blv_website"
			value=""
			tabindex="-1"
			autocomplete="off"
		/>
	</div>

	<div class="framer-13hj6qu luongson-blv-form__card" data-framer-name="form-card" id="<?php echo esc_attr( $card_id ); ?>">
		<div class="framer-1pr8gw5" data-framer-name="Frame">
			<div
				class="framer-tez0qv ls-ut-s14"
				data-framer-name="<?php echo esc_attr( $title ); ?>"
				data-framer-component-type="RichTextContainer"
			>
				<p dir="auto" class="framer-text ls-ut-s30"><?php echo esc_html( $title ); ?></p>
			</div>
			<div
				class="framer-1kax9ik ls-ut-s14"
				data-framer-name="<?php echo esc_attr( wp_strip_all_tags( $description ) ); ?>"
				data-framer-component-type="RichTextContainer"
			>
				<p dir="auto" class="framer-text ls-ut-s31"><?php echo esc_html( $description ); ?></p>
			</div>
		</div>

		<div class="luongson-blv-form__message" role="status" aria-live="polite" hidden></div>

		<div class="framer-gk9uac" data-framer-name="Frame">
			<div class="framer-zk4nir" data-framer-name="form-input">
				<div class="framer-1bvsrb9" data-framer-name="Frame">
					<div
						class="framer-1jazhf5 ls-ut-s14"
						data-framer-name="<?php esc_attr_e( 'Họ và tên', 'luongson' ); ?>"
						data-framer-component-type="RichTextContainer"
					>
						<p dir="auto" class="framer-text ls-ut-s32"><?php esc_html_e( 'Họ và tên', 'luongson' ); ?></p>
					</div>
					<div class="framer-1jppb2w ls-ut-s14" data-framer-name="*" data-framer-component-type="RichTextContainer">
						<p dir="auto" class="framer-text ls-ut-s33">*</p>
					</div>
				</div>
				<div class="framer-1fzhf0i" data-framer-name="input-field">
					<div
						class="framer-form-text-input framer-form-input-wrapper framer-d0m4ek framer-form-text-input-type"
						data-framer-name="Search Input"
					>
						<input
							type="text"
							id="<?php echo esc_attr( $form_id ); ?>-full-name"
							name="full_name"
							placeholder="<?php esc_attr_e( 'Nhập đầy đủ họ và tên của bạn', 'luongson' ); ?>"
							class="framer-form-input framer-form-input-empty"
							value=""
							required
							autocomplete="name"
						/>
					</div>
				</div>
			</div>

			<div class="framer-yv5fav" data-framer-name="form-input">
				<div class="framer-r6ouee" data-framer-name="Frame">
					<div
						class="framer-1pqass9 ls-ut-s14"
						data-framer-name="<?php esc_attr_e( 'Số điện thoại', 'luongson' ); ?>"
						data-framer-component-type="RichTextContainer"
					>
						<p dir="auto" class="framer-text ls-ut-s32"><?php esc_html_e( 'Số điện thoại', 'luongson' ); ?></p>
					</div>
					<div class="framer-1lzg7ss ls-ut-s14" data-framer-name="*" data-framer-component-type="RichTextContainer">
						<p dir="auto" class="framer-text ls-ut-s33">*</p>
					</div>
				</div>
				<div class="framer-mif926" data-framer-name="input-field">
					<div
						class="framer-form-text-input framer-form-input-wrapper framer-1abvby9"
						data-framer-name="Search Input"
					>
						<input
							type="tel"
							id="<?php echo esc_attr( $form_id ); ?>-phone"
							name="phone"
							placeholder="<?php esc_attr_e( 'Nhập số điện thoại liên hệ', 'luongson' ); ?>"
							class="framer-form-input framer-form-input-empty"
							value=""
							required
							autocomplete="tel"
						/>
					</div>
				</div>
			</div>

			<div class="framer-15jnhls" data-framer-name="form-input">
				<div class="framer-su7dp6" data-framer-name="Frame">
					<div
						class="framer-1dtoa8g ls-ut-s14"
						data-framer-name="Email"
						data-framer-component-type="RichTextContainer"
					>
						<p dir="auto" class="framer-text ls-ut-s32"><?php esc_html_e( 'Email', 'luongson' ); ?></p>
					</div>
					<div class="framer-1jw19be ls-ut-s14" data-framer-name="*" data-framer-component-type="RichTextContainer">
						<p dir="auto" class="framer-text ls-ut-s33">*</p>
					</div>
				</div>
				<div class="framer-k4qd56" data-framer-name="input-field">
					<div
						class="framer-form-text-input framer-form-input-wrapper framer-1693acn"
						data-framer-name="Search Input"
					>
						<input
							type="email"
							id="<?php echo esc_attr( $form_id ); ?>-email"
							name="email"
							placeholder="<?php esc_attr_e( 'Nhập địa chỉ email của bạn', 'luongson' ); ?>"
							class="framer-form-input framer-form-input-empty"
							value=""
							required
							autocomplete="email"
						/>
					</div>
				</div>
			</div>

			<div class="framer-181u3wa" data-framer-name="form-textarea">
				<div class="framer-cx80yj" data-framer-name="Frame">
					<div
						class="framer-1u1lw35 ls-ut-s14"
						data-framer-name="<?php esc_attr_e( 'Kinh nghiệm bình luận', 'luongson' ); ?>"
						data-framer-component-type="RichTextContainer"
					>
						<p dir="auto" class="framer-text ls-ut-s32"><?php esc_html_e( 'Kinh nghiệm bình luận', 'luongson' ); ?></p>
					</div>
					<div class="framer-owq3qs ls-ut-s14" data-framer-name="*" data-framer-component-type="RichTextContainer">
						<p dir="auto" class="framer-text ls-ut-s33">*</p>
					</div>
				</div>
				<div class="framer-1bombku" data-framer-name="textarea-field">
					<div
						class="framer-form-text-input framer-form-input-wrapper framer-6y4hps framer-form-textarea-input-type"
						data-framer-name="Search Input"
					>
						<textarea
							id="<?php echo esc_attr( $form_id ); ?>-experience"
							name="experience"
							placeholder="<?php esc_attr_e( 'Mô tả ngắn gọn kinh nghiệm bình luận hoặc các dự án thể thao bạn từng tham gia...', 'luongson' ); ?>"
							class="framer-form-input"
							required
						></textarea>
					</div>
				</div>
			</div>
		</div>

		<button type="submit" class="framer-ai6nli luongson-blv-form__submit" data-framer-name="submit-button">
			<span
				class="framer-gsl2dx ls-ut-s14"
				data-framer-name="<?php echo esc_attr( $submit_label ); ?>"
				data-framer-component-type="RichTextContainer"
			>
				<span dir="auto" class="framer-text ls-ut-s21"><?php echo esc_html( $submit_label ); ?></span>
			</span>
		</button>
	</div>
</form>
