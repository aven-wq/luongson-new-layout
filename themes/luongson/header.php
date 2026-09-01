<?php
/**
 * Theme header — custom LuongSon layout shell.
 *
 * @package LuongSon
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?> class="framer-body">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<link rel="profile" href="https://gmpg.org/xfn/11" />
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'framer-body' ); ?>>
<?php wp_body_open(); ?>

<a class="skip-link screen-reader-text" href="#main"><?php esc_html_e( 'Skip to content', 'luongson' ); ?></a>

<div id="luongson-site-root" class="framer-wh6HR framer-djfypk ls-s1" data-framer-root="">
	<?php get_template_part( 'template-parts/luongson/sidebar' ); ?>
	<?php get_template_part( 'template-parts/luongson/mobile-header' ); ?>

	<div class="framer-1llbnyo luongson-main-layout" data-framer-name="Main Split Layout">
		<div class="framer-10rzk9d luongson-sidebar-spacer" data-framer-name="Sidebar Spacer"></div>
		<div class="framer-1rvbi9f luongson-main-content" data-framer-name="Right Content">
			<main id="main" class="luongson-page-main">
