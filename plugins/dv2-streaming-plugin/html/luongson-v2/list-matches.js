/**
 * LuongSon Sport — Live matches list (jQuery)
 * Streams range API + load more + commentator dropdown + match-status hover modal
 */
(function ($) {
  'use strict';

  var cfg = window.luongsonListMatches || {};
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
  var LINK_BET =
    typeof window.DV2_LINK_BET !== 'undefined' && window.DV2_LINK_BET
      ? String(window.DV2_LINK_BET)
      : '#';

  // Server-side proxy keeps X-API-Key off the browser.
  // Public: GET /api/dv2-streaming-plugin/streams-range
  var PROXY_BASE =
    typeof window.DV2_PROXY_API_BASE !== 'undefined' && window.DV2_PROXY_API_BASE
      ? String(window.DV2_PROXY_API_BASE).replace(/\/+$/, '')
      : '/api/dv2-streaming-plugin';
  var STREAMS_RANGE_API = PROXY_BASE + '/streams-range';
  // statuses + priorityCompetitions are resolved server-side in streams-range proxy.
  var COMPETITIONS_HOT_API = PROXY_BASE + '/competitions-hot';
  var COMPETITION_CHANGE_EVENT = 'luongson:competition-change';

  var PAGE_SIZE = 33;
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
    page: 1,
    totalPages: 1,
    totalMatches: 0,
    renderedCount: 0,
    loading: false,
    adInsertions: new Map(),
    priorityCompetitionIds: new Set(),
    priorityCompetitionIdsOrdered: [],
    $root: null,
    $grid: null,
    leagueFilterEnabled: false,
    competitionId: '',
    competitionName: '',
    competitions: [],
    $leagueFilter: null,
    $leagueBtn: null,
    $leagueMenu: null,
    $leagueLabel: null,
  };

  // Same bootstrap as home-match.js (idempotent). Page 1 is fetched once from home-match.
  window.LuongSonStreamsPage1 =
    window.LuongSonStreamsPage1 ||
    (function () {
      var deferred = $.Deferred();
      var started = false;
      return {
        promise: function () {
          return deferred.promise();
        },
        hasStarted: function () {
          return started;
        },
        start: function (runner) {
          if (started) return deferred.promise();
          started = true;
          try {
            runner(deferred);
          } catch (err) {
            deferred.reject(err);
          }
          return deferred.promise();
        },
      };
    })();

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

  // Prefer first streaming link in API order (no client-side link sort).
  function getPreferredLink(match) {
    var links = match && match.livestream && match.livestream.links;
    if (!Array.isArray(links) || !links.length) return null;
    var streaming = $.grep(links, function (l) {
      return l && l.isStreaming !== false;
    });
    return (streaming.length ? streaming : links)[0] || null;
  }

  function getMatchLinks(match) {
    var links = match && match.livestream && match.livestream.links;
    return Array.isArray(links) ? links.slice() : [];
  }

  function getDetailUrl(match, link) {
    var matchId = getMatchId(match);
    if (!matchId) return '#';
    if (window.DV2StreamLinks && window.DV2StreamLinks.getDetailUrl) {
      return window.DV2StreamLinks.getDetailUrl(matchId, link || getPreferredLink(match), {
        trailingSlash: true,
      });
    }
    var liveId = link && link.liveId != null ? String(link.liveId) : '';
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

  function formatKickoffParts(kickoff) {
    var parts = getVnDateParts(parseKickoffDate(kickoff));
    if (!parts) return { time: '--:--', date: '--.--' };
    return {
      time: parts.hour + ':' + parts.minute,
      date: parts.day + '.' + parts.month,
    };
  }

  function formatYmdInVn(date) {
    var parts = getVnDateParts(date);
    if (!parts) return '';
    return parts.year + '-' + parts.month + '-' + parts.day;
  }

  function shiftVnDays(baseDate, dayDelta) {
    var parts = getVnDateParts(baseDate);
    if (!parts) return new Date(baseDate.getTime() + dayDelta * 86400000);
    // Noon UTC+7 avoids DST edge cases when shifting calendar days.
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

  function getDateRange() {
    var now = new Date();
    return {
      from: formatYmdInVn(shiftVnDays(now, -1)),
      to: formatYmdInVn(shiftVnDays(now, 1)),
    };
  }

  /* ------------------------------------------------------------------------ */
  /* League filter (opt-in via data-league-filter)                            */
  /* ------------------------------------------------------------------------ */

  function isLeagueFilterEnabled($root) {
    if (!$root || !$root.length) return false;
    var flag = $root.attr('data-league-filter');
    return flag === '1' || flag === 'true';
  }

  function readCompetitionFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      return {
        id: String(params.get('competition_id') || '').trim(),
        name: String(params.get('competition_name') || '').trim(),
      };
    } catch (err) {
      return { id: '', name: '' };
    }
  }

  function writeCompetitionToUrl(id, name, options) {
    options = options || {};
    try {
      var url = new URL(window.location.href);
      if (id) {
        url.searchParams.set('competition_id', id);
      } else {
        url.searchParams.delete('competition_id');
      }
      if (name) {
        url.searchParams.set('competition_name', name);
      } else {
        url.searchParams.delete('competition_name');
      }
      var method = options.push ? 'pushState' : 'replaceState';
      window.history[method]({}, '', url.pathname + url.search + url.hash);
    } catch (err) {
      // Ignore URL sync failures (old browsers / file://).
    }
  }

  function emitCompetitionChange(id, name) {
    try {
      document.dispatchEvent(
        new CustomEvent(COMPETITION_CHANGE_EVENT, {
          detail: { id: id || '', name: name || '' },
        })
      );
    } catch (err) {
      // IE / very old browsers — schedule also hydrates from URL.
    }
  }

  function normalizeCompetitionItem(item) {
    if (!item || typeof item !== 'object') return null;
    var id = String(item.id || item.competitionId || item.competition_id || '').trim();
    if (!id) return null;
    var name = String(
      item.name || item.competitionName || item.competition_name || item.title || ''
    ).trim();
    return { id: id, name: name || id };
  }

  function parseCompetitionsHotResponse(res) {
    var raw =
      (res && Array.isArray(res.result) && res.result) ||
      (res && Array.isArray(res.data) && res.data) ||
      (res && res.json && Array.isArray(res.json.result) && res.json.result) ||
      (Array.isArray(res) && res) ||
      [];
    var out = [];
    var i;
    var item;
    for (i = 0; i < raw.length; i++) {
      item = normalizeCompetitionItem(raw[i]);
      if (item) out.push(item);
    }
    return out;
  }

  function fetchCompetitionsHot() {
    return $.ajax({
      url: COMPETITIONS_HOT_API,
      method: 'GET',
      dataType: 'json',
    });
  }

  function findCompetitionById(list, id) {
    var sid = String(id || '').trim();
    if (!sid || !list || !list.length) return null;
    var i;
    for (i = 0; i < list.length; i++) {
      if (String(list[i].id) === sid) return list[i];
    }
    return null;
  }

  /**
   * Resolve selected competition.
   * Choice: keep URL id even if not in hot list (API still accepts it);
   * if no URL id → first hot item.
   */
  function resolveSelectedCompetition(list, urlState) {
    var urlId = (urlState && urlState.id) || '';
    var urlName = (urlState && urlState.name) || '';
    if (urlId) {
      var matched = findCompetitionById(list, urlId);
      if (matched) return matched;
      return { id: urlId, name: urlName || urlId };
    }
    if (list && list.length) return list[0];
    return { id: '', name: '' };
  }

  function setLeagueButtonLabel(name) {
    if (state.$leagueLabel && state.$leagueLabel.length) {
      state.$leagueLabel.text(name || 'Chọn giải');
    }
  }

  function closeLeagueMenu() {
    if (!state.$leagueMenu || !state.$leagueMenu.length) return;
    state.$leagueMenu.prop('hidden', true);
    if (state.$leagueBtn && state.$leagueBtn.length) {
      state.$leagueBtn.attr('aria-expanded', 'false');
    }
    if (state.$leagueFilter && state.$leagueFilter.length) {
      state.$leagueFilter.removeClass('is-open');
    }
  }

  function openLeagueMenu() {
    if (!state.$leagueMenu || !state.$leagueMenu.length) return;
    state.$leagueMenu.prop('hidden', false);
    if (state.$leagueBtn && state.$leagueBtn.length) {
      state.$leagueBtn.attr('aria-expanded', 'true');
    }
    if (state.$leagueFilter && state.$leagueFilter.length) {
      state.$leagueFilter.addClass('is-open');
    }
  }

  function toggleLeagueMenu() {
    if (!state.$leagueMenu || !state.$leagueMenu.length) return;
    if (state.$leagueMenu.prop('hidden')) openLeagueMenu();
    else closeLeagueMenu();
  }

  function renderLeagueMenu(list) {
    if (!state.$leagueMenu || !state.$leagueMenu.length) return;
    var html = '';
    var i;
    var item;
    var selected = state.competitionId;
    for (i = 0; i < list.length; i++) {
      item = list[i];
      html +=
        '<li role="option" class="luongson-list-matches__league-option' +
        (String(item.id) === String(selected) ? ' is-selected' : '') +
        '" data-competition-id="' +
        escapeHtml(item.id) +
        '" data-competition-name="' +
        escapeHtml(item.name) +
        '" aria-selected="' +
        (String(item.id) === String(selected) ? 'true' : 'false') +
        '">' +
        escapeHtml(item.name) +
        '</li>';
    }
    state.$leagueMenu.html(html);
  }

  function applyCompetitionSelection(id, name, options) {
    options = options || {};
    var nextId = String(id || '').trim();
    var nextName = String(name || '').trim();
    var changed = nextId !== state.competitionId;

    state.competitionId = nextId;
    state.competitionName = nextName;
    setLeagueButtonLabel(nextName || nextId || 'Chọn giải');

    if (!options.skipUrl) {
      writeCompetitionToUrl(nextId, nextName, { push: !!options.push });
    }
    if (!options.skipEvent) {
      emitCompetitionChange(nextId, nextName);
    }
    if (state.competitions.length) {
      renderLeagueMenu(state.competitions);
    }
    closeLeagueMenu();

    if (changed && !options.skipFetch) {
      reloadMatchesForCompetition();
    }
  }

  function reloadMatchesForCompetition() {
    state.page = 1;
    state.totalPages = 1;
    state.renderedCount = 0;
    // League page must not reuse homepage shared page-1 cache.
    loadPage(1, true);
  }

  function bindLeagueFilterUi() {
    if (!state.$leagueFilter || !state.$leagueFilter.length) return;

    state.$leagueBtn.on('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleLeagueMenu();
    });

    state.$leagueMenu.on('click', '.luongson-list-matches__league-option', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var $opt = $(this);
      applyCompetitionSelection(
        $opt.attr('data-competition-id'),
        $opt.attr('data-competition-name'),
        { push: true }
      );
    });

    $(document).on('click.luongsonLeagueFilter', function () {
      closeLeagueMenu();
    });

    state.$leagueFilter.on('click', function (e) {
      e.stopPropagation();
    });
  }

  function initLeagueFilter($root) {
    var deferred = $.Deferred();
    state.leagueFilterEnabled = true;
    state.$leagueFilter = $root.find('.luongson-list-matches__league-filter').first();
    state.$leagueBtn = state.$leagueFilter.find('.luongson-list-matches__league-btn').first();
    state.$leagueMenu = state.$leagueFilter.find('.luongson-list-matches__league-menu').first();
    state.$leagueLabel = state.$leagueBtn.find('.luongson-list-matches__league-btn-label').first();

    if (!state.$leagueFilter.length) {
      deferred.resolve();
      return deferred.promise();
    }

    bindLeagueFilterUi();

    var urlState = readCompetitionFromUrl();
    if (urlState.id) {
      state.competitionId = urlState.id;
      state.competitionName = urlState.name;
      setLeagueButtonLabel(urlState.name || urlState.id);
    }

    fetchCompetitionsHot()
      .done(function (res) {
        var list = parseCompetitionsHotResponse(res);
        state.competitions = list;

        if (!list.length) {
          state.$leagueFilter.prop('hidden', true);
          state.$leagueBtn.prop('disabled', true);
          // Keep URL id if present so schedule/API still filter.
          if (state.competitionId) {
            writeCompetitionToUrl(state.competitionId, state.competitionName);
            emitCompetitionChange(state.competitionId, state.competitionName);
          }
          deferred.resolve();
          return;
        }

        state.$leagueFilter.prop('hidden', false);
        var selected = resolveSelectedCompetition(list, urlState);
        applyCompetitionSelection(selected.id, selected.name, {
          skipFetch: true,
          skipEvent: false,
        });
        deferred.resolve();
      })
      .fail(function (err) {
        console.error('[LuongSon list-matches] competitions-hot', err);
        state.$leagueFilter.prop('hidden', true);
        if (state.competitionId) {
          writeCompetitionToUrl(state.competitionId, state.competitionName);
          emitCompetitionChange(state.competitionId, state.competitionName);
        }
        deferred.resolve();
      });

    return deferred.promise();
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

  function formatScore(match) {
    if (!match || isNotStartedStatus(match.status)) return 'VS';
    var ft = match.score && match.score.fulltime;
    if (!ft) return 'VS';
    return (ft.home != null ? ft.home : 0) + ' - ' + (ft.away != null ? ft.away : 0);
  }

  function formatOddsVal(value) {
    if (value == null || value === '') return '-';
    return String(value);
  }

  function getStatPairText(match, key) {
    var ft = match && match.stats && match.stats.ft;
    if (!ft || ft[key] == null) return '0-0';
    var val = ft[key];
    if (Array.isArray(val)) {
      return (val[0] != null ? val[0] : 0) + '-' + (val[1] != null ? val[1] : 0);
    }
    if (typeof val === 'object') {
      return (val.home != null ? val.home : 0) + '-' + (val.away != null ? val.away : 0);
    }
    return '0-0';
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

  function buildMatchCardHtml(match) {
    var league = (match && match.league) || {};
    var home = (match && match.teams && match.teams.home) || {};
    var away = (match && match.teams && match.teams.away) || {};
    var hdp = (match && match.hdp) || {};
    var preferred = getPreferredLink(match);
    var kick = formatKickoffParts(match && match.kickoff);
    var live = isLiveStatus(match && match.status);
    var statusText = formatStatusText(match);
    var detailUrl = getDetailUrl(match, preferred);
    var blvName = preferred && preferred.commentator ? preferred.commentator : 'Nhà Đài';
    var blvAvatar = (preferred && preferred.avatar) || getFallbackImg();
    var matchId = getMatchId(match);
    var corner = getStatPairText(match, 'corner');
    var yellow = getStatPairText(match, 'yellowCard');
    var red = getStatPairText(match, 'redCard');
    var hotClass = isPriorityMatch(match) ? ' luongson-hot-match' : '';

    return (
      '<div class="luongson-match-card' +
      hotClass +
      '" data-border="true"' +
      (matchId ? ' data-match-id="' + escapeHtml(matchId) + '"' : '') +
      '>' +
      '<div class="luongson-match-header">' +
      '<div class="luongson-match-league"><p>' +
      escapeHtml(league.name || '—') +
      '</p></div>' +
      '<div class="luongson-match-status-container">' +
      '<div class="luongson-match-status"' +
      (live ? ' data-highlight="true"' : '') +
      '>' +
      '<span class="luongson-match-status-dot" aria-hidden="true"></span>' +
      '<span class="luongson-match-status-text">' +
      escapeHtml(statusText) +
      '</span>' +
      '</div></div>' +
      '<div class="luongson-match-time-box">' +
      '<span class="luongson-match-time">' +
      escapeHtml(kick.time) +
      '</span>' +
      '<span class="luongson-match-date">' +
      escapeHtml(kick.date) +
      '</span>' +
      '</div></div>' +
      '<a class="luongson-match-body" href="' +
      escapeHtml(detailUrl) +
      '">' +
      '<div class="luongson-match-team">' +
      '<div class="luongson-match-team-logo">' +
      '<img alt="' +
      escapeHtml(home.name || '') +
      '" decoding="async" height="128" src="' +
      escapeHtml(home.logo || getFallbackImg()) +
      '" width="128" />' +
      '</div><div class="luongson-match-team-name"><p>' +
      escapeHtml(home.name || '—') +
      '</p></div></div>' +
      '<div class="luongson-match-score-center">' +
      '<div class="luongson-match-score-box"><p class="luongson-match-score-text">' +
      escapeHtml(formatScore(match)) +
      '</p></div>' +
      '<div class="luongson-match-stats">' +
      '<div class="luongson-match-stat-item">' +
      '<svg class="luongson-match-stat-flag" role="presentation" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M5 21V4m0 0l13 4.5L5 13V4z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />' +
      '</svg><span class="luongson-match-stat-text">' +
      escapeHtml(corner) +
      '</span></div>' +
      '<div class="luongson-match-stat-item">' +
      '<span class="luongson-match-stat-card is-yellow" aria-hidden="true"></span>' +
      '<span class="luongson-match-stat-text">' +
      escapeHtml(yellow) +
      '</span></div>' +
      '<div class="luongson-match-stat-item">' +
      '<span class="luongson-match-stat-card is-red" aria-hidden="true"></span>' +
      '<span class="luongson-match-stat-text">' +
      escapeHtml(red) +
      '</span></div>' +
      '</div></div>' +
      '<div class="luongson-match-team">' +
      '<div class="luongson-match-team-logo">' +
      '<img alt="' +
      escapeHtml(away.name || '') +
      '" decoding="async" height="128" src="' +
      escapeHtml(away.logo || getFallbackImg()) +
      '" width="128" />' +
      '</div><div class="luongson-match-team-name"><p>' +
      escapeHtml(away.name || '—') +
      '</p></div></div>' +
      '</a>' +
      '<div class="luongson-match-footer">' +
      '<div class="luongson-match-commentator-container">' +
      '<div class="luongson-match-commentator" data-commentator="' +
      escapeHtml(blvName) +
      '">' +
      '<button type="button" class="luongson-match-commentator-trigger" aria-haspopup="listbox" aria-expanded="false">' +
      '<span class="luongson-match-commentator-avatar" data-border="true">' +
      '<img alt="" decoding="async" height="472" src="' +
      escapeHtml(blvAvatar) +
      '" width="400" />' +
      '</span><span class="luongson-match-commentator-name">' +
      escapeHtml(blvName) +
      '</span>' +
      '<svg class="luongson-match-commentator-chevron" role="presentation" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />' +
      '</svg>' +
      '</button></div></div>' +
      '<div class="luongson-match-odds-wrapper">' +
      '<div class="luongson-match-odds-box">' +
      '<div class="luongson-match-odds-type"><span>HDP FT</span></div>' +
      '<div class="luongson-match-odds-values">' +
      '<span class="luongson-match-odds-val is-home">' +
      escapeHtml(formatOddsVal(hdp.home)) +
      '</span>' +
      '<span class="luongson-match-odds-val">' +
      escapeHtml(formatOddsVal(hdp.rate)) +
      '</span>' +
      '<span class="luongson-match-odds-val is-away">' +
      escapeHtml(formatOddsVal(hdp.away)) +
      '</span>' +
      '</div></div>' +
      '<a class="luongson-match-bet-btn" href="' +
      escapeHtml(LINK_BET) +
      '" target="_blank" rel="nofollow" data-border="true">' +
      '<img class="luongson-match-bet-logo" alt="" decoding="async" height="68" loading="lazy" src="' +
      escapeHtml(BET_LOGO) +
      '" width="280" />' +
      '<span class="luongson-match-bet-text">cược</span></a>' +
      '</div></div></div>'
    );
  }

  function getMatchListAdBlocks() {
    if (!window.DV2ListAds || !window.DV2ListAds.getBlocks) return [];
    return window.DV2ListAds.getBlocks(window.DV2_SOCOLIVE_MATCH_LIST_ADS);
  }

  function buildMatchListAdInsertions(totalItems) {
    if (!window.DV2ListAds || !window.DV2ListAds.buildInsertions) return new Map();
    return window.DV2ListAds.buildInsertions(getMatchListAdBlocks(), totalItems, {
      breakpoint: window.DV2_SOCOLIVE_MATCH_LIST_ADS_MOBILE_BREAKPOINT,
      repeatCycle: window.DV2_SOCOLIVE_MATCH_LIST_ADS_REPEAT,
    });
  }

  function buildMatchListAdMarkup(adBlock) {
    if (!window.DV2ListAds || !window.DV2ListAds.buildMarkup) return '';
    return window.DV2ListAds.buildMarkup(adBlock, {
      wrapperTag: 'div',
      wrapperClass: 'dv2-ls-match-list-ad',
    });
  }

  function refreshMatchListReviveAds($container) {
    if (window.DV2ListAds && window.DV2ListAds.refreshReviveAds) {
      window.DV2ListAds.refreshReviveAds($container);
    }
  }

  function clearMatchCards($grid) {
    if (!$grid || !$grid.length) return;
    $grid.children('.luongson-match-card, .dv2-ls-match-list-ad').remove();
  }

  function attachMatchData($card, match) {
    if (!$card || !$card.length || !match) return;
    var el = $card.get(0);
    el.__lsMatch = match;
    el.__lsMatchStats = match.stats || null;
    if (window.LuongsonMatchStatsModal && window.LuongsonMatchStatsModal.setCardStats) {
      window.LuongsonMatchStatsModal.setCardStats(el, match.stats || null);
    }
  }

  function appendMatchListAdAt(position) {
    var $grid = state.$grid;
    if (!$grid || !state.adInsertions.has(position)) return;
    var adMarkup = buildMatchListAdMarkup(state.adInsertions.get(position));
    if (adMarkup) $grid.append(adMarkup);
  }

  function insertCards(matches, isFirstPage) {
    var $grid = state.$grid;
    if (!$grid || !matches.length) return;

    var created = [];
    var i;
    var $card;

    if (isFirstPage) {
      clearMatchCards($grid);
      state.renderedCount = 0;
    }

    for (i = 0; i < matches.length; i++) {
      $grid.append(buildMatchCardHtml(matches[i]));
      $card = $grid.children('.luongson-match-card').last();
      attachMatchData($card, matches[i]);
      created.push($card.get(0));
      appendMatchListAdAt(state.renderedCount + i + 1);
    }

    state.renderedCount += matches.length;
    refreshMatchListReviveAds($grid);
    return created;
  }

  /* ------------------------------------------------------------------------ */
  /* Commentator dropdown                                                     */
  /* ------------------------------------------------------------------------ */

  function optionHtml(name, avatar, liveId) {
    return (
      '<button type="button" class="luongson-commentator-option" role="option" data-commentator="' +
      escapeHtml(name) +
      '" data-avatar="' +
      escapeHtml(avatar || '') +
      '" data-live-id="' +
      escapeHtml(liveId != null ? String(liveId) : '') +
      '">' +
      '<span class="luongson-commentator-option__avatar">' +
      '<img alt="" decoding="async" src="' +
      escapeHtml(avatar || getFallbackImg()) +
      '" />' +
      '</span>' +
      '<span class="luongson-commentator-option__name">' +
      escapeHtml(name) +
      '</span>' +
      '</button>'
    );
  }

  /* Module-level portal controller — survives card re-renders / afterRender */
  var commentatorPortal = {
    $portal: null,
    $panel: null,
    $activeTrigger: null,
    bound: false,
  };

  function ensureCommentatorPortal() {
    if (commentatorPortal.$portal && commentatorPortal.$portal.length) {
      return commentatorPortal.$portal;
    }

    var $portal = $('.luongson-commentator-portal').not('.luongson-stream-commentator-portal').first();
    if (!$portal.length) {
      $portal = $('<div>', {
        class: 'luongson-commentator-portal',
        hidden: true,
      }).css({
        display: 'none',
        opacity: 0,
        transform: 'translateY(-4px) scale(0.98)',
        transition: 'opacity .15s ease,transform .15s cubic-bezier(0,.8,.2,1)',
        'transform-origin': 'top left',
      });
      $portal.html('<div class="luongson-commentator-portal__panel" data-border="true" role="listbox"></div>');
      $('body').append($portal);
    }

    commentatorPortal.$portal = $portal;
    commentatorPortal.$panel = $portal.find('.luongson-commentator-portal__panel');
    return $portal;
  }

  function fillCommentatorOptions(match) {
    var $panel = commentatorPortal.$panel;
    if (!$panel || !$panel.length) return;
    var links = getMatchLinks(match);
    if (!links.length) {
      $panel.html(optionHtml('Nhà Đài', getFallbackImg()));
      return;
    }
    $panel.html(
      $.map(links, function (link, index) {
        var name =
          window.DV2StreamLinks && window.DV2StreamLinks.getBlvName
            ? window.DV2StreamLinks.getBlvName(link, index)
            : link.commentator || 'Link ' + (index + 1);
        return optionHtml(name, link.avatar || getFallbackImg(), link.liveId);
      }).join('')
    );
  }

  function positionCommentatorPortal($trigger) {
    var $portal = commentatorPortal.$portal;
    if (!$portal || !$portal.length || !$trigger || !$trigger.length) return;

    var rect = $trigger.get(0).getBoundingClientRect();
    var w = 170;
    var h = $portal.outerHeight() || 120;
    var left = rect.left;
    if (left + w > $(window).width() - 10) left = $(window).width() - w - 10;
    if (left < 10) left = 10;

    var top = rect.bottom + 6;
    if (top + h > $(window).height() - 10 && rect.top - h - 6 > 0) {
      top = rect.top - h - 6;
    }

    $portal.css({ left: left + 'px', top: top + 'px' });
  }

  function closeCommentatorDropdown() {
    var $portal = commentatorPortal.$portal;
    var $activeTrigger = commentatorPortal.$activeTrigger;
    if (!$portal || !$portal.length) return;

    if ($activeTrigger) $activeTrigger.attr('aria-expanded', 'false');
    $portal.css({ opacity: 0, transform: 'translateY(-4px) scale(0.98)' });
    setTimeout(function () {
      if (parseFloat($portal.css('opacity')) === 0) {
        $portal.css('display', 'none').attr('hidden', 'hidden');
        commentatorPortal.$activeTrigger = null;
      }
    }, 150);
  }

  function openCommentatorDropdown($trigger) {
    ensureCommentatorPortal();
    var $portal = commentatorPortal.$portal;
    var $activeTrigger = commentatorPortal.$activeTrigger;

    if (
      $activeTrigger &&
      $activeTrigger.get(0) === $trigger.get(0) &&
      $portal.css('display') !== 'none'
    ) {
      closeCommentatorDropdown();
      return;
    }

    if ($activeTrigger && $activeTrigger.get(0) !== $trigger.get(0)) {
      $activeTrigger.attr('aria-expanded', 'false');
    }

    var $card = $trigger.closest('.luongson-match-card');
    fillCommentatorOptions($card.length ? $card.get(0).__lsMatch : null);

    commentatorPortal.$activeTrigger = $trigger;
    $trigger.attr('aria-expanded', 'true');
    $portal.removeAttr('hidden').css('display', 'block');
    positionCommentatorPortal($trigger);

    requestAnimationFrame(function () {
      $portal.css({ opacity: 1, transform: 'translateY(0) scale(1)' });
    });
  }

  function bindCommentatorPortalOnce() {
    if (commentatorPortal.bound) return;
    commentatorPortal.bound = true;

    var $portal = ensureCommentatorPortal();

    $portal.on('click', function (e) {
      var $opt = $(e.target).closest('.luongson-commentator-option');
      var $activeTrigger = commentatorPortal.$activeTrigger;
      if (!$opt.length || !$activeTrigger) return;
      e.preventDefault();
      e.stopPropagation();

      var $card = $activeTrigger.closest('.luongson-match-card');
      var match = $card.length ? $card.get(0).__lsMatch : null;
      if (!match) {
        closeCommentatorDropdown();
        return;
      }

      var links = getMatchLinks(match);
      var liveId = $opt.attr('data-live-id');
      var name = $opt.attr('data-commentator');
      var selected = null;
      var i;

      if (liveId) {
        for (i = 0; i < links.length; i++) {
          if (String(links[i].liveId) === String(liveId)) {
            selected = links[i];
            break;
          }
        }
      }

      if (!selected && name) {
        for (i = 0; i < links.length; i++) {
          var linkName =
            window.DV2StreamLinks && window.DV2StreamLinks.getBlvName
              ? window.DV2StreamLinks.getBlvName(links[i], i)
              : links[i].commentator || '';
          if (linkName === name) {
            selected = links[i];
            break;
          }
        }
      }

      if (!selected && links.length) selected = links[0];

      if (
        selected &&
        window.DV2StreamLinks &&
        window.DV2StreamLinks.navigateForLink &&
        window.DV2StreamLinks.navigateForLink(selected)
      ) {
        return;
      }

      window.location.href = getDetailUrl(match, selected);
    });

    $(document).on('click.lsListPortal', function (e) {
      var $portalEl = commentatorPortal.$portal;
      var $activeTrigger = commentatorPortal.$activeTrigger;
      if (!$portalEl || !$portalEl.length || $portalEl.css('display') === 'none') return;
      if (
        !$portalEl.is(e.target) &&
        !$portalEl.has(e.target).length &&
        (!$activeTrigger || (!$activeTrigger.is(e.target) && !$activeTrigger.has(e.target).length))
      ) {
        closeCommentatorDropdown();
      }
    });

    $(document).on('keydown.lsListPortal', function (e) {
      var $portalEl = commentatorPortal.$portal;
      if (e.key === 'Escape' && $portalEl && $portalEl.css('display') !== 'none') {
        closeCommentatorDropdown();
      }
    });

    $(window).on('scroll.lsListPortal resize.lsListPortal', function () {
      var $portalEl = commentatorPortal.$portal;
      var $activeTrigger = commentatorPortal.$activeTrigger;
      if (!$portalEl || $portalEl.css('display') === 'none' || !$activeTrigger) return;
      var rect = $activeTrigger.get(0).getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > $(window).height()) {
        $portalEl.css({ display: 'none', opacity: 0 });
        $activeTrigger.attr('aria-expanded', 'false');
        commentatorPortal.$activeTrigger = null;
      } else {
        positionCommentatorPortal($activeTrigger);
      }
    });
  }

  function initCommentatorDropdown($root) {
    bindCommentatorPortalOnce();

    $root.find('.luongson-match-commentator-trigger').each(function () {
      var $btn = $(this);
      if ($btn.data('lsBound')) return;
      $btn.data('lsBound', true).on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openCommentatorDropdown($btn);
      });
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Match status modal                                                       */
  /* ------------------------------------------------------------------------ */

  function initMatchModal($root) {
    var modal = window.LuongsonMatchStatsModal;
    if (!modal) return;

    modal.bindTriggers($root.get(0), '.luongson-match-status', function (trigger) {
      var card = $(trigger).closest('.luongson-match-card').get(0);
      return card && card.__lsMatchStats ? card.__lsMatchStats : null;
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Load more                                                                */
  /* ------------------------------------------------------------------------ */

  var LOAD_MORE_CHEVRON =
    '<svg class="luongson-list-matches__load-more-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="currentColor" />' +
    '</svg>';

  function setLoadMoreLabel($btn, loading) {
    if (!$btn || !$btn.length) return;
    $btn.html((loading ? 'Đang tải...' : 'Xem thêm') + (loading ? '' : LOAD_MORE_CHEVRON));
  }

  function ensureLoadMore($root) {
    var $footer = $root.find('.luongson-list-matches__footer');
    if (!$footer.length) {
      $footer = $(
        '<div class="luongson-list-matches__footer">' +
          '<button type="button" class="luongson-list-matches__load-more" hidden>Xem thêm' +
          LOAD_MORE_CHEVRON +
          '</button></div>'
      );
      $root.append($footer);
    }
    var $btn = $footer.find('.luongson-list-matches__load-more');
    if ($btn.length && !$btn.find('.luongson-list-matches__load-more-icon').length) {
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

  function afterRender() {
    if (!state.$root) return;
    initCommentatorDropdown(state.$root);
    initMatchModal(state.$root);
    if (window.LuongsonImageFallback && window.LuongsonImageFallback.init) {
      window.LuongsonImageFallback.init(state.$root.get(0));
    }
    updateLoadMoreVisibility();
  }

  function showGridMessage(message, options) {
    var $grid = state.$grid;
    if (!$grid) return;
    clearMatchCards($grid);
    $grid.find('.luongson-list-matches__empty').remove();
    $grid.append(
      $('<div>', { class: 'luongson-list-matches__empty', text: message })
    );
    if (options && options.withEmptyAd) {
      appendMatchListAdAt(0);
      refreshMatchListReviveAds($grid);
    }
  }

  function clearGridMessage() {
    if (!state.$grid) return;
    state.$grid.find('.luongson-list-matches__empty').remove();
  }

  function fetchStreamsPage(page) {
    var range = getDateRange();
    var data = {
      from: range.from,
      to: range.to,
      pageSize: String(PAGE_SIZE),
      page: String(page),
    };
    if (state.leagueFilterEnabled && state.competitionId) {
      data.competitions = state.competitionId;
    }

    return $.ajax({
      url: STREAMS_RANGE_API,
      method: 'GET',
      data: data,
      dataType: 'json',
    });
  }

  function applyPageResponse(res, page, isFirstPage) {
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

    clearGridMessage();

    if (isFirstPage) {
      state.adInsertions = buildMatchListAdInsertions(
        matches.length ? state.totalMatches : 0
      );
    }

    if (!matches.length && isFirstPage) {
      showGridMessage('Hiện tại không có trận đấu nào.', { withEmptyAd: true });
      return;
    }

    insertCards(matches, isFirstPage);
    afterRender();
  }

  function loadPage(page, isFirstPage) {
    if (state.loading) return;
    state.loading = true;
    updateLoadMoreVisibility();

    if (isFirstPage) {
      showGridMessage('Đang tải trận đấu...');
    }

    fetchStreamsPage(page)
      .done(function (res) {
        try {
          applyPageResponse(res, page, isFirstPage);
        } catch (err) {
          console.error('[LuongSon list-matches]', err);
          if (isFirstPage) {
            showGridMessage('Không thể tải danh sách trận đấu.');
          }
        }
      })
      .fail(function (err) {
        console.error('[LuongSon list-matches]', err);
        if (isFirstPage) {
          showGridMessage('Không thể tải danh sách trận đấu.');
        }
      })
      .always(function () {
        state.loading = false;
        updateLoadMoreVisibility();
      });
  }

  function startOwnPage1Fetch(deferred) {
    fetchStreamsPage(1)
      .done(function (res) {
        deferred.resolve({
          response: res,
          matches: flattenMatchesByDate(res && res.matches_by_date),
        });
      })
      .fail(function (err) {
        deferred.reject(err);
      });
  }

  function loadFirstPageFromSharedOrOwn() {
    if (state.loading) return;
    state.loading = true;
    updateLoadMoreVisibility();
    showGridMessage('Đang tải trận đấu...');

    // League filter must always fetch its own page-1 (with competitions param).
    if (state.leagueFilterEnabled) {
      fetchStreamsPage(1)
        .done(function (res) {
          try {
            applyPageResponse(res, 1, true);
          } catch (err) {
            console.error('[LuongSon list-matches]', err);
            showGridMessage('Không thể tải danh sách trận đấu.');
          }
        })
        .fail(function (err) {
          console.error('[LuongSon list-matches]', err);
          showGridMessage('Không thể tải danh sách trận đấu.');
        })
        .always(function () {
          state.loading = false;
          updateLoadMoreVisibility();
        });
      return;
    }

    var hasHomeMatch = $('.luongson-home-match').length > 0;

    // After all document.ready handlers (home-match starts the shared fetch first).
    setTimeout(function () {
      if (!hasHomeMatch || !window.LuongSonStreamsPage1.hasStarted()) {
        window.LuongSonStreamsPage1.start(startOwnPage1Fetch);
      }

      window.LuongSonStreamsPage1.promise()
        .done(function (payload) {
          try {
            applyPageResponse(payload && payload.response, 1, true);
          } catch (err) {
            console.error('[LuongSon list-matches]', err);
            showGridMessage('Không thể tải danh sách trận đấu.');
          }
        })
        .fail(function (err) {
          console.error('[LuongSon list-matches]', err);
          showGridMessage('Không thể tải danh sách trận đấu.');
        })
        .always(function () {
          state.loading = false;
          updateLoadMoreVisibility();
        });
    }, 0);
  }

  function initAll() {
    var $root = $('.luongson-list-matches').first();
    if (!$root.length) return;

    var $grid = $root.find('.luongson-live-grid').first();
    if (!$grid.length) return;

    // Remove legacy static ads placeholder; ads are interleaved via DV2ListAds.
    $grid.find('.luongson-live-ads').remove();

    state.$root = $root;
    state.$grid = $grid;

    ensureLoadMore($root);

    if (isLeagueFilterEnabled($root)) {
      initLeagueFilter($root).always(function () {
        loadFirstPageFromSharedOrOwn();
      });
      return;
    }

    loadFirstPageFromSharedOrOwn();
  }

  $(initAll);
})(jQuery);
