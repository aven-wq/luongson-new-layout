<div class="dv2-layout-tc dv2-detail-stream-ctn dv2-layout-stream">
    <!-- Page Title -->
    <div class="dv2-page-title">
        <div class="dv2-title-text" id="pageTitle">LINK TRỰC TIẾP</div>
    </div>

    <!-- Main Content Wrapper -->
    <div class="dv2-content-wrapper">
        <!-- Score Overlay - OUTSIDE video, ABOVE video -->
        <div class="dv2-score-overlay" id="scoreOverlay">
            <div class="dv2-score-container">
                <!-- Home Team -->
                <div class="dv2-overlay-team" id="homeTeam">
                    <div class="dv2-overlay-flag">
                        <img src="" alt="Home">
                    </div>
                    <div class="dv2-overlay-team-name">Home Team</div>
                </div>

                <!-- Score -->
                <div class="dv2-overlay-score" id="scoreDisplay">
                    <div class="dv2-score-number">0</div>
                    <div class="dv2-score-separator">-</div>
                    <div class="dv2-score-number">0</div>
                </div>

                <!-- Away Team -->
                <div class="dv2-overlay-team" id="awayTeam">
                    <div class="dv2-overlay-flag">
                        <img src="" alt="Away">
                    </div>
                    <div class="dv2-overlay-team-name">Away Team</div>
                </div>
            </div>
        </div>

        <!-- Video Container -->
        <div class="dv2-thapcam-video">
            <div class="dv2-streaming-container">
                <div class="dv2-video-wrapper" id="videoWrapper">
                    <?php require DV2_STREAMING_PLUGIN_DIR . 'includes/partials/stream-chrome.block.php'; ?>
                    <div class="dv2-video-container" id="videoContainer">
                        <!-- No Stream Message -->
                        <div class="dv2-no-stream" id="noStreamMessage" style="display: none;">
                            <div class="dv2-no-stream-icon">🚫</div>
                            <div class="dv2-no-stream-title">Không có luồng livestream</div>
                            <div class="dv2-no-stream-subtitle">
                                Trận đấu này hiện chưa có luồng phát trực tiếp.<br>
                                Vui lòng quay lại sau hoặc xem các trận đấu khác.
                            </div>
                        </div>

                        <!-- Video Player -->
                        <video class="dv2-video-player" id="liveVideo" playsinline muted></video>
                    </div>
                    <?php require DV2_STREAMING_PLUGIN_DIR . 'includes/partials/stream-controls.block.php'; ?>
                </div>
                <div class="dv2-stream-list">
                    <div class="dv2-stream-links"></div>
                    <div class="dv2-bet-links"></div>
                </div>
            </div>
            <div class="dv2-layout-thapcam-live-chat">
                <?php echo do_shortcode('[' . $atts['shortcode_stream'] . ']'); ?>
            </div>
        </div>

        <div class="dv2-stream-ads">
            <?php
                if (!empty($atts['ads-block-id'])) {
                    echo do_shortcode('[block id="'.$atts['ads-block-id'].'"]');
                }
            ?>
        </div>
    </div>
</div>
