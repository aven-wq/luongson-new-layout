<?php
/**
 * Plugin Name: DV2 Streaming Plugin
 * Plugin URI: https://wp.dep2.vip/dv2-streaming-plugin
 * Description: A comprehensive streaming plugin with streaming shortcodes and custom layouts.
 * Version: 2.0.5
 * Author: DEV2
 * Author URI: https://wp.dev2.vip
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: dv2-streaming
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

// Define plugin constants
define('DV2_STREAMING_VERSION', '2.0.5');
define('DV2_STREAMING_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('DV2_STREAMING_PLUGIN_URL', plugin_dir_url(__FILE__));
define('DV2_STREAMING_PLUGIN_FILE', __FILE__);

// Include required files
require_once DV2_STREAMING_PLUGIN_DIR . 'define.php';
require_once DV2_STREAMING_PLUGIN_DIR . 'includes/class-shortcodes.php';
require_once DV2_STREAMING_PLUGIN_DIR . 'includes/class-url-rewrite.php';
require_once DV2_STREAMING_PLUGIN_DIR . 'includes/class-optimized-perf-lighthouse.php';
require_once DV2_STREAMING_PLUGIN_DIR . 'includes/class-assets-loader.php';
require_once DV2_STREAMING_PLUGIN_DIR . 'includes/class-tvc-s3-uploader.php';
require_once DV2_STREAMING_PLUGIN_DIR . 'includes/class-settings.php';
require_once DV2_STREAMING_PLUGIN_DIR . 'includes/class-help-page.php';
require_once DV2_STREAMING_PLUGIN_DIR . 'includes/class-stream-hot-18.php';

/**
 * Main Plugin Class
 */
class DV2_Streaming_Plugin {
    
    private static $instance = null;
    
    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
        $this->init_components();
    }
    
    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        add_action('init', array($this, 'load_textdomain'));
    }
    
    /**
     * Initialize plugin components
     */
    private function init_components() {
        // Initialize shortcodes
        DV2_Shortcodes::get_instance();
        
        // Initialize URL rewrite
        DV2_URL_Rewrite::get_instance();

        // Lighthouse / PageSpeed helpers (before assets)
        DV2_Optimized_Perf_Lighthouse::get_instance();
        
        // Initialize assets loader
        DV2_Assets_Loader::get_instance();
        
        // Initialize settings
        DV2_Settings::get_instance();
        
        // Initialize help page
        DV2_Help_Page::get_instance();

        // HOT18 live redirect (/tructiephotlink)
        DV2_Stream_Hot_18::get_instance();
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Initialize components to register rewrite rules
        DV2_URL_Rewrite::get_instance();
        DV2_Stream_Hot_18::get_instance();
        
        // Enable pretty permalinks if not already enabled
        $this->enable_permalinks();
        
        // Create default pages
        $this->create_default_pages();
        
        // Flush rewrite rules after everything is registered
        flush_rewrite_rules();
        
        // Clear legacy API sync cron if present
        $timestamp = wp_next_scheduled('dv2_streaming_sync_api');
        if ($timestamp) {
            wp_unschedule_event($timestamp, 'dv2_streaming_sync_api');
        }
    }
    
    /**
     * Enable pretty permalinks if not already enabled
     */
    private function enable_permalinks() {
        $permalink_structure = get_option('permalink_structure');
        
        // If permalinks are not set or using default, set to post name
        if (empty($permalink_structure)) {
            update_option('permalink_structure', '/%postname%/');
            update_option('rewrite_rules', false);
        }
    }
    
    /**
     * Create default pages on activation
     */
    private function create_default_pages() {
        // Check if homepage exists
        $homepage = get_page_by_path('dv2-trang-chu');
        if (!$homepage) {
            $homepage_content = '[danh_sach_featured_video count="5" layout="socolive"]' . "\n\n" .
                               '[danh_sach_blv_hot count="10" layout="socolive"]' . "\n\n" .
                               '[danh_sach_video_hot count="8" layout="socolive"]' . "\n\n"
                               ;
            
            $homepage_id = wp_insert_post(array(
                'post_title'    => 'Trang chủ',
                'post_name'     => 'dv2-trang-chu',
                'post_content'  => $homepage_content,
                'post_status'   => 'publish',
                'post_type'     => 'page',
                'post_author'   => 1,
            ));
            
            if ($homepage_id) {
                update_option('dv2_homepage_id', $homepage_id);
                // Optionally set as front page
                // update_option('page_on_front', $homepage_id);
                // update_option('show_on_front', 'page');
            }
        }
        
        // Check if lich-thi-dau page exists
        $schedule_page = get_page_by_path('lich-thi-dau');
        if (!$schedule_page) {
            $schedule_content = '[lich_truc_tiep layout="socolive"]' . "\n\n"
                               ;
            
            $schedule_page_id = wp_insert_post(array(
                'post_title'    => 'Lịch thi đấu',
                'post_name'     => 'lich-thi-dau',
                'post_content'  => $schedule_content,
                'post_status'   => 'publish',
                'post_type'     => 'page',
                'post_author'   => 1,
            ));
            
            if ($schedule_page_id) {
                update_option('dv2_schedule_page_id', $schedule_page_id);
            }
        }
        
        // Check if /streams page exists
        $streams_page = get_page_by_path('streams');
        if (!$streams_page) {
            $streams_page_id = wp_insert_post(array(
                'post_title'    => 'Streams',
                'post_name'     => 'streams',
                'post_content'  => '[stream_detail layout="socolive"]',
                'post_status'   => 'publish',
                'post_type'     => 'page',
                'post_author'   => 1,
            ));
            
            if ($streams_page_id) {
                update_option('dv2_streams_page_id', $streams_page_id);
            }
        }
        
        // Check if /highlights page exists
        $highlights_page = get_page_by_path('highlights');
        if (!$highlights_page) {
            $highlights_page_id = wp_insert_post(array(
                'post_title'    => 'Highlights mới nhất',
                'post_name'     => 'highlights',
                'post_content'  => '[highlights_moi_nhat count="20" layout="socolive"]',
                'post_status'   => 'publish',
                'post_type'     => 'page',
                'post_author'   => 1,
            ));
            
            if ($highlights_page_id) {
                update_option('dv2_highlights_page_id', $highlights_page_id);
            }
        }
        
        // Check if ket-qua-hom-nay page exists
        $today_results_page = get_page_by_path('ket-qua-hom-nay');
        if (!$today_results_page) {
            $today_results_page_id = wp_insert_post(array(
                'post_title'    => 'Kết quả hôm nay',
                'post_name'     => 'ket-qua-hom-nay',
                'post_content'  => '[ket_qua_hom_nay count="10" layout="cakhia"]',
                'post_status'   => 'publish',
                'post_type'     => 'page',
                'post_author'   => 1,
            ));
            
            if ($today_results_page_id) {
                update_option('dv2_today_results_page_id', $today_results_page_id);
            }
        }
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear scheduled cron
        $timestamp = wp_next_scheduled('dv2_streaming_sync_api');
        if ($timestamp) {
            wp_unschedule_event($timestamp, 'dv2_streaming_sync_api');
        }
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Load plugin textdomain
     */
    public function load_textdomain() {
        load_plugin_textdomain('dv2-streaming', false, dirname(plugin_basename(__FILE__)) . '/languages/');
    }
}

/**
 * Initialize the plugin
 */
function dv2_streaming_plugin_init() {
    return DV2_Streaming_Plugin::get_instance();
}

// Start the plugin
dv2_streaming_plugin_init();

