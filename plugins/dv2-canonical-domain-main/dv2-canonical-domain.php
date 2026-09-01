<?php
/**
 * Plugin Name: DV2 Canonical Domain
 * Description: Cấu hình canonical và alternate link giữa domain PC và Mobile cho Rank Math SEO.
 * Version: 1.0.1
 * Author: DV2
 * Text Domain: dv2-canonical-domain
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'DV2_CANONICAL_DOMAIN_VERSION', '1.0.1' );
define( 'DV2_CANONICAL_DOMAIN_FILE', __FILE__ );
define( 'DV2_CANONICAL_DOMAIN_PATH', plugin_dir_path( __FILE__ ) );

require_once DV2_CANONICAL_DOMAIN_PATH . 'includes/class-dv2-canonical-domain-admin.php';
require_once DV2_CANONICAL_DOMAIN_PATH . 'includes/class-dv2-canonical-domain.php';
require_once DV2_CANONICAL_DOMAIN_PATH . 'includes/class-dv2-set-vn.php';
require_once DV2_CANONICAL_DOMAIN_PATH . 'includes/class-dv2-async-script.php';

DV2_Canonical_Domain_Admin::init();
DV2_Canonical_Domain::init();
DV2_Set_Vn::init();
DV2_Async_Script::init();
