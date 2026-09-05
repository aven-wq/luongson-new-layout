(function ($) {
    'use strict';

    var cfg =
        typeof window.dv2Ck2Highlights === 'object' && window.dv2Ck2Highlights
            ? window.dv2Ck2Highlights
            : {};
    var API_URL =
        cfg.apiUrl ||
        'https://vsc-apidev.helizones.com/api/data/lives/highlights';
    var SEARCH_DEBOUNCE_MS = 350;

    function resolvePageSize() {
        var fromCfg = Number(cfg.pageSize || cfg.size || 0);
        if (Number.isFinite(fromCfg) && fromCfg > 0) {
            return Math.min(100, Math.floor(fromCfg));
        }

        var raw = $('#ck2HighlightGrid').attr('data-page-size');
        var fromDom = Number(raw);
        if (Number.isFinite(fromDom) && fromDom > 0) {
            return Math.min(100, Math.floor(fromDom));
        }

        return 12;
    }

    var PAGE_SIZE = 12;
    var FALLBACK_THUMB =
        cfg.fallbackThumb ||
        (typeof window.dv2Streaming === 'object' &&
        window.dv2Streaming &&
        window.dv2Streaming.strings &&
        window.dv2Streaming.strings.fallbackThumb
            ? window.dv2Streaming.strings.fallbackThumb
            : null) ||
        '../../assets/images/highlight.webp';

    function escapeForSingleQuotedJs(s) {
        return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }

    var itemsById = {};
    var currentPage = 0;
    var totalPages = 0;
    var loading = false;
    var hlsInstance = null;
    var activeSearch = '';
    var searchDebounceTimer = null;
    var highlightLoadedCount = 0;

    function getHighlightListAdBlocks() {
        return (
            (window.DV2ListAds &&
                window.DV2ListAds.getBlocks &&
                window.DV2ListAds.getBlocks(window.DV2_SOCOLIVE_HIGHLIGHT_LIST_ADS)) ||
            []
        );
    }

    function buildHighlightListAdInsertions(totalItems) {
        return (
            (window.DV2ListAds &&
                window.DV2ListAds.buildInsertions &&
                window.DV2ListAds.buildInsertions(getHighlightListAdBlocks(), totalItems, {
                    breakpoint: window.DV2_SOCOLIVE_HIGHLIGHT_LIST_ADS_MOBILE_BREAKPOINT,
                    repeatCycle: window.DV2_SOCOLIVE_HIGHLIGHT_LIST_ADS_REPEAT,
                })) ||
            new Map()
        );
    }

    function buildHighlightListAdMarkup(adBlock) {
        return (
            (window.DV2ListAds &&
                window.DV2ListAds.buildMarkup &&
                window.DV2ListAds.buildMarkup(adBlock, {
                    wrapperTag: 'div',
                    wrapperClass: 'dv2-highlight-list-ad',
                })) ||
            ''
        );
    }

    function refreshHighlightListReviveAds($container) {
        if (window.DV2ListAds && window.DV2ListAds.refreshReviveAds) {
            window.DV2ListAds.refreshReviveAds($container);
        }
    }

    function formatMatchDate(epochSec) {
        if (epochSec == null || epochSec === '') {
            return '';
        }
        var ms = Number(epochSec) * 1000;
        if (!isFinite(ms)) {
            return '';
        }
        return new Date(ms).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    }

    function thumbSrc(item) {
        var t = item.thumbnail;
        if (t && String(t).trim()) {
            return t;
        }
        return FALLBACK_THUMB;
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function buildCard(item) {
        itemsById[item.id] = item;
        var title = escapeHtml(item.title || '');
        var league = escapeHtml(item.competitionName || '');
        var dateStr = formatMatchDate(item.matchTimeEpoch);
        var imgSrc = escapeHtml(thumbSrc(item));

        return (
            '<article class="ck2-card" role="listitem" tabindex="0" data-id="' +
            escapeHtml(item.id) +
            '">' +
            '<div class="ck2-card-thumb">' +
            '<img src="' +
            imgSrc +
            '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'' +
            escapeForSingleQuotedJs(FALLBACK_THUMB) +
            '\'">' +
            '<span class="ck2-play" aria-hidden="true"></span>' +
            '</div>' +
            '<div class="ck2-card-body">' +
            '<p class="ck2-card-title">' +
            title +
            '</p>' +
            '<div class="ck2-card-meta">' +
            '<span class="ck2-card-league">' +
            league +
            '</span>' +
            '<span class="ck2-card-date">' +
            escapeHtml(dateStr) +
            '</span>' +
            '</div>' +
            '</div>' +
            '</article>'
        );
    }

    function appendHighlightBatch(list, startCount) {
        var $grid = $('#ck2HighlightGrid');
        var newTotal = startCount + list.length;
        var insertions = buildHighlightListAdInsertions(newTotal);
        var html = '';

        if (startCount === 0 && list.length === 0 && insertions.has(0)) {
            html += buildHighlightListAdMarkup(insertions.get(0));
            $grid.append(html);
            refreshHighlightListReviveAds($grid);
            return;
        }

        list.forEach(function (item, localIndex) {
            var globalPosition = startCount + localIndex + 1;
            html += buildCard(item);
            if (insertions.has(globalPosition)) {
                html += buildHighlightListAdMarkup(insertions.get(globalPosition));
            }
        });

        $grid.append(html);
        refreshHighlightListReviveAds($grid);
        highlightLoadedCount = newTotal;
    }

    function setLoading(on) {
        loading = on;
        $('#ck2Loading').prop('hidden', !on);
        $('#ck2LoadMore').prop('disabled', on);
    }

    function updateLoadMoreVisibility() {
        var hasMore = currentPage < totalPages;
        $('#ck2LoadMore').prop('hidden', !hasMore || totalPages === 0);
    }

    function fetchPage(page) {
        setLoading(true);
        $('#ck2HighlightError').prop('hidden', true).text('');

        var data = { page: page, size: PAGE_SIZE };
        if (activeSearch) {
            data.search = activeSearch;
        }

        return $.ajax({
            url: API_URL,
            method: 'GET',
            data: data,
            dataType: 'json',
        })
            .done(function (res) {
                if (!res || res.code !== 1000 || !res.result) {
                    $('#ck2HighlightError')
                        .prop('hidden', false)
                        .text('Không tải được dữ liệu highlights.');
                    return;
                }

                var r = res.result;
                totalPages = r.totalPages || 0;
                currentPage = r.currentPage || page;
                var list = r.data || [];

                if (page === 1) {
                    $('#ck2HighlightGrid').empty();
                    itemsById = {};
                    highlightLoadedCount = 0;
                }

                if (page === 1 && list.length === 0) {
                    $('#ck2HighlightEmpty').prop('hidden', false);
                    $('#ck2LoadMore').prop('hidden', true);
                    appendHighlightBatch([], 0);
                    return;
                }

                $('#ck2HighlightEmpty').prop('hidden', true);
                appendHighlightBatch(list, highlightLoadedCount);
                updateLoadMoreVisibility();
            })
            .fail(function () {
                $('#ck2HighlightError')
                    .prop('hidden', false)
                    .text('Lỗi kết nối. Vui lòng thử lại sau.');
            })
            .always(function () {
                setLoading(false);
            });
    }

    function destroyHls() {
        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }
    }

    function closeModal() {
        var video = document.getElementById('ck2ModalVideo');
        destroyHls();
        video.removeAttribute('src');
        video.load();
        $('#ck2VideoModal').prop('hidden', true).attr('aria-hidden', 'true');
    }

    function openModal(item) {
        var video = document.getElementById('ck2ModalVideo');
        destroyHls();
        video.removeAttribute('src');
        video.load();

        $('#ck2ModalTitle').text(item.title || '');
        $('#ck2VideoModal').prop('hidden', false).attr('aria-hidden', 'false');

        var mp4 = item.url && String(item.url).trim();
        var m3u8 = item.urlM3u8 && String(item.urlM3u8).trim();

        if (m3u8 && window.Hls && Hls.isSupported()) {
            hlsInstance = new Hls({ enableWorker: true });
            hlsInstance.attachMedia(video);
            hlsInstance.on(Hls.Events.MEDIA_ATTACHED, function () {
                hlsInstance.loadSource(m3u8);
            });
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
                video.play().catch(function () {});
            });
            return;
        }

        if (m3u8 && video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = m3u8;
            video.play().catch(function () {});
            return;
        }

        if (mp4) {
            video.src = mp4;
            video.play().catch(function () {});
            return;
        }

        $('#ck2ModalTitle').text(
            (item.title || '') + ' — Không phát được video trên trình duyệt này.'
        );
    }

    function onCardActivate(id) {
        var item = itemsById[id];
        if (item) {
            openModal(item);
        }
    }

    $(function () {
        if (!$('#ck2HighlightGrid').length) {
            return;
        }

        PAGE_SIZE = resolvePageSize();
        fetchPage(1);

        $('#ck2HighlightSearch').on('input', function () {
            var raw = $(this).val();
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(function () {
                activeSearch = String(raw).trim();
                fetchPage(1);
            }, SEARCH_DEBOUNCE_MS);
        });

        $('#ck2LoadMore').on('click', function () {
            if (loading || currentPage >= totalPages) {
                return;
            }
            fetchPage(currentPage + 1);
        });

        $('#ck2HighlightGrid').on('click', '.ck2-card', function () {
            onCardActivate($(this).data('id'));
        });

        $('#ck2HighlightGrid').on('keydown', '.ck2-card', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCardActivate($(this).data('id'));
            }
        });

        $(document).on('click', '[data-close-modal]', closeModal);

        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && !$('#ck2VideoModal').prop('hidden')) {
                closeModal();
            }
        });
    });
})(jQuery);
