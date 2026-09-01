jQuery(function ($) {
    'use strict';

    $(document).on('click', '.tf-inline-edit', function () {
        var $wrap = $(this);
        if ($wrap.find('.tf-edit-input').length) return;

        var $value = $wrap.find('.tf-edit-value');
        var current = $value.text();
        if (current === '\u2014') current = '';

        var $input = $('<input type="text" class="tf-edit-input">').val(current);

        $value.hide();
        $wrap.append($input);
        $input.focus();

        function save() {
            var newVal = $input.val().trim();
            $input.remove();
            $value.show();

            $.post(tfAdmin.ajaxurl, {
                action: 'tf_save_link',
                domain: $wrap.data('domain'),
                code: $wrap.data('code'),
                field: $wrap.data('field'),
                value: newVal,
                nonce: tfAdmin.nonce
            }, function (resp) {
                $value.html(resp || '\u2014');
            });
        }

        $input.on('blur', save);
        $input.on('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                $input.blur();
            }
            if (e.key === 'Escape') {
                $input.remove();
                $value.show();
            }
        });
    });

    $('.tf-filter-tab').on('click', function () {
        var $tab = $(this);
        if ($tab.hasClass('active')) return;

        $('.tf-filter-tab').removeClass('active');
        $tab.addClass('active');

        var filter = $tab.data('filter');

        $('.tf-admin-table tbody tr').each(function () {
            var $row = $(this);
            switch (filter) {
                case 'game':
                    $row.toggle($row.attr('data-type') === 'G');
                    break;
                case 'sport':
                    $row.toggle($row.attr('data-type') === 'S');
                    break;
                case 'gbdt':
                    $row.toggle($row.attr('data-gbdt') === '1');
                    break;
                default:
                    $row.show();
            }
        });
    });

    $(document).on('click', '.tf-clear-cache', function () {
        var $btn = $(this);
        var $status = $('.tf-cache-status');
        $btn.prop('disabled', true);
        $status.text('Clearing...');

        $.post(tfAdmin.ajaxurl, {
            action: 'tf_clear_cache',
            nonce: tfAdmin.cacheNonce
        }, function () {
            $status.text('Cache cleared!');
            setTimeout(function () { location.reload(); }, 500);
        }).fail(function () {
            $status.text('Failed to clear cache.');
            $btn.prop('disabled', false);
        });
    });

    $(document).on('click', '.tf-sync-clicks', function () {
        var $btn = $(this);
        var $status = $('.tf-sync-status');
        $btn.prop('disabled', true);
        $status.text('Syncing...');

        $.post(tfAdmin.ajaxurl, {
            action: 'tf_sync_clicks',
            nonce: tfAdmin.syncNonce
        }, function (resp) {
            if (resp.success) {
                $status.text(resp.data.message);
            } else {
                $status.text(resp.data.message || 'Sync failed.');
            }
        }).fail(function () {
            $status.text('Sync failed.');
        }).always(function () {
            $btn.prop('disabled', false);
        });
    });

    $(document).on('click', '.tf-copy-shortcode', function () {
        var btn = this;
        var tag = btn.getAttribute('data-tag');
        if (navigator.clipboard && navigator.clipboard.writeText) {
            var orig = btn.textContent;
            navigator.clipboard.writeText(tag).then(function () {
                btn.textContent = '✅ Copied!';
                setTimeout(function () {
                    btn.textContent = orig;
                }, 1500);
            });
        }
    });
});