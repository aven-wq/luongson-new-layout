<?php
/**
 * Stream player chrome ads (right, footer).
 * Shared by vebo-v2, cakhia-v2, and future stream-detail layouts.
 */
if (!defined('ABSPATH')) {
    exit;
}

if (!DV2_Settings::has_vb2_stream_chrome()) {
    return;
}
?>
<div class="dv2-stream-chrome" aria-hidden="true">
    <div class="dv2-stream-odds-slot" data-dv2-odds-panel aria-hidden="true"></div>
    <?php if (DV2_Settings::has_vb2_stream_chrome_right()) : ?>
    <div class="dv2-stream-chrome-right">
        <div class="dv2-stream-chrome-right-body">
            <?php echo DV2_Settings::get_vb2_stream_chrome_right_ad_html(); ?>
        </div>
    </div>
    <?php endif; ?>
    <?php if (DV2_Settings::has_vb2_stream_chrome_footer()) : ?>
    <div class="dv2-stream-chrome-footer">
        <button type="button" class="dv2-stream-chrome-close" aria-label="Đóng quảng cáo">&times;</button>
        <div class="dv2-stream-chrome-footer-body">
            <?php if (DV2_Settings::has_vb2_stream_chrome_ft_ad('vb2_stream_chrome_ft_head_ad')) : ?>
            <div class="dv2-stream-chrome-ft-head"><?php echo DV2_Settings::get_vb2_stream_chrome_ft_ad_html('vb2_stream_chrome_ft_head_ad'); ?></div>
            <?php endif; ?>
            <?php if (DV2_Settings::has_vb2_stream_chrome_ft_ad('vb2_stream_chrome_ft_left_ad') || DV2_Settings::has_vb2_stream_chrome_ft_ad('vb2_stream_chrome_ft_right_ad')) : ?>
            <div class="dv2-stream-chrome-ft-row">
                <?php if (DV2_Settings::has_vb2_stream_chrome_ft_ad('vb2_stream_chrome_ft_left_ad')) : ?>
                <div class="dv2-stream-chrome-ft-left"><?php echo DV2_Settings::get_vb2_stream_chrome_ft_ad_html('vb2_stream_chrome_ft_left_ad'); ?></div>
                <?php endif; ?>
                <?php if (DV2_Settings::has_vb2_stream_chrome_ft_ad('vb2_stream_chrome_ft_right_ad')) : ?>
                <div class="dv2-stream-chrome-ft-right"><?php echo DV2_Settings::get_vb2_stream_chrome_ft_ad_html('vb2_stream_chrome_ft_right_ad'); ?></div>
                <?php endif; ?>
            </div>
            <?php endif; ?>
        </div>
    </div>
    <?php endif; ?>
</div>
