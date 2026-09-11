/**
 * LuongSon Sport — Match schedule (jQuery)
 * streams-range API (same params as list-matches) + Flatpickr date picker
 */
(function ($) {
  'use strict';

  var cfg = window.luongsonSchedule || {};
  var pluginUrl =
    (typeof window.DV2_STREAMING_PLUGIN_URL !== 'undefined' && window.DV2_STREAMING_PLUGIN_URL) ||
    (window.dv2Streaming && window.dv2Streaming.pluginUrl) ||
    '';
  if (pluginUrl && pluginUrl.slice(-1) !== '/') pluginUrl += '/';

  var IMG = pluginUrl
    ? pluginUrl + 'html/luongson-v2/images/'
    : cfg.imgUrl || 'images/';
  var BET_LOGO = pluginUrl
    ? pluginUrl + 'assets/images/luongson-v2/vic88.avif'
    : cfg.betLogo || IMG + 'KB717wZbU63tSAHyTm9pLUqxM_b79bb177.png';
  var BET_LOGO_ALT = cfg.betLogoAlt || IMG + 'TtSpXaqqwKEewlPr41OF4DTPA_802653d7.png';
  var LINK_BET =
    typeof window.DV2_LINK_BET !== 'undefined' && window.DV2_LINK_BET
      ? String(window.DV2_LINK_BET)
      : '#';

  // Same proxy as list-matches.js (streams-range — not matches/{id}).
  var PROXY_BASE =
    typeof window.DV2_PROXY_API_BASE !== 'undefined' && window.DV2_PROXY_API_BASE
      ? String(window.DV2_PROXY_API_BASE).replace(/\/+$/, '')
      : '/api/dv2-streaming-plugin';
  var STREAMS_RANGE_API = PROXY_BASE + '/streams-range';
  // statuses + priorityCompetitions are resolved server-side in streams-range proxy.

  var FLATPICKR_CSS = 'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.css';
  var FLATPICKR_JS = 'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js';
  var FLATPICKR_VN = 'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/l10n/vn.js';

  var PAGE_SIZE = 50;
  var VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

  var LIVE_STATUSES = [
    'first half',
    'firsthalf',
    'first-half',
    'fh',
    'half-time',
    'half time',
    'halftime',
    'ht',
    'second half',
    'secondhalf',
    'second-half',
    'sh',
    'extra time',
    'extratime',
    'et',
    'overtime',
    'overtime(deprecated)',
    'ot',
    'penalty',
    'penalties',
    'penalty shoot-out',
    'penalty shootout',
  ];

  var state = {
    selectedDate: null,
    page: 1,
    totalPages: 1,
    totalMatches: 0,
    renderedCount: 0,
    loading: false,
    requestId: 0,
    flatpickr: null,
    priorityCompetitionIds: new Set(),
    priorityCompetitionIdsOrdered: [],
    $root: null,
    $list: null,
    $label: null,
    $prev: null,
    $next: null,
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getFallbackImg() {
    if (window.LuongsonImageFallback && window.LuongsonImageFallback.getDefaultImgUrl) {
      return window.LuongsonImageFallback.getDefaultImgUrl();
    }
    return pluginUrl ? pluginUrl + 'assets/images/default-img.png' : '../../assets/images/default-img.png';
  }

  function normalizeStatus(status) {
    return String(status || '')
      .toLowerCase()
      .trim();
  }

  function isLiveStatus(status) {
    return LIVE_STATUSES.indexOf(normalizeStatus(status)) !== -1;
  }

  function isNotStartedStatus(status) {
    var s = normalizeStatus(status);
    return s === 'not started' || s === 'ns' || s === '';
  }

  function getMatchId(match) {
    return (match && (match.match_id || match.matchId || match.id || match.slug)) || '';
  }

  function parsePriorityCompetitionIds(raw) {
    if (Array.isArray(raw)) {
      return $.map(raw, function (id) {
        return String(id == null ? '' : id).trim();
      }).filter(Boolean);
    }
    if (raw == null || raw === '') return [];
    return String(raw)
      .split(',')
      .map(function (id) {
        return id.trim();
      })
      .filter(Boolean);
  }

  function syncPriorityCompetitionIds(res) {
    var ids = parsePriorityCompetitionIds(
      res && res.priorityCompetitions != null
        ? res.priorityCompetitions
        : window.DV2_STREAMING_PRIORITY_COMPETITION_IDS
    );
    state.priorityCompetitionIdsOrdered = ids;
    state.priorityCompetitionIds = new Set(ids);
    // Keep priority list available for hot-match marking.
    if (ids.length) {
      window.DV2_STREAMING_PRIORITY_COMPETITION_IDS = ids.join(',');
    }
  }

  function isPriorityMatch(match) {
    var leagueId = match && match.league && match.league.id;
    if (!leagueId) return false;
    if (state.priorityCompetitionIds.size) {
      return state.priorityCompetitionIds.has(String(leagueId));
    }
    if (
      window.DV2MatchSort &&
      typeof window.DV2MatchSort.isPriorityCompetitionMatch === 'function'
    ) {
      return window.DV2MatchSort.isPriorityCompetitionMatch(match);
    }
    return false;
  }

  function getPreferredLink(match) {
    var links = match && match.livestream && match.livestream.links;
    if (window.DV2StreamLinks && window.DV2StreamLinks.getPreferredLink) {
      return window.DV2StreamLinks.getPreferredLink(links);
    }
    if (!Array.isArray(links) || !links.length) return null;
    var streaming = $.grep(links, function (l) {
      return l && l.isStreaming !== false;
    });
    return (streaming.length ? streaming : links)[0] || null;
  }

  function getDetailUrl(match, link) {
    var matchId = getMatchId(match);
    if (!matchId) return '#';
    if (window.DV2StreamLinks && window.DV2StreamLinks.getDetailUrl) {
      return window.DV2StreamLinks.getDetailUrl(matchId, link || getPreferredLink(match), {
        trailingSlash: true,
      });
    }
    var preferred = link || getPreferredLink(match);
    var liveId = preferred && preferred.liveId != null ? String(preferred.liveId) : '';
    return liveId
      ? '/streams/' + encodeURIComponent(matchId) + '/?liveId=' + encodeURIComponent(liveId)
      : '/streams/' + encodeURIComponent(matchId) + '/';
  }

  function parseKickoffDate(kickoff) {
    if (!kickoff) return null;
    var str = String(kickoff).trim();
    if (!str) return null;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) && !/[zZ]|[+-]\d{2}:\d{2}$/.test(str)) {
      str += '+07:00';
    }
    var date = new Date(str);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function getVnDateParts(date) {
    if (!date) return null;
    var formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: VN_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    var parts = {};
    $.each(formatter.formatToParts(date), function (_, part) {
      if (part.type !== 'literal') parts[part.type] = part.value;
    });
    if (parts.hour === '24') parts.hour = '00';
    return parts;
  }

  function formatYmdInVn(date) {
    var parts = getVnDateParts(date);
    if (!parts) return '';
    return parts.year + '-' + parts.month + '-' + parts.day;
  }

  function shiftVnDays(baseDate, dayDelta) {
    var parts = getVnDateParts(baseDate);
    if (!parts) return new Date(baseDate.getTime() + dayDelta * 86400000);
    var utcMs = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day) + dayDelta,
      5,
      0,
      0
    );
    return new Date(utcMs);
  }

  function getVnToday() {
    return shiftVnDays(new Date(), 0);
  }

  function isSameVnDay(a, b) {
    return formatYmdInVn(a) === formatYmdInVn(b);
  }

  function formatLabel(date) {
    var parts = getVnDateParts(date);
    if (!parts) return '';
    var dm = parts.day + '/' + parts.month;
    var today = getVnToday();
    if (isSameVnDay(date, today)) return 'Hôm nay, ' + dm;
    if (isSameVnDay(date, shiftVnDays(today, -1))) return 'Hôm qua, ' + dm;
    if (isSameVnDay(date, shiftVnDays(today, 1))) return 'Ngày mai, ' + dm;
    return dm + '/' + parts.year;
  }

  function formatKickoffParts(kickoff) {
    var parts = getVnDateParts(parseKickoffDate(kickoff));
    if (!parts) return { time: '--:--', date: '--.--' };
    return {
      time: parts.hour + ':' + parts.minute,
      date: parts.day + '.' + parts.month,
    };
  }

  function formatStatusText(match) {
    if (!match) return 'Chưa diễn ra';
    var status = normalizeStatus(match.status);
    var mins = match.currentMinutes;
    var minsSuffix = mins != null && mins !== '' ? ' - ' + String(mins) + "'" : '';

    if (isLiveStatus(status)) {
      if (status === 'half-time' || status === 'halftime' || status === 'ht' || status === 'half time') {
        return 'Giữa hiệp';
      }
      if (status === 'first half' || status === 'firsthalf' || status === 'first-half' || status === 'fh') {
        return 'Hiệp 1' + minsSuffix;
      }
      if (status === 'second half' || status === 'secondhalf' || status === 'second-half' || status === 'sh') {
        return 'Hiệp 2' + minsSuffix;
      }
      if (
        status === 'overtime' ||
        status === 'overtime(deprecated)' ||
        status === 'extra time' ||
        status === 'extratime' ||
        status === 'et' ||
        status === 'ot'
      ) {
        return 'Hiệp phụ' + minsSuffix;
      }
      if (
        status === 'penalty shoot-out' ||
        status === 'penalty' ||
        status === 'penalties' ||
        status === 'penalty shootout'
      ) {
        return 'Penalty';
      }
      if (mins != null && mins !== '') return String(mins) + "'";
      return 'Trực tiếp';
    }

    if (isNotStartedStatus(status)) return 'Sắp diễn ra';
    return match.status || 'Chưa diễn ra';
  }

  function formatTeamScore(match, side) {
    if (!match || isNotStartedStatus(match.status)) return '-';
    var ft = match.score && match.score.fulltime;
    if (!ft) return '-';
    var val = side === 'away' ? ft.away : ft.home;
    return val != null ? String(val) : '0';
  }

  function formatOddsVal(value) {
    if (value == null || value === '') return '-';
    return String(value);
  }

  function getStatSide(match, key, side) {
    var ft = match && match.stats && match.stats.ft;
    if (!ft || ft[key] == null) return '0';
    var val = ft[key];
    var idx = side === 'away' ? 1 : 0;
    if (Array.isArray(val)) return String(val[idx] != null ? val[idx] : 0);
    if (typeof val === 'object') {
      return String(side === 'away' ? (val.away != null ? val.away : 0) : val.home != null ? val.home : 0);
    }
    return '0';
  }

  // v2: matches_by_date is a flat array in API order (not grouped by date).
  function flattenMatchesByDate(matchesByDate) {
    if (Array.isArray(matchesByDate)) return matchesByDate.slice();
    var all = [];
    if (!matchesByDate || typeof matchesByDate !== 'object') return all;
    $.each(matchesByDate, function (_, day) {
      if (Array.isArray(day)) all = all.concat(day);
    });
    return all;
  }

  function loadStylesheet(href) {
    if ($('link[data-ls-flatpickr="1"]').length) return;
    $('<link>', {
      rel: 'stylesheet',
      href: href,
      'data-ls-flatpickr': '1',
    }).appendTo('head');
  }

  function loadScript(src) {
    var deferred = $.Deferred();
    var script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = function () {
      deferred.resolve();
    };
    script.onerror = function () {
      deferred.reject(new Error('Failed to load ' + src));
    };
    document.head.appendChild(script);
    return deferred.promise();
  }

  function ensureFlatpickr() {
    if (window.flatpickr) return $.Deferred().resolve().promise();
    loadStylesheet(FLATPICKR_CSS);
    return loadScript(FLATPICKR_JS).then(function () {
      return loadScript(FLATPICKR_VN);
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Row markup                                                               */
  /* ------------------------------------------------------------------------ */

  function buildTeamRowHtml(match, side) {
    var team = (match && match.teams && match.teams[side]) || {};
    var score = formatTeamScore(match, side);
    var corner = getStatSide(match, 'corner', side);
    var yellow = getStatSide(match, 'yellowCard', side);
    var red = getStatSide(match, 'redCard', side);
    var isHome = side === 'home';
    var nameClass = isHome ? 'framer-12jd5dg' : 'framer-167qswu';
    var scoreClass = isHome ? 'framer-lpvq2y' : 'framer-pvvwao';
    var logoWrap = isHome ? 'framer-k4r736' : 'framer-rnop1x';
    var logoInner = isHome ? 'framer-4svd1w' : 'framer-14v5o2a';
    var logoName = isHome ? 'Man City Logo' : 'Liverpool Logo';
    var statsWrap = isHome ? 'framer-1qcymno' : 'framer-1nt9csj';
    var flagWrap = isHome ? 'framer-1n2kznj' : 'framer-1er19rb';
    var flagSvg = isHome ? 'framer-lwakex' : 'framer-bgyb85';
    var flagText = isHome ? 'framer-1vimra6' : 'framer-1dcwg5u';
    var yellowWrap = isHome ? 'framer-1l567ap' : 'framer-nkqsx9';
    var yellowIcon = isHome ? 'framer-16c3b9w' : 'framer-1ctyskl';
    var yellowText = isHome ? 'framer-jj8xat' : 'framer-1qkfb9p';

    var statsHtml =
      '<div class="' +
      statsWrap +
      '" data-framer-name="Live Score">' +
      '<div class="' +
      flagWrap +
      '">' +
      '<svg class="framer-bSUln ' +
      flagSvg +
      '" role="presentation" viewBox="0 0 24 24"><path d="M5 21V4m0 0l13 4.5L5 13V4z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" /></svg>' +
      '<div class="ssr-variant"><div class="' +
      flagText +
      ' ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s57" dir="auto">' +
      escapeHtml(corner) +
      '</p></div></div></div>' +
      '<div class="' +
      yellowWrap +
      '"><div aria-hidden="true" class="' +
      yellowIcon +
      ' ls-ltd-s58" data-framer-component-type="SVG"></div>' +
      '<div class="' +
      yellowText +
      ' ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s57" dir="auto">' +
      escapeHtml(yellow) +
      '</p></div></div>';

    if (isHome) {
      statsHtml +=
        '<div class="framer-1gv02xo"><div aria-hidden="true" class="framer-1naohdo ls-ltd-s65" data-framer-component-type="SVG"></div>' +
        '<div class="framer-10qz6z5 ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s57" dir="auto">' +
        escapeHtml(red) +
        '</p></div></div>';
    }

    statsHtml += '</div>';

    return (
      '<div class="' +
      (isHome ? 'framer-f916c2' : 'framer-14yunt6') +
      '" data-framer-name="' +
      (isHome ? 'Man City' : 'Liverpool') +
      '">' +
      '<div class="' +
      scoreClass +
      ' ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s55" dir="auto">' +
      escapeHtml(score) +
      '</p></div>' +
      '<div class="' +
      logoWrap +
      '" data-framer-name="' +
      logoName +
      '"><div class="ssr-variant"><div class="' +
      logoInner +
      '" data-framer-name="Image">' +
      '<div class="ls-ltd-s3" data-framer-background-image-wrapper="true">' +
      '<img alt="' +
      escapeHtml(team.name || '') +
      '" class="ls-ltd-s4" decoding="async" height="128" src="' +
      escapeHtml(team.logo || getFallbackImg()) +
      '" width="128" /></div></div></div></div>' +
      '<div class="' +
      nameClass +
      ' ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s56" dir="auto">' +
      escapeHtml(team.name || '—') +
      '</p></div>' +
      statsHtml +
      '</div>'
    );
  }

  function buildOddsRowHtml(label, home, rate, away, rowClass, labelClass, homeClass, rateClass, awayClass) {
    return (
      '<div class="' +
      rowClass +
      '">' +
      '<div class="' +
      labelClass +
      ' ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s59" dir="auto">' +
      escapeHtml(label) +
      '</p></div>' +
      '<div class="' +
      homeClass +
      ' ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s60" dir="auto">' +
      escapeHtml(formatOddsVal(home)) +
      '</p></div>' +
      '<div class="' +
      rateClass +
      ' ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s62" dir="auto">' +
      escapeHtml(formatOddsVal(rate)) +
      '</p></div>' +
      '<div class="' +
      awayClass +
      ' ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s61" dir="auto">' +
      escapeHtml(formatOddsVal(away)) +
      '</p></div></div>'
    );
  }

  function buildScheduleMatchRowHtml(match) {
    var league = (match && match.league) || {};
    var hdp = (match && match.hdp) || {};
    var ou = (match && match.ou) || {};
    var kick = formatKickoffParts(match && match.kickoff);
    var live = isLiveStatus(match && match.status);
    var statusText = formatStatusText(match);
    var detailUrl = getDetailUrl(match);
    var matchId = getMatchId(match);
    var hotClass = isPriorityMatch(match) ? ' luongson-hot-match' : '';

    return (
      '<div class="framer-w4nh6l luongson-schedule__match' +
      hotClass +
      '"' +
      (matchId ? ' data-match-id="' + escapeHtml(matchId) + '"' : '') +
      '>' +
      '<div class="framer-10q8rqr" data-framer-name="Live Match Header">' +
      '<div class="ssr-variant"><div class="framer-1u3bdzr-container">' +
      '<div class="framer-iz7ZB framer-3i8edo ls-ltd-s48 luongson-match-status"' +
      (live ? ' data-highlight="true"' : '') +
      '>' +
      '<div class="framer-9wekp1 ls-ltd-s49"></div>' +
      '<div class="framer-oy32wj ls-ltd-s50" data-framer-component-type="RichTextContainer">' +
      '<p class="framer-text ls-ltd-s51" dir="auto">' +
      escapeHtml(statusText) +
      '</p></div></div></div></div>' +
      '<div class="framer-fo8uj4 ls-ltd-s8" data-framer-component-type="RichTextContainer">' +
      '<p class="framer-text ls-ltd-s52" dir="auto">' +
      '<a class="framer-text framer-styles-preset-1kr0omk" data-styles-preset="aObUTo9X9" href="' +
      escapeHtml(detailUrl) +
      '">' +
      escapeHtml(league.name || '—') +
      '</a></p></div>' +
      '<div class="framer-1s265wr">' +
      '<div class="framer-ptrkjg ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s53" dir="auto">' +
      escapeHtml(kick.time) +
      '</p></div>' +
      '<div class="framer-wjt7qo ls-ltd-s8" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s52" dir="auto">' +
      escapeHtml(kick.date) +
      '</p></div></div></div>' +
      '<div aria-hidden="true" class="framer-1fb9lh6 ls-ltd-s54" data-framer-component-type="SVG"></div>' +
      '<a class="framer-6y1vgx" href="' +
      escapeHtml(detailUrl) +
      '">' +
      buildTeamRowHtml(match, 'home') +
      buildTeamRowHtml(match, 'away') +
      '</a>' +
      '<div class="framer-1rwoktm">' +
      '<div class="framer-kvg3eg" data-framer-name="Live Score">' +
      buildOddsRowHtml(
        'HT',
        null,
        null,
        null,
        'framer-1fj6fv7',
        'framer-45zk6d',
        'framer-7rm2ei',
        'framer-16mpmbs',
        'framer-1nam7at'
      ) +
      buildOddsRowHtml(
        'FT',
        hdp.home,
        hdp.rate,
        hdp.away,
        'framer-11m1cm9',
        'framer-lgis4k',
        'framer-5l2cc9',
        'framer-vvlwst',
        'framer-1yur8au'
      ) +
      '</div>' +
      '<div class="framer-1fh56dl" data-framer-name="Live Score">' +
      buildOddsRowHtml(
        'HT',
        null,
        null,
        null,
        'framer-hewvbf',
        'framer-7ilrx5',
        'framer-g7imbk',
        'framer-1nuh4c9',
        'framer-h0x5kk'
      ) +
      buildOddsRowHtml(
        'FT',
        ou.over,
        ou.rate,
        ou.under,
        'framer-130lxau',
        'framer-ya78b',
        'framer-rbcqob',
        'framer-1xvm2dx',
        'framer-xs9xlf'
      ) +
      '</div></div>' +
      '<div class="framer-9iptzt">' +
      '<a class="framer-1k1h91o" data-border="true" data-framer-name="Bet button" href="' +
      escapeHtml(LINK_BET) +
      '" target="_blank" rel="nofollow">' +
      '<div class="ssr-variant"><div class="framer-lrcy3t" data-framer-name="Image">' +
      '<div class="ls-ltd-s3" data-framer-background-image-wrapper="true">' +
      '<img alt="" class="ls-ltd-s4" decoding="async" height="150" src="' +
      escapeHtml(BET_LOGO_ALT) +
      '" width="300" /></div></div></div>' +
      '<div class="framer-uwn2lx ls-ltd-s63" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s64" dir="auto">cược</p></div></a>' +
      '<a class="framer-3xtg2y" data-border="true" data-framer-name="Bet button" href="' +
      escapeHtml(LINK_BET) +
      '" target="_blank" rel="nofollow">' +
      '<div class="ssr-variant"><div class="framer-1b7t7uc ls-ltd-s63" data-framer-name="Logo Vic88">' +
      '<div class="ls-ltd-s3" data-framer-background-image-wrapper="true">' +
      '<img alt="" class="ls-ltd-s4" decoding="async" height="68" src="' +
      escapeHtml(BET_LOGO) +
      '" width="280" /></div></div></div>' +
      '<div class="framer-iwh02n ls-ltd-s63" data-framer-component-type="RichTextContainer"><p class="framer-text ls-ltd-s64" dir="auto">cược</p></div></a>' +
      '</div></div>'
    );
  }

  function attachMatchData($row, match) {
    if (!$row || !$row.length || !match) return;
    var el = $row.get(0);
    el.__lsMatch = match;
    el.__lsMatchStats = match.stats || null;
    if (window.LuongsonMatchStatsModal && window.LuongsonMatchStatsModal.setCardStats) {
      window.LuongsonMatchStatsModal.setCardStats(el, match.stats || null);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* List / load more                                                         */
  /* ------------------------------------------------------------------------ */

  var LOAD_MORE_CHEVRON =
    '<svg class="luongson-schedule__load-more-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="currentColor" />' +
    '</svg>';

  function setLoadMoreLabel($btn, loading) {
    if (!$btn || !$btn.length) return;
    $btn.html((loading ? 'Đang tải...' : 'Xem thêm') + (loading ? '' : LOAD_MORE_CHEVRON));
  }

  function ensureLoadMore($root) {
    var $footer = $root.find('.luongson-schedule__footer');
    if (!$footer.length) {
      $footer = $(
        '<div class="luongson-schedule__footer">' +
          '<button type="button" class="luongson-schedule__load-more" hidden>Xem thêm' +
          LOAD_MORE_CHEVRON +
          '</button></div>'
      );
      $root.append($footer);
    }
    var $btn = $footer.find('.luongson-schedule__load-more');
    if ($btn.length && !$btn.find('.luongson-schedule__load-more-icon').length) {
      setLoadMoreLabel($btn, false);
    }
    if ($btn.length && !$btn.data('lsBound')) {
      $btn.data('lsBound', true).on('click', function () {
        if (state.loading) return;
        if (state.page >= state.totalPages) return;
        loadPage(state.page + 1, false);
      });
    }
    return $btn;
  }

  function updateLoadMoreVisibility() {
    var $btn = state.$root && ensureLoadMore(state.$root);
    if (!$btn || !$btn.length) return;
    var hasMore = state.page < state.totalPages;
    $btn.prop('hidden', !hasMore);
    $btn.prop('disabled', state.loading);
    setLoadMoreLabel($btn, state.loading);
  }

  function clearMatchRows($list) {
    if (!$list || !$list.length) return;
    $list.children('.luongson-schedule__match, .luongson-schedule__empty').remove();
  }

  function showListMessage(message) {
    var $list = state.$list;
    if (!$list) return;
    clearMatchRows($list);
    $list.append($('<div>', { class: 'luongson-schedule__empty', text: message }));
  }

  function clearListMessage() {
    if (!state.$list) return;
    state.$list.find('.luongson-schedule__empty').remove();
  }

  function initMatchModal($root) {
    var modal = window.LuongsonMatchStatsModal;
    if (!modal) return;

    modal.bindTriggers($root.get(0), '.luongson-match-status, .framer-iz7ZB.framer-3i8edo', function (trigger) {
      var card = $(trigger).closest('[data-match-id], .luongson-schedule__match, .framer-w4nh6l').get(0);
      return card && card.__lsMatchStats ? card.__lsMatchStats : null;
    });
  }

  function afterRender() {
    if (!state.$root) return;
    initMatchModal(state.$root);
    if (window.LuongsonImageFallback && window.LuongsonImageFallback.init) {
      window.LuongsonImageFallback.init(state.$root.get(0));
    }
    updateLoadMoreVisibility();
  }

  function insertRows(matches, isFirstPage) {
    var $list = state.$list;
    if (!$list || !matches.length) return;

    var i;
    var $row;

    if (isFirstPage) {
      clearMatchRows($list);
      state.renderedCount = 0;
    }

    for (i = 0; i < matches.length; i++) {
      $list.append(buildScheduleMatchRowHtml(matches[i]));
      $row = $list.children('.luongson-schedule__match').last();
      attachMatchData($row, matches[i]);
    }

    state.renderedCount += matches.length;
  }

  function getDateRange() {
    var ymd = formatYmdInVn(state.selectedDate || getVnToday());
    return { from: ymd, to: ymd };
  }

  function fetchStreamsPage(page) {
    var range = getDateRange();
    var data = {
      from: range.from,
      to: range.to,
      pageSize: String(PAGE_SIZE),
      page: String(page),
    };

    return $.ajax({
      url: STREAMS_RANGE_API,
      method: 'GET',
      data: data,
      dataType: 'json',
    });
  }

  function applyPageResponse(res, page, isFirstPage, requestId) {
    if (requestId != null && requestId !== state.requestId) return;

    if (!res || res.status !== 'success') {
      throw new Error('Invalid response');
    }

    syncPriorityCompetitionIds(res);
    // Keep API order — no client-side re-sort.
    var matches = flattenMatchesByDate(res.matches_by_date);
    var pagination = res.pagination || {};
    state.page = Number(pagination.page) || page;
    state.totalPages = Number(pagination.totalPages) || 1;
    state.totalMatches = Number(pagination.total) || matches.length;

    clearListMessage();

    if (!matches.length && isFirstPage) {
      showListMessage('Hiện tại không có trận đấu nào.');
      return;
    }

    insertRows(matches, isFirstPage);
    afterRender();
  }

  function loadPage(page, isFirstPage) {
    if (state.loading && !isFirstPage) return;
    var requestId = ++state.requestId;
    state.loading = true;
    updateLoadMoreVisibility();

    if (isFirstPage) {
      showListMessage('Đang tải trận đấu...');
    }

    fetchStreamsPage(page)
      .done(function (res) {
        try {
          applyPageResponse(res, page, isFirstPage, requestId);
        } catch (err) {
          console.error('[LuongSon schedule]', err);
          if (isFirstPage && requestId === state.requestId) {
            showListMessage('Không thể tải danh sách trận đấu.');
          }
        }
      })
      .fail(function (err) {
        console.error('[LuongSon schedule]', err);
        if (isFirstPage && requestId === state.requestId) {
          showListMessage('Không thể tải danh sách trận đấu.');
        }
      })
      .always(function () {
        if (requestId === state.requestId) {
          state.loading = false;
          updateLoadMoreVisibility();
        }
      });
  }

  function reloadForSelectedDate() {
    state.page = 1;
    state.totalPages = 1;
    state.renderedCount = 0;
    loadPage(1, true);
  }

  function updateDateLabel() {
    if (state.$label && state.$label.length) {
      state.$label.text(formatLabel(state.selectedDate));
    }
  }

  function isBeforeVnMinDate(date) {
    return formatYmdInVn(date) < formatYmdInVn(getVnMinDate());
  }

  function getVnMinDate() {
    return shiftVnDays(getVnToday(), -1);
  }

  function clampToMinDate(date) {
    return isBeforeVnMinDate(date) ? getVnMinDate() : date;
  }

  function setSelectedDate(date, options) {
    options = options || {};
    state.selectedDate = clampToMinDate(date);
    updateDateLabel();
    updatePrevNextState();
    if (state.flatpickr && !options.fromPicker) {
      state.flatpickr.setDate(state.selectedDate, false);
    }
    if (!options.skipFetch) {
      reloadForSelectedDate();
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Date picker + nav                                                        */
  /* ------------------------------------------------------------------------ */

  function updatePrevNextState() {
    if (!state.$prev || !state.$prev.length) return;
    var atMin = !state.selectedDate || isSameVnDay(state.selectedDate, getVnMinDate());
    state.$prev.prop('disabled', atMin);
    state.$prev.attr('aria-disabled', atMin ? 'true' : 'false');
    state.$prev.toggleClass('is-disabled', atMin);
  }

  /* Keep flatpickr inside the viewport — "auto center" overflows on mobile
     when the trigger sits near the left edge of the stacked header. */
  function clampFlatpickrToViewport(instance) {
    if (!instance || !instance.calendarContainer) return;
    var el = instance.calendarContainer;
    if (!el.classList.contains('open')) return;

    var margin = 8;
    var rect = el.getBoundingClientRect();
    var vw = window.innerWidth || document.documentElement.clientWidth || 0;
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!vw || !vh || !rect.width || !rect.height) return;

    var left = rect.left;
    var top = rect.top;
    var changed = false;

    if (left + rect.width > vw - margin) {
      left = vw - margin - rect.width;
      changed = true;
    }
    if (left < margin) {
      left = margin;
      changed = true;
    }
    if (top + rect.height > vh - margin) {
      top = vh - margin - rect.height;
      changed = true;
    }
    if (top < margin) {
      top = margin;
      changed = true;
    }
    if (!changed) return;

    var scrollX = window.pageXOffset || document.documentElement.scrollLeft || 0;
    var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    el.style.left = left + scrollX + 'px';
    el.style.top = top + scrollY + 'px';
    el.style.right = 'auto';
  }

  function bindFlatpickrViewportClamp(instance) {
    if (!instance || typeof instance._positionCalendar !== 'function') return;
    if (instance._lsViewportClampBound) return;
    instance._lsViewportClampBound = true;
    var originalPosition = instance._positionCalendar.bind(instance);
    instance._positionCalendar = function () {
      originalPosition();
      clampFlatpickrToViewport(instance);
    };
  }

  function initDateControls($root) {
    var $prev = $root.find('[data-framer-name="Previous Day"]');
    var $next = $root.find('[data-framer-name="Next Day"]');
    var $pickerBtn = $root.find('[data-framer-name="Date Picker"]');
    state.$label = $root.find('.luongson-schedule__date-label');
    state.$prev = $prev;
    state.$next = $next;

    state.selectedDate = getVnToday();
    updateDateLabel();
    updatePrevNextState();

    $prev.on('click', function (e) {
      e.preventDefault();
      if (isSameVnDay(state.selectedDate, getVnMinDate())) return;
      setSelectedDate(shiftVnDays(state.selectedDate, -1));
    });

    $next.on('click', function (e) {
      e.preventDefault();
      setSelectedDate(shiftVnDays(state.selectedDate, 1));
    });

    ensureFlatpickr()
      .done(function () {
        if (!$pickerBtn.length || !window.flatpickr) return;
        var locale = (window.flatpickr.l10ns && window.flatpickr.l10ns.vn) || 'default';
        var minDate = getVnMinDate();
        state.flatpickr = window.flatpickr($pickerBtn.get(0), {
          locale: locale,
          defaultDate: state.selectedDate,
          minDate: minDate,
          dateFormat: 'Y-m-d',
          disableMobile: true,
          allowInput: false,
          clickOpens: true,
          position: 'auto center',
          onReady: function (_dates, _str, instance) {
            if (instance && instance.calendarContainer) {
              instance.calendarContainer.classList.add('luongson-fp');
            }
            bindFlatpickrViewportClamp(instance);
          },
          onOpen: function (_dates, _str, instance) {
            requestAnimationFrame(function () {
              clampFlatpickrToViewport(instance);
            });
          },
          onChange: function (selectedDates) {
            if (!selectedDates || !selectedDates[0]) return;
            var picked = selectedDates[0];
            var ymd = formatYmdInVn(picked);
            var parts = ymd.split('-');
            var normalized = new Date(
              Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 5, 0, 0)
            );
            setSelectedDate(normalized, { fromPicker: true });
          },
        });
      })
      .fail(function (err) {
        console.error('[LuongSon schedule] Flatpickr load failed', err);
      });
  }

  function initAll() {
    var $root = $('.luongson-schedule').first();
    if (!$root.length) return;

    var $list = $root.find('.luongson-schedule__list').first();
    if (!$list.length) {
      $list = $('<div class="luongson-schedule__list"></div>');
      $root.append($list);
    }

    state.$root = $root;
    state.$list = $list;

    ensureLoadMore($root);
    initDateControls($root);
    reloadForSelectedDate();
  }

  $(initAll);
})(jQuery);
