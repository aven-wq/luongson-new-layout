/**
 * LuongSon Sport — Match schedule date picker + status hover modal
 */
(function () {
  'use strict';

  var MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function isSameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function formatLabel(date) {
    var today = new Date();
    var dm = pad(date.getDate()) + '/' + MONTHS[date.getMonth()];
    if (isSameDay(date, today)) {
      return 'Hôm nay, ' + dm;
    }
    var yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(date, yesterday)) {
      return 'Hôm qua, ' + dm;
    }
    var tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (isSameDay(date, tomorrow)) {
      return 'Ngày mai, ' + dm;
    }
    return dm + '/' + date.getFullYear();
  }

  function initSchedule(root) {
    if (!root || root.__lsScheduleInit) return;
    root.__lsScheduleInit = true;

    var label = root.querySelector('.luongson-schedule__date-label');
    var prev = root.querySelector('[data-framer-name="Previous Day"]');
    var next = root.querySelector('[data-framer-name="Next Day"]');
    if (!label || !prev || !next) return;

    var current = new Date();
    current.setHours(0, 0, 0, 0);

    function render() {
      label.textContent = formatLabel(current);
    }

    prev.addEventListener('click', function (e) {
      e.preventDefault();
      current.setDate(current.getDate() - 1);
      render();
    });

    next.addEventListener('click', function (e) {
      e.preventDefault();
      current.setDate(current.getDate() + 1);
      render();
    });

    render();
  }

  /* ------------------------------------------------------------------------ */
  /* Match status modal (hover on live badge — same as list-matches / HTML)   */
  /* ------------------------------------------------------------------------ */

  function initMatchModal(root) {
    if (!root || root.__lsScheduleModalInit) return;
    root.__lsScheduleModalInit = true;

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

    if (!portal.__lsTabsBound) {
      portal.__lsTabsBound = true;
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function (e) {
          e.stopPropagation();
          setTab(tab.getAttribute('data-tab'));
        });
      });
    }

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

    if (!portal.__lsHoverBound) {
      portal.__lsHoverBound = true;
      portal.addEventListener('mouseenter', function () {
        if (closeTimeout) {
          clearTimeout(closeTimeout);
          closeTimeout = null;
        }
      });
      portal.addEventListener('mouseleave', hidePopover);
    }

    root.querySelectorAll('.luongson-match-status, .framer-iz7ZB.framer-3i8edo').forEach(function (badge) {
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
    document.querySelectorAll('.luongson-schedule').forEach(function (root) {
      initSchedule(root);
      initMatchModal(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
