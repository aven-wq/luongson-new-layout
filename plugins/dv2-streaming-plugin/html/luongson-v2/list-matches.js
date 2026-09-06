/**
 * LuongSon Sport — Live matches list
 * Commentator dropdown + match-status hover modal
 */
(function () {
  'use strict';

  var cfg = window.luongsonListMatches || {};
  var IMG = cfg.imgUrl || '';

  function img(file) {
    return IMG + file;
  }

  /* ------------------------------------------------------------------------ */
  /* Static mock cards (replace with API when ready)                          */
  /* ------------------------------------------------------------------------ */

  function buildMatchCardHtml() {
    return (
      '<div class="luongson-match-card" data-border="true">' +
      '<div class="luongson-match-header">' +
      '<div class="luongson-match-league"><p>Premier League</p></div>' +
      '<div class="luongson-match-status-container">' +
      '<div class="luongson-match-status" data-highlight="true">' +
      '<span class="luongson-match-status-dot" aria-hidden="true"></span>' +
      '<span class="luongson-match-status-text">Hiệp 2 - 72’</span>' +
      '</div></div>' +
      '<div class="luongson-match-time-box">' +
      '<span class="luongson-match-time">15:30</span>' +
      '<span class="luongson-match-date">15.08</span>' +
      '</div></div>' +
      '<a class="luongson-match-body" href="#">' +
      '<div class="luongson-match-team">' +
      '<div class="luongson-match-team-logo">' +
      '<img alt="" decoding="async" height="128" src="' +
      img('Dq03h2PCDoRXrVQvPC7ywAo9R0_7881bb5a.png') +
      '" width="128" />' +
      '</div><div class="luongson-match-team-name"><p>Burnley</p></div></div>' +
      '<div class="luongson-match-score-center">' +
      '<div class="luongson-match-score-box"><p class="luongson-match-score-text">2 - 1</p></div>' +
      '<div class="luongson-match-stats">' +
      '<div class="luongson-match-stat-item">' +
      '<svg class="luongson-match-stat-flag" role="presentation" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M5 21V4m0 0l13 4.5L5 13V4z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />' +
      '</svg><span class="luongson-match-stat-text">6-8</span></div>' +
      '<div class="luongson-match-stat-item">' +
      '<span class="luongson-match-stat-card is-yellow" aria-hidden="true"></span>' +
      '<span class="luongson-match-stat-text">2-2</span></div>' +
      '<div class="luongson-match-stat-item">' +
      '<span class="luongson-match-stat-card is-red" aria-hidden="true"></span>' +
      '<span class="luongson-match-stat-text">2-0</span></div>' +
      '</div></div>' +
      '<div class="luongson-match-team">' +
      '<div class="luongson-match-team-logo">' +
      '<img alt="" decoding="async" height="128" src="' +
      img('U86AWvixUpZ9FQv4FEwV6sRB5Y_59f68630.png') +
      '" width="128" />' +
      '</div><div class="luongson-match-team-name"><p>Wolverhampton</p></div></div>' +
      '</a>' +
      '<div class="luongson-match-footer">' +
      '<div class="luongson-match-commentator-container">' +
      '<div class="luongson-match-commentator" data-commentator="Lưu Bang">' +
      '<button type="button" class="luongson-match-commentator-trigger" aria-haspopup="listbox" aria-expanded="false">' +
      '<span class="luongson-match-commentator-avatar" data-border="true">' +
      '<img alt="" decoding="async" height="472" src="' +
      img('luu-bang.png') +
      '" width="400" />' +
      '</span><span class="luongson-match-commentator-name">Lưu Bang</span>' +
      '<svg class="luongson-match-commentator-chevron" role="presentation" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />' +
      '</svg></button></div></div>' +
      '<div class="luongson-match-odds-wrapper">' +
      '<div class="luongson-match-odds-box">' +
      '<div class="luongson-match-odds-type"><span>HDP FT</span></div>' +
      '<div class="luongson-match-odds-values">' +
      '<span class="luongson-match-odds-val is-home">0.97</span>' +
      '<span class="luongson-match-odds-val">2.5</span>' +
      '<span class="luongson-match-odds-val is-away">0.83</span>' +
      '</div></div>' +
      '<a class="luongson-match-bet-btn" href="#" data-border="true">' +
      '<img class="luongson-match-bet-logo" alt="" decoding="async" height="68" loading="lazy" src="' +
      img('KB717wZbU63tSAHyTm9pLUqxM_b79bb177.png') +
      '" width="280" />' +
      '<span class="luongson-match-bet-text">cược</span></a>' +
      '</div></div></div>'
    );
  }

  function renderStaticMockCards(root) {
    var grid = root.querySelector('.luongson-live-grid');
    var ads = grid && grid.querySelector('.luongson-live-ads');
    if (!grid || !ads || grid.dataset.staticRendered) return;

    grid.dataset.staticRendered = '1';
    var cardHtml = buildMatchCardHtml();
    var i;

    for (i = 0; i < 6; i++) {
      ads.insertAdjacentHTML('beforebegin', cardHtml);
    }
    for (i = 0; i < 6; i++) {
      ads.insertAdjacentHTML('afterend', cardHtml);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Commentator dropdown                                                     */
  /* ------------------------------------------------------------------------ */

  function initCommentatorDropdown(root) {
    var portal = document.querySelector('.luongson-commentator-portal');
    if (!portal) {
      portal = document.createElement('div');
      portal.className = 'luongson-commentator-portal';
      portal.hidden = true;
      portal.style.cssText =
        'display:none;opacity:0;transform:translateY(-4px) scale(0.98);transition:opacity .15s ease,transform .15s cubic-bezier(0,.8,.2,1);transform-origin:top left;';
      portal.innerHTML =
        '<div class="luongson-commentator-portal__panel" data-border="true" role="listbox">' +
        optionHtml('Lưu Bang', 'luu-bang.png', '45.8% 41%') +
        optionHtml('Gia Cát Lượng', 'gia-cat-luong.png', '47.6% 11.9%') +
        optionHtml('Shelby', 'shelby.jpg', '47.3% 26.6%') +
        '</div>';
      document.body.appendChild(portal);
    }

    function optionHtml(name, file, pos) {
      return (
        '<button type="button" class="luongson-commentator-option" role="option" data-commentator="' +
        name +
        '" data-avatar="' +
        img(file) +
        '">' +
        '<span class="luongson-commentator-option__avatar">' +
        '<img alt="" decoding="async" src="' +
        img(file) +
        '" style="object-position:' +
        pos +
        '" />' +
        '</span>' +
        '<span class="luongson-commentator-option__name">' +
        name +
        '</span>' +
        '</button>'
      );
    }

    var activeTrigger = null;

    function openDropdown(trigger) {
      if (activeTrigger === trigger && portal.style.display !== 'none') {
        closeDropdown();
        return;
      }

      activeTrigger = trigger;
      trigger.setAttribute('aria-expanded', 'true');
      portal.hidden = false;
      portal.style.display = 'block';

      var rect = trigger.getBoundingClientRect();
      var w = 170;
      var h = portal.offsetHeight || 120;
      var left = rect.left;
      if (left + w > window.innerWidth - 10) left = window.innerWidth - w - 10;
      if (left < 10) left = 10;

      var top = rect.bottom + 6;
      if (top + h > window.innerHeight - 10 && rect.top - h - 6 > 0) {
        top = rect.top - h - 6;
      }

      portal.style.left = left + 'px';
      portal.style.top = top + 'px';

      requestAnimationFrame(function () {
        portal.style.opacity = '1';
        portal.style.transform = 'translateY(0) scale(1)';
      });
    }

    function closeDropdown() {
      if (activeTrigger) activeTrigger.setAttribute('aria-expanded', 'false');
      portal.style.opacity = '0';
      portal.style.transform = 'translateY(-4px) scale(0.98)';
      setTimeout(function () {
        if (portal.style.opacity === '0') {
          portal.style.display = 'none';
          portal.hidden = true;
          activeTrigger = null;
        }
      }, 150);
    }

    portal.querySelectorAll('.luongson-commentator-option').forEach(function (opt) {
      opt.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!activeTrigger) return;

        var name = opt.getAttribute('data-commentator');
        var avatar = opt.getAttribute('data-avatar');
        var nameEl = activeTrigger.querySelector('.luongson-match-commentator-name');
        var imgEl = activeTrigger.querySelector('.luongson-match-commentator-avatar img');
        var wrap = activeTrigger.closest('.luongson-match-commentator');

        if (nameEl) nameEl.textContent = name;
        if (imgEl) imgEl.src = avatar;
        if (wrap) wrap.setAttribute('data-commentator', name);

        closeDropdown();
      });
    });

    root.querySelectorAll('.luongson-match-commentator-trigger').forEach(function (btn) {
      if (btn.__lsBound) return;
      btn.__lsBound = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openDropdown(btn);
      });
    });

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
      if (e.key === 'Escape' && portal.style.display !== 'none') closeDropdown();
    });

    window.addEventListener(
      'scroll',
      function () {
        if (portal.style.display === 'none' || !activeTrigger) return;
        var rect = activeTrigger.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          portal.style.display = 'none';
          portal.style.opacity = '0';
          activeTrigger.setAttribute('aria-expanded', 'false');
          activeTrigger = null;
        } else {
          openDropdown(activeTrigger);
        }
      },
      { passive: true }
    );

    window.addEventListener('resize', function () {
      if (portal.style.display !== 'none' && activeTrigger) openDropdown(activeTrigger);
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Match status modal                                                       */
  /* ------------------------------------------------------------------------ */

  function initMatchModal(root) {
    var portal = document.querySelector('.luongson-match-modal-portal');
    if (!portal) {
      portal = document.createElement('div');
      portal.className = 'luongson-match-modal-portal';
      portal.hidden = true;
      portal.style.cssText =
        'display:none;opacity:0;transform:scale(.96);transform-origin:top center;transition:opacity .15s ease,transform .15s cubic-bezier(.2,0,.2,1);';
      portal.innerHTML =
        '<div class="luongson-match-modal-portal__panel" role="dialog">' +
        '<div class="luongson-match-modal-tabs">' +
        tabHtml('all', 'Tất cả', true) +
        tabHtml('h1', 'Hiệp 1', false) +
        tabHtml('h2', 'Hiệp 2', false) +
        '</div>' +
        rowHtml('possession', 'TL kiểm soát bóng', '57%', '43%', 57, 43) +
        rowHtml(null, 'Phạt góc', '4', '1', 80, 20) +
        rowHtml(null, 'Thẻ vàng', '2', '0', 100, 0) +
        rowHtml(null, 'Sút bóng', '7', '3', 70, 30) +
        rowHtml(null, 'Sút cầu môn', '4', '1', 80, 20) +
        rowHtml(null, 'Sút ngoài cầu môn', '3', '2', 60, 40) +
        rowHtml(null, 'Tấn công', '19', '17', 53, 47) +
        rowHtml(null, 'Tấn công nguy hiểm', '23', '8', 74, 26) +
        '</div>';
      document.body.appendChild(portal);
    }

    function tabHtml(id, label, active) {
      return (
        '<button type="button" class="luongson-match-modal-tab' +
        (active ? ' is-active' : '') +
        '" data-tab="' +
        id +
        '" data-border="true">' +
        label +
        '</button>'
      );
    }

    function rowHtml(key, label, left, right, leftPct, rightPct) {
      var leftCls = key ? 'stat-val-left-' + key + ' is-val' : 'is-val';
      var rightCls = key ? 'stat-val-right-' + key + ' is-val' : 'is-val';
      var leftBarCls = key ? 'stat-bar-left-' + key : '';
      var rightBarCls = key ? 'stat-bar-right-' + key : '';
      return (
        '<div class="luongson-match-modal-row">' +
        '<div class="luongson-match-modal-row__labels">' +
        '<span class="' +
        leftCls +
        '">' +
        left +
        '</span>' +
        '<span class="is-label">' +
        label +
        '</span>' +
        '<span class="' +
        rightCls +
        '">' +
        right +
        '</span>' +
        '</div>' +
        '<div class="luongson-match-modal-bars">' +
        '<div class="luongson-match-modal-bar is-home"><span class="' +
        leftBarCls +
        '" style="width:' +
        leftPct +
        '%"></span></div>' +
        '<div class="luongson-match-modal-bar is-away"><span class="' +
        rightBarCls +
        '" style="width:' +
        rightPct +
        '%"></span></div>' +
        '</div></div>'
      );
    }

    var leftText = portal.querySelector('.stat-val-left-possession');
    var rightText = portal.querySelector('.stat-val-right-possession');
    var leftBar = portal.querySelector('.stat-bar-left-possession');
    var rightBar = portal.querySelector('.stat-bar-right-possession');
    var tabs = portal.querySelectorAll('.luongson-match-modal-tab');
    var tabData = {
      all: { leftText: '57%', rightText: '43%', leftWidth: '57%', rightWidth: '43%' },
      h1: { leftText: '70%', rightText: '30%', leftWidth: '70%', rightWidth: '30%' },
      h2: { leftText: '45%', rightText: '55%', leftWidth: '45%', rightWidth: '55%' },
    };

    function setTab(name) {
      tabs.forEach(function (t) {
        t.classList.toggle('is-active', t.getAttribute('data-tab') === name);
      });
      var data = tabData[name] || tabData.all;
      if (leftText) leftText.textContent = data.leftText;
      if (rightText) rightText.textContent = data.rightText;
      if (leftBar) leftBar.style.width = data.leftWidth;
      if (rightBar) rightBar.style.width = data.rightWidth;
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
      portal.hidden = false;
      portal.style.display = 'block';

      var rect = trigger.getBoundingClientRect();
      var modalWidth = Math.min(384, window.innerWidth - 24);
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
            portal.hidden = true;
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
    portal.addEventListener('mouseleave', hidePopover);

    root.querySelectorAll('.luongson-match-status').forEach(function (badge) {
      if (badge.__lsBound) return;
      badge.__lsBound = true;
      badge.addEventListener('mouseenter', function () {
        showPopover(badge);
      });
      badge.addEventListener('mouseleave', hidePopover);
    });

    window.addEventListener(
      'scroll',
      function () {
        if (portal.style.display === 'none' || !currentTrigger) return;
        var rect = currentTrigger.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          portal.style.display = 'none';
          portal.style.opacity = '0';
          currentTrigger = null;
        } else {
          showPopover(currentTrigger);
        }
      },
      { passive: true }
    );

    window.addEventListener('resize', function () {
      if (portal.style.display !== 'none' && currentTrigger) showPopover(currentTrigger);
    });
  }

  function initAll() {
    var root = document.querySelector('.luongson-list-matches');
    if (!root) return;
    renderStaticMockCards(root);
    initCommentatorDropdown(root);
    initMatchModal(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
