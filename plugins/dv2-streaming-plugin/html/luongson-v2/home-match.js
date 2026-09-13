/**
 * LuongSon Sport — Home Featured Match (jQuery)
 */
(function ($) {
  'use strict';

  /* ------------------------------------------------------------------------ */
  /* Streams page-1 fetch (shared with list-matches.js)                       */
  /* ------------------------------------------------------------------------ */

  var PROXY_BASE =
    typeof window.DV2_PROXY_API_BASE !== 'undefined' && window.DV2_PROXY_API_BASE
      ? String(window.DV2_PROXY_API_BASE).replace(/\/+$/, '')
      : '/api/dv2-streaming-plugin';
  var STREAMS_RANGE_API = PROXY_BASE + '/streams-range';
  // statuses + priorityCompetitions are resolved server-side in streams-range proxy.

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

  // Shared cache: list-matches consumes this so page 1 is fetched only once.
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
    var pluginUrl =
      (typeof window.DV2_STREAMING_PLUGIN_URL !== 'undefined' && window.DV2_STREAMING_PLUGIN_URL) ||
      (window.dv2Streaming && window.dv2Streaming.pluginUrl) ||
      '';
    if (pluginUrl && pluginUrl.slice(-1) !== '/') pluginUrl += '/';
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
    if (!parts) return { time: '--:--', date: '--.--', ymd: '' };
    return {
      time: parts.hour + ':' + parts.minute,
      date: parts.day + '.' + parts.month,
      ymd: parts.year + '-' + parts.month + '-' + parts.day,
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

  function formatOddsVal(value) {
    if (value == null || value === '') return '-';
    return String(value);
  }

  function formatScore(match) {
    if (!match || isNotStartedStatus(match.status)) return 'VS';
    var ft = match.score && match.score.fulltime;
    if (!ft) return 'VS';
    return (ft.home != null ? ft.home : 0) + ' - ' + (ft.away != null ? ft.away : 0);
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

  // Featured = first match in API order (no client-side re-rank).
  function pickFeaturedMatch(matches) {
    if (!Array.isArray(matches) || !matches.length) return null;
    return matches[0];
  }

  function fetchStreamsPage1() {
    var range = getDateRange();
    var data = {
      from: range.from,
      to: range.to,
      pageSize: String(PAGE_SIZE),
      page: '1',
    };

    return $.ajax({
      url: STREAMS_RANGE_API,
      method: 'GET',
      data: data,
      dataType: 'json',
    });
  }

  function setText($el, text) {
    if (!$el || !$el.length) return;
    var $p = $el.is('p') ? $el : $el.find('p').first();
    if ($p.length) $p.text(text);
    else $el.text(text);
  }

  function setTeamLogo($mark, logoUrl, name) {
    if (!$mark || !$mark.length) return;
    var src = logoUrl || getFallbackImg();
    var alt = name || '';
    var $img = $mark.find('img').first();
    if ($img.length) {
      $img.attr({ src: src, alt: alt });
      return;
    }
    $mark.find('[data-framer-component-type="SVG"]').remove();
    var $box = $mark.find('.framer-1fo8xy6, .framer-1v3vzsg, .framer-18l4nza').first();
    if (!$box.length) $box = $mark;
    if (!$box.find('.ls-s4').length) {
      $box.html(
        '<div class="ls-s4" data-framer-background-image-wrapper="true">' +
          '<img class="ls-s5" alt="' +
          escapeHtml(alt) +
          '" decoding="async" height="128" src="' +
          escapeHtml(src) +
          '" width="128" /></div>'
      );
    } else {
      $box.find('.ls-s4').html(
        '<img class="ls-s5" alt="' +
          escapeHtml(alt) +
          '" decoding="async" height="128" src="' +
          escapeHtml(src) +
          '" width="128" />'
      );
    }
  }

  function renderCommentators($root, match) {
    var $wrap = $root.find('.framer-woxy63').first();
    if (!$wrap.length) return;

    var links = getMatchLinks(match);
    if (!links.length) {
      $wrap.empty();
      return;
    }

    var html = $.map(links, function (link, index) {
      var name = (link && link.commentator) || 'Nhà Đài';
      var avatar = (link && link.avatar) || getFallbackImg();
      var href = getDetailUrl(match, link);
      var cls = index === 1 ? 'framer-9fd7fs framer-jf66j3' : 'framer-66unz7 framer-jf66j3';
      var avatarBox = index === 1 ? 'framer-15u49ms' : 'framer-1bometu';
      var imgCls = index === 1 ? 'ls-s58' : 'ls-s5';
      var nameBox = index === 1 ? 'framer-s5vc6r' : 'framer-kfdcuv';

      return (
        '<a class="' +
        cls +
        '" data-framer-name="Commentator" href="' +
        escapeHtml(href) +
        '">' +
        '<div class="' +
        avatarBox +
        '" data-framer-name="Avatar">' +
        '<div class="ls-s4" data-framer-background-image-wrapper="true">' +
        '<img class="' +
        imgCls +
        '" alt="' +
        escapeHtml(name) +
        '" decoding="async" height="340" src="' +
        escapeHtml(avatar) +
        '" width="240" /></div></div>' +
        '<div class="' +
        nameBox +
        ' ls-s26" data-framer-component-type="RichTextContainer">' +
        '<p class="framer-text ls-s57" dir="auto">' +
        escapeHtml(name) +
        '</p></div></a>'
      );
    }).join('');

    $wrap.html(html);
  }

  function renderFeaturedMatch($root, match) {
    if (!$root || !$root.length || !match) return;

    var home = (match.teams && match.teams.home) || {};
    var away = (match.teams && match.teams.away) || {};
    var league = match.league || {};
    var hdp = match.hdp || {};
    var ou = match.ou || {};
    var eu = match.eu || {};
    var preferred = getPreferredLink(match);
    var detailUrl = getDetailUrl(match, preferred);
    var kick = formatKickoffParts(match.kickoff);
    var live = isLiveStatus(match.status);
    var todayYmd = formatYmdInVn(new Date());
    var dayLabel = kick.ymd && kick.ymd === todayYmd ? 'Hôm nay' : kick.date;
    var linkBet =
      typeof window.DV2_LINK_BET !== 'undefined' && window.DV2_LINK_BET
        ? String(window.DV2_LINK_BET)
        : '#';

    setText($root.find('.framer-14gk5iy'), home.name || '—');
    setText($root.find('.framer-146zqku'), away.name || '—');
    setTeamLogo($root.find('.framer-16yvchn'), home.logo, home.name);
    setTeamLogo($root.find('.framer-xfklz9'), away.logo, away.name);
    setText($root.find('.framer-1qxan8b'), league.name || '—');
    setText($root.find('.framer-15zkcwh'), dayLabel);
    setText($root.find('.framer-1afr6dj'), formatScore(match));
    setText($root.find('.framer-uurj9l'), kick.time);

    setText($root.find('.framer-81065z'), formatOddsVal(hdp.home));
    setText($root.find('.framer-avsiw5'), formatOddsVal(hdp.rate));
    setText($root.find('.framer-vavlg4'), formatOddsVal(hdp.away));
    setText($root.find('.framer-16dnq4j'), formatOddsVal(ou.over));
    setText($root.find('.framer-1a3owxk'), formatOddsVal(ou.rate));
    setText($root.find('.framer-967ehj'), formatOddsVal(ou.under));
    setText($root.find('.framer-1wem2lt'), formatOddsVal(eu.home));
    setText($root.find('.framer-104wr5r'), formatOddsVal(eu.rate));
    setText($root.find('.framer-9v3pxj'), formatOddsVal(eu.away));

    $root.find('.framer-1gtisvf').css('display', live ? '' : 'none');

    var $matchBar = $root.find('.framer-17ntzdd').first();
    if ($matchBar.length) {
      $matchBar.css('cursor', 'pointer').off('click.lsHomeMatch').on('click.lsHomeMatch', function () {
        if (detailUrl && detailUrl !== '#') window.location.href = detailUrl;
      });
    }

    renderCommentators($root, match);

    var $bet = $root.find('#luongsonHomeBet, .luongson-home-bet-link').first();
    if ($bet.length) $bet.attr('href', linkBet);

    if (window.LuongsonImageFallback && window.LuongsonImageFallback.init) {
      window.LuongsonImageFallback.init($root.get(0));
    }
  }

  function startSharedPage1Fetch() {
    window.LuongSonStreamsPage1.start(function (deferred) {
      fetchStreamsPage1()
        .done(function (res) {
          deferred.resolve({
            response: res,
            matches: flattenMatchesByDate(res && res.matches_by_date),
          });
        })
        .fail(function (err) {
          deferred.reject(err);
        });
    });
  }

  function initFeaturedMatchData() {
    var $root = $('.luongson-home-match').first();
    if (!$root.length) return;

    startSharedPage1Fetch();

    window.LuongSonStreamsPage1.promise()
      .done(function (payload) {
        try {
          var match = pickFeaturedMatch(payload && payload.matches);
          if (!match) return;
          renderFeaturedMatch($root, match);
        } catch (err) {
          console.error('[LuongSon home-match]', err);
        }
      })
      .fail(function (err) {
        console.error('[LuongSon home-match]', err);
      });
  }

  function initAll() {
    var bar = window.LuongsonFeaturedAdsBar;
    if (bar && typeof bar.initTickers === 'function') {
      bar.initTickers('.luongson-home-match');
    }
    initFeaturedMatchData();
  }

  function boot() {
    var bar = window.LuongsonFeaturedAdsBar;
    if (bar && typeof bar.whenReady === 'function') {
      bar.whenReady(initAll);
      return;
    }
    initAll();
  }

  $(boot);
})(jQuery);
