<?php
/**
 * LuongSon V2 featured home match — [de_xuat_video layout="luongson-v2"]
 *
 * Markup from html/luongson-v2/home-match.html;
 * CSS/JS bundled via html/luongson-v2/home-match.{css,js}.
 *
 * @package DV2_Streaming
 */

if (!defined('ABSPATH')) {
    exit;
}

$img_base = trailingslashit(DV2_STREAMING_PLUGIN_URL . 'html/luongson-v2/images');
$assets_base = trailingslashit(DV2_STREAMING_PLUGIN_URL . 'assets/images/luongson-v2');
$bg_url = $img_base . 'V9CxYR4IVBtIpgUI5ovJSI6NHQ_46aefa37.jpg';
$xo88_url = $assets_base . 'xo88.avif';
$default_img = trailingslashit(DV2_STREAMING_PLUGIN_URL . 'assets/images') . 'default-img.png';

$luongson_header_link = DV2_Settings::get_luongson_header_ads_animation_url();
$luongson_ticker_items = DV2_Settings::get_luongson_header_ads_animation_items_for_render();
?>
<div class="luongson-home-match">
    <div class="framer-18emxhy">
        <div class="ls-s4" data-framer-background-image-wrapper="true">
            <img
                class="ls-s5"
                alt=""
                decoding="async"
                height="4789"
                src="<?php echo esc_url($bg_url); ?>"
                width="7000"
            />
        </div>

        <?php
        $luongson_featured_ads_bar = array(
            'header_link' => $luongson_header_link,
            'ticker_items' => $luongson_ticker_items,
        );
        require DV2_STREAMING_PLUGIN_DIR . 'includes/partials/luongson-featured-ads-bar.block.php';
        ?>

        <div class="framer-17ntzdd" data-border="true">
            <div class="framer-11ivf5z" data-framer-name="Home Team">
                <div class="framer-16yvchn" data-framer-name="Home Mark">
                    <div class="framer-18l4nza">
                        <div class="framer-1fo8xy6" data-framer-name="Logobox">
                            <div class="ls-s4" data-framer-background-image-wrapper="true">
                                <img
                                    class="ls-s5"
                                    alt=""
                                    decoding="async"
                                    height="128"
                                    src="<?php echo esc_url($default_img); ?>"
                                    width="128"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    class="framer-14gk5iy ls-s26"
                    data-framer-component-type="RichTextContainer"
                    data-framer-name="Home Name"
                ><p class="framer-text ls-s44" dir="auto">—</p></div>
            </div>
            <div class="framer-v3u6ml" data-framer-name="VS">
                <div
                    class="framer-15zkcwh ls-s26"
                    data-framer-component-type="RichTextContainer"
                    data-framer-name="Time"
                ><p class="framer-text ls-s45" dir="auto">—</p></div>
                <div
                    class="framer-1afr6dj ls-s26"
                    data-framer-component-type="RichTextContainer"
                    data-framer-name="VS Text"
                ><p class="framer-text ls-s46" dir="auto">VS</p></div>
                <div
                    class="framer-uurj9l ls-s26"
                    data-framer-component-type="RichTextContainer"
                    data-framer-name="Time"
                ><p class="framer-text ls-s47" dir="auto">--:--</p></div>
            </div>
            <div class="framer-1g7hg3k" data-framer-name="Away Team">
                <div class="framer-xfklz9" data-framer-name="Away Mark">
                    <div class="framer-1v3vzsg">
                        <div class="framer-1fo8xy6" data-framer-name="Logobox">
                            <div class="ls-s4" data-framer-background-image-wrapper="true">
                                <img
                                    class="ls-s5"
                                    alt=""
                                    decoding="async"
                                    height="128"
                                    src="<?php echo esc_url($default_img); ?>"
                                    width="128"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    class="framer-146zqku ls-s26"
                    data-framer-component-type="RichTextContainer"
                    data-framer-name="Away Name"
                ><p class="framer-text ls-s44" dir="auto">—</p></div>
            </div>
            <div
                class="framer-1qxan8b ls-s20"
                data-framer-component-type="RichTextContainer"
                data-framer-name="League"
            ><p class="framer-text ls-s49" dir="auto">—</p></div>
        </div>

        <div class="framer-1r6rhfo">
            <div
                class="framer-1me43v6 luongson-featured-odds-panel"
                data-border="true"
                data-framer-name="Odds Glass Panel"
            >
                <div class="framer-bvdf9x" data-framer-name="Odds Content">
                    <div class="framer-pzjh3k" data-border="true" data-framer-name="Odds Header">
                        <div class="framer-184fp7j ls-s26" data-framer-component-type="RichTextContainer"><h3 class="framer-text ls-s50" dir="auto"><?php echo esc_html__('Tỷ lệ kèo', 'dv2-streaming'); ?></h3></div>
                        <div class="framer-1gtisvf" data-framer-name="Live Market" style="display:none">
                            <div class="framer-cza2ti ls-s51"></div>
                            <div class="framer-1ri28ev ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s52" dir="auto">LIVE</p></div>
                        </div>
                    </div>
                    <div class="framer-cgedgx" data-framer-name="Odds Markets">
                        <div class="framer-i0yjku" data-border="true" data-framer-name="HDP Market">
                            <div class="framer-1tbw3wy ls-s26" data-framer-component-type="RichTextContainer"><h4 class="framer-text ls-s53" dir="auto">HDP</h4></div>
                            <div class="framer-1ig3lqi">
                                <div class="framer-1ha5pwa">
                                    <div class="framer-81065z ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s54" dir="auto">-</p></div>
                                    <div aria-hidden="true" class="framer-86899c ls-s55" data-framer-component-type="SVG"></div>
                                </div>
                                <div class="framer-g7bgsc">
                                    <div class="framer-avsiw5 ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s54" dir="auto">-</p></div>
                                </div>
                                <div class="framer-1rau34q">
                                    <div class="framer-vavlg4 ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s54" dir="auto">-</p></div>
                                    <div aria-hidden="true" class="framer-10jr8w9 ls-s56" data-framer-component-type="SVG"></div>
                                </div>
                            </div>
                        </div>
                        <div class="framer-1s456y0" data-border="true" data-framer-name="OU Market">
                            <div class="framer-1kidpjv ls-s26" data-framer-component-type="RichTextContainer"><h4 class="framer-text ls-s53" dir="auto">O/U</h4></div>
                            <div class="framer-plxfgv">
                                <div class="framer-f35b87">
                                    <div class="framer-16dnq4j ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s54" dir="auto">-</p></div>
                                    <div aria-hidden="true" class="framer-m3ca1c ls-s55" data-framer-component-type="SVG"></div>
                                </div>
                                <div class="framer-34c25g">
                                    <div class="framer-1a3owxk ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s54" dir="auto">-</p></div>
                                </div>
                                <div class="framer-xb9rtj">
                                    <div class="framer-967ehj ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s54" dir="auto">-</p></div>
                                    <div aria-hidden="true" class="framer-cuecic ls-s56" data-framer-component-type="SVG"></div>
                                </div>
                            </div>
                        </div>
                        <div class="framer-koe8n1" data-border="true" data-framer-name="1X2 Market">
                            <div class="framer-txlr8i ls-s26" data-framer-component-type="RichTextContainer"><h4 class="framer-text ls-s53" dir="auto">1X2</h4></div>
                            <div class="framer-17ygpak">
                                <div class="framer-4og8nz">
                                    <div class="framer-1wem2lt ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s54" dir="auto">-</p></div>
                                </div>
                                <div class="framer-19e1gsv">
                                    <div class="framer-104wr5r ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s54" dir="auto">-</p></div>
                                </div>
                                <div class="framer-17i4454">
                                    <div class="framer-9v3pxj ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s54" dir="auto">-</p></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="framer-6ym17g">
                <div class="framer-woxy63"></div>
                <div class="framer-1gbdc0z">
                    <a class="luongson-home-bet-link" id="luongsonHomeBet" href="#" target="_blank" rel="noopener noreferrer">
                        <span class="luongson-home-bet-text"><?php echo esc_html__('cược', 'dv2-streaming'); ?></span>
                        <img class="luongson-home-bet-logo" alt="XO88" decoding="async" src="<?php echo esc_url($xo88_url); ?>" />
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
