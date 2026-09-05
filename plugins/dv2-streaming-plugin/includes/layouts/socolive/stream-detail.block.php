<div class="socolive-detail-livestream">
    <div class="dv2-layout-scl dv2-streaming-ctn dv2-layout-stream dv2-layout-stream-detail">
        <div class="dv2-living-room">
            <div class="dv2-video-inner dv2-inner">
                <div class="dv2-marquee-container">
                    <div class="dv2-marquee-box" style="animation-duration: 44.041s;">
                        <?php
                        if (shortcode_exists('gwd_banner_marquee_toro')) {
                            echo do_shortcode('[gwd_banner_marquee_toro zone_id=' . (int) $atts['banner_zone_id'] . ']');
                        } else {
                            echo '<p><img decoding="async" src="https://sta.vnres.co/web/assets/soco/img/sports/basketball.png"><img decoding="async" src="https://sta.vnres.co/web/assets/soco/img/sports/football.png"> Bạn đang xem trực tiếp tại <a href="/">Socolivetv</a>. Chúc bạn có trải nghiệm xem bóng tốt nhất.<img decoding="async" src="https://sta.vnres.co/web/assets/soco/img/sports/basketball.png"><img decoding="async" src="https://sta.vnres.co/web/assets/soco/img/sports/football.png"></p>';
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
            </div>
            <div class="dv2-match-card-ft" id="matchCard"></div>
            <div class="dv2-stream-list">
                <div class="dv2-stream-links"></div>
                <div class="dv2-bet-links"></div>
            </div>
        </div>
        <div class="livechat-container"><?php echo do_shortcode('[' . $atts['shortcode_stream'] . ']'); ?></div>
    </div>

    <div class="dv2-layout-scl dv2-appoinment-list-ctn dv2-layout-appoinment dv2-inner">
        <h4 class="title">Lịch trình bình luận viên</h4>
        <div class="dv2-appoinment-swiper-container swiper-container">
            <div class="dv2-swiper-wrapper swiper-wrapper">

            </div>
        </div>
        <div class="dv2-appoinment-prev">
            <i class="iconfont ali-houtuismall" aria-hidden="true"></i>
        </div>
        <div class="dv2-appoinment-next">
            <i class="iconfont ali-qianjinsmall" aria-hidden="true"></i>
        </div>
    </div>

    <div class="dv2-layout-scl dv2-hotlive-ctn dv2-layout-hotlive dv2-inner">
        <h4 class="title">Đề xuất video</h4>
        <ul class="dv2-hot-content all-content">
            <!-- hiển thị list video -->
        </ul>
    </div>
</div>
