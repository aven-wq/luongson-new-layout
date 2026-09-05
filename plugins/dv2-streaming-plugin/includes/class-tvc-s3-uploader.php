<?php
/**
 * TVC video uploader via external Storage API.
 *
 * Upload API URL and token are configured in DV2 Streaming settings (admin).
 */

if (!defined('ABSPATH')) {
    exit;
}

class DV2_TVC_S3_Uploader {

    /** @var bool|null */
    private static $connection_ok = null;

    const DEFAULT_UPLOAD_API_URL = 'https://storage.thinkwithdev.com/api/public/upload';

    const OPTION_UPLOAD_API_URL = 'tvc_upload_api_url';
    const OPTION_UPLOAD_API_TOKEN = 'tvc_upload_api_token';

    /**
     * @return array<string, mixed>
     */
    private static function get_options() {
        $options = get_option('dv2_streaming_options', array());
        return is_array($options) ? $options : array();
    }

    public static function get_upload_api_url() {
        $options = self::get_options();
        $url = isset($options[self::OPTION_UPLOAD_API_URL])
            ? trim((string) $options[self::OPTION_UPLOAD_API_URL])
            : '';

        if ($url === '') {
            return self::DEFAULT_UPLOAD_API_URL;
        }

        return $url;
    }

    /**
     * @return string Bearer token stored in DB (plain text).
     */
    public static function get_upload_api_token() {
        $options = self::get_options();
        return isset($options[self::OPTION_UPLOAD_API_TOKEN])
            ? trim((string) $options[self::OPTION_UPLOAD_API_TOKEN])
            : '';
    }

    /**
     * @return string Raw token value as stored in DB.
     */
    public static function get_stored_upload_api_token() {
        return self::get_upload_api_token();
    }

    /**
     * @param string $token
     * @return string Masked token for admin display.
     */
    public static function mask_token($token) {
        $token = (string) $token;
        if ($token === '') {
            return '';
        }

        $visible = min(20, strlen($token));
        return substr($token, 0, $visible) . '*****';
    }

    /**
     * @return string Masked token for admin display.
     */
    public static function get_masked_upload_api_token() {
        return self::mask_token(self::get_upload_api_token());
    }

    public static function is_configured() {
        return self::get_upload_api_url() !== '' && self::get_upload_api_token() !== '';
    }

    public static function uses_direct_upload() {
        return self::is_configured();
    }

    public static function uses_cloudfront_playback() {
        return false;
    }

    public static function get_cloudfront_base_url() {
        return '';
    }

    public static function get_cloudfront_url($object_key) {
        return '';
    }

    public static function get_bucket() {
        return '';
    }

    public static function get_region() {
        return '';
    }

    public static function can_connect() {
        if (self::$connection_ok !== null) {
            return self::$connection_ok;
        }

        self::$connection_ok = self::is_configured() && function_exists('curl_init');
        return self::$connection_ok;
    }

    /**
     * @param string $filename
     * @param string $unique_suffix
     * @return string
     */
    public static function generate_object_key($filename, $unique_suffix = '') {
        $filename = sanitize_file_name(wp_basename($filename));
        if ($filename === '') {
            $filename = 'video.mp4';
        }

        if ($unique_suffix === '') {
            $unique_suffix = time() . '-' . wp_generate_password(8, false, false);
        }

        $site_hash = substr(md5(site_url()), 0, 12);
        return sprintf('tvc/%s/%s/%s', $site_hash, $unique_suffix, $filename);
    }

    /**
     * @param string $stored_url
     * @return string
     */
    public static function get_playback_url($stored_url) {
        $stored_url = (string) $stored_url;
        return $stored_url !== '' ? esc_url_raw($stored_url) : '';
    }

    /**
     * @param string $object_key
     * @return string
     */
    public static function get_fallback_playback_url($object_key) {
        return '';
    }

    /**
     * @param string $stored_url
     * @return string
     */
    public static function extract_object_key_from_url($stored_url) {
        return '';
    }

    /**
     * @param int $attachment_id
     * @return string|false Public file URL on success.
     */
    public static function upload_attachment($attachment_id) {
        $attachment_id = absint($attachment_id);
        if (!$attachment_id || !self::is_configured() || !self::can_connect()) {
            return false;
        }

        $file_path = get_attached_file($attachment_id);
        if (!$file_path || !is_readable($file_path) || !is_file($file_path)) {
            return false;
        }

        $mime = get_post_mime_type($attachment_id);
        if (!$mime || strpos($mime, 'video/') !== 0) {
            return false;
        }

        $filename = sanitize_file_name(wp_basename($file_path));
        return self::upload_file($file_path, $filename, $mime);
    }

    /**
     * @param string $tmp_path
     * @param string $filename
     * @param string $content_type
     * @return string|false Public file URL on success.
     */
    public static function upload_temp_file($tmp_path, $filename, $content_type) {
        if (!self::is_configured() || !self::can_connect()) {
            return false;
        }

        if (!$tmp_path || !is_readable($tmp_path) || !is_file($tmp_path)) {
            return false;
        }

        $filename = sanitize_file_name(wp_basename($filename));
        if ($filename === '') {
            return false;
        }

        if ($content_type === '' || strpos($content_type, 'video/') !== 0) {
            $filetype = wp_check_filetype($filename);
            $content_type = !empty($filetype['type']) ? $filetype['type'] : '';
        }

        if ($content_type === '' || strpos($content_type, 'video/') !== 0) {
            return false;
        }

        return self::upload_file($tmp_path, $filename, $content_type);
    }

    /**
     * @param string $file_path
     * @param string $filename
     * @param string $content_type
     * @return string|false
     */
    private static function upload_file($file_path, $filename, $content_type) {
        $result = self::upload_file_with_details($file_path, $filename, $content_type);
        return $result['url'];
    }

