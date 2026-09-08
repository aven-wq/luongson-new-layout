/**
 * LuongSon V2 — Live stream player (jQuery)
 * Tải dữ liệu trận, phát HLS, đổi BLV, hiển thị kèo & ticker.
 */
(function ($) {
  'use strict';

  // --- Cấu hình từ WordPress runtime (class-assets-loader) hoặc HTML prototype ---
  var cfg = window.luongsonStreamMatch || {};
  var pluginUrl = (
    typeof window.DV2_STREAMING_PLUGIN_URL !== 'undefined' && window.DV2_STREAMING_PLUGIN_URL
  ) || (window.dv2Streaming && window.dv2Streaming.pluginUrl) || cfg.assetsUrl || '';

  if (pluginUrl && pluginUrl.slice(-1) !== '/') {
    pluginUrl += '/';
  }

  var ASSETS = pluginUrl
    ? pluginUrl + 'assets/images/luongson-v2/'
    : (cfg.assetsUrl || '../../assets/images/luongson-v2/');
  var IMG = pluginUrl
    ? pluginUrl + 'html/luongson-v2/images/'
    : (cfg.imgUrl || 'images/');
  var API_BASE = (
    typeof window.BASE_API_URL !== 'undefined' && window.BASE_API_URL
  )
    ? String(window.BASE_API_URL).replace(/\/+$/, '') + '/api/data/lives/'
    : (cfg.apiBase || 'https://vsc-apidev.helizones.com/api/data/lives/');
  var MATCH_ID = (
    typeof window.DV2_MATCH_ID !== 'undefined' && window.DV2_MATCH_ID
  ) || cfg.matchId || 'zp5rzghge5n8q82';
  var POSTER = cfg.posterUrl || ASSETS + 'bg-stream.webp';
  var FALLBACK_AVATAR = ASSETS + 'svg-blv.svg';
  var BET_URL = (
    typeof window.DV2_LINK_BET !== 'undefined' && window.DV2_LINK_BET
  ) || cfg.betUrl || cfg.playCtaUrl || '#';

  // --- Biến trạng thái ---
  var currentHls = null;
  var playbackGen = 0;
  var matchData = null;
  var streamLinks = [];
  var activeLinkIndex = 0;
  var preMatchCountdownTimer = null;
  var streamPlaybackOk = false;
  var playbackWatchdogTimer = null;
  var fsTopBarCycleTimer = null;
  var fsTopBarHideTimer = null;
  var FS_TOP_BAR_INTERVAL_MS = 60000;
  var FS_TOP_BAR_VISIBLE_MS = 10000;
  var KICKOFF_COUNTDOWN_MS = 24 * 60 * 60 * 1000;
  var VN_TIMEZONE = 'Asia/Ho_Chi_Minh';
  var LIVE_STATUSES = [
    'first half',
    'second half',
    'half-time',
    'half time',
    'halftime',
    'ht',
    'overtime',
    'overtime(deprecated)',
    'penalty shoot-out',
    'penalty',
    'live'
  ];

  /** Lấy match id từ ?match=, DV2_MATCH_ID (/streams/{id}), hoặc mặc định */
  function getMatchId() {
    var params = new URLSearchParams(window.location.search);
    var matchId = params.get('match');

    if (!matchId) {
      if (typeof window.DV2_MATCH_ID !== 'undefined' && window.DV2_MATCH_ID) {
        matchId = window.DV2_MATCH_ID;
      } else {
        matchId = MATCH_ID;
      }
    }

    return matchId;
  }

  /** Format số kèo: 1.5 → "1.50" */
  function formatOdd(val) {
    if (val == null || val === '') return '-';
    var n = Number(val);
    return Number.isFinite(n) ? n.toFixed(2) : '-';
  }

  /** Class CSS theo xu hướng kèo lên/xuống */
  function trendClass(trend) {
    if (trend === 'up') return 'is-up';
    if (trend === 'down') return 'is-down';
    return '';
  }

  function normalizeStatus(status) {
    return String(status || '').toLowerCase().trim();
  }

  /** API detail trả kickoff/status trong matchInfo hoặc root */
  function getMatchKickoff(data) {
    if (!data) return '';
    return (data.matchInfo && data.matchInfo.kickoff) || data.kickoff || '';
  }

  function getMatchStatus(data) {
    if (!data) return '';
    return (data.matchInfo && data.matchInfo.status) || data.status || '';
  }

  function isFinishedStatus(status) {
    var s = normalizeStatus(status);
    return s === 'finished' || s === 'ft' || s === 'end';
  }

  function isNotStartedStatus(status) {
    var s = normalizeStatus(status);
    return s === 'not started' || s === 'ns' || s === '';
  }

  function isMatchLive(data, activeLink) {
    if (activeLink && activeLink.isStreaming) return true;
    if (!data) return false;
    return LIVE_STATUSES.indexOf(normalizeStatus(getMatchStatus(data))) !== -1;
  }

  function formatStatusText(data) {
    if (!data) return 'Chưa diễn ra';

    var status = normalizeStatus(getMatchStatus(data));

    if (LIVE_STATUSES.indexOf(status) !== -1) {
      if (status === 'half-time' || status === 'halftime' || status === 'ht' || status === 'half time') {
        return 'Giữa hiệp';
      }
      if (status === 'first half') return 'Hiệp 1';
      if (status === 'second half') return 'Hiệp 2';
      if (status === 'overtime' || status === 'overtime(deprecated)') return 'Hiệp phụ';
      if (status === 'penalty shoot-out' || status === 'penalty') return 'Penalty';
      if (data.currentMinutes != null && data.currentMinutes !== '') {
        return String(data.currentMinutes) + "'";
      }
      return 'Trực tiếp';
    }

    if (isFinishedStatus(status)) return 'Kết thúc';
    if (isNotStartedStatus(status)) return 'Chưa diễn ra';
    if (status === 'delay') return 'Hoãn';
    if (status === 'interrupt') return 'Tạm dừng';
    if (status === 'cancel' || status === 'cancelled') return 'Hủy';

    return getMatchStatus(data) || 'Chưa diễn ra';
  }

  function getStatusBadgeClass(data) {
    if (!data) return 'is-upcoming';
    var status = normalizeStatus(getMatchStatus(data));
    if (isFinishedStatus(status)) return 'is-finished';
    if (status === 'delay' || status === 'interrupt') return 'is-delay';
    return 'is-upcoming';
  }

  /** Parse kickoff ISO; chuỗi không có offset được coi là giờ UTC+7 */
  function parseKickoffDate(kickoff) {
    if (!kickoff) return null;
    if (kickoff instanceof Date) {
      return Number.isNaN(kickoff.getTime()) ? null : kickoff;
    }

    var str = String(kickoff).trim();
    if (!str) return null;

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) && !/[zZ]|[+-]\d{2}:\d{2}$/.test(str)) {
      str += '+07:00';
    }

    var date = new Date(str);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  /** Lấy ngày/giờ theo múi giờ Việt Nam (UTC+7) */
  function getVnDateParts(date) {
    if (!date) return null;

    var formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: VN_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    var parts = {};
    var i;
    var part;
    var formatted = formatter.formatToParts(date);

    for (i = 0; i < formatted.length; i++) {
      part = formatted[i];
      if (part.type !== 'literal') parts[part.type] = part.value;
    }

    if (parts.hour === '24') parts.hour = '00';
    return parts;
  }

  function getKickoffDiffMs(kickoff) {
    var kickoffTime = parseKickoffDate(kickoff);
    if (!kickoffTime) return null;
    return kickoffTime.getTime() - Date.now();
  }

  function shouldShowCountdown(kickoff) {
    var diffMs = getKickoffDiffMs(kickoff);
    return diffMs !== null && diffMs > 0 && diffMs < KICKOFF_COUNTDOWN_MS;
  }

  function formatCountdownParts(kickoff) {
    var diffMs = getKickoffDiffMs(kickoff);
    if (diffMs === null || diffMs <= 0) {
      return { h: '00', m: '00', s: '00' };
    }

    var hours = Math.floor(diffMs / (1000 * 60 * 60));
    var minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return {
      h: String(hours).padStart(2, '0'),
      m: String(minutes).padStart(2, '0'),
      s: String(seconds).padStart(2, '0')
    };
  }

  function formatKickoffDateTime(kickoff) {
    var date = parseKickoffDate(kickoff);
    if (!date) return '—';

    var parts = getVnDateParts(date);
    if (!parts) return '—';

    return parts.day + '/' + parts.month + '/' + parts.year + ' ' + parts.hour + ':' + parts.minute;
  }

  function stopPreMatchCountdown() {
    if (preMatchCountdownTimer) {
      clearInterval(preMatchCountdownTimer);
      preMatchCountdownTimer = null;
    }
  }

  function updateCountdownDisplay(kickoff) {
    var parts = formatCountdownParts(kickoff);
    $('#luongsonPreMatchCdH').text(parts.h);
    $('#luongsonPreMatchCdM').text(parts.m);
    $('#luongsonPreMatchCdS').text(parts.s);
  }

  function startPreMatchCountdown(kickoff) {
    stopPreMatchCountdown();
    if (!shouldShowCountdown(kickoff)) return;

    updateCountdownDisplay(kickoff);
    preMatchCountdownTimer = setInterval(function () {
      if (!shouldShowCountdown(kickoff)) {
        stopPreMatchCountdown();
        if (matchData) updatePreMatchOverlay(matchData, streamLinks[activeLinkIndex] || null);
        return;
      }
      updateCountdownDisplay(kickoff);
    }, 1000);
  }

  function setPreMatchCenterMode(mode) {
    $('#luongsonPreMatchCountdown').prop('hidden', mode !== 'countdown');
    $('#luongsonPreMatchDatetime').prop('hidden', mode !== 'datetime');
    $('#luongsonPreMatchScore').prop('hidden', mode !== 'score');
  }

  function shouldHidePreMatchOverlay(data, activeLink) {
    return isMatchLive(data, activeLink) && streamPlaybackOk;
  }

  function updatePreMatchOverlay(data, activeLink) {
    var $overlay = $('#luongsonStreamPreMatch');
    if (!$overlay.length || !data) return;

    if (shouldHidePreMatchOverlay(data, activeLink)) {
      hidePreMatchOverlay();
      return;
    }

    var teams = data.teams || {};
    var league = data.league || {};
    var home = teams.home || {};
    var away = teams.away || {};
    var kickoff = getMatchKickoff(data);
    var matchStatus = getMatchStatus(data);
    var statusText = formatStatusText(data);
    var finished = isFinishedStatus(matchStatus);
    var live = isMatchLive(data, activeLink);
    var score = data.score && data.score.fulltime ? data.score.fulltime : null;

    $('#luongsonPreMatchLeague').text(league.name || '—');
    $('#luongsonPreMatchStatusText').text(statusText);
    $('#luongsonPreMatchStatus')
      .removeClass('is-upcoming is-finished is-delay')
      .addClass(getStatusBadgeClass(data));

    if (league.logo) {
      $('#luongsonPreMatchLeagueLogo').attr({ src: league.logo, alt: league.name || '' }).removeAttr('hidden');
    } else {
      $('#luongsonPreMatchLeagueLogo').attr('hidden', 'hidden');
    }

    $('#luongsonPreMatchHomeName').text(home.name || '—');
    $('#luongsonPreMatchAwayName').text(away.name || '—');
    $('#luongsonPreMatchHomeLogo').attr({
      src: home.logo || '',
      alt: home.name || ''
    });
    $('#luongsonPreMatchAwayLogo').attr({
      src: away.logo || '',
      alt: away.name || ''
    });

    stopPreMatchCountdown();

    if ((finished || live) && score) {
      setPreMatchCenterMode('score');
      $('#luongsonPreMatchScoreVal').text(
        (score.home != null ? score.home : 0) + ' - ' + (score.away != null ? score.away : 0)
      );
    } else if (shouldShowCountdown(kickoff)) {
      setPreMatchCenterMode('countdown');
      updateCountdownDisplay(kickoff);
      startPreMatchCountdown(kickoff);
    } else {
      setPreMatchCenterMode('datetime');
      $('#luongsonPreMatchDatetimeVal').text(formatKickoffDateTime(kickoff));
    }

    $overlay.removeAttr('hidden');
    scheduleStreamUiLayerLayoutSync();
  }

  function hidePreMatchOverlay() {
    stopPreMatchCountdown();
    $('#luongsonStreamPreMatch').attr('hidden', 'hidden');
    scheduleStreamUiLayerLayoutSync();
  }

  /** Container gắn overlay TVC pre-roll (giống .dv2-video-wrapper ở vebo/cakhia) */
  function getTvcContainer() {
    return $('.luongson-stream-video-wrap').first();
  }

  /** Phát TVC trước khi hiển thị stream / prematch (bỏ qua nếu chưa cấu hình) */
  function playBeforeStreamWithTvc(onDone) {
    var $container = getTvcContainer();
    if (window.DV2StreamTvc && typeof window.DV2StreamTvc.playBeforeStream === 'function') {
      window.DV2StreamTvc.playBeforeStream($container, onDone);
      return;
    }
    if (typeof onDone === 'function') onDone();
  }

  /** Hiện / ẩn overlay "Đang tải..." */
  function setLoading(show, message) {
    var $el = $('#luongsonStreamLoading');
    if (!$el.length) return;
    if (show) {
      $el.removeAttr('hidden');
      if (message) $el.find('.luongson-stream-loading__text').text(message);
    } else {
      $el.attr('hidden', 'hidden');
    }
  }

  /** Dừng và giải phóng HLS cũ */
  function destroyHls() {
    playbackGen += 1;
    clearPlaybackWatchdog();
    streamPlaybackOk = false;
    if (currentHls) {
      try { currentHls.destroy(); } catch (e) {}
      currentHls = null;
    }
  }

  function clearPlaybackWatchdog() {
    if (playbackWatchdogTimer) {
      clearTimeout(playbackWatchdogTimer);
      playbackWatchdogTimer = null;
    }
  }

  function startPlaybackWatchdog(gen) {
    clearPlaybackWatchdog();
    playbackWatchdogTimer = setTimeout(function () {
      if (gen !== playbackGen || streamPlaybackOk) return;
      setLoading(false);
      if (matchData) {
        updatePreMatchOverlay(matchData, streamLinks[activeLinkIndex] || null);
      }
    }, 15000);
  }

  function onStreamPlaybackFailed(gen) {
    if (gen !== playbackGen) return;
    streamPlaybackOk = false;
    clearPlaybackWatchdog();
    setLoading(false);

    var $video = $('#liveVideo');
    var video = $video.get(0);
    if (video) {
      video.pause();
    }

    if (matchData) {
      updatePreMatchOverlay(matchData, streamLinks[activeLinkIndex] || null);
    }
  }

  function onStreamPlaybackReady(gen, $video) {
    if (gen !== playbackGen) return;
    streamPlaybackOk = true;
    clearPlaybackWatchdog();
    setLoading(false);
    syncPlayButton($video);
    syncVolumeUi($video);
    hidePreMatchOverlay();
  }

  /** Cập nhật icon nút Play/Pause */
  function syncPlayButton($video) {
    var $btn = $('#luongsonStreamPlay');
    if (!$video.length) return;
    $btn.toggleClass('is-paused', $video.get(0).paused);
  }

  /** Cập nhật nút mute và thanh trượt âm lượng */
  function syncVolumeUi($video) {
    var $btn = $('#luongsonStreamVolume');
    var $slider = $('#luongsonStreamVolumeSlider');
    if (!$video.length || !$btn.length) return;

    var video = $video.get(0);
    var isMuted = video.muted || video.volume === 0;
    var displayVol = isMuted ? 0 : video.volume;

    $btn.toggleClass('is-muted', isMuted);
    $btn.attr({
      'aria-label': isMuted ? 'Bật tiếng' : 'Tắt tiếng',
      title: isMuted ? 'Bật tiếng' : 'Tắt tiếng'
    });

    if ($slider.length) {
      $slider.val(displayVol);
    }
  }

  function getFullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      null
    );
  }

  function isNativeStageFullscreen($stage) {
    var stage = $stage.get(0);
    if (!stage) return false;
    return getFullscreenElement() === stage;
  }

  function isCssStageFullscreen($stage) {
    return !!$stage.data('cssStageFs');
  }

  function isStageFullscreen() {
    var $stage = $('#luongsonStreamStage');
    return isNativeStageFullscreen($stage) || isCssStageFullscreen($stage);
  }

  function supportsStageFullscreenApi() {
    var el = document.createElement('div');
    return !!(
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen
    );
  }

  function shouldPreferCssStageFullscreen() {
    return (
      /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

  function requestStageFullscreen(stage) {
    if (!stage) return Promise.reject();
    var req =
      stage.requestFullscreen ||
      stage.webkitRequestFullscreen ||
      stage.mozRequestFullScreen ||
      stage.msRequestFullscreen;
    if (!req) return Promise.reject();
    return Promise.resolve(req.call(stage));
  }

  function exitDocumentFullscreen() {
    var exit =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.mozCancelFullScreen ||
      document.msExitFullscreen;
    if (!exit) return Promise.resolve();
    return Promise.resolve(exit.call(document));
  }

  function syncStageFullscreenUi($stage) {
    if (!$stage.length) return;
    var isFs = isStageFullscreen();
    $stage.toggleClass('luongson-stream-stage-fs', isFs);

    var $fsBtn = $('#luongsonStreamFs');
    if ($fsBtn.length) {
      var fsLabel = isFs ? 'Thu nhỏ' : 'Toàn màn hình';
      $fsBtn.attr({ 'aria-label': fsLabel, title: fsLabel });
    }
  }

  function mountCssFullscreenPortal($stage) {
    if (!$stage.length || $stage.hasClass('luongson-fs-portal')) return;

    var $placeholder = $('<div class="luongson-fs-placeholder" aria-hidden="true"></div>');
    var height = $stage.outerHeight();
    if (height > 0) {
      $placeholder.height(height);
    }

    $stage.data('lsFsPortalParent', $stage.parent());
    $placeholder.insertBefore($stage);
    $stage.data('lsFsPortalPlaceholder', $placeholder);
    $stage.addClass('luongson-fs-portal');
    $('body').append($stage);
  }

  function restoreCssFullscreenPortal($stage) {
    if (!$stage.length || !$stage.hasClass('luongson-fs-portal')) return;

    var $placeholder = $stage.data('lsFsPortalPlaceholder');
    var $originalParent = $stage.data('lsFsPortalParent');

    $stage.removeClass('luongson-fs-portal');
    if ($placeholder && $placeholder.length) {
      $stage.insertBefore($placeholder);
      $placeholder.remove();
    } else if ($originalParent && $originalParent.length) {
      $originalParent.append($stage);
    }

    $stage.removeData('lsFsPortalPlaceholder');
    $stage.removeData('lsFsPortalParent');
  }

  function syncCssFullscreenPortal($stage) {
    if (!$stage.length) return;
    if (isCssStageFullscreen($stage)) {
      mountCssFullscreenPortal($stage);
      return;
    }
    restoreCssFullscreenPortal($stage);
  }

  function enterCssStageFullscreen($stage) {
    $stage.data('cssStageFs', true);
    $('body').addClass('luongson-stream-body-fs');
    syncStageFullscreenUi($stage);
    $stage.trigger('lsStageFsChange');
  }

  function exitCssStageFullscreen($stage) {
    $stage.data('cssStageFs', false);
    restoreCssFullscreenPortal($stage);

    var hasOtherCssFs = $('.luongson-stream-stage')
      .toArray()
      .some(function (el) {
        return $(el).data('cssStageFs');
      });

    if (!hasOtherCssFs) {
      $('body').removeClass('luongson-stream-body-fs');
    }

    syncStageFullscreenUi($stage);
    $stage.trigger('lsStageFsChange');
  }

  function exitStageFullscreen($stage) {
    if (isNativeStageFullscreen($stage)) {
      exitDocumentFullscreen();
    }
    if (isCssStageFullscreen($stage)) {
      exitCssStageFullscreen($stage);
    }
  }

  function getLetterboxedBounds(containerRect, contentRatio) {
    if (!containerRect || !containerRect.width || !containerRect.height || !contentRatio) return null;

    var containerRatio = containerRect.width / containerRect.height;
    var width;
    var height;
    var left;
    var top;

    if (contentRatio > containerRatio) {
      width = containerRect.width;
      height = containerRect.width / contentRatio;
      left = 0;
      top = (containerRect.height - height) / 2;
    } else {
      height = containerRect.height;
      width = containerRect.height * contentRatio;
      top = 0;
      left = (containerRect.width - width) / 2;
    }

    return { top: top, left: left, width: width, height: height };
  }

  function getContainedVideoBounds(video, containerRect) {
    if (!video || !containerRect || !containerRect.width || !containerRect.height) return null;

    var intrinsicW = video.videoWidth;
    var intrinsicH = video.videoHeight;
    if (!intrinsicW || !intrinsicH) return null;

    return getLetterboxedBounds(containerRect, intrinsicW / intrinsicH);
  }

  /** Poster / pre-match: dùng 16:9 khi video chưa có metadata (giống object-fit: contain) */
  function getStreamUiLayerBounds(video, containerRect) {
    if (!containerRect || !containerRect.width || !containerRect.height) return null;

    var bounds = video ? getContainedVideoBounds(video, containerRect) : null;
    if (bounds && bounds.width && bounds.height) return bounds;

    return getLetterboxedBounds(containerRect, 16 / 9);
  }

  function ensureStreamUiLayer($wrap) {
    if (!$wrap.length) return $();

    var $layer = $wrap.children('.luongson-stream-ui-layer').first();
    if ($layer.length) return $layer;

    $layer = $('<div class="luongson-stream-ui-layer"></div>');
    $wrap.children(
      '.luongson-stream-top-bar, .luongson-stream-bottom-bar, .luongson-stream-loading, .luongson-stream-prematch'
    ).appendTo($layer);
    $wrap.append($layer);
    return $layer;
  }

  function syncStreamUiLayerLayout() {
    var $wrap = $('.luongson-stream-video-wrap').first();
    var $layer = ensureStreamUiLayer($wrap);

    if (!isStageFullscreen()) {
      if ($layer.length) {
        $layer.removeClass('luongson-stream-ui-layer--bounded').css({
          top: '',
          left: '',
          width: '',
          height: ''
        });
      }
      return;
    }

    var $video = $('#liveVideo');
    var video = $video.get(0);
    var container = $wrap.get(0);

    if (!$layer.length || !container) return;

    var bounds = getStreamUiLayerBounds(video, container.getBoundingClientRect());

    if (!bounds || !bounds.width || !bounds.height) {
      $layer.removeClass('luongson-stream-ui-layer--bounded').css({
        top: '',
        left: '',
        width: '',
        height: ''
      });
      return;
    }

    $layer
      .addClass('luongson-stream-ui-layer--bounded')
      .css({
        top: bounds.top + 'px',
        left: bounds.left + 'px',
        width: bounds.width + 'px',
        height: bounds.height + 'px'
      });
  }

  function scheduleStreamUiLayerLayoutSync() {
    var $stage = $('#luongsonStreamStage');
    if ($stage.data('lsUiLayerSyncRaf')) return;

    var rafId = requestAnimationFrame(function () {
      $stage.removeData('lsUiLayerSyncRaf');
      syncStreamUiLayerLayout();
    });

    $stage.data('lsUiLayerSyncRaf', rafId);
  }

  function initStreamUiLayerSync($video) {
    var $stage = $('#luongsonStreamStage');
    if ($stage.data('lsUiLayerSyncBound')) return;
    $stage.data('lsUiLayerSyncBound', true);

    ensureStreamUiLayer($('.luongson-stream-video-wrap').first());

    var scheduleSync = scheduleStreamUiLayerLayoutSync;

    scheduleSync();

    $video.on('loadedmetadata.lsUiLayerSync loadeddata.lsUiLayerSync resize.lsUiLayerSync', scheduleSync);

    if (typeof ResizeObserver !== 'undefined') {
      var $wrap = $('.luongson-stream-video-wrap').first();
      var observer = new ResizeObserver(scheduleSync);
      if ($wrap.length) observer.observe($wrap.get(0));
      if ($video.length) observer.observe($video.get(0));
      $stage.data('lsUiLayerResizeObserver', observer);
    }

    $(window).on('resize.lsUiLayerSync orientationchange.lsUiLayerSync', scheduleSync);
    $stage.on('lsStageFsChange.lsUiLayerSync', scheduleSync);
    $(document).on(
      'fullscreenchange.lsUiLayerSync webkitfullscreenchange.lsUiLayerSync',
      scheduleSync
    );
  }

  function syncStageFullscreenChrome() {
    var $stage = $('#luongsonStreamStage');
    if (!$stage.length) return;

    if (
      !isNativeStageFullscreen($stage) &&
      isCssStageFullscreen($stage)
    ) {
      // Giữ CSS fullscreen khi native API không dùng được (iOS).
    } else if (!isNativeStageFullscreen($stage)) {
      $stage.data('cssStageFs', false);
      restoreCssFullscreenPortal($stage);

      var hasOtherCssFs = $('.luongson-stream-stage')
        .toArray()
        .some(function (el) {
          return $(el).data('cssStageFs');
        });

      if (!hasOtherCssFs) {
        $('body').removeClass('luongson-stream-body-fs');
      }
    }

    syncCssFullscreenPortal($stage);
    syncStageFullscreenUi($stage);
    syncFsTopBarCycle();
    scheduleStreamUiLayerLayoutSync();
  }

  function toggleStageFullscreen() {
    var $stage = $('#luongsonStreamStage');
    var stage = $stage.get(0);
    if (!stage) return;

    if (isStageFullscreen()) {
      exitStageFullscreen($stage);
      return;
    }

    if (shouldPreferCssStageFullscreen()) {
      enterCssStageFullscreen($stage);
      return;
    }

    if (!supportsStageFullscreenApi()) {
      enterCssStageFullscreen($stage);
      return;
    }

    requestStageFullscreen(stage)
      .then(function () {
        if (getFullscreenElement() !== stage) {
          enterCssStageFullscreen($stage);
          return;
        }
        syncStageFullscreenUi($stage);
        $stage.trigger('lsStageFsChange');
      })
      .catch(function () {
        enterCssStageFullscreen($stage);
      });
  }

  function initCssFullscreenPortal($stage) {
    if (!$stage.length || $stage.data('lsFsPortalBound')) return;
    $stage.data('lsFsPortalBound', true);

    $stage.on('lsStageFsChange.lsFsPortal', function () {
      syncCssFullscreenPortal($stage);
    });

    $(document).on(
      'fullscreenchange.lsFsPortal webkitfullscreenchange.lsFsPortal',
      function () {
        syncCssFullscreenPortal($stage);
      }
    );

    $(window).on('pagehide.lsFsPortal', function () {
      restoreCssFullscreenPortal($stage);
    });
  }

  function hideFsTopBar() {
    $('.luongson-stream-top-bar').removeClass('luongson-stream-top-bar--fs-visible');
  }

  function showFsTopBar() {
    if (!isStageFullscreen()) return;
    $('.luongson-stream-top-bar').addClass('luongson-stream-top-bar--fs-visible');

    if (fsTopBarHideTimer) {
      clearTimeout(fsTopBarHideTimer);
    }

    fsTopBarHideTimer = setTimeout(function () {
      hideFsTopBar();
      fsTopBarHideTimer = null;
    }, FS_TOP_BAR_VISIBLE_MS);
  }

  function stopFsTopBarCycle() {
    if (fsTopBarCycleTimer) {
      clearInterval(fsTopBarCycleTimer);
      fsTopBarCycleTimer = null;
    }
    if (fsTopBarHideTimer) {
      clearTimeout(fsTopBarHideTimer);
      fsTopBarHideTimer = null;
    }
    $('#luongsonStreamStage').removeClass('is-fs-top-bar-cycle');
    hideFsTopBar();
  }

  function startFsTopBarCycle() {
    stopFsTopBarCycle();
    if (!isStageFullscreen()) return;

    $('#luongsonStreamStage').addClass('is-fs-top-bar-cycle');
    showFsTopBar();

    fsTopBarCycleTimer = setInterval(function () {
      if (!isStageFullscreen()) {
        stopFsTopBarCycle();
        return;
      }
      showFsTopBar();
    }, FS_TOP_BAR_INTERVAL_MS + FS_TOP_BAR_VISIBLE_MS);
  }

  function syncFsTopBarCycle() {
    if (isStageFullscreen()) {
      startFsTopBarCycle();
    } else {
      stopFsTopBarCycle();
    }
  }

  /** Gắn sự kiện Play, Volume, Fullscreen */
  function initPlayerControls($video) {
    $('#luongsonStreamPlay').off('click').on('click', function () {
      var video = $video.get(0);
      if (!video) return;
      if (video.paused) {
        video.play().catch(function () {});
      } else {
        video.pause();
      }
      syncPlayButton($video);
    });

    $('#luongsonStreamVolume').off('click').on('click', function () {
      var video = $video.get(0);
      if (!video) return;
      if (video.muted || video.volume === 0) {
        video.muted = false;
        if (video.volume === 0) video.volume = 0.7;
      } else {
        video.muted = true;
      }
      syncVolumeUi($video);
    });

    $('#luongsonStreamVolumeSlider').off('input change').on('input change', function (e) {
      e.stopPropagation();
      var video = $video.get(0);
      if (!video) return;
      var vol = parseFloat(this.value);
      if (!Number.isFinite(vol)) return;
      video.volume = vol;
      video.muted = vol === 0;
      syncVolumeUi($video);
    });

    $('#luongsonStreamFs').off('click').on('click', function () {
      toggleStageFullscreen();
    });

    var $stage = $('#luongsonStreamStage');
    initCssFullscreenPortal($stage);
    initStreamUiLayerSync($video);

    $(document)
      .off('fullscreenchange.lsStreamTopBar webkitfullscreenchange.lsStreamTopBar')
      .on('fullscreenchange.lsStreamTopBar webkitfullscreenchange.lsStreamTopBar', syncStageFullscreenChrome);

    $stage.off('lsStageFsChange.lsStreamTopBar').on('lsStageFsChange.lsStreamTopBar', syncStageFullscreenChrome);

    $(window)
      .off('resize.lsStreamFs orientationchange.lsStreamFs')
      .on('resize.lsStreamFs orientationchange.lsStreamFs', syncStageFullscreenChrome);

    $video.off('play pause volumechange').on('play pause volumechange', function () {
      syncPlayButton($video);
      syncVolumeUi($video);
    });
  }

  /** Khởi tạo phát HLS (hoặc native Safari) */
  function initHls(url, $video) {
    destroyHls();
    var gen = playbackGen;

    if (!url || !$video.length) {
      setLoading(false);
      if (matchData) updatePreMatchOverlay(matchData, streamLinks[activeLinkIndex] || null);
      return;
    }

    setLoading(true, 'Đang tải luồng phát...');
    startPlaybackWatchdog(gen);
    var video = $video.get(0);

    function isStale() {
      return gen !== playbackGen;
    }

    function onReady() {
      if (isStale()) return;
      video.muted = true;
      video.play().then(function () {
        onStreamPlaybackReady(gen, $video);
      }).catch(function () {
        onStreamPlaybackFailed(gen);
      });
    }

    $video.off('error.lsStreamPlayback').on('error.lsStreamPlayback', function () {
      if (isStale()) return;
      onStreamPlaybackFailed(gen);
    });

    if (window.Hls && Hls.isSupported()) {
      currentHls = new Hls({
        maxBufferLength: 10,
        liveSyncDuration: 3,
        enableWorker: true,
        xhrSetup: function (xhr) {
          xhr.withCredentials = false;
          xhr.referrerPolicy = 'no-referrer-when-downgrade';
        }
      });
      currentHls.loadSource(url);
      currentHls.attachMedia(video);
      currentHls.on(Hls.Events.MANIFEST_PARSED, function () {
        if (isStale()) return;
        onReady();
      });
      currentHls.on(Hls.Events.ERROR, function (_, data) {
        if (isStale()) return;
        if (data && data.fatal) onStreamPlaybackFailed(gen);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      $video.off('loadedmetadata.lsStreamPlayback').one('loadedmetadata.lsStreamPlayback', function () {
        if (isStale()) return;
        onReady();
      });
      $video.attr('src', url);
    } else {
      onStreamPlaybackFailed(gen);
    }
  }

  /** Cập nhật các ô kèo FT / HT */
  function renderOdds(data) {
    var hdp = data.hdp || {};
    var ou = data.ou || {};

    function setVal(key, val, trend) {
      $('[data-odds="' + key + '"]')
        .text(formatOdd(val))
        .removeClass('is-up is-down')
        .addClass(trendClass(trend));
    }

    setVal('hdp-home', hdp.home, hdp.homeTrend);
    setVal('hdp-rate', hdp.rate, hdp.rateTrend);
    setVal('hdp-away', hdp.away, hdp.awayTrend);
    setVal('ou-over', ou.over, ou.overTrend);
    setVal('ou-rate', ou.rate, ou.rateTrend);
    setVal('ou-under', ou.under, ou.underTrend);
  }

  /** Sắp xếp link: ưu tiên BLV đang live */
  function sortLinks(links) {
    if (!Array.isArray(links)) return [];
    return links.slice().sort(function (a, b) {
      return (b.isStreaming ? 1 : 0) - (a.isStreaming ? 1 : 0);
    });
  }

  /** Chọn BLV active theo ?liveId= hoặc link đang stream */
  function resolveActiveIndex(links) {
    var params = new URLSearchParams(window.location.search);
    var liveId = params.get('liveId');
    var idx = -1;
    var i;

    if (liveId) {
      for (i = 0; i < links.length; i++) {
        if (String(links[i].liveId) === String(liveId)) {
          idx = i;
          break;
        }
      }
      if (idx >= 0) return idx;
    }

    for (i = 0; i < links.length; i++) {
      if (links[i].isStreaming) return i;
    }
    return 0;
  }

  /** Cập nhật tên + avatar BLV trên thanh điều khiển */
  function updateCommentatorUi(link) {
    if (!link) return;
    var name = $.trim(String(link.commentator || '')) || 'BLV';
    var avatar = link.avatar || FALLBACK_AVATAR;

    $('#luongsonStreamCommentator').attr('data-commentator', name);
    $('#luongsonCommentatorTrigger .luongson-match-commentator-name').text(name);
    $('#luongsonCommentatorTrigger .luongson-match-commentator-avatar img').attr({
      src: avatar,
      alt: name
    });
  }

  /** Chuyển sang luồng BLV khác */
  function switchStream(index) {
    if (!streamLinks.length || index < 0 || index >= streamLinks.length) return;

    activeLinkIndex = index;
    var link = streamLinks[index];
    updateCommentatorUi(link);

    if (link.liveId) {
      var params = new URLSearchParams(window.location.search);
      params.set('liveId', String(link.liveId));
      var q = params.toString();
      window.history.replaceState(
        null,
        '',
        window.location.pathname + (q ? '?' + q : '') + window.location.hash
      );
    }

    if (link.url) {
      if (isMatchLive(matchData, link)) {
        initHls(link.url, $('#liveVideo'));
      } else {
        destroyHls();
        var $video = $('#liveVideo');
        var video = $video.get(0);
        if (video) {
          video.pause();
          try { video.removeAttribute('src'); video.load(); } catch (e) {}
        }
        if (matchData) updatePreMatchOverlay(matchData, link);
      }
    }
  }

  /** Dropdown chọn BLV (portal gắn vào body) */
  function buildCommentatorPortal(links) {
    var $portal = $('.luongson-stream-commentator-portal');

    if (!$portal.length) {
      $portal = $('<div>', {
        class: 'luongson-commentator-portal luongson-stream-commentator-portal',
        hidden: true
      }).css({
        display: 'none',
        opacity: 0,
        transform: 'translateY(-4px) scale(0.98)',
        transition: 'opacity .15s ease, transform .15s cubic-bezier(0,.8,.2,1)',
        'transform-origin': 'bottom left'
      });
      $('body').append($portal);
    }

    var panelHtml =
      '<div class="luongson-commentator-portal__panel" data-border="true" role="listbox">';

    $.each(links, function (i, link) {
      var name = $.trim(String(link.commentator || '')) || 'BLV ' + (i + 1);
      var avatar = link.avatar || FALLBACK_AVATAR;
      var activeClass = i === activeLinkIndex ? ' is-active' : '';

      panelHtml +=
        '<button type="button" class="luongson-commentator-option' + activeClass + '"' +
        ' role="option" data-index="' + i + '" data-commentator="' + name + '">' +
        '<span class="luongson-commentator-option__avatar">' +
        '<img alt="" decoding="async" src="' + avatar + '" />' +
        '</span>' +
        '<span class="luongson-commentator-option__name">' + name + '</span>' +
        '</button>';
    });

    panelHtml += '</div>';
    $portal.html(panelHtml);

    var $activeTrigger = null;

    function closeDropdown() {
      if ($activeTrigger) $activeTrigger.attr('aria-expanded', 'false');
      $portal.css({ opacity: 0, transform: 'translateY(-4px) scale(0.98)' });
      setTimeout(function () {
        if (parseFloat($portal.css('opacity')) === 0) {
          $portal.hide().attr('hidden', 'hidden');
          $activeTrigger = null;
        }
      }, 150);
    }

    function openDropdown($trigger) {
      if ($activeTrigger && $activeTrigger.get(0) === $trigger.get(0) && $portal.is(':visible')) {
        closeDropdown();
        return;
      }

      $activeTrigger = $trigger;
      $trigger.attr('aria-expanded', 'true');
      $portal.removeAttr('hidden').show();

      var rect = $trigger.get(0).getBoundingClientRect();
      var w = 170;
      var h = $portal.outerHeight() || 120;
      var left = rect.left;

      if (left + w > $(window).width() - 10) left = $(window).width() - w - 10;
      if (left < 10) left = 10;

      var top = rect.top - h - 6;
      if (top < 10) top = rect.bottom + 6;

      $portal.css({ left: left, top: top });

      requestAnimationFrame(function () {
        $portal.css({ opacity: 1, transform: 'translateY(0) scale(1)' });
      });
    }

    $portal.find('.luongson-commentator-option').on('click', function (e) {
      e.stopPropagation();
      var $opt = $(this);
      var idx = parseInt($opt.attr('data-index'), 10);

      $portal.find('.luongson-commentator-option').removeClass('is-active');
      $opt.addClass('is-active');
      switchStream(idx);
      closeDropdown();
    });

    var $trigger = $('#luongsonCommentatorTrigger');
    if ($trigger.length && !$trigger.data('lsStreamBound')) {
      $trigger.data('lsStreamBound', true).on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!links.length) return;
        openDropdown($trigger);
      });
    }

    $(document).off('click.lsStreamPortal').on('click.lsStreamPortal', function (e) {
      if (
        $portal.is(':visible') &&
        !$.contains($portal.get(0), e.target) &&
        (!$activeTrigger || !$.contains($activeTrigger.get(0), e.target))
      ) {
        closeDropdown();
      }
    });

    $(document).off('keydown.lsStreamPortal').on('keydown.lsStreamPortal', function (e) {
      if (e.key === 'Escape' && $portal.is(':visible')) closeDropdown();
    });
  }

  /** Ticker quảng cáo chạy ngang (kéo tay được) */
  function createFeaturedAdsTicker(container) {
    var $container = $(container);
    var $track = $container.find('ul').first();

    if (!$track.length || $track.data('lsStreamTickerInit')) return;
    $track.data('lsStreamTickerInit', true);

    var $originalChildren = $track.children().not('.clone-item');
    if (!$originalChildren.length) return;

    var speed = 38;
    var direction = -1;
    var singleSetWidth = 0;
    var currentX = 0;
    var isHovered = false;
    var isDragging = false;
    var startX = 0;
    var dragStartX = 0;
    var lastTimestamp = null;

    function buildClones() {
      $track.find('.clone-item').remove();

      var containerWidth = $container.outerWidth() || $(window).width();
      var gap = 12;
      var firstEl = $originalChildren.first().get(0);
      var lastEl = $originalChildren.last().get(0);
      var firstRect = firstEl.getBoundingClientRect();
      var lastRect = lastEl.getBoundingClientRect();

      singleSetWidth =
        lastRect.right - firstRect.left + gap > 0
          ? lastRect.right - firstRect.left + gap
          : $originalChildren.toArray().reduce(function (acc, el) {
              return acc + ($(el).outerWidth() || 80) + gap;
            }, 0);

      if (singleSetWidth <= 0) return;

      var neededCopies = Math.max(2, Math.ceil((containerWidth * 2) / singleSetWidth) + 1);
      var i;

      for (i = 0; i < neededCopies; i++) {
        $originalChildren.each(function () {
          var $clone = $(this).clone().addClass('clone-item').attr('aria-hidden', 'true');
          $track.append($clone);
        });
      }
    }

    function setTransform(x) {
      $track.css('transform', 'translate3d(' + x + 'px, 0, 0)');
    }

    function animate(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      var dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;

      if (!isHovered && !isDragging && singleSetWidth > 0) {
        currentX += direction * speed * dt;
        while (currentX <= -singleSetWidth) currentX += singleSetWidth;
        setTransform(currentX);
      }
      requestAnimationFrame(animate);
    }

    $container.on('mouseenter', function () { isHovered = true; });
    $container.on('mouseleave', function () { isHovered = false; lastTimestamp = null; });

    function onPointerDown(e) {
      isDragging = true;
      startX = e.type.indexOf('touch') === 0 ? e.originalEvent.touches[0].clientX : e.clientX;
      dragStartX = currentX;
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      var clientX = e.type.indexOf('touch') === 0 ? e.originalEvent.touches[0].clientX : e.clientX;
      var dx = clientX - startX;
      currentX = dragStartX + dx;

      if (singleSetWidth > 0) {
        while (currentX <= -singleSetWidth) currentX += singleSetWidth;
        while (currentX > 0) currentX -= singleSetWidth;
      }
      setTransform(currentX);
    }

    function onPointerUp() {
      isDragging = false;
      lastTimestamp = null;
    }

    $track.on('mousedown', onPointerDown);
    $(window).on('mousemove.lsStreamTicker', onPointerMove);
    $(window).on('mouseup.lsStreamTicker', onPointerUp);

    buildClones();
    requestAnimationFrame(animate);

    $(window).on('resize.lsStreamTicker', function () {
      setTimeout(buildClones, 150);
    });
  }

  /** Gọi API lấy dữ liệu trận và bắt đầu phát */
  function loadMatch() {
    var matchId = getMatchId();
    var $video = $('#liveVideo');

    $video.attr('poster', POSTER);
    initPlayerControls($video);
    setLoading(true, 'Đang tải thông tin trận đấu...');

    $.ajax({
      url: API_BASE + matchId,
      method: 'GET',
      success: function (res) {
        var data = res && res.data;
        if (!data) {
          setLoading(false);
          return;
        }

        matchData = data;
        renderOdds(data);

        var links = sortLinks(data.livestream && data.livestream.links);
        streamLinks = links;

        if (!links.length) {
          updateCommentatorUi({ commentator: 'Chưa có BLV', avatar: FALLBACK_AVATAR });
          playBeforeStreamWithTvc(function () {
            setLoading(false);
            updatePreMatchOverlay(data, null);
          });
          return;
        }

        activeLinkIndex = resolveActiveIndex(links);
        buildCommentatorPortal(links);
        updateCommentatorUi(links[activeLinkIndex]);

        var activeLink = links[activeLinkIndex];

        if (isFinishedStatus(getMatchStatus(data))) {
          setLoading(false);
          updatePreMatchOverlay(data, activeLink);
          return;
        }

        function showPreMatchState() {
          destroyHls();
          var video = $video.get(0);
          if (video) {
            video.pause();
            try { video.removeAttribute('src'); video.load(); } catch (e) {}
          }
          setLoading(false);
          updatePreMatchOverlay(data, activeLink);
        }

        function startLivePlayback() {
          if (activeLink && activeLink.url) {
            initHls(activeLink.url, $video);
          } else {
            showPreMatchState();
          }
        }

        if (isMatchLive(data, activeLink)) {
          playBeforeStreamWithTvc(startLivePlayback);
        } else {
          playBeforeStreamWithTvc(showPreMatchState);
        }
      },
      error: function () {
        setLoading(false);
      }
    });
  }

  /** Áp nội dung ticker từ cấu hình admin (ảnh + text theo cặp, render tách riêng như HTML gốc) */
  function applyHeaderAdsTickerContent(headerAds) {
    var items = headerAds && headerAds.items;
    if (!Array.isArray(items) || !items.length) return;

    var $contentItems = $('.luongson-stream-ticker > a > ul > li.ticker-item').filter(function () {
      return !$(this).hasClass('clone-item') && $(this).find('img, .luongson-stream-ticker__text').length;
    });

    var contentIndex = 0;
    items.forEach(function (item) {
      if (!item) return;

      var imageUrl = item.imageUrl || item.image_url || '';
      if (imageUrl) {
        if (imageUrl.indexOf('http') !== 0 && imageUrl.indexOf('/') !== 0 && imageUrl.indexOf('data:') !== 0) {
          imageUrl = IMG + imageUrl.replace(/^images\//, '');
        }
        var $imageRow = $contentItems.eq(contentIndex);
        if ($imageRow.length) {
          $imageRow.find('img').attr('src', imageUrl);
          contentIndex++;
        }
      }

      var text = item.text || '';
      if (text) {
        var $textRow = $contentItems.eq(contentIndex);
        if ($textRow.length) {
          $textRow.find('.luongson-stream-ticker__text').text(text);
          contentIndex++;
        }
      }
    });
  }

  /** Gắn hover thống kê trận đấu lên logo cược */
  function initMatchStatsHover() {
    var modal = window.LuongsonMatchStatsModal;
    if (!modal) return;

    modal.bindTriggers(document.querySelector('.luongson-stream-match'), '.luongson-stream-bet-logo', function () {
      return matchData && matchData.stats ? matchData.stats : null;
    });
  }

  /** Gắn URL asset tĩnh và link CTA (WordPress / HTML prototype) */
  function initStaticAssets() {
    var headerAds = (
      typeof window.DV2_LUONGSON_HEADER_ADS_ANIMATION !== 'undefined' && window.DV2_LUONGSON_HEADER_ADS_ANIMATION
    ) || cfg.headerAdsAnimation || {};
    var betLogo = cfg.betImageUrl || ASSETS + 'xo88.avif';
    var betUrl = BET_URL || '#';
    var headerLinkUrl = headerAds.url || cfg.playCtaUrl || betUrl;

    $('#liveVideo').attr('poster', POSTER);
    $('.luongson-stream-ticker > a').attr('href', headerLinkUrl);
    applyHeaderAdsTickerContent(headerAds);
    $('#luongsonPlayCta').attr('href', headerLinkUrl);
    $('#luongsonPlayCta img').attr('src', ASSETS + 'icon-play.svg');
    $('#luongsonCommentatorTrigger .luongson-match-commentator-avatar img').attr('src', FALLBACK_AVATAR);
    $('#luongsonStreamPlay .luongson-stream-ctrl__icon-play').attr('src', ASSETS + 'icon-play.svg');
    $('#luongsonStreamVolume .luongson-stream-ctrl__icon-vol').attr('src', ASSETS + 'icon-volume.svg');
    $('#luongsonStreamFs img').attr('src', ASSETS + 'icon-zoom.svg');
    $('#luongsonStreamBet').attr('href', betUrl);
    $('#luongsonStreamBet .luongson-stream-bet-logo').attr('src', betLogo);
  }

  // --- Khởi chạy khi DOM sẵn sàng ---
  $(function () {
    if (!$('.luongson-stream-match').length) return;

    initStaticAssets();
    initMatchStatsHover();
    $('.luongson-stream-ticker').each(function () {
      createFeaturedAdsTicker(this);
    });
    loadMatch();
  });
})(jQuery.noConflict());
