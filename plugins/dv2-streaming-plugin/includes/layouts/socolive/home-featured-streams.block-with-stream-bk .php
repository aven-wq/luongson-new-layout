<div class="dv2-layout-scl dv2-home-featured-streaming-ctn dv2-layout-streaming">
    <div class="dv2-living-room">
        <div class="dv2-video-inner dv2-inner">
            <div class="dv2-marquee-container">
                <div class="dv2-marquee-box" style="animation-duration: 44.041s;">
                    <?php
                    if ( shortcode_exists('gwd_banner_marquee_toro') ) {
                        echo do_shortcode('[gwd_banner_marquee_toro zone_id=' . (int) $atts['banner_zone_id'] . ']');
                    } else {
                        echo '<img decoding="async" src="https://sta.vnres.co/web/assets/soco/img/sports/basketball.png"><img decoding="async" src="https://sta.vnres.co/web/assets/soco/img/sports/football.png"> Bạn đang xem trực tiếp tại <a href="/">Socolivetv</a>. Chúc bạn có trải nghiệm xem bóng tốt nhất.<img decoding="async" src="https://sta.vnres.co/web/assets/soco/img/sports/basketball.png"><img decoding="async" src="https://sta.vnres.co/web/assets/soco/img/sports/football.png">';
                    }
                    ?>
                </div>
            </div>
            <div class="dv2-video-box">
                <div class="dv2-video-wrapper" id="videoWrapper">
                    <?php require DV2_STREAMING_PLUGIN_DIR . 'includes/partials/stream-chrome.block.php'; ?>
                    <div class="dv2-video-container">
                        <?php require DV2_STREAMING_PLUGIN_DIR . 'includes/partials/stream-controls.block.php'; ?>
                    </div>
                </div>
            </div>
            <div class="dv2-video-list">
                <ul class="dv2-room-list">
                    
                </ul>
            </div>
        </div>
    </div>
    
    <div class="dv2-soclive-qc-desktop">
        <div class="dv2-stream-links"></div>
        <?php
            if (!empty($atts['ads-block-id'])) {
                echo do_shortcode('[block id="'.$atts['ads-block-id'].'"]');
            }
        ?>
    </div>
</div>

<div class="dv2-soclive-qc-mobile">
    <div class="dv2-stream-links"></div>
    <?php
        if (!empty($atts['ads-block-id'])) {
            echo do_shortcode('[block id="'.$atts['ads-block-id'].'"]');
        }
    ?>
</div>

<div class="dv2-layout-scl dv2-appoinment-list-ctn dv2-layout-appoinment dv2-inner">
    <div class="dv2-appoinment-swiper-container">
        <div class="dv2-swiper-wrapper swiper-wrapper">
        </div>
    </div>
    <div class="dv2-appoinment-prev">
        <!-- <i class="fa fa-angle-left" aria-hidden="true"></i> -->
        <i class="iconfont ali-houtuismall" aria-hidden="true"></i>
    </div>
    <div class="dv2-appoinment-next">
        <!-- <i class="fa fa-angle-right" aria-hidden="true"></i> -->
        <i class="iconfont ali-qianjinsmall" aria-hidden="true"></i>
    </div>
</div>