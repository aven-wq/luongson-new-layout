<?php
/**
 * LuongSon V2 hot BLV list — [danh_sach_blv_hot layout="luongson-v2"]
 *
 * Markup from html/luongson-v2/top-commentators.html;
 * CSS/JS bundled via html/luongson-v2/top-commentators.{css,js}.
 *
 * @package DV2_Streaming
 */

if (!defined('ABSPATH')) {
    exit;
}

$blv_icon_url = DV2_STREAMING_PLUGIN_URL . 'assets/images/luongson-v2/svg-blv.svg';
?>
<div class="luongson-top-commentators">
    <div class="luongson-commentators-header">
        <img src="<?php echo esc_url($blv_icon_url); ?>" alt="<?php echo esc_attr__('Top bình luận viên', 'dv2-streaming'); ?>" width="24" height="24" />
        <div class="luongson-commentators-header__title">
            <p><?php echo esc_html__('Top bình luận viên', 'dv2-streaming'); ?></p>
        </div>
    </div>

    <div class="luongson-commentators-list">
        <div class="luongson-commentators-track"></div>
    </div>
</div>