    /**
     * @param string $file_path
     * @param string $filename
     * @param string $content_type
     * @return array{url: string|false, error: string}
     */
    public static function upload_file_with_details($file_path, $filename, $content_type) {
        if (!function_exists('curl_init')) {
            return array('url' => false, 'error' => 'cURL is not available.');
        }

        $api_url = self::get_upload_api_url();
        $token = self::get_upload_api_token();
        if ($api_url === '' || $token === '') {
            return array('url' => false, 'error' => 'Storage API URL or token is not configured.');
        }

        if (!is_readable($file_path) || !is_file($file_path)) {
            return array('url' => false, 'error' => 'Upload file is not readable.');
        }

        $mime = $content_type !== '' ? $content_type : 'application/octet-stream';
        $curl_file = new CURLFile($file_path, $mime, $filename);

        $handle = curl_init($api_url);
        if (!$handle) {
            return array('url' => false, 'error' => 'Could not initialize cURL.');
        }

        curl_setopt_array($handle, array(
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => array(
                'Authorization: Bearer ' . $token,
            ),
            CURLOPT_POSTFIELDS => array(
                'files' => $curl_file,
            ),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 30,
            CURLOPT_TIMEOUT => 0,
        ));

        $body = curl_exec($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($handle);
        curl_close($handle);

        if ($body === false) {
            return array(
                'url' => false,
                'error' => $curl_error !== '' ? $curl_error : 'Storage API request failed.',
            );
        }

        if ($status < 200 || $status >= 300) {
            return array(
                'url' => false,
                'error' => sprintf('Storage API returned HTTP %d.', $status),
            );
        }

        $url = self::extract_upload_url_from_response($body);
        if ($url) {
            return array('url' => $url, 'error' => '');
        }

        $api_errors = self::extract_upload_errors_from_response($body);
        if ($api_errors !== '') {
            return array('url' => false, 'error' => $api_errors);
        }

        return array(
            'url' => false,
            'error' => __('Storage API không trả về public_url.', 'dv2-streaming'),
        );
    }

    /**
     * @param string $body
     * @return string|false
     */
    public static function extract_upload_url_from_response($body) {
        $data = json_decode($body, true);
        if (!is_array($data)) {
            return false;
        }

        $candidates = array();

        if (!empty($data['uploaded']) && is_array($data['uploaded'])) {
            foreach ($data['uploaded'] as $item) {
                if (!is_array($item)) {
                    continue;
                }
                foreach (array('public_url', 'publicUrl', 'url', 'fileUrl', 'file_url') as $key) {
                    if (!empty($item[$key]) && is_string($item[$key])) {
                        $candidates[] = $item[$key];
                    }
                }
            }
        }

        if (!empty($data['url']) && is_string($data['url'])) {
            $candidates[] = $data['url'];
        }

        if (!empty($data['public_url']) && is_string($data['public_url'])) {
            $candidates[] = $data['public_url'];
        }

        if (!empty($data['data'])) {
            if (is_string($data['data'])) {
                $candidates[] = $data['data'];
            } elseif (is_array($data['data'])) {
                if (!empty($data['data']['public_url']) && is_string($data['data']['public_url'])) {
                    $candidates[] = $data['data']['public_url'];
                }
                if (!empty($data['data']['url']) && is_string($data['data']['url'])) {
                    $candidates[] = $data['data']['url'];
                }
                foreach ($data['data'] as $item) {
                    if (is_string($item)) {
                        $candidates[] = $item;
                    } elseif (is_array($item)) {
                        foreach (array('public_url', 'publicUrl', 'url', 'fileUrl', 'file_url', 'path') as $key) {
                            if (!empty($item[$key]) && is_string($item[$key])) {
                                $candidates[] = $item[$key];
                            }
                        }
                    }
                }
            }
        }

        if (!empty($data['files']) && is_array($data['files'])) {
            foreach ($data['files'] as $item) {
                if (is_string($item)) {
                    $candidates[] = $item;
                } elseif (is_array($item)) {
                    foreach (array('public_url', 'publicUrl', 'url', 'fileUrl', 'file_url', 'path') as $key) {
                        if (!empty($item[$key]) && is_string($item[$key])) {
                            $candidates[] = $item[$key];
                        }
                    }
                }
            }
        }

        foreach ($candidates as $candidate) {
            $candidate = trim((string) $candidate);
            if ($candidate === '') {
                continue;
            }

            if (filter_var($candidate, FILTER_VALIDATE_URL)) {
                return esc_url_raw($candidate);
            }

            if (strpos($candidate, '/') === 0) {
                $api_parts = wp_parse_url(self::get_upload_api_url());
                if (!empty($api_parts['scheme']) && !empty($api_parts['host'])) {
                    return esc_url_raw($api_parts['scheme'] . '://' . $api_parts['host'] . $candidate);
                }
            }
        }

        return false;
    }

    /**
     * @param string $body
     * @return string
     */
    private static function extract_upload_errors_from_response($body) {
        $data = json_decode($body, true);
        if (!is_array($data) || empty($data['errors']) || !is_array($data['errors'])) {
            return '';
        }

        $messages = array();
        foreach ($data['errors'] as $error) {
            if (is_string($error) && trim($error) !== '') {
                $messages[] = trim($error);
            } elseif (is_array($error)) {
                foreach (array('message', 'error') as $key) {
                    if (!empty($error[$key]) && is_string($error[$key])) {
                        $messages[] = trim($error[$key]);
                        break;
                    }
                }
            }
        }

        return implode(' ', array_unique($messages));
    }

    /**
     * @param string $url
     * @return bool
     */
    public static function is_valid_storage_url($url) {
        if ($url === '') {
            return false;
        }

        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        return (bool) preg_match('/^https?:\/\//i', $url);
    }
}
