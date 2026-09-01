(function ($) {
	'use strict';

	var config = window.luongsonFooterAdmin || {};
	var optionKey = config.optionKey || 'luongson_footer_sponsors';
	var labels = config.labels || {};

	function getNextIndex() {
		var max = -1;

		$('#luongson-sponsor-items .luongson-sponsor-row').each(function () {
			var index = parseInt($(this).attr('data-index'), 10);
			if (!isNaN(index) && index > max) {
				max = index;
			}
		});

		return max + 1;
	}

	function toggleEmptyState() {
		var hasRows = $('#luongson-sponsor-items .luongson-sponsor-row').length > 0;
		$('#luongson-sponsor-empty').toggle(!hasRows);
	}

	function renumberRows() {
		$('#luongson-sponsor-items .luongson-sponsor-row').each(function (rowIndex) {
			$(this).find('.luongson-sponsor-number').text(rowIndex + 1);
		});
		toggleEmptyState();
	}

	function buildRowHtml(index, number) {
		var selectImage = labels.selectImage || 'Chọn ảnh';
		var removeImage = labels.removeImage || 'Gỡ ảnh';
		var removeSponsor = labels.removeSponsor || 'Xóa';
		var linkLabel = labels.link || 'Liên kết';
		var altLabel = labels.alt || 'Mô tả ảnh (alt)';
		var sponsorLabel = labels.sponsor || 'Nhà tài trợ';
		var linkPlaceholder = labels.linkPlaceholder || 'https://';
		var altPlaceholder = labels.altPlaceholder || 'Tên nhà tài trợ';

		return (
			'<div class="luongson-sponsor-row" data-index="' + index + '">' +
				'<div class="luongson-sponsor-row__header">' +
					'<div class="luongson-sponsor-row__title">' +
						'<span class="luongson-sponsor-row__badge" aria-hidden="true"></span>' +
						'<strong>' + sponsorLabel + ' #' + number + '</strong>' +
					'</div>' +
					'<button type="button" class="button-link-delete luongson-remove-sponsor">' + removeSponsor + '</button>' +
				'</div>' +
				'<div class="luongson-sponsor-row__fields">' +
					'<div class="luongson-sponsor-field luongson-sponsor-field--image">' +
						'<label>' + (labels.image || 'Ảnh logo') + '</label>' +
						'<div class="luongson-image-picker">' +
							'<div class="luongson-image-preview" style="display:none;">' +
								'<img src="" alt="" />' +
							'</div>' +
							'<div class="luongson-image-actions">' +
								'<input type="hidden" name="' + optionKey + '[' + index + '][image_id]" value="" class="luongson-image-id" />' +
								'<input type="hidden" name="' + optionKey + '[' + index + '][image_url]" value="" class="luongson-image-url" />' +
								'<button type="button" class="button button-secondary luongson-select-image">' + selectImage + '</button>' +
								'<button type="button" class="button luongson-remove-image" style="display:none;">' + removeImage + '</button>' +
							'</div>' +
						'</div>' +
					'</div>' +
					'<div class="luongson-sponsor-field">' +
						'<label for="luongson-sponsor-link-' + index + '">' + linkLabel + '</label>' +
						'<input type="text" id="luongson-sponsor-link-' + index + '" name="' + optionKey + '[' + index + '][link]" value="" class="regular-text" placeholder="' + linkPlaceholder + '" />' +
					'</div>' +
					'<div class="luongson-sponsor-field">' +
						'<label for="luongson-sponsor-alt-' + index + '">' + altLabel + '</label>' +
						'<input type="text" id="luongson-sponsor-alt-' + index + '" name="' + optionKey + '[' + index + '][alt]" value="" class="regular-text" placeholder="' + altPlaceholder + '" />' +
					'</div>' +
				'</div>' +
			'</div>'
		);
	}

	function addRow() {
		var index = getNextIndex();
		var number = $('#luongson-sponsor-items .luongson-sponsor-row').length + 1;
		var $row = $(buildRowHtml(index, number));

		$('#luongson-sponsor-items').append($row);
		renumberRows();

		$('html, body').animate({
			scrollTop: $row.offset().top - 120
		}, 200);
	}

	function openMediaFrame($row) {
		var frame = wp.media({
			title: labels.mediaTitle || 'Chọn logo nhà tài trợ',
			button: { text: labels.mediaButton || 'Chọn ảnh' },
			multiple: false
		});

		frame.on('select', function () {
			var attachment = frame.state().get('selection').first().toJSON();
			var previewUrl = attachment.sizes && attachment.sizes.thumbnail
				? attachment.sizes.thumbnail.url
				: attachment.url;

			$row.find('.luongson-image-id').val(attachment.id);
			$row.find('.luongson-image-url').val(attachment.url);
			$row.find('.luongson-image-preview img').attr('src', previewUrl);
			$row.find('.luongson-image-preview').show();
			$row.find('.luongson-remove-image').show();
		});

		frame.open();
	}

	$(function () {
		toggleEmptyState();

		$(document).on('click', '#luongson-add-sponsor', function (event) {
			event.preventDefault();
			addRow();
		});

		$(document).on('click', '.luongson-remove-sponsor', function (event) {
			event.preventDefault();
			$(this).closest('.luongson-sponsor-row').remove();
			renumberRows();
		});

		$(document).on('click', '.luongson-select-image', function (event) {
			event.preventDefault();
			openMediaFrame($(this).closest('.luongson-sponsor-row'));
		});

		$(document).on('click', '.luongson-remove-image', function (event) {
			event.preventDefault();

			var $row = $(this).closest('.luongson-sponsor-row');
			$row.find('.luongson-image-id').val('');
			$row.find('.luongson-image-url').val('');
			$row.find('.luongson-image-preview img').attr('src', '');
			$row.find('.luongson-image-preview').hide();
			$(this).hide();
		});
	});
})(jQuery);
