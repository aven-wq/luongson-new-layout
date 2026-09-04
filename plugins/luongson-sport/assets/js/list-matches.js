/**
 * LuongSon Sport — Live matches list
 * Commentator dropdown + match-status hover modal
 * (from themes/html/js/modules/commentator.js + match-modal.js)
 */
(function () {
  'use strict';

  var IMG = (window.luongsonListMatches && window.luongsonListMatches.imgUrl) || '';

  function img(path) {
    return IMG + path;
  }

  /* ------------------------------------------------------------------------ */
  /* Commentator dropdown                                                     */
  /* ------------------------------------------------------------------------ */

  function initCommentatorDropdown() {
    var dropdownHtml =
      '<div class="framer-dil7X commentator-popover-portal" style="position: fixed; z-index: 99999; pointer-events: auto; display: none; opacity: 0; transform: translateY(-4px) scale(0.98); transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0, 0.8, 0.2, 1); transform-origin: top left;">' +
      '<div class="framer-c71cur" data-border="true" role="dialog" style="--border-bottom-width: 1px; --border-color: rgba(0, 38, 90, 0.14); --border-left-width: 1px; --border-right-width: 1px; --border-style: solid; --border-top-width: 1px; background-color: rgb(255, 255, 255); border-radius: 12px; box-shadow: 0px 8px 20px 0px rgba(0, 25, 70, 0.18); width: 170px; padding: 6px; display: flex; flex-direction: column; gap: 2px; box-sizing: border-box;">' +
      '<div class="framer-caa1bv commentator-option" data-commentator="Lưu Bang" data-avatar="' +
      img('Yg6nej34YPDDFet4CbXU48kB5MY_5b33b28e.png') +
      '" data-framer-name="Lưu Bang Option" data-highlight="true" style="border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; height: 34px; padding: 5px 8px; box-sizing: border-box; transition: background-color 0.15s ease;">' +
      '<div class="framer-tahklm" data-framer-name="Avatar Lưu Bang" style="border-radius: 100px; width: 24px; height: 24px; flex: none; overflow: hidden; position: relative;">' +
      '<div class="ls-s4" data-framer-background-image-wrapper="true" style="position: absolute; inset: 0px; border-radius: inherit;">' +
      '<img class="ls-s149" alt="" decoding="async" height="472" src="' +
      img('Yg6nej34YPDDFet4CbXU48kB5MY_5b33b28e.png') +
      '" width="400" style="display: block; width: 100%; height: 100%; border-radius: inherit; object-position: 45.8% 41%; object-fit: cover;" />' +
      '</div></div>' +
      '<div class="framer-hjt0uq" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(16, 39, 70); flex: 1 0 0px; width: 1px; height: auto;">' +
      '<p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTYwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 11px; --framer-font-weight: 600; --framer-text-color: var(--extracted-r6o4lv, rgb(16, 39, 70)); color: rgb(16, 39, 70); white-space: nowrap;">Lưu Bang</p>' +
      '</div></div>' +
      '<div class="framer-1uakdm5 commentator-option" data-commentator="Gia Cát Lượng" data-avatar="' +
      img('ftE6EP9wNhOHQhEsRJCuIRV2uk_4ee7751d.png') +
      '" data-framer-name="Gia Cát Lượng Option" data-highlight="true" style="border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; height: 34px; padding: 5px 8px; box-sizing: border-box; transition: background-color 0.15s ease;">' +
      '<div class="framer-efylkb" data-framer-name="Avatar Gia Cát Lượng" style="border-radius: 100px; width: 24px; height: 24px; flex: none; overflow: hidden; position: relative;">' +
      '<div class="ls-s4" data-framer-background-image-wrapper="true" style="position: absolute; inset: 0px; border-radius: inherit;">' +
      '<img class="ls-s149" alt="" decoding="async" height="523" src="' +
      img('ftE6EP9wNhOHQhEsRJCuIRV2uk_4ee7751d.png') +
      '" width="587" style="display: block; width: 100%; height: 100%; border-radius: inherit; object-position: 47.6% 11.9%; object-fit: cover;" />' +
      '</div></div>' +
      '<div class="framer-1kzxccu" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(16, 39, 70); flex: 1 0 0px; width: 1px; height: auto;">' +
      '<p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTYwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 11px; --framer-font-weight: 600; --framer-text-color: var(--extracted-r6o4lv, rgb(16, 39, 70)); color: rgb(16, 39, 70); white-space: nowrap;">Gia Cát Lượng</p>' +
      '</div></div>' +
      '<div class="framer-11ofke8 commentator-option" data-commentator="Shelby" data-avatar="' +
      img('wIKNhKyKJ9nlZZOnf2LaeteFjyk_f44a3706.jpg') +
      '" data-framer-name="Shelby Option" data-highlight="true" style="border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; height: 34px; padding: 5px 8px; box-sizing: border-box; transition: background-color 0.15s ease;">' +
      '<div class="framer-1lnb1eh" data-framer-name="Avatar Shelby" style="border-radius: 100px; width: 24px; height: 24px; flex: none; overflow: hidden; position: relative;">' +
      '<div class="ls-s4" data-framer-background-image-wrapper="true" style="position: absolute; inset: 0px; border-radius: inherit;">' +
      '<img class="ls-s149" alt="" decoding="async" height="360" src="' +
      img('wIKNhKyKJ9nlZZOnf2LaeteFjyk_f44a3706.jpg') +
      '" width="240" style="display: block; width: 100%; height: 100%; border-radius: inherit; object-position: 47.3% 26.6%; object-fit: cover;" />' +
      '</div></div>' +
      '<div class="framer-khshqr" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(16, 39, 70); flex: 1 0 0px; width: 1px; height: auto;">' +
      '<p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTYwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 11px; --framer-font-weight: 600; --framer-text-color: var(--extracted-r6o4lv, rgb(16, 39, 70)); color: rgb(16, 39, 70); white-space: nowrap;">Shelby</p>' +
      '</div></div>' +
      '</div></div>';

    var portal = document.querySelector('.luongson-list-matches-commentator-portal');
    if (!portal) {
      var wrap = document.createElement('div');
      wrap.innerHTML = dropdownHtml.trim();
      portal = wrap.firstElementChild;
      portal.classList.add('luongson-list-matches-commentator-portal');
      document.body.appendChild(portal);
    }

    var options = portal.querySelectorAll('.commentator-option');
    options.forEach(function (opt) {
      opt.addEventListener('mouseenter', function () {
        opt.style.backgroundColor = 'rgb(232, 245, 255)';
      });
      opt.addEventListener('mouseleave', function () {
        opt.style.backgroundColor = 'transparent';
      });
    });

    var activeTrigger = null;

    function openDropdown(trigger) {
      if (activeTrigger === trigger && portal.style.display !== 'none') {
        closeDropdown();
        return;
      }

      activeTrigger = trigger;
      portal.style.display = 'block';

      var rect = trigger.getBoundingClientRect();
      var dropdownWidth = 170;
      var dropdownHeight = portal.offsetHeight || 120;
      var left = rect.left;
      if (left + dropdownWidth > window.innerWidth - 10) {
        left = window.innerWidth - dropdownWidth - 10;
      }
      if (left < 10) left = 10;

      var top = rect.bottom + 6;
      if (top + dropdownHeight > window.innerHeight - 10 && rect.top - dropdownHeight - 6 > 0) {
        top = rect.top - dropdownHeight - 6;
      }

      portal.style.left = left + 'px';
      portal.style.top = top + 'px';

      requestAnimationFrame(function () {
        portal.style.opacity = '1';
        portal.style.transform = 'translateY(0px) scale(1)';
      });
    }

    function closeDropdown() {
      portal.style.opacity = '0';
      portal.style.transform = 'translateY(-4px) scale(0.98)';
      setTimeout(function () {
        if (portal.style.opacity === '0') {
          portal.style.display = 'none';
          activeTrigger = null;
        }
      }, 150);
    }

    options.forEach(function (opt) {
      opt.addEventListener('click', function (e) {
        e.stopPropagation();
        var commentator = opt.getAttribute('data-commentator');
        var avatarSrc = opt.getAttribute('data-avatar');

        if (activeTrigger) {
          var textEl = activeTrigger.querySelector('.framer-pgnkcz p, .framer-text');
          if (textEl) textEl.textContent = commentator;

          var imgEl = activeTrigger.querySelector(
            '.framer-16bmefw img, [data-framer-name^="Avatar"] img'
          );
          if (imgEl) imgEl.src = avatarSrc;

          var parentContainer = activeTrigger.closest('.framer-dil7X');
          if (parentContainer) parentContainer.setAttribute('data-framer-name', commentator);
        }

        closeDropdown();
      });
    });

    function attachCommentatorTriggers() {
      var root = document.querySelector('.luongson-list-matches');
      if (!root) return;
      var buttons = root.querySelectorAll(
        '.luongson-match-commentator-container, .framer-dil7X .framer-l9nh29, .framer-dil7X[data-framer-name]'
      );
      buttons.forEach(function (btn) {
        if (btn.__lsListMatchesCommentatorBound) return;
        btn.__lsListMatchesCommentatorBound = true;

        var trigger = btn.classList.contains('framer-l9nh29')
          ? btn
          : btn.querySelector('.framer-l9nh29') || btn;
        trigger.style.cursor = 'pointer';

        trigger.addEventListener('mouseenter', function () {
          trigger.style.backgroundColor = 'rgb(0, 166, 255)';
        });
        trigger.addEventListener('mouseleave', function () {
          trigger.style.backgroundColor = 'rgb(0, 110, 219)';
        });
        trigger.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          openDropdown(trigger);
        });
      });
    }

    attachCommentatorTriggers();

    document.addEventListener('click', function (e) {
      if (
        portal.style.display !== 'none' &&
        !portal.contains(e.target) &&
        (!activeTrigger || !activeTrigger.contains(e.target))
      ) {
        closeDropdown();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && portal.style.display !== 'none') {
        closeDropdown();
      }
    });

    window.addEventListener(
      'scroll',
      function () {
        if (portal.style.display !== 'none' && activeTrigger) {
          var rect = activeTrigger.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight) {
            portal.style.display = 'none';
            portal.style.opacity = '0';
            activeTrigger = null;
          } else {
            openDropdown(activeTrigger);
          }
        }
      },
      { passive: true }
    );

    window.addEventListener('resize', function () {
      if (portal.style.display !== 'none' && activeTrigger) {
        openDropdown(activeTrigger);
      }
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Match info modal                                                         */
  /* ------------------------------------------------------------------------ */

  function initMatchModal() {
    var popoverHtml =
      '<div class="framer-iz7ZB match-info-popover-portal luongson-list-matches-match-portal" style="position: fixed; z-index: 99999; pointer-events: auto; display: none; opacity: 0; transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.2, 0, 0.2, 1); transform: scale(0.96); transform-origin: top center;">' +
      '<div class="framer-aojxv6" role="dialog" style="--corner-shape-fallback: 0.796; background-color: rgb(255, 255, 255); border-radius: 20px; box-shadow: 0px 10px 20px 0px rgba(0, 0, 0, 0.05); width: 384px; box-sizing: border-box; padding: 12px 12px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px;">' +
      '<div class="framer-ry4stz">' +
      '<div class="framer-1an5e9x match-modal-tab active" data-tab="all" data-border="true" style="--border-bottom-width: 1px; --border-color: rgb(82, 125, 255); --border-left-width: 1px; --border-right-width: 1px; --border-style: solid; --border-top-width: 1px; background-color: rgb(82, 125, 255); border-radius: 20px; cursor: pointer; padding: 6px 12px; display: flex; align-items: center; justify-content: center; user-select: none;">' +
      '<div class="framer-k00u1l" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(255, 255, 255);">' +
      '<p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 14px; --framer-font-weight: 700; --framer-text-color: var(--extracted-r6o4lv, rgb(255, 255, 255)); color: var(--extracted-r6o4lv, rgb(255, 255, 255));">Tất cả</p>' +
      '</div></div>' +
      '<div class="framer-10mbhol match-modal-tab" data-tab="h1" data-border="true" style="--border-bottom-width: 1px; --border-color: rgb(82, 125, 255); --border-left-width: 1px; --border-right-width: 1px; --border-style: solid; --border-top-width: 1px; background-color: rgba(0, 0, 0, 0); border-radius: 20px; cursor: pointer; padding: 6px 12px; display: flex; align-items: center; justify-content: center; user-select: none;">' +
      '<div class="framer-9h3v1m" data-framer-component-type="RichTextContainer">' +
      '<p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 14px; --framer-font-weight: 700; color: rgb(0, 0, 0);">Hiệp 1</p>' +
      '</div></div>' +
      '<div class="framer-1pmanb5 match-modal-tab" data-tab="h2" data-border="true" style="--border-bottom-width: 1px; --border-color: rgb(82, 125, 255); --border-left-width: 1px; --border-right-width: 1px; --border-style: solid; --border-top-width: 1px; background-color: rgba(0, 0, 0, 0); border-radius: 20px; cursor: pointer; padding: 6px 12px; display: flex; align-items: center; justify-content: center; user-select: none;">' +
      '<div class="framer-1907n8s" data-framer-component-type="RichTextContainer">' +
      '<p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 14px; --framer-font-weight: 700; color: rgb(0, 0, 0);">Hiệp 2</p>' +
      '</div></div></div>' +
      '<div class="framer-1trrpnw"><div class="framer-lw7m8o">' +
      '<div class="framer-a2fbit" data-framer-component-type="RichTextContainer"><p class="framer-text stat-val-left-possession" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">57%</p></div>' +
      '<div class="framer-1vv346m" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">TL kiểm soát bóng</p></div>' +
      '<div class="framer-vu2aff" data-framer-component-type="RichTextContainer"><p class="framer-text stat-val-right-possession" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">43%</p></div>' +
      '</div><div class="framer-1amiahw">' +
      '<div class="framer-wtawsi" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-1q3228h stat-bar-left-possession" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 57%; transition: width 0.3s ease;"></div></div>' +
      '<div class="framer-1s49rqs" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-1mov7wv stat-bar-right-possession" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 43%; transition: width 0.3s ease;"></div></div>' +
      '</div></div>' +
      '<div class="framer-bgrmuy"><div class="framer-1u6jvqj">' +
      '<div class="framer-h1o2hv" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">4</p></div>' +
      '<div class="framer-4rz9po" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Phạt góc</p></div>' +
      '<div class="framer-xx3myi" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">1</p></div>' +
      '</div><div class="framer-1feu85z">' +
      '<div class="framer-178b2zo" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-1x604t0" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 80%;"></div></div>' +
      '<div class="framer-17jdo00" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-aefbwd" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 20%;"></div></div>' +
      '</div></div>' +
      '<div class="framer-1587lao"><div class="framer-zss6fq">' +
      '<div class="framer-1s3rb2t" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">2</p></div>' +
      '<div class="framer-puwrvi" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Thẻ vàng</p></div>' +
      '<div class="framer-13lnoht" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">0</p></div>' +
      '</div><div class="framer-1aof70k">' +
      '<div class="framer-1yjap8f" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-19t9a93" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 100%;"></div></div>' +
      '<div class="framer-1sexck6" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-1hyr9sk" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 0%;"></div></div>' +
      '</div></div>' +
      '<div class="framer-yce0z5"><div class="framer-ty4t7c">' +
      '<div class="framer-1a4u3ke" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">7</p></div>' +
      '<div class="framer-gac7m7" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Sút bóng</p></div>' +
      '<div class="framer-1t89efh" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">3</p></div>' +
      '</div><div class="framer-x8jp9i">' +
      '<div class="framer-183ar8d" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-1cg1fl1" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 70%;"></div></div>' +
      '<div class="framer-1qu21oe" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-1akp76q" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 30%;"></div></div>' +
      '</div></div>' +
      '<div class="framer-xjkbmx"><div class="framer-1sgrvud">' +
      '<div class="framer-1dfupgd" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">4</p></div>' +
      '<div class="framer-b0in9n" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Sút cầu môn</p></div>' +
      '<div class="framer-1uj1trx" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">1</p></div>' +
      '</div><div class="framer-1kb4wjn">' +
      '<div class="framer-zwoy2" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-1i0d3s5" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 80%;"></div></div>' +
      '<div class="framer-1ibb5np" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-1hrpzha" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 20%;"></div></div>' +
      '</div></div>' +
      '<div class="framer-bl1n0r"><div class="framer-mdn5hv">' +
      '<div class="framer-1v2yfmh" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">3</p></div>' +
      '<div class="framer-bvkwnl" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Sút ngoài cầu môn</p></div>' +
      '<div class="framer-sblwng" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">2</p></div>' +
      '</div><div class="framer-4rigqm">' +
      '<div class="framer-hi9vag" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-p7lsql" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 60%;"></div></div>' +
      '<div class="framer-14qr236" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-1kqvqsm" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 40%;"></div></div>' +
      '</div></div>' +
      '<div class="framer-11lb8cc"><div class="framer-1q9h07r">' +
      '<div class="framer-d56ahn" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">19</p></div>' +
      '<div class="framer-dws4k8" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Tấn công</p></div>' +
      '<div class="framer-6tmamu" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">17</p></div>' +
      '</div><div class="framer-ui41va">' +
      '<div class="framer-11yx3jj" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-1juwgxq" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 53%;"></div></div>' +
      '<div class="framer-va1nw0" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-o67ujt" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 47%;"></div></div>' +
      '</div></div>' +
      '<div class="framer-nmrzbo"><div class="framer-1ibdxtk">' +
      '<div class="framer-rozn0b" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">23</p></div>' +
      '<div class="framer-ysnhtg" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Tấn công nguy hiểm</p></div>' +
      '<div class="framer-rt7wpv" data-framer-component-type="RichTextContainer"><p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: \'Momo Trust Sans\', \'Momo Trust Sans Placeholder\', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">8</p></div>' +
      '</div><div class="framer-hlv9iz">' +
      '<div class="framer-1n2ttzj" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-1fe3abr" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 74%;"></div></div>' +
      '<div class="framer-18b5mhn" style="background-color: rgb(204, 204, 204); border-radius: 8px;"><div class="framer-pp1e24" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 26%;"></div></div>' +
      '</div></div></div></div>';

    var portal = document.querySelector('.luongson-list-matches-match-portal');
    if (!portal) {
      var wrap = document.createElement('div');
      wrap.innerHTML = popoverHtml.trim();
      portal = wrap.firstElementChild;
      document.body.appendChild(portal);
    }

    var leftPossText = portal.querySelector('.stat-val-left-possession');
    var rightPossText = portal.querySelector('.stat-val-right-possession');
    var leftPossBar = portal.querySelector('.stat-bar-left-possession');
    var rightPossBar = portal.querySelector('.stat-bar-right-possession');
    var tabs = portal.querySelectorAll('.match-modal-tab');

    var tabData = {
      all: { leftText: '57%', rightText: '43%', leftWidth: '57%', rightWidth: '43%' },
      h1: { leftText: '70%', rightText: '30%', leftWidth: '70%', rightWidth: '30%' },
      h2: { leftText: '45%', rightText: '55%', leftWidth: '45%', rightWidth: '55%' },
    };

    function setTab(tabName) {
      tabs.forEach(function (t) {
        var isCur = t.getAttribute('data-tab') === tabName;
        var textEl = t.querySelector('p');
        if (isCur) {
          t.style.backgroundColor = 'rgb(82, 125, 255)';
          if (textEl) textEl.style.color = 'rgb(255, 255, 255)';
        } else {
          t.style.backgroundColor = 'rgba(0, 0, 0, 0)';
          if (textEl) textEl.style.color = 'rgb(0, 0, 0)';
        }
      });

      var data = tabData[tabName] || tabData.all;
      if (leftPossText) leftPossText.textContent = data.leftText;
      if (rightPossText) rightPossText.textContent = data.rightText;
      if (leftPossBar) leftPossBar.style.width = data.leftWidth;
      if (rightPossBar) rightPossBar.style.width = data.rightWidth;
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function (e) {
        e.stopPropagation();
        setTab(tab.getAttribute('data-tab'));
      });
    });

    var currentTrigger = null;
    var closeTimeout = null;

    function showPopover(trigger) {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }

      currentTrigger = trigger;
      portal.style.display = 'block';

      var rect = trigger.getBoundingClientRect();
      var modalWidth = 384;
      var modalHeight = portal.offsetHeight || 440;
      var left = rect.left + rect.width / 2 - modalWidth / 2;
      if (left < 10) left = 10;
      if (left + modalWidth > window.innerWidth - 10) {
        left = window.innerWidth - modalWidth - 10;
      }

      var top = rect.bottom + 4;
      if (top + modalHeight > window.innerHeight - 10 && rect.top - modalHeight - 4 > 0) {
        top = rect.top - modalHeight - 4;
      }

      portal.style.left = left + 'px';
      portal.style.top = top + 'px';

      requestAnimationFrame(function () {
        portal.style.opacity = '1';
        portal.style.transform = 'scale(1)';
      });
    }

    function hidePopover() {
      if (closeTimeout) clearTimeout(closeTimeout);
      closeTimeout = setTimeout(function () {
        portal.style.opacity = '0';
        portal.style.transform = 'scale(0.96)';
        setTimeout(function () {
          if (portal.style.opacity === '0') {
            portal.style.display = 'none';
            currentTrigger = null;
          }
        }, 150);
      }, 120);
    }

    portal.addEventListener('mouseenter', function () {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    });
    portal.addEventListener('mouseleave', function () {
      hidePopover();
    });

    function attachBadges() {
      var root = document.querySelector('.luongson-list-matches');
      if (!root) return;
      var badges = root.querySelectorAll(
        '.luongson-match-status-container, .framer-iz7ZB.framer-3i8edo, [data-framer-name="Tất cả"] .framer-oy32wj'
      );
      badges.forEach(function (badge) {
        if (badge.__lsListMatchesModalBound) return;
        badge.__lsListMatchesModalBound = true;

        var target = badge.closest('.framer-iz7ZB') || badge;
        target.style.cursor = 'pointer';
        target.addEventListener('mouseenter', function () {
          showPopover(target);
        });
        target.addEventListener('mouseleave', function () {
          hidePopover();
        });
      });
    }

    attachBadges();

    window.addEventListener(
      'scroll',
      function () {
        if (portal.style.display !== 'none' && currentTrigger) {
          var rect = currentTrigger.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight) {
            portal.style.display = 'none';
            portal.style.opacity = '0';
            currentTrigger = null;
          } else {
            showPopover(currentTrigger);
          }
        }
      },
      { passive: true }
    );

    window.addEventListener('resize', function () {
      if (portal.style.display !== 'none' && currentTrigger) {
        showPopover(currentTrigger);
      }
    });
  }

  function initAll() {
    if (!document.querySelector('.luongson-list-matches')) return;
    initCommentatorDropdown();
    initMatchModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
