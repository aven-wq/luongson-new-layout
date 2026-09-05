<div class="dv2-layout-vb2 dv2-detail-livestream dv2-container dv2-layout-stream">
    <!-- Header Info -->
    <div class="dv2-layout-vb2-header" style="display: none;">
    </div>

    <!-- Video Container-->
    <div class="dv2-layout-vb2-video">
        <div class="dv2-streaming-container">
            <div class="dv2-video-wrapper" id="videoWrapper">
                <?php require DV2_STREAMING_PLUGIN_DIR . 'includes/partials/stream-chrome.block.php'; ?>
                <div id="stream-player" class="relative flex-1">
                    <!-- Render HLS Player -->
                </div>
                <?php require DV2_STREAMING_PLUGIN_DIR . 'includes/partials/stream-controls.block.php'; ?>
            </div>
            <div class="dv2-stream-list">
                <div class="dv2-stream-links"></div>
                <div class="dv2-bet-links"></div>
            </div>
        </div>
        <div class="dv2-layout-vb2-live-chat">
            <?php echo do_shortcode('[' . $atts['shortcode_stream'] . ']'); ?>
        </div>
    </div>

    <!-- Footer Info -->
    <div class="dv2-layout-vb2-footer-wrapper">
        <div class="dv2-layout-vb2-footer" style="display: none;">
        </div>
        <div class="dv2-layout-vb2-footer-shortcode">
            <?php
                if (!empty($atts['block-id'])) {
                    echo do_shortcode('[block id="'.$atts['block-id'].'"]');
                }
            ?>
        </div>
    </div>
</div>
