<?php
/**
 * URL Rewrite Handler
 * Manages custom streaming URL structures
 */

if (!defined('ABSPATH')) {
    exit;
}

class DV2_URL_Rewrite {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('init', array($this, 'add_rewrite_rules'));
        add_filter('query_vars', array($this, 'add_query_vars'));
        add_action('template_redirect', array($this, 'handle_custom_templates'));
    }
    
    /**
     * Add custom rewrite rules
     */
    public function add_rewrite_rules() {
        // Streams detail page - /streams/{id} or /streams/{slug}
        add_rewrite_rule(
            '^streams/([^/]+)/?$',
            'index.php?pagename=streams&stream_id=$matches[1]',
            'top'
        );
    }
    
    /**
     * Add custom query vars
     */
    public function add_query_vars($vars) {
        $vars[] = 'stream_id';
        return $vars;
    }
    
    /**
     * Handle custom templates
     */
    public function handle_custom_templates() {
        if (get_query_var('stream_id')) {
            $this->change_seo_title_stream_from_api(get_query_var('stream_id'));
        }
    }
    
    private function change_seo_title_stream_from_api($steam_id) {
        $api_url = API_URL. "lives/$steam_id";
        $response = wp_remote_get($api_url);
        if (is_wp_error($response)) {
            return;
        }
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body);
        if (!$data || empty($data->data)) {
            return;
        }
        $homeTeam = $data->data->teams->home->name ?? '';
        $awayTeam = $data->data->teams->away->name ?? '';
        if (!$homeTeam || !$awayTeam) {
            return;
        }
        
        $new_title = "Trực tiếp trận đấu giữa {$homeTeam} vs {$awayTeam}";
        $GLOBALS['api_custom_seo_title_stream'] = $new_title;
        add_filter('pre_get_document_title', function() {
            return $GLOBALS['api_custom_seo_title_stream'] ?? '';
        });

        add_filter('rank_math/frontend/title', function($title){
            return $GLOBALS['api_custom_seo_title_stream'] ?? $title;
        });
    }
}

