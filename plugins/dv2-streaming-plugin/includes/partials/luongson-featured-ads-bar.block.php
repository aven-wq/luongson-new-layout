<?php
/**
 * LuongSon V2 — Featured ads bar (ticker + “Chơi ngay”).
 * Canonical markup from html/luongson-v2/home-match.html / partials/featured-ads-bar.html.
 *
 * Optional vars before include (or $luongson_featured_ads_bar array):
 * - header_link (string)
 * - ticker_items (array)
 * - play_cta_id (string) e.g. luongsonPlayCta
 * - extra_bar_class (string) e.g. luongson-stream-top-bar
 *
 * @package DV2_Streaming
 */

if (!defined('ABSPATH')) {
    exit;
}

$args = isset($luongson_featured_ads_bar) && is_array($luongson_featured_ads_bar)
    ? $luongson_featured_ads_bar
    : array();

$header_link = isset($args['header_link'])
    ? (string) $args['header_link']
    : (isset($luongson_header_link) ? (string) $luongson_header_link : DV2_Settings::get_luongson_header_ads_animation_url());

$ticker_items = isset($args['ticker_items']) && is_array($args['ticker_items'])
    ? $args['ticker_items']
    : (isset($luongson_ticker_items) && is_array($luongson_ticker_items)
        ? $luongson_ticker_items
        : DV2_Settings::get_luongson_header_ads_animation_items_for_render());

$play_cta_id = isset($args['play_cta_id']) ? (string) $args['play_cta_id'] : '';
$extra_bar_class = isset($args['extra_bar_class']) ? trim((string) $args['extra_bar_class']) : '';

$bar_class = 'framer-vb8tzz luongson-featured-match-bar';
if ($extra_bar_class !== '') {
    $bar_class .= ' ' . $extra_bar_class;
}

$dot_classes = array('framer-vvp962', 'framer-w3d01o', 'framer-lbkh2h', 'framer-1y5bl12');
$image_classes = array('framer-oterc7', 'framer-52b3qw');
$text_classes = array('framer-1m1jatp', 'framer-ey18ub');
$li_spacer = array('ls-s35', 'ls-s35', 'ls-s37', 'ls-s37');
$li_image = array('ls-s35', 'ls-s37');
$li_text = array('ls-s25', 'ls-s25');
?>
<div
    class="<?php echo esc_attr($bar_class); ?>"
    data-border="true"
    data-framer-name="League and Ad Bar"
>
    <?php if (!empty($ticker_items)) : ?>
    <div
        class="framer-cfqyq6 ls-s33 luongson-featured-ads-ticker"
        data-framer-name="Advertisement Ticker"
    >
        <a href="<?php echo esc_url($header_link); ?>" target="_blank" rel="noopener noreferrer">
            <ul class="ls-s34">
                <?php
                $seg = 0;
                foreach ($ticker_items as $ticker_item) :
                    $image_url = '';
                    if (!empty($ticker_item['image_url'])) {
                        $image_url = (string) $ticker_item['image_url'];
                    } elseif (!empty($ticker_item['imageUrl'])) {
                        $image_url = (string) $ticker_item['imageUrl'];
                    }
                    $text = isset($ticker_item['text']) ? (string) $ticker_item['text'] : '';

                    if ($image_url !== '') :
                        $dot_class = $dot_classes[$seg % count($dot_classes)];
                        $li_dot = $li_spacer[$seg % count($li_spacer)];
                        $img_wrap = $image_classes[$seg % count($image_classes)];
                        $li_img = $li_image[$seg % count($li_image)];
                        $seg++;
                        ?>
                        <li class="ticker-item <?php echo esc_attr($li_dot); ?>"><div class="<?php echo esc_attr($dot_class); ?>"></div></li>
                        <li class="ticker-item <?php echo esc_attr($li_img); ?>">
                            <div class="<?php echo esc_attr($img_wrap); ?>" data-framer-name="Image">
                                <div class="ls-s4" data-framer-background-image-wrapper="true">
                                    <img class="ls-s5" alt="" decoding="async" height="150" src="<?php echo esc_url($image_url); ?>" width="292" />
                                </div>
                            </div>
                        </li>
                    <?php endif; ?>
                    <?php if ($text !== '') :
                        $dot_class = $dot_classes[$seg % count($dot_classes)];
                        $li_dot = $li_spacer[$seg % count($li_spacer)];
                        $text_wrap = $text_classes[$seg % count($text_classes)];
                        $li_txt = $li_text[$seg % count($li_text)];
                        $seg++;
                        ?>
                        <li class="ticker-item <?php echo esc_attr($li_dot); ?>"><div class="<?php echo esc_attr($dot_class); ?>"></div></li>
                        <li class="ticker-item <?php echo esc_attr($li_txt); ?>">
                            <div class="<?php echo esc_attr($text_wrap); ?> ls-s26" data-framer-component-type="RichTextContainer">
                                <p class="framer-text ls-s36" dir="auto"><?php echo esc_html($text); ?></p>
                            </div>
                        </li>
                    <?php endif; ?>
                <?php endforeach; ?>
            </ul>
        </a>
    </div>
    <?php endif; ?>

    <a
        class="framer-dhrlif"
        <?php echo $play_cta_id !== '' ? 'id="' . esc_attr($play_cta_id) . '"' : ''; ?>
        data-framer-name="Premier League Identity"
        href="<?php echo esc_url($header_link); ?>"
        target="_blank"
        rel="noopener noreferrer"
    >
        <div class="framer-1ls5xev" data-framer-name="Premier League Logo">
            <div
                aria-hidden="true"
                class="framer-1j2wjkg ls-s42"
                data-framer-component-type="SVG"
            ></div>
        </div>
        <div
            class="framer-1emkd9f ls-s26"
            data-framer-component-type="RichTextContainer"
        ><p class="framer-text ls-s43" dir="auto"><?php echo esc_html__('Chơi ngay', 'dv2-streaming'); ?></p></div>
    </a>
</div>
