<div class="dv2-layout-vb dv2-detail-livestream dv2-container">
    <!-- Tabs -->
    <div class="dv2-tabs">
        <div class="dv2-tab dv2-active" data-tab="live">Trực tiếp</div>
    </div>

    <!-- Video -->
    <div class="dv2-video-wrapper" id="videoWrapper">
    </div>
    <div class="dv2-stream-links"></div>
    <div class="dv2-stream-ads">
        <?php
            if (!empty($atts['ads-block-id'])) {
                echo do_shortcode('[block id="'.$atts['ads-block-id'].'"]');
            }
        ?>
    </div>
    <!-- Match Info -->
    <div class="dv2-match-info">

    </div>
</div>