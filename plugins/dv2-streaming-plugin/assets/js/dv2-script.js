/* blv-dropdown.js */
(function(window, $, jQuery, Hls, Swiper) {
/**
 * Shared BLV (commentator) dropdown for match list cards.
 * - Build HTML from sorted livestream links
 * - jQuery event binding: toggle, close others, click-outside
 */
window.DV2BlvDropdown = window.DV2BlvDropdown || {};

(function (DV2BlvDropdown) {
  const documentCloseBound = new Set();

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getMatchId(match) {
    return match?.match_id || match?.matchId || match?.id || match?.slug || "";
  }

  function getSortedLinks(match) {
    if (window.DV2StreamLinks?.sortForDetail) {
      return window.DV2StreamLinks.sortForDetail(match?.livestream?.links);
    }
    return Array.isArray(match?.livestream?.links) ? match.livestream.links : [];
  }

  function getBlvLabel(link, index) {
    if (window.DV2StreamLinks?.getBlvName) {
      return window.DV2StreamLinks.getBlvName(link, index);
    }
    return String(link?.commentator || "").trim() || `Link ${index + 1}`;
  }

  function defaultGetDetailUrl(matchId, link) {
    if (window.DV2StreamLinks?.getDetailUrl) {
      return window.DV2StreamLinks.getDetailUrl(matchId, link, { trailingSlash: false });
    }
    const liveId = link?.liveId != null ? String(link.liveId) : "";
    if (liveId) {
      return `/streams/${matchId}?liveId=${encodeURIComponent(liveId)}`;
    }
    return `/streams/${matchId}`;
  }

  function closeAllDropdowns($, $container) {
    $container.find(".dv2-blv-dropdown.is-open").each(function () {
      $(this)
        .removeClass("is-open")
        .find(".dv2-blv-dropdown__toggle")
        .attr("aria-expanded", "false");
    });
  }

  DV2BlvDropdown.escapeHtml = escapeHtml;
  DV2BlvDropdown.getMatchId = getMatchId;
  DV2BlvDropdown.getSortedLinks = getSortedLinks;
  DV2BlvDropdown.getBlvLabel = getBlvLabel;
  DV2BlvDropdown.defaultGetDetailUrl = defaultGetDetailUrl;

  /**
   * @param {Object} options
   * @param {Object} options.match
   * @param {Array} [options.links]
   * @param {Object} [options.preferredLink]
   * @param {string} [options.matchId]
   * @param {Function} [options.getDetailUrl]
   * @param {Function} [options.escapeHtml]
   * @param {Function} options.renderToggle - ({ link, label, esc }) => HTML before caret
   * @param {Function} options.renderItemContent - ({ link, label, href, index, esc }) => HTML inside <a>
   * @param {string} [options.emptyHtml]
   * @param {'up'|'down'} [options.menuPlacement]
   * @param {string} [options.rootClass]
   * @param {string} [options.toggleClass]
   */
  DV2BlvDropdown.build = function build(options) {
    const opts = options || {};
    const {
      match,
      links = getSortedLinks(match),
      preferredLink,
      matchId = getMatchId(match),
      getDetailUrl = defaultGetDetailUrl,
      renderToggle,
      renderItemContent,
      emptyHtml = "",
      menuPlacement = "up",
      rootClass = "",
      toggleClass = "",
    } = opts;

    if (!links.length) {
      return emptyHtml;
    }
    if (typeof renderToggle !== "function" || typeof renderItemContent !== "function") {
      return emptyHtml;
    }

    const esc = opts.escapeHtml || escapeHtml;
    const preferred = preferredLink ?? links[0] ?? null;
    const preferredLabel = getBlvLabel(preferred, 0);
    const placementClass =
      menuPlacement === "down" ? "dv2-blv-dropdown--menu-down" : "dv2-blv-dropdown--menu-up";

    const itemsHtml = links
      .map((link, index) => {
        const label = getBlvLabel(link, index);
        const href = getDetailUrl(matchId, link);
        return `
          <li class="dv2-blv-dropdown__item">
            <a href="${esc(href)}" class="dv2-blv-dropdown__link">
              ${renderItemContent({ link, label, href, index, esc })}
            </a>
          </li>
        `;
      })
      .join("");

    return `
      <div class="dv2-blv-dropdown ${placementClass}${rootClass ? ` ${rootClass}` : ""}">
        <button type="button" class="dv2-blv-dropdown__toggle${toggleClass ? ` ${toggleClass}` : ""}" aria-expanded="false" aria-haspopup="listbox">
          ${renderToggle({ link: preferred, label: preferredLabel, esc })}
          <span class="dv2-blv-dropdown__caret" aria-hidden="true"></span>
        </button>
        <ul class="dv2-blv-dropdown__menu" role="listbox">
          ${itemsHtml}
        </ul>
      </div>
    `;
  };

  /**
   * @param {jQuery} $container
   * @param {Object} options
   * @param {string} options.namespace - jQuery event namespace suffix
   * @param {boolean} [options.closeOnDocument]
   * @param {boolean} [options.documentCloseDelay] - defer close to next tick (vebo)
   * @param {boolean} [options.stopPropagationOnWrap] - stop clicks on dropdown wrapper (thapcam)
   * @param {boolean} [options.rebindDocumentClose] - off/on document handler each bind (socolive)
   */
  DV2BlvDropdown.bind = function bind($container, options) {
    const $ = window.jQuery || window.$;
    if (!$?.fn || !$container?.length) {
      return;
    }

    const {
      namespace = "dv2BlvDropdown",
      closeOnDocument = true,
      documentCloseDelay = false,
      stopPropagationOnWrap = false,
      rebindDocumentClose = false,
    } = options || {};

    function handleToggleClick(event, $dropdown) {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = $dropdown.hasClass("is-open");
      $container
        .find(".dv2-blv-dropdown.is-open")
        .not($dropdown)
        .removeClass("is-open")
        .find(".dv2-blv-dropdown__toggle")
        .attr("aria-expanded", "false");
      $dropdown
        .toggleClass("is-open", !isOpen)
        .find(".dv2-blv-dropdown__toggle")
        .attr("aria-expanded", !isOpen ? "true" : "false");
    }

    if (stopPropagationOnWrap) {
      // Direct bind: wrap stopPropagation blocks delegated handlers on $container.
      $container.find(".dv2-blv-dropdown").each(function () {
        const $dropdown = $(this);

        $dropdown
          .off(`click.${namespace}Wrap`)
          .on(`click.${namespace}Wrap`, function (event) {
            event.stopPropagation();
          });

        $dropdown
          .find(".dv2-blv-dropdown__toggle")
          .off(`click.${namespace}`)
          .on(`click.${namespace}`, function (event) {
            handleToggleClick(event, $dropdown);
          });

        $dropdown
          .find(".dv2-blv-dropdown__menu a")
          .off(`click.${namespace}Menu`)
          .on(`click.${namespace}Menu`, function (event) {
            event.stopPropagation();
          });
      });
    } else {
      $container
        .off(`click.${namespace}`, ".dv2-blv-dropdown__toggle")
        .on(`click.${namespace}`, ".dv2-blv-dropdown__toggle", function (event) {
          handleToggleClick(event, $(this).closest(".dv2-blv-dropdown"));
        });

      $container
        .off(`click.${namespace}Menu`, ".dv2-blv-dropdown__menu a")
        .on(`click.${namespace}Menu`, ".dv2-blv-dropdown__menu a", function (event) {
          event.stopPropagation();
        });
    }

    if (!closeOnDocument) {
      return;
    }

    const closeEventName = `click.${namespace}Close`;

    if (rebindDocumentClose) {
      $(document).off(closeEventName);
    } else if (documentCloseBound.has(closeEventName)) {
      return;
    }

    const closeHandler = function (event) {
      const run = () => {
        if ($(event.target).closest(".dv2-blv-dropdown").length) {
          return;
        }
        closeAllDropdowns($, $container);
      };
      if (documentCloseDelay) {
        window.setTimeout(run, 0);
      } else {
        run();
      }
    };

    $(document).on(closeEventName, closeHandler);
    if (!rebindDocumentClose) {
      documentCloseBound.add(closeEventName);
    }
  };
})(window.DV2BlvDropdown);

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* hot-leagues.js */
(function(window, $, jQuery, Hls, Swiper) {
/**
 * Shared hot leagues loader for DV2 streaming layouts.
 */
window.DV2HotLeagues = window.DV2HotLeagues || {};

(function (DV2HotLeagues) {
  const DEFAULT_ENDPOINT =
    "https://vsc-apidev.helizones.com/api/data/lives/competitions/hot";

  DV2HotLeagues.DEFAULT_ENDPOINT = DEFAULT_ENDPOINT;

  DV2HotLeagues.createRankMap = function createRankMap(result) {
    return new Map(
      (result || []).map((league, index) => [league.id, index]),
    );
  };

  DV2HotLeagues.load = function load(options) {
    const {
      url = DEFAULT_ENDPOINT,
      ajax = window.jQuery?.ajax || window.$?.ajax,
      setHotLeaguesRank,
      onSuccess,
      onError,
      method = "GET",
    } = options || {};

    if (!ajax) {
      console.error("[DV2HotLeagues] jQuery ajax is not available");
      if (onError) {
        onError({ message: "jQuery ajax is not available" });
      }
      return null;
    }

    return ajax({
      url,
      method,
      success: function (response) {
        const rankMap = DV2HotLeagues.createRankMap(response?.result);
        if (setHotLeaguesRank) {
          setHotLeaguesRank(rankMap);
        }
        if (onSuccess) {
          onSuccess(rankMap, response);
        }
      },
      error: function (xhr, status, error) {
        console.error("[DV2HotLeagues] Failed to load hot leagues:", error);
        if (onError) {
          onError({ xhr, status, error });
        }
      },
    });
  };
})(window.DV2HotLeagues);

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* list-ads.js */
(function(window, $, jQuery, Hls, Swiper) {
/**
 * Shared interleaved list ads helpers for DV2 streaming layouts.
 *
 * Ad blocks shape (from admin / window config):
 *   { desktopHtml, mobileHtml, renderAfterDesktop, renderAfterMobile, renderAfter? }
 *
 * Insertion rules:
 * - Cumulative positions by viewport renderAfter
 * - If remaining items < renderAfter, place ad at end of available items then stop
 * - Do not place further ads once items run out
 * - If totalItems is 0, show only the first valid ad block (position 0)
 */
window.DV2ListAds = window.DV2ListAds || {};

(function (DV2ListAds) {
  const DEFAULT_MOBILE_BREAKPOINT = 768;

  DV2ListAds.DEFAULT_MOBILE_BREAKPOINT = DEFAULT_MOBILE_BREAKPOINT;

  DV2ListAds.getBlocks = function getBlocks(source) {
    if (Array.isArray(source)) {
      return source;
    }
    if (typeof source === "string") {
      const value = window[source];
      return Array.isArray(value) ? value : [];
    }
    return [];
  };

  DV2ListAds.getMobileBreakpoint = function getMobileBreakpoint(value) {
    const resolved =
      value != null
        ? Number(value)
        : Number(window.DV2_SOCOLIVE_MATCH_LIST_ADS_MOBILE_BREAKPOINT);
    return Number.isFinite(resolved) && resolved > 0
      ? resolved
      : DEFAULT_MOBILE_BREAKPOINT;
  };

  DV2ListAds.isMobileViewport = function isMobileViewport(breakpoint) {
    const bp = DV2ListAds.getMobileBreakpoint(breakpoint);
    return typeof window.matchMedia === "function"
      ? window.matchMedia(`(max-width: ${bp}px)`).matches
      : window.innerWidth <= bp;
  };

  DV2ListAds.shouldRepeatCycle = function shouldRepeatCycle(value) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value === 1;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return normalized === "1" || normalized === "true" || normalized === "yes";
    }

    return false;
  };

  DV2ListAds.getRenderAfter = function getRenderAfter(adBlock, options) {
    const breakpoint = options?.breakpoint;
    const isMobile = DV2ListAds.isMobileViewport(breakpoint);
    const legacyRenderAfter = Number(adBlock?.renderAfter || 0);
    const renderAfterDesktop = Number(
      adBlock?.renderAfterDesktop || legacyRenderAfter || 0,
    );
    const renderAfterMobile = Number(
      adBlock?.renderAfterMobile || legacyRenderAfter || 0,
    );

    return isMobile ? renderAfterMobile : renderAfterDesktop;
  };

  DV2ListAds.getFirstValidBlock = function getFirstValidBlock(adBlocks, options) {
    const blocks = Array.isArray(adBlocks) ? adBlocks : [];

    for (const adBlock of blocks) {
      const renderAfter = DV2ListAds.getRenderAfter(adBlock, options);
      if (!renderAfter) {
        continue;
      }

      const desktopHtml = String(adBlock?.desktopHtml || "").trim();
      const mobileHtml = String(adBlock?.mobileHtml || "").trim();
      if (!desktopHtml && !mobileHtml) {
        continue;
      }

      return adBlock;
    }

    return null;
  };

  /**
   * @param {Array} adBlocks
   * @param {number} totalItems
   * @param {{ breakpoint?: number }} [options]
   * @returns {Map<number, object>}
   */
  DV2ListAds.buildInsertions = function buildInsertions(
    adBlocks,
    totalItems,
    options,
  ) {
    const insertions = new Map();
    const itemCount = Number(totalItems) || 0;
    const blocks = Array.isArray(adBlocks) ? adBlocks : [];
    const validBlocks = blocks.filter((adBlock) => {
      const renderAfter = DV2ListAds.getRenderAfter(adBlock, options);
      if (!renderAfter) {
        return false;
      }

      const desktopHtml = String(adBlock?.desktopHtml || "").trim();
      const mobileHtml = String(adBlock?.mobileHtml || "").trim();
      return Boolean(desktopHtml || mobileHtml);
    });
    const repeatCycle = DV2ListAds.shouldRepeatCycle(options?.repeatCycle);

    if (itemCount === 0) {
      const firstAd = DV2ListAds.getFirstValidBlock(validBlocks, options);
      if (firstAd) {
        insertions.set(0, firstAd);
      }
      return insertions;
    }

    if (!validBlocks.length) {
      return insertions;
    }

    let cumulativePosition = 0;

    if (repeatCycle) {
      let blockIndex = 0;
      while (cumulativePosition < itemCount) {
        const adBlock = validBlocks[blockIndex % validBlocks.length];
        const renderAfter = DV2ListAds.getRenderAfter(adBlock, options);
        const remaining = itemCount - cumulativePosition;
        const step = Math.min(renderAfter, remaining);
        cumulativePosition += step;
        insertions.set(cumulativePosition, adBlock);
        blockIndex += 1;
      }

      return insertions;
    }

    for (const adBlock of validBlocks) {
      const renderAfter = DV2ListAds.getRenderAfter(adBlock, options);
      const remaining = itemCount - cumulativePosition;
      if (remaining <= 0) {
        break;
      }

      const step = Math.min(renderAfter, remaining);
      cumulativePosition += step;
      insertions.set(cumulativePosition, adBlock);

      // Hết item trước khi đủ renderAfter → dừng, không hiện ads tiếp theo
      if (step < renderAfter) {
        break;
      }
    }

    return insertions;
  };

  /**
   * @param {object} adBlock
   * @param {{ wrapperTag?: string, wrapperClass?: string }} [options]
   * @returns {string}
   */
  DV2ListAds.buildMarkup = function buildMarkup(adBlock, options) {
    const desktopHtml = String(adBlock?.desktopHtml || "").trim();
    const mobileHtml = String(adBlock?.mobileHtml || "").trim();
    if (!desktopHtml && !mobileHtml) {
      return "";
    }

    const wrapperTag = options?.wrapperTag || "div";
    const wrapperClass = options?.wrapperClass || "dv2-list-ad";

    return `
      <${wrapperTag} class="${wrapperClass}">
        <div class="dv2-qc-match-list-pc">
          ${desktopHtml}
        </div>
        <div class="dv2-qc-match-list-mobile">
          ${mobileHtml}
        </div>
      </${wrapperTag}>
    `;
  };

  DV2ListAds.refreshReviveAds = function refreshReviveAds($container) {
    window.DV2_StreamChrome?.refreshReviveAds?.($container);
  };
})(window.DV2ListAds);

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* match-score-poll.js */
(function(window, $, jQuery, Hls, Swiper) {
/**
 * Shared live match score polling for DV2 streaming layouts.
 * Compare in-memory snapshot with API; update DOM only when score changes.
 */
window.DV2MatchScorePoll = window.DV2MatchScorePoll || {};

(function (DV2MatchScorePoll) {
  const DEFAULT_API_BASE =
    typeof API_URL !== "undefined"
      ? API_URL
      : "https://vsc-apidev.helizones.com/api/data/";

  DV2MatchScorePoll.DEFAULT_API_BASE = DEFAULT_API_BASE;

  DV2MatchScorePoll.getMatchId = function getMatchId(match) {
    return match?.match_id || match?.matchId || match?.id || match?.slug || "";
  };

  DV2MatchScorePoll.getScoreSnapshot = function getScoreSnapshot(match) {
    const score = match?.score?.fulltime || {};
    const pen = match?.score?.pen;
    const hasPen = !!pen && (pen.home != null || pen.away != null);
    return {
      home: score.home ?? 0,
      away: score.away ?? 0,
      currentMinute: match?.currentMinute ?? match?.currentMinutes ?? null,
      hasPen,
      penHome: hasPen ? pen.home ?? 0 : null,
      penAway: hasPen ? pen.away ?? 0 : null,
    };
  };

  function getDefaultIntervalMs() {
    return typeof window.DV2_HOME_MATCH_SCORE_POLL_INTERVAL_MS === "number"
      ? window.DV2_HOME_MATCH_SCORE_POLL_INTERVAL_MS
      : 30000;
  }

  function resolveContainer(container, $) {
    if (!container) return $(document);
    return typeof container === "string" ? $(container) : container;
  }

  DV2MatchScorePoll.create = function create(options) {
    const {
      ajax = window.jQuery?.ajax || window.$?.ajax,
      $: jq = window.jQuery || window.$,
      apiBase = DEFAULT_API_BASE,
      intervalMs = getDefaultIntervalMs(),
      container,
      onScoreChange,
    } = options || {};

    let timer = null;
    let snapshot = null;

    function applyDomUpdate(next) {
      const $scope = resolveContainer(container, jq);
      const $home = $scope.find("[data-dv2-score-home]");
      const $away = $scope.find("[data-dv2-score-away]");
      const $minute = $scope.find("[data-dv2-score-minute]");
      const $penHome = $scope.find("[data-dv2-score-pen-home]");
      const $penAway = $scope.find("[data-dv2-score-pen-away]");

      if ($home.length) {
        $home.text(next.home);
      }
      if ($away.length) {
        $away.text(next.away);
      }
      if (next.currentMinute != null && $minute.length) {
        $minute.text(`${next.currentMinute}'`);
      }
      if (next.hasPen) {
        if ($penHome.length) $penHome.text(next.penHome);
        if ($penAway.length) $penAway.text(next.penAway);
      }

      if (onScoreChange) {
        onScoreChange(next, snapshot);
      }
    }

    function sync(match) {
      const matchId = DV2MatchScorePoll.getMatchId(match);
      if (!matchId) return;

      snapshot = {
        matchId,
        ...DV2MatchScorePoll.getScoreSnapshot(match),
      };
    }

    function poll() {
      if (!snapshot?.matchId || !ajax) return;

      const base = String(apiBase).replace(/\/?$/, "/");
      ajax({
        url: `${base}lives/${snapshot.matchId}`,
        method: "GET",
        success(res) {
          if (!res?.data) return;

          const next = DV2MatchScorePoll.getScoreSnapshot(res.data);
          const changed =
            snapshot.home !== next.home ||
            snapshot.away !== next.away ||
            snapshot.currentMinute !== next.currentMinute ||
            snapshot.hasPen !== next.hasPen ||
            snapshot.penHome !== next.penHome ||
            snapshot.penAway !== next.penAway;

          if (!changed) return;

          snapshot = { ...snapshot, ...next };
          applyDomUpdate(snapshot);
        },
      });
    }

    function start() {
      stop();
      if (!snapshot?.matchId || !intervalMs || intervalMs <= 0) return;
      timer = setInterval(poll, intervalMs);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function destroy() {
      stop();
      snapshot = null;
    }

    return { sync, start, stop, destroy, poll };
  };
})(window.DV2MatchScorePoll);

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* match-sort.js */
(function(window, $, jQuery, Hls, Swiper) {
/**
 * Shared match sorting utilities for DV2 streaming layouts.
 *
 * Modes:
 * - priority-competition-first: PriorityCompetition -> Live -> Hot -> Kickoff
 * - live-first-priority-competition: Live -> PriorityCompetition -> Hot -> Kickoff
 * - priority-competition-when-live: Live -> PriorityCompetition (only when list has live) -> Hot -> Kickoff
 * - priority-competition-when-live-or-soon: PriorityCompetition starting within N minutes -> Live -> PriorityCompetition (when live exists) -> Hot -> Kickoff
 * - priority-competition-kickoff-only: PriorityCompetition -> Kickoff
 */
window.DV2MatchSort = window.DV2MatchSort || {};

(function (DV2MatchSort) {
  function resolveHotLeaguesRank(hotLeaguesRank) {
    if (typeof hotLeaguesRank === "function") {
      return hotLeaguesRank();
    }
    return hotLeaguesRank;
  }

  function getPriorityCompetitionIds() {
    const raw = window.DV2_STREAMING_PRIORITY_COMPETITION_IDS;
    if (!raw) {
      return [];
    }
    return String(raw)
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }

  DV2MatchSort.getPriorityCompetitionRank = function getPriorityCompetitionRank(
    match,
  ) {
    const ids = getPriorityCompetitionIds();
    const leagueId = match?.league?.id;
    if (!leagueId || !ids.length) {
      return Infinity;
    }
    const index = ids.indexOf(String(leagueId));
    return index === -1 ? Infinity : index;
  };

  DV2MatchSort.isPriorityCompetitionMatch =
    function isPriorityCompetitionMatch(match) {
      return DV2MatchSort.getPriorityCompetitionRank(match) !== Infinity;
    };

  DV2MatchSort.isLiveMatch = function isLiveMatch(match, liveStatuses) {
    if (!Array.isArray(liveStatuses) || !liveStatuses.length) {
      return false;
    }
    const status = String(
      match?.matchInfo?.status ?? match?.status ?? "",
    ).toLowerCase();
    return liveStatuses.includes(status);
  };

  DV2MatchSort.getMatchKickoffTime = function getMatchKickoffTime(match) {
    const kickoff = match?.matchInfo?.kickoff ?? match?.kickoff;
    const kickoffTime = new Date(kickoff);
    return Number.isNaN(kickoffTime.getTime()) ? null : kickoffTime;
  };

  DV2MatchSort.isPriorityCompetitionStartingSoon = function isPriorityCompetitionStartingSoon(
    match,
    liveStatuses,
    priorityCompetitionSoonMinutes = 10,
  ) {
    if (!DV2MatchSort.isPriorityCompetitionMatch(match)) {
      return false;
    }
    if (DV2MatchSort.isLiveMatch(match, liveStatuses)) {
      return false;
    }

    const kickoffTime = DV2MatchSort.getMatchKickoffTime(match);
    if (!kickoffTime) {
      return false;
    }

    const msUntilKickoff = kickoffTime.getTime() - Date.now();
    return (
      msUntilKickoff > 0 &&
      msUntilKickoff <= priorityCompetitionSoonMinutes * 60 * 1000
    );
  };

  DV2MatchSort.getHotLeagueRank = function getHotLeagueRank(match, hotLeaguesRank) {
    const rankMap = resolveHotLeaguesRank(hotLeaguesRank);
    if (!rankMap?.has?.(match?.league?.id)) {
      return Infinity;
    }
    return rankMap.get(match.league.id);
  };

  DV2MatchSort.compareKickoff = function compareKickoff(a, b) {
    const aKickoff = DV2MatchSort.getMatchKickoffTime(a);
    const bKickoff = DV2MatchSort.getMatchKickoffTime(b);
    if (!aKickoff && !bKickoff) return 0;
    if (!aKickoff) return 1;
    if (!bKickoff) return -1;
    return aKickoff.getTime() - bKickoff.getTime();
  };

  DV2MatchSort.compareMatches = function compareMatches(a, b, options) {
    const {
      mode = "priority-competition-first",
      liveStatuses = [],
      hotLeaguesRank = null,
      hasLiveMatches = false,
      priorityCompetitionSoonMinutes = 10,
      hasPriorityCompetitionIds = getPriorityCompetitionIds().length > 0,
    } = options || {};

    const comparePriorityCompetition = function comparePriorityCompetition() {
      if (!hasPriorityCompetitionIds) {
        return 0;
      }
      const aRank = DV2MatchSort.getPriorityCompetitionRank(a);
      const bRank = DV2MatchSort.getPriorityCompetitionRank(b);
      if (aRank !== bRank) {
        return aRank - bRank;
      }
      return 0;
    };

    const compareLive = function compareLive() {
      const aIsLive = DV2MatchSort.isLiveMatch(a, liveStatuses);
      const bIsLive = DV2MatchSort.isLiveMatch(b, liveStatuses);
      if (aIsLive !== bIsLive) {
        return aIsLive ? -1 : 1;
      }
      return 0;
    };

    const compareHot = function compareHot() {
      const rankA = DV2MatchSort.getHotLeagueRank(a, hotLeaguesRank);
      const rankB = DV2MatchSort.getHotLeagueRank(b, hotLeaguesRank);
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return 0;
    };

    if (mode === "priority-competition-kickoff-only") {
      if (hasPriorityCompetitionIds) {
        const priorityCompetitionResult = comparePriorityCompetition();
        if (priorityCompetitionResult !== 0) return priorityCompetitionResult;
      }
      return DV2MatchSort.compareKickoff(a, b);
    }

    if (mode === "priority-competition-first") {
      if (hasPriorityCompetitionIds) {
        const priorityCompetitionResult = comparePriorityCompetition();
        if (priorityCompetitionResult !== 0) return priorityCompetitionResult;
      }

      const liveResult = compareLive();
      if (liveResult !== 0) return liveResult;

      const hotResult = compareHot();
      if (hotResult !== 0) return hotResult;

      return DV2MatchSort.compareKickoff(a, b);
    }

    if (mode === "live-first-priority-competition") {
      const liveResult = compareLive();
      if (liveResult !== 0) return liveResult;

      if (hasPriorityCompetitionIds) {
        const priorityCompetitionResult = comparePriorityCompetition();
        if (priorityCompetitionResult !== 0) return priorityCompetitionResult;
      }

      const hotResult = compareHot();
      if (hotResult !== 0) return hotResult;

      return DV2MatchSort.compareKickoff(a, b);
    }

    if (mode === "priority-competition-when-live-or-soon") {
      if (hasPriorityCompetitionIds) {
        const aPriorityCompetitionSoon =
          DV2MatchSort.isPriorityCompetitionStartingSoon(
            a,
            liveStatuses,
            priorityCompetitionSoonMinutes,
          );
        const bPriorityCompetitionSoon =
          DV2MatchSort.isPriorityCompetitionStartingSoon(
            b,
            liveStatuses,
            priorityCompetitionSoonMinutes,
          );
        if (aPriorityCompetitionSoon !== bPriorityCompetitionSoon) {
          return aPriorityCompetitionSoon ? -1 : 1;
        }
      }

      const liveResult = compareLive();
      if (liveResult !== 0) return liveResult;

      if (hasPriorityCompetitionIds && hasLiveMatches) {
        const priorityCompetitionResult = comparePriorityCompetition();
        if (priorityCompetitionResult !== 0) return priorityCompetitionResult;
      }

      const hotResult = compareHot();
      if (hotResult !== 0) return hotResult;

      return DV2MatchSort.compareKickoff(a, b);
    }

    if (mode === "priority-competition-when-live") {
      const liveResult = compareLive();
      if (liveResult !== 0) return liveResult;

      if (hasPriorityCompetitionIds && hasLiveMatches) {
        const priorityCompetitionResult = comparePriorityCompetition();
        if (priorityCompetitionResult !== 0) return priorityCompetitionResult;
      }

      const hotResult = compareHot();
      if (hotResult !== 0) return hotResult;

      return DV2MatchSort.compareKickoff(a, b);
    }

    return DV2MatchSort.compareKickoff(a, b);
  };

  DV2MatchSort.createSortedMatchesFunction = function createSortedMatchesFunction(
    options,
  ) {
    return function sortedMatchesFunction(matches) {
      if (!Array.isArray(matches)) {
        return [];
      }

      const sortOptions = {
        ...(options || {}),
        hasLiveMatches: matches.some((match) =>
          DV2MatchSort.isLiveMatch(match, options?.liveStatuses),
        ),
        hasPriorityCompetitionIds: getPriorityCompetitionIds().length > 0,
      };

      if (options?.copy) {
        return matches
          .slice()
          .sort((a, b) => DV2MatchSort.compareMatches(a, b, sortOptions));
      }

      return matches.sort((a, b) =>
        DV2MatchSort.compareMatches(a, b, sortOptions),
      );
    };
  };
})(window.DV2MatchSort);

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* stream-chrome.js */
(function(window, $, jQuery, Hls, Swiper) {
/**
 * Shared stream player chrome: ads overlay, custom controls, fullscreen.
 * Used by vebo-v2, cakhia-v2, and future stream-detail layouts.
 */
const DV2_STREAM_CONTROLS_HIDE_MS = 2600;
const DV2_ODDS_POLL_MS = 15000;
const DV2_ODDS_AUTO_SHOW_INTERVAL_MS = 180000; // 3 minutes
const DV2_ODDS_AUTO_SHOW_DURATION_MS = 10000; // 10 seconds
const DV2_FOOTER_HEAD_PEEK_INTERVAL_MS = 30000; // 30 seconds between peeks
const DV2_FOOTER_HEAD_PEEK_VISIBLE_MS = 10000; // 10 seconds visible each peek

const DV2_ODDS_SVG = {
    toggleClose:
        '<svg class="dv2-stream-odds-panel__toggle-icon--close" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g filter="url(#dv2_odds_filter_close)"><path d="M18.3063 41.9042L10.4543 53.8015C8.88006 56.1882 11.6954 58.9857 14.3331 57.6572L56.4611 36.4132C58.513 35.3784 58.513 32.6199 56.4611 31.5851L14.3331 10.3438C11.6954 9.01263 8.88006 11.8127 10.4543 14.1995L18.3063 26.0967C21.5021 30.9404 21.5021 37.0606 18.3063 41.9042Z" fill="#F7FF00"></path></g><defs><filter id="dv2_odds_filter_close" x="0" y="0" width="72" height="72" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix><feOffset dx="2" dy="2"></feOffset><feGaussianBlur stdDeviation="6"></feGaussianBlur><feComposite in2="hardAlpha" operator="out"></feComposite><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.933333 0 0 0 0 0 0 0 0 0.35 0"></feColorMatrix><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"></feBlend><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"></feBlend></filter></defs></svg>',
    toggleOpen:
        '<svg class="dv2-stream-odds-panel__toggle-icon--open" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g filter="url(#dv2_odds_filter_open)"><path d="M49.6937 41.9042L57.5457 53.8015C59.1199 56.1882 56.3046 58.9857 53.6669 57.6572L11.5389 36.4132C9.48704 35.3784 9.48704 32.6199 11.5389 31.5851L53.6669 10.3438C56.3046 9.01263 59.1199 11.8127 57.5457 14.1995L49.6937 26.0967C46.4979 30.9404 46.4979 37.0606 49.6937 41.9042Z" fill="#F7FF00"></path></g><defs><filter id="dv2_odds_filter_open" x="0" y="0" width="72" height="72" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix><feOffset dx="2" dy="2"></feOffset><feGaussianBlur stdDeviation="6"></feGaussianBlur><feComposite in2="hardAlpha" operator="out"></feComposite><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.933333 0 0 0 0 0 0 0 0 0.35 0"></feColorMatrix><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"></feBlend><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"></feBlend></filter></defs></svg>',
    trendUp:
        '<svg width="6" height="6" viewBox="0 0 9 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3.69976 0.258553L0.0659156 6.7166C-0.124386 7.0548 0.120008 7.47275 0.508076 7.47275H7.77577C8.16384 7.47275 8.40823 7.0548 8.21793 6.7166L4.58408 0.258553C4.3901 -0.0861874 3.89374 -0.0861869 3.69976 0.258553Z" fill="#469631"></path></svg>',
    trendDown:
        '<svg width="6" height="6" viewBox="0 0 9 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3.6984 7.21387L0.0658934 0.756087C-0.124346 0.417884 0.120053 0 0.508089 0H7.7731C8.16114 0 8.40553 0.417885 8.21529 0.756088L4.58279 7.21387C4.38883 7.5587 3.89236 7.5587 3.6984 7.21387Z" fill="#F94A4A"></path></svg>',
    corner:
        '<svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1.25762 14.4734L11.7539 7.51758M7.71808 10.0793C7.71808 10.0793 11.7548 11.1782 11.3506 14.4734M0.451172 14.4734H13.7735" stroke="#2DB10B" stroke-width="1.33224"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M1.49032 2.39258V14.5972H0.451172V2.39342H1.49032V2.39258Z" fill="#2DB10B"></path><path d="M0.451172 5.68755H9.33275L0.451172 0.5625V5.68755Z" fill="#2DB10B"></path></svg>',
    yellowCard:
        '<svg width="7" height="10" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="10" height="16" rx="2" fill="#F7FF00"></rect></svg>',
    redCard:
        '<svg width="7" height="10" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="10" height="16" rx="2" fill="#F94A4A"></rect></svg>',
};

const DV2_STREAM_CONTROLS_HTML = `<div class="dv2-stream-controls dv2-stream-controls--paused dv2-stream-controls--muted" role="toolbar" aria-label="Điều khiển phát video">
<button type="button" class="dv2-stream-controls__play" aria-label="Phát" title="Phát">
<svg class="dv2-stream-controls__icon-play" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11l9-5.5-9-5.5z"/></svg>
<svg class="dv2-stream-controls__icon-pause" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2h3v12H4V2zm5 0h3v12H9V2z"/></svg>
</button>
<div class="dv2-stream-controls__volume">
<button type="button" class="dv2-stream-controls__mute" aria-label="Bật tiếng" title="Âm lượng">
<svg class="dv2-stream-controls__icon-vol-on" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M7 2.5v11L3.5 11H1V5h2.5L7 2.5zm5.2 1.8a5 5 0 010 7.4M9.5 4.5a3.5 3.5 0 010 7"/></svg>
<svg class="dv2-stream-controls__icon-vol-off" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M7 2.5v11L3.5 11H1V5h2.5L7 2.5zm7.8 2.3l-1.1 1.1L11.6 6l2.1 2.1-1.1 1.1L10.5 7.1 8.4 9.2l-1.1-1.1L9.4 6 7.3 3.9l1.1-1.1L9.5 4.9l2.1-2.1 1.1 1.1L11.6 6l2.1-2.1z"/></svg>
</button>
<input type="range" class="dv2-stream-volume" min="0" max="1" step="0.05" value="0" aria-label="Mức âm lượng">
</div>
<button type="button" class="dv2-stream-fs-btn" aria-label="Toàn màn hình" title="Toàn màn hình">
<svg class="dv2-stream-fs-btn__expand" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3 12h10V4H3v8zm2-6h6v4H5V6zM2 6H1V2.5l.5-.5H5v1H2v3zm13-3.5V6h-1V3h-3V2h3.5l.5.5zM14 10h1v3.5l-.5.5H11v-1h3v-3zM2 13h3v1H1.5l-.5-.5V10h1v3z"/></svg>
<svg class="dv2-stream-fs-btn__shrink" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.5 4H1V3h2V1h1v2.5l-.5.5zM13 3V1h-1v2.5l.5.5H15V3h-2zm-1 9.5V15h1v-2h2v-1h-2.5l-.5.5zM1 12v1h2v2h1v-2.5l-.5-.5H1zm11-1.5l-.5.5h-7l-.5-.5v-5l.5-.5h7l.5.5v5zM10 7H6v2h4V7z"/></svg>
</button>
</div>`;

function dv2GetFullscreenElement() {
    return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        null
    );
}

function dv2RequestElementFullscreen(el) {
    if (!el) return Promise.reject();
    const req =
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.mozRequestFullScreen ||
        el.msRequestFullscreen;
    if (!req) return Promise.reject();
    return Promise.resolve(req.call(el));
}

function dv2ExitDocumentFullscreen() {
    const exit =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;
    if (!exit) return Promise.resolve();
    return Promise.resolve(exit.call(document));
}

function dv2GetStreamChromeEl($videoContainer) {
    if (!$videoContainer?.length) return $();
    const $direct = $videoContainer.children(".dv2-stream-chrome");
    if ($direct.length) return $direct;
    return $videoContainer
        .find("> .dv2-video-container > .dv2-stream-chrome, > .dv2-video-stage > .dv2-stream-chrome")
        .first();
}

function dv2ApplyStreamVideoControls($video) {
    if (!$video?.length) return;
    $video.prop("controls", false);
    $video.removeAttr("controlsList");
    $video.attr("playsinline", "");
    $video.attr("webkit-playsinline", "");
}

function dv2MarkStreamVolumeTouched(video) {
    if (video) {
        video.dataset.dv2VolumeTouched = "1";
    }
}

function dv2ApplyStreamAutoplayMuted($video) {
    if (!$video?.length) return;
    const video = $video[0];
    if (!video || video.dataset.dv2VolumeTouched === "1") return;
    video.muted = true;
}

function dv2IsStreamVideoMuted(video) {
    return !!(video && (video.muted || video.volume === 0));
}

function dv2GetVideoStageEl($videoContainer) {
    if (!$videoContainer?.length) return $();
    return $videoContainer.children(".dv2-video-container, .dv2-video-stage").first();
}

function dv2GetContainedVideoBounds(video, containerRect) {
    if (!video || !containerRect?.width || !containerRect?.height) return null;

    const intrinsicW = video.videoWidth;
    const intrinsicH = video.videoHeight;
    if (!intrinsicW || !intrinsicH) return null;

    const containerRatio = containerRect.width / containerRect.height;
    const videoRatio = intrinsicW / intrinsicH;
    let width;
    let height;
    let left;
    let top;

    if (videoRatio > containerRatio) {
        width = containerRect.width;
        height = containerRect.width / videoRatio;
        left = 0;
        top = (containerRect.height - height) / 2;
    } else {
        height = containerRect.height;
        width = containerRect.height * videoRatio;
        top = 0;
        left = (containerRect.width - width) / 2;
    }

    return { top, left, width, height };
}

function dv2EnsureVideoStage($videoContainer) {
    if (!$videoContainer?.length) return $();

    const $chrome = dv2GetStreamChromeEl($videoContainer);
    const $media = $videoContainer.children("video, #stream-player").first();
    let $stage = dv2GetVideoStageEl($videoContainer);

    if (!$stage.length && $media.length) {
        $stage = $('<div class="dv2-video-stage"></div>');
        $media.before($stage);
        $stage.append($media);
    }

    if (!$stage.length) return $();

    if ($chrome.length && !$chrome.parent().is($stage)) {
        $stage.prepend($chrome);
    }

    $videoContainer.children(".dv2-stream-controls").each(function () {
        if (!$.contains($stage[0], this)) {
            $stage.append(this);
        }
    });

    $videoContainer
        .children(".dv2-stream-loading, .dv2-loading, .dv2-not-loaded")
        .each(function () {
            $(this).appendTo($stage);
        });

    return $stage;
}

function dv2SyncVideoStageLayout($videoContainer) {
    if (!$videoContainer?.length) return;

    const $stage = dv2EnsureVideoStage($videoContainer);
    if (!$stage.length) return;

    const $video = $stage.find("video").first();
    const video = $video[0];
    const container = $videoContainer[0];

    if (!video || !container) {
        $stage.removeClass("dv2-video-stage--bounded").css({
            top: "",
            left: "",
            width: "",
            height: "",
        });
        return;
    }

    const needsBounds = dv2IsStreamWrapperFullscreen($videoContainer);

    if (!needsBounds) {
        $stage.removeClass("dv2-video-stage--bounded").css({
            top: "",
            left: "",
            width: "",
            height: "",
        });
        return;
    }

    const containerRect = container.getBoundingClientRect();
    const bounds = dv2GetContainedVideoBounds(video, containerRect);

    if (!bounds?.width || !bounds?.height) {
        return;
    }

    $stage
        .addClass("dv2-video-stage--bounded")
        .css({
            top: bounds.top + "px",
            left: bounds.left + "px",
            width: bounds.width + "px",
            height: bounds.height + "px",
        });
}

function dv2ScheduleVideoStageLayoutSync($videoContainer) {
    if (!$videoContainer?.length) return;

    if ($videoContainer.data("dv2VideoStageSyncRaf")) return;

    const rafId = requestAnimationFrame(() => {
        $videoContainer.removeData("dv2VideoStageSyncRaf");
        dv2SyncVideoStageLayout($videoContainer);
    });

    $videoContainer.data("dv2VideoStageSyncRaf", rafId);
}

function dv2InitVideoStageSync($videoContainer) {
    if (!$videoContainer?.length || $videoContainer.data("dv2VideoStageSyncBound")) return;
    $videoContainer.data("dv2VideoStageSyncBound", true);

    const scheduleSync = () => dv2ScheduleVideoStageLayoutSync($videoContainer);

    scheduleSync();

    $videoContainer.on(
        "loadedmetadata.dv2StageSync loadeddata.dv2StageSync resize.dv2StageSync",
        "video",
        scheduleSync
    );

    if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(scheduleSync);
        observer.observe($videoContainer[0]);
        const video = $videoContainer.find("video").first()[0];
        if (video) observer.observe(video);
        $videoContainer.data("dv2VideoStageResizeObserver", observer);
    }

    $(window).on("resize.dv2StageSync orientationchange.dv2StageSync", scheduleSync);
    $videoContainer.on("dv2wrapperfschange.dv2StageSync", scheduleSync);
    $(document).on(
        "fullscreenchange.dv2StageSync webkitfullscreenchange.dv2StageSync",
        scheduleSync
    );
}

function dv2GetStreamControlsMount($videoContainer) {
    if (!$videoContainer?.length) return $videoContainer;
    const $stage = dv2EnsureVideoStage($videoContainer);
    if ($stage.length) return $stage;
    return $videoContainer;
}

function dv2GetOverlayMount($videoContainer) {
    const $stage = dv2EnsureVideoStage($videoContainer);
    return $stage.length ? $stage : $videoContainer;
}

function dv2EnsureStreamControlsBar($videoContainer) {
    if (!$videoContainer?.length) return;
    const $video = $videoContainer.find("video").first();
    if ($videoContainer.find(".dv2-stream-controls").length) {
        dv2SyncStreamControlsState($videoContainer, $video);
        return;
    }
    $videoContainer.children(".dv2-stream-fs-btn").remove();
    dv2GetStreamControlsMount($videoContainer).append(DV2_STREAM_CONTROLS_HTML);
    dv2SyncStreamControlsState($videoContainer, $video);
}

function dv2SyncStreamControlsState($videoContainer, $video) {
    if (!$videoContainer?.length) return;
    $video = $video || $videoContainer.find("video").first();
    const video = $video?.[0];
    const $bar = $videoContainer.find(".dv2-stream-controls");
    if (!video || !$bar.length) return;

    const isPaused = video.paused;
    const isMuted = dv2IsStreamVideoMuted(video);
    const displayVol = isMuted ? 0 : video.volume;

    $bar.toggleClass("dv2-stream-controls--paused", isPaused);
    $bar.toggleClass("dv2-stream-controls--muted", isMuted);

    const $playBtn = $bar.find(".dv2-stream-controls__play");
    const playLabel = isPaused ? "Phát" : "Tạm dừng";
    $playBtn.attr({ "aria-label": playLabel, title: playLabel });

    const $muteBtn = $bar.find(".dv2-stream-controls__mute");
    const muteLabel = isMuted ? "Bật tiếng" : "Tắt tiếng";
    $muteBtn.attr({ "aria-label": muteLabel, title: muteLabel });

    $bar.find(".dv2-stream-volume").val(displayVol);
}

function dv2IsNativeWrapperFullscreen($videoContainer) {
    const container = $videoContainer?.[0];
    if (!container) return false;
    return dv2GetFullscreenElement() === container;
}

function dv2IsCssWrapperFullscreen($videoContainer) {
    return !!$videoContainer?.data("cssWrapperFs");
}

function dv2IsStreamWrapperFullscreen($videoContainer) {
    return (
        dv2IsNativeWrapperFullscreen($videoContainer) ||
        dv2IsCssWrapperFullscreen($videoContainer)
    );
}

function dv2SupportsWrapperFullscreenApi() {
    const el = document.createElement("div");
    return !!(
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.mozRequestFullScreen ||
        el.msRequestFullscreen
    );
}

function dv2ShouldPreferCssWrapperFullscreen() {
    return (
        /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
}

function dv2SyncStreamWrapperFullscreenUi($videoContainer) {
    if (!$videoContainer?.length) return;
    const isFs = dv2IsStreamWrapperFullscreen($videoContainer);

    $videoContainer.toggleClass("dv2-stream-wrapper-fs", isFs);

    const $fsBtn = $videoContainer.find(".dv2-stream-fs-btn");
    if ($fsBtn.length) {
        const fsLabel = isFs ? "Thu nhỏ" : "Toàn màn hình";
        $fsBtn.attr({ "aria-label": fsLabel, title: fsLabel });
    }
}

function dv2MountCssFullscreenPortal($videoContainer) {
    if (!$videoContainer?.length || $videoContainer.hasClass("dv2-fs-portal")) return;

    const $placeholder = $('<div class="dv2-fs-placeholder" aria-hidden="true"></div>');
    const height = $videoContainer.outerHeight();
    if (height > 0) {
        $placeholder.height(height);
    }

    $videoContainer.data("dv2FsPortalParent", $videoContainer.parent());
    $placeholder.insertBefore($videoContainer);
    $videoContainer.data("dv2FsPortalPlaceholder", $placeholder);
    $videoContainer.addClass("dv2-fs-portal");
    $("body").append($videoContainer);
}

function dv2RestoreCssFullscreenPortal($videoContainer) {
    if (!$videoContainer?.length || !$videoContainer.hasClass("dv2-fs-portal")) return;

    const $placeholder = $videoContainer.data("dv2FsPortalPlaceholder");
    const $originalParent = $videoContainer.data("dv2FsPortalParent");

    $videoContainer.removeClass("dv2-fs-portal");
    if ($placeholder?.length) {
        $videoContainer.insertBefore($placeholder);
        $placeholder.remove();
    } else if ($originalParent?.length) {
        $originalParent.append($videoContainer);
    }

    $videoContainer.removeData("dv2FsPortalPlaceholder");
    $videoContainer.removeData("dv2FsPortalParent");
}

function dv2SyncCssFullscreenPortal($videoContainer) {
    if (!$videoContainer?.length) return;
    if (dv2IsCssWrapperFullscreen($videoContainer)) {
        dv2MountCssFullscreenPortal($videoContainer);
        return;
    }
    dv2RestoreCssFullscreenPortal($videoContainer);
}

function dv2InitCssFullscreenPortal($videoContainer) {
    if (!$videoContainer?.length || $videoContainer.data("dv2FsPortalBound")) return;
    $videoContainer.data("dv2FsPortalBound", true);

    $videoContainer.on("dv2wrapperfschange.dv2FsPortal", function () {
        dv2SyncCssFullscreenPortal($videoContainer);
    });

    $(document).on(
        "fullscreenchange.dv2FsPortal webkitfullscreenchange.dv2FsPortal",
        function () {
            dv2SyncCssFullscreenPortal($videoContainer);
        }
    );

    $(window).on("pagehide.dv2FsPortal", function () {
        dv2RestoreCssFullscreenPortal($videoContainer);
    });
}

function dv2EnterCssWrapperFullscreen($videoContainer) {
    $videoContainer.data("cssWrapperFs", true);
    $("body").addClass("dv2-stream-body-fs");
    dv2SyncStreamWrapperFullscreenUi($videoContainer);
    $videoContainer.trigger("dv2wrapperfschange");
}

function dv2ExitCssWrapperFullscreen($videoContainer) {
    $videoContainer.data("cssWrapperFs", false);
    dv2RestoreCssFullscreenPortal($videoContainer);
    const hasOtherCssFs = $(".dv2-video-wrapper")
        .toArray()
        .some((el) => $(el).data("cssWrapperFs"));
    if (!hasOtherCssFs) {
        $("body").removeClass("dv2-stream-body-fs");
    }
    dv2SyncStreamWrapperFullscreenUi($videoContainer);
    $videoContainer.trigger("dv2wrapperfschange");
}

function dv2ExitStreamWrapperFullscreen($videoContainer) {
    if (dv2IsNativeWrapperFullscreen($videoContainer)) {
        dv2ExitDocumentFullscreen();
    }
    if (dv2IsCssWrapperFullscreen($videoContainer)) {
        dv2ExitCssWrapperFullscreen($videoContainer);
    }
}

function dv2ToggleWrapperFullscreen($videoContainer) {
    const container = $videoContainer[0];
    if (!container) return;

    if (dv2IsStreamWrapperFullscreen($videoContainer)) {
        dv2ExitStreamWrapperFullscreen($videoContainer);
        return;
    }

    if (dv2ShouldPreferCssWrapperFullscreen()) {
        dv2EnterCssWrapperFullscreen($videoContainer);
        return;
    }

    if (!dv2SupportsWrapperFullscreenApi()) {
        dv2EnterCssWrapperFullscreen($videoContainer);
        return;
    }

    dv2RequestElementFullscreen(container)
        .then(() => {
            if (dv2GetFullscreenElement() !== container) {
                dv2EnterCssWrapperFullscreen($videoContainer);
                return;
            }
            dv2SyncStreamWrapperFullscreenUi($videoContainer);
            $videoContainer.trigger("dv2wrapperfschange");
        })
        .catch(() => {
            dv2EnterCssWrapperFullscreen($videoContainer);
        });
}

function dv2RefreshStreamChromeReviveAds($root) {
    const $scope =
        $root && typeof $root.find === "function" && $root.length
            ? $root
            : typeof $root === "string"
              ? $($root)
              : $(document);

    const reviveIds = new Set();
    $scope.find("ins[data-revive-id]").each(function () {
        const reviveId = this.getAttribute("data-revive-id");
        if (!reviveId) return;

        const zone =
            this.getAttribute("data-z") ||
            this.getAttribute("data-revive-zoneid") ||
            this.getAttribute("data-ad-slot");
        const fresh = document.createElement("ins");
        fresh.setAttribute("data-revive-id", reviveId);
        if (zone) {
            fresh.setAttribute("data-z", zone);
        }
        fresh.style.textDecoration = "none";
        this.replaceWith(fresh);
        reviveIds.add(reviveId);
    });

    if (!reviveIds.size) return;

    const runRefresh = () => {
        const reviveAsync = window.reviveAsync;
        if (!reviveAsync) return false;

        let applied = false;
        reviveIds.forEach((reviveId) => {
            const client = reviveAsync[reviveId];
            if (!client) return;
            if (typeof client.apply === "function" && typeof client.detect === "function") {
                client.apply(client.detect());
                applied = true;
                return;
            }
            if (typeof client.refresh === "function") {
                client.refresh();
                applied = true;
            }
        });
        return applied;
    };

    if (runRefresh()) return;

    let attempts = 0;
    const timer = setInterval(() => {
        attempts += 1;
        if (runRefresh() || attempts >= 20) {
            clearInterval(timer);
        }
    }, 250);
}

function dv2UpdateStreamChromeVisibility($videoContainer) {
    if (!$videoContainer?.length) return;

    const isActive = $videoContainer.hasClass("dv2-full-stream-active");
    const $chrome = dv2GetStreamChromeEl($videoContainer);

    $chrome.attr("aria-hidden", isActive ? "false" : "true");
}

function dv2SetFullStreamChromeVisible($videoContainer, visible) {
    if (!$videoContainer?.length) return;
    $videoContainer.toggleClass("dv2-full-stream-active", !!visible);
    if (visible) {
        dv2RefreshStreamChromeReviveAds();
    }
    dv2UpdateStreamChromeVisibility($videoContainer);
}

function dv2SyncStreamChromeVisibility($videoContainer) {
    if (!$videoContainer?.length) return;
    const hlsReady = !!$videoContainer.data("hlsReady");
    dv2SetFullStreamChromeVisible($videoContainer, hlsReady);
}

function dv2OnHlsStreamReady($videoContainer) {
    if (!$videoContainer?.length) return;
    $videoContainer.data("hlsReady", true);
    dv2SyncStreamChromeVisibility($videoContainer);
    dv2InitStreamOddsPanel($videoContainer, $videoContainer.data("dv2OddsMatchData"));
    const state = $videoContainer.data("dv2OddsPanelState");
    if (!state?.$panel?.length) return;
    if (!state.hasShownFirstAuto) {
        dv2MaybeShowFirstStreamOddsAuto($videoContainer);
    } else if (!state.$panel.hasClass("dv2-stream-odds-panel--open")) {
        dv2ShowStreamOddsAuto($videoContainer);
    }
}

function dv2ClearFullStreamChrome($videoContainer) {
    if (!$videoContainer?.length) return;
    dv2StopFooterHeadPeek($videoContainer);
    $videoContainer.data("hlsReady", false);
    dv2SetFullStreamChromeVisible($videoContainer, false);
    const oddsState = $videoContainer.data("dv2OddsPanelState");
    if (oddsState?.$panel?.length) {
        if (oddsState.autoHideTimer) {
            clearTimeout(oddsState.autoHideTimer);
            oddsState.autoHideTimer = null;
        }
        dv2SetStreamOddsPanelOpen(oddsState.$panel, false);
    }
    dv2ExitStreamWrapperFullscreen($videoContainer);
}

function dv2InitStreamPlayerUi($videoContainer, $video) {
    if (!$videoContainer?.length) return;
    $video = $video || $videoContainer.find("video").first();
    if ($video?.length) {
        dv2ApplyStreamVideoControls($video);
        dv2ApplyStreamAutoplayMuted($video);
    }
    dv2EnsureVideoStage($videoContainer);
    dv2EnsureStreamControlsBar($videoContainer);
    dv2BindStreamChromeEvents($videoContainer);
    dv2InitVideoStageSync($videoContainer);
    dv2SyncStreamControlsState($videoContainer, $video);
    dv2SyncVideoStageLayout($videoContainer);
}

function dv2EnsureFooterHeadPeekEl($videoContainer) {
    const $chrome = dv2GetStreamChromeEl($videoContainer);
    let $peek = $chrome.children(".dv2-stream-chrome-ft-head-peek");
    if ($peek.length) return $peek;

    const $head = $chrome.find(".dv2-stream-chrome-footer .dv2-stream-chrome-ft-head").first();
    if (!$head.length) return null;

    $peek = $('<div class="dv2-stream-chrome-ft-head-peek" aria-hidden="true"></div>');
    $peek.append($head.clone(false));
    $peek.find("[id]").removeAttr("id");
    $chrome.append($peek);
    return $peek;
}

function dv2StopFooterHeadPeek($videoContainer) {
    const state = $videoContainer.data("dv2FooterHeadPeekState");
    if (!state) return;

    if (state.intervalTimer) {
        clearTimeout(state.intervalTimer);
    }
    if (state.hideTimer) {
        clearTimeout(state.hideTimer);
    }

    state.$peek?.removeClass("dv2-stream-chrome-ft-head-peek--visible").attr("aria-hidden", "true");
    $videoContainer.removeData("dv2FooterHeadPeekState");
}

function dv2HideFooterHeadPeek($videoContainer) {
    const state = $videoContainer.data("dv2FooterHeadPeekState");
    if (!state?.$peek?.length) return;
    state.$peek.removeClass("dv2-stream-chrome-ft-head-peek--visible").attr("aria-hidden", "true");
}

function dv2ScheduleFooterHeadPeek($videoContainer) {
    const state = $videoContainer.data("dv2FooterHeadPeekState");
    if (!state) return;

    if (state.intervalTimer) {
        clearTimeout(state.intervalTimer);
    }

    state.intervalTimer = setTimeout(() => {
        dv2ShowFooterHeadPeek($videoContainer);
    }, DV2_FOOTER_HEAD_PEEK_INTERVAL_MS);
}

function dv2ShowFooterHeadPeek($videoContainer) {
    const state = $videoContainer.data("dv2FooterHeadPeekState");
    if (!state?.$peek?.length) return;
    if (!$videoContainer.hasClass("dv2-stream-chrome-footer-closed")) return;
    if (!$videoContainer.hasClass("dv2-full-stream-active")) return;

    state.$peek.addClass("dv2-stream-chrome-ft-head-peek--visible").attr("aria-hidden", "false");

    if (state.hideTimer) {
        clearTimeout(state.hideTimer);
    }

    state.hideTimer = setTimeout(() => {
        dv2HideFooterHeadPeek($videoContainer);
        dv2ScheduleFooterHeadPeek($videoContainer);
    }, DV2_FOOTER_HEAD_PEEK_VISIBLE_MS);
}

function dv2StartFooterHeadPeek($videoContainer) {
    dv2StopFooterHeadPeek($videoContainer);

    const $peek = dv2EnsureFooterHeadPeekEl($videoContainer);
    if (!$peek?.length) return;

    $videoContainer.data("dv2FooterHeadPeekState", {
        $peek,
        intervalTimer: null,
        hideTimer: null,
    });

    dv2ScheduleFooterHeadPeek($videoContainer);
}

function dv2BindStreamChromeEvents($videoContainer) {
    if ($videoContainer.data("streamChromeBound")) return;
    $videoContainer.data("streamChromeBound", true);
    dv2InitCssFullscreenPortal($videoContainer);

    const closeStreamChromeFooter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        $videoContainer.addClass("dv2-stream-chrome-footer-closed");
        dv2GetStreamChromeEl($videoContainer).addClass("dv2-stream-chrome-footer-closed");
        dv2UpdateStreamChromeVisibility($videoContainer);
        dv2StartFooterHeadPeek($videoContainer);
    };

    const closeStreamChromeRight = (e) => {
        e.preventDefault();
        e.stopPropagation();
        $videoContainer.addClass("dv2-stream-chrome-right-closed");
        dv2GetStreamChromeEl($videoContainer).addClass("dv2-stream-chrome-right-closed");
        dv2UpdateStreamChromeVisibility($videoContainer);
    };

    $videoContainer.on("click", ".dv2-stream-chrome-footer .dv2-stream-chrome-close", closeStreamChromeFooter);
    $videoContainer.on("click", ".dv2-stream-chrome-right .dv2-stream-chrome-close", closeStreamChromeRight);

    $videoContainer.on("click", ".dv2-stream-fs-btn", function (e) {
        e.preventDefault();
        e.stopPropagation();
        dv2ToggleWrapperFullscreen($videoContainer);
    });

    $videoContainer.on("click", ".dv2-stream-controls__play", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const $video = $videoContainer.find("video").first();
        dv2ToggleStreamVideoPlayPause($video);
        dv2SyncStreamControlsState($videoContainer, $video);
        dv2PulseStreamControlsVisible($videoContainer);
    });

    $videoContainer.on("click", ".dv2-stream-controls__mute", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const video = $videoContainer.find("video")[0];
        if (!video) return;
        if (dv2IsStreamVideoMuted(video)) {
            video.muted = false;
            if (video.volume === 0) {
                video.volume = 0.7;
            }
        } else {
            video.muted = true;
        }
        dv2MarkStreamVolumeTouched(video);
        dv2SyncStreamControlsState($videoContainer);
        dv2PulseStreamControlsVisible($videoContainer);
    });

    $videoContainer.on("input change", ".dv2-stream-volume", function (e) {
        e.stopPropagation();
        const video = $videoContainer.find("video")[0];
        if (!video) return;
        const vol = parseFloat(this.value);
        if (Number.isNaN(vol)) return;
        video.volume = vol;
        video.muted = vol === 0;
        dv2MarkStreamVolumeTouched(video);
        dv2SyncStreamControlsState($videoContainer);
        dv2PulseStreamControlsVisible($videoContainer);
    });

    let streamVideoClickTimer = null;
    let streamControlsHideTimer = null;

    const isStreamChromeUiClick = (target) =>
        $(target).closest(
            ".dv2-stream-controls, .dv2-stream-chrome-close, .dv2-stream-chrome-header, .dv2-stream-chrome-right, .dv2-stream-chrome-footer, .dv2-stream-chrome-ft-head-peek, .dv2-stream-odds-slot, .dv2-stream-odds-panel, button, a, input, label"
        ).length > 0;

    const toggleStreamVideoPlayPause = ($video) => {
        const video = $video?.[0];
        if (!video) return;
        if (video.paused) {
            video.play().catch(() => console.warn("[VSC LIVE] Không thể phát video"));
        } else {
            video.pause();
        }
    };

    const clearStreamControlsHideTimer = () => {
        if (streamControlsHideTimer) {
            clearTimeout(streamControlsHideTimer);
            streamControlsHideTimer = null;
        }
    };

    const setStreamControlsVisible = (visible) => {
        $videoContainer.toggleClass("dv2-stream-ui-active", !!visible);
    };

    const pulseStreamControlsVisible = () => {
        setStreamControlsVisible(true);
        clearStreamControlsHideTimer();
        streamControlsHideTimer = setTimeout(() => {
            setStreamControlsVisible(false);
            streamControlsHideTimer = null;
        }, DV2_STREAM_CONTROLS_HIDE_MS);
    };

    $videoContainer.data("dv2PulseStreamControlsVisible", pulseStreamControlsVisible);

    $videoContainer.on("click", "video", function (e) {
        if (isStreamChromeUiClick(e.target)) return;

        pulseStreamControlsVisible();

        const $video = $(this);

        clearTimeout(streamVideoClickTimer);
        streamVideoClickTimer = setTimeout(() => {
            streamVideoClickTimer = null;
            toggleStreamVideoPlayPause($video);
        }, 220);
    });

    $videoContainer.on("dblclick", "video", function (e) {
        if (isStreamChromeUiClick(e.target)) return;
        clearTimeout(streamVideoClickTimer);
        streamVideoClickTimer = null;
        e.preventDefault();
        dv2ToggleWrapperFullscreen($videoContainer);
    });

    $videoContainer.on(
        "mousemove.dv2StreamUi pointerenter.dv2StreamUi pointerdown.dv2StreamUi touchstart.dv2StreamUi",
        function () {
            pulseStreamControlsVisible();
        }
    );

    $videoContainer.on("playing.dv2StreamUi", "video", function () {
        pulseStreamControlsVisible();
    });

    $videoContainer.on(
        "play.dv2StreamControls pause.dv2StreamControls volumechange.dv2StreamControls loadedmetadata.dv2StreamControls",
        "video",
        function () {
            dv2SyncStreamControlsState($videoContainer, $(this));
        }
    );

    $videoContainer.on("mouseleave.dv2StreamUi", function () {
        clearStreamControlsHideTimer();
        setStreamControlsVisible(false);
    });

    const syncFullscreenChrome = () => {
        if (
            !dv2IsNativeWrapperFullscreen($videoContainer) &&
            dv2IsCssWrapperFullscreen($videoContainer)
        ) {
            // Giữ CSS fullscreen khi native API không dùng được (iOS).
        } else if (!dv2IsNativeWrapperFullscreen($videoContainer)) {
            $videoContainer.data("cssWrapperFs", false);
            dv2RestoreCssFullscreenPortal($videoContainer);
            if (
                !$(".dv2-video-wrapper")
                    .toArray()
                    .some((el) => $(el).data("cssWrapperFs"))
            ) {
                $("body").removeClass("dv2-stream-body-fs");
            }
        }

        const isContainerFs = dv2IsStreamWrapperFullscreen($videoContainer);
        dv2SyncCssFullscreenPortal($videoContainer);
        dv2SyncStreamWrapperFullscreenUi($videoContainer);

        if (!isContainerFs) {
            clearStreamControlsHideTimer();
            setStreamControlsVisible(false);
        } else {
            pulseStreamControlsVisible();
        }
        dv2SyncStreamChromeVisibility($videoContainer);
        dv2SyncVideoStageLayout($videoContainer);
    };

    $(document).on(
        "fullscreenchange.dv2StreamChrome webkitfullscreenchange.dv2StreamChrome mozfullscreenchange.dv2StreamChrome MSFullscreenChange.dv2StreamChrome",
        syncFullscreenChrome
    );

    $videoContainer.on("dv2wrapperfschange.dv2StreamChrome", syncFullscreenChrome);
    $(window).on("resize.dv2StreamChrome orientationchange.dv2StreamChrome", function () {
        syncFullscreenChrome();
        dv2SyncVideoStageLayout($videoContainer);
    });
}

function dv2PulseStreamControlsVisible($videoContainer) {
    const pulse = $videoContainer?.data("dv2PulseStreamControlsVisible");
    if (typeof pulse === "function") {
        pulse();
    }
}

function dv2ToggleStreamVideoPlayPause($video) {
    const video = $video?.[0];
    if (!video) return;
    if (video.paused) {
        video.play().catch(() => console.warn("[VSC LIVE] Không thể phát video"));
    } else {
        video.pause();
    }
}

function dv2GetStreamOddsPanelConfig() {
    const config = window.DV2_STREAM_ODDS_PANEL || {};
    return {
        imageUrl: config.imageUrl || "",
        linkUrl: config.linkUrl || "",
    };
}

function dv2GetStreamOddsApiBase() {
    if (typeof API_URL !== "undefined") {
        return String(API_URL).replace(/\/?$/, "/");
    }
    if (typeof BASE_API_URL !== "undefined") {
        const base = String(BASE_API_URL);
        return base.endsWith("/api/data/") || base.endsWith("/api/data")
            ? base.replace(/\/?$/, "/")
            : `${base.replace(/\/?$/, "")}/api/data/`;
    }
    return "https://vsc-apidev.helizones.com/api/data/";
}

function dv2GetStreamMatchId() {
    if (typeof DV2_MATCH_ID !== "undefined" && DV2_MATCH_ID) {
        return String(DV2_MATCH_ID);
    }
    try {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get("match");
        if (fromQuery) return fromQuery;
    } catch (e) {}
    const pathMatch = window.location.pathname.match(/\/streams\/([^/?#]+)/i);
    return pathMatch ? pathMatch[1] : "";
}

function dv2NormalizeOddsTrend(trend) {
    const value = String(trend || "same").toLowerCase();
    if (value === "up" || value === "down") return value;
    return "same";
}

function dv2FormatOddsValue(value) {
    if (value == null || value === "") return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    const rounded = Math.round(num * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, "");
}

function dv2FormatOddsRate(value) {
    if (value == null || value === "") return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    if (num > 0) return `+${dv2FormatOddsValue(num)}`;
    return dv2FormatOddsValue(num);
}

function dv2CountMatchEvents(events, type, team) {
    if (!Array.isArray(events)) return 0;
    const needle = String(type).toLowerCase();
    return events.filter((event) => {
        const eventType = String(event?.type || "").toLowerCase();
        return event?.team === team && eventType.includes(needle);
    }).length;
}

function dv2ExtractOddsSnapshot(data) {
    const hdp = data?.hdp;
    const ou = data?.ou;
    const stats = data?.stats || {};
    const corner = data?.corner || stats?.corner || stats?.corners || {};
    const yellowCard = data?.yellowCard || stats?.yellowCard || {};
    const redCard = data?.redCard || stats?.redCard || {};
    const events = data?.events;

    return {
        hdp: {
            home: hdp?.home,
            away: hdp?.away,
            rate: hdp?.rate,
            homeTrend: dv2NormalizeOddsTrend(hdp?.homeTrend),
            awayTrend: dv2NormalizeOddsTrend(hdp?.awayTrend),
            rateTrend: dv2NormalizeOddsTrend(hdp?.rateTrend),
        },
        ou: {
            over: ou?.over,
            under: ou?.under,
            rate: ou?.rate,
            overTrend: dv2NormalizeOddsTrend(ou?.overTrend),
            underTrend: dv2NormalizeOddsTrend(ou?.underTrend),
            rateTrend: dv2NormalizeOddsTrend(ou?.rateTrend),
        },
        corners: {
            home: corner.home ?? dv2CountMatchEvents(events, "corner", "home"),
            away: corner.away ?? dv2CountMatchEvents(events, "corner", "away"),
        },
        yellowCard: {
            home: yellowCard.home ?? dv2CountMatchEvents(events, "yellow card", "home"),
            away: yellowCard.away ?? dv2CountMatchEvents(events, "yellow card", "away"),
        },
        redCard: {
            home: redCard.home ?? dv2CountMatchEvents(events, "red card", "home"),
            away: redCard.away ?? dv2CountMatchEvents(events, "red card", "away"),
        },
    };
}

function dv2SerializeOddsSnapshot(snapshot) {
    return JSON.stringify(snapshot || {});
}

function dv2OddsValueHasData(value) {
    return value != null && value !== "";
}

function dv2OddsSectionHasData(section) {
    if (section == null) return false;
    return (
        dv2OddsValueHasData(section.home) ||
        dv2OddsValueHasData(section.away) ||
        dv2OddsValueHasData(section.rate) ||
        dv2OddsValueHasData(section.over) ||
        dv2OddsValueHasData(section.under)
    );
}

function dv2SnapshotHasOddsData(snapshot) {
    if (!snapshot) return false;
    return dv2OddsSectionHasData(snapshot.hdp) || dv2OddsSectionHasData(snapshot.ou);
}

function dv2HasStreamOddsData(matchData) {
    if (!matchData) return false;
    return dv2OddsSectionHasData(matchData.hdp) || dv2OddsSectionHasData(matchData.ou);
}

function dv2UpdateOddsPill($panel, selector, value, trend, variant, options) {
    const $pill = $panel.find(selector);
    if (!$pill.length) return;

    const trendClass = dv2NormalizeOddsTrend(trend);
    const signedRate = !!(options && options.signedRate);
    const display =
        variant === "rate" && signedRate ? dv2FormatOddsRate(value) : dv2FormatOddsValue(value);
    const arrow =
        variant !== "rate" && trendClass === "up"
            ? DV2_ODDS_SVG.trendUp
            : variant !== "rate" && trendClass === "down"
              ? DV2_ODDS_SVG.trendDown
              : "";
    const trendClassName =
        variant !== "rate" && trendClass !== "same"
            ? ` dv2-stream-odds-panel__pill--${trendClass}`
            : "";

    $pill
        .attr("class", `dv2-stream-odds-panel__pill dv2-stream-odds-panel__pill--${variant}${trendClassName}`)
        .html(`${display}${arrow}`);
}

function dv2RenderStreamOddsPanel($panel, snapshot) {
    if (!$panel?.length || !snapshot) return;

    dv2UpdateOddsPill($panel, "[data-dv2-odds-hdp-home]", snapshot.hdp.home, snapshot.hdp.homeTrend, "side");
    dv2UpdateOddsPill($panel, "[data-dv2-odds-hdp-rate]", snapshot.hdp.rate, snapshot.hdp.rateTrend, "rate", {
        signedRate: true,
    });
    dv2UpdateOddsPill($panel, "[data-dv2-odds-hdp-away]", snapshot.hdp.away, snapshot.hdp.awayTrend, "side");

    dv2UpdateOddsPill($panel, "[data-dv2-odds-ou-over]", snapshot.ou.over, snapshot.ou.overTrend, "side");
    dv2UpdateOddsPill($panel, "[data-dv2-odds-ou-rate]", snapshot.ou.rate, snapshot.ou.rateTrend, "rate");
    dv2UpdateOddsPill($panel, "[data-dv2-odds-ou-under]", snapshot.ou.under, snapshot.ou.underTrend, "side");

    $panel.find("[data-dv2-odds-corners-home]").text(snapshot.corners.home ?? 0);
    $panel.find("[data-dv2-odds-corners-away]").text(snapshot.corners.away ?? 0);
    $panel.find("[data-dv2-odds-yc-home]").text(snapshot.yellowCard.home ?? 0);
    $panel.find("[data-dv2-odds-yc-away]").text(snapshot.yellowCard.away ?? 0);
    $panel.find("[data-dv2-odds-rc-home]").text(snapshot.redCard.home ?? 0);
    $panel.find("[data-dv2-odds-rc-away]").text(snapshot.redCard.away ?? 0);
}

function dv2ForceApplyStreamOddsData($videoContainer, matchData) {
    const state = $videoContainer.data("dv2OddsPanelState");
    const $panel = state?.$panel;
    if (!state || !$panel?.length || !matchData) return;

    const snapshot = dv2ExtractOddsSnapshot(matchData);
    state.snapshotSerialized = dv2SerializeOddsSnapshot(snapshot);
    dv2RenderStreamOddsPanel($panel, snapshot);

    if (!dv2HasStreamOddsData(matchData)) {
        if (state.autoHideTimer) {
            clearTimeout(state.autoHideTimer);
            state.autoHideTimer = null;
        }
        dv2SetStreamOddsPanelOpen($panel, false);
    }
}

function dv2RememberStreamOddsMatchData($videoContainer, matchData) {
    if ($videoContainer?.length && matchData) {
        $videoContainer.data("dv2OddsMatchData", matchData);
    }
}

function dv2BuildStreamOddsPanelHtml(config) {
    const imageUrl = config?.imageUrl || "";
    const linkUrl = config?.linkUrl || "";
    const brandInner = imageUrl
        ? `<img src="${imageUrl}" alt="Cược" loading="lazy" decoding="async">`
        : "";
    const brandTag = linkUrl ? "a" : "div";
    const brandAttrs = linkUrl
        ? ` class="dv2-stream-odds-panel__brand" href="${linkUrl}" target="_blank" rel="noopener noreferrer"`
        : ` class="dv2-stream-odds-panel__brand"`;

    return `
<div class="dv2-stream-odds-panel dv2-stream-odds-panel--collapsed" data-dv2-odds-panel-root aria-hidden="true">
    <div class="dv2-stream-odds-panel__viewport">
        <div class="dv2-stream-odds-panel__slide">
            <div class="dv2-stream-odds-panel__body">
            <${brandTag}${brandAttrs}>
                <span class="dv2-stream-odds-panel__brand-label">Cược</span>
                ${brandInner}
            </${brandTag}>
            <div class="dv2-stream-odds-panel__rows">
                <div class="dv2-stream-odds-panel__row dv2-stream-odds-panel__row--hdp">
                    <span class="dv2-stream-odds-panel__row-label">HDP</span>
                    <span class="dv2-stream-odds-panel__pill dv2-stream-odds-panel__pill--side" data-dv2-odds-hdp-home>-</span>
                    <span class="dv2-stream-odds-panel__pill dv2-stream-odds-panel__pill--rate" data-dv2-odds-hdp-rate>-</span>
                    <span class="dv2-stream-odds-panel__pill dv2-stream-odds-panel__pill--side" data-dv2-odds-hdp-away>-</span>
                </div>
                <div class="dv2-stream-odds-panel__row dv2-stream-odds-panel__row--ou">
                    <span class="dv2-stream-odds-panel__row-label">O/U</span>
                    <span class="dv2-stream-odds-panel__pill dv2-stream-odds-panel__pill--side" data-dv2-odds-ou-over>-</span>
                    <span class="dv2-stream-odds-panel__pill dv2-stream-odds-panel__pill--rate" data-dv2-odds-ou-rate>-</span>
                    <span class="dv2-stream-odds-panel__pill dv2-stream-odds-panel__pill--side" data-dv2-odds-ou-under>-</span>
                </div>
            </div>
            <div class="dv2-stream-odds-panel__stats">
                <span data-dv2-odds-corners-home>0</span>
                <span class="dv2-stream-odds-panel__stat-icon">${DV2_ODDS_SVG.corner}</span>
                <span data-dv2-odds-corners-away>0</span>
                <span class="dv2-stream-odds-panel__stat-sep" aria-hidden="true">|</span>
                <span data-dv2-odds-yc-home>0</span>
                <span class="dv2-stream-odds-panel__stat-icon">${DV2_ODDS_SVG.yellowCard}</span>
                <span data-dv2-odds-yc-away>0</span>
                <span class="dv2-stream-odds-panel__stat-sep" aria-hidden="true">|</span>
                <span data-dv2-odds-rc-home>0</span>
                <span class="dv2-stream-odds-panel__stat-icon">${DV2_ODDS_SVG.redCard}</span>
                <span data-dv2-odds-rc-away>0</span>
            </div>
            </div>
            <button type="button" class="dv2-stream-odds-panel__toggle-close" aria-label="Thu gọn" aria-expanded="false">
                ${DV2_ODDS_SVG.toggleClose}
            </button>
        </div>
    </div>
</div>
<button type="button" class="dv2-stream-odds-panel__toggle-open" aria-label="Mở rộng" aria-expanded="false">
    ${DV2_ODDS_SVG.toggleOpen}
</button>`;
}

function dv2SetStreamOddsPanelOpen($panel, open, options) {
    if (!$panel?.length) return;
    const isOpen = !!open;
    const isAuto = !!(options && options.auto);
    const $slot = $panel.closest("[data-dv2-odds-panel]");

    $panel
        .toggleClass("dv2-stream-odds-panel--open", isOpen)
        .toggleClass("dv2-stream-odds-panel--collapsed", !isOpen)
        .attr("aria-hidden", isOpen ? "false" : "true");

    $slot
        .toggleClass("dv2-stream-odds-slot--open", isOpen)
        .attr("aria-hidden", isOpen ? "false" : "true");

    $panel.find(".dv2-stream-odds-panel__toggle-close").attr("aria-expanded", isOpen ? "true" : "false");
    $slot.find(".dv2-stream-odds-panel__toggle-open").attr("aria-expanded", isOpen ? "true" : "false");
    $panel.data("dv2OddsAutoVisible", isAuto);
}

function dv2ToggleStreamOddsPanel($videoContainer) {
    const state = $videoContainer?.data("dv2OddsPanelState");
    const $panel = state?.$panel;
    if (!state || !$panel?.length) return;

    const isOpen = $panel.hasClass("dv2-stream-odds-panel--open");
    if (isOpen) {
        if (state.autoHideTimer) {
            clearTimeout(state.autoHideTimer);
            state.autoHideTimer = null;
        }
        dv2SetStreamOddsPanelOpen($panel, false);
        return;
    }

    dv2SetStreamOddsPanelOpen($panel, true, { auto: false });
}

function dv2BindStreamOddsPanelToggle($videoContainer) {
    const state = $videoContainer?.data("dv2OddsPanelState");
    const $panel = state?.$panel;
    if (!state || !$panel?.length) return;

    const $slot = $panel.closest("[data-dv2-odds-panel]");

    $videoContainer.off("click.dv2OddsPanel", ".dv2-stream-odds-panel__toggle-close, .dv2-stream-odds-panel__toggle-open");
    $slot.off("click.dv2OddsPanel");

    $slot.on("click.dv2OddsPanel", ".dv2-stream-odds-panel__toggle-close", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (state.autoHideTimer) {
            clearTimeout(state.autoHideTimer);
            state.autoHideTimer = null;
        }
        dv2SetStreamOddsPanelOpen($panel, false);
    });

    $slot.on("click.dv2OddsPanel", ".dv2-stream-odds-panel__toggle-open", function (e) {
        e.preventDefault();
        e.stopPropagation();
        dv2SetStreamOddsPanelOpen($panel, true, { auto: false });
    });
}

function dv2ClearStreamOddsTimers($videoContainer) {
    const state = $videoContainer.data("dv2OddsPanelState");
    if (!state) return;

    if (state.pollTimer) {
        clearInterval(state.pollTimer);
        state.pollTimer = null;
    }
    if (state.autoShowTimer) {
        clearInterval(state.autoShowTimer);
        state.autoShowTimer = null;
    }
    if (state.autoHideTimer) {
        clearTimeout(state.autoHideTimer);
        state.autoHideTimer = null;
    }
}

function dv2DestroyStreamOddsPanel($videoContainer) {
    if (!$videoContainer?.length) return;
    dv2ClearStreamOddsTimers($videoContainer);
    $videoContainer.removeData("dv2OddsPanelState");
    $videoContainer.off(".dv2OddsPanel");
    dv2GetStreamChromeEl($videoContainer).find("[data-dv2-odds-panel]").empty();
}

function dv2PollStreamOddsPanel($videoContainer) {
    const state = $videoContainer.data("dv2OddsPanelState");
    if (!state?.matchId || !$.ajax) return;

    $.ajax({
        url: `${state.apiBase}lives/${state.matchId}`,
        method: "GET",
        success(res) {
            if (!res?.data) return;
            dv2ApplyStreamOddsData($videoContainer, res.data);
        },
    });
}

function dv2ApplyStreamOddsData($videoContainer, matchData) {
    const state = $videoContainer.data("dv2OddsPanelState");
    const $panel = state?.$panel;
    if (!state || !$panel?.length || !matchData) return;

    const snapshot = dv2ExtractOddsSnapshot(matchData);
    const serialized = dv2SerializeOddsSnapshot(snapshot);
    if (state.snapshotSerialized === serialized) return;

    state.snapshotSerialized = serialized;
    dv2RenderStreamOddsPanel($panel, snapshot);
    dv2RememberStreamOddsMatchData($videoContainer, matchData);

    if (!dv2HasStreamOddsData(matchData)) {
        if (state.autoHideTimer) {
            clearTimeout(state.autoHideTimer);
            state.autoHideTimer = null;
        }
        dv2SetStreamOddsPanelOpen($panel, false);
        return;
    }

    if (
        $videoContainer.data("hlsReady") &&
        !state.hasShownFirstAuto &&
        dv2SnapshotHasOddsData(snapshot)
    ) {
        dv2MaybeShowFirstStreamOddsAuto($videoContainer);
    }
}

function dv2ScheduleStreamOddsAutoHide($videoContainer) {
    const state = $videoContainer.data("dv2OddsPanelState");
    if (!state?.$panel?.length) return;

    if (state.autoHideTimer) {
        clearTimeout(state.autoHideTimer);
        state.autoHideTimer = null;
    }

    state.autoHideTimer = setTimeout(() => {
        state.autoHideTimer = null;
        if (state.$panel.data("dv2OddsAutoVisible")) {
            dv2SetStreamOddsPanelOpen(state.$panel, false);
        }
    }, DV2_ODDS_AUTO_SHOW_DURATION_MS);
}

function dv2ShowStreamOddsAuto($videoContainer) {
    const state = $videoContainer.data("dv2OddsPanelState");
    const $panel = state?.$panel;
    if (!state || !$panel?.length) return;

    const matchData = $videoContainer.data("dv2OddsMatchData");
    if (!dv2HasStreamOddsData(matchData)) return;

    dv2SetStreamOddsPanelOpen($panel, true, { auto: true });
    dv2ScheduleStreamOddsAutoHide($videoContainer);
}

function dv2MaybeShowFirstStreamOddsAuto($videoContainer) {
    const state = $videoContainer.data("dv2OddsPanelState");
    if (!state?.$panel?.length || state.hasShownFirstAuto) return;

    const matchData = $videoContainer.data("dv2OddsMatchData");
    if (!dv2HasStreamOddsData(matchData)) return;

    state.hasShownFirstAuto = true;
    dv2SetStreamOddsPanelOpen(state.$panel, true, { auto: false });
}

function dv2EnsureStreamOddsPanelShell($videoContainer) {
    if (!$videoContainer?.length) return $();

    let $chrome = dv2GetStreamChromeEl($videoContainer);
    if (!$chrome.length) {
        $chrome = $('<div class="dv2-stream-chrome" aria-hidden="true"></div>');
        const $stage = dv2GetVideoStageEl($videoContainer);
        if ($stage.length) {
            $stage.prepend($chrome);
        } else {
            $videoContainer.prepend($chrome);
        }
    }

    let $slot = $chrome.find("[data-dv2-odds-panel]").first();
    if (!$slot.length) {
        $slot = $chrome.children("[data-dv2-odds-panel]").first();
    }
    if (!$slot.length) {
        $slot = $videoContainer.children("[data-dv2-odds-panel]").first();
    }
    if (!$slot.length) {
        $slot = $('<div class="dv2-stream-odds-slot" data-dv2-odds-panel aria-hidden="true"></div>');
        $chrome.prepend($slot);
    }

    let $panel = $slot.find("[data-dv2-odds-panel-root]");
    if (!$panel.length) {
        $slot.html(dv2BuildStreamOddsPanelHtml(dv2GetStreamOddsPanelConfig()));
        $panel = $slot.find("[data-dv2-odds-panel-root]");
    }

    return $panel;
}

function dv2InitStreamOddsPanel($videoContainer, initialMatchData) {
    if (!$videoContainer?.length) return;

    if (initialMatchData) {
        dv2RememberStreamOddsMatchData($videoContainer, initialMatchData);
    } else {
        initialMatchData = $videoContainer.data("dv2OddsMatchData");
    }

    const matchId =
        initialMatchData?.matchId ||
        initialMatchData?.match_id ||
        initialMatchData?.id ||
        dv2GetStreamMatchId();

    if (!matchId) return;

    const $panel = dv2EnsureStreamOddsPanelShell($videoContainer);
    if (!$panel.length) return;

    if ($videoContainer.data("dv2OddsPanelState")?.matchId === matchId) {
        const existingState = $videoContainer.data("dv2OddsPanelState");
        existingState.$panel = dv2EnsureStreamOddsPanelShell($videoContainer);
        if (initialMatchData) {
            dv2RememberStreamOddsMatchData($videoContainer, initialMatchData);
            dv2ForceApplyStreamOddsData($videoContainer, initialMatchData);
            if ($videoContainer.data("hlsReady")) {
                dv2MaybeShowFirstStreamOddsAuto($videoContainer);
            }
        }
        dv2BindStreamOddsPanelToggle($videoContainer);
        return;
    }

    dv2DestroyStreamOddsPanel($videoContainer);

    const state = {
        matchId,
        apiBase: dv2GetStreamOddsApiBase(),
        $panel,
        snapshotSerialized: "",
        pollTimer: null,
        autoShowTimer: null,
        autoHideTimer: null,
        hasShownFirstAuto: false,
    };

    $videoContainer.data("dv2OddsPanelState", state);
    dv2SetStreamOddsPanelOpen($panel, false);

    if (initialMatchData) {
        dv2ForceApplyStreamOddsData($videoContainer, initialMatchData);
    } else {
        dv2PollStreamOddsPanel($videoContainer);
    }

    state.pollTimer = setInterval(() => {
        dv2PollStreamOddsPanel($videoContainer);
    }, DV2_ODDS_POLL_MS);

    state.autoShowTimer = setInterval(() => {
        if ($panel.hasClass("dv2-stream-odds-panel--open")) return;
        dv2ShowStreamOddsAuto($videoContainer);
    }, DV2_ODDS_AUTO_SHOW_INTERVAL_MS);

    dv2BindStreamOddsPanelToggle($videoContainer);

    if ($videoContainer.data("hlsReady")) {
        dv2MaybeShowFirstStreamOddsAuto($videoContainer);
    }
}

window.DV2_StreamChrome = {
    getChromeEl: dv2GetStreamChromeEl,
    getOverlayMount: dv2GetOverlayMount,
    ensureVideoStage: dv2EnsureVideoStage,
    syncVideoStageLayout: dv2SyncVideoStageLayout,
    applyVideoControls: dv2ApplyStreamVideoControls,
    ensureControlsBar: dv2EnsureStreamControlsBar,
    syncControlsState: dv2SyncStreamControlsState,
    bindEvents: dv2BindStreamChromeEvents,
    initPlayerUi: dv2InitStreamPlayerUi,
    refreshReviveAds: dv2RefreshStreamChromeReviveAds,
    setFullChromeVisible: dv2SetFullStreamChromeVisible,
    syncVisibility: dv2SyncStreamChromeVisibility,
    updateVisibility: dv2UpdateStreamChromeVisibility,
    onHlsReady: dv2OnHlsStreamReady,
    clearFullChrome: dv2ClearFullStreamChrome,
    initOddsPanel: dv2InitStreamOddsPanel,
    rememberOddsMatchData: dv2RememberStreamOddsMatchData,
    destroyOddsPanel: dv2DestroyStreamOddsPanel,
    exitWrapperFullscreen: dv2ExitStreamWrapperFullscreen,
    toggleWrapperFullscreen: dv2ToggleWrapperFullscreen,
    pulseControlsVisible: dv2PulseStreamControlsVisible,
    togglePlayPause: dv2ToggleStreamVideoPlayPause,
    getWrapperFrom: ($el) => $el.closest(".dv2-video-wrapper"),
};

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* stream-kickoff.js */
(function(window, $, jQuery, Hls, Swiper) {
/**
 * Shared HOT18 poster + kickoff countdown helpers for stream detail layouts.
 */
window.DV2StreamKickoff = window.DV2StreamKickoff || {};

(function (DV2StreamKickoff) {
  const KICKOFF_COUNTDOWN_MS = 24 * 60 * 60 * 1000;
  const COUNTDOWN_SELECTOR = ".dv2-kickoff-countdown[data-dv2-kickoff-countdown]";
  // Keep in sync with define.php DV2_STREAMING_HOT18_COMMENTATOR_ID
  const DEFAULT_HOT18_COMMENTATOR_ID = "18602824317240064";
  const DEFAULT_HOT18_POSTER_FILE = "bg-18+.webp";
  let countdownTimer = null;

  function getHot18CommentatorId() {
    return String(
      window.DV2_STREAMING_HOT18_COMMENTATOR_ID || DEFAULT_HOT18_COMMENTATOR_ID
    );
  }

  function getImagePath() {
    if (typeof DV2_IMAGE_PATH !== "undefined" && DV2_IMAGE_PATH) {
      return DV2_IMAGE_PATH.endsWith("/") ? DV2_IMAGE_PATH : `${DV2_IMAGE_PATH}/`;
    }
    if (typeof window.DV2_STREAMING_PLUGIN_URL === "string" && window.DV2_STREAMING_PLUGIN_URL) {
      const pluginUrl = window.DV2_STREAMING_PLUGIN_URL.endsWith("/")
        ? window.DV2_STREAMING_PLUGIN_URL
        : `${window.DV2_STREAMING_PLUGIN_URL}/`;
      return `${pluginUrl}assets/images/`;
    }
    return "../../assets/images/";
  }

  function isHot18Link(link) {
    if (!link) return false;
    const hot18Id = getHot18CommentatorId();
    if (hot18Id && String(link.commentatorId || "") === hot18Id) {
      return true;
    }
    const name = String(link.commentator || "").trim().toLowerCase();
    return name === "18+" || name === "18";
  }

  DV2StreamKickoff.getKickoff = function getKickoff(matchOrKickoff) {
    if (!matchOrKickoff) return "";
    if (
      typeof matchOrKickoff === "string" ||
      matchOrKickoff instanceof Date ||
      typeof matchOrKickoff === "number"
    ) {
      return matchOrKickoff;
    }
    return matchOrKickoff?.matchInfo?.kickoff ?? matchOrKickoff?.kickoff ?? "";
  };

  DV2StreamKickoff.getDefaultHot18PosterUrl = function getDefaultHot18PosterUrl() {
    return `${getImagePath()}${DEFAULT_HOT18_POSTER_FILE}`;
  };

  DV2StreamKickoff.resolvePosterUrl = function resolvePosterUrl(link, defaultPosterUrl) {
    if (!isHot18Link(link)) {
      return defaultPosterUrl;
    }
    const customPoster = String(window.DV2_STREAMING_HOT18_POSTER_URL || "").trim();
    return customPoster || DV2StreamKickoff.getDefaultHot18PosterUrl();
  };

  DV2StreamKickoff.applyPosterForLink = function applyPosterForLink(
    $video,
    link,
    defaultPosterUrl
  ) {
    const $ = window.jQuery;
    if (!$?.fn || !$video?.length) return;
    $video.attr("poster", DV2StreamKickoff.resolvePosterUrl(link, defaultPosterUrl));
  };

  DV2StreamKickoff.applyPosterForVideo = function applyPosterForVideo(
    video,
    link,
    defaultPosterUrl
  ) {
    if (!video) return;
    video.poster = DV2StreamKickoff.resolvePosterUrl(link, defaultPosterUrl);
  };

  DV2StreamKickoff.getKickoffDiffMs = function getKickoffDiffMs(kickoff) {
    const kickoffTime = new Date(DV2StreamKickoff.getKickoff(kickoff));
    if (Number.isNaN(kickoffTime.getTime())) return null;
    return kickoffTime.getTime() - Date.now();
  };

  DV2StreamKickoff.shouldShowCountdown = function shouldShowCountdown(kickoff) {
    const diffMs = DV2StreamKickoff.getKickoffDiffMs(kickoff);
    return diffMs !== null && diffMs > 0 && diffMs < KICKOFF_COUNTDOWN_MS;
  };

  DV2StreamKickoff.formatCountdown = function formatCountdown(kickoff) {
    const diffMs = DV2StreamKickoff.getKickoffDiffMs(kickoff);
    if (diffMs === null || diffMs <= 0) return "00:00:00";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  DV2StreamKickoff.formatTime = function formatTime(datetime) {
    const date = new Date(DV2StreamKickoff.getKickoff(datetime));
    if (!datetime || Number.isNaN(date.getTime())) return "";
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  DV2StreamKickoff.formatDateLabel = function formatDateLabel(matchDate) {
    const date = new Date(DV2StreamKickoff.getKickoff(matchDate));
    if (!matchDate || Number.isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
  };

  DV2StreamKickoff.renderTimeDisplay = function renderTimeDisplay(kickoff, options) {
    options = options || {};
    const formatTime = options.formatTime || DV2StreamKickoff.formatTime;
    const formatDateLabel = options.formatDateLabel || DV2StreamKickoff.formatDateLabel;
    const countdownClass = options.countdownClass || "dv2-kickoff-countdown";
    const resolvedKickoff = DV2StreamKickoff.getKickoff(kickoff);

    if (DV2StreamKickoff.shouldShowCountdown(resolvedKickoff)) {
      return `Bắt đầu sau: <strong class="${countdownClass}" data-dv2-kickoff-countdown>${DV2StreamKickoff.formatCountdown(
        resolvedKickoff
      )}</strong>`;
    }

    const timeLabel = options.useFooterTitle
      ? `<strong class="dv2-layout-vb2-footer-title">Thời gian:</strong>`
      : `Thời gian:`;

    return `${timeLabel} <strong>${formatTime(resolvedKickoff)}</strong> ngày ${formatDateLabel(
      resolvedKickoff
    )}`;
  };

  DV2StreamKickoff.stopCountdown = function stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  };

  DV2StreamKickoff.startCountdown = function startCountdown(kickoff) {
    DV2StreamKickoff.stopCountdown();
    const $ = window.jQuery;
    const resolvedKickoff = DV2StreamKickoff.getKickoff(kickoff);
    if (!$?.fn || !DV2StreamKickoff.shouldShowCountdown(resolvedKickoff)) return;

    const tick = () => {
      const $targets = $(COUNTDOWN_SELECTOR);
      if (!$targets.length) {
        DV2StreamKickoff.stopCountdown();
        return;
      }

      const diffMs = DV2StreamKickoff.getKickoffDiffMs(resolvedKickoff);
      if (diffMs === null || diffMs <= 0) {
        $targets.text("00:00:00");
        DV2StreamKickoff.stopCountdown();
        return;
      }

      $targets.text(DV2StreamKickoff.formatCountdown(resolvedKickoff));
    };

    tick();
    countdownTimer = setInterval(tick, 1000);
  };
})(window.DV2StreamKickoff);

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* stream-links.js */
(function(window, $, jQuery, Hls, Swiper) {
/**
 * Shared livestream link utilities for DV2 detail pages.
 * - Sort BLV (Nhà Đài last)
 * - liveId URL sync for deep-linking commentator streams
 * - Span-based link bar binding
 */
window.DV2StreamLinks = window.DV2StreamLinks || {};

(function (DV2StreamLinks) {
  const NHADAI_COMMENTATOR_ID = 99999999999999999;

  DV2StreamLinks.isNhaDaiLink = function isNhaDaiLink(link) {
    if (!link) return false;
    if (link.commentatorId === NHADAI_COMMENTATOR_ID) return true;
    const name = String(link.commentator || "").trim().toLowerCase();
    return name === "nhà đài" || name === "nha dai" || name === "blv nhà đài";
  };

  DV2StreamLinks.sortLinks = function sortLinks(links, options) {
    const includeAll = options?.includeAll === true;
    const source = includeAll
      ? (links || []).slice()
      : (links || []).filter((link) => link?.isStreaming !== false);
    const sorted = source.slice();
    sorted.sort((a, b) => {
      const aIsNhaDai = DV2StreamLinks.isNhaDaiLink(a);
      const bIsNhaDai = DV2StreamLinks.isNhaDaiLink(b);
      if (aIsNhaDai && !bIsNhaDai) return 1;
      if (!aIsNhaDai && bIsNhaDai) return -1;
      return 0;
    });
    return sorted;
  };

  // List/home: chỉ lấy link đang streaming
  DV2StreamLinks.sort = function sort(links) {
    return DV2StreamLinks.sortLinks(links);
  };

  // Detail page: hiển thị tất cả BLV kể cả chưa live / lỗi stream
  DV2StreamLinks.sortForDetail = function sortForDetail(links) {
    return DV2StreamLinks.sortLinks(links, { includeAll: true });
  };

  DV2StreamLinks.getPreferredLink = function getPreferredLink(rawLinks, options) {
    const preferStreaming = options?.preferStreaming !== false;
    const streamingLinks = DV2StreamLinks.sort(rawLinks);
    if (streamingLinks.length) {
      return streamingLinks[0];
    }
    if (preferStreaming) {
      return DV2StreamLinks.sortForDetail(rawLinks)[0] || null;
    }
    return null;
  };

  DV2StreamLinks.getBlvName = function getBlvName(link, index) {
    return String(link?.commentator || "").trim() || `Link ${index + 1}`;
  };

  /**
   * brandLanding: truc-tiep/czechia-vs-south-africa-pxwrxlhy300xryk?liveId=...
   * → /streams/pxwrxlhy300xryk/?liveId=...
   */
  DV2StreamLinks.resolveBrandLandingUrl = function resolveBrandLandingUrl(brandLanding) {
    if (brandLanding == null || brandLanding === "") return null;
    const raw = String(brandLanding).trim();
    if (!raw) return null;

    const queryIndex = raw.indexOf("?");
    const pathPart = queryIndex >= 0 ? raw.slice(0, queryIndex) : raw;
    const queryPart = queryIndex >= 0 ? raw.slice(queryIndex + 1) : "";
    const lastSegment = pathPart.split("/").filter(Boolean).pop() || "";
    const dashIndex = lastSegment.lastIndexOf("-");
    if (dashIndex < 0) return null;

    const streamId = lastSegment.slice(dashIndex + 1);
    if (!streamId) return null;

    const query = queryPart ? `?${queryPart}` : "";
    return `/streams/${encodeURIComponent(streamId)}/${query}`;
  };

  DV2StreamLinks.getDetailUrl = function getDetailUrl(matchId, link, options) {
    const opts = options || {};
    const trailingSlash = opts.trailingSlash === true;
    const brandUrl = DV2StreamLinks.resolveBrandLandingUrl(link?.brandLanding);
    if (brandUrl) return brandUrl;

    const liveId = link?.liveId != null ? String(link.liveId) : "";
    const encodedMatchId = encodeURIComponent(String(matchId));
    const streamPath = trailingSlash
      ? `/streams/${encodedMatchId}/`
      : `/streams/${encodedMatchId}`;

    if (liveId) {
      return `${streamPath}?liveId=${encodeURIComponent(liveId)}`;
    }
    return streamPath;
  };

  DV2StreamLinks.navigateForLink = function navigateForLink(link) {
    const brandUrl = DV2StreamLinks.resolveBrandLandingUrl(link?.brandLanding);
    if (!brandUrl) return false;
    window.location.href = brandUrl;
    return true;
  };

  DV2StreamLinks.findIndexByLiveId = function findIndexByLiveId(links, liveId) {
    if (!liveId || !Array.isArray(links)) return -1;
    const target = String(liveId);
    return links.findIndex((link) => String(link?.liveId) === target);
  };

  DV2StreamLinks.updateLiveIdInUrl = function updateLiveIdInUrl(liveId) {
    const params = new URLSearchParams(window.location.search);
    if (liveId != null && liveId !== "") {
      params.set("liveId", String(liveId));
    } else {
      params.delete("liveId");
    }
    const query = params.toString();
    const newUrl = query
      ? `${window.location.pathname}?${query}${window.location.hash}`
      : `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState(null, "", newUrl);
  };

  DV2StreamLinks.resolveActiveLink = function resolveActiveLink(links, options) {
    const opts = options || {};
    const syncUrl = opts.syncUrl !== false;
    const requestedLiveId =
      opts.liveId !== undefined
        ? opts.liveId
        : new URLSearchParams(window.location.search).get("liveId");
    let activeIndex = DV2StreamLinks.findIndexByLiveId(links, requestedLiveId);
    if (activeIndex < 0) {
      activeIndex = 0;
    }
    const activeLink = links[activeIndex] || null;
    if (syncUrl && activeLink?.liveId != null) {
      DV2StreamLinks.updateLiveIdInUrl(activeLink.liveId);
    }
    return { activeIndex, activeLink };
  };

  DV2StreamLinks.bindSpanLinks = function bindSpanLinks(options) {
    const $ = window.jQuery;
    const {
      $container,
      links = [],
      activeIndex = 0,
      streamAttr = "data-stream-url",
      onSelect,
    } = options || {};

    if (!$?.fn || !$container?.length || !links.length) return;

    const html = links
      .map((item, i) => {
        const isActive = i === activeIndex ? "active" : "";
        const blvName = DV2StreamLinks.getBlvName(item, i);
        const streamUrl = item.url || "";
        const liveId = item.liveId != null ? String(item.liveId) : "";
        return `<span data-index="${i}" data-live-id="${liveId}" ${streamAttr}="${streamUrl}" class="${isActive}">${blvName}</span>`;
      })
      .join("");

    $container.html(html);
    $container.off("click.dv2StreamLinks").on("click.dv2StreamLinks", "span", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const $span = $(this);
      const index = Number($span.attr("data-index"));
      const link = links[index];
      if (DV2StreamLinks.navigateForLink(link)) {
        return;
      }
      const liveId = $span.attr("data-live-id");
      if (liveId) {
        DV2StreamLinks.updateLiveIdInUrl(liveId);
      }
      $container.find("span").removeClass("active");
      $container.find(`span[data-index="${index}"]`).addClass("active");
      if (typeof onSelect === "function") {
        onSelect(link, index, $span);
      }
    });
  };

  DV2StreamLinks.prepareSpanLinks = function prepareSpanLinks(options) {
    const {
      rawLinks,
      $container,
      streamAttr = "data-stream-url",
      onSelect,
      syncUrl = true,
    } = options || {};

    const links = DV2StreamLinks.sortForDetail(rawLinks);
    if (!links.length) {
      return { links, activeIndex: -1, activeLink: null };
    }

    const { activeIndex, activeLink } = DV2StreamLinks.resolveActiveLink(links, {
      syncUrl,
    });

    if ($container?.length) {
      DV2StreamLinks.bindSpanLinks({
        $container,
        links,
        activeIndex,
        streamAttr,
        onSelect,
      });
    }

    return { links, activeIndex, activeLink };
  };
})(window.DV2StreamLinks);

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* stream-tvc.js */
(function(window, $, jQuery, Hls, Swiper) {
/**
 * Pre-roll TVC before live stream (cakhia-v2 + vebo-v2).
 * Video URLs come from WordPress admin (dv2Streaming.tvcVideos).
 * If no videos are configured, TVC is skipped.
 */
window.DV2StreamTvc = window.DV2StreamTvc || {};

(function (DV2StreamTvc) {
  const SKIP_DELAY_SECONDS = 5;

  let playedThisPage = false;

  function normalizeTvcItem(item) {
    if (typeof item === "string" && item) {
      return { url: item, s3Url: item, redirectUrl: "" };
    }
    if (!item || typeof item !== "object") {
      return null;
    }

    const s3Url = item.s3Url || item.s3_url || "";
    const url = s3Url || item.url || "";
    if (!url) {
      return null;
    }

    return {
      url,
      s3Url: s3Url || url,
      fallbackUrl: item.fallbackUrl || item.fallback_url || "",
      redirectUrl: item.redirectUrl || item.redirect_url || "",
    };
  }

  function getTvcVideos() {
    const fromGlobal =
      typeof window.DV2_TVC_VIDEOS !== "undefined" && Array.isArray(window.DV2_TVC_VIDEOS)
        ? window.DV2_TVC_VIDEOS
        : [];
    const fromLocalized =
      typeof dv2Streaming !== "undefined" && Array.isArray(dv2Streaming.tvcVideos)
        ? dv2Streaming.tvcVideos
        : [];

    const source = fromGlobal.length ? fromGlobal : fromLocalized;

    return source.map(normalizeTvcItem).filter(Boolean);
  }

  function pickRandomTvc() {
    const videos = getTvcVideos();
    if (!videos.length) {
      return null;
    }
    return videos[Math.floor(Math.random() * videos.length)];
  }

  DV2StreamTvc.playBeforeStream = function playBeforeStream($container, onDone) {
    if (playedThisPage || !$container?.length) {
      onDone?.();
      return;
    }

    const tvc = pickRandomTvc();
    if (!tvc) {
      console.info("[DV2 TVC] No TVC videos configured, skipping pre-roll");
      onDone?.();
      return;
    }

    playedThisPage = true;

    const $overlay = $(`
      <div class="dv2-stream-tvc" role="dialog" aria-label="Quảng cáo">
        <video class="dv2-stream-tvc__video" autoplay playsinline preload="auto"></video>
        <button type="button" class="dv2-stream-tvc__unmute" aria-label="Bật tiếng" hidden>Bật tiếng</button>
        <button type="button" class="dv2-stream-tvc__skip dv2-stream-tvc__skip--disabled" disabled aria-disabled="true">Bỏ qua (${SKIP_DELAY_SECONDS})</button>
      </div>
    `);

    const video = $overlay.find("video")[0];
    const $unmuteBtn = $overlay.find(".dv2-stream-tvc__unmute");
    const $skipBtn = $overlay.find(".dv2-stream-tvc__skip");
    let finished = false;
    let skipCountdown = SKIP_DELAY_SECONDS;
    let skipCountdownTimer = null;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (skipCountdownTimer) {
        clearInterval(skipCountdownTimer);
        skipCountdownTimer = null;
      }
      video.pause();
      $container.removeClass("dv2-stream-tvc-active");
      $overlay.remove();
      onDone?.();
    };

    const enableSkip = () => {
      $skipBtn
        .prop("disabled", false)
        .attr("aria-disabled", "false")
        .removeClass("dv2-stream-tvc__skip--disabled")
        .text("Bỏ qua");
    };

    skipCountdownTimer = setInterval(() => {
      skipCountdown -= 1;
      if (skipCountdown <= 0) {
        clearInterval(skipCountdownTimer);
        skipCountdownTimer = null;
        enableSkip();
        return;
      }
      $skipBtn.text(`Bỏ qua (${skipCountdown})`);
    }, 1000);

    $skipBtn.on("click", finish);
    video.addEventListener("ended", finish, { once: true });
    let triedFallback = false;

    const onVideoError = (event) => {
      const mediaError = video.error;
      const fallbackUrl = (tvc.fallbackUrl || "").trim();
      const currentSrc = video.currentSrc || video.src;

      if (!triedFallback && fallbackUrl && fallbackUrl !== currentSrc) {
        triedFallback = true;
        console.warn("[DV2 TVC] Primary source failed, trying fallback", {
          src: currentSrc,
          fallbackUrl,
        });
        video.src = fallbackUrl;
        video.load();
        startPlayback();
        return;
      }

      console.warn("[DV2 TVC] Failed to load pre-roll, skipping", {
        src: currentSrc,
        code: mediaError?.code,
        message: mediaError?.message,
        event,
      });
      finish();
    };

    video.addEventListener("error", onVideoError);

    const showUnmuteButton = () => {
      if (finished || !video.muted) return;
      $unmuteBtn.prop("hidden", false).show();
    };

    const unmuteTvc = () => {
      if (finished || !video.muted) return;
      video.muted = false;
      video.volume = 1;
      video.play().catch(() => {});
      $unmuteBtn.remove();
    };

    $unmuteBtn.on("click", (e) => {
      e.stopPropagation();
      unmuteTvc();
    });

    const redirectUrl = (tvc.redirectUrl || "").trim();
    if (redirectUrl) {
      video.classList.add("dv2-stream-tvc__video--clickable");
      video.addEventListener("click", () => {
        window.open(redirectUrl, "_blank", "noopener,noreferrer");
      });
    }

    const startPlayback = () => {
      video.muted = false;
      video.volume = 1;
      return video.play().catch(() => {
        console.warn("[DV2 TVC] Autoplay with sound blocked, retrying muted");
        video.muted = true;
        return video.play().then(showUnmuteButton).catch(() => {
          console.warn("[DV2 TVC] Autoplay blocked, skipping");
          finish();
        });
      });
    };

    $container.addClass("dv2-stream-tvc-active");
    $container.append($overlay);
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.src = tvc.s3Url || tvc.url;
    startPlayback();
  };
})(window.DV2StreamTvc);

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* chitiet.js */
(function(window, $, jQuery, Hls, Swiper) {
// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

$(document).ready(function () {
    if ($(".dv2-layout-ck.dv2-detail-livestream").length > 0) {
        renderDetailMatch_CK();
    }
});

// Hiển thị overlay khi trận đấu chưa diễn ra
function createNotFoundMatchOverlay_CK(match) {
    const kickoff = match?.matchInfo?.kickoff;
    const league = match?.league?.name;
    const homeName = match?.teams?.home?.name || "Home";
    const awayName = match?.teams?.away?.name || "Away";
    const statusMatch = renderStatusMatch_CK(kickoff);
    return $(`
            <div class="dv2-loading">
                Trận đấu ${statusMatch}: <strong>${homeName} - ${awayName}</strong>
                <div class="dv2-load-league">
                    <span>Giải đấu: <strong>${league}</strong></span>
                </div>
                <div class="dv2-load-time">
                    <span>Thời gian: ${getDateLabel_CK(kickoff)}</span>
                    <span>${formatTime_CK(kickoff)}</span>
                </div>
            </div>
        `);
}

function renderDetailMatch_CK() {
    const $videoContainer = $(".dv2-layout-ck.dv2-detail-livestream .dv2-video-wrapper");
    const $detailMatchContainer = $(".dv2-layout-ck.dv2-detail-livestream .dv2-match-info");
    const posterUrl = "https://watch.rkplayer.xyz/img/cakhia.png";

    // Lấy ID livestream từ URL
    const params = new URLSearchParams(window.location.search);
    let matchId = params.get("match");
    if (!matchId) {
        if (typeof DV2_MATCH_ID !== "undefined" && DV2_MATCH_ID) {
            matchId = DV2_MATCH_ID;
        } else {
            matchId = "2y8m4zh54p4zql0";
        }
    }
    if (!matchId) {
        $videoContainer.html('<div class="dv2-notfound-video">❌ Không có ID livestream hợp lệ</div>');
        return;
    }

    console.log("[VSC LIVE] Load livestream detail cho ID:", matchId);

    // Hiển thị overlay loading
    const $loading = $(`
    <div class="dv2-loading">
      Đang tải video...
    </div>
  `);
    $videoContainer.append($loading);

    // Tạo thẻ video
    const $video = $("<video>", {
        id: "liveVideo",
        controls: true,
        autoplay: true,
        muted: true,
        playsinline: true,
        poster: posterUrl,
    });
    $videoContainer.append($video);

    // Gọi API lấy thông tin livestream
    $.ajax({
        url: `https://vsc-apidev.helizones.com/api/data/lives/${matchId}`,
        method: "GET",
        success: function (res) {
            console.log("[VSC LIVE] API response:", res);

            const data = res?.data;
            if (data) {
                $loading.remove();
                // hiển thị chi tiết trận (đội bóng, giải đấu)
                const homeName = data?.teams?.home?.name;
                const awayName = data?.teams?.away?.name;
                const homeLogo = data?.teams?.home?.logo;
                const awayLogo = data?.teams?.away?.logo;
                const leagueName = data?.league?.name;
                const leagueLogo = data?.league?.logo;
                const timeMatch = data?.matchInfo?.kickoff;
                const scoreHome = data?.score?.fulltime?.home;
                const scoreAway = data?.score?.fulltime?.away;
                const detail = `
                <div class="dv2-league">
                    <img class="dv2-league-logo" id="leagueLogo" src="${leagueLogo}" alt="League Logo">
                    <span class="dv2-league-name" id="leagueName">${leagueName}</span>
                </div>
                <div class="dv2-teams">
                    <div class="dv2-team">
                        <img class="dv2-home-logo" id="homeLogo" src="${homeLogo}" alt="Home Team">
                        <span class="dv2-home-name" id="homeName">${homeName}</span>
                    </div>
                    <div class="dv2-score" id="score">${scoreHome} - ${scoreAway}</div>
                    <div class="dv2-team">
                        <img class="dv2-away-logo" id="awayLogo" src="${awayLogo}" alt="Away Team">
                        <span class="dv2-away-name" id="awayName">${awayName}</span>
                    </div>
                </div>
                <div class="dv2-match-time" id="matchTime">Thời gian diễn ra trận đấu: ${getDateLabel_CK(timeMatch)} - ${formatTime_CK(timeMatch)}</div>
            `;
                $detailMatchContainer.append(detail);
            }
            if (!data || !data.livestream) {
                $videoContainer.html('<div class="dv2-not-loaded">🚫 Không có luồng livestream</div>');
                $videoContainer.append($video);
                return;
            }
            // kiểm tra thời gian diễn ra trận đấu có lớn hơn 15 phút không, nếu lớn hơn 15 phút thì hiển thị overlay
            const kickoffTime = new Date(data?.matchInfo?.kickoff);
            const shouldShowPreMatchOverlay =
                !Number.isNaN(kickoffTime.getTime()) &&
                (kickoffTime.getTime() - Date.now()) > 15 * 60 * 1000;

            if (shouldShowPreMatchOverlay) {
                const $overlay = createNotFoundMatchOverlay_CK(data); // tạo overlay theo trận
                $videoContainer.append($overlay);
                return;
            }

            const streamUrl = data?.livestream?.links[0]?.url || "";
            if (!streamUrl) {
                $videoContainer.html('<div class="dv2-not-loaded">Không tìm thấy video livestream</div>');
                return;
            }

            const $dv2StreamLinks  = $(".dv2-stream-links");
            const dv2StreamLinksHtml = Array.isArray(data?.livestream?.links)
            ? data.livestream.links.map((item, indexS) => (
            `<span data-index="${indexS}" data-stream-url=${item.url}>Link ${indexS + 1}</span>`
            ))
            : null;
            $dv2StreamLinks.html(dv2StreamLinksHtml);
            
            $dv2StreamLinks.on("click", "span", function (e) {
                e.preventDefault();
                e.stopPropagation();
                const streamUrlLink = $(this).data("stream-url");
                initHLSPlayer(streamUrlLink);
            }); 

            initHLSPlayer(streamUrl);


        },
        error: function (err) {
            console.error("[VSC LIVE] Lỗi khi gọi API:", err);
            $videoContainer.html('<div class="dv2-not-loaded">Không thể tải dữ liệu livestream</div>');
        }
    });

    let currentHls = null;
    // Hàm init player với retry
    function initHLSPlayer(streamUrl) {
        console.log("[VSC LIVE] Init HLS for:", streamUrl);

        let retryCount = 0;
        const maxRetries = 3;

        if (currentHls) {
            console.log("[VSC LIVE] Destroy old HLS instance");
            try { currentHls.destroy(); } catch (e) { console.warn(e); }
            currentHls = null;
        }

        function setupPlayer() {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    maxBufferLength: 10,
                    liveSyncDuration: 3,
                    enableWorker: true,
                    xhrSetup: function (xhr, url) {
                        // Add any necessary headers or credentials here
                        xhr.withCredentials = false;
                        // Add referrer policy to handle CORS
                        xhr.referrerPolicy = "no-referrer-when-downgrade";
                    },
                });
                currentHls = hls;
                hls.loadSource(streamUrl);
                hls.attachMedia($video[0]);
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    console.log("[VSC LIVE] Manifest loaded — starting playback");
                    $loading.remove();
                    $video[0].muted = true;
                    $video[0].play().catch(() => console.warn("Autoplay bị chặn"));
                });
                hls.on(Hls.Events.ERROR, function (event, data) {
                    if (data.fatal) {
                        console.log("[VSC LIVE] HLS fatal error:", data.type);
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                hls.destroy();
                                retry();
                                break;
                        }
                    }
                });
            } else if ($video[0].canPlayType("application/vnd.apple.mpegurl")) {
                // Safari native
                $video.attr("src", streamUrl);
                $video.on("loadedmetadata", function () {
                    $loading.remove();
                    $video[0].play();
                });
                $video.on("error", retry);
            } else {
                $videoContainer.html(`
                    <div class="dv2-not-loaded">
                        🚫 Trình duyệt không hỗ trợ phát livestream
                    </div>
                    `);
            }
        }

        function retry() {
            if (retryCount < maxRetries) {
                retryCount++;
                console.warn(`[VSC LIVE] Retry lần ${retryCount}/${maxRetries}...`);
                setTimeout(setupPlayer, 3000);
            } else {
                console.error("[VSC LIVE] Hết số lần retry, dừng phát.");
                $loading.text("Không thể tải video, vui lòng thử lại sau.");
            }
        }

        setupPlayer();
    }
}

// Format date theo dạng Hôm nay, 01/11
function getDateLabel_CK(matchDate) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const match = new Date(matchDate);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    match.setHours(0, 0, 0, 0);

    if (match.getTime() === today.getTime()) {
        return 'Hôm nay';
    } else if (match.getTime() === tomorrow.getTime()) {
        return 'Ngày mai';
    } else {
        const day = String(match.getDate()).padStart(2, '0');
        const month = String(match.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    }
}

// Format time theo dạng 00:00
function formatTime_CK(datetime) {
    if (!datetime) return '';
    const date = new Date(datetime);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Hiển thị trạng thái trận đấu đã/đang/sẽ diễn ra
function renderStatusMatch_CK(kickoff) {
    // hiển thị thông tin trận đã/đang/sẽ diễn ra
    const now = new Date();
    // Giới hạn khoảng thời gian trong hôm nay
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // kickoff có thể là string → ép về Date
    const kickoffDate = kickoff instanceof Date ? kickoff : new Date(kickoff);

    // Xác định trạng thái trận đấu
    let matchStatus = '';
    if (kickoffDate > now) {
        // Sắp diễn ra
        const diffMinutes = Math.round((kickoffDate - now) / 60000);
        if (diffMinutes <= 30) {
            matchStatus = 'sắp bắt đầu'; // trong vòng 30 phút
        } else {
            matchStatus = 'chưa diễn ra';
        }
    } else {
        // kickoff <= now → trận đã hoặc đang diễn ra
        const matchEnd = new Date(kickoffDate);
        matchEnd.setHours(matchEnd.getHours() + 2); // giả sử 1 trận ~2h

        if (now <= matchEnd) {
            matchStatus = 'đang diễn ra';
        } else {
            matchStatus = 'đã kết thúc';
        }
    }
    return matchStatus;
}

// Hàm convert DateTime 05/11/2025 15:00
function formatDateTime_CK(isoString) {
    const date = new Date(isoString);

    // Lấy các thành phần thời gian
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}
})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* ket-qua-hom-nay.js */
(function(window, $, jQuery, Hls, Swiper) {
// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

// Init
$(document).ready(function () {
    if ($(".dv2-layout-ck.dv2-result-matchs").length > 0) {
        updateDateTime_CK();
        loadResultsData_CK();
    }
});
// =================================================
// Update current date/time
// =================================================
function updateDateTime_CK() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    $('.dv2-layout-ck.dv2-result-matchs #currentDateTime').text(now.toLocaleDateString('vi-VN', options));
}
// =================================================
// Render results page
// =================================================
function renderResultsPage_CK(matches) {
    const now = new Date();

    // Filter finished matches
    const finishedMatches = matches.filter(match => {
        const kickoff = new Date(match.kickoff);
        const matchEndTime = new Date(kickoff.getTime() + (2 * 60 * 60 * 1000));
        return now > matchEndTime;
    });

    // Sort by kickoff time (newest first)
    finishedMatches.sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));

    const $container = $('.dv2-layout-ck.dv2-result-matchs .dv2-results-container');
    $container.empty();

    if (finishedMatches.length === 0) {
        $container.html(`
                    <div class="dv2-empty-state">
                        <div style="font-size: 56px; margin-bottom: 16px; opacity: 0.3;">⚽</div>
                        <div style="font-size: 15px;">Chưa có trận đấu nào kết thúc</div>
                    </div>
                `);
        return;
    }

    // Group by league
    const grouped = groupMatchesByLeague_CK(finishedMatches);

    Object.keys(grouped).forEach(leagueName => {
        const leagueMatches = grouped[leagueName];
        const leagueLogo = leagueMatches[0]?.league?.logo || '';

        const html = `
                    <div class="dv2-league-section">
                        <div class="dv2-league-header">
                            ${leagueLogo ? `<img src="${leagueLogo}" class="dv2-league-logo" alt="${leagueName}">` : ''}
                            <h3 class="dv2-league-title">${leagueName}</h3>
                        </div>

                        <div class="dv2-match-headers">
                            <div></div>
                            <div>Chủ nhà</div>
                            <div>Tỷ số</div>
                            <div>Khách</div>
                            <div></div>
                            <div>HT | FT</div>
                        </div>

                        ${leagueMatches.map(match => renderMatchCard_CK(match)).join('')}
                    </div>
                `;
        $container.append(html);
    });
}

// =================================================
// Group by league
// =================================================
function groupMatchesByLeague_CK(matches) {
    const grouped = {};
    matches.forEach(match => {
        const leagueName = match?.league?.name || 'Giải đấu khác';
        if (!grouped[leagueName]) {
            grouped[leagueName] = [];
        }
        grouped[leagueName].push(match);
    });
    return grouped;
}

// =================================================
// Render match card
// =================================================
function renderMatchCard_CK(match) {
    const formattedTime = formatMatchTime_CK(match.kickoff);

    const homeTeam = match?.teams?.home || {};
    const awayTeam = match?.teams?.away || {};

    // Scores
    const homeScore = match?.score?.fulltime?.home ?? 0;
    const awayScore = match?.score?.fulltime?.away ?? 0;
    const htHome = match?.score?.halftime?.home ?? 0;
    const htAway = match?.score?.halftime?.away ?? 0;

    // Generate stats
    const stats = generateStats_CK(homeScore, awayScore, htHome, htAway);

    return `
                <div class="dv2-match-card" 
                     data-match-id="${match.match_id || match.id}"
                     onclick="goToMatchDetail('${match.match_id || match.id}')">
                    
                    <!-- Time -->
                    <div class="dv2-time-col">
                        <div class="dv2-match-time">${formattedTime}</div>
                    </div>

                    <!-- Home team -->
                    <div class="dv2-team-home">
                        <div class="dv2-team-name" style="text-align: right;">${homeTeam.name || 'Home'}</div>
                        <div class="dv2-team-logo">
                            <img src="${homeTeam.logo}" 
                                 alt="${homeTeam.name}">
                        </div>
                    </div>

                    <!-- Score -->
                    <div class="dv2-score-col">
                        <div class="dv2-score-box">
                            <div class="dv2-score-number">${homeScore}</div>
                            <div class="dv2-score-separator">:</div>
                            <div class="dv2-score-number">${awayScore}</div>
                        </div>
                        <div class="dv2-halftime">HT ${htHome}:${htAway}</div>
                    </div>

                    <!-- Away team -->
                    <div class="dv2-team-away">
                        <div class="dv2-team-logo">
                            <img src="${awayTeam.logo}" 
                                 alt="${awayTeam.name}">
                        </div>
                        <div class="dv2-team-name">${awayTeam.name || 'Away'}</div>
                    </div>

                    <!-- Highlight button -->
                    <div class="dv2-highlight-col">
                        <button class="dv2-highlight-btn" 
                                onclick="event.stopPropagation(); viewHighlight('${match.match_id}')">
                            XEM HIGHLIGHT
                        </button>
                    </div>

                    <!-- Stats -->
                    <div class="dv2-stats-col">
                        <!-- HT -->
                        <div class="dv2-stat-group">
                            <div class="dv2-stat-main">${htHome} : ${htAway}</div>
                            <div class="dv2-stat-label">HT</div>
                        </div>

                        <!-- HT | FT -->
                        <div class="dv2-stat-group">
                            <div class="dv2-stat-main" style="color: #10b981;">${stats.htFt}</div>
                            <div class="dv2-stat-detail">
                                <span class="dv2-stat-value">${stats.ht1} : ${stats.ft1}</span>
                            </div>
                        </div>

                        <!-- Yellow cards -->
                        <div class="dv2-stat-group">
                            <div class="dv2-stat-main" style="color: #fbbf24;">${stats.yellowTotal}</div>
                            <div class="dv2-stat-detail">
                                <span class="dv2-stat-value">${stats.yellow1} - ${stats.yellow2}</span>
                            </div>
                        </div>

                        <!-- Red cards -->
                        <div class="dv2-stat-group">
                            <div class="dv2-stat-main" style="color: #ef4444;">${stats.redTotal}</div>
                            <div class="dv2-stat-detail">
                                <span class="dv2-stat-value">${stats.red1} - ${stats.red2}</span>
                            </div>
                        </div>

                        <!-- More stats -->
                        <div class="dv2-stat-group">
                            <div class="dv2-stat-detail">
                                <span class="dv2-stat-value">${stats.corner1} - ${stats.corner2}</span>
                            </div>
                            <div class="dv2-stat-detail">
                                <span class="dv2-stat-value">${stats.shot1} - ${stats.shot2}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
}

// =================================================
// Generate stats
// =================================================
function generateStats_CK(homeScore, awayScore, htHome, htAway) {
    return {
        htFt: `${htHome} - ${homeScore}`,
        ht1: Math.floor(Math.random() * 3),
        ft1: Math.floor(Math.random() * 5),
        yellowTotal: Math.floor(Math.random() * 7),
        yellow1: Math.floor(Math.random() * 4),
        yellow2: Math.floor(Math.random() * 4),
        redTotal: Math.floor(Math.random() * 2),
        red1: Math.floor(Math.random() * 2),
        red2: Math.floor(Math.random() * 2),
        corner1: Math.floor(Math.random() * 8),
        corner2: Math.floor(Math.random() * 8),
        shot1: Math.floor(Math.random() * 15),
        shot2: Math.floor(Math.random() * 15)
    };
}

// =================================================
// Format time
// =================================================
function formatMatchTime_CK(datetime) {
    const date = new Date(datetime);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${d}/${m} - ${time}`;
}

// =================================================
// Navigation
// =================================================
function goToMatchDetail(matchId) {
    window.location.href = `/streams/${matchId}`;
}

function viewHighlight(matchId) {
    window.location.href = `/highlights/${matchId}`;
}

// =================================================
// Load data
// =================================================
function loadResultsData_CK() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const payload = {
        fromDate: yesterday.toISOString().split("T")[0],
        toDate: today.toISOString().split("T")[0]
    };

    $.ajax({
        url: 'https://vsc-apidev.helizones.com/api/data/lives/range-date',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.matches_by_date) {
                const allMatches = [];
                Object.keys(response.matches_by_date).forEach(date => {
                    allMatches.push(...response.matches_by_date[date]);
                });
                renderResultsPage_CK(allMatches);
            } else {
                $('.dv2-layout-ck.dv2-result-matchs .dv2-results-container').html('<div class="dv2-empty-state">Không có dữ liệu</div>');
            }
        },
        error: function (err) {
            console.error('Error:', err);
            $('.dv2-layout-ck.dv2-result-matchs .dv2-results-container').html('<div class="dv2-empty-state">Lỗi tải dữ liệu</div>');
        }
    });
}
// Expose required functions to global scope
window.goToMatchDetail = goToMatchDetail;
window.viewHighlight = viewHighlight;
})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* lich-thi-dau-hom-nay.js */
(function(window, $, jQuery, Hls, Swiper) {
$ = jQuery.noConflict();

$(document).ready(() => {
    if ($(".dv2-layout-ck.dv2-calendar-matchs").length > 0) {
        updateDateTime_CK();
        loadHomeMatchesData_CK();
    }
});
function updateDateTime_CK() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    $('.dv2-layout-ck.dv2-calendar-matchs #currentDateTime').text(now.toLocaleDateString('vi-VN', options));
}

function formatMatchTime_CK(datetime) {
    const date = new Date(datetime);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${d}/${m} - ${time}`;
}

function renderHomeMatchCard_CK(match) {
    const kickoff = new Date(match.kickoff);
    const home = match.teams?.home || {};
    const away = match.teams?.away || {};
    const formattedTime = formatMatchTime_CK(kickoff);
    const commentators = match?.livestream?.links;

    return `
                <div class="dv2-match-card" onclick="goToMatchDetail('${match.match_id}')">
                <div class="dv2-time-col">${formattedTime}</div>
                <div class="dv2-teams-col">
                    <div class="dv2-team">
                    <div class="dv2-team-name" style="text-align: right">${home.name}</div>
                    <div class="dv2-team-logo"><img src="${home.logo}" alt="${home.name}"></div>
                    </div>
                    <div class="dv2-vs">vs</div>
                    <div class="dv2-team">
                    <div class="dv2-team-logo"><img src="${away.logo}" alt="${away.name}"></div>
                    <div class="dv2-team-name">${away.name}</div>
                    </div>
                </div>
                ${commentators.length > 0 ? `
                    <div class="dv2-commentators">
                        ${commentators.slice(0, 4).map(blv => `
                            <div class="dv2-commentator" 
                                data-commentator-id="${blv.commentatorId || ''}">
                                <div class="dv2-commentator-avatar">
                                    ${blv.avatar ?
            `<img src="${blv.avatar}" alt="${blv.commentator}">` :
            blv.commentator.charAt(0)
        }
                                </div>
                                <span class="dv2-commentator-name">${blv.commentator}</span>
                            </div>
                        `).join('')}
                        ${commentators.length > 4 ? `<div class="dv2-commentator-more">+${commentators.length - 4}</div>` : ''}
                    </div>
                ` : ''}
                </div>
            `;
}

function groupMatchesByLeague_CK(matches) {
    const grouped = {};
    matches.forEach(m => {
        const name = m.league?.name || 'Giải đấu khác';
        if (!grouped[name]) grouped[name] = [];
        grouped[name].push(m);
    });
    return grouped;
}

// danh sách tất cả các trận đấu hom nay và ngày mai
function renderHomeMatches_CK(matches, filter = 'all') {
    const now = new Date();
    const twoHours = 2 * 60 * 60 * 1000;
    const filtered = matches.filter(m => {
        const kickoff = new Date(m.kickoff);
        const end = new Date(kickoff.getTime() + twoHours);
        if (filter === 'live') return now >= kickoff && now <= end;
        if (filter === 'today') {
            const start = new Date(now); start.setHours(0, 0, 0, 0);
            const endDay = new Date(now); endDay.setHours(23, 59, 59, 999);
            return kickoff > now && kickoff <= endDay;
        }
        return end >= now;
    }).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

    const $c = $('.dv2-layout-ck.dv2-calendar-matchs .dv2-home-container');
    $c.empty();
    if (!filtered.length) {
        $c.html(`<div class="dv2-empty-state">Không có trận đấu</div>`);
        return;
    }

    const grouped = groupMatchesByLeague_CK(filtered);
    Object.keys(grouped).forEach(league => {
        const logo = grouped[league][0]?.league?.logo || '';
        const cards = grouped[league].map(m => renderHomeMatchCard_CK(m)).join('');
        $c.append(`
                    <div class="dv2-league-section">
                        <div class="dv2-league-header">
                        ${logo ? `<img src="${logo}" class="dv2-league-logo">` : ''}
                        <div class="dv2-league-title">${league}</div>
                        </div>
                        ${cards}
                    </div>
                `);
    });
}

// danh sách trận đấu ngày trong tuần (trừ các trận đã diễn ra)
// function renderHomeMatchesCalendar_CK(matches, filter = 'all') {
//     const now = new Date();
//     const twoHours = 2 * 60 * 60 * 1000;
//     const filtered = matches.filter(m => {
//         const kickoff = new Date(m.kickoff);
//         const end = new Date(kickoff.getTime() + twoHours);
//         if (filter === 'live') return now >= kickoff && now <= end;
//         if (filter === 'today') {
//             const start = new Date(now); start.setHours(0, 0, 0, 0);
//             const endDay = new Date(now); endDay.setHours(23, 59, 59, 999);
//             return kickoff > now && kickoff <= endDay;
//         }
//         return end >= now;
//     }).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

//     const $c = $('.dv2-layout-ck.dv2-calendar-matchs .dv2-home-container');
//     $c.empty();
//     if (!filtered.length) {
//         $c.html(`<div class="dv2-empty-state">Không có trận đấu</div>`);
//         return;
//     }

//     const grouped = groupMatchesByLeague_CK(filtered);
//     Object.keys(grouped).forEach(league => {
//         const logo = grouped[league][0]?.league?.logo || '';
//         const cards = grouped[league].map(m => renderHomeMatchCard_CK(m)).join('');
//         $c.append(`
//                     <div class="dv2-league-section">
//                         <div class="dv2-league-header">
//                         ${logo ? `<img src="${logo}" class="dv2-league-logo">` : ''}
//                         <div class="dv2-league-title">${league}</div>
//                         </div>
//                         ${cards}
//                     </div>
//                 `);
//     });
// }

function goToMatchDetail(id) {
    window.location.href = `/streams/${id}`;
}

function loadHomeMatchesData_CK() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const payload = {
        fromDate: today.toISOString().split("T")[0],
        toDate: tomorrow.toISOString().split("T")[0]
    };
    $.ajax({
        url: 'https://vsc-apidev.helizones.com/api/data/lives/range-date',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: res => {
            if (res && res.matches_by_date) {
                const all = [];
                Object.keys(res.matches_by_date).forEach(d => all.push(...res.matches_by_date[d]));
                renderHomeMatches_CK(all);
            } else $('.dv2-layout-ck.dv2-calendar-matchs .dv2-home-container').html('<div class="dv2-empty-state">Không có dữ liệu</div>');
        },
        error: () => $('.dv2-layout-ck.dv2-calendar-matchs .dv2-home-container').html('<div class="dv2-empty-state">Lỗi tải dữ liệu</div>')
    });
}
// Expose required functions to global scope
window.goToMatchDetail = goToMatchDetail;
})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* trangchu.js */
(function(window, $, jQuery, Hls, Swiper) {
// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

$(document).ready(function () {
    if ($(".dv2-layout-ck.dv2-home-matchs").length > 0) {
        renderListMatchs_CK();
    }
});

let currentIndex_CK = 0;
let filteredMatchesGlobal_CK = [];

function renderListMatchs_CK() {
    const $listContainer = $(".dv2-layout-ck.dv2-home-matchs");
    const $liveVideoGrid = $listContainer.find(".dv2-match-grid");

    // nếu đã có loading thì không append thêm
    if ($listContainer.find('.dv2-loading').length === 0) {
        $listContainer.append(`
            <div class="dv2-loading">
                <div class="dv2-spinner"></div>
            </div>
        `);
    }

    const today = new Date();
    const toDate = new Date();
    toDate.setDate(today.getDate() + 7);

    const payload = {
        fromDate: today.toISOString().split("T")[0],
        toDate: toDate.toISOString().split("T")[0]
    };

    $.ajax({
        url: "https://vsc-apidev.helizones.com/api/data/lives/range-date",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(payload),
        dataType: "json",
        success: function (res) {
            // remove loading ngay khi có response
            $listContainer.find('.dv2-loading').remove();

            const matches = [];
            Object.values(res.matches_by_date || {}).forEach(dayMatches => {
                if (Array.isArray(dayMatches)) matches.push(...dayMatches);
            });

            if (!matches.length) {
                $liveVideoGrid.html('<div class="dv2-empty-state">Không có trận đấu nào trong 7 ngày tới</div>');
                return;
            }

            const normalizedMatches = matches.map(match => {
                const kickoff = match.kickoff ? new Date(match.kickoff) : null;
                const MATCH_DURATION_MINUTES = 120;
                const endTime = kickoff ? new Date(kickoff.getTime() + MATCH_DURATION_MINUTES * 60 * 1000) : null;
                const now = new Date();
                let status = 'Sắp diễn ra';

                if (kickoff && now >= kickoff && now <= endTime && match.livestream.available) status = 'LIVE';
                else if (kickoff && now > endTime) status = 'Kết thúc';

                return {
                    id: match.match_id,
                    slug: match.slug || "",
                    homeLogo: match?.teams?.home?.logo || "",
                    awayLogo: match?.teams?.away?.logo || "",
                    homeName: match?.teams?.home?.name || "Đội nhà",
                    awayName: match?.teams?.away?.name || "Đội khách",
                    kickoff: kickoff,
                    league: match?.league?.name || "Giải đấu",
                    leagueLogo: match?.league?.logo || '',
                    livestream: match.livestream,
                    links: match?.livestream?.links || [],
                    scoreHalftime: match?.score?.halftime || { home: '-', away: '-' },
                    scoreFulltime: match?.score?.fulltime || { home: '-', away: '-' },
                    status
                };
            });

            // Filter and sort matches
            const now = new Date();
            const liveMatches = [];
            const upcomingMatches = [];

            normalizedMatches.forEach(match => {
                const kickoff = new Date(match.kickoff);
                const matchEndTime = new Date(kickoff.getTime() + (2 * 60 * 60 * 1000));

                if (now >= kickoff && now <= matchEndTime && match.livestream.available) {
                    liveMatches.push(match);
                } else if (now < kickoff) {
                    upcomingMatches.push(match);
                }
            });

            // Combine: live first, then upcoming
            const allMatches = [...liveMatches, ...upcomingMatches];

            updateFilterCounts_CK(allMatches);
            setupFilterButtons_CK(allMatches);

            renderHomeMatches_CK(allMatches, 'live');
        },
        error: function (err) {
            console.error("[VSC LIVE] API error:", err);
            $liveVideoGrid.html('<div class="dv2-empty-state">Lỗi khi tải dữ liệu</div>');
        }
    });
}

// Cập nhật tổng số trận cho từng filter
function updateFilterCounts_CK(matches) {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(todayStart); weekEnd.setDate(todayStart.getDate() + 7);

    const counts = {
        all: matches.filter(m => m.kickoff >= todayStart && m.kickoff <= weekEnd).length,
        live: matches.filter(m => m.status === 'LIVE').length,
        today: matches.filter(m => m.kickoff >= todayStart && m.kickoff <= todayEnd).length
    };

    $('.dv2-layout-ck.dv2-home-matchs .dv2-filter-btn[data-filter="all"]').text(`Tất cả (${counts.all})`);
    $('.dv2-layout-ck.dv2-home-matchs .dv2-filter-btn[data-filter="live"]').text(`Đang live (${counts.live})`);
    $('.dv2-layout-ck.dv2-home-matchs .dv2-filter-btn[data-filter="today"]').text(`Hôm nay (${counts.today})`);
}

// filter theo trạng thái
function setupFilterButtons_CK(matches) {
    $('.dv2-layout-ck.dv2-home-matchs .dv2-filter-btn').off('click').on('click', function () {
        $('.dv2-layout-ck.dv2-home-matchs .dv2-filter-btn').removeClass('dv2-active');
        $(this).addClass('dv2-active');
        const filter = $(this).data('filter');
        renderHomeMatches_CK(matches, filter);
    });
}

function renderHomeMatches_CK(matches, filter = 'all') {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(todayStart); weekEnd.setDate(todayStart.getDate() + 7);

    let filteredMatches = matches.filter(match => {
        if (filter === 'live') return match.status === 'LIVE';
        if (filter === 'today') return match.kickoff >= todayStart && match.kickoff <= todayEnd;
        if (filter === 'all') return match.kickoff >= todayStart && match.kickoff <= weekEnd;
        return true;
    });

    filteredMatches.sort((a, b) => {
        if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
        if (a.status !== 'LIVE' && b.status === 'LIVE') return 1;
        return new Date(a.kickoff) - new Date(b.kickoff);
    });

    filteredMatchesGlobal_CK = filteredMatches;
    currentIndex_CK = 0;

    const $c = $('.dv2-layout-ck.dv2-home-matchs .dv2-match-grid');
    $c.empty();

    if (!filteredMatches.length) {
        $c.html(`<div class="dv2-empty-state">
                        <div style="font-size: 56px; opacity: 0.3;">⚽</div>
                        <div style="font-size: 15px;">Không có trận đấu nào</div>
                    </div>`);
        $('.dv2-loadmore').hide();
        return;
    }

    renderNextMatchesBatch_CK();

    $('.dv2-layout-ck.dv2-home-matchs .dv2-load-more-btn').off('click').on('click', renderNextMatchesBatch_CK);
}

function renderNextMatchesBatch_CK() {
    const $c = $('.dv2-layout-ck.dv2-home-matchs .dv2-match-grid');
    const limit = 10;
    const nextBatch = filteredMatchesGlobal_CK.slice(currentIndex_CK, currentIndex_CK + limit);

    nextBatch.forEach(match => {
        const $card = $(renderMatchCard_CK(match));
        $c.append($card);
        setTimeout(() => $card.addClass('fade-in'), 50);
    });

    currentIndex_CK += nextBatch.length;

    if (currentIndex_CK >= filteredMatchesGlobal_CK.length) {
        $('.dv2-layout-ck.dv2-home-matchs .dv2-loadmore').fadeOut(200);
    } else {
        $('.dv2-layout-ck.dv2-home-matchs .dv2-loadmore').show();
    }
}

function renderMatchCard_CK(match) {
    const matchDateTime = match.kickoff || '';
    const dateLabel = getDateLabel_CK(matchDateTime);
    const timeLabel = matchDateTime ? formatTime_CK(matchDateTime) : '';
    const statusClass = match.status === 'LIVE' ? 'dv2-status-live' : (match.status === 'Sắp diễn ra' ? 'dv2-status-scheduled' : 'dv2-status-finished');

    return `
        <div class="dv2-match-card" data-id="${match.id}">
            <div class="dv2-match-header">
                <div class="dv2-league-info">
                    <span class="dv2-league-name">${match.league}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="dv2-match-status ${statusClass}">
                        ${match.status === 'LIVE' ? '● LIVE' : match.status === 'Sắp diễn ra' ? 'Sắp diễn ra' : 'Kết thúc'}
                    </span>
                    <span class="dv2-match-time">${dateLabel} - ${timeLabel}</span>
                </div>
            </div>
            <div class="dv2-match-content">
                <div class="dv2-team">
                    <div class="dv2-team-logo"><img src="${match.homeLogo}" alt="${match.homeName}"></div>
                    <div class="dv2-team-name">${match.homeName}</div>
                </div>
                <div class="dv2-score-section">
                    <div class="dv2-score">
                        <div class="dv2-score-number">${match.scoreFulltime.home}</div>
                        <div class="dv2-score-separator">:</div>
                        <div class="dv2-score-number">${match.scoreFulltime.away}</div>
                    </div>
                    <div class="dv2-half-time">HT ${match.scoreHalftime.home} - ${match.scoreHalftime.away}</div>
                </div>
                <div class="dv2-team dv2-away">
                    <div class="dv2-team-logo"><img src="${match.awayLogo}" alt="${match.awayName}"></div>
                    <div class="dv2-team-name">${match.awayName}</div>
                </div>
            </div>
            <div class="dv2-blv-box">
                ${(match?.links || []).map(blv => `
                    <a class="dv2-bottom-group" href="#" data-id="${match.id}">
                        <span class="dv2-bottom-logo">
                            <img class="dv2-image-blv" alt="${blv.commentator}"
                                src="${blv.avatar}">
                        </span>
                        <span class="dv2-bottom-name dv2-ellipsis">${blv.commentator}</span>
                    </a>
                `).join('')}
            </div>
        </div>
    `;
}

// Hàm xử lý vào xem chi tiết trận đấu
$(document).on('click', '.dv2-layout-ck.dv2-home-matchs .dv2-match-card', function (e) {
    e.preventDefault();
    const $btn = $(this);
    const matchId = $btn.data('id') || '';
    // redirect to livestream page
    window.location.href = `/streams/${matchId}`;
});

function formatTime_CK(datetime) {
    if (!datetime) return '';
    const date = new Date(datetime);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getDateLabel_CK(matchDate) {
    if (!matchDate) return '';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const match = new Date(matchDate); match.setHours(0, 0, 0, 0);

    return `${String(match.getDate()).padStart(2, '0')}/${String(match.getMonth() + 1).padStart(2, '0')}`;
}

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* chitiet.js */
(function(window, $, jQuery, Hls, Swiper) {
// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

$(document).ready(function () {
    if ($(".dv2-layout-ls.dv2-streaming-ctn").length > 0) {
        renderDetailMatch_LS();
    }
});

function renderDetailMatch_LS() {
    const $videoContainer = $(".dv2-layout-ls.dv2-streaming-ctn .dv2-video-container");
    const $detailMatchContainer = $(".dv2-layout-ls.dv2-streaming-ctn .dv2-detail-match");
    const posterUrl = "https://luongson.io/wp-content/uploads/2025/10/bxh-ty-le-thang-hieu-suat-ghi-ban-tat-ca-trong-mot-cu-cham-tai-luongson-tv.jpg";

    // Lấy ID livestream từ URL
    const params = new URLSearchParams(window.location.search);
    let matchId = params.get("match");
    if (!matchId) {
        if (typeof DV2_MATCH_ID !== "undefined" && DV2_MATCH_ID) {
            matchId = DV2_MATCH_ID;
        } else {
            matchId = "2y8m4zh54p4zql0";
        }
    }
    if (!matchId) {
        $videoContainer.html('<div class="dv2-notfound-video">❌ Không có ID livestream hợp lệ</div>');
        return;
    }

    console.log("[VSC LIVE] Load livestream detail cho ID:", matchId);

    // Hiển thị overlay loading
    const $loading = $(`
    <div class="dv2-loading">
      Đang tải video...
    </div>
  `);
    $videoContainer.append($loading);

    // Tạo thẻ video
    const $video = $("<video>", {
        id: "liveVideo",
        controls: true,
        autoplay: true,
        muted: true,
        playsinline: true,
        poster: posterUrl,
    });
    $videoContainer.append($video);

    // Gọi API lấy thông tin livestream
    $.ajax({
        url: `https://vsc-apidev.helizones.com/api/data/lives/${matchId}`,
        method: "GET",
        success: function (res) {
            console.log("[VSC LIVE] API response:", res);
            $loading.remove();
            const data = res?.data;
            // hiển thị chi tiết trận (đội bóng, giải đấu)
            const homeName = data?.teams?.home?.name;
            const awayName = data?.teams?.away?.name;
            const leagueName = data?.league?.name;
            const timeMatch = data?.matchInfo?.kickoff;
            const scoreHome = data?.score?.fulltime?.home;
            const scoreAway = data?.score?.fulltime?.away;
            const detailMatch = `Trận đấu giữa <strong>${homeName}</strong> và <strong>${awayName}</strong> thuộc khuôn khổ
                        <strong>${leagueName}</strong> sẽ diễn ra vào lúc <strong>${formatDateTime_LS(timeMatch)}</strong>`;
            const detail = `
                <h1 class="dv2-name-match">Trực tiếp ${homeName} vs ${awayName} - ${leagueName} </h1>
                <div class="dv2-live-match">
                    ${detailMatch}
                </div>
                <div class="dv2-blv-match">
                    <span>Bình luận viên: <strong>NHÀ ĐÀI</strong></span>
                </div>
                <div class="dv2-score-match">
                    <span>Tỉ số hiện tại: <strong>${scoreHome} - ${scoreAway}</strong></span>
                </div>
            `;
            
            $detailMatchContainer.append(detail);
            $('.dv2-detail-match-info').html(detailMatch);
            if (!data || !data.livestream) {
                $videoContainer.html('<div class="dv2-not-loaded">🚫 Không có luồng livestream</div>');
                $videoContainer.append($video);
                return;
            }
            // kiểm tra thời gian diễn ra trận đấu có lớn hơn 15 phút không, nếu lớn hơn 15 phút thì hiển thị overlay
            const kickoffTime = new Date(data?.matchInfo?.kickoff);
            const shouldShowPreMatchOverlay =
                !Number.isNaN(kickoffTime.getTime()) &&
                (kickoffTime.getTime() - Date.now()) > 15 * 60 * 1000;

            if (shouldShowPreMatchOverlay) {
                const $overlay = createNotFoundMatchOverlay_LS(data); // tạo overlay theo trận
                $videoContainer.append($overlay);
                return;
            }

            const streamUrl = data?.livestream?.links[0]?.url || "";
            if (!streamUrl) {
                $videoContainer.html('<div class="dv2-not-loaded">Không tìm thấy video livestream</div>');
                return;
            }

            const $dv2StreamLinks  = $(".dv2-stream-links");
            const dv2StreamLinksHtml = Array.isArray(data?.livestream?.links)
            ? data.livestream.links.map((item, indexS) => (
            `<span data-index="${indexS}" data-stream-url="${item.url}">Link ${indexS + 1}</span>`
            ))
            : null;
            $dv2StreamLinks.html(dv2StreamLinksHtml);
            
            $dv2StreamLinks.on("click", "span", function (e) {
                e.preventDefault();
                e.stopPropagation();
                const streamUrlLink = $(this).data("stream-url");
                initHLSPlayer(streamUrlLink);
            });

            initHLSPlayer(streamUrl);

        },
        error: function (err) {
            console.error("[VSC LIVE] Lỗi khi gọi API:", err);
            $videoContainer.html('<div class="dv2-not-loaded">Không thể tải dữ liệu livestream</div>');
        }
    });

    let currentHls = null;
    // Hàm init player với retry
    function initHLSPlayer(streamUrl) {
        console.log("[VSC LIVE] Init HLS for:", streamUrl);

        if (currentHls) {
            console.log("[VSC LIVE] Destroy old HLS instance");
            try { currentHls.destroy(); } catch (e) { console.warn(e); }
            currentHls = null;
        }

        let retryCount = 0;
        const maxRetries = 3;

        function setupPlayer() {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    maxBufferLength: 10,
                    liveSyncDuration: 3,
                    enableWorker: true,
                    xhrSetup: function (xhr, url) {
                        // Add any necessary headers or credentials here
                        xhr.withCredentials = false;
                        // Add referrer policy to handle CORS
                        xhr.referrerPolicy = "no-referrer-when-downgrade";
                    },
                });
                currentHls = hls; 
                hls.loadSource(streamUrl);
                hls.attachMedia($video[0]);
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    console.log("[VSC LIVE] Manifest loaded — starting playback");
                    $loading.remove();
                    $video[0].muted = true;
                    $video[0].play().catch(() => console.warn("Autoplay bị chặn"));
                });
                hls.on(Hls.Events.ERROR, function (event, data) {
                    if (data.fatal) {
                        console.log("[VSC LIVE] HLS fatal error:", data.type);
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                hls.destroy();
                                retry();
                                break;
                        }
                    }
                });
            } else if ($video[0].canPlayType("application/vnd.apple.mpegurl")) {
                // Safari native
                $video.attr("src", streamUrl);
                $video.on("loadedmetadata", function () {
                    $loading.remove();
                    $video[0].play();
                });
                $video.on("error", retry);
            } else {
                $videoContainer.html(`
                    <div class="dv2-not-loaded">
                        🚫 Trình duyệt không hỗ trợ phát livestream
                    </div>
                    `);
            }
        }

        function retry() {
            if (retryCount < maxRetries) {
                retryCount++;
                console.warn(`[VSC LIVE] Retry lần ${retryCount}/${maxRetries}...`);
                setTimeout(setupPlayer, 3000);
            } else {
                console.error("[VSC LIVE] Hết số lần retry, dừng phát.");
                $loading.text("Không thể tải video, vui lòng thử lại sau.");
            }
        }

        setupPlayer();
    }
}
// Hiển thị overlay khi trận đấu chưa diễn ra
function createNotFoundMatchOverlay_LS(match) {
    const kickoff = match?.matchInfo?.kickoff;
    const league = match?.league?.name;
    const homeName = match?.teams?.home?.name || "Home";
    const awayName = match?.teams?.away?.name || "Away";
    const statusMatch = renderStatusMatch_LS(kickoff);
    return $(`
            <div class="dv2-loading">
                Trận đấu ${statusMatch}: <strong>${homeName} - ${awayName}</strong>
                <div class="dv2-load-league">
                    <span>Giải đấu: <strong>${league}</strong></span>
                </div>
                <div class="dv2-load-time">
                    <span>Thời gian: ${getDateLabel_LS(kickoff)}</span>
                    <span>${formatTime_LS(kickoff)}</span>
                </div>
            </div>
        `);
}

// Format date theo dạng Hôm nay, 01/11
function getDateLabel_LS(matchDate) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const match = new Date(matchDate);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    match.setHours(0, 0, 0, 0);

    if (match.getTime() === today.getTime()) {
        return 'Hôm nay';
    } else if (match.getTime() === tomorrow.getTime()) {
        return 'Ngày mai';
    } else {
        const day = String(match.getDate()).padStart(2, '0');
        const month = String(match.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    }
}

// Format time theo dạng 00:00
function formatTime_LS(datetime) {
    if (!datetime) return '';
    const date = new Date(datetime);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Hiển thị trạng thái trận đấu đã/đang/sẽ diễn ra
function renderStatusMatch_LS(kickoff) {
    // hiển thị thông tin trận đã/đang/sẽ diễn ra
    const now = new Date();
    // Giới hạn khoảng thời gian trong hôm nay
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // kickoff có thể là string → ép về Date
    const kickoffDate = kickoff instanceof Date ? kickoff : new Date(kickoff);

    // Xác định trạng thái trận đấu
    let matchStatus = '';
    if (kickoffDate > now) {
        // Sắp diễn ra
        const diffMinutes = Math.round((kickoffDate - now) / 60000);
        if (diffMinutes <= 30) {
            matchStatus = 'sắp bắt đầu'; // trong vòng 30 phút
        } else {
            matchStatus = 'chưa diễn ra';
        }
    } else {
        // kickoff <= now → trận đã hoặc đang diễn ra
        const matchEnd = new Date(kickoffDate);
        matchEnd.setHours(matchEnd.getHours() + 2); // giả sử 1 trận ~2h

        if (now <= matchEnd) {
            matchStatus = 'đang diễn ra';
        } else {
            matchStatus = 'đã kết thúc';
        }
    }
    return matchStatus;
}

// Hàm convert DateTime 05/11/2025 15:00
function formatDateTime_LS(isoString) {
    const date = new Date(isoString);

    // Lấy các thành phần thời gian
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}
})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* trangchu.js */
(function(window, $, jQuery, Hls, Swiper) {
// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();
// Gọi các hàm khi DOM load xong
$(document).ready(function () {
    if ($(".dv2-layout-ls.dv2-list-video-ctn .dv2-content-ctn").length) {
        renderFeaturedStreamBlock_LS();
    }
});

let currentIndex_LS = 0;
let filteredMatchesGlobal_LS = [];
const limit = 12
// ========================================
// Hiển thị video livestream trận đấu
// ========================================
function renderFeaturedStreamBlock_LS() {
    const $listContainer = $(".dv2-layout-ls.dv2-list-video-ctn .dv2-content-ctn");
    const $liveVideoGrid = $listContainer.find(".dv2-matchs-grid");

    // Hiển thị loading spinner lúc mới load
    // nếu đã có loading thì không append thêm
    if ($listContainer.find('.dv2-loading').length === 0) {
        $listContainer.append(`
            <div class="dv2-loading">
                <div class="dv2-spinner"></div>
            </div>
        `);
    }

    // Lấy dữ liệu 7 ngày từ hôm nay
    const today = new Date();
    const toDate = new Date();
    toDate.setDate(today.getDate() + 7);

    const payload = {
        fromDate: today.toISOString().split("T")[0],
        toDate: toDate.toISOString().split("T")[0],
    };

    $.ajax({
        url: "https://vsc-apidev.helizones.com/api/data/lives/range-date",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(payload),
        dataType: "json",
        success: function (res) {
            // remove loading ngay khi có response
            $listContainer.find('.dv2-loading').remove();

            // Gom tất cả trận đấu trong matches_by_date
            const matches = [];
            Object.values(res.matches_by_date || {}).forEach(dayMatches => {
                if (Array.isArray(dayMatches)) matches.push(...dayMatches);
            });

            if (!matches.length) {
                $liveVideoGrid.html('<div class="no-match">Không có trận đấu trong 7 ngày tới</div>');
                // hide/remove load more nếu có
                $listContainer.find(".dv2-load-more").hide();
                return;
            }

            // Chuẩn hóa dữ liệu và xác định status chính xác
            const normalized = matches.map(match => {
                const kickoff = match.kickoff ? new Date(match.kickoff) : null;
                const MATCH_DURATION_MINUTES = 120;
                const now = new Date();
                let status = "Sắp diễn ra";
                if (kickoff) {
                    const endTime = new Date(kickoff.getTime() + MATCH_DURATION_MINUTES * 60 * 1000);
                    if (now >= kickoff && now <= endTime && match.livestream.available) status = "LIVE";
                    else if (now > endTime) status = "Kết thúc";
                }

                const url = `${window.location.origin}/detail/?match=${match.match_id}`;

                return {
                    id: match.match_id,
                    slug: match.slug || "",
                    url,
                    homeLogo: match?.teams?.home?.logo || "",
                    awayLogo: match?.teams?.away?.logo || "",
                    homeName: match?.teams?.home?.name || "Đội nhà",
                    awayName: match?.teams?.away?.name || "Đội khách",
                    kickoff,
                    league: match?.league?.name || "Giải đấu",
                    livestream: match?.livestream,
                    links: match?.livestream?.links || [],
                    status,
                };
            });

            // Filter and sort matches
            const now = new Date();
            const liveMatches = [];
            const upcomingMatches = [];

            normalized.forEach(match => {
                const kickoff = new Date(match.kickoff);
                const matchEndTime = new Date(kickoff.getTime() + (2 * 60 * 60 * 1000));

                if (now >= kickoff && now <= matchEndTime && match.livestream.available) {
                    liveMatches.push(match);
                } else if (now < kickoff) {
                    upcomingMatches.push(match);
                }
            });

            // Combine: live first, then upcoming
            const allMatches = [...liveMatches, ...upcomingMatches];
            // cập nhật counts nếu bạn có filter buttons (nếu có)
            updateFilterCounts_LS && typeof updateFilterCounts_LS === 'function' && updateFilterCounts_LS(allMatches);

            // setup filter buttons nếu có
            setupFilterButtons_LS && typeof setupFilterButtons_LS === 'function' && setupFilterButtons_LS(allMatches);

            // default render all
            renderHomeMatches_LS(allMatches, "live");
        },
        error: function (err) {
            console.error("[VSC LIVE] API error:", err);
            // remove loading khi lỗi để không treo spinner
            $listContainer.find('.dv2-loading').remove();
            $liveVideoGrid.html('<div class="error">Lỗi khi tải dữ liệu</div>');
            $listContainer.find(".dv2-load-more").hide();
        },
    });
}

// updateFilterCounts_LS (nếu muốn hiển thị số lượng trên tab)
function updateFilterCounts_LS(matches) {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(todayStart); weekEnd.setDate(todayStart.getDate() + 7);

    const counts = {
        all: matches.filter(m => m.kickoff && m.kickoff >= todayStart && m.kickoff <= weekEnd).length,
        live: matches.filter(m => m.status === "LIVE").length,
        today: matches.filter(m => m.kickoff && m.kickoff >= todayStart && m.kickoff <= todayEnd).length
    };

    // nếu bạn có các nút .dv2-filter-btn, cập nhật text
    $('.dv2-filter-btn[data-filter="all"]').text(`Tất cả (${counts.all})`);
    $('.dv2-filter-btn[data-filter="live"]').text(`Đang Live (${counts.live})`);
    $('.dv2-filter-btn[data-filter="today"]').text(`Hôm nay (${counts.today})`);
}

function setupFilterButtons_LS(matches) {
    // đảm bảo selector match structure (class 'dv2-filter-btn' có trên trang)
    $('.dv2-filter-btn').off('click').on('click', function () {
        $('.dv2-filter-btn').removeClass('dv2-active');
        $(this).addClass('dv2-active');
        const filter = $(this).data('filter');
        renderHomeMatches_LS(matches, filter);
    });
}

function renderHomeMatches_LS(matches, filter = "all") {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(todayStart); weekEnd.setDate(todayStart.getDate() + 7);

    let filteredMatches = matches.filter(match => {
        if (!match.kickoff && filter !== 'all' && filter !== 'today' && filter !== 'live') return false;
        if (filter === "live") return match.status === "LIVE";
        if (filter === "today") return match.kickoff && match.kickoff >= todayStart && match.kickoff <= todayEnd;
        if (filter === "all") return match.kickoff && match.kickoff >= todayStart && match.kickoff <= weekEnd;
        return true;
    });

    filteredMatches.sort((a, b) => {
        if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
        if (a.status !== 'LIVE' && b.status === 'LIVE') return 1;
        return new Date(a.kickoff) - new Date(b.kickoff);
    });

    filteredMatchesGlobal_LS = filteredMatches;
    currentIndex_LS = 0;

    const $listContainer = $(".dv2-layout-ls.dv2-list-video-ctn .dv2-content-ctn");
    const $liveVideoGrid = $listContainer.find(".dv2-matchs-grid");
    $liveVideoGrid.empty();

    if (!filteredMatches.length) {
        $liveVideoGrid.html(`<div class="dv2-empty-state">
                                <div style="font-size: 56px; opacity: 0.3;">⚽</div>
                                <div style="font-size: 15px;">Không có trận đấu nào</div>
                            </div>`);
        $listContainer.find(".dv2-load-more").hide();
        return;
    }

    // remove previous load-more button to avoid duplicates
    $listContainer.find(".dv2-load-more").hide();

    renderNextMatches_LS();

    // thêm nút xem thêm nếu cần
    if (filteredMatchesGlobal_LS.length > limit) {
        $listContainer.find(".dv2-load-more-btn").off('click').on('click', renderNextMatches_LS);
    }
}

function renderNextMatches_LS() {
    const $listContainer = $(".dv2-layout-ls.dv2-list-video-ctn .dv2-content-ctn");
    const $liveVideoGrid = $listContainer.find(".dv2-matchs-grid");

    const nextBatch = filteredMatchesGlobal_LS.slice(currentIndex_LS, currentIndex_LS + limit);

    nextBatch.forEach((match, index) => {
        const isLive = match.status === "LIVE";

        const kickoffHtml = isLive
            ? `<div class="dv2-top-inlive">
                    <span class="dv2-top-inlive-live">
                        <img decoding="async" src="data:image/webp;base64,UklGRhACAABXRUJQVlA4WAoAAAASAAAAFwAAFwAAQU5JTQYAAAAAAAAAAABBTk1GPAAAAAAAAAAAABcAABcAADIAAAJWUDhMIwAAAC8XwAUQDzD/8z//8x/wUNC2DVNg5Y/sbggi+j8BsAyYvYQEAEFOTUY2AAAAAQAAAQAAEwAABwAAMgAAAlZQOEwdAAAALxPAARAPMP/zP//zH/AQkBAe+P9XNkT0fwJI8SQAQU5NRjQAAAABAAABAAATAAAFAAAyAAACVlA4TBwAAAAvE0ABEA8w//M///Mf8BCQEB74/1c2RPR/Akg9QU5NRjQAAAABAAABAAATAAAFAAAyAAACVlA4TBwAAAAvE0ABEA8w//M///Mf8BCQEB74/1c2RPR/Akg9QU5NRjQAAAABAAABAAATAAAHAAAyAAACVlA4TBsAAAAvE8ABEA8w//M///Mf8BAIJBnsLzxDRP9DpgUAQU5NRjYAAAABAAABAAATAAAHAAAyAAACVlA4TB0AAAAvE8ABEA8w//M///Mf8BCQEB74/1c2RPR/AmiPCQBBTk1GNAAAAAEAAAIAABMAAAUAADIAAAJWUDhMHAAAAC8TQAEQDzD/8z//8x/wEJAQHvj/VzZE9H8CaB1BTk1GNAAAAAEAAAIAABMAAAUAADIAAAJWUDhMHAAAAC8TQAEQDzD/8z//8x/wEJAQHvj/VzZE9H8CwNE=" alt="" class="h-3 w-2.5 object-contain">
                        <span>Live</span>
                    </span>
                </div>`
            : `<div class="dv2-kickoff">
                    <span class="dv2-kickoff-time">${match.kickoff ? formatTime_LS(match.kickoff) : ''}</span>
               </div>`;

        const commentatorsHtml = (match.links || []).map(blv => `
            <a class="dv2-bottom-group" href="#" data-id="${match.id}">
                <span class="dv2-bottom-logo">
                    <img class="aspect-square h-full w-full object-cover" alt="${blv.commentator}" src="${blv.avatar}">
                </span>
                <span class="dv2-bottom-name ellipsis">${blv.commentator}</span>
            </a>
        `).join("");

        const $matchItem = $(`
            <div class="dv2-match-item" data-index="${currentIndex_LS + index}" data-id="${match.id}">
                <a class="dv2-top" href="${match.url}">
                    <div class="dv2-top_time">
                        <span class="dv2-ellipsis dv2-league">${match.league}</span>
                        ${kickoffHtml}
                    </div>
                    <div class="dv2-top_team">
                        <div class="dv2-top_team_home">
                            <div class="dv2-top_team_home_logo">
                                <img src="${match.homeLogo}" alt="${match.homeName}">
                            </div>
                            <p class="dv2-top_name ellipsis">${match.homeName}</p>
                        </div>
                        <div class="dv2-top_vs"><span class="vs">VS</span></div>
                        <div class="dv2-top_team_away">
                            <div class="dv2-top_team_home_logo">
                                <img src="${match.awayLogo}" alt="${match.awayName}">
                            </div>
                            <p class="dv2-top_name dv2-ellipsis">${match.awayName}</p>
                        </div>
                    </div>
                </a>
                <div class="dv2-bottom">
                    <div class="dv2-bottom-commentators">
                        ${commentatorsHtml}
                    </div>
                </div>
            </div>
        `);

        // append + fadeIn
        $matchItem.hide().appendTo($liveVideoGrid).fadeIn(300);
    });

    currentIndex_LS += nextBatch.length;

    // Ẩn/hiện load more
    if (currentIndex_LS >= filteredMatchesGlobal_LS.length) {
        $listContainer.find(".dv2-load-more").fadeOut(300, function () {
            $(this).hide();
        });
    } else {
        $listContainer.find(".dv2-load-more").show();
    }
}

// Phân loại & lấy danh sách trận đang và sắp diễn ra
function getListMatchsNextTime_LS(matchs) {
    const now = new Date();

    // Xác định mốc đầu và cuối của ngày hôm nay
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Giả định 1 trận kéo dài 2 tiếng (có thể chỉnh tuỳ theo thực tế)
    const MATCH_DURATION_MINUTES = 120;

    const liveMatches = [];
    const upcomingMatches = [];

    matchs.forEach(match => {
        const kickoff = match.kickoff ? new Date(match.kickoff) : null;
        if (!kickoff) return;

        const endTime = new Date(kickoff.getTime() + MATCH_DURATION_MINUTES * 60 * 1000);

        // Chỉ xét các trận đấu trong hôm nay
        if (kickoff >= todayStart && kickoff <= todayEnd) {
            if (now >= kickoff && now <= endTime && match.livestream.available) {
                // Đang live
                liveMatches.push(match);
            } else if (kickoff > now) {
                // Sắp đá
                upcomingMatches.push(match);
            }
        }
    });

    liveMatches.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    upcomingMatches.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

    return {
        liveMatches,
        upcomingMatches,
        todaysAll: [...liveMatches, ...upcomingMatches]
    };
}

// Hàm xử lý vào xem chi tiết trận đấu
$(document).on('click', '.dv2-layout-ls.dv2-list-video-ctn .dv2-match-item', function (e) {
    e.preventDefault();
    const $btn = $(this);
    const matchId = $btn.data('id') || '';
    // redirect to livestream page
    window.location.href = `/streams/${matchId}`;
});

// Hàm xử lý format time trận đấu
function formatTime_LS(timeStr) {
    if (!timeStr) return '';

    const kickoffDate = new Date(timeStr);
    const now = new Date();

    // Trận kết thúc sau 2 giờ
    const matchEnd = new Date(kickoffDate);
    matchEnd.setHours(matchEnd.getHours() + 2);

    // Kiểm tra xem trận đã kết thúc chưa
    if (now > matchEnd) {
        return 'Đã kết thúc';
    }

    // Nếu chưa kết thúc → trả về HH:mm
    const hours = String(kickoffDate.getHours()).padStart(2, "0");
    const minutes = String(kickoffDate.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}


})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* chitiet.js */
(function(window, $, jQuery, Hls, Swiper) {
// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

const POSTER_URL_SCL =
  "https://sta.vnres.co/file/common/20250410/000bfdfc22afe0f322140fabd2228aec.jpg";

const appState = {
  hotLeaguesRank: new Map(),
};
let detailScorePoll_SCL = null;
let currentActiveLink_SCL = null;
let currentMatchData_SCL = null;
let currentHls_SCL = null;
let sclPlaybackGeneration = 0;
let sclManifestTimeout = null;
let sclNativeTimeout = null;
let sclRetryTimeout = null;

function startDetailScorePoll_SCL(match) {
    if (!match) return;
    if (!detailScorePoll_SCL) {
        detailScorePoll_SCL = DV2MatchScorePoll.create({
            container: ".dv2-layout-scl",
        });
    }
    detailScorePoll_SCL.sync(match);
    detailScorePoll_SCL.start();
}

const LIVE_STATUS = [
  // "interrupt",
  //"cut in half",
  "first half",
  "firsthalf",
  "first-half",
  "fh",
  "half-time",
  "half time",
  "halftime",
  "ht",
  "second half",
  "secondhalf",
  "second-half",
  "sh",
  "extra time",
  "extratime",
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
];

// Define constants
const baseApiUrl = 'https://vsc-apidev.helizones.com'
const NHADAI_COMMENTATOR_ID = 99999999999999999;

// ========================================
// Bet buttons for detail page (stream links row)
// ========================================
function renderStreamBetButtons_SCL() {
    const $container = $(".dv2-layout-scl.dv2-streaming-ctn .dv2-stream-list .dv2-bet-links");
    if (!$container.length) return;

    const html = window.DV2_SOCOLIVE_STREAM_BET_BUTTONS_HTML;
    if (typeof html === "string" && html.trim()) {
        $container.html(html);
    }

    if (!$container.children().length) return;
    window.DV2_StreamChrome?.refreshReviveAds?.($container);
}

function isNhaDaiLivestreamLink(link) {
    if (!link) return false;
    if (link.commentatorId === NHADAI_COMMENTATOR_ID) return true;
    const name = String(link.commentator || "").trim().toLowerCase();
    return name === "nhà đài" || name === "nha dai" || name === "blv nhà đài";
}

function sortLivestreamLinksPreferRealBlv(links) {
    return DV2StreamLinks.sort(links);
}

function bindDetailStreamLinks_SCL(data) {
    return DV2StreamLinks.prepareSpanLinks({
        rawLinks: data?.livestream?.links,
        $container: $(".dv2-layout-scl.dv2-streaming-ctn .dv2-stream-links"),
        onSelect(link, index) {
            currentActiveLink_SCL = link;
            const $videoWrapper = getStreamVideoWrapper_SCL();
            const $videoContainer = $videoWrapper.find(".dv2-video-container");
            const $video = $videoContainer.find("#liveVideo");
            DV2StreamKickoff.applyPosterForLink($video, link, POSTER_URL_SCL);
            renderMatchBoxInfo(data, "#matchCard", index);

            if (currentMatchData_SCL) {
                initStreamOddsPanel_SCL($videoWrapper, currentMatchData_SCL);
            }

            const kickoffTime = new Date(data?.matchInfo?.kickoff);
            const shouldShowPreMatch =
                !Number.isNaN(kickoffTime.getTime()) &&
                kickoffTime.getTime() - Date.now() > 15 * 60 * 1000;

            if (shouldShowPreMatch || !link?.url) {
                const chrome = getStreamChrome_SCL();
                if (chrome && $videoWrapper.length) {
                    chrome.clearFullChrome($videoWrapper);
                }
                stopStreamPlayback_SCL($video);
                hideStreamLoading_SCL($videoContainer);
                return;
            }

            clearStreamLoading_SCL($videoContainer);
            initHLSPlayer_SCL(link.url);
        },
    });
}

const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-first",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
  copy: true,
});

function getPreferredLivestreamLink(match) {
    const links = match?.livestream?.links;
    if (!Array.isArray(links) || !links.length) return null;
    return DV2StreamLinks.getPreferredLink(links);
}
// const posterUrl = window.POSTER_URL
// const defaultLeagueLogo = window.DEFAULT_LEAGUE_LOGO
// const livingIcon = window.LIVING_ICON
// const hotWhiteIcon = window.HOT_WHITE_ICON

function getStreamVideoWrapper_SCL() {
    return $(".dv2-layout-scl.dv2-streaming-ctn .dv2-video-wrapper").first();
}

function getStreamChrome_SCL() {
    return window.DV2_StreamChrome;
}

function initStreamPlayerUi_SCL($video) {
    const $wrapper = getStreamVideoWrapper_SCL();
    const chrome = getStreamChrome_SCL();
    if (!$wrapper.length || !chrome) return;
    chrome.initPlayerUi($wrapper, $video);
}

function initStreamOddsPanel_SCL($videoWrapper, matchData) {
    const chrome = getStreamChrome_SCL();
    if (!chrome || !$videoWrapper?.length || !matchData) return;
    chrome.rememberOddsMatchData?.($videoWrapper, matchData);
    chrome.initOddsPanel?.($videoWrapper, matchData);
}

function clearSclPlaybackTimers() {
    if (sclManifestTimeout) {
        clearTimeout(sclManifestTimeout);
        sclManifestTimeout = null;
    }
    if (sclNativeTimeout) {
        clearTimeout(sclNativeTimeout);
        sclNativeTimeout = null;
    }
    if (sclRetryTimeout) {
        clearTimeout(sclRetryTimeout);
        sclRetryTimeout = null;
    }
}

function showStreamLoading_SCL($videoContainer, message = "Đang tải video...") {
    if (!$videoContainer?.length) return $();
    hideStreamLoading_SCL($videoContainer);
    const safeMessage = String(message || "Đang tải video...")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const $overlay = $(`
        <div class="dv2-stream-loading-scl dv2-loading"
            style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:16px;background:rgba(0,0,0,0.6);padding:10px 20px;border-radius:6px;width:auto;">
            ${safeMessage}
        </div>
    `);
    $videoContainer.append($overlay);
    return $overlay;
}

function hideStreamLoading_SCL($videoContainer) {
    $videoContainer?.find(".dv2-stream-loading-scl").remove();
}

function clearStreamLoading_SCL($videoContainer) {
    hideStreamLoading_SCL($videoContainer);
}

function stopStreamPlayback_SCL($video) {
    sclPlaybackGeneration += 1;
    clearSclPlaybackTimers();
    if (currentHls_SCL) {
        try {
            currentHls_SCL.destroy();
        } catch (e) {
            console.warn(e);
        }
        currentHls_SCL = null;
    }
    if (!$video?.length) return;
    const el = $video[0];
    el.pause();
    el.removeAttribute("src");
    if (typeof el.load === "function") {
        el.load();
    }
}

function showStreamFallback_SCL($videoWrapper, $videoContainer, matchData) {
    const chrome = getStreamChrome_SCL();
    if (chrome && $videoWrapper.length) {
        chrome.clearFullChrome($videoWrapper);
    }
    hideStreamLoading_SCL($videoContainer);
    if (!matchData) return;
    $videoContainer.find(".dv2-match-overlay-scl").remove();
    const $overlay = createNotFoundMatchOverlay_SCL(matchData);
    $overlay.addClass("dv2-match-overlay-scl");
    $videoContainer.append($overlay);
    DV2StreamKickoff.startCountdown(matchData?.matchInfo?.kickoff);
}

function initHLSPlayer_SCL(streamUrl) {
    const $videoWrapper = getStreamVideoWrapper_SCL();
    const $videoContainer = $videoWrapper.find(".dv2-video-container");
    const $video = $videoContainer.find("#liveVideo");
    const fallbackMatchData = currentMatchData_SCL;

    sclPlaybackGeneration += 1;
    const playbackGen = sclPlaybackGeneration;
    const isStalePlayback = () => playbackGen !== sclPlaybackGeneration;

    clearSclPlaybackTimers();
    $videoContainer.find(".dv2-match-overlay-scl").remove();

    if (!streamUrl || !$video.length) {
        hideStreamLoading_SCL($videoContainer);
        if (fallbackMatchData) {
            showStreamFallback_SCL($videoWrapper, $videoContainer, fallbackMatchData);
        }
        return;
    }

    if (currentHls_SCL) {
        try {
            currentHls_SCL.destroy();
        } catch (e) {
            console.warn(e);
        }
        currentHls_SCL = null;
    }

    showStreamLoading_SCL($videoContainer, "Đang tải video...");

    let retryCount = 0;
    const maxRetries = 3;
    let hasFallback = false;

    const showFallback = () => {
        if (isStalePlayback() || hasFallback) return;
        hasFallback = true;
        clearSclPlaybackTimers();
        showStreamFallback_SCL($videoWrapper, $videoContainer, fallbackMatchData);
    };

    function setupPlayer() {
        if (isStalePlayback()) return;

        if (Hls.isSupported()) {
            sclManifestTimeout = setTimeout(() => {
                if (isStalePlayback()) return;
                console.warn("[VSC LIVE] Manifest load timeout");
                retry();
            }, 15000);

            const hls = new Hls({
                maxBufferLength: 10,
                liveSyncDuration: 3,
                enableWorker: true,
                xhrSetup: function (xhr) {
                    xhr.withCredentials = false;
                    xhr.referrerPolicy = "no-referrer-when-downgrade";
                },
            });
            currentHls_SCL = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia($video[0]);

            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                if (isStalePlayback()) return;
                clearSclPlaybackTimers();
                hideStreamLoading_SCL($videoContainer);
                $video[0].muted = true;
                $video[0].play().catch(() => console.warn("Autoplay bị chặn"));
                getStreamChrome_SCL()?.syncControlsState?.($videoWrapper, $video);
                onHlsStreamReady_SCL();
            });

            hls.on(Hls.Events.ERROR, function (event, data) {
                if (isStalePlayback()) return;
                if (!data.fatal) return;
                clearSclPlaybackTimers();
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        hls.recoverMediaError();
                        break;
                    default:
                        try {
                            hls.destroy();
                        } catch (e) {}
                        if (currentHls_SCL === hls) {
                            currentHls_SCL = null;
                        }
                        retry();
                        break;
                }
            });
        } else if ($video[0].canPlayType("application/vnd.apple.mpegurl")) {
            sclNativeTimeout = setTimeout(() => {
                if (isStalePlayback()) return;
                console.warn("[VSC LIVE] Native HLS load timeout");
                retry();
            }, 15000);

            $video.attr("src", streamUrl);
            $video.one("loadedmetadata", function () {
                if (isStalePlayback()) return;
                clearSclPlaybackTimers();
                hideStreamLoading_SCL($videoContainer);
                $video[0].muted = true;
                $video[0].play().catch(() => console.warn("Autoplay bị chặn"));
                getStreamChrome_SCL()?.syncControlsState?.($videoWrapper, $video);
                onHlsStreamReady_SCL();
            });
            $video.one("error", function () {
                if (isStalePlayback()) return;
                clearSclPlaybackTimers();
                retry();
            });
        } else {
            $videoContainer.html(`
                <div style="color:#fff;text-align:center;padding:100px;">
                    🚫 Trình duyệt không hỗ trợ phát livestream
                </div>
            `);
        }
    }

    function retry() {
        if (isStalePlayback()) return;
        if (retryCount < maxRetries) {
            retryCount += 1;
            console.warn(`[VSC LIVE] Retry lần ${retryCount}/${maxRetries}...`);
            showStreamLoading_SCL(
                $videoContainer,
                `Đang thử lại... (${retryCount}/${maxRetries})`
            );
            sclRetryTimeout = setTimeout(() => {
                if (isStalePlayback()) return;
                setupPlayer();
            }, 3000);
        } else {
            console.error("[VSC LIVE] Hết số lần retry, dừng phát.");
            showFallback();
        }
    }

    setupPlayer();
}

function onHlsStreamReady_SCL() {
    const chrome = getStreamChrome_SCL();
    const $wrapper = getStreamVideoWrapper_SCL();
    if (chrome && $wrapper.length) {
        if (currentMatchData_SCL) {
            chrome.rememberOddsMatchData?.($wrapper, currentMatchData_SCL);
        }
        chrome.onHlsReady($wrapper);
    }
}

$(document).ready(function () {
    if ($(".dv2-layout-scl.dv2-streaming-ctn .dv2-video-wrapper").length) {
        renderDetailMatch_SCL();
    }
    // if ($('.dv2-layout-scl.dv2-appoinment-list-ctn .dv2-appoinment-swiper-container').length) {
    //     renderSliderAppointmentsBlock();
    // }
    // if ($('.dv2-layout-scl.dv2-hotlive-ctn .dv2-hot-content').length) {
    //     renderHotLiveBlock();
    // }
});

// ========================================
// Hiển thị chi tiết trận đấu
// ========================================
function renderDetailMatch_SCL() {
    const $videoWrapper = getStreamVideoWrapper_SCL();
    const $videoContainer = $videoWrapper.find(".dv2-video-container");

    hideAppointmentBlock_SCL();

    DV2HotLeagues.load({
        url: `${baseApiUrl}/api/data/lives/competitions/hot`,
        ajax: $.ajax,
        setHotLeaguesRank: (rankMap) => {
            appState.hotLeaguesRank = rankMap;
        },
    }).always(() => {
        initHotLiveBlock_SCL();
    });

    // Lấy ID livestream từ URL
    const params = new URLSearchParams(window.location.search);
    let matchId = params.get("match");
    if (!matchId) {
        if (typeof DV2_MATCH_ID !== "undefined" && DV2_MATCH_ID) {
            matchId = DV2_MATCH_ID;
        } else {
            matchId = "2y8m4zh54p4zql0";
        }
    }
    if (!matchId) {
        $videoContainer.html('<div class="dv2-notfound-video">❌ Không có ID livestream hợp lệ</div>');
        return;
    }

    const marqueeBox = document.querySelector(
        '.dv2-layout-scl.dv2-streaming-ctn .dv2-living-room .dv2-video-inner .dv2-marquee-container .dv2-marquee-box'
    );

    marqueeBox.addEventListener('mouseenter', () => {
        marqueeBox.style.animationPlayState = 'paused';
    });

    marqueeBox.addEventListener('mouseleave', () => {
        marqueeBox.style.animationPlayState = 'running';
    });

    // Tạo thẻ video
    const $video = $("<video>", {
        id: "liveVideo",
        controls: false,
        autoplay: true,
        muted: true,
        playsinline: true,
        poster: DV2StreamKickoff.resolvePosterUrl(currentActiveLink_SCL, POSTER_URL_SCL),
    });
    $videoContainer.append($video);
    initStreamPlayerUi_SCL($video);
    showStreamLoading_SCL($videoContainer, "Đang tải video...");

    const loadMatchData = () => {
        $.ajax({
            url: `${baseApiUrl}/api/data/lives/${matchId}`,
            method: "GET",
            success: function (res) {

                const data = res?.data;
                if (!data || !data.livestream) {
                    $videoContainer.html('<div class="dv2-notfound-video-livestream">🚫 Không có luồng livestream</div>');
                    $videoContainer.append($video);
                    hideAppointmentBlock_SCL();
                    return;
                }

                startDetailScorePoll_SCL(data);
                currentMatchData_SCL = data;

                const linkState = bindDetailStreamLinks_SCL(data);
                currentActiveLink_SCL = linkState?.activeLink ?? null;

                renderStreamBetButtons_SCL();
                DV2StreamKickoff.applyPosterForLink(
                    $video,
                    currentActiveLink_SCL,
                    POSTER_URL_SCL
                );
                const activeIndex = linkState?.activeIndex ?? 0;
                if (linkState?.links?.length) {
                    renderMatchBoxInfo(data, "#matchCard", activeIndex);
                }

                const chrome = getStreamChrome_SCL();
                if (chrome && $videoWrapper.length) {
                    chrome.rememberOddsMatchData?.($videoWrapper, data);
                    chrome.initOddsPanel?.($videoWrapper, data);
                }

                const kickoffTime = new Date(data?.matchInfo?.kickoff);
                const shouldShowPreMatchOverlay =
                    !Number.isNaN(kickoffTime.getTime()) &&
                    (kickoffTime.getTime() - Date.now()) > 15 * 60 * 1000;

                if (shouldShowPreMatchOverlay) {
                    const showPreMatchOverlay = () => {
                        const chrome = getStreamChrome_SCL();
                        if (chrome && $videoWrapper.length) {
                            chrome.clearFullChrome($videoWrapper);
                        }
                        $videoContainer.empty();
                        const $overlay = createNotFoundMatchOverlay_SCL(data);
                        $videoContainer.append($overlay);
                        DV2StreamKickoff.startCountdown(data?.matchInfo?.kickoff);
                        const $video = $("<video>", {
                            id: "liveVideo",
                            controls: false,
                            autoplay: false,
                            muted: true,
                            playsinline: true,
                            poster: DV2StreamKickoff.resolvePosterUrl(currentActiveLink_SCL, POSTER_URL_SCL),
                        });
                        $videoContainer.append($video);
                        initStreamPlayerUi_SCL($video);
                        loadCommentatorAppointments_SCL(data);
                    };

                    if (window.DV2StreamTvc?.playBeforeStream) {
                        window.DV2StreamTvc.playBeforeStream($videoWrapper, showPreMatchOverlay);
                    } else {
                        showPreMatchOverlay();
                    }
                    return;
                }

                const streamUrl = linkState?.activeLink?.url || "";

                if (!streamUrl) {
                    $videoContainer.html('<div class="dv2-notfound">Không tìm thấy video livestream</div>');
                    loadCommentatorAppointments_SCL(data);
                    return;
                }

                const startStream = () => {
                    initHLSPlayer_SCL(streamUrl);
                    loadCommentatorAppointments_SCL(data);
                };

                if (window.DV2StreamTvc?.playBeforeStream) {
                    window.DV2StreamTvc.playBeforeStream($videoWrapper, startStream);
                } else {
                    startStream();
                }
            },
            error: function (err) {
                console.error("[VSC LIVE] Lỗi khi gọi API:", err);
                $videoContainer.html('<div class="dv2-notfound">Không thể tải dữ liệu livestream</div>');
            }
        });
    };

    loadMatchData();
}

// ========================================
// Lịch trình bình luận viên
// ========================================
function hideAppointmentBlock_SCL() {
    $(".dv2-layout-scl.dv2-appoinment-list-ctn").hide();
}

function loadCommentatorAppointments_SCL(matchData) {
    const sortedLinks = sortLivestreamLinksPreferRealBlv(
        matchData?.livestream?.links || [],
    );
    const commentatorId = sortedLinks[0]?.commentatorId;

    if (!commentatorId) {
        hideAppointmentBlock_SCL();
        return;
    }

    $.ajax({
        url: `${baseApiUrl}/api/data/lives/commentators/${commentatorId}`,
        method: "GET",
        success(res) {
            const rawMatches = res?.matches;
            if (!Array.isArray(rawMatches) || !rawMatches.length) {
                hideAppointmentBlock_SCL();
                return;
            }

            renderSliderAppointmentsBlock(sortedMatchesFunction(rawMatches));
        },
        error(err) {
            console.error("[VSC LIVE] Lỗi khi gọi API lịch BLV:", err);
            hideAppointmentBlock_SCL();
        },
    });
}

// ========================================
// Hiển thị slide lịch trình trận đấu
// ========================================
function renderSliderAppointmentsBlock(matches) {
    const $appointmentSection = $(".dv2-layout-scl.dv2-appoinment-list-ctn");
    const $scheduleContainer = $appointmentSection.find(
        ".dv2-appoinment-swiper-container",
    );
    const $wrapper = $scheduleContainer.find(".dv2-swiper-wrapper");

    $wrapper.empty();

    if (!Array.isArray(matches) || !matches.length) {
        hideAppointmentBlock_SCL();
        return;
    }

    function formatTime_SCL(datetime) {
        if (!datetime) return '';
        const date = new Date(datetime);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    function getDateLabel_SCL(matchDate) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const match = new Date(matchDate);

        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        match.setHours(0, 0, 0, 0);

        if (match.getTime() === today.getTime()) {
            return 'Hôm nay';
        } else if (match.getTime() === tomorrow.getTime()) {
            return 'Ngày mai';
        } else {
            const day = String(match.getDate()).padStart(2, '0');
            const month = String(match.getMonth() + 1).padStart(2, '0');
            return `${day}/${month}`;
        }
    }
    // Render từng match slide
    matches.forEach(function (match, index) {
        // Extract match data
        const matchId = match?.match_id || match?.matchId|| match?.id || match?.slug || index;
        // League/Tournament info
        const leagueName = match?.league?.name || 'N/A';
        const leagueLogo = match?.league?.logo || 'https://sta.vnres.co/file/common/20210503/fca5954ec22137ad05325506d6645592';

        // Match time info
        const matchDateTime = match?.matchInfo?.kickoff ?? match?.kickoff ?? "";
        const dateLabel = getDateLabel_SCL(matchDateTime);
        const timeLabel = formatTime_SCL(matchDateTime);

        // Home team info
        const homeName = match?.teams?.home?.name || 'Home Team';
        const homeLogo = match?.teams?.home?.logo || 'Logo';

        // Away team info
        const awayName = match?.teams?.away?.name || 'Away Team';
        const awayLogo = match?.teams?.away?.logo || 'Logo';

        const slideHtml = `
			<div class="dv2-swiper-slide swiper-slide" style="cursor:pointer;" data-id="${matchId}" onclick="goToMatchDetail('${matchId}')">
				<div class="dv2-title">
					<div class="dv2-fl">
						<img onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'" src="${leagueLogo}" class="icon" draggable="false">
						<span>${leagueName}</span>
					</div>
					<div class="dv2-fr dv2-match-time">
						<span style="padding-right:5px;">${dateLabel}</span>
						${timeLabel}
					</div>
				</div>
				<div class="dv2-box" style="display: flex;">
					<div class="dv2-battle-team">
						<p>
							<img 
                                onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                                class="dv2-logo" 
								 src="${homeLogo}" 
								 data-src="${homeLogo}" 
								 draggable="false">
							<span class="dv2-ellipsis">${homeName}</span>
						</p>
						<p>
							<img 
                                onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                                class="dv2-logo" 
								 src="${awayLogo}" 
								 data-src="${awayLogo}" 
								 alt="" 
								 draggable="false">
							<span class="dv2-ellipsis">${awayName}</span>
						</p>
					</div>
                    <a href="${window.DV2_LINK_BET}" 
                        target="_blank" rel="nofollow"
						data-id="${matchId}" 
						data-slug="${match.slug || ''}"
						class="dv2-appoinment" 
                        onclick="event.stopPropagation();"
						draggable="false">
						<span class="no-appoinment">Đặt cược</span>
					</a>
				</div>
			</div>
		`;

        $wrapper.append(slideHtml);
    });

    $appointmentSection.show();
    $scheduleContainer.show();

    // Initialize Swiper
    initSwiperInstance('.dv2-layout-scl.dv2-appoinment-list-ctn .dv2-appoinment-swiper-container', '.dv2-appoinment-next', '.dv2-appoinment-prev');
}

// ========================================
// Hiển thị list Hot Live (live + upcoming, sort priority-competition-first)
// ========================================
function getHotLiveRenderOptions_SCL() {
    return {
        baseApiUrl,
        ajax: $.ajax,
        sortedMatchesFunction,
        liveStatuses: LIVE_STATUS,
        hotLeaguesRank: appState.hotLeaguesRank,
        getPreferredLivestreamLink,
    };
}

function renderHotLiveBlock(matches = []) {
    DV2SocoliveHotLive.render(matches, getHotLiveRenderOptions_SCL());
}

function initHotLiveBlock_SCL() {
    if (!$('.dv2-layout-scl.dv2-hotlive-ctn .dv2-hot-content').length) {
        return;
    }
    DV2SocoliveHotLive.init(getHotLiveRenderOptions_SCL());
}

// Hiển thị overlay khi trận đấu chưa diễn ra
function createNotFoundMatchOverlay_SCL(match) {
    const kickoff = match?.matchInfo?.kickoff;
    const league = match?.league?.name;
    const homeName = match?.teams?.home?.name || "Home";
    const awayName = match?.teams?.away?.name || "Away";
    const statusMatch = renderStatusMatch_SCL(kickoff);
    return $(`
            <div class="dv2-loading">
                Trận đấu ${statusMatch}: <strong>${homeName} - ${awayName}</strong>
                <div class="dv2-load-league">
                    <span>Giải đấu: <strong>${league}</strong></span>
                </div>
                <div class="dv2-load-time">
                    <span>${DV2StreamKickoff.renderTimeDisplay(kickoff)}</span>
                </div>
            </div>
        `);
}

// Hiển thị trạng thái trận đấu đã/đang/sẽ diễn ra
function renderStatusMatch_SCL(kickoff) {
    // hiển thị thông tin trận đã/đang/sẽ diễn ra
    const now = new Date();
    // Giới hạn khoảng thời gian trong hôm nay
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // kickoff có thể là string → ép về Date
    const kickoffDate = kickoff instanceof Date ? kickoff : new Date(kickoff);

    // Xác định trạng thái trận đấu
    let matchStatus = '';
    if (kickoffDate > now) {
        // Sắp diễn ra
        const diffMinutes = Math.round((kickoffDate - now) / 60000);
        if (diffMinutes <= 30) {
            matchStatus = 'sắp bắt đầu'; // trong vòng 30 phút
        } else {
            matchStatus = 'chưa diễn ra';
        }
    } else {
        // kickoff <= now → trận đã hoặc đang diễn ra
        const matchEnd = new Date(kickoffDate);
        matchEnd.setHours(matchEnd.getHours() + 2); // giả sử 1 trận ~2h

        if (now <= matchEnd) {
            matchStatus = 'đang diễn ra';
        } else {
            matchStatus = 'đã kết thúc';
        }
    }
    return matchStatus;
}

// Format time theo dạng 00:00
function formatTime_SCL(datetime) {
    if (!datetime) return '';
    const date = new Date(datetime);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Format date theo dạng Hôm nay, 01/11
function getDateLabel_SCL(matchDate) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const match = new Date(matchDate);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    match.setHours(0, 0, 0, 0);

    if (match.getTime() === today.getTime()) {
        return 'Hôm nay';
    } else if (match.getTime() === tomorrow.getTime()) {
        return 'Ngày mai';
    } else {
        const day = String(match.getDate()).padStart(2, '0');
        const month = String(match.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    }
}

// Handle click redirect to detail page when click item hotlive
$(document).on('click', '.dv2-layout-scl .dv2-game', function (e) {
    e.preventDefault();
    const $btn = $(this);
    const matchId = $btn.data('id') || '';
    // redirect to livestream page
    window.location.href = `/streams/${matchId}`;
});

// Khởi tạo Swiper slider
function initSwiperInstance(containerSelector, nextBtnSelector, prevBtnSelector) {
    if (!$(containerSelector).length) {
        return null;
    }

    swiper = new Swiper(containerSelector, {
        slidesPerView: 1.5,
        navigation: {
            nextEl: nextBtnSelector,
            prevEl: prevBtnSelector,
        },
        breakpoints: {
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
            1280: { slidesPerView: 5 },
        },
        loop: false,
        watchSlidesProgress: true,
        roundLengths: true,
    });
}

// render box thông tin trận đấu dưới stream
function renderMatchBoxInfo(match, target = "#matchCard", indexLink = 0) {
    if (!match) return;
    const kickoff = match?.matchInfo?.kickoff;

    const sortedLinks = DV2StreamLinks.sortForDetail(
        match.livestream?.links || []
    );
    const commentator = sortedLinks[indexLink];

    const html = `
        <div class="dv2-match-header">
            <img class="dv2-league-logo" src="${match.league.logo}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
            <div class="dv2-league-name">${match.league.name}</div>
            <div class="dv2-status">${match.matchInfo.status}</div>
        </div>

        <div class="dv2-match-body">
            <div class="dv2-team">
                <img src="${match.teams.home.logo}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
                <div>${match.teams.home.name}</div>
            </div>

            <div class="dv2-score">
                <div class="dv2-score-ft">
                    <span data-dv2-score-home>${match.score.fulltime.home}</span> - <span data-dv2-score-away>${match.score.fulltime.away}</span>
                </div>
                ${match.score?.pen && (match.score.pen.home != null || match.score.pen.away != null) ? `
                <div class="dv2-score-pen">
                    <div class="dv2-score-pen-value">
                        <span data-dv2-score-pen-home>${match.score.pen.home}</span> - <span data-dv2-score-pen-away>${match.score.pen.away}</span>
                    </div>
                    <div class="dv2-score-pen-label">(Penalty)</div>
                </div>
                ` : ""}
            </div>

            <div class="dv2-team" style="justify-content:flex-end">
                <div>${match.teams.away.name}</div>
                <img src="${match.teams.away.logo}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
            </div>
        </div>

        <div class="dv2-match-footer">
            ${DV2StreamKickoff.renderTimeDisplay(kickoff)}
        </div>
        ${commentator ? `
        <div class="dv2-commentator">
            <span class="dv2-commentator-name">Bình Luận Viên: </span>
            <img class="dv2-commentator-avatar" src="${commentator.avatar}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
            <span class="dv2-commentator-name">${commentator.commentator}</span>
        </div>
        ` : ""}
    `;

    $(target).html(html);
    DV2StreamKickoff.startCountdown(kickoff);
}

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* highlight.js */
(function(window, $, jQuery, Hls, Swiper) {

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* hot-live-block.js */
(function(window, $, jQuery, Hls, Swiper) {
/**
 * Shared Socolive hot-live block: same match pipeline as cakhia-v2/suggested-stream.js
 */
window.DV2SocoliveHotLive = window.DV2SocoliveHotLive || {};

(function (DV2SocoliveHotLive) {
  const DEFAULT_CONTAINER =
    ".dv2-layout-scl.dv2-hotlive-ctn .dv2-hot-content";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getMatchId(match) {
    return match?.match_id || match?.matchId || match?.id || match?.slug || "";
  }

  function getMatchStatus(match) {
    return String(match?.matchInfo?.status ?? match?.status ?? "").toLowerCase();
  }

  function getSortedCommentatorLinks(match) {
    if (window.DV2StreamLinks?.sortForDetail) {
      return window.DV2StreamLinks.sortForDetail(match?.livestream?.links);
    }
    return Array.isArray(match?.livestream?.links) ? match.livestream.links : [];
  }

  function getDetailUrl(matchId, link) {
    return window.DV2StreamLinks.getDetailUrl(matchId, link, { trailingSlash: false });
  }

  function buildCommentatorDropdown(match, getPreferredLivestreamLink) {
    const sortedLinks = getSortedCommentatorLinks(match);
    if (!sortedLinks.length) {
      return `<span class="dv2-name">${escapeHtml(
        getPreferredLivestreamLink(match)?.commentator || "",
      )}</span>`;
    }

    const preferredLink =
      getPreferredLivestreamLink(match) || sortedLinks[0] || null;

    return window.DV2BlvDropdown.build({
      match,
      links: sortedLinks,
      preferredLink,
      getDetailUrl,
      escapeHtml,
      menuPlacement: "up",
      renderToggle: ({ label, esc }) => `<span class="dv2-name">${esc(label)}</span>`,
      renderItemContent: ({ label, esc }) => esc(label),
    });
  }

  function bindHotliveDropdownEvents($container) {
    window.DV2BlvDropdown.bind($container, {
      namespace: "dv2HotliveDropdown",
      rebindDocumentClose: true,
    });
  }

  function getMatchListAdBlocks() {
    return window.DV2ListAds.getBlocks(window.DV2_SOCOLIVE_MATCH_LIST_ADS);
  }

  function buildMatchListAdInsertions(adBlocks, totalItems) {
    return window.DV2ListAds.buildInsertions(adBlocks, totalItems, {
      breakpoint: window.DV2_SOCOLIVE_MATCH_LIST_ADS_MOBILE_BREAKPOINT,
      repeatCycle: window.DV2_SOCOLIVE_MATCH_LIST_ADS_REPEAT,
    });
  }

  function buildMatchListAdMarkup(adBlock) {
    return window.DV2ListAds.buildMarkup(adBlock, {
      wrapperTag: "li",
      wrapperClass: "dv2-hot-content-ad",
    });
  }

  function refreshMatchListReviveAds($container) {
    window.DV2ListAds.refreshReviveAds($container);
  }

  DV2SocoliveHotLive.isMatchLive = function isMatchLive(match, liveStatuses) {
    return Array.isArray(liveStatuses) && liveStatuses.includes(getMatchStatus(match));
  };

  DV2SocoliveHotLive.prepareMatches = function prepareMatches(
    matches,
    sortedMatchesFunction,
  ) {
    if (!Array.isArray(matches) || typeof sortedMatchesFunction !== "function") {
      return [];
    }

    const activeMatches = matches.filter(
      (match) => getMatchStatus(match) !== "finished",
    );

    return sortedMatchesFunction(activeMatches);
  };

  DV2SocoliveHotLive.loadMatches = function loadMatches(options) {
    const {
      baseApiUrl,
      ajax = window.jQuery?.ajax || window.$?.ajax,
      sortedMatchesFunction,
      onSuccess,
      onError,
    } = options || {};

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const payload = {
      fromDate: today.toISOString().split("T")[0],
      toDate: tomorrow.toISOString().split("T")[0],
    };

    return ajax({
      url: `${baseApiUrl}/api/data/lives/range-date`,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(payload),
      success(res) {
        if (res?.status !== "success" || !res?.matches_by_date) {
          onSuccess?.([]);
          return;
        }

        let allMatches = [];
        Object.values(res.matches_by_date).forEach((dateMatches) => {
          allMatches = allMatches.concat(dateMatches);
        });

        onSuccess?.(
          DV2SocoliveHotLive.prepareMatches(allMatches, sortedMatchesFunction),
        );
      },
      error: onError,
    });
  };

  DV2SocoliveHotLive.render = function render(matches, options) {
    const {
      containerSelector = DEFAULT_CONTAINER,
      liveStatuses = [],
      hotLeaguesRank = new Map(),
      getPreferredLivestreamLink = () => null,
      $ = window.jQuery || window.$,
    } = options || {};

    const $scheduleContainer = $(containerSelector);
    $scheduleContainer.empty();

    if (!Array.isArray(matches) || !matches.length) {
      const adInsertions = buildMatchListAdInsertions(
        getMatchListAdBlocks(),
        0,
      );
      let emptyHtml = `
        <div class="dv2-hotlive-empty">
          Hiện không có trận nào đang diễn ra 🔥
        </div>
      `;
      if (adInsertions.has(0)) {
        emptyHtml += buildMatchListAdMarkup(adInsertions.get(0));
      }
      $scheduleContainer.html(emptyHtml);
      refreshMatchListReviveAds($scheduleContainer);
      options?.onRendered?.($scheduleContainer);
      return;
    }

    const rankMap =
      hotLeaguesRank instanceof Map ? hotLeaguesRank : new Map();
    const adInsertions = buildMatchListAdInsertions(
      getMatchListAdBlocks(),
      matches.length,
    );

    matches.forEach((match, index) => {
      const matchId = getMatchId(match);
      const home = match?.teams?.home || {};
      const away = match?.teams?.away || {};
      const homeName = home.name || "Đội nhà";
      const awayName = away.name || "Đội khách";
      const logoLeague = match?.league?.logo || "";
      const league = match?.league?.name || "";
      const slug = match?.slug || "";
      const commentatorDropdownMarkup = buildCommentatorDropdown(
        match,
        getPreferredLivestreamLink,
      );
      const isLive = DV2SocoliveHotLive.isMatchLive(match, liveStatuses);
      const isHot = rankMap.has(match?.league?.id);
      const hotClass = isHot ? "hot-match" : "";
      const livingMarkup = isLive
        ? `<img src="https://sta.vnres.co/web/assets/soco/img/living.gif"><span>Live</span>`
        : `<span>Sắp diễn ra</span>`;
      const detailUrl = getDetailUrl(matchId);

      const $item = $(`
        <li class="dv2-hot-content-match ${hotClass}">
          <a data-id="${matchId}" data-slug="${slug}" class="dv2-game" href="${escapeHtml(detailUrl)}">
            <div class="dv2-mask"></div>
            <img class="dv2-live-cover" src="${logoLeague}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
            <div class="dv2-live-mask"></div><i class="dv2-btn-open"></i>
            <div class="dv2-top-tag"><span></span>
              <div class="dv2-living ${isLive ? "" : "dv2-living--upcoming"}">
                ${livingMarkup}
              </div>
            </div>
            <h5 class="dv2-bottom-title">
              <span class="dv2-num">
                <img src="https://sta.vnres.co/web/assets/soco/img/icon-hot-white.png" srcset="">
                <span>29.06k</span>
              </span>
            </h5>
            <h4 class="dv2-ellipsis">${league}: ${homeName} - ${awayName}</h4>
          </a>
          ${commentatorDropdownMarkup}
        </li>
      `);

      $scheduleContainer.append($item);

      const matchPosition = index + 1;
      if (adInsertions.has(matchPosition)) {
        const adMarkup = buildMatchListAdMarkup(adInsertions.get(matchPosition));
        if (adMarkup) {
          $scheduleContainer.append(adMarkup);
        }
      }
    });

    bindHotliveDropdownEvents($scheduleContainer);
    refreshMatchListReviveAds($scheduleContainer);
    options?.onRendered?.($scheduleContainer);
  };

  DV2SocoliveHotLive.init = function init(options) {
    const config = options || {};

    DV2SocoliveHotLive.loadMatches({
      ...config,
      onSuccess(matches) {
        DV2SocoliveHotLive.render(matches, config);
        config.onSuccess?.(matches);
      },
      onError(err) {
        DV2SocoliveHotLive.render([], config);
        config.onError?.(err);
      },
    });
  };
})(window.DV2SocoliveHotLive);

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* lich-truc-tiep.js */
(function(window, $, jQuery, Hls, Swiper) {
// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

const appState = {
  hotLeaguesRank: new Map(),
};
const LIVE_STATUS = [
  // Tạm dừng / sự cố
  // "delay",
  "interrupt",
  //   "cut in half", // bị hoãn nên remove khỏi live
  // Hiệp 1
  "first half",
  "firsthalf",
  "first-half",
  "fh",
  // Nghỉ giữa hiệp
  "half-time",
  "half time",
  "halftime",
  "ht",
  // Hiệp 2
  "second half",
  "secondhalf",
  "second-half",
  "sh",
  // Hiệp phụ
  "extra time",
  "extratime",
  "extra time",
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  // Luân lưu
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
];

const END_STATUS = [
    "end",
    "finished",
    "ft"
]
// Define constants
const baseApiUrl = window.BASE_API_URL
// const liveIcon = window.LIVE_ICON
// const triangleIcon = window.TRIANGLE_ICON

$(document).ready(function () {
    if ($(".dv2-layout-scl.dv2-match-wrapper-ctn").length) {
        loadMatchByRangeDate_SCL();
    }
});

// =================================================
// CALL API range-date để lấy danh sách lịch đấu
// =================================================
function loadMatchByRangeDate_SCL() {
    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);

    const payload = {
        fromDate: today.toISOString().split("T")[0],
        toDate: next7Days.toISOString().split("T")[0],
    };

    $('.dv2-layout-scl.dv2-match-wrapper-ctn .match-loading').show();
    $('.dv2-layout-scl.dv2-match-wrapper-ctn .match-none').hide();
    // call api để lấy danh sách giải đấu hot
    DV2HotLeagues.load({
    url: `${baseApiUrl}/api/data/lives/competitions/hot`,
    ajax: $.ajax,
    setHotLeaguesRank: (rankMap) => {
      appState.hotLeaguesRank = rankMap;
    },
  });
    $.ajax({
        url: `${baseApiUrl}/api/data/lives/range-date`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            $('.dv2-layout-scl.dv2-match-wrapper-ctn .match-loading').hide();

            if (!response || !response.matches_by_date) {
                $('.match-none').show();
                return;
            }

            let dateMatches = Object.keys(response.matches_by_date).map(dateKey => ({
                date: dateKey,
                matches: response.matches_by_date[dateKey]
            }));

            // sort lại: hôm nay lên đầu
            dateMatches = sortDateMatches_SCL(dateMatches);

            if (dateMatches.length === 0) {
                $('.dv2-layout-scl.dv2-match-wrapper-ctn .match-none').show();
                return;
            }

            renderDateTabs_SCL(dateMatches);
            renderMatchData_SCL(dateMatches);
        },
        error: function (xhr) {
            console.error("[VSC CALENDAR] Error:", xhr);
            $('.dv2-layout-scl.dv2-match-wrapper-ctn .match-loading').hide();
            $('.dv2-layout-scl.dv2-match-wrapper-ctn .match-none').show();
        }
    });
}

const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-first",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
});

function getMatchScheduleListAdBlocks() {
  return window.DV2ListAds.getBlocks(window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS);
}

function buildMatchScheduleAdInsertions(adBlocks, totalItems) {
  return window.DV2ListAds.buildInsertions(adBlocks, totalItems, {
    breakpoint: window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_MOBILE_BREAKPOINT,
    repeatCycle: window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_REPEAT,
  });
}

function buildMatchScheduleAdMarkup(adBlock) {
  return window.DV2ListAds.buildMarkup(adBlock, {
    wrapperTag: "div",
    wrapperClass: "dv2-match-schedule-ad",
  });
}

function refreshMatchScheduleReviveAds($container) {
  window.DV2ListAds.refreshReviveAds($container);
}

function buildMatchCardHtml_SCL(match, label, dayIndex) {
  const isHot = appState.hotLeaguesRank.has(match.league.id);
  const kickoff = new Date(match.kickoff);
  const timeStr = formatTime_SCL(kickoff);

  return `
    <div class="dv2-match-card ${isHot ? 'hot-match' : ''} ${label}" data-id="${match.match_id || ''}">
      <div class="dv2-left">
        <div class="dv2-info">
          <div class="name dv2-ellipsis" style="color:${label === "live" ? "red" : "#000"};">
            ${match?.league?.name || "Giải đấu"}
          </div>
          <div class="time">${timeStr}</div>
        </div>
        <div class="dv2-team">
          <div class="host">
            <img onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'" class="host-img match-cover" src="${match.teams?.home?.logo || ''}">
            <span class="host-name dv2-ellipsis">${match.teams?.home?.name || ''}</span>
          </div>
          <div class="guest">
            <img onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'" class="guest-img match-cover" src="${match.teams?.away?.logo || ''}">
            <span class="guest-name dv2-ellipsis">${match.teams?.away?.name || ''}</span>
          </div>
        </div>
      </div>
      <div class="dv2-right">
        <div class="anchor-list" data-tag="${dayIndex}">
          <div class="avatar-prev"></div>
          <div class="avatar-list avatar-swiper-container container-${dayIndex}">
            <div class="swiper-wrapper">
              ${(match.livestream?.links || []).map(blv => `
                <div class="dv2-blv-detail-match avatar-box swiper-slide ${label === "live" ? "living" : ""}" 
                     data-id="${match.match_id}" data-slug="${match.slug}"
                     data-href="${getBlvDetailUrl_SCL(match.match_id, blv)}">
                  <img onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'" class="avatar" src="${blv.avatar}" title="${blv.commentator}">
                  <div class="name dv2-ellipsis">${blv.commentator}</div>
                  ${label === "live" ? '<img class="live" src="https://sta.vnres.co/web/assets/soco/img/live.png">' : ''}
                </div>
              `).join('')}
            </div>
          </div>
          <div class="avatar-next"></div>
        </div>
        ${label === "live" ? `
          <div class="living-box">
            <img src="https://sta.vnres.co/web/assets/soco/img/triangle.png">
            <span>Đang trực tiếp...</span>
          </div>` : ``}
      </div>
    </div>`;
}

// =================================================
// Sort ngày: hôm nay lên đầu, còn lại tăng dần
// =================================================
function sortDateMatches_SCL(dateMatches) {
    return dateMatches.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);

        const isAToday = dateA.getTime() === today.getTime();
        const isBToday = dateB.getTime() === today.getTime();

        if (isAToday) return -1;
        if (isBToday) return 1;

        return dateA - dateB;
    });
}

// =================================================
// Format hiển thị ngày
// =================================================
function formatDateLabel_SCL(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const isToday = compareDate.getTime() === today.getTime();

    const weekdays = [
        "Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư",
        "Thứ năm", "Thứ sáu", "Thứ bảy"
    ];

    const weekday = isToday ? "Hôm nay" : weekdays[date.getDay()];
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dateFormatted = `${day}.${month}`;

    return { weekday, dateFormatted, isToday };
}

// =================================================
// Render tabs ngày
// =================================================
function renderDateTabs_SCL(dateMatches) {
    const $dateList = $('.dv2-layout-scl.dv2-match-wrapper-ctn .dv2-date-list .dv2-date-item');
    $dateList.empty();

    const sortedDates = [...dateMatches];

    if (sortedDates.length < 7) {
        const lastDate = new Date(sortedDates[sortedDates.length - 1].date);
        const daysNeeded = 7 - sortedDates.length;
        for (let i = 1; i <= daysNeeded; i++) {
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + i);
            sortedDates.push({ date: nextDate.toISOString().split("T")[0], matches: [] });
        }
    }

    sortedDates.slice(0, 7).forEach((item, index) => {
        const { weekday, dateFormatted } = formatDateLabel_SCL(item.date);
        const activeClass = index === 0 ? "dv2-active" : "";

        const html = `
            <li class="dv2-item ${activeClass}" data-tag="${index + 1}" data-date="${item.date}">
                <div class="dv2-day">${weekday}</div>
                <div class="dv2-date">${dateFormatted}</div>
                ${activeClass ? '<div class="dv2-indicator"></div>' : ''}
            </li>
        `;
        $dateList.append(html);
    });
}

// =================================================
// Render dữ liệu trận đấu theo ngày
// =================================================
function renderMatchData_SCL(dateMatches) {
    const $matchWrapper = $('.dv2-layout-scl.dv2-match-wrapper-ctn .dv2-match-data');
    const $matchNone = $('.dv2-layout-scl.dv2-match-wrapper-ctn .match-none');
    $matchWrapper.empty();

    dateMatches.forEach((item, index) => {
        const { liveMatches, upcomingMatches, endedMatches } = getListMatchsByTime_SCL(item.matches, item.date);
        const dayMatchCount =
          liveMatches.length + upcomingMatches.length + endedMatches.length;
        const adInsertions = buildMatchScheduleAdInsertions(
          getMatchScheduleListAdBlocks(),
          dayMatchCount,
        );

        let matchHtml = "";
        let matchPosition = 0;

        const renderMatchList = (matches, label) => {

            if (!matches.length) return "";
            const title = label === "live" ? "🔴 Đang diễn ra" : label === "upcoming" ? "⏰ Sắp diễn ra" : "✅ Đã kết thúc";
            let html = `<div class="match-section"><h4 class="section-title">${title}</h4>`;
            matches.forEach((match) => {
                html += buildMatchCardHtml_SCL(match, label, index);
                matchPosition += 1;
                if (adInsertions.has(matchPosition)) {
                    const adMarkup = buildMatchScheduleAdMarkup(adInsertions.get(matchPosition));
                    if (adMarkup) {
                        html += adMarkup;
                    }
                }
            });
            html += `</div>`;
            return html;
        };

        matchHtml += renderMatchList(liveMatches, "live");
        matchHtml += renderMatchList(upcomingMatches, "upcoming");
        matchHtml += renderMatchList(endedMatches, "ended");

        let dayContent = matchHtml;
        if (!dayContent) {
            if (adInsertions.has(0)) {
                dayContent = buildMatchScheduleAdMarkup(adInsertions.get(0));
            } else {
                dayContent = '<div class="match-none">Không có trận đấu nào</div>';
            }
        }

        $matchWrapper.append(`
            <div class="dv2-match-day ${index === 0 ? 'dv2-active' : 'dv2-hidden'}" data-tag="${index + 1}" data-date="${item.date}">
                ${dayContent}
            </div>
        `);
    });

    // Khởi tạo Swiper sau khi render xong DOM
    initSwiperInstance('.avatar-swiper-container', '.avatar-next', '.avatar-prev');
    refreshMatchScheduleReviveAds($matchWrapper);

    // --- Click tabs ---
    $('.dv2-date-list .dv2-item').off('click').on('click', function () {
        const tag = $(this).data('tag');
        $('.dv2-date-list .dv2-item').removeClass('dv2-active');
        $(this).addClass('dv2-active');

        $('.dv2-match-day').addClass('dv2-hidden').removeClass('dv2-active');
        const $activeDay = $(`.dv2-match-day[data-tag="${tag}"]`);
        $activeDay.removeClass('dv2-hidden').addClass('dv2-active');

        const hasMatches = $activeDay.find('.dv2-match-card').length > 0;
        if (hasMatches) $matchNone.hide(); else $matchNone.show();
    });
}

// =================================================
// Phân loại trận đấu trong ngày
// =================================================
function getListMatchsByTime_SCL(matchs, selectedDate) {
    const now = new Date();
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const MATCH_DURATION_MINUTES = 120;
    const liveMatches = [], upcomingMatches = [], endedMatches = [];
    const sortedMatches = sortedMatchesFunction(matchs)
    sortedMatches.forEach(match => {
        const kickoff = new Date(match?.kickoff);
        if (isNaN(kickoff)) return;
        const endTime = new Date(kickoff.getTime() + MATCH_DURATION_MINUTES * 60 * 1000);

        const isLive = LIVE_STATUS.includes(match.status.toLowerCase());
        const isEnd = END_STATUS.includes(match.status.toLowerCase());
        if (kickoff >= dayStart && kickoff <= dayEnd) {
            if (isLive) liveMatches.push(match);
            else if (kickoff > now) upcomingMatches.push(match);
            else if (isEnd) endedMatches.push(match);
        }
    });

    // liveMatches.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    // upcomingMatches.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    // endedMatches.sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));

    return { liveMatches, upcomingMatches, endedMatches };
}

// =================================================
// Utils
// =================================================
function formatTime_SCL(date) {
    const d = new Date(date);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

function getBlvDetailUrl_SCL(matchId, blv) {
    if (window.DV2StreamLinks?.getDetailUrl) {
        return window.DV2StreamLinks.getDetailUrl(matchId, blv, { trailingSlash: false });
    }
    const liveId = blv?.liveId;
    if (liveId != null && liveId !== '') {
        return `/streams/${matchId}?liveId=${encodeURIComponent(String(liveId))}`;
    }
    return `/streams/${matchId}`;
}

$(document).on('click', '.dv2-layout-scl .dv2-match-card', function (e) {
    e.preventDefault();
    const matchId = $(this).data('id') || '';
    window.location.href = `/streams/${matchId}`;
});

$(document).on('click', '.dv2-layout-scl .dv2-match-card .dv2-blv-detail-match', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const href = $(this).data('href') || '';
    const matchId = $(this).data('id') || '';
    window.location.href = href || `/streams/${matchId}`;
});

// Chặn click nút điều hướng slider nổi bọt lên .dv2-match-card
$(document).on('click', '.dv2-layout-scl .dv2-match-card .avatar-next, .dv2-layout-scl .dv2-match-card .avatar-prev', function (e) {
    e.preventDefault();
    e.stopPropagation();
});

function initSwiperInstance(containerSelector, nextBtnSelector, prevBtnSelector) {
    const $containers = $(containerSelector);
    if (!$containers.length || typeof Swiper === 'undefined') return;

    const instances = [];
    $containers.each(function () {
        // Bỏ qua nếu đã init rồi
        if (this.swiper) return;
        // Lấy đúng nút prev/next nằm trong .anchor-list cha của slider này
        const $anchor = $(this).closest('.anchor-list');
        const nextEl = $anchor.find(nextBtnSelector).get(0);
        const prevEl = $anchor.find(prevBtnSelector).get(0);
        instances.push(new Swiper(this, {
            slidesPerView: 5,
            spaceBetween: 8,
            watchOverflow: true,
            navigation: { nextEl, prevEl },
            breakpoints: {
                640: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 },
                1280: { slidesPerView: 5 },
            },
            loop: false,
        }));
    });
    return instances;
}

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* trangchu.js */
(function(window, $, jQuery, Hls, Swiper) {
$ = jQuery.noConflict();

const baseApiUrl = "https://vsc-apidev.helizones.com";
const NHADAI_COMMENTATOR_ID = 99999999999999999;
const PRIORITY_COMPETITION_SOON_MINUTES_SCL = 10;
const TEAM_ICON_FALLBACK =
  "https://img.winfast.dev/assets/upload/football/team/images/teamicon.png";

const appState = {
  hotLeaguesRank: new Map(),
};

const LIVE_STATUS = [
  "first half",
  "firsthalf",
  "first-half",
  "fh",
  "half-time",
  "half time",
  "halftime",
  "ht",
  "second half",
  "secondhalf",
  "second-half",
  "sh",
  "extra time",
  "extratime",
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
];

const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-when-live-or-soon",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
  priorityCompetitionSoonMinutes: PRIORITY_COMPETITION_SOON_MINUTES_SCL,
  copy: true,
});

const hotLiveSortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-first",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
  copy: true,
});

$(document).ready(function () {
  if ($(".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-video-wrapper").length) {
    renderFeaturedStreamBlock_SCL();
  }
  if ($(".dv2-layout-scl.dv2-blv-list-ctn .dv2-anchor-swiper-container").length) {
    renderSlideBlvBlock_SCL();
  }
  if ($(".dv2-layout-scl.dv2-hotlive-ctn .dv2-hot-content").length) {
    initHotLiveBlock_SCL();
  }
});

function isNhaDaiLivestreamLink(link) {
  if (!link) return false;
  if (link.commentatorId === NHADAI_COMMENTATOR_ID) return true;
  const name = String(link.commentator || "").trim().toLowerCase();
  return name === "nhà đài" || name === "nha dai" || name === "blv nhà đài";
}

function sortLivestreamLinksPreferRealBlv(links) {
  if (!Array.isArray(links)) return [];
  const activeLinks = links.filter((link) => link?.isStreaming !== false);
  activeLinks.sort((a, b) => {
    const aIsNhaDai = isNhaDaiLivestreamLink(a);
    const bIsNhaDai = isNhaDaiLivestreamLink(b);
    if (aIsNhaDai && !bIsNhaDai) return 1;
    if (!aIsNhaDai && bIsNhaDai) return -1;
    return 0;
  });
  return activeLinks;
}

function getPreferredLivestreamLink(match) {
  const links = match?.livestream?.links;
  if (!Array.isArray(links) || !links.length) return null;
  return DV2StreamLinks.getPreferredLink(links);
}

function getStreamVideoWrapperHome_SCL() {
  return $(".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-video-wrapper").first();
}

function getStreamVideoContainerHome_SCL() {
  return getStreamVideoWrapperHome_SCL().find(".dv2-video-container").first();
}

function getMatchTopInfoHome_SCL() {
  const $container = getStreamVideoContainerHome_SCL();
  let $matchTopInfo = $container.children("#matchTopInfo");
  if (!$matchTopInfo.length) {
    $matchTopInfo = $('<div id="matchTopInfo"></div>');
    $container.prepend($matchTopInfo);
  }
  return $matchTopInfo;
}

function sclClearFeaturedStreamMediaHome_SCL($videoContainer) {
  $videoContainer
    .children()
    .not("#matchTopInfo, .dv2-stream-controls, .dv2-stream-chrome")
    .remove();
  getMatchTopInfoHome_SCL();
}

function clearStreamChromeHome_SCL() {
  const chrome = window.DV2_StreamChrome;
  const $wrapper = getStreamVideoWrapperHome_SCL();
  if (chrome && $wrapper.length) {
    chrome.clearFullChrome($wrapper);
  }
}

function isMatchLive_SCL(match) {
  return LIVE_STATUS.includes(String(match?.status ?? "").toLowerCase());
}

function isPriorityCompetitionStartingSoon_SCL(match) {
  return DV2MatchSort.isPriorityCompetitionStartingSoon(match, LIVE_STATUS, PRIORITY_COMPETITION_SOON_MINUTES_SCL);
}

function getTodayTomorrowRange_SCL() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(todayEnd.getDate() + 1);
  return { now, todayStart, todayEnd, tomorrowStart, tomorrowEnd };
}

function buildFeaturedStreamMatches_SCL(
  sortedMatches,
  now,
  todayStart,
  todayEnd,
  tomorrowStart,
  tomorrowEnd
) {
  const liveMatch = sortedMatches.filter(isMatchLive_SCL);
  const upcomingMatch = sortedMatches.filter((match) => {
    const kickoff = new Date(match?.kickoff);
    return (
      kickoff > now &&
      ((kickoff >= todayStart && kickoff <= todayEnd) ||
        (kickoff >= tomorrowStart && kickoff <= tomorrowEnd))
    );
  });
  const priorityCompetitionSoonMatch = sortedMatches.find(isPriorityCompetitionStartingSoon_SCL) || null;

  const seen = new Set();
  const streamMatches = [];
  const pushMatch = (match) => {
    const id = match?.match_id ?? match?.id;
    if (!match || (id && seen.has(id))) return;
    if (id) seen.add(id);
    streamMatches.push(match);
  };

  if (priorityCompetitionSoonMatch) pushMatch(priorityCompetitionSoonMatch);
  liveMatch.forEach(pushMatch);
  upcomingMatch.forEach(pushMatch);

  return { streamMatches, liveMatch, upcomingMatch, priorityCompetitionSoonMatch };
}

function bindFeaturedRoomListClick_SCL($roomList, matches, loadMatch) {
  $roomList.off("click.featuredMatch").on("click.featuredMatch", "li.dv2-item-match", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const index = $(this).data("index");
    loadMatch(matches[index], index);
  });
}

function renderFeaturedStreamBlock_SCL() {
  const $videoInner = $(".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-video-inner");
  const $roomList = $(".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-room-list");
  const $videoContainer = getStreamVideoContainerHome_SCL();
  const $dv2StreamLinks = $(".dv2-stream-links");

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const payload = {
    fromDate: today.toISOString().split("T")[0],
    toDate: tomorrow.toISOString().split("T")[0],
  };

  const $notMatch = $(`
    <div class="dv2-loading-nomatch">
      <div class="no-match-text">Hiện không có trận nào đang diễn ra 🔥</div>
      <div class="subtitle">Vui lòng quay lại sau...</div>
    </div>
  `);

  function showFeaturedMatchError_SCL(message) {
    getMatchTopInfoHome_SCL().html(`<div class="dv2-notfound">${message}</div>`);
    sclBindFeaturedStreamClick_SCL("");
  }

  function loadFeaturedMatch_SCL(match, index) {
    if (!match?.match_id) return;

    $roomList.find("a").removeClass("dv2-active");
    $roomList.find("li").eq(index).find("a").addClass("dv2-active");

    clearStreamChromeHome_SCL();
    sclClearFeaturedStreamMediaHome_SCL($videoContainer);
    $dv2StreamLinks.find("span").removeClass("active");

    $.ajax({
      url: `${baseApiUrl}/api/data/lives/${match.match_id}`,
      method: "GET",
      success(res) {
        const data = res?.data;
        if (!data?.livestream) {
          getMatchTopInfoHome_SCL().html(
            '<div class="dv2-notfound-video-livestream">🚫 Không có luồng livestream</div>'
          );
          hideAppointmentBlock_SCL();
          sclBindFeaturedStreamClick_SCL("");
          return;
        }
        renderNewScreen_SCL(data);
      },
      error(err) {
        console.error("[VSC LIVE] Lỗi khi gọi API:", err);
        showFeaturedMatchError_SCL("Không thể tải dữ liệu livestream");
      },
    });
  }

  function bindFeaturedStreamLinksClick_SCL(streamMatches) {
    $dv2StreamLinks.off("click.featuredLinks").on("click.featuredLinks", "span", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const index = $(this).data("index");
      const indexLinks = $(this).data("index-links");
      const match = streamMatches[index];
      const links = sortLivestreamLinksPreferRealBlv(match?.livestream?.links || []);
      const link = links[indexLinks];
      if (DV2StreamLinks.navigateForLink(link)) {
        return;
      }
      loadFeaturedMatch_SCL(match, index);
    });
  }

  DV2HotLeagues.load({
    url: `${baseApiUrl}/api/data/lives/competitions/hot`,
    ajax: $.ajax,
    setHotLeaguesRank: (rankMap) => {
      appState.hotLeaguesRank = rankMap;
    },
  });

  $.ajax({
    url: `${baseApiUrl}/api/data/lives/range-date`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify(payload),
    dataType: "json",
    success(res) {
      if (!res || res.status !== "success" || !res.matches_by_date) {
        $roomList.html("<li>Không có dữ liệu hợp lệ</li>");
        return;
      }

      const matches = [];
      Object.keys(res.matches_by_date).forEach((date) => {
        matches.push(...res.matches_by_date[date]);
      });

      if (!matches.length) {
        $roomList.html("<span>Không có trận đấu nào</span>");
        return;
      }

      const { now, todayStart, todayEnd, tomorrowStart, tomorrowEnd } = getTodayTomorrowRange_SCL();
      const sortedMatches = sortedMatchesFunction(matches);
      const { streamMatches, liveMatch, upcomingMatch, priorityCompetitionSoonMatch } =
        buildFeaturedStreamMatches_SCL(
          sortedMatches,
          now,
          todayStart,
          todayEnd,
          tomorrowStart,
          tomorrowEnd
        );

      if (!liveMatch.length && !upcomingMatch.length) {
        clearStreamChromeHome_SCL();
        $videoInner.append($notMatch);
        $(".dv2-layout-scl.dv2-appoinment-list-ctn").hide();
        return;
      }

      if (liveMatch.length && !upcomingMatch.length) {
        $(".dv2-layout-scl.dv2-appoinment-list-ctn").hide();
      }

      if (!liveMatch.length && !priorityCompetitionSoonMatch && upcomingMatch.length > 0) {
        renderListLiveMatch_SCL(upcomingMatch);
        bindFeaturedRoomListClick_SCL($roomList, upcomingMatch, loadFeaturedMatch_SCL);
        loadFeaturedMatch_SCL(upcomingMatch[0], 0);
      }

      if (liveMatch.length > 0 || priorityCompetitionSoonMatch) {
        renderListLiveMatch_SCL(streamMatches);
        bindFeaturedRoomListClick_SCL($roomList, streamMatches, loadFeaturedMatch_SCL);
        bindFeaturedStreamLinksClick_SCL(streamMatches);
        loadFeaturedMatch_SCL(streamMatches[0], 0);
      }

      renderSliderAppointmentsBlock_SCL(upcomingMatch);
      renderHotLiveBlock_SCL(
        DV2SocoliveHotLive.prepareMatches(matches, hotLiveSortedMatchesFunction)
      );
    },
    error() {
      clearStreamChromeHome_SCL();
      $roomList.html('<li class="dv2-list-empty">Danh sách phát trống</li>');
      showFeaturedMatchError_SCL("Không thể tải danh sách trận đấu");
      $(".dv2-layout-scl.dv2-appoinment-list-ctn").hide();
    },
  });
}

function sclOddsValueHasData_SCL(value) {
  return value != null && value !== "";
}

function sclOddsSectionHasData_SCL(section) {
  if (section == null) return false;
  return (
    sclOddsValueHasData_SCL(section.home) ||
    sclOddsValueHasData_SCL(section.away) ||
    sclOddsValueHasData_SCL(section.rate) ||
    sclOddsValueHasData_SCL(section.over) ||
    sclOddsValueHasData_SCL(section.under)
  );
}

function sclHasStreamOddsData_SCL(data) {
  if (!data) return false;
  return sclOddsSectionHasData_SCL(data.hdp) || sclOddsSectionHasData_SCL(data.ou);
}

function sclNormalizeAssetBase_SCL(base) {
  if (!base) return "";
  return String(base).endsWith("/") ? String(base) : `${base}/`;
}

function sclGetImagePath_SCL() {
  if (typeof DV2_IMAGE_PATH !== "undefined" && DV2_IMAGE_PATH) {
    return sclNormalizeAssetBase_SCL(DV2_IMAGE_PATH);
  }

  if (typeof window.DV2_STREAMING_PLUGIN_URL === "string" && window.DV2_STREAMING_PLUGIN_URL) {
    return `${sclNormalizeAssetBase_SCL(window.DV2_STREAMING_PLUGIN_URL)}assets/images/`;
  }

  if (typeof dv2Streaming !== "undefined") {
    if (dv2Streaming.imagePath) {
      return sclNormalizeAssetBase_SCL(dv2Streaming.imagePath);
    }
    if (dv2Streaming.pluginUrl) {
      return `${sclNormalizeAssetBase_SCL(dv2Streaming.pluginUrl)}assets/images/`;
    }
  }

  return "../../assets/images/";
}

function sclGetSocoliveImgBase_SCL() {
  return `${sclGetImagePath_SCL()}socolive/`;
}

function sclGetSocoliveImageUrl_SCL(filename) {
  const file = String(filename || "").replace(/^\//, "");
  return `${sclGetSocoliveImgBase_SCL()}${file}`;
}

function sclGetHomeBetButtonsDefaultHtml_SCL() {
  return `
    <a href="#">
      <img src="${sclGetSocoliveImageUrl_SCL("cuoc-say88.png")}" alt="Cược SAY88" />
    </a>
    <a href="#">
      <img src="${sclGetSocoliveImageUrl_SCL("cuoc-fabet88.png")}" alt="Cược FABET88" />
    </a>
    <a href="#">
      <img src="${sclGetSocoliveImageUrl_SCL("cuoc-fabet88.png")}" alt="Cược FABET88" />
    </a>`;
}

function sclGetHomeBetButtonHeaderDefaultHtml_SCL() {
  return `<img src="${sclGetSocoliveImageUrl_SCL("top-banner.png")}" alt="top-banner"/>`;
}

function sclGetHomeBetButtonFooterDefaultHtml_SCL() {
  const href =
    typeof window.DV2_LINK_BET === "string" && window.DV2_LINK_BET.trim()
      ? window.DV2_LINK_BET
      : "#";

  return `<a href="${href}" target="_blank" rel="nofollow">
    <img src="${sclGetSocoliveImageUrl_SCL("footer-banner-cuocngay-say88.png")}" alt="banner cược ngay footer" />
  </a>`;
}

function sclGetHomeBetButtonsHtml_SCL() {
  const html = window.DV2_SOCOLIVE_HOME_BET_BUTTONS_HTML;
  if (typeof html === "string" && html.trim()) {
    return html;
  }
  return sclGetHomeBetButtonsDefaultHtml_SCL();
}

function sclGetHomeBetButtonHeaderHtml_SCL() {
  const html = window.DV2_SOCOLIVE_HOME_BET_BUTTON_HEADER_HTML;
  if (typeof html === "string" && html.trim()) {
    return html;
  }
  return sclGetHomeBetButtonHeaderDefaultHtml_SCL();
}

function sclGetHomeBetButtonFooterHtml_SCL() {
  const html = window.DV2_SOCOLIVE_HOME_BET_BUTTON_FOOTER_HTML;
  if (typeof html === "string" && html.trim()) {
    return html;
  }
  return sclGetHomeBetButtonFooterDefaultHtml_SCL();
}

function sclGetStreamDetailUrl_SCL(data, link) {
  if (!data) return "";

  const matchId = data.matchId || data.match_id || data.id || "";
  if (!matchId) return "";

  let activeLink = link || null;
  if (!activeLink) {
    const rawLinks = data.livestream?.links || [];
    const links = sortLivestreamLinksPreferRealBlv(rawLinks);
    activeLink = links[0] || rawLinks[0] || null;
  }

  if (window.DV2StreamLinks?.getDetailUrl) {
    return DV2StreamLinks.getDetailUrl(matchId, activeLink, { trailingSlash: true });
  }

  const encodedMatchId = encodeURIComponent(String(matchId));
  const liveId = activeLink?.liveId;
  if (liveId != null && liveId !== "") {
    return `/streams/${encodedMatchId}/?liveId=${encodeURIComponent(String(liveId))}`;
  }

  return `/streams/${encodedMatchId}/`;
}

function sclBindFeaturedStreamClick_SCL(detailUrl) {
  const $wrapper = getStreamVideoWrapperHome_SCL();
  if (!$wrapper.length) return;

  if (detailUrl) {
    $wrapper.attr("data-stream-detail-url", detailUrl).addClass("dv2-video-wrapper--clickable");
  } else {
    $wrapper.removeAttr("data-stream-detail-url").removeClass("dv2-video-wrapper--clickable");
  }
}

function sclRefreshFeaturedReviveAds_SCL() {
  window.DV2_StreamChrome?.refreshReviveAds?.(getMatchTopInfoHome_SCL());
}

function sclRefreshHotLiveReviveAds_SCL() {
  window.DV2_StreamChrome?.refreshReviveAds?.(
    $(".dv2-layout-scl.dv2-hotlive-ctn .dv2-hot-content"),
  );
}

function sclInitTopMarquee_SCL($root) {
  const $scope = $root?.length ? $root : getMatchTopInfoHome_SCL();
  $scope.find(".dv2-video-inner-top-marquee").each(function () {
    const container = this;
    const track = container.querySelector(".dv2-video-inner-top-marquee-track");
    const contents = track?.querySelectorAll(".dv2-video-inner-top-marquee-content");
    if (!track || !contents?.length) return;

    contents.forEach((el) => {
      el.style.display = "";
    });

    const contentWidth = contents[0].offsetWidth;
    if (!contentWidth) return;

    const pxPerSec = 60;
    const duration = Math.max(contentWidth / pxPerSec, 6);
    // track.style.animation = `dv2-video-inner-marquee ${duration}s linear infinite`;
  });
}

function sclScheduleTopMarqueeInit_SCL($root) {
  const run = () => sclInitTopMarquee_SCL($root);
  requestAnimationFrame(() => requestAnimationFrame(run));
  setTimeout(run, 400);
}

function renderNewScreen_SCL(data) {
  if (!data) return;

  const league = data.league || {};
  const home = data.teams?.home || {};
  const away = data.teams?.away || {};
  const matchInfo = data.matchInfo || {};
  const hdp = data.hdp;
  const ou = data.ou;
  const hasOddsData = sclHasStreamOddsData_SCL(data);
  const links = data.livestream?.links || [];
  const detailUrl = sclGetStreamDetailUrl_SCL(data);
  const betButtonsHtml = sclGetHomeBetButtonsHtml_SCL();
  const betButtonHeaderHtml = sclGetHomeBetButtonHeaderHtml_SCL();
  const betButtonFooterHtml = sclGetHomeBetButtonFooterHtml_SCL();

  const leagueName = league.name || "";
  const leagueLogo = league.logo || "";
  const homeName = home.name || "Home";
  const homeLogo = home.logo || "";
  const awayName = away.name || "Away";
  const awayLogo = away.logo || "";

  const kickoff = matchInfo.kickoff ? new Date(matchInfo.kickoff) : null;
  const dateStr = kickoff
    ? `${String(kickoff.getDate()).padStart(2, "0")}/${String(kickoff.getMonth() + 1).padStart(2, "0")}`
    : "";

  let timeStr = "";
  if (kickoff) {
    const now = new Date();
    const diffMs = kickoff - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffMs > 0 && diffHours < 24) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      matchInfo._kickoffForCountdown = kickoff;
    } else {
      timeStr = `${String(kickoff.getHours()).padStart(2, "0")}:${String(kickoff.getMinutes()).padStart(2, "0")}`;
    }
  }

  const commentatorHtml = links.length
    ? links
        .map((link) => {
          const commentatorUrl = sclGetStreamDetailUrl_SCL(data, link);
          return `
            <a href="${commentatorUrl}">
              <div class="dv2-video-inner-commentator-item">
                <div class="dv2-video-inner-commentator-avatar">
                  ${link.avatar ? `<img src="${link.avatar}" alt="${link.commentator}" />` : "👨"}
                </div>
                <div class="dv2-video-inner-commentator-name">${link.commentator}</div>
              </div>
            </a>`;
        })
        .join("")
    : "";

  const oddsHtml = hasOddsData
    ? `
      <div class="dv2-video-inner-odds">
        <div class="dv2-video-inner-odds-group">
          <div class="dv2-video-inner-odds-type">HDP</div>
          <div class="dv2-video-inner-odds-values">
            <div>${hdp?.home ?? ""}</div>
            <div>${hdp?.rate ?? ""}</div>
            <div>${hdp?.away ?? ""}</div>
          </div>
        </div>
        <div class="dv2-video-inner-odds-group">
          <div class="dv2-video-inner-odds-type">O/U</div>
          <div class="dv2-video-inner-odds-values">
            <div>${ou?.over ?? "-"}</div>
            <div>${ou?.rate ?? "-"}</div>
            <div>${ou?.under ?? "-"}</div>
          </div>
        </div>
      </div>`
    : "";

  const html = `
    <div class="dv2-video-inner-top-banner">
      <div class="dv2-video-inner-top-left">
        <div class="dv2-video-inner-top-icon"><img src="${leagueLogo}" alt="${leagueName}" /></div>
        <div class="dv2-video-inner-top-title">${leagueName}</div>
      </div>
      <div class="dv2-video-inner-top-marquee">
        <div class="dv2-video-inner-top-marquee-track">
          <div class="dv2-video-inner-top-marquee-content">${betButtonHeaderHtml}</div>
          <div class="dv2-video-inner-top-marquee-content" aria-hidden="true">${betButtonHeaderHtml}</div>
        </div>
      </div>
    </div>
    <div class="dv2-video-inner-main-banner">
      <div class="dv2-video-inner-team-info">
        <div class="dv2-video-inner-team dv2-video-inner-team-left">
          <div class="dv2-video-inner-team-flag">
            ${homeLogo ? `<img src="${homeLogo}" alt="${homeName}" />` : ""}
          </div>
          <div class="dv2-video-inner-team-name">${homeName}</div>
        </div>
        <div class="vs-image">
          <img src="${sclGetSocoliveImageUrl_SCL("vs-icon.png")}" alt="VS" />
        </div>
        <div class="dv2-video-inner-team dv2-video-inner-team-right">
          <div class="dv2-video-inner-team-flag">
            ${awayLogo ? `<img src="${awayLogo}" alt="${awayName}" />` : ""}
          </div>
          <div class="dv2-video-inner-team-name">${awayName}</div>
        </div>
      </div>
    </div>
    <div class="dv2-video-inner-time-box-wrapper">
      <div class="dv2-video-inner-time-box">
        <div class="dv2-video-inner-time-label">Thời gian: ${dateStr}</div>
        <div class="dv2-video-inner-time-value">${timeStr}</div>
      </div>
    </div>
    <div class="dv2-video-inner-footer-bar">
      <div class="dv2-video-inner-odds-row">
        ${oddsHtml}
        <div class="dv2-video-inner-cta-group"><div class="dv2-video-inner-cta-track">${betButtonsHtml}</div></div>
      </div>
      <div class="dv2-video-inner-commentator">
        ${betButtonFooterHtml}
        <div class="dv2-video-inner-commentator-list">${commentatorHtml}</div>
      </div>
    </div>`;

  const $matchTopInfo = getMatchTopInfoHome_SCL();
  $matchTopInfo.html(html);
  sclBindFeaturedStreamClick_SCL(detailUrl);
  sclRefreshFeaturedReviveAds_SCL();
  sclScheduleTopMarqueeInit_SCL($matchTopInfo);
  $matchTopInfo.find(".dv2-video-inner-top-marquee img").each(function () {
    if (this.complete) {
      sclScheduleTopMarqueeInit_SCL($matchTopInfo);
    } else {
      $(this).one("load error", () => sclScheduleTopMarqueeInit_SCL($matchTopInfo));
    }
  });

  if (matchInfo._kickoffForCountdown) {
    const kickoffForCountdown = matchInfo._kickoffForCountdown;
    delete matchInfo._kickoffForCountdown;

    if (window._sclCountdownInterval) {
      clearInterval(window._sclCountdownInterval);
    }

    window._sclCountdownInterval = setInterval(() => {
      const diffMs = kickoffForCountdown - new Date();
      if (diffMs <= 0) {
        clearInterval(window._sclCountdownInterval);
        window._sclCountdownInterval = null;
        location.reload();
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      const countdownStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      getMatchTopInfoHome_SCL().find(".dv2-video-inner-time-value").text(countdownStr);
    }, 1000);
  }
}

function renderSliderAppointmentsBlock_SCL(matches) {
  const $scheduleContainer = $(".dv2-layout-scl.dv2-appoinment-list-ctn .dv2-appoinment-swiper-container");
  const $wrapper = $scheduleContainer.find(".dv2-swiper-wrapper");
  $wrapper.empty();

  matches.forEach(function (match, index) {
    const matchId = match?.match_id || match?.id || match?.slug || index;
    const leagueName = match?.league?.name || "N/A";
    const leagueLogo =
      match?.league?.logo ||
      "https://sta.vnres.co/file/common/20210503/fca5954ec22137ad05325506d6645592";
    const dateLabel = getDateLabel_SCL(match?.kickoff || "");
    const timeLabel = formatTime_SCL(match?.kickoff || "");
    const homeName = match?.teams?.home?.name || "Home Team";
    const homeLogo = match?.teams?.home?.logo || "Logo";
    const awayName = match?.teams?.away?.name || "Away Team";
    const awayLogo = match?.teams?.away?.logo || "Logo";

    $wrapper.append(`
      <div class="dv2-swiper-slide swiper-slide" style="cursor:pointer;" data-id="${matchId}" onclick="goToMatchDetail('${matchId}')">
        <div class="dv2-title">
          <div class="dv2-fl">
            <img onerror="this.src='${TEAM_ICON_FALLBACK}'" src="${leagueLogo}" class="icon" draggable="false">
            <span>${leagueName}</span>
          </div>
          <div class="dv2-fr dv2-match-time">
            <span style="padding-right:5px;">${dateLabel}</span>
            ${timeLabel}
          </div>
        </div>
        <div class="dv2-box" style="display: flex;">
          <div class="dv2-battle-team">
            <p>
              <img onerror="this.src='${TEAM_ICON_FALLBACK}'" class="dv2-logo" src="${homeLogo}" data-src="${homeLogo}" draggable="false">
              <span class="dv2-ellipsis">${homeName}</span>
            </p>
            <p>
              <img onerror="this.src='${TEAM_ICON_FALLBACK}'" class="dv2-logo" src="${awayLogo}" data-src="${awayLogo}" alt="" draggable="false">
              <span class="dv2-ellipsis">${awayName}</span>
            </p>
          </div>
          <a href="${window.DV2_LINK_BET}" target="_blank" rel="nofollow"
            data-id="${matchId}" data-slug="${match.slug || ""}"
            class="dv2-appoinment" onclick="event.stopPropagation();" draggable="false">
            <span class="no-appoinment">Đặt cược</span>
          </a>
        </div>
      </div>
    `);
  });

  $scheduleContainer.show();
  initSwiperInstance(
    ".dv2-layout-scl.dv2-appoinment-list-ctn .dv2-appoinment-swiper-container",
    ".dv2-appoinment-next",
    ".dv2-appoinment-prev"
  );
}

function renderSlideBlvBlock_SCL() {
  const $scheduleContainer = $(".dv2-layout-scl.dv2-blv-list-ctn .dv2-anchor-swiper-container");
  const $wrapper = $scheduleContainer.find(".dv2-swiper-wrapper");
  $wrapper.empty();
  $wrapper.html(`
    <div class="dv2-loading-blv" style="color:#000;text-align:center;padding:40px 0;">
      Đang tải danh sách bình luận viên...
    </div>
  `);

  $.ajax({
    url: `${baseApiUrl}/api/admin/streams/commentators`,
    method: "GET",
    dataType: "json",
    success(res) {
      if (!res || res.message !== "success" || !Array.isArray(res.commentators)) {
        $wrapper.html(
          '<div style="color:#fff;text-align:center;padding:40px 0;">Không có dữ liệu bình luận viên</div>'
        );
        return;
      }

      if (!res.commentators.length) {
        $wrapper.html(
          '<div style="color:#fff;text-align:center;padding:40px 0;">Không có bình luận viên nào</div>'
        );
        return;
      }

      $wrapper.empty();
      res.commentators.forEach((blv) => {
        const name = blv?.name || "Bình luận viên";
        const avatar =
          blv?.avatar ||
          "https://sta.vnres.co/file/common/20250410/000bfdfc22afe0f322140fabd2228aec.jpg";
        $wrapper.append(`
          <div class="dv2-swiper-slide swiper-slide dv2-person-blv" data-id="${blv?.id}">
            <a href="javascript:void(0)">
              <img onerror="this.src='${TEAM_ICON_FALLBACK}'" class="dv2-blv-avatar" src="${avatar}" alt="${name}">
              <p class="dv2-blv-name ellipsis">${name}</p>
            </a>
          </div>
        `);
      });

      initSwiperInstanceCom(
        ".dv2-layout-scl.dv2-blv-list-ctn .dv2-anchor-swiper-container",
        ".dv2-anchor-next",
        ".dv2-anchor-prev"
      );
    },
    error() {
      $wrapper.html(`
        <div style="color:#fff;text-align:center;padding:40px 0;">
          Lỗi khi tải danh sách bình luận viên
        </div>
      `);
    },
  });
}

function getHotLiveRenderOptions_SCL() {
  return {
    baseApiUrl,
    ajax: $.ajax,
    sortedMatchesFunction: hotLiveSortedMatchesFunction,
    liveStatuses: LIVE_STATUS,
    hotLeaguesRank: appState.hotLeaguesRank,
    getPreferredLivestreamLink,
    onRendered() {
      sclRefreshHotLiveReviveAds_SCL();
    },
  };
}

function renderHotLiveBlock_SCL(matches = []) {
  DV2SocoliveHotLive.render(matches, getHotLiveRenderOptions_SCL());
}

function initHotLiveBlock_SCL() {
  if (!$(".dv2-layout-scl.dv2-hotlive-ctn .dv2-hot-content").length) {
    return;
  }

  const start = () => DV2SocoliveHotLive.init(getHotLiveRenderOptions_SCL());
  const hotLeaguesRequest = DV2HotLeagues.load({
    url: `${baseApiUrl}/api/data/lives/competitions/hot`,
    ajax: $.ajax,
    setHotLeaguesRank: (rankMap) => {
      appState.hotLeaguesRank = rankMap;
    },
  });

  if (hotLeaguesRequest && typeof hotLeaguesRequest.always === "function") {
    hotLeaguesRequest.always(start);
    return;
  }

  start();
}

function renderListLiveMatch_SCL(liveMatch) {
  const $roomList = $(".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-room-list");
  const slicedMatches = (liveMatch || []).slice(0, 10).map((match) => {
    const title = (match?.title || match?.slug || "Trận đấu").replace(/vuasanco/gi, "").trim();
    const slug = match?.slug || title.toLowerCase().replace(/\s+/g, "-");
    return {
      id: match?.match_id || slug,
      homeLogo: match?.teams?.home?.logo || "",
      awayLogo: match?.teams?.away?.logo || "",
      homeName: match?.teams?.home?.name || "Đội nhà",
      awayName: match?.teams?.away?.name || "Đội khách",
    };
  });

  $roomList.empty();
  slicedMatches.forEach((match, index) => {
    $roomList.append(`
      <li class="dv2-item-match" data-id="${match.id}" data-index="${index}">
        <a href="javascript:void(0)" class="${index === 0 ? "dv2-active" : ""}">
          <div class="dv2-match-card">
            <div class="dv2-team dv2-team-home">
              <img class="dv2-team-logo" src="${match.homeLogo}" alt="${match.homeName}" onerror="this.src='${TEAM_ICON_FALLBACK}'">
              <span class="dv2-team-name">${match.homeName}</span>
            </div>
            <div class="vs">VS</div>
            <div class="dv2-team dv2-team-away">
              <img class="dv2-team-logo" src="${match.awayLogo}" alt="${match.awayName}" onerror="this.src='${TEAM_ICON_FALLBACK}'">
              <span class="dv2-team-name">${match.awayName}</span>
            </div>
          </div>
        </a>
      </li>
    `);
  });
}

function formatTime_SCL(datetime) {
  if (!datetime) return "";
  const date = new Date(datetime);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getDateLabel_SCL(matchDate) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const match = new Date(matchDate);
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  match.setHours(0, 0, 0, 0);

  if (match.getTime() === today.getTime()) {
    return "Hôm nay";
  }
  if (match.getTime() === tomorrow.getTime()) {
    return "Ngày mai";
  }

  const day = String(match.getDate()).padStart(2, "0");
  const month = String(match.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function initSwiperInstance(containerSelector, nextBtnSelector, prevBtnSelector) {
  if (!$(containerSelector).length) {
    return null;
  }

  return new Swiper(containerSelector, {
    slidesPerView: 1.5,
    navigation: {
      nextEl: nextBtnSelector,
      prevEl: prevBtnSelector,
    },
    breakpoints: {
      640: { slidesPerView: 2 },
      768: { slidesPerView: 3 },
      1024: { slidesPerView: 4 },
      1280: { slidesPerView: 5 },
    },
    loop: true,
    watchSlidesProgress: true,
    roundLengths: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
  });
}

function initSwiperInstanceCom(containerSelector, nextBtnSelector, prevBtnSelector) {
  if (!$(containerSelector).length) {
    return null;
  }

  return new Swiper(containerSelector, {
    slidesPerView: 8,
    navigation: {
      nextEl: nextBtnSelector,
      prevEl: prevBtnSelector,
    },
    breakpoints: {
      640: { slidesPerView: 3 },
      768: { slidesPerView: 3 },
      1024: { slidesPerView: 5 },
      1280: { slidesPerView: 8 },
    },
    loop: false,
    watchSlidesProgress: true,
    roundLengths: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
  });
}

$(document).on(
  "click",
  ".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-video-wrapper.dv2-video-wrapper--clickable",
  function (e) {
    if (
      $(e.target).closest(
        "a, button, input, label, .dv2-video-inner-cta-group, .dv2-video-inner-commentator-list"
      ).length
    ) {
      return;
    }

    const url = $(this).attr("data-stream-detail-url");
    if (url) {
      window.location.href = url;
    }
  }
);

$(document).on("click", ".dv2-layout-scl.dv2-hotlive-ctn .dv2-game", function (e) {
  if ($(e.target).closest(".dv2-blv-dropdown").length) {
    return;
  }
  const $btn = $(this);
  const href = $btn.attr("href");
  if (href && href !== "#") {
    return;
  }
  e.preventDefault();
  const matchId = $btn.data("id") || "";
  window.location.href = `/streams/${matchId}`;
});

function goToMatchDetail(matchId) {
  window.location.href = `/streams/${matchId}`;
}

// Expose required functions to global scope
window.goToMatchDetail = goToMatchDetail;
})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* detail.js */
(function(window, $, jQuery, Hls, Swiper) {
$ = jQuery.noConflict();
const POSTER_URL_TC =
  "https://img.freepik.com/premium-photo/close-up-soccer-player-who-kicks-ball_207634-4089.jpg";
const TC_STREAM_LOADING_PLAYING_MS = 12000;

// =================================================
// Init
// =================================================
$(document).ready(function () {
  if ($(".dv2-layout-tc.dv2-detail-stream-ctn").length > 0) {
    const video = document.getElementById("liveVideo");
    if (video) {
      initStreamPlayerUi_TC(video);
      initThapcamMobilePlaybackFix_TC();
    }
    const matchId = getMatchIdFromUrl_TC();
    loadMatchData_TC(matchId);
  }
});

let currentHls_TC = null;
let matchData_TC = null;
let currentActiveLink_TC = null;
let detailScorePoll_TC = null;
let tcPlaybackGeneration = 0;
let tcManifestTimeout = null;
let tcNativeTimeout = null;

function startDetailScorePoll_TC(match) {
  if (!match) return;
  if (!detailScorePoll_TC) {
    detailScorePoll_TC = DV2MatchScorePoll.create({
      container: ".dv2-layout-tc.dv2-detail-stream-ctn",
    });
  }
  detailScorePoll_TC.sync(match);
  detailScorePoll_TC.start();
}

function getStreamChrome_TC() {
  return window.DV2_StreamChrome;
}

function getStreamVideoWrapper_TC() {
  return $(".dv2-layout-tc.dv2-detail-stream-ctn .dv2-video-wrapper").first();
}

function applyThapcamVideoAttrs_TC($video) {
  if (!$video?.length) return;
  const el = $video[0];
  $video.prop("controls", false);
  $video.removeAttr("controls");
  $video.attr({
    playsinline: "",
    "webkit-playsinline": "",
    "x-webkit-airplay": "allow",
  });
  if (el) {
    el.controls = false;
    if ("disablePictureInPicture" in el) {
      el.disablePictureInPicture = true;
    }
  }
}

function initStreamPlayerUi_TC(video) {
  const $wrapper = getStreamVideoWrapper_TC();
  const chrome = getStreamChrome_TC();
  if (!$wrapper.length || !chrome) return;
  const $video = video ? $(video) : $wrapper.find("video").first();
  applyThapcamVideoAttrs_TC($video);
  chrome.initPlayerUi($wrapper, $video);
  applyThapcamVideoAttrs_TC($video);
}

function initThapcamMobilePlaybackFix_TC() {
  const $wrapper = getStreamVideoWrapper_TC();
  if (!$wrapper.length || $wrapper.data("tcMobileFixBound")) return;
  $wrapper.data("tcMobileFixBound", true);

  const syncTcFsLayoutClass = () => {
    const wrapperEl = $wrapper[0];
    const isNativeFs =
      !!wrapperEl &&
      (document.fullscreenElement === wrapperEl ||
        document.webkitFullscreenElement === wrapperEl);
    const isFs = isNativeFs || $wrapper.hasClass("dv2-stream-wrapper-fs");
    $wrapper.toggleClass("dv2-tc-stream-fs", isFs);
    $wrapper
      .closest(".dv2-thapcam-video")
      .toggleClass("dv2-tc-stream-parent-fs", isFs);
  };

  $wrapper.on("dv2wrapperfschange.tcFsLayout", syncTcFsLayoutClass);
  $(document).on(
    "fullscreenchange.tcFsLayout webkitfullscreenchange.tcFsLayout",
    syncTcFsLayoutClass
  );
  $(window).on("resize.tcFsLayout orientationchange.tcFsLayout", syncTcFsLayoutClass);
  syncTcFsLayoutClass();

  $wrapper.on(
    "play.dv2TcMobileFix pause.dv2TcMobileFix loadedmetadata.dv2TcMobileFix",
    "video",
    function () {
      applyThapcamVideoAttrs_TC($(this));
    }
  );
}

function onHlsStreamReady_TC() {
  const chrome = getStreamChrome_TC();
  const $wrapper = getStreamVideoWrapper_TC();
  if ($wrapper.length) {
    clearMatchOverlays_TC($wrapper);
  }
  if (chrome && $wrapper.length) {
    if (matchData_TC) {
      chrome.rememberOddsMatchData?.($wrapper, matchData_TC);
    }
    chrome.onHlsReady($wrapper);
  }
}

function initStreamOddsPanel_TC(matchData) {
  const chrome = getStreamChrome_TC();
  const $wrapper = getStreamVideoWrapper_TC();
  if (!chrome || !$wrapper.length || !matchData) return;
  chrome.rememberOddsMatchData?.($wrapper, matchData);
  chrome.initOddsPanel?.($wrapper, matchData);
}

function clearStreamChrome_TC() {
  const chrome = getStreamChrome_TC();
  const $wrapper = getStreamVideoWrapper_TC();
  if (chrome && $wrapper.length) {
    chrome.clearFullChrome($wrapper);
  }
}

function showStreamLoading_TC($videoContainer, message = "Đang tải luồng phát...") {
  if (!$videoContainer?.length) return $();
  hideStreamLoading_TC($videoContainer);
  const safeMessage = String(message || "Đang tải luồng phát...")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const $overlay = $(`
    <div class="dv2-stream-loading" role="status" aria-live="polite" aria-busy="true">
      <div class="dv2-stream-loading__panel">
        <div class="dv2-stream-loading__spinner" aria-hidden="true"></div>
        <p class="dv2-stream-loading__text">${safeMessage}</p>
      </div>
    </div>
  `);
  $videoContainer.append($overlay);
  return $overlay;
}

function hideStreamLoading_TC($videoContainer) {
  ($videoContainer?.length ? $videoContainer : getStreamVideoWrapper_TC())
    .find(".dv2-stream-loading")
    .remove();
}

function clearTcPlaybackTimers() {
  if (tcManifestTimeout) {
    clearTimeout(tcManifestTimeout);
    tcManifestTimeout = null;
  }
  if (tcNativeTimeout) {
    clearTimeout(tcNativeTimeout);
    tcNativeTimeout = null;
  }
}

function stopStreamPlayback_TC($video) {
  tcPlaybackGeneration += 1;
  clearTcPlaybackTimers();
  if (currentHls_TC) {
    try {
      currentHls_TC.destroy();
    } catch (e) {
      console.warn(e);
    }
    currentHls_TC = null;
  }
  if (!$video?.length) return;
  const el = $video[0];
  el.pause();
  el.removeAttribute("src");
  if (typeof el.load === "function") {
    el.load();
  }
}

function ensurePosterVideo_TC($wrapper) {
  if (!$wrapper?.length) return $();

  let $video = $wrapper.find("#liveVideo");
  if ($video.length) {
    stopStreamPlayback_TC($video);
        $video.attr({
            poster: DV2StreamKickoff.resolvePosterUrl(currentActiveLink_TC, POSTER_URL_TC),
            muted: true,
            playsinline: true,
        });
    $video.prop({ autoplay: false, controls: false });
    applyThapcamVideoAttrs_TC($video);
  } else {
    $video = $("<video>", {
      id: "liveVideo",
      class: "dv2-video-player",
      controls: false,
      autoplay: false,
      muted: true,
      playsinline: true,
            poster: DV2StreamKickoff.resolvePosterUrl(currentActiveLink_TC, POSTER_URL_TC),
    });
    $wrapper.find(".dv2-video-container").append($video);
    applyThapcamVideoAttrs_TC($video);
  }

  const chrome = getStreamChrome_TC();
  if (chrome) {
    chrome.applyVideoControls?.($video);
    chrome.ensureControlsBar?.($wrapper);
  }
  return $video;
}

function clearMatchOverlays_TC($wrapper) {
  ($wrapper?.length ? $wrapper : getStreamVideoWrapper_TC())
    .find(".dv2-loading.dv2-match-overlay, .dv2-not-loaded.dv2-match-overlay")
    .remove();
}

function createMatchOverlay_TC(match) {
  const kickoff = match?.matchInfo?.kickoff;
  const league = match?.league || {};
  const homeName = match?.teams?.home?.name || "Home";
  const awayName = match?.teams?.away?.name || "Away";
  const statusMatch = match?.matchInfo?.status;
  return $(`
    <div class="dv2-loading">
      <span class="dv2-loading-status">${statusMatchRender_TC(statusMatch)}</span>
      Trận đấu: <strong>${homeName} - ${awayName}</strong>
      <div class="dv2-load-league">
        <span>Giải đấu: <strong><img src="${league.logo || ""}" alt="${league.name || "-"}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"> ${league.name || "-"}</strong></span>
      </div>
      <div class="dv2-load-time">
        <span>${DV2StreamKickoff.renderTimeDisplay(kickoff)}</span>
      </div>
    </div>
  `);
}

function showMatchPosterOverlay_TC($wrapper, matchData) {
  if (!$wrapper?.length) return;

  hideStreamLoading_TC($wrapper);
  $wrapper.find(".dv2-loading").not(".dv2-match-overlay").remove();
  clearMatchOverlays_TC($wrapper);
  $(".dv2-layout-tc.dv2-detail-stream-ctn #noStreamMessage").hide();
  ensurePosterVideo_TC($wrapper);

  if (matchData) {
    const $overlay = createMatchOverlay_TC(matchData);
    $overlay.addClass("dv2-match-overlay");
    $wrapper.append($overlay);
  }

  const chrome = getStreamChrome_TC();
  if (chrome) {
    chrome.bindEvents?.($wrapper);
  }
  if (matchData?.matchInfo?.kickoff) {
    DV2StreamKickoff.startCountdown(matchData.matchInfo.kickoff);
  }
}

function createMatchInfoCard_TC(match, type = "countdown") {
  const kickoff = match?.matchInfo?.kickoff;
  const league = match?.league || {};
  const homeName = match?.teams?.home?.name || "Home";
  const awayName = match?.teams?.away?.name || "Away";
  const homeScore = match?.score?.fulltime?.home ?? 0;
  const awayScore = match?.score?.fulltime?.away ?? 0;
  const pen = match?.score?.pen;
  const hasPen = pen && (pen.home != null || pen.away != null);
  const statusMatch = match?.matchInfo?.status;

  let timeContent = "";
  if (type === "result") {
    timeContent = `<span>Kết quả: <strong><span data-dv2-score-home>${homeScore}</span> - <span data-dv2-score-away>${awayScore}</span></strong>${hasPen ? ` <span class="dv2-load-pen">(Penalty <span data-dv2-score-pen-home>${pen.home}</span> - <span data-dv2-score-pen-away>${pen.away}</span>)</span>` : ""}</span>`;
  } else {
    timeContent = `<span>${DV2StreamKickoff.renderTimeDisplay(kickoff)}</span>`;
  }

  return $(`
    <div class="dv2-loading">
      <span class="dv2-loading-status">${
        type === "result"
          ? statusMatchRender_TC("finished")
          : statusMatchRender_TC(statusMatch)
      }</span>
      Trận đấu: <strong>${homeName} - ${awayName}</strong>
      <div class="dv2-load-league">
        <span>Giải đấu: <strong><img src="${league.logo || ""}" alt="${league.name || "-"}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"> ${league.name || "-"}</strong></span>
      </div>
      <div class="dv2-load-time">
        ${timeContent}
      </div>
    </div>
  `);
}

function showMatchInfoCard_TC($wrapper, matchData, type = "countdown") {
  if (!$wrapper?.length) return;

  hideStreamLoading_TC($wrapper);
  $wrapper.find(".dv2-loading").not(".dv2-match-overlay").remove();
  clearMatchOverlays_TC($wrapper);
  $(".dv2-layout-tc.dv2-detail-stream-ctn #noStreamMessage").hide();
  ensurePosterVideo_TC($wrapper);

  if (matchData) {
    const $overlay = createMatchInfoCard_TC(matchData, type);
    $overlay.addClass("dv2-match-overlay");
    $wrapper.append($overlay);
  }

  if (type === "countdown" && matchData?.matchInfo?.kickoff) {
    DV2StreamKickoff.startCountdown(matchData.matchInfo.kickoff);
  }

  const chrome = getStreamChrome_TC();
  if (chrome) {
    chrome.bindEvents?.($wrapper);
  }
}

function bindStreamLoadingUntilPlaying_TC($videoContainer, video, onReady) {
  if (!$videoContainer?.length || !video) {
    onReady?.();
    return;
  }

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    video.removeEventListener("playing", onPlaying);
    video.removeEventListener("canplay", onCanPlay);
    clearTimeout(fallbackTimer);
    hideStreamLoading_TC($videoContainer);
    onReady?.();
  };

  const onPlaying = () => finish();
  const onCanPlay = () => {
    if (!video.paused) finish();
  };

  video.addEventListener("playing", onPlaying);
  video.addEventListener("canplay", onCanPlay);

  const fallbackTimer = setTimeout(finish, TC_STREAM_LOADING_PLAYING_MS);
}

// =================================================
// Get match ID from URL
// =================================================
function getMatchIdFromUrl_TC() {
  const params = new URLSearchParams(window.location.search);
  let matchId = params.get("match");
  if (!matchId) {
    if (typeof DV2_MATCH_ID !== "undefined" && DV2_MATCH_ID) {
      matchId = DV2_MATCH_ID;
    } else {
      matchId = "2y8m4zh54p4zql0";
    }
  }
  return matchId;
}

function shouldShowPreMatchOverlay_TC(matchData) {
  const kickoffTime = new Date(matchData?.matchInfo?.kickoff);
  return (
    !Number.isNaN(kickoffTime.getTime()) &&
    kickoffTime.getTime() - Date.now() > 15 * 60 * 1000
  );
}

function getStreamLinkContainers_TC() {
  return $(".dv2-layout-tc.dv2-detail-stream-ctn .dv2-stream-links");
}

function renderStreamBetButtons_TC() {
    const $container = $(".dv2-layout-tc.dv2-detail-stream-ctn .dv2-stream-list .dv2-bet-links");
    if (!$container.length) return;

    const html = window.DV2_SOCOLIVE_STREAM_BET_BUTTONS_HTML;
    if (typeof html === "string" && html.trim()) {
        $container.html(html);
    }

    if (!$container.children().length) return;
    window.DV2_StreamChrome?.refreshReviveAds?.($container);
}
function renderCommentatorLinks_TC(data, options = {}) {
  const { autoPlay = true } = options;
  let sortedLinks = [];

  const linkState = DV2StreamLinks.prepareSpanLinks({
    rawLinks: data?.livestream?.links,
    $container: getStreamLinkContainers_TC(),
    onSelect(link, index) {
      currentActiveLink_TC = link;
      const $wrapper = getStreamVideoWrapper_TC();
      const $video = $wrapper.find("#liveVideo");
      DV2StreamKickoff.applyPosterForLink($video, link, POSTER_URL_TC);
      updateCommentatorInfo_TC(data, index, sortedLinks);

      initStreamOddsPanel_TC(matchData_TC);

      if (
        shouldShowPreMatchOverlay_TC(matchData_TC) ||
        matchData_TC?.matchInfo?.status?.toLowerCase() === "finished" ||
        !link?.url
      ) {
        stopStreamPlayback_TC($video);
        clearMatchOverlays_TC($wrapper);
        $(".dv2-layout-tc.dv2-detail-stream-ctn #noStreamMessage").hide();

        if (matchData_TC?.matchInfo?.status?.toLowerCase() === "finished") {
          showMatchInfoCard_TC($wrapper, matchData_TC, "result");
        } else if (shouldShowPreMatchOverlay_TC(matchData_TC)) {
          showMatchInfoCard_TC($wrapper, matchData_TC, "countdown");
        } else {
          ensurePosterVideo_TC($wrapper);
        }
        return;
      }

      clearMatchOverlays_TC($wrapper);
      $(".dv2-layout-tc.dv2-detail-stream-ctn #noStreamMessage").hide();
      initVideoPlayer_TC(link.url);
    },
  });

  sortedLinks = linkState.links || [];
  if (!sortedLinks.length) return null;

  currentActiveLink_TC = linkState.activeLink;
  updateCommentatorInfo_TC(data, linkState.activeIndex, sortedLinks);
  renderStreamBetButtons_TC();
  DV2StreamKickoff.applyPosterForLink(
    getStreamVideoWrapper_TC().find("#liveVideo"),
    currentActiveLink_TC,
    POSTER_URL_TC
  );

  if (autoPlay && linkState.activeLink?.url) {
    const streamUrl = linkState.activeLink.url;
    const startStream = () => initVideoPlayer_TC(streamUrl);
    const $wrapper = getStreamVideoWrapper_TC();
    if (window.DV2StreamTvc?.playBeforeStream) {
      window.DV2StreamTvc.playBeforeStream($wrapper, startStream);
    } else {
      startStream();
    }
  }

  return linkState;
}

// =================================================
// Load match data
// =================================================
function loadMatchData_TC(matchId) {
  const $wrapper = getStreamVideoWrapper_TC();
  showStreamLoading_TC($wrapper, "Đang tải thông tin trận đấu...");

  $.ajax({
    url: `https://vsc-apidev.helizones.com/api/data/lives/${matchId}`,
    method: "GET",
    success: function (response) {
      hideStreamLoading_TC($wrapper);
      if (response && response.data) {
        matchData_TC = response.data;
        const data = matchData_TC;

        startDetailScorePoll_TC(data);
        initStreamOddsPanel_TC(data);

        // kiểm tra thời gian diễn ra trận đấu có lớn hơn 15 phút không, nếu lớn hơn 15 phút thì hiển thị countdown
        const kickoffTime = new Date(data?.matchInfo?.kickoff);
        const shouldShowCountdown =
          !Number.isNaN(kickoffTime.getTime()) &&
          kickoffTime.getTime() - Date.now() > 15 * 60 * 1000;

        if (shouldShowCountdown) {
          clearStreamChrome_TC();
          updatePageTitle_TC(data);
          renderScoreOverlay_TC(data);
          renderCommentatorLinks_TC(data, { autoPlay: false });

          const showCountdown = () => {
            showMatchInfoCard_TC($wrapper, data, "countdown");
            $(".dv2-layout-tc.dv2-detail-stream-ctn #scoreOverlay").show();
          };

          if (window.DV2StreamTvc?.playBeforeStream) {
            window.DV2StreamTvc.playBeforeStream($wrapper, showCountdown);
          } else {
            showCountdown();
          }
          return;
        }

        // kiểm tra trạng thái trận đấu có kết thúc không, nếu kết thúc thì hiển thị kết quả
        if (data?.matchInfo?.status?.toLowerCase() === "finished") {
          clearStreamChrome_TC();
          updatePageTitle_TC(data);
          renderScoreOverlay_TC(data);
          renderCommentatorLinks_TC(data, { autoPlay: false });
          showMatchInfoCard_TC($wrapper, data, "result");
          $(".dv2-layout-tc.dv2-detail-stream-ctn #scoreOverlay").show();
          return;
        }

        renderMatchPage_TC();
      } else {
        showError_TC();
      }
    },
    error: function () {
      hideStreamLoading_TC($wrapper);
      showError_TC();
    },
  });
}

// =================================================
// Render match page
// =================================================
function renderMatchPage_TC() {
  const data = matchData_TC;

  updatePageTitle_TC(data);
  renderScoreOverlay_TC(data);

  const linkState = renderCommentatorLinks_TC(data);
  if (linkState?.links?.length) {
    $(".dv2-layout-tc.dv2-detail-stream-ctn #scoreOverlay").show();
  } else {
    clearStreamChrome_TC();
    showMatchPosterOverlay_TC(getStreamVideoWrapper_TC(), data);
    $(".dv2-layout-tc.dv2-detail-stream-ctn #scoreOverlay").show();
  }
}

// =================================================
// Update page title
// =================================================
function updatePageTitle_TC(data) {
  const homeTeam = data.teams?.home?.name || "Home";
  const awayTeam = data.teams?.away?.name || "Away";
  const kickoff = new Date(data.matchInfo.kickoff);
  const dateStr = kickoff.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = kickoff.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  $(".dv2-layout-tc.dv2-detail-stream-ctn #pageTitle").text(
    `LINK TRỰC TIẾP ${homeTeam.toUpperCase()} VS ${awayTeam.toUpperCase()} LÚC ${timeStr} ${dateStr} MIỄN PHÍ`
  );
}

// =================================================
// Render score overlay
// =================================================
function renderScoreOverlay_TC(data) {
  const homeTeam = data.teams?.home || {};
  const awayTeam = data.teams?.away || {};
  const homeScore = data.score?.fulltime?.home ?? 0;
  const awayScore = data.score?.fulltime?.away ?? 0;
  const pen = data.score?.pen;
  const hasPen = pen && (pen.home != null || pen.away != null);

  $(".dv2-layout-tc.dv2-detail-stream-ctn #homeTeam").html(`
                <div class="dv2-overlay-flag">
                    <img src="${homeTeam.logo}" alt="${homeTeam.name}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
                </div>
                <div class="dv2-overlay-team-name">${
                  homeTeam.name || "Home"
                }</div>
            `);

  $(".dv2-layout-tc.dv2-detail-stream-ctn #scoreDisplay").html(`
                <div class="dv2-overlay-score-main">
                    <div class="dv2-score-number dv2-home-score-number" data-dv2-score-home>${homeScore}</div>
                    <div class="dv2-score-separator">-</div>
                    <div class="dv2-score-number dv2-away-score-number" data-dv2-score-away>${awayScore}</div>
                </div>
                ${hasPen ? `
                <div class="dv2-overlay-score-pen">
                    <span class="dv2-pen-value"><span data-dv2-score-pen-home>${pen.home}</span> - <span data-dv2-score-pen-away>${pen.away}</span></span>
                    <span class="dv2-pen-label">(Penalty)</span>
                </div>
                ` : ""}
            `);

  $(".dv2-layout-tc.dv2-detail-stream-ctn #awayTeam").html(`
                <div class="dv2-overlay-flag">
                    <img src="${awayTeam.logo}" alt="${awayTeam.name}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
                </div>
                <div class="dv2-overlay-team-name">${
                  awayTeam.name || "Away"
                }</div>
            `);
}

// =================================================
// Update commentator info
// =================================================
function updateCommentatorInfo_TC(data, index = 0, sortedLinks = null) {
  const links = sortedLinks || DV2StreamLinks.sortForDetail(data?.livestream?.links);
  const commentator = links[index];
  if (commentator) {
    $(".dv2-layout-tc.dv2-detail-stream-ctn #commentatorInfo").text(
      commentator.commentator.toUpperCase()
    );
  }
}

// =================================================
// Init video player
// =================================================
function initVideoPlayer_TC(streamUrl) {
  const $wrapper = getStreamVideoWrapper_TC();
  const $video = $wrapper.find("#liveVideo");
  const video = $video[0];

  tcPlaybackGeneration += 1;
  const playbackGen = tcPlaybackGeneration;
  const isStalePlayback = () => playbackGen !== tcPlaybackGeneration;

  clearMatchOverlays_TC($wrapper);
  clearTcPlaybackTimers();

  if (!streamUrl || !video) {
    hideStreamLoading_TC($wrapper);
    if (matchData_TC) {
      showMatchPosterOverlay_TC($wrapper, matchData_TC);
    } else {
      showError_TC("Không tìm thấy video livestream");
    }
    return;
  }

  let hasFallback = false;
  const showFallback = () => {
    if (isStalePlayback() || hasFallback) return;
    hasFallback = true;
    clearTcPlaybackTimers();
    if (currentHls_TC) {
      try {
        currentHls_TC.destroy();
      } catch (e) {
        console.warn(e);
      }
      currentHls_TC = null;
    }
    if (video) {
      video.pause();
      video.removeAttribute("src");
      if (typeof video.load === "function") {
        video.load();
      }
    }
    hideStreamLoading_TC($wrapper);
    clearStreamChrome_TC();
    if (matchData_TC) {
      showMatchPosterOverlay_TC($wrapper, matchData_TC);
    } else {
      showError_TC("Không tải được video livestream");
    }
  };

  if (currentHls_TC) {
    try {
      currentHls_TC.destroy();
    } catch (e) {
      console.warn(e);
    }
    currentHls_TC = null;
  }

  $(".dv2-layout-tc.dv2-detail-stream-ctn #noStreamMessage").hide();
  showStreamLoading_TC($wrapper, "Đang tải luồng phát...");
  initStreamPlayerUi_TC(video);

  if (Hls.isSupported()) {
    tcManifestTimeout = setTimeout(() => {
      if (isStalePlayback()) return;
      console.warn("[VSC LIVE] Manifest load timeout");
      showFallback();
    }, 15000);

    currentHls_TC = new Hls({
      maxBufferLength: 10,
      liveSyncDuration: 3,
      enableWorker: true,
      xhrSetup: function (xhr) {
        xhr.withCredentials = false;
        xhr.referrerPolicy = "no-referrer-when-downgrade";
      },
    });

    currentHls_TC.loadSource(streamUrl);
    currentHls_TC.attachMedia(video);

    currentHls_TC.on(Hls.Events.MANIFEST_PARSED, function () {
      if (isStalePlayback()) return;
      clearTcPlaybackTimers();
      bindStreamLoadingUntilPlaying_TC($wrapper, video, () => {
        if (isStalePlayback()) return;
        onHlsStreamReady_TC();
      });
      video.muted = true;
      getStreamChrome_TC()?.syncControlsState?.($wrapper, $video);
      video.play().catch(() => console.warn("Autoplay blocked"));
    });

    currentHls_TC.on(Hls.Events.ERROR, function (event, data) {
      if (isStalePlayback()) return;
      if (data.fatal) {
        clearTcPlaybackTimers();
        showFallback();
      }
    });
    video.addEventListener(
      "error",
      function () {
        if (isStalePlayback()) return;
        clearTcPlaybackTimers();
        showFallback();
      },
      { once: true }
    );
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    tcNativeTimeout = setTimeout(() => {
      if (isStalePlayback()) return;
      console.warn("[VSC LIVE] Native HLS load timeout");
      showFallback();
    }, 15000);
    video.src = streamUrl;
    video.addEventListener("loadedmetadata", function () {
      if (isStalePlayback()) return;
      clearTcPlaybackTimers();
      bindStreamLoadingUntilPlaying_TC($wrapper, video, () => {
        if (isStalePlayback()) return;
        onHlsStreamReady_TC();
      });
      video.muted = true;
      getStreamChrome_TC()?.syncControlsState?.($wrapper, $video);
      video.play().catch(() => console.warn("Autoplay blocked on Safari"));
    });
    video.addEventListener(
      "error",
      function () {
        if (isStalePlayback()) return;
        clearTcPlaybackTimers();
        showFallback();
      },
      { once: true }
    );
  } else {
    showFallback();
  }
}

// =================================================
// Show error
// =================================================
function showError_TC(message = "Không có luồng livestream") {
  const $wrapper = getStreamVideoWrapper_TC();
  hideStreamLoading_TC($wrapper);
  clearStreamChrome_TC();
  $wrapper.find(".dv2-loading").not(".dv2-match-overlay").remove();
  clearMatchOverlays_TC($wrapper);
  ensurePosterVideo_TC($wrapper);

  const safeMessage = String(message || "Không có luồng livestream")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const $error = $(`
    <div class="dv2-not-loaded dv2-match-overlay">
      <div class="dv2-no-stream" id="noStreamMessage">
        <div class="dv2-no-stream-icon">🚫</div>
        <div class="dv2-no-stream-title">${safeMessage}</div>
        <div class="dv2-no-stream-subtitle">
          Trận đấu này hiện chưa có luồng phát trực tiếp hoặc bị lỗi.<br>
          Vui lòng quay lại sau hoặc xem các trận đấu khác.
        </div>
      </div>
    </div>
  `);
  $wrapper.append($error);

  const chrome = getStreamChrome_TC();
  if (chrome) {
    chrome.bindEvents?.($wrapper);
  }
}

function getDateLabel_TC(matchDate) {
  if (!matchDate) return "";
  const match = new Date(matchDate);
  const day = String(match.getDate()).padStart(2, "0");
  const month = String(match.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${match.getFullYear()}`;
}

function formatTime_TC(datetime) {
  if (!datetime) return "";
  const date = new Date(datetime);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function statusMatchRender_TC(status) {
  const MATCH_STATUS_VI = {
    "not started": "Sắp diễn ra",
    "to be determined": "Chưa xác định",
    delay: "Trì hoãn",
    interrupt: "Tạm dừng",
    "cut in half": "Bị cắt hiệp",
    postponed: "Hoãn trận",
    suspended: "Tạm hoãn",
    abandoned: "Bỏ dở",
    cancel: "Hủy trận",
    "abnormal(suggest hiding)": "Trạng thái bất thường",
    "first half": "Đang thi đấu",
    firsthalf: "Đang thi đấu",
    "first-half": "Đang thi đấu",
    fh: "Đang thi đấu",
    "half-time": "Nghỉ giữa hiệp",
    "half time": "Nghỉ giữa hiệp",
    halftime: "Nghỉ giữa hiệp",
    ht: "Nghỉ giữa hiệp",
    "second half": "Đang thi đấu",
    secondhalf: "Đang thi đấu",
    "second-half": "Đang thi đấu",
    sh: "Đang thi đấu",
    "extra time": "Hiệp phụ",
    extratime: "Hiệp phụ",
    et: "Hiệp phụ",
    overtime: "Hiệp phụ",
    "overtime(deprecated)": "Hiệp phụ",
    ot: "Hiệp phụ",
    penalty: "Luân lưu",
    penalties: "Luân lưu",
    "penalty shoot-out": "Luân lưu",
    "penalty shootout": "Luân lưu",
    finished: "Đã kết thúc",
    ft: "Đã kết thúc",
    end: "Đã kết thúc",
    walkover: "Thắng xử thua",
  };

  const key = status ? String(status).toLowerCase() : "";
  return MATCH_STATUS_VI[key] || "Không xác định";
}

// Cleanup
window.addEventListener("beforeunload", function () {
  if (currentHls_TC) {
    currentHls_TC.destroy();
  }
});

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* thapcam.js */
(function(window, $, jQuery, Hls, Swiper) {
// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();
const appState = {
  hotLeaguesRank: new Map(),
};
const LIVE_STATUS = [
  // Tạm dừng / sự cố
  // "delay",
  // "interrupt",
  //   "cut in half", // bị hoãn nên remove khỏi live
  // Hiệp 1
  "first half",
  "firsthalf",
  "first-half",
  "fh",
  // Nghỉ giữa hiệp
  "half-time",
  "half time",
  "halftime",
  "ht",
  // Hiệp 2
  "second half",
  "secondhalf",
  "second-half",
  "sh",
  // Hiệp phụ
  "extra time",
  "extratime",
  "extra time",
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  // Luân lưu
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
];

const NHADAI_COMMENTATOR_ID = 99999999999999999;

function isNhaDaiLivestreamLink(link) {
  if (!link) return false;
  if (link.commentatorId === NHADAI_COMMENTATOR_ID) return true;
  const name = String(link.commentator || "").trim().toLowerCase();
  return name === "nhà đài" || name === "nha dai" || name === "blv nhà đài";
}

function sortLivestreamLinksPreferRealBlv(links) {
  if (!Array.isArray(links)) return [];
  links.sort((a, b) => {
    const aIsNhaDai = isNhaDaiLivestreamLink(a);
    const bIsNhaDai = isNhaDaiLivestreamLink(b);
    if (aIsNhaDai && !bIsNhaDai) return 1;
    if (!aIsNhaDai && bIsNhaDai) return -1;
    return 0;
  });
  return links;
}

function getPreferredLivestreamLink(match) {
  const links = match?.livestream?.links;
  if (!Array.isArray(links) || !links.length) return null;
  sortLivestreamLinksPreferRealBlv(links);
  return links[0] || null;
}

function escapeHtml_TC(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getMatchId_TC(match) {
  return match?.match_id || match?.matchId || match?.id || match?.slug || "";
}

function getDetailUrl_TC(matchId, link) {
  return window.DV2StreamLinks.getDetailUrl(matchId, link, { trailingSlash: true });
}

function renderTcBlvAvatar(link, label) {
  const avatar = link?.avatar;
  if (avatar) {
    return `
      <div class="dv2-commentator-avatar">
        <img src="${escapeHtml_TC(avatar)}" alt="${escapeHtml_TC(label)}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
      </div>
    `;
  }
  const initial = label ? label.charAt(0) : "?";
  return `<div class="dv2-commentator-avatar">${escapeHtml_TC(initial)}</div>`;
}

function buildCommentatorDropdown_TC(match) {
  const sortedLinks = window.DV2BlvDropdown.getSortedLinks(match);

  return window.DV2BlvDropdown.build({
    match,
    links: sortedLinks,
    getDetailUrl: getDetailUrl_TC,
    escapeHtml: escapeHtml_TC,
    menuPlacement: "up",
    emptyHtml: "<div></div>",
    toggleClass: "dv2-commentator-info",
    renderToggle: ({ link, label }) => `
      ${renderTcBlvAvatar(link, label)}
      <span class="dv2-commentator-name">${escapeHtml_TC(label)}</span>
    `,
    renderItemContent: ({ link, label }) => `
      ${renderTcBlvAvatar(link, label)}
      <span class="dv2-commentator-name">${escapeHtml_TC(label)}</span>
    `,
  });
}

function bindTcBlvDropdownEvents() {
  window.DV2BlvDropdown.bind($(".dv2-layout-tc.dv2-home-matches #matchGrid"), {
    namespace: "tcBlvDropdown",
    stopPropagationOnWrap: true,
  });
}

// =================================================
// Init
// =================================================
$(document).ready(function () {
  if ($(".dv2-layout-tc.dv2-home-matches").length > 0) {
    loadHomeData_TC();
    // Auto refresh every minute
    // setInterval(loadHomeData_TC, 60000);
  }
});

// =================================================
// Render home page
// =================================================
function renderHomePage_TC(matches) {
  const now = new Date();

  // Filter and sort matches
  const liveMatches = [];
  const upcomingMatches = [];

  matches.forEach((match) => {
    const kickoff = new Date(match.kickoff);
    // const matchEndTime = new Date(kickoff.getTime() + (2 * 60 * 60 * 1000));
    // if (now >= kickoff && now <= matchEndTime && match.livestream.available) {
    const isLive = LIVE_STATUS.includes(match.status.toLowerCase());
    if (isLive) {
      liveMatches.push(match);
    } else if (now < kickoff) {
      upcomingMatches.push(match);
    }
  });

  // Combine: live first, then upcoming
  const allMatches = [...liveMatches, ...upcomingMatches];

  //   allMatches.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  const sortedMatches = sortedMatchesFunction(allMatches);
  const $grid = $(".dv2-layout-tc.dv2-home-matches #matchGrid");
  $grid.empty();

  if (sortedMatches.length === 0) {
    const adInsertions = buildMatchListAdInsertions_TC(
      getMatchListAdBlocks_TC(),
      0,
    );
    let emptyHtml = `
                    <div class="dv2-empty-state">
                        <div style="font-size: 56px; margin-bottom: 16px; opacity: 0.3;">⚽</div>
                        <div style="font-size: 15px;">Không có trận đấu nào</div>
                    </div>
                `;
    if (adInsertions.has(0)) {
      emptyHtml += buildMatchListAdMarkup_TC(adInsertions.get(0));
    }
    $grid.html(emptyHtml);
    refreshMatchListReviveAds_TC($grid);
    return;
  }

  const adInsertions = buildMatchListAdInsertions_TC(
    getMatchListAdBlocks_TC(),
    sortedMatches.length,
  );

  sortedMatches.forEach((match, index) => {
    $grid.append(renderMatchCard_TC(match));

    const matchPosition = index + 1;
    if (adInsertions.has(matchPosition)) {
      const adMarkup = buildMatchListAdMarkup_TC(adInsertions.get(matchPosition));
      if (adMarkup) {
        $grid.append(adMarkup);
      }
    }
  });

  bindTcBlvDropdownEvents();
  refreshMatchListReviveAds_TC($grid);
}

// =================================================
// Render match card
// =================================================
function renderMatchCard_TC(match) {
  const kickoffDate = new Date(match.kickoff || "").toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
    },
  );
  //const matchEndTime = new Date(kickoff.getTime() + (2 * 60 * 60 * 1000));
  // const isLive = now >= kickoff && now <= matchEndTime;
  const isLive = LIVE_STATUS.includes(match.status.toLowerCase());
  const homeTeam = match.teams?.home || {};
  const awayTeam = match.teams?.away || {};
  const leagueName = match.league?.name || "Giải đấu";
  const leagueLogo = match.league?.logo || "";
  const isHot = appState.hotLeaguesRank.has(match.league.id);

  const homeScore = match.score?.fulltime?.home ?? 0;
  const awayScore = match.score?.fulltime?.away ?? 0;

  const status = match.status || "";

  // Format time
  const timeDisplay = isLive ? "LIVE" : formatMatchTime_TC(match.kickoff);
  // Status badge
  let statusBadge = "";
  if (isLive) {
    if (status === "Half Time") {
      statusBadge = '<div class="dv2-status-badge ht">HT</div>';
    } else if (status === "Second Half") {
      statusBadge = '<div class="dv2-status-badge">LIVE</div>';
    }
  }

  return `
                <div class="dv2-match-card ${isHot ? "hot-game" : ""}" 
                     data-match-id="${match.match_id}"
                     onclick="goToMatchDetail('${match.match_id}')">
                    
                    <!-- Header -->
                    <div class="dv2-card-header">
                        <div class="dv2-league-info">
                            ${
                              leagueLogo
                                ? `<img src="${leagueLogo}" class="dv2-league-logo" alt="${leagueName}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">`
                                : '<span class="dv2-league-logo">⚽</span>'
                            }
                            <span class="dv2-league-name">${leagueName}</span>
                        </div>
                        <div style="display:flex;align-items: center;">
                        
                        <div class="dv2-match-time ${isLive ? "live" : "upcoming"}">${timeDisplay}</div>
                        ${isLive ? "" : `<div class="dv2-match-time upcoming">${kickoffDate}</div>`}
                        </div>

                    </div>

                    <!-- Body -->
                    <div class="dv2-card-body">
                        <!-- Home Team -->
                        <div class="dv2-team-row">
                            <div class="dv2-team-logo">
                                <img src="${homeTeam.logo || "https://via.placeholder.com/36"}" 
                                     alt="${homeTeam.name}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
                            </div>
                            <div class="dv2-team-name">${homeTeam.name || "Home Team"}</div>
                        </div>

                        ${
                          isLive
                            ? `
                            <!-- Score Display -->
                            <div class="dv2-score-display">
                                <div class="dv2-score-number">${homeScore}</div>
                                <div class="dv2-score-separator">:</div>
                                <div class="dv2-score-number">${awayScore}</div>
                            </div>
                        `
                            : `
                            <!-- VS Divider -->
                            <div class="dv2-vs-divider">VS</div>
                        `
                        }

                        <!-- Away Team -->
                        <div class="dv2-team-row">
                            <div class="dv2-team-logo">
                                <img src="${awayTeam.logo || "https://via.placeholder.com/36"}" 
                                     alt="${awayTeam.name}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
                            </div>
                            <div class="dv2-team-name">${awayTeam.name || "Away Team"}</div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="dv2-card-footer">
                        ${buildCommentatorDropdown_TC(match)}
                        <a class="dv2-action-btn" href="${window.DV2_LINK_BET}" target="_blank" rel="nofollow"
                           onclick="event.stopPropagation();">
                            Đặt cược
                        </a>
                        <button class="dv2-action-btn" onclick="event.stopPropagation(); goToMatchDetail('${match.match_id}')">
                            Xem Ngay
                        </button>
                    </div>
                </div>
            `;
}

const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-first",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
});

function getMatchListAdBlocks_TC() {
  return window.DV2ListAds.getBlocks(window.DV2_SOCOLIVE_MATCH_LIST_ADS);
}

function buildMatchListAdInsertions_TC(adBlocks, totalItems) {
  return window.DV2ListAds.buildInsertions(adBlocks, totalItems, {
    breakpoint: window.DV2_SOCOLIVE_MATCH_LIST_ADS_MOBILE_BREAKPOINT,
    repeatCycle: window.DV2_SOCOLIVE_MATCH_LIST_ADS_REPEAT,
  });
}

function buildMatchListAdMarkup_TC(adBlock) {
  return window.DV2ListAds.buildMarkup(adBlock, {
    wrapperTag: "div",
    wrapperClass: "dv2-tc-match-list-ad",
  });
}

function refreshMatchListReviveAds_TC($container) {
  window.DV2ListAds.refreshReviveAds($container);
}

// =================================================
// Format time
// =================================================
function formatMatchTime_TC(datetime) {
  if (!datetime) return "--:--";
  const date = new Date(datetime);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =================================================
// Navigation
// =================================================
function goToMatchDetail(matchId) {
  window.location.href = `/streams?match=${matchId}`;
}

// =================================================
// Load data
// =================================================
function loadHomeData_TC() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const payload = {
    fromDate: yesterday.toISOString().split("T")[0],
    toDate: tomorrow.toISOString().split("T")[0],
  };
  DV2HotLeagues.load({
    ajax: $.ajax,
    setHotLeaguesRank: (rankMap) => {
      appState.hotLeaguesRank = rankMap;
    },
  });
  // call api để lấy danh sách trận đấu
  $.ajax({
    url: "https://vsc-apidev.helizones.com/api/data/lives/range-date",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: function (response) {
      if (response && response.matches_by_date) {
        const allMatches = [];
        Object.keys(response.matches_by_date).forEach((date) => {
          allMatches.push(...response.matches_by_date[date]);
        });
        //remove những trận đã kết thúc (của ngày hôm qua)
        const isLiveAndTodayMatches = allMatches.filter(
          (m) => m.status !== "Finished",
        );
        renderHomePage_TC(isLiveAndTodayMatches);
      } else {
        $(".dv2-layout-tc.dv2-home-matches #matchGrid").html(`
                            <div class="dv2-empty-state">
                                <div style="font-size: 56px; margin-bottom: 16px; opacity: 0.3;">⚽</div>
                                <div>Không có dữ liệu</div>
                            </div>
                        `);
      }
    },
    error: function (err) {
      console.error("Error:", err);
      $(".dv2-layout-tc.dv2-home-matches #matchGrid").html(`
                        <div class="dv2-empty-state">
                            <div style="font-size: 56px; margin-bottom: 16px; opacity: 0.3;">❌</div>
                            <div>Lỗi tải dữ liệu</div>
                        </div>
                    `);
    },
  });
}

// Expose required functions to global scope
window.goToMatchDetail = goToMatchDetail;
})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* chitiet.js */
(function(window, $, jQuery, Hls, Swiper) {
// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

$(document).ready(function () {
    if ($(".dv2-layout-vb.dv2-detail-livestream").length > 0) {
        renderDetailMatch_VB();
    }
});

function renderDetailMatch_VB() {
    const $videoContainer = $(".dv2-layout-vb.dv2-detail-livestream .dv2-video-wrapper");
    const $detailMatchContainer = $(".dv2-layout-vb.dv2-detail-livestream .dv2-match-info");
    const posterUrl = "https://img.freepik.com/premium-photo/close-up-soccer-player-who-kicks-ball_207634-4089.jpg";

    // Lấy ID livestream từ URL
    const params = new URLSearchParams(window.location.search);
    let matchId = params.get("match");
    if (!matchId) {
        if (typeof DV2_MATCH_ID !== "undefined" && DV2_MATCH_ID) {
            matchId = DV2_MATCH_ID;
        } else {
            matchId = "2y8m4zh54p4zql0";
        }
    }
    if (!matchId) {
        $videoContainer.html('<div class="dv2-notfound-video">❌ Không có ID livestream hợp lệ</div>');
        return;
    }

    console.log("[VSC LIVE] Load livestream detail cho ID:", matchId);

    // Hiển thị overlay loading
    const $loading = $(`
    <div class="dv2-loading">
      Đang tải video...
    </div>
  `);
    $videoContainer.append($loading);

    // Tạo thẻ video
    const $video = $("<video>", {
        id: "liveVideo",
        controls: true,
        autoplay: true,
        muted: true,
        playsinline: true,
        poster: posterUrl,
    });
    $videoContainer.append($video);

    // Gọi API lấy thông tin livestream
    $.ajax({
        url: `https://vsc-apidev.helizones.com/api/data/lives/${matchId}`,
        method: "GET",
        success: function (res) {
            console.log("[VSC LIVE] API response:", res);

            const data = res?.data;
            currentMatchDataVB = data || currentMatchDataVB;
            if (data) {
                $loading.remove();
                // hiển thị chi tiết trận (đội bóng, giải đấu)
                const homeName = data?.teams?.home?.name;
                const awayName = data?.teams?.away?.name;
                const homeLogo = data?.teams?.home?.logo;
                const awayLogo = data?.teams?.away?.logo;
                const leagueName = data?.league?.name;
                const leagueLogo = data?.league?.logo;
                const timeMatch = data?.matchInfo?.kickoff;
                const scoreHome = data?.score?.fulltime?.home;
                const scoreAway = data?.score?.fulltime?.away;
                const detail = `
                <div class="dv2-league">
                    <img class="dv2-league-logo" id="leagueLogo" src="${leagueLogo}" alt="League Logo">
                    <span class="dv2-league-name" id="leagueName">${leagueName}</span>
                </div>
                <div class="dv2-teams">
                    <div class="dv2-team">
                        <img class="dv2-home-logo" id="homeLogo" src="${homeLogo}" alt="Home Team">
                        <span class="dv2-home-name" id="homeName">${homeName}</span>
                    </div>
                    <div class="dv2-score" id="score">${scoreHome} - ${scoreAway}</div>
                    <div class="dv2-team">
                        <img class="dv2-away-logo" id="awayLogo" src="${awayLogo}" alt="Away Team">
                        <span class="dv2-away-name" id="awayName">${awayName}</span>
                    </div>
                </div>
                <div class="dv2-match-time" id="matchTime">Thời gian diễn ra trận đấu: ${formatTime_VB(timeMatch)} - ${getDateLabel_VB(timeMatch)}</div>
            `;
                $detailMatchContainer.append(detail);
            }
            if (!data || !data.livestream) {
                $videoContainer.html('<div class="dv2-not-loaded">🚫 Không có luồng livestream</div>');
                $videoContainer.append($video);
                return;
            }
            // kiểm tra thời gian diễn ra trận đấu có lớn hơn 15 phút không, nếu lớn hơn 15 phút thì hiển thị overlay
            const kickoffTime = new Date(data?.matchInfo?.kickoff);
            const shouldShowPreMatchOverlay =
                !Number.isNaN(kickoffTime.getTime()) &&
                (kickoffTime.getTime() - Date.now()) > 15 * 60 * 1000;

            if (shouldShowPreMatchOverlay) {
                const $overlay = createNotFoundMatchOverlay_VB(data); // tạo overlay theo trận
                $videoContainer.append($overlay);
                return;
            }

            const streamUrl = data?.livestream?.links[0]?.url || "";
            if (!streamUrl) {
                $videoContainer.html('<div class="dv2-not-loaded">Không tìm thấy video livestream</div>');
                return;
            }
            
            const $dv2StreamLinks  = $(".dv2-stream-links");
            const dv2StreamLinksHtml = Array.isArray(data?.livestream?.links)
            ? data.livestream.links.map((item, indexS) => (
            `<span data-index="${indexS}" data-stream-url=${item.url}>Link ${indexS + 1}</span>`
            ))
            : null;
            $dv2StreamLinks.html(dv2StreamLinksHtml);
            
            $dv2StreamLinks.on("click", "span", function (e) {
                e.preventDefault();
                e.stopPropagation();
                const streamUrlLink = $(this).data("stream-url");
                initHLSPlayer(streamUrlLink);
            });

            if (window.DV2StreamTvc?.playBeforeStream) {
                window.DV2StreamTvc.playBeforeStream($videoContainer, () => initHLSPlayer(streamUrl));
            } else {
                initHLSPlayer(streamUrl);
            }

        },
        error: function (err) {
            console.error("[VSC LIVE] Lỗi khi gọi API:", err);
            $videoContainer.html('<div class="dv2-not-loaded">Không thể tải dữ liệu livestream</div>');
        }
    });

    let currentHls = null;
    let currentMatchDataVB = null;
    function initHLSPlayer(streamUrl) {
        if (!streamUrl) return;
        let hasFallback = false;

        const showFallbackOverlay = () => {
         
            if (hasFallback) return;
       
            hasFallback = true;
            $loading.remove();
            if (currentHls) {
                try { currentHls.destroy(); } catch (e) { console.warn(e); }
                currentHls = null;
            }
    
            if (currentMatchDataVB) {
                $videoContainer.append(createNotFoundMatchOverlay_VB(currentMatchDataVB));
            }
            
            const $posterVideo = $("<video>", {
                id: "liveVideo",
                controls: true,
                autoplay: false,
                muted: true,
                playsinline: true,
                poster: posterUrl,
            });
        
            $videoContainer.append($posterVideo);
        };

        if (currentHls) {
            try { currentHls.destroy(); } catch (e) { console.warn(e); }
            currentHls = null;
        }

        if (Hls.isSupported()) {
            const manifestTimeout = setTimeout(() => showFallbackOverlay(), 15000);
            currentHls = new Hls({
                maxBufferLength: 10,
                liveSyncDuration: 3,
                enableWorker: true,
                xhrSetup: function (xhr, url) {
                    xhr.withCredentials = false;
                    xhr.referrerPolicy = "no-referrer-when-downgrade";
                },
            });
            currentHls.loadSource(streamUrl);
            currentHls.attachMedia($video[0]);
            currentHls.on(Hls.Events.MANIFEST_PARSED, function () {
                clearTimeout(manifestTimeout);
                $loading.remove();
                $video[0].muted = true;
                $video[0].play().catch(() => console.warn("Autoplay bị chặn"));
            });
     
            currentHls.on(Hls.Events.ERROR, function (event, data) {
                if (data?.fatal) {
                    clearTimeout(manifestTimeout);
                    showFallbackOverlay();
                }
            });
            $video.off("error.vb").on("error.vb", showFallbackOverlay);
        } else if ($video[0].canPlayType("application/vnd.apple.mpegurl")) {
            const nativeTimeout = setTimeout(() => showFallbackOverlay(), 15000);
            $video.attr("src", streamUrl);
            $video.off("loadedmetadata.vb").on("loadedmetadata.vb", function () {
                clearTimeout(nativeTimeout);
                $loading.remove();
                $video[0].play().catch(() => console.warn("Autoplay bị chặn"));
            });
            $video.off("error.vb").on("error.vb", function () {
                clearTimeout(nativeTimeout);
                showFallbackOverlay();
            });
        } else {
            showFallbackOverlay();
        }
    }
}
// Hiển thị overlay khi trận đấu chưa diễn ra
function createNotFoundMatchOverlay_VB(match) {
    const kickoff = match?.matchInfo?.kickoff;
    const league = match?.league?.name;
    const homeName = match?.teams?.home?.name || "Home";
    const awayName = match?.teams?.away?.name || "Away";
    const statusMatch = renderStatusMatch_VB(kickoff);
    return $(`
            <div class="dv2-loading">
                Trận đấu ${statusMatch}: <strong>${homeName} - ${awayName}</strong>
                <div class="dv2-load-league">
                    <span>Giải đấu: <strong>${league}</strong></span>
                </div>
                <div class="dv2-load-time">
                    <span>Thời gian: ${formatTime_VB(kickoff)} - ${getDateLabel_VB(kickoff)}</span>
                </div>
            </div>
        `);
}

// Format date theo dạng Hôm nay, 01/11
function getDateLabel_VB(matchDate) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const match = new Date(matchDate);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    match.setHours(0, 0, 0, 0);

    if (match.getTime() === today.getTime()) {
        return 'Hôm nay';
    } else if (match.getTime() === tomorrow.getTime()) {
        return 'Ngày mai';
    } else {
        const day = String(match.getDate()).padStart(2, '0');
        const month = String(match.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    }
}

// Format time theo dạng 00:00
function formatTime_VB(datetime) {
    if (!datetime) return '';
    const date = new Date(datetime);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Hiển thị trạng thái trận đấu đã/đang/sẽ diễn ra
function renderStatusMatch_VB(kickoff) {
    // hiển thị thông tin trận đã/đang/sẽ diễn ra
    const now = new Date();
    // Giới hạn khoảng thời gian trong hôm nay
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // kickoff có thể là string → ép về Date
    const kickoffDate = kickoff instanceof Date ? kickoff : new Date(kickoff);

    // Xác định trạng thái trận đấu
    let matchStatus = '';
    if (kickoffDate > now) {
        // Sắp diễn ra
        const diffMinutes = Math.round((kickoffDate - now) / 60000);
        if (diffMinutes <= 30) {
            matchStatus = 'sắp bắt đầu'; // trong vòng 30 phút
        } else {
            matchStatus = 'chưa diễn ra';
        }
    } else {
        // kickoff <= now → trận đã hoặc đang diễn ra
        const matchEnd = new Date(kickoffDate);
        matchEnd.setHours(matchEnd.getHours() + 2); // giả sử 1 trận ~2h

        if (now <= matchEnd) {
            matchStatus = 'đang diễn ra';
        } else {
            matchStatus = 'đã kết thúc';
        }
    }
    return matchStatus;
}

// Hàm convert DateTime 05/11/2025 15:00
function formatDateTime_VB(isoString) {
    const date = new Date(isoString);

    // Lấy các thành phần thời gian
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}
})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* ket-qua-hom-nay.js */
(function(window, $, jQuery, Hls, Swiper) {
// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

// Init
$(document).ready(function () {
    if ($('.dv2-layout-vb.dv2-result-matchs').length > 0) {
        updateDateTime_VB();
        loadResultsData_VB();
    }
});
// =================================================
// Update current date/time
// =================================================
function updateDateTime_VB() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    $('.dv2-layout-vb.dv2-result-matchs #currentDateTime').text(now.toLocaleDateString('vi-VN', options));
}
// =================================================
// Render results page
// =================================================
function renderResultsPage_VB(matches) {
    const now = new Date();

    // Filter finished matches
    const finishedMatches = matches.filter(match => {
        const kickoff = new Date(match.kickoff);
        const matchEndTime = new Date(kickoff.getTime() + (2 * 60 * 60 * 1000));
        return now > matchEndTime;
    });

    // Sort by kickoff time (newest first)
    finishedMatches.sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));

    const $container = $('.dv2-layout-vb.dv2-result-matchs .dv2-results-container');
    $container.empty();

    if (finishedMatches.length === 0) {
        $container.html(`
                    <div class="dv2-empty-state">
                        <div style="font-size: 56px; margin-bottom: 16px; opacity: 0.3;">⚽</div>
                        <div style="font-size: 15px;">Chưa có trận đấu nào kết thúc</div>
                    </div>
                `);
        return;
    }

    // Group by league
    const grouped = groupMatchesByLeague_VB(finishedMatches);

    Object.keys(grouped).forEach(leagueName => {
        const leagueMatches = grouped[leagueName];
        const leagueLogo = leagueMatches[0]?.league?.logo || '';

        const html = `
                    <div class="dv2-league-section">
                        <div class="dv2-league-header">
                            ${leagueLogo ? `<img src="${leagueLogo}" class="dv2-league-logo" alt="${leagueName}">` : ''}
                            <h3 class="dv2-league-title">${leagueName}</h3>
                        </div>

                        <div class="dv2-match-headers">
                            <div></div>
                            <div>Chủ nhà</div>
                            <div>Tỷ số</div>
                            <div>Khách</div>
                            <div></div>
                            <div>HT | FT</div>
                        </div>

                        ${leagueMatches.map(match => renderMatchCard_VB(match)).join('')}
                    </div>
                `;
        $container.append(html);
    });
}

// =================================================
// Group by league
// =================================================
function groupMatchesByLeague_VB(matches) {
    const grouped = {};
    matches.forEach(match => {
        const leagueName = match?.league?.name || 'Giải đấu khác';
        if (!grouped[leagueName]) {
            grouped[leagueName] = [];
        }
        grouped[leagueName].push(match);
    });
    return grouped;
}

// =================================================
// Render match card
// =================================================
function renderMatchCard_VB(match) {
    const formattedTime = formatMatchTime_VB(match.kickoff);

    const homeTeam = match?.teams?.home || {};
    const awayTeam = match?.teams?.away || {};

    // Scores
    const homeScore = match?.score?.fulltime?.home ?? 0;
    const awayScore = match?.score?.fulltime?.away ?? 0;
    const htHome = match?.score?.halftime?.home ?? 0;
    const htAway = match?.score?.halftime?.away ?? 0;

    // Generate stats
    const stats = generateStats_VB(homeScore, awayScore, htHome, htAway);

    return `
                <div class="dv2-match-card" 
                     data-match-id="${match.match_id || match.id}"
                     onclick="goToMatchDetail('${match.match_id || match.id}')">
                    
                    <!-- Time -->
                    <div class="dv2-time-col">
                        <div class="dv2-match-time">${formattedTime}</div>
                    </div>

                    <!-- Home team -->
                    <div class="dv2-team-home">
                        <div class="dv2-team-name" style="text-align: right;">${homeTeam.name || 'Home'}</div>
                        <div class="dv2-team-logo">
                            <img src="${homeTeam.logo}" 
                                 alt="${homeTeam.name}">
                        </div>
                    </div>

                    <!-- Score -->
                    <div class="dv2-score-col">
                        <div class="dv2-score-box">
                            <div class="dv2-score-number">${homeScore}</div>
                            <div class="dv2-score-separator">:</div>
                            <div class="dv2-score-number">${awayScore}</div>
                        </div>
                        <div class="dv2-halftime">HT ${htHome}:${htAway}</div>
                    </div>

                    <!-- Away team -->
                    <div class="dv2-team-away">
                        <div class="dv2-team-logo">
                            <img src="${awayTeam.logo}" 
                                 alt="${awayTeam.name}">
                        </div>
                        <div class="dv2-team-name">${awayTeam.name || 'Away'}</div>
                    </div>

                    <!-- Highlight button -->
                    <div class="dv2-highlight-col">
                        <button class="dv2-highlight-btn" 
                                onclick="event.stopPropagation(); viewHighlight('${match.match_id}')">
                            XEM HIGHLIGHT
                        </button>
                    </div>

                    <!-- Stats -->
                    <div class="dv2-stats-col">
                        <!-- HT -->
                        <div class="dv2-stat-group">
                            <div class="dv2-stat-main">${htHome} : ${htAway}</div>
                            <div class="dv2-stat-label">HT</div>
                        </div>

                        <!-- HT | FT -->
                        <div class="dv2-stat-group">
                            <div class="dv2-stat-main" style="color: #10b981;">${stats.htFt}</div>
                            <div class="dv2-stat-detail">
                                <span class="dv2-stat-value">${stats.ht1} : ${stats.ft1}</span>
                            </div>
                        </div>

                        <!-- Yellow cards -->
                        <div class="dv2-stat-group">
                            <div class="dv2-stat-main" style="color: #fbbf24;">${stats.yellowTotal}</div>
                            <div class="dv2-stat-detail">
                                <span class="dv2-stat-value">${stats.yellow1} - ${stats.yellow2}</span>
                            </div>
                        </div>

                        <!-- Red cards -->
                        <div class="dv2-stat-group">
                            <div class="dv2-stat-main" style="color: #ef4444;">${stats.redTotal}</div>
                            <div class="dv2-stat-detail">
                                <span class="dv2-stat-value">${stats.red1} - ${stats.red2}</span>
                            </div>
                        </div>

                        <!-- More stats -->
                        <div class="dv2-stat-group">
                            <div class="dv2-stat-detail">
                                <span class="dv2-stat-value">${stats.corner1} - ${stats.corner2}</span>
                            </div>
                            <div class="dv2-stat-detail">
                                <span class="dv2-stat-value">${stats.shot1} - ${stats.shot2}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
}

// =================================================
// Generate stats
// =================================================
function generateStats_VB(homeScore, awayScore, htHome, htAway) {
    return {
        htFt: `${htHome} - ${homeScore}`,
        ht1: Math.floor(Math.random() * 3),
        ft1: Math.floor(Math.random() * 5),
        yellowTotal: Math.floor(Math.random() * 7),
        yellow1: Math.floor(Math.random() * 4),
        yellow2: Math.floor(Math.random() * 4),
        redTotal: Math.floor(Math.random() * 2),
        red1: Math.floor(Math.random() * 2),
        red2: Math.floor(Math.random() * 2),
        corner1: Math.floor(Math.random() * 8),
        corner2: Math.floor(Math.random() * 8),
        shot1: Math.floor(Math.random() * 15),
        shot2: Math.floor(Math.random() * 15)
    };
}

// =================================================
// Format time
// =================================================
function formatMatchTime_VB(datetime) {
    const date = new Date(datetime);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${d}/${m} - ${time}`;
}

// =================================================
// Navigation
// =================================================
function goToMatchDetail(matchId) {
    window.location.href = `/streams/${matchId}`;
}

function viewHighlight(matchId) {
    window.location.href = `/highlights/${matchId}`;
}

// =================================================
// Load data
// =================================================
function loadResultsData_VB() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const payload = {
        fromDate: yesterday.toISOString().split("T")[0],
        toDate: today.toISOString().split("T")[0]
    };

    $.ajax({
        url: 'https://vsc-apidev.helizones.com/api/data/lives/range-date',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.matches_by_date) {
                const allMatches = [];
                Object.keys(response.matches_by_date).forEach(date => {
                    allMatches.push(...response.matches_by_date[date]);
                });
                renderResultsPage_VB(allMatches);
            } else {
                $('.dv2-layout-vb.dv2-result-matchs .dv2-results-container').html('<div class="dv2-empty-state">Không có dữ liệu</div>');
            }
        },
        error: function (err) {
            console.error('Error:', err);
            $('.dv2-layout-vb.dv2-result-matchs .dv2-results-container').html('<div class="dv2-empty-state">Lỗi tải dữ liệu</div>');
        }
    });
}
// Expose required functions to global scope
window.goToMatchDetail = goToMatchDetail;
window.viewHighlight = viewHighlight;
})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* lich-thi-dau-hom-nay.js */
(function(window, $, jQuery, Hls, Swiper) {
$ = jQuery.noConflict();

$(document).ready(() => {
  if ($(".dv2-layout-vb.dv2-calendar-matchs").length > 0) {
    updateDateTime_VB();
    loadHomeMatchesData_VB();
  }
});
function updateDateTime_VB() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  $(".dv2-layout-vb.dv2-calendar-matchs #currentDateTime").text(
    now.toLocaleDateString("vi-VN", options)
  );
}

function formatMatchTime_VB(datetime) {
  const date = new Date(datetime);
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const time = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${d}/${m} - ${time}`;
}

function renderHomeMatchCard_VB(match) {
  const kickoff = new Date(match.kickoff);
  const home = match.teams?.home || {};
  const away = match.teams?.away || {};
  const formattedTime = formatMatchTime_VB(kickoff);
  const commentators = match?.livestream?.links;

  return `
                <div class="dv2-match-card" onclick="goToMatchDetail('${
                  match.match_id
                }')">
                <div class="dv2-time-col">${formattedTime}</div>
                <div class="dv2-teams-col">
                    <div class="dv2-team">
                    <div class="dv2-team-name" style="text-align: right;">${
                      home.name
                    }</div>
                    <div class="dv2-team-logo"><img src="${home.logo}" alt="${
    home.name
  }"></div>
                    </div>
                    <div class="dv2-vs">vs</div>
                    <div class="dv2-team">
                    <div class="dv2-team-logo"><img src="${away.logo}" alt="${
    away.name
  }"></div>
                    <div class="dv2-team-name">${away.name}</div>
                    </div>
                </div>
                ${
                  commentators.length > 0
                    ? `
                    <div class="dv2-commentators">
                        ${commentators
                          .slice(0, 4)
                          .map(
                            (blv) => `
                            <div class="dv2-commentator" 
                                data-commentator-id="${blv.commentatorId || ""}"
                                onclick="event.stopPropagation(); goToBLVPage('${
                                  blv.commentatorId || ""
                                }')">
                                <div class="dv2-commentator-avatar">
                                    ${
                                      blv.avatar
                                        ? `<img src="${blv.avatar}" alt="${blv.commentator}">`
                                        : blv.commentator.charAt(0)
                                    }
                                </div>
                                <span class="dv2-commentator-name">${
                                  blv.commentator
                                }</span>
                            </div>
                        `
                          )
                          .join("")}
                        ${
                          commentators.length > 4
                            ? `<div class="dv2-commentator-more">+${
                                commentators.length - 4
                              }</div>`
                            : ""
                        }
                    </div>
                `
                    : ""
                }
                </div>
            `;
}

function groupMatchesByLeague_VB(matches) {
  const grouped = {};
  matches.forEach((m) => {
    const name = m.league?.name || "Giải đấu khác";
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(m);
  });
  return grouped;
}

// danh sách tất cả các trận đấu hom nay và ngày mai
function renderHomeMatches_VB(matches, filter = "all") {
  const now = new Date();
  const twoHours = 2 * 60 * 60 * 1000;
  const filtered = matches
    .filter((m) => {
      const kickoff = new Date(m.kickoff);
      const end = new Date(kickoff.getTime() + twoHours);
      if (filter === "live") return now >= kickoff && now <= end;
      if (filter === "today") {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const endDay = new Date(now);
        endDay.setHours(23, 59, 59, 999);
        return kickoff > now && kickoff <= endDay;
      }
      return end >= now;
    })
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

  const $c = $(".dv2-layout-vb.dv2-calendar-matchs .dv2-home-container");
  $c.empty();
  if (!filtered.length) {
    $c.html(`<div class="dv2-empty-state">Không có trận đấu</div>`);
    return;
  }

  const grouped = groupMatchesByLeague_VB(filtered);
  Object.keys(grouped).forEach((league) => {
    const logo = grouped[league][0]?.league?.logo || "";
    const cards = grouped[league]
      .map((m) => renderHomeMatchCard_VB(m))
      .join("");
    $c.append(`
                    <div class="dv2-league-section">
                        <div class="dv2-league-header">
                        ${
                          logo
                            ? `<img src="${logo}" class="dv2-league-logo">`
                            : ""
                        }
                        <div class="dv2-league-title">${league}</div>
                        </div>
                        ${cards}
                    </div>
                `);
  });
}

// danh sách trận đấu ngày trong tuần (trừ các trận đã diễn ra)
// function renderHomeMatchesCalendar_CK(matches, filter = 'all') {
//     const now = new Date();
//     const twoHours = 2 * 60 * 60 * 1000;
//     const filtered = matches.filter(m => {
//         const kickoff = new Date(m.kickoff);
//         const end = new Date(kickoff.getTime() + twoHours);
//         if (filter === 'live') return now >= kickoff && now <= end;
//         if (filter === 'today') {
//             const start = new Date(now); start.setHours(0, 0, 0, 0);
//             const endDay = new Date(now); endDay.setHours(23, 59, 59, 999);
//             return kickoff > now && kickoff <= endDay;
//         }
//         return end >= now;
//     }).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

//     const $c = $('.dv2-layout-vb.dv2-calendar-matchs .dv2-home-container');
//     $c.empty();
//     if (!filtered.length) {
//         $c.html(`<div class="dv2-empty-state">Không có trận đấu</div>`);
//         return;
//     }

//     const grouped = groupMatchesByLeague_CK(filtered);
//     Object.keys(grouped).forEach(league => {
//         const logo = grouped[league][0]?.league?.logo || '';
//         const cards = grouped[league].map(m => renderHomeMatchCard_CK(m)).join('');
//         $c.append(`
//                     <div class="dv2-league-section">
//                         <div class="dv2-league-header">
//                         ${logo ? `<img src="${logo}" class="dv2-league-logo">` : ''}
//                         <div class="dv2-league-title">${league}</div>
//                         </div>
//                         ${cards}
//                     </div>
//                 `);
//     });
// }

function setupFilterButtons_VB(matches) {
  $(".dv2-layout-vb.dv2-calendar-matchs .dv2-filter-btn")
    .off("click")
    .on("click", function () {
      $(".dv2-layout-vb.dv2-calendar-matchs .dv2-filter-btn").removeClass(
        "active"
      );
      $(this).addClass("active");
      renderHomeMatches_VB(matches, $(this).data("filter"));
    });
}

function goToMatchDetail(id) {
  window.location.href = `/streams/${id}`;
}

function loadHomeMatchesData_VB() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const payload = {
    fromDate: today.toISOString().split("T")[0],
    toDate: tomorrow.toISOString().split("T")[0],
  };
  $.ajax({
    url: "https://vsc-apidev.helizones.com/api/data/lives/range-date",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: (res) => {
      if (res && res.matches_by_date) {
        const all = [];
        Object.keys(res.matches_by_date).forEach((d) =>
          all.push(...res.matches_by_date[d])
        );
        renderHomeMatches_VB(all);
        setupFilterButtons_VB(all);
      } else
        $(".dv2-layout-vb.dv2-calendar-matchs .dv2-home-container").html(
          '<div class="dv2-empty-state">Không có dữ liệu</div>'
        );
    },
    error: () =>
      $(".dv2-layout-vb.dv2-calendar-matchs .dv2-home-container").html(
        '<div class="dv2-empty-state">Lỗi tải dữ liệu</div>'
      ),
  });
}

// Expose required functions to global scope
window.goToMatchDetail = goToMatchDetail;
})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* trangchu.js */
(function(window, $, jQuery, Hls, Swiper) {
// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

$(document).ready(function () {
    if ($(".dv2-layout-vb.dv2-home-matchs").length > 0) {
        renderListMatchs_VB();
    }
});

let currentIndex_VB = 0;
let filteredMatchesGlobal_VB = [];

function renderListMatchs_VB() {
    const $listContainer = $(".dv2-layout-vb.dv2-home-matchs");
    const $liveVideoGrid = $listContainer.find(".dv2-match-grid");

    // nếu đã có loading thì không append thêm
    if ($listContainer.find('.dv2-loading').length === 0) {
        $listContainer.append(`
            <div class="dv2-loading">
                <div class="dv2-spinner"></div>
            </div>
        `);
    }

    const today = new Date();
    const toDate = new Date();
    toDate.setDate(today.getDate() + 7);

    const payload = {
        fromDate: today.toISOString().split("T")[0],
        toDate: toDate.toISOString().split("T")[0]
    };

    $.ajax({
        url: "https://vsc-apidev.helizones.com/api/data/lives/range-date",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(payload),
        dataType: "json",
        success: function (res) {
            // remove loading ngay khi có response
            $listContainer.find('.dv2-loading').remove();

            const matches = [];
            Object.values(res.matches_by_date || {}).forEach(dayMatches => {
                if (Array.isArray(dayMatches)) matches.push(...dayMatches);
            });

            if (!matches.length) {
                $liveVideoGrid.html('<div class="dv2-empty-state">Không có trận đấu nào trong 7 ngày tới</div>');
                return;
            }

            const normalizedMatches = matches.map(match => {
                const kickoff = match.kickoff ? new Date(match.kickoff) : null;
                const MATCH_DURATION_MINUTES = 120;
                const endTime = kickoff ? new Date(kickoff.getTime() + MATCH_DURATION_MINUTES * 60 * 1000) : null;
                const now = new Date();
                let status = 'Sắp diễn ra';

                if (kickoff && now >= kickoff && now <= endTime && match.livestream.available) status = 'LIVE';
                else if (kickoff && now > endTime) status = 'Kết thúc';

                return {
                    id: match.match_id,
                    slug: match.slug || "",
                    homeLogo: match?.teams?.home?.logo || "",
                    awayLogo: match?.teams?.away?.logo || "",
                    homeName: match?.teams?.home?.name || "Đội nhà",
                    awayName: match?.teams?.away?.name || "Đội khách",
                    kickoff: kickoff,
                    league: match?.league?.name || "Giải đấu",
                    leagueLogo: match?.league?.logo || '',
                    livestream: match.livestream,
                    links: match?.livestream?.links || [],
                    scoreHalftime: match?.score?.halftime || { home: '-', away: '-' },
                    scoreFulltime: match?.score?.fulltime || { home: '-', away: '-' },
                    status
                };
            });

            // Filter and sort matches
            const now = new Date();
            const liveMatches = [];
            const upcomingMatches = [];

            normalizedMatches.forEach(match => {
                const kickoff = new Date(match.kickoff);
                const matchEndTime = new Date(kickoff.getTime() + (2 * 60 * 60 * 1000));

                if (now >= kickoff && now <= matchEndTime && match.livestream.available) {
                    liveMatches.push(match);
                } else if (now < kickoff) {
                    upcomingMatches.push(match);
                }
            });

            // Combine: live first, then upcoming
            const allMatches = [...liveMatches, ...upcomingMatches];

            updateFilterCounts_VB(allMatches);
            setupFilterButtons_VB(allMatches);

            renderHomeMatches_VB(allMatches, 'live');
        },
        error: function (err) {
            console.error("[VSC LIVE] API error:", err);
            $liveVideoGrid.html('<div class="dv2-empty-state">Lỗi khi tải dữ liệu</div>');
        }
    });
}

// Cập nhật tổng số trận cho từng filter
function updateFilterCounts_VB(matches) {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(todayStart); weekEnd.setDate(todayStart.getDate() + 7);

    const counts = {
        all: matches.filter(m => m.kickoff >= todayStart && m.kickoff <= weekEnd).length,
        live: matches.filter(m => m.status === 'LIVE').length,
        today: matches.filter(m => m.kickoff >= todayStart && m.kickoff <= todayEnd).length
    };

    $('.dv2-layout-vb.dv2-home-matchs .dv2-filter-btn[data-filter="all"]').text(`Tất cả (${counts.all})`);
    $('.dv2-layout-vb.dv2-home-matchs .dv2-filter-btn[data-filter="live"]').text(`Đang live (${counts.live})`);
    $('.dv2-layout-vb.dv2-home-matchs .dv2-filter-btn[data-filter="today"]').text(`Hôm nay (${counts.today})`);
}

// filter theo trạng thái
function setupFilterButtons_VB(matches) {
    $('.dv2-layout-vb.dv2-home-matchs .dv2-filter-btn').off('click').on('click', function () {
        $('.dv2-layout-vb.dv2-home-matchs .dv2-filter-btn').removeClass('dv2-active');
        $(this).addClass('dv2-active');
        const filter = $(this).data('filter');
        renderHomeMatches_VB(matches, filter);
    });
}

function renderHomeMatches_VB(matches, filter = 'live') {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(todayStart); weekEnd.setDate(todayStart.getDate() + 7);

    let filteredMatches = matches.filter(match => {
        if (filter === 'live') return match.status === 'LIVE';
        if (filter === 'today') return match.kickoff >= todayStart && match.kickoff <= todayEnd;
        if (filter === 'all') return match.kickoff >= todayStart && match.kickoff <= weekEnd;
        return true;
    });

    filteredMatches.sort((a, b) => {
        if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
        if (a.status !== 'LIVE' && b.status === 'LIVE') return 1;
        return new Date(a.kickoff) - new Date(b.kickoff);
    });
    // filteredMatches.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

    filteredMatchesGlobal_VB = filteredMatches;
    currentIndex_VB = 0;

    const $c = $('.dv2-layout-vb.dv2-home-matchs .dv2-match-grid');
    $c.empty();

    if (!filteredMatches.length) {
        $c.html(`<div class="dv2-empty-state">
                        <div style="font-size: 56px; opacity: 0.3;">⚽</div>
                        <div style="font-size: 15px;">Không có trận đấu nào</div>
                    </div>`);
        $('.dv2-loadmore').hide();
        return;
    }

    renderNextMatchesBatch_VB();

    $('.dv2-layout-vb.dv2-home-matchs .dv2-load-more-btn').off('click').on('click', renderNextMatchesBatch_VB);
}

function renderNextMatchesBatch_VB() {
    const $c = $('.dv2-layout-vb.dv2-home-matchs .dv2-match-grid');
    const limit = 10;
    const nextBatch = filteredMatchesGlobal_VB.slice(currentIndex_VB, currentIndex_VB + limit);

    nextBatch.forEach(match => {
        const $card = $(renderMatchCard_VB(match));
        $c.append($card);
        setTimeout(() => $card.addClass('fade-in'), 50);
    });

    currentIndex_VB += nextBatch.length;

    if (currentIndex_VB >= filteredMatchesGlobal_VB.length) {
        $('.dv2-layout-vb.dv2-home-matchs .dv2-loadmore').fadeOut(200);
    } else {
        $('.dv2-layout-vb.dv2-home-matchs .dv2-loadmore').show();
    }
}

function renderMatchCard_VB(match) {
    const matchDateTime = match.kickoff || '';
    const dateLabel = getDateLabel_VB(matchDateTime);
    const timeLabel = matchDateTime ? formatTime_VB(matchDateTime) : '';
    const statusClass = match.status === 'LIVE' ? 'dv2-status-live' : (match.status === 'Sắp diễn ra' ? 'dv2-status-scheduled' : 'dv2-status-finished');

    return `
        <div class="dv2-match-card" data-id="${match.id}">
            <div class="dv2-match-header">
                <div class="dv2-league-info">
                    <span class="dv2-league-name">${match.league}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="dv2-match-status ${statusClass}">
                        ${match.status === 'LIVE' ? '● LIVE' : match.status === 'Sắp diễn ra' ? 'Sắp diễn ra' : 'Kết thúc'}
                    </span>
                    <span class="dv2-match-time">${timeLabel} - ${dateLabel}</span>
                </div>
            </div>
            <div class="dv2-match-content">
                <div class="dv2-team">
                <div class="dv2-team-name">${match.homeName}</div>
                <div class="dv2-team-logo"><img src="${match.homeLogo}" alt="${match.homeName}"></div>
                </div>
                <div class="dv2-score-section">
                    <div class="dv2-score">
                        <div class="dv2-score-number">${match.scoreFulltime.home}</div>
                        <div class="dv2-score-separator">:</div>
                        <div class="dv2-score-number">${match.scoreFulltime.away}</div>
                    </div>
                    <div class="dv2-half-time">HT ${match.scoreHalftime.home} - ${match.scoreHalftime.away}</div>
                </div>
                <div class="dv2-team dv2-away">
                <div class="dv2-team-name">${match.awayName}</div>
                    <div class="dv2-team-logo"><img src="${match.awayLogo}" alt="${match.awayName}"></div>
                </div>
            </div>
            <div class="dv2-blv-box">
                ${(match?.links || []).map(blv => `
                    <a class="dv2-bottom-group" href="#" data-id="${match.id}">
                        <span class="dv2-bottom-logo">
                            <img class="dv2-image-blv" alt="${blv.commentator}"
                                src="${blv.avatar}">
                        </span>
                        <span class="dv2-bottom-name dv2-ellipsis">${blv.commentator}</span>
                    </a>
                `).join('')}
            </div>
        </div>
    `;
}

// Redirect to detail page
$(document).on('click', '.dv2-layout-vb.dv2-home-matchs .dv2-match-card', function (e) {
    e.preventDefault();
    const $btn = $(this);
    const matchId = $btn.data('id') || '';
    // redirect to livestream page
    window.location.href = `/streams/${matchId}`;
});

function formatTime_VB(datetime) {
    if (!datetime) return '';
    const date = new Date(datetime);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getDateLabel_VB(matchDate) {
    if (!matchDate) return '';
    // const today = new Date(); today.setHours(0, 0, 0, 0);
    // const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const match = new Date(matchDate); match.setHours(0, 0, 0, 0);

    // if (match.getTime() === today.getTime()) return 'Hôm nay';
    // else if (match.getTime() === tomorrow.getTime()) return 'Ngày mai';
    return `${String(match.getDate()).padStart(2, '0')}/${String(match.getMonth() + 1).padStart(2, '0')}`;
}

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* common.js */
(function(window, $, jQuery, Hls, Swiper) {
// =================================================
// Common Constants
// =================================================
window.DV2 = window.DV2 || {};
/**
 * API endpoint for lives range date
 * @type {string}
 */
const API_ENDPOINT_LIVES_RANGE_DATE =
  "https://vsc-apidev.helizones.com/api/data/lives/range-date";

const API_ENDPOINT_HOT_LEAGUES =
  "https://vsc-apidev.helizones.com/api/data/lives/competitions/hot";

/**
 * appState
 * @type {string[]}
 */
const appState = {
  hotLeaguesRank: new Map(),
};

/**
 * Vietnamese day names array
 * @type {string[]}
 */

const VIETNAMESE_DAY_NAMES = [
  "Chủ Nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

/**
 * Live match statuses
 * @type {string[]}
 */
const LIVE_STATUS = [
  // Tạm dừng / sự cố
  // "delay",
  "interrupt",
  "cut in half",
  // Hiệp 1
  "first half",
  "firsthalf",
  "first-half",
  "fh",
  // Nghỉ giữa hiệp
  "half-time",
  "half time",
  "halftime",
  "ht",
  // Hiệp 2
  "second half",
  "secondhalf",
  "second-half",
  "sh",
  // Hiệp phụ
  "extra time",
  "extratime",
  "extra time",
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  // Luân lưu
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
];

/**
 * All match statuses
 * @type {string[]}
 */
const MATCH_STATUS = [
  // Trước trận
  "not started",
  "to be determined",
  // Hoãn / huỷ / sự cố
  "delay",
  "interrupt",
  "cut in half",
  "postponed",
  "suspended",
  "abandoned",
  "cancel",
  "abnormal(suggest hiding)",
  // Hiệp 1
  "first half",
  "firsthalf",
  "first-half",
  "fh",
  // Nghỉ giữa hiệp
  "half-time",
  "half time",
  "halftime",
  "ht",
  // Hiệp 2
  "second half",
  "secondhalf",
  "second-half",
  "sh",
  // Hiệp phụ
  "extra time",
  "extratime",
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  // Luân lưu
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
  // Kết thúc
  "finished",
  "ft",
  "end",
  "walkover",
];

// =================================================
// Date Formatting Functions
// =================================================

/**
 * Format date to DD/MM format
 * @param {Date} date - Date object
 * @returns {string} Formatted date string (DD/MM)
 */
DV2.formatDateDDMM = function (date) {
  if (!date || !(date instanceof Date)) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
};

/**
 * Get Vietnamese day label
 * @param {Date} date - Date object
 * @param {number} index - Index from today (0 = today, 1 = tomorrow, etc.)
 * @returns {string} Vietnamese day label
 */
DV2.getVietnameseDayLabel = function (date, index) {
  if (!date || !(date instanceof Date)) {
    return "";
  }

  if (index === 0) {
    return "Hôm nay";
  }
  if (index === 1) {
    return "Ngày mai";
  }

  const dayOfWeek = date.getDay();
  return VIETNAMESE_DAY_NAMES[dayOfWeek] || "";
};

/**
 * Get date string in YYYY-MM-DD format (local date, not UTC)
 * @param {Date} date - Date object
 * @returns {string} Date string in YYYY-MM-DD format
 */
DV2.getDateString = function (date) {
  if (!date || !(date instanceof Date)) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Format time to HH:MM format
 * @param {Date|string} datetime - Date object or ISO string
 * @returns {string} Formatted time string (HH:MM)
 */
DV2.formatTimeHHMM = function (datetime) {
  if (!datetime) {
    return "";
  }

  const date = typeof datetime === "string" ? new Date(datetime) : datetime;
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * Get date label for match (Hôm nay, Ngày mai, or DD/MM)
 * @param {Date|string} matchDate - Date object or ISO string
 * @returns {string} Date label
 */
DV2.getDateLabel = function (matchDate) {
  if (!matchDate) {
    return "";
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const match = typeof matchDate === "string" ? new Date(matchDate) : matchDate;
  if (!(match instanceof Date) || isNaN(match.getTime())) {
    return "";
  }

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  match.setHours(0, 0, 0, 0);

  if (match.getTime() === today.getTime()) {
    return "Hôm nay";
  } else if (match.getTime() === tomorrow.getTime()) {
    return "Ngày mai";
  } else {
    return DV2.formatDateDDMM(match);
  }
};

// =================================================
// Match Status Functions
// =================================================

/**
 * Normalize match status to lowercase
 * @param {string} status - Match status string
 * @returns {string} Normalized status (lowercase)
 */
DV2.normalizeMatchStatus = function (status) {
  if (!status || typeof status !== "string") {
    return "";
  }
  return status.toLowerCase().trim();
};

/**
 * Check if status is a live status
 * @param {string} status - Match status string
 * @returns {boolean} True if status is live
 */
DV2.isLiveStatus = function (status) {
  const normalizedStatus = DV2.normalizeMatchStatus(status);
  return LIVE_STATUS.indexOf(normalizedStatus) !== -1;
};

/**
 * Check if match is finished
 * @param {string} status - Match status string
 * @returns {boolean} True if match is finished
 */
DV2.isFinishedStatus = function (status) {
  const normalizedStatus = DV2.normalizeMatchStatus(status);
  return (
    normalizedStatus === "finished" ||
    normalizedStatus === "ft" ||
    normalizedStatus === "end"
  );
};

/**
 * Sort matches following priority: Hot match live -> normal match live -> hot match -> normat match
 * @param {Array} matches - Array of match objects
 * @returns {string} HTML string
 */

DV2.sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "live-first-priority-competition",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => DV2.appState.hotLeaguesRank,
});
/**
 * Check if match is not started
 * @param {string} status - Match status string
 * @returns {boolean} True if match is not started
 */
DV2.isNotStartedStatus = function (status) {
  const normalizedStatus = DV2.normalizeMatchStatus(status);
  return normalizedStatus === "not started" || normalizedStatus === "scheduled";
};

// =================================================
// API Functions
// =================================================

/**
 * Call API to get matches by date range
 * @param {string} fromDate - Start date in YYYY-MM-DD format
 * @param {string} toDate - End date in YYYY-MM-DD format
 * @param {Function} successCallback - Success callback function
 * @param {Function} errorCallback - Error callback function
 */
DV2.fetchMatchesByDateRange = function (
  fromDate,
  toDate,
  successCallback,
  errorCallback,
) {
  if (!$ || typeof $.ajax !== "function") {
    console.error("[COMMON] jQuery is not available");
    if (errorCallback) {
      errorCallback({ message: "jQuery is not available" });
    }
    return;
  }

  const payload = {
    fromDate: fromDate,
    toDate: toDate,
  };

  $.ajax({
    url: API_ENDPOINT_LIVES_RANGE_DATE,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: function (response) {
      if (successCallback) {
        successCallback(response);
      }
    },
    error: function (xhr, status, error) {
      console.error("[COMMON] API Error:", error);
      if (errorCallback) {
        errorCallback({ xhr: xhr, status: status, error: error });
      }
    },
  });

  DV2HotLeagues.load({
    url: API_ENDPOINT_HOT_LEAGUES,
    ajax: $.ajax,
    setHotLeaguesRank: (rankMap) => {
      appState.hotLeaguesRank = rankMap;
      DV2.appState = appState;
    },
  });
};

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* detail.js */
(function(window, $, jQuery, Hls, Swiper) {
$ = jQuery.noConflict();
const POSTER_URL_VB2 = "https://img.freepik.com/premium-photo/close-up-soccer-player-who-kicks-ball_207634-4089.jpg";

function getDefaultHot18PosterUrl_VB2() {
    return DV2StreamKickoff.getDefaultHot18PosterUrl();
}

function resolvePosterUrl_VB2(link) {
    return DV2StreamKickoff.resolvePosterUrl(link, POSTER_URL_VB2);
}

function applyPosterForLink_VB2($video, link) {
    DV2StreamKickoff.applyPosterForLink($video, link, POSTER_URL_VB2);
}

function shouldShowPreMatchOverlay_VB2(matchData) {
    const kickoffTime = new Date(matchData?.matchInfo?.kickoff);
    return (
        !Number.isNaN(kickoffTime.getTime()) &&
        kickoffTime.getTime() - Date.now() > 15 * 60 * 1000
    );
}

// ========================================
// Ads Banner for detail page (stream links row)
// ========================================
function renderStreamBetButtons_VB2() {
    const $container = $(".dv2-layout-vb2.dv2-detail-livestream .dv2-stream-list .dv2-bet-links");
    if (!$container.length) return;

    const html = window.DV2_SOCOLIVE_STREAM_BET_BUTTONS_HTML;
    if (typeof html === "string" && html.trim()) {
        $container.html(html);
    }

    if (!$container.children().length) return;
    window.DV2_StreamChrome?.refreshReviveAds?.($container);
}
$(document).ready(function ($) {
    if ($(".dv2-layout-vb2.dv2-detail-livestream").length) {
        renderDetailMatch_VB2();
    } 
});

function applyStreamVideoLayout_VB2($video) {
    if (!$video?.length) return;
    $video.css({
        width: "100%",
        height: "auto",
        maxWidth: "100%",
        left: "",
        top: "",
        position: "",
    });
}

/* ===============================
 * MAIN RENDER
 * =============================== */
function renderDetailMatch_VB2() {
    const $container = $(".dv2-layout-vb2.dv2-detail-livestream");
    const $videoContainer = $container.find(".dv2-video-wrapper");
    const $headerContainer = $container.find(".dv2-layout-vb2-header");
    const $footerContainer = $container.find(".dv2-layout-vb2-footer");

    const matchId = getMatchId_VB2();
    const apiStream = `https://vsc-apidev.helizones.com/api/data/lives/${matchId}`;

    if (!matchId) {
        showErrorVideo($videoContainer, '❌ Trận đấu này không  tồn tại!');
        return;
    }

    console.log("[VSC LIVE] Match ID:", matchId);

    const $streamPlayer = $videoContainer.find("#stream-player");
    const $video = $("<video>", {
        id: "liveVideo",
        controls: false,
        autoplay: true,
        muted: true,
        playsinline: true,
        poster: POSTER_URL_VB2,
    });
    $streamPlayer.empty().append($video);
    applyStreamVideoLayout_VB2($video);
    DV2_StreamChrome.initPlayerUi($videoContainer, $video);
    applyStreamVideoLayout_VB2($video);

    const loadMatchData = () => {
        showStreamLoading_VB2($videoContainer, "Đang tải thông tin trận đấu...");

        $.ajax({
            url: apiStream,
            method: "GET",
            success: function (res) {
                const data = res?.data;
                if (!data) {
                    showErrorVideo($videoContainer, 'Trận đấu này không tồn tại!');
                    return;
                }

                startDetailScorePoll_VB2(data);

                $headerContainer.show()
                $footerContainer.show()
                renderHeader_VB2($headerContainer, data);
                renderFooterStats_VB2($footerContainer, data);
                initStreamOddsPanel_VB2($videoContainer, data);

                if (!data?.livestream) {
                    hideStreamLoading_VB2($videoContainer);
                    showMatchPosterOverlay_VB2($videoContainer, data);
                    return;
                }

                const links = DV2StreamLinks.sortForDetail(data.livestream.links);
                let activeLink = null;
                if (links.length > 0) {
                    const resolved = DV2StreamLinks.resolveActiveLink(links);
                    activeLink = resolved.activeLink;
                    currentActiveLinkVB2 = activeLink;
                    applyPosterForLink_VB2($video, activeLink);
                    initStreamLinks_VB2(links, resolved.activeIndex);
                    renderStreamBetButtons_VB2();
                    currentMatchDataVB2 = data;
                }

                if (shouldShowPreMatchOverlay_VB2(data)) {
                    const showPreMatchOverlay = () => {
                        DV2_StreamChrome.clearFullChrome($videoContainer);
                        hideStreamLoading_VB2($videoContainer);
                        showMatchPosterOverlay_VB2($videoContainer, data);
                    };

                    if (window.DV2StreamTvc?.playBeforeStream) {
                        window.DV2StreamTvc.playBeforeStream($videoContainer, showPreMatchOverlay);
                    } else {
                        showPreMatchOverlay();
                    }
                    return;
                }

                if (activeLink?.url) {
                    const startStream = () => initHLSPlayer_VB2(activeLink.url, $video, data);
                    if (window.DV2StreamTvc?.playBeforeStream) {
                        window.DV2StreamTvc.playBeforeStream($videoContainer, startStream);
                    } else {
                        startStream();
                    }
                }
            },
            error: function () {
                showErrorVideo($videoContainer, 'Có lỗi xảy ra!');
            }
        });
    };

    loadMatchData();
}

/* ===============================
 * HEADER
 * =============================== */
function renderHeader_VB2($container, data) {
    const home = data?.teams?.home || {};
    const away = data?.teams?.away || {};
    const league = data?.league || {};
    const kickoff = data?.matchInfo?.kickoff;
    const status = data?.matchInfo?.status || "-";
    const homeScore = data?.score?.fulltime?.home ?? 0;
    const awayScore = data?.score?.fulltime?.away ?? 0;
    const pen = data?.score?.pen;
    const hasPen = pen && (pen.home != null || pen.away != null);

    const timeMatch = `<strong>${formatTime_VB2(kickoff)}</strong> ngày ${getDateLabel_VB2(kickoff)}`;

    const html = `
    <h1>${home.name || '-'} vs ${away.name || '-'} - ${timeMatch}</h1>
    <div class="dv2-layout-vb2-header-content">
        <p class="dv2-layout-vb2-header-content-league">
            <img src="${league.logo || ''}" alt="${league.name || '-'}"
                onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
            > ${league.name || '-'}
        </p>
        <div class="dv2-layout-vb2-header-content-info">
            <div class="dv2-layout-vb2-header-content-info-home">
            
                ${home.name || '-'} <img onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'" src="${home.logo || ''}" alt="${home.name || '-'}">
            </div>
            <div class="dv2-layout-vb2-header-content-info-detail">
                <span>${statusMatchRender(status)}</span>
                <p><span data-dv2-score-home>${homeScore}</span> <span>-</span> <span data-dv2-score-away>${awayScore}</span></p>
                ${hasPen ? `
                <div class="dv2-layout-vb2-header-content-info-detail-pen">
                    <span class="dv2-pen-value"><span data-dv2-score-pen-home>${pen.home}</span> - <span data-dv2-score-pen-away>${pen.away}</span></span>
                    <span class="dv2-pen-label">(Penalty)</span>
                </div>
                ` : ''}
                <div class="dv2-layout-vb2-header-content-info-detail-time">${timeMatch}</div>
            </div>
            <div class="dv2-layout-vb2-header-content-info-away">
                <img onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'" src="${away.logo || ''}" alt="${away.name || '-'}"> ${away.name || '-'}
            </div>
        </div>
    </div>
    `;

    $container.html(html);
}


/* ===============================
 * FOOTER STATS
 * =============================== */
function renderFooterStats_VB2($container, data) {
    const homeName = data?.teams?.home?.name || '-';
    const awayName = data?.teams?.away?.name || '-';
    const stats = data?.stats || {};
    const kickoff = data?.matchInfo?.kickoff;
    const timeDisplay = DV2StreamKickoff.renderTimeDisplay(kickoff, { useFooterTitle: true });
    const league = data?.league || {};

    const html = `
    <p>${timeDisplay}</p>
    <p><strong class="dv2-layout-vb2-footer-title">Giải đấu:</strong> <img src="${league.logo || ''}" alt="${league.name || '-'}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"> ${league.name || '-'}</p> 
    <div class="dv2-layout-vb2-footer-info">
        <div class="vb2-table">
            ${renderStatRow('Thông số', homeName, awayName, true)}
            ${renderStatRow('Kiểm soát bóng', `${stats.possession?.home ?? 0}%`, `${stats.possession?.away ?? 0}%`)}
            ${renderStatRow('Tổng cú sút', stats.shots?.home ?? 0, stats.shots?.away ?? 0)}
            ${renderStatRow('Cú sút trúng đích', stats.shotsOnTarget?.home ?? 0, stats.shotsOnTarget?.away ?? 0)}
            ${renderStatRow('Phạt góc', stats.corners?.home ?? 0, stats.corners?.away ?? 0)}
            ${renderStatRow('Đá phạt trực tiếp', stats.freeKick?.home ?? 0, stats.freeKick?.away ?? 0)}
            ${renderStatRow('Thẻ vàng', stats.yellowCard?.home ?? 0, stats.yellowCard?.away ?? 0)}
            ${renderStatRow('Thẻ đỏ', stats.redCard?.home ?? 0, stats.redCard?.away ?? 0)}
            ${renderStatRow('Việt vị', stats.offside?.home ?? 0, stats.offside?.away ?? 0)}
            ${renderStatRow('Tổng đường chuyền', stats.pass?.home ?? 0, stats.pass?.away ?? 0)}
            ${renderStatRow('Đường chuyền thành công', stats.passSuccess?.home ?? 0, stats.passSuccess?.away ?? 0)}
            ${renderStatRow('Chuyền dài', stats.longPass?.home ?? 0, stats.longPass?.away ?? 0)}
            ${renderStatRow('Chuyền dài thành công', stats.longPassSuccess?.home ?? 0, stats.longPassSuccess?.away ?? 0)}
            ${renderStatRow('Phá bóng', stats.tackles?.home ?? 0, stats.tackles?.away ?? 0)}
            ${renderStatRow('Cứu thua', stats.save?.home ?? 0, stats.save?.away ?? 0)}
            ${renderStatRow('Phạm lỗi', stats.fouls?.home ?? 0, stats.fouls?.away ?? 0)}
        </div>
    </div>`;
    $container.html(html);
    DV2StreamKickoff.startCountdown(kickoff);
}

function renderStatRow(label, home, away, isHead = false) {
    return `
    <div class="vb2-row ${isHead ? 'vb2-head' : ''}">
        <div class="vb2-col">${label}</div>
        <div class="vb2-col">${home}</div>
        <div class="vb2-col">${away}</div>
    </div>`;
}

/* ===============================
 * STREAM LINKS
 * =============================== */
function initStreamLinks_VB2(links = [], activeIndex = 0) {
    DV2StreamLinks.bindSpanLinks({
        $container: $(".dv2-layout-vb2.dv2-detail-livestream .dv2-stream-links"),
        links,
        activeIndex,
        streamAttr: "data-stream",
        onSelect(link) {
            const $video = $("#liveVideo");
            const $videoContainer = $video.closest(".dv2-video-wrapper");
            currentActiveLinkVB2 = link;
            applyPosterForLink_VB2($video, link);

            if (currentMatchDataVB2) {
                initStreamOddsPanel_VB2($videoContainer, currentMatchDataVB2);
            }

            if (shouldShowPreMatchOverlay_VB2(currentMatchDataVB2) || !link?.url) {
                DV2_StreamChrome.clearFullChrome($videoContainer);
                stopStreamPlayback_VB2($video);
                hideStreamLoading_VB2($videoContainer);
                showMatchPosterOverlay_VB2($videoContainer, currentMatchDataVB2);
                return;
            }

            clearMatchOverlays_VB2($videoContainer);
            initHLSPlayer_VB2(link.url, $video, currentMatchDataVB2);
        },
    });
}

function onHlsStreamReady_VB2($videoContainer) {
    clearMatchOverlays_VB2($videoContainer);
    applyStreamVideoLayout_VB2($videoContainer.find("video").first());
    if (currentMatchDataVB2) {
        DV2_StreamChrome.rememberOddsMatchData?.($videoContainer, currentMatchDataVB2);
    }
    DV2_StreamChrome.onHlsReady($videoContainer);
    applyStreamVideoLayout_VB2($videoContainer.find("video").first());
}

function initStreamOddsPanel_VB2($videoContainer, matchData) {
    if (!$videoContainer?.length || !matchData) return;
    DV2_StreamChrome.rememberOddsMatchData?.($videoContainer, matchData);
    DV2_StreamChrome.initOddsPanel?.($videoContainer, matchData);
}

/* ===============================
 * STREAM LOADING OVERLAY
 * =============================== */
const VB2_STREAM_LOADING_PLAYING_MS = 12000;

function showStreamLoading_VB2($videoContainer, message = "Đang tải luồng phát...") {
    if (!$videoContainer?.length) return $();
    hideStreamLoading_VB2($videoContainer);
    const safeMessage = String(message || "Đang tải luồng phát...")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const $overlay = $(`
        <div class="dv2-stream-loading" role="status" aria-live="polite" aria-busy="true">
            <div class="dv2-stream-loading__panel">
                <div class="dv2-stream-loading__spinner" aria-hidden="true"></div>
                <p class="dv2-stream-loading__text">${safeMessage}</p>
            </div>
        </div>
    `);
    DV2_StreamChrome.getOverlayMount($videoContainer).append($overlay);
    DV2_StreamChrome.syncVideoStageLayout($videoContainer);
    return $overlay;
}

function hideStreamLoading_VB2($videoContainer) {
    $videoContainer?.find(".dv2-stream-loading").remove();
}

function bindStreamLoadingUntilPlaying_VB2($videoContainer, video, onReady) {
    if (!$videoContainer?.length || !video) {
        onReady?.();
        return;
    }

    let settled = false;
    const finish = () => {
        if (settled) return;
        settled = true;
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("canplay", onCanPlay);
        clearTimeout(fallbackTimer);
        hideStreamLoading_VB2($videoContainer);
        onReady?.();
    };

    const onPlaying = () => finish();
    const onCanPlay = () => {
        if (!video.paused) {
            finish();
        }
    };

    video.addEventListener("playing", onPlaying);
    video.addEventListener("canplay", onCanPlay);

    const fallbackTimer = setTimeout(finish, VB2_STREAM_LOADING_PLAYING_MS);
}

/* ===============================
 * HLS PLAYER
 * =============================== */
let currentHls = null;
let currentMatchDataVB2 = null;
let currentActiveLinkVB2 = null;
let detailScorePoll_VB2 = null;
let vb2PlaybackGeneration = 0;
let vb2ManifestTimeout = null;
let vb2NativeTimeout = null;

function startDetailScorePoll_VB2(match) {
    if (!match) return;
    if (!detailScorePoll_VB2) {
        detailScorePoll_VB2 = DV2MatchScorePoll.create({
            container: ".dv2-layout-vb2.dv2-detail-livestream",
        });
    }
    detailScorePoll_VB2.sync(match);
    detailScorePoll_VB2.start();
}

function startLiveStream_VB2(url, $video, matchData = null) {
    initHLSPlayer_VB2(url, $video, matchData);
}

function clearVb2PlaybackTimers() {
    if (vb2ManifestTimeout) {
        clearTimeout(vb2ManifestTimeout);
        vb2ManifestTimeout = null;
    }
    if (vb2NativeTimeout) {
        clearTimeout(vb2NativeTimeout);
        vb2NativeTimeout = null;
    }
}

function initHLSPlayer_VB2(url, $video, matchData = null) {
    const fallbackMatchData = matchData || currentMatchDataVB2;
    const $videoContainer = $video?.closest(".dv2-video-wrapper");

    vb2PlaybackGeneration += 1;
    const playbackGen = vb2PlaybackGeneration;
    const isStalePlayback = () => playbackGen !== vb2PlaybackGeneration;

    clearMatchOverlays_VB2($videoContainer);
    clearVb2PlaybackTimers();

    if (!url || !$video?.length) {
        hideStreamLoading_VB2($videoContainer);
        if (fallbackMatchData && $videoContainer?.length) {
            showMatchPosterOverlay_VB2($videoContainer, fallbackMatchData);
        }
        return;
    }

    showStreamLoading_VB2($videoContainer, "Đang tải luồng phát...");

    let hasFallback = false;

    const showFallbackOverlay = () => {
        if (isStalePlayback() || hasFallback || !fallbackMatchData || !$videoContainer.length) return;
        hasFallback = true;
        DV2_StreamChrome.clearFullChrome($videoContainer);
        hideStreamLoading_VB2($videoContainer);
        showMatchPosterOverlay_VB2($videoContainer, fallbackMatchData);
    };

    if (currentHls) {
        try { currentHls.destroy(); } catch (e) {}
        currentHls = null;
    }

    const video = $video[0];

    if (Hls.isSupported()) {
        vb2ManifestTimeout = setTimeout(() => {
            if (isStalePlayback()) return;
            console.warn("[VSC LIVE] Manifest load timeout");
            showFallbackOverlay();
        }, 15000);

        currentHls = new Hls({
                    maxBufferLength: 10,
                    liveSyncDuration: 3,
                    enableWorker: true,
                    xhrSetup: function (xhr, url) {
                        // Add any necessary headers or credentials here
                        xhr.withCredentials = false;
                        // Add referrer policy to handle CORS
                        xhr.referrerPolicy = "no-referrer-when-downgrade";
                    },
                });
        currentHls.loadSource(url);
        currentHls.attachMedia(video);

        currentHls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (isStalePlayback()) return;
            clearVb2PlaybackTimers();
            bindStreamLoadingUntilPlaying_VB2($videoContainer, video, () => {
                if (isStalePlayback()) return;
                onHlsStreamReady_VB2($videoContainer);
            });
            setTimeout(() => tryAutoPlay(video), 100);
        });

        currentHls.on(Hls.Events.ERROR, (event, data) => {
            if (isStalePlayback()) return;
            if (data?.fatal) {
                clearVb2PlaybackTimers();
                showFallbackOverlay();
            }
        });
        video.addEventListener("error", () => {
            if (isStalePlayback()) return;
            clearVb2PlaybackTimers();
            showFallbackOverlay();
        }, { once: true });

    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        vb2NativeTimeout = setTimeout(() => {
            if (isStalePlayback()) return;
            console.warn("[VSC LIVE] Native HLS load timeout");
            showFallbackOverlay();
        }, 15000);
        video.src = url;
        video.addEventListener("loadedmetadata", () => {
            if (isStalePlayback()) return;
            clearVb2PlaybackTimers();
            bindStreamLoadingUntilPlaying_VB2($videoContainer, video, () => {
                if (isStalePlayback()) return;
                onHlsStreamReady_VB2($videoContainer);
            });
            setTimeout(() => tryAutoPlay(video), 100);
        });
        video.addEventListener("error", () => {
            if (isStalePlayback()) return;
            clearVb2PlaybackTimers();
            showFallbackOverlay();
        }, { once: true });
    }

    DV2_StreamChrome.initPlayerUi($videoContainer, $video);
}

function tryAutoPlay(video) {
    video.muted = true;
    const $videoContainer = $(video).closest(".dv2-video-wrapper");
    if ($videoContainer.length) {
        DV2_StreamChrome.syncControlsState($videoContainer, $(video));
    }
    video.play().catch(() => console.warn("Autoplay bị chặn"));
}

/* ===============================
 * UTILITIES
 * =============================== */
function getMatchId_VB2() {
    const params = new URLSearchParams(window.location.search);
    let matchId = params.get("match");
    if (!matchId) {
        if (typeof DV2_MATCH_ID !== "undefined" && DV2_MATCH_ID) {
            matchId = DV2_MATCH_ID;
        } else {
            matchId = "2y8m4zh54p4zql0";
        }
    }

    return matchId;
}

function stopStreamPlayback_VB2($video) {
    vb2PlaybackGeneration += 1;
    clearVb2PlaybackTimers();
    if (currentHls) {
        try {
            currentHls.destroy();
        } catch (e) {}
        currentHls = null;
    }
    if (!$video?.length) return;
    const el = $video[0];
    el.pause();
    el.removeAttribute("src");
    if (typeof el.load === "function") {
        el.load();
    }
}

function ensurePosterVideo_VB2($videoContainer) {
    if (!$videoContainer?.length) return $();

    const $streamPlayer = $videoContainer.find("#stream-player");
    let $video = $streamPlayer.find("#liveVideo");
    if (!$video.length) {
        $video = $videoContainer.find("#liveVideo");
    }
    if ($video.length) {
        stopStreamPlayback_VB2($video);
        $video.attr({
            poster: resolvePosterUrl_VB2(currentActiveLinkVB2),
            muted: true,
            playsinline: true,
        });
        $video.prop({ autoplay: false, controls: false });
    } else {
        $video = $("<video>", {
            id: "liveVideo",
            controls: false,
            autoplay: false,
            muted: true,
            playsinline: true,
            poster: resolvePosterUrl_VB2(currentActiveLinkVB2),
        });
        if ($streamPlayer.length) {
            $streamPlayer.empty().append($video);
        } else {
            $videoContainer.append($video);
        }
    }

    DV2_StreamChrome.applyVideoControls($video);
    DV2_StreamChrome.ensureControlsBar($videoContainer);
    applyStreamVideoLayout_VB2($video);
    return $video;
}

function clearMatchOverlays_VB2($videoContainer) {
    $videoContainer
        .find(".dv2-loading.dv2-match-overlay, .dv2-not-loaded.dv2-match-overlay")
        .remove();
}

function showMatchPosterOverlay_VB2($videoContainer, matchData) {
    if (!$videoContainer?.length) return;

    hideStreamLoading_VB2($videoContainer);
    $videoContainer.find(".dv2-loading").not(".dv2-match-overlay").remove();
    clearMatchOverlays_VB2($videoContainer);
    ensurePosterVideo_VB2($videoContainer);

    if (matchData) {
        const $overlay = createNotFoundMatchOverlay_VB2(matchData);
        $overlay.addClass("dv2-match-overlay");
        DV2_StreamChrome.getOverlayMount($videoContainer).append($overlay);
    }

    DV2_StreamChrome.bindEvents($videoContainer);
    DV2_StreamChrome.syncVideoStageLayout($videoContainer);
    DV2StreamKickoff.startCountdown(matchData?.matchInfo?.kickoff);
}

function showErrorVideo($container, msg = "") {
    const $wrapper = $container.hasClass("dv2-video-wrapper")
        ? $container
        : $container.find(".dv2-video-wrapper").first();

    if (!$wrapper.length) {
        $container.html(
            `<div class="dv2-not-loaded"><div class="dv2-no-stream-title">${msg}</div></div>`
        );
        return;
    }

    hideStreamLoading_VB2($wrapper);
    $wrapper.find(".dv2-loading").not(".dv2-match-overlay").remove();
    clearMatchOverlays_VB2($wrapper);
    ensurePosterVideo_VB2($wrapper);

    const $error = $(`
        <div class="dv2-not-loaded dv2-match-overlay">
            <div class="dv2-no-stream" id="noStreamMessage">
                <div class="dv2-no-stream-icon">🚫</div>
                <div class="dv2-no-stream-title">${msg}</div>
                <div class="dv2-no-stream-subtitle">
                    Trận đấu này hiện chưa có luồng phát trực tiếp hoặc bị lỗi.<br>
                    Vui lòng quay lại sau hoặc xem các trận đấu khác.
                </div>
            </div>
        </div>
    `);
    DV2_StreamChrome.getOverlayMount($wrapper).append($error);
    DV2_StreamChrome.bindEvents($wrapper);
    DV2_StreamChrome.syncVideoStageLayout($wrapper);
}

// Hiển thị overlay khi trận đấu chưa diễn ra
function createNotFoundMatchOverlay_VB2(match) {
    const kickoff = match?.matchInfo?.kickoff;
    const league = match?.league;
    const homeName = match?.teams?.home?.name || "Home";
    const awayName = match?.teams?.away?.name || "Away";
    const statusMatch = match?.matchInfo?.status;
    return $(`
            <div class="dv2-loading">
                <span class="dv2-loading-status">${statusMatchRender(statusMatch)}</span>
                Trận đấu: <strong>${homeName} - ${awayName}</strong>
                <div class="dv2-load-league">
                    <span>Giải đấu: <strong> <img src="${league.logo || ''}" alt="${league.name || '-'}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"> ${league.name || '-'}</strong></span>
                </div>
                <div class="dv2-load-time">
                    <span>${DV2StreamKickoff.renderTimeDisplay(kickoff)}</span>
                </div>
            </div>
        `);
}

// Format date theo dạng Hôm nay, 01/11
function getDateLabel_VB2(matchDate) {
    const match = new Date(matchDate);
    const day = String(match.getDate()).padStart(2, '0');
    const month = String(match.getMonth() + 1).padStart(2, '0');

    return `${day}/${month}/${match.getFullYear()}`;
}

// Format time theo dạng 00:00
function formatTime_VB2(datetime) {
    return DV2StreamKickoff.formatTime(datetime);
}

function statusMatchRender($status) {
    const MATCH_STATUS_VI = {
    // Trước trận
    "not started": "Sắp diễn ra",
    "to be determined": "Chưa xác định",
    // Hoãn / huỷ / sự cố
    "delay": "Trì hoãn",
    "interrupt": "Tạm dừng",
    "cut in half": "Bị cắt hiệp",
    "postponed": "Hoãn trận",
    "suspended": "Tạm hoãn",
    "abandoned": "Bỏ dở",
    "cancel": "Hủy trận",
    "abnormal(suggest hiding)": "Trạng thái bất thường",
    // Hiệp 1
    "first half": "Đang thi đấu",
    "firsthalf": "Đang thi đấu",
    "first-half": "Đang thi đấu",
    "fh": "Đang thi đấu",
    // Nghỉ giữa hiệp
    "half-time": "Nghỉ giữa hiệp",
    "half time": "Nghỉ giữa hiệp",
    "halftime": "Nghỉ giữa hiệp",
    "ht": "Nghỉ giữa hiệp",
    // Hiệp 2
    "second half": "Đang thi đấu",
    "secondhalf": "Đang thi đấu",
    "second-half": "Đang thi đấu",
    "sh": "Đang thi đấu",
    // Hiệp phụ
    "extra time": "Hiệp phụ",
    "extratime": "Hiệp phụ",
    "et": "Hiệp phụ",
    "overtime": "Hiệp phụ",
    "overtime(deprecated)": "Hiệp phụ",
    "ot": "Hiệp phụ",
    // Luân lưu
    "penalty": "Luân lưu",
    "penalties": "Luân lưu",
    "penalty shoot-out": "Luân lưu",
    "penalty shootout": "Luân lưu",
    // Kết thúc
    "finished": "Đã kết thúc",
    "ft": "Đã kết thúc",
    "end": "Đã kết thúc",
    "walkover": "Thắng xử thua"
    };

    const key = $status ? $status.toLowerCase() : "";

    return MATCH_STATUS_VI[key] || "Không xác định";
}

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* ket-qua-hom-nay.js */
(function(window, $, jQuery, Hls, Swiper) {
// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

// Global variables
let selectedDateIndex = -1; // -1 means today is active by default
let matchesDataByDate = {};
let isSchedulePage = false; // true for "lich-thi-dau-bong-da" page

const NHADAI_COMMENTATOR_ID = 99999999999999999;

function isNhaDaiLivestreamLink(link) {
  if (!link) return false;
  if (link.commentatorId === NHADAI_COMMENTATOR_ID) return true;
  const name = String(link.commentator || "").trim().toLowerCase();
  return name === "nhà đài" || name === "nha dai" || name === "blv nhà đài";
}

function sortLivestreamLinksPreferRealBlv(links) {
  if (!Array.isArray(links)) return [];
  links.sort((a, b) => {
    const aIsNhaDai = isNhaDaiLivestreamLink(a);
    const bIsNhaDai = isNhaDaiLivestreamLink(b);
    if (aIsNhaDai && !bIsNhaDai) return 1;
    if (!aIsNhaDai && bIsNhaDai) return -1;
    return 0;
  });
  return links;
}

// Init
$(document).ready(function () {
  // Mega-bundle loads on every DV2 page — only run for this layout's markup.
  if (!$(".content-area.dv2-layout-vb2").length && !$(".match_date--wrapper").length) {
    return;
  }

  // Check page type from global variable or data attribute (fallback)
  if (typeof window.DV2_PAGE_TYPE === "undefined") {
    const $container = $(".content-area.dv2-layout-vb2");
    window.DV2_PAGE_TYPE = $container.length
      ? $container.attr("data-page-type") || ""
      : "";
  }

  isSchedulePage = window.DV2_PAGE_TYPE === "lich-thi-dau-bong-da";

  renderDateList();
  loadDataForAllDays();
  setupDateClickHandlers();
});

// =================================================
// Render date list
// =================================================

/**
 * Render days based on page type:
 * - Results page: 7 days ago to today (8 days total)
 * - Schedule page: today, tomorrow, next 6 days (8 days total)
 */
function renderDateList() {
  const $dateWrapper = $(".match_date--wrapper");
  if (!$dateWrapper.length) {
    return;
  }

  const today = new Date();
  let html = "";

  if (isSchedulePage) {
    // Schedule page: today, tomorrow, next 6 days (8 days total, forward-looking)
    for (let i = 0; i < 8; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const dateDDMM = DV2.formatDateDDMM(date);
      const dateString = DV2.getDateString(date);
      const activeClass = i === 0 ? "active" : ""; // Today is active by default

      // Determine label
      let label = dateDDMM;
      if (i === 0) {
        label = "Hôm nay";
      } else if (i === 1) {
        label = "Ngày mai";
      }

      html += `
        <a href="javascript:void(0)" class="match_date--item ${activeClass}" data-date="${dateString}" data-index="${i}">
          ${label}
        </a>
      `;
    }
  } else {
    // Results page: 7 days ago, 6 days ago, ..., yesterday, today (8 days total)
    for (let i = 7; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateDDMM = DV2.formatDateDDMM(date);
      const dateString = DV2.getDateString(date);
      const activeClass = i === 0 ? "active" : ""; // Today is active by default

      // Determine label
      let label = dateDDMM;
      if (i === 0) {
        label = "Hôm nay";
      } else if (i === 1) {
        label = "Hôm qua";
      }

      html += `
        <a href="javascript:void(0)" class="match_date--item ${activeClass}" data-date="${dateString}" data-index="${i}">
          ${label}
        </a>
      `;
    }
  }

  $dateWrapper.html(html);
  selectedDateIndex = 0; // Today is selected by default
}

// =================================================
// Setup event handlers
// =================================================

/**
 * Setup click handlers for date items
 */
function setupDateClickHandlers() {
  $(document).on("click", ".match_date--item", function () {
    const $item = $(this);
    const dateString = $item.data("date");
    const index = parseInt($item.data("index"), 10);

    // Remove active from all date items
    $(".match_date--item").removeClass("active");

    // Add active to clicked item
    $item.addClass("active");

    // Update selected date index
    selectedDateIndex = index;

    // Update header text
    updateHeaderText(dateString);

    // Show loading if data is not available
    if (!matchesDataByDate[dateString]) {
      showLoading();
      // Try to reload data for this specific date
      const date = new Date(dateString + "T00:00:00");
      const fromDate = new Date(date);
      const toDate = new Date(date);

      DV2.fetchMatchesByDateRange(
        DV2.getDateString(fromDate),
        DV2.getDateString(toDate),
        function (response) {
          hideLoading();
          if (response && response.matches_by_date) {
            // Merge new data
            Object.assign(matchesDataByDate, response.matches_by_date);
            loadMatchesForDate(dateString);
          } else {
            loadMatchesForDate(dateString);
          }
        },
        function (err) {
          hideLoading();
          console.error("[KET QUA] Error loading data for date:", err);
          loadMatchesForDate(dateString);
        },
      );
    } else {
      // Load matches for selected date (data already available)
      loadMatchesForDate(dateString);
    }
  });
}

/**
 * Update header text based on selected date
 */
function updateHeaderText(dateString) {
  const $headerText = $(".match_date_text");
  if (!$headerText.length) {
    return;
  }

  const date = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  date.setHours(0, 0, 0, 0);

  let text = "";
  const dateFormatted = `${DV2.formatDateDDMM(date)}/${date.getFullYear()}`;

  if (date.getTime() === today.getTime()) {
    // Hôm nay
    text = `Hôm nay (${dateFormatted})`;
  } else if (date.getTime() === yesterday.getTime()) {
    // Hôm qua
    text = `Hôm qua (${dateFormatted})`;
  } else if (date.getTime() === tomorrow.getTime()) {
    // Ngày mai
    text = `Ngày mai (${dateFormatted})`;
  } else {
    // Ngày khác
    text = dateFormatted;
  }

  $headerText.text(text);

  // Update page heading if schedule page
  if (isSchedulePage) {
    const $heading = $("#page-heading");
    if ($heading.length) {
      $heading.html(
        `TRỰC TIẾP LỊCH THI ĐẤU BÓNG ĐÁ ${text} CẬP NHẬT 24H VEBO TV`,
      );
    }

    // Update description
    const $description = $("#page-description");
    if ($description.length) {
      $description.html(
        `Trực tiếp lịch thi đấu ${text} mới nhất sẽ được cập nhật liên tục 24h. Cứ khi nào có bóng đá thì BXH cũng sẽ được cập nhật ngay trong giờ đấu đang diễn ra. Các fan hâm mộ có thể theo dõi nhiều hơn nữa BXH các giải nhỏ cho tới giải to trên toàn thế giới tại VeboTV.`,
      );
    }
  }
}

// =================================================
// Loading indicator functions
// =================================================

/**
 * Show loading indicator
 */
function showLoading() {
  const $matchContainer = $("#match_list_container");
  if (!$matchContainer.length) {
    return;
  }

  // Remove existing content
  $matchContainer.find(".match_box").remove();
  $matchContainer.find(".no-matches").remove();
  $matchContainer.find(".dv2-match-schedule-ad").remove();
  $matchContainer.find(".loading-container").remove();

  // Add loading indicator
  const loadingHtml = `
    <div class="loading-container">
      <div>
        <div class="loading-spinner"></div>
        <div class="loading-text">Đang tải dữ liệu...</div>
      </div>
    </div>
  `;
  $matchContainer.append(loadingHtml);
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  const $matchContainer = $("#match_list_container");
  if (!$matchContainer.length) {
    return;
  }

  $matchContainer.find(".loading-container").remove();
}

// =================================================
// Load data functions
// =================================================

/**
 * Load data for all days
 * - Results page: 7 days ago to today (8 days total)
 * - Schedule page: today to 7 days ahead (8 days total)
 */
function loadDataForAllDays() {
  const today = new Date();
  const fromDate = new Date(today);
  const toDate = new Date(today);

  if (isSchedulePage) {
    // Schedule page: today to 7 days ahead
    toDate.setDate(today.getDate() + 7);
  } else {
    // Results page: 7 days ago to today
    fromDate.setDate(today.getDate() - 7);
  }

  // Show loading
  showLoading();

  DV2.fetchMatchesByDateRange(
    DV2.getDateString(fromDate),
    DV2.getDateString(toDate),
    function (response) {
      // Hide loading
      hideLoading();

      if (response && response.matches_by_date) {
        matchesDataByDate = response.matches_by_date;

        // Load today's matches by default
        const todayString = DV2.getDateString(today);
        loadMatchesForDate(todayString);
        updateHeaderText(todayString);
      } else {
        // Show no data message
        const $matchContainer = $("#match_list_container");
        if ($matchContainer.length) {
          $matchContainer.append(
            '<div class="no-matches" style="padding: 20px; text-align: center; color: #8e8f92;">Không có dữ liệu.</div>',
          );
        }
      }
    },
    function (err) {
      // Hide loading
      hideLoading();

      console.error("[KET QUA] Error loading data:", err);

      // Show error message
      const $matchContainer = $("#match_list_container");
      if ($matchContainer.length) {
        $matchContainer.append(
          '<div class="no-matches" style="padding: 20px; text-align: center; color: #8e8f92;">Đã xảy ra lỗi khi tải dữ liệu.</div>',
        );
      }
    },
  );
}

// =================================================
// Match rendering functions
// =================================================

/**
 * Check if match is currently live
 * @param {Object} match - Match object
 * @returns {boolean} True if match is live
 */
function isMatchLive(match) {
  if (!match || !match.kickoff) {
    return false;
  }

  // Check if status is in LIVE_STATUS
  const status = match.status || "";
  if (DV2.isLiveStatus(status)) {
    return true;
  }

  // Fallback: Check if livestream is available and within time range
  if (match.livestream && match.livestream.available) {
    const now = new Date();
    const kickoff = new Date(match.kickoff);
    const matchEndTime = new Date(kickoff.getTime() + 2 * 60 * 60 * 1000); // 2 hours after kickoff

    return kickoff <= now && now <= matchEndTime;
  }

  return false;
}

/**
 * Filter only finished matches (for results page)
 * @param {Array} matches - Array of match objects
 * @returns {Array} Filtered matches with only finished ones
 */
function filterFinishedMatches(matches) {
  if (!Array.isArray(matches)) {
    return [];
  }

  return matches.filter(function (match) {
    if (!match || !match.status) {
      return false; // Exclude matches without status
    }
    return DV2.isFinishedStatus(match.status);
  });
}

/**
 * Filter matches in the future (not started/scheduled) - for schedule page
 * @param {Array} matches - Array of match objects
 * @returns {Array} Filtered matches with only future/scheduled ones
 */
function filterFutureMatches(matches) {
  if (!Array.isArray(matches)) {
    return [];
  }

  return matches.filter(function (match) {
    if (!match || !match.status) {
      return false; // Exclude matches without status
    }
    return DV2.isNotStartedStatus(match.status);
  });
}

/**
 * Sort matches within a league (matches are already grouped by league)
 * @param {Array} matches - Array of match objects (all from same league)
 * @param {string} dateString - Date string in YYYY-MM-DD format (to determine if today)
 * @returns {Array} Sorted matches
 */
function sortMatches(matches, dateString) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return [];
  }

  const today = new Date();
  const todayString = DV2.getDateString(today);
  const isToday = dateString === todayString;

  return matches.slice().sort(function (a, b) {
    // If today: Live matches first, then finished
    if (isToday) {
      const aIsLive = isMatchLive(a);
      const bIsLive = isMatchLive(b);

      // Live matches come first
      if (aIsLive && !bIsLive) {
        return -1;
      }
      if (!aIsLive && bIsLive) {
        return 1;
      }

      // Both live or both finished: sort by currentMinutes if available, else by kickoff
      if (aIsLive && bIsLive) {
        // Sort live matches by currentMinutes (descending - more minutes first)
        // or by kickoff if currentMinutes not available
        const aMinutes = a.currentMinutes || 0;
        const bMinutes = b.currentMinutes || 0;
        if (aMinutes !== bMinutes) {
          return bMinutes - aMinutes; // Descending: more minutes first
        }
        // If same minutes, sort by kickoff (ascending - earlier kickoff first)
        const kickoffA = new Date(a.kickoff || 0).getTime();
        const kickoffB = new Date(b.kickoff || 0).getTime();
        return kickoffA - kickoffB;
      }

      // Both finished: sort by kickoff (descending - most recent first)
      const kickoffA = new Date(a.kickoff || 0).getTime();
      const kickoffB = new Date(b.kickoff || 0).getTime();
      return kickoffB - kickoffA;
    } else {
      // Yesterday or earlier: sort by kickoff ascending (oldest first)
      const kickoffA = new Date(a.kickoff || 0).getTime();
      const kickoffB = new Date(b.kickoff || 0).getTime();
      return kickoffA - kickoffB; // Ascending order (oldest first)
    }
  });
}

/**
 * Group matches by league
 * @param {Array} matches - Array of match objects
 * @returns {Object} Matches grouped by league
 */
function groupMatchesByLeague(matches) {
  const grouped = {};

  matches.forEach(function (match) {
    const leagueId = match.league?.id || "unknown";
    const leagueName = match.league?.name || "Unknown League";

    if (!grouped[leagueId]) {
      grouped[leagueId] = {
        league: match.league,
        leagueName: leagueName,
        matches: [],
      };
    }

    grouped[leagueId].matches.push(match);
  });

  return grouped;
}

/**
 * Get match score
 * @param {Object} match - Match object
 * @returns {Object} Score object with home and away
 */
function getMatchScore(match) {
  if (!match || !match.score || !match.score.fulltime) {
    return { home: 0, away: 0 };
  }

  return {
    home: match.score.fulltime.home || 0,
    away: match.score.fulltime.away || 0,
  };
}

/**
 * BLV ưu tiên hiển thị: bỏ qua Nhà Đài khi có BLV khác
 * @param {Object} match - Match object
 * @returns {Object|null} Commentator link object or null
 */
function getFirstCommentator(match) {
  const links = match?.livestream?.links;
  if (!Array.isArray(links) || !links.length) {
    return null;
  }

  sortLivestreamLinksPreferRealBlv(links);
  return links[0] || null;
}

/**
 * Render a single match item
 * @param {Object} match - Match object
 * @returns {string} HTML string
 */
function renderMatchItem(match) {
  if (!match) {
    return "";
  }

  const matchId = match.match_id || "";
  const slug = match.slug || "";
  const homeTeam = match.teams?.home || {};
  const awayTeam = match.teams?.away || {};
  const homeTeamName = homeTeam.name || "";
  const awayTeamName = awayTeam.name || "";
  const homeTeamLogo = homeTeam.logo || "";
  const awayTeamLogo = awayTeam.logo || "";
  const kickoff = new Date(match.kickoff || "");
  const matchTime = DV2.formatTimeHHMM(kickoff);
  const score = getMatchScore(match);
  const commentator = getFirstCommentator(match);
  const matchUrl = `/streams/${matchId || slug}`;
  const isLive = isMatchLive(match);

  // Commentator info
  const commentatorName = commentator?.commentator || "";
  const commentatorAvatar = commentator?.avatar || "";

  // Info block: live vs finished vs scheduled
  let infoBlockHtml = "";
  const matchStatus = match.status || "";
  const isFinished = DV2.isFinishedStatus(matchStatus);
  const isNotStarted = DV2.isNotStartedStatus(matchStatus);

  if (isLive) {
    // Live: badge-live + kickoff HH:MM và currentMinutes (hoặc HT nếu Half Time) + commentator
    const status = DV2.normalizeMatchStatus(matchStatus);
    const isHalfTime =
      status === "half-time" ||
      status === "halftime" ||
      status === "ht" ||
      status === "half time";
    const currentMinutes = match.currentMinutes || 0;
    const timeDisplay = isHalfTime ? "HT" : `${currentMinutes}'`;

    infoBlockHtml = `
        <div class="badge-live">
          <i class="dot"></i>Live
        </div>
        <div style="display: flex; gap: 6px;">
          <div class="detail match_item--time">
            <b>${matchTime}</b>
          </div>
          <div class="time-loaded match_item--status">
            <span class="match-status live">${timeDisplay}</span>
          </div>
        </div>
        ${
          commentator
            ? `
          <div class="detail mt-2 match_item--commentator">
            <img 
              onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
              src="${commentatorAvatar}" alt="${commentatorName}" width="24" height="24"/>
            ${commentatorName}
          </div>
        `
            : ""
        }
    `;
  } else if (isFinished) {
    // Finished: text "Kết thúc" + kickoff HH:MM DD/MM + commentator
    const matchDate = DV2.formatDateDDMM(kickoff);
    const dateTimeDisplay = `${matchTime} ${matchDate}`;
    infoBlockHtml = `
        <div style="display: flex; gap: 6px; flex-direction: column;">
          <div class="detail match_item--time">
            <span class="match-status finished">Kết thúc</span>
          </div>
          <div class="match_item--status">
            <span class="match-status">${dateTimeDisplay}</span>
          </div>
        </div>
        ${
          commentator
            ? `
          <div class="detail mt-2 match_item--commentator">
            <img
                onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                src="${commentatorAvatar}" alt="${commentatorName}" width="24" height="24"/>
            ${commentatorName}
          </div>
        `
            : ""
        }
    `;
  } else if (isNotStarted) {
    // Not started/Scheduled: text "Chưa diễn ra" + kickoff HH:MM DD/MM + commentator
    const matchDate = DV2.formatDateDDMM(kickoff);
    const dateTimeDisplay = `${matchTime} ${matchDate}`;
    infoBlockHtml = `
        <div style="display: flex; gap: 6px; flex-direction: column;">
          <div class="detail match_item--time">
            <span class="match-status scheduled">Chưa diễn ra</span>
          </div>
          <div class="match_item--status">
            <span class="match-status">${dateTimeDisplay}</span>
          </div>
        </div>
        ${
          commentator
            ? `
          <div class="detail mt-2 match_item--commentator">
            <img 
            onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
            src="${commentatorAvatar}" alt="${commentatorName}" width="24" height="24"/>
            ${commentatorName}
          </div>
        `
            : ""
        }
    `;
  } else {
    // Other status: show time and date
    const matchDate = DV2.formatDateDDMM(kickoff);
    const dateTimeDisplay = `${matchTime} ${matchDate}`;
    infoBlockHtml = `
        <div style="display: flex; gap: 6px; flex-direction: column;">
          <div class="detail match_item--time">
            <span class="match-status">${matchStatus}</span>
          </div>
          <div class="match_item--status">
            <span class="match-status">${dateTimeDisplay}</span>
          </div>
        </div>
        ${
          commentator
            ? `
          <div class="detail mt-2 match_item--commentator">
            <img 
            onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
            src="${commentatorAvatar}" alt="${commentatorName}" width="24" height="24"/>
            ${commentatorName}
          </div>
        `
            : ""
        }
    `;
  }

  const matchItemHtml = `
    <div class="vitem vitem-vertical ${isLive ? "vitem-live" : ""} match_item">
      <a href="${matchUrl}" class="match-link match_item--link"></a>
      <div class="vitem-info match_item--info">
        ${infoBlockHtml}
      </div>
      <div class="item-team match_item--team">
        <div class="team team-home match_item--team-home">
          <div class="team-logo match_item--home-logo">
            <img class="team-logo-img" loading="lazy" src="${homeTeamLogo}" 
            onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                 alt="${homeTeamName} logo" />
          </div>
          <h3 class="team-name match_item--home-name">${homeTeamName}</h3>
          <div class="vitem-card ml-3"></div>
        </div>
        <div class="team team-away match_item--team-away">
          <div class="team-logo match_item--away-logo">
            <img class="team-logo-img" loading="lazy" src="${awayTeamLogo}" 
            onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                 alt="${awayTeamName} logo" />
          </div>
          <h3 class="team-name match_item--away-name">${awayTeamName}</h3>
          <div class="vitem-card ml-3"></div>
        </div>
      </div>
      <div class="item-result match_item--result">
        <div class="ir-col">
          <div class="match_item--score-home">${score.home}</div>
          <div class="match_item--score-away">${score.away}</div>
        </div>
      </div>
      <div class="item-buttons match_item--button">
        <div class="ibs-live">
          <a href="${matchUrl}" class="btn btn-sm vebo2-btn-bet-hover">Xem ngay</a>
        </div>
        <div class="ibs-bet">
          <a href="${window.DV2_LINK_BET}" target="_blank" rel="nofollow" class="btn btn-sm btn-betnow vebo2-btn-bet">Đặt cược</a>
        </div>
      </div>
      <div class="clearfix"></div>
    </div>
  `;

  return matchItemHtml;
}

function getMatchScheduleListAdBlocks_KQHN() {
  return window.DV2ListAds.getBlocks(window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS);
}

function buildMatchScheduleAdInsertions_KQHN(adBlocks, totalItems) {
  return window.DV2ListAds.buildInsertions(adBlocks, totalItems, {
    breakpoint: window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_MOBILE_BREAKPOINT,
    repeatCycle: window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_REPEAT,
  });
}

function buildMatchScheduleAdMarkup_KQHN(adBlock) {
  return window.DV2ListAds.buildMarkup(adBlock, {
    wrapperTag: "div",
    wrapperClass: "dv2-match-schedule-ad",
  });
}

function refreshMatchScheduleReviveAds_KQHN($container) {
  window.DV2ListAds.refreshReviveAds($container);
}

function renderMatchBox(match) {
  const isHotMatch = DV2.appState.hotLeaguesRank.has(match.league.id);

  let html = `
      <div class="match_box match_item--box ${isHotMatch ? "hot-match" : ""}">
        <div class="mb_-header">
          <span class="item-league match_item--league">
            ${
              match.league?.logo
                ? `
              <i class="league-icon mr-2">
                <img loading="lazy" class="match_item--league-icon" src="${match.league?.logo}" alt="${match.league?.name}"
                  onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                 />
              </i>
            `
                : ""
            }
            <span class="item-league__name match_item--league-name">
              ${match.league?.name}
            </span>
          </span>
        </div>
        <div class="match_list match_list-list match_item--list">
    `;

  html += renderMatchItem(match);

  html += `
        </div>
      </div>
    `;

  return html;
}

function buildEmptyScheduleListHtml_KQHN(message, styleAttr = "") {
  const adInsertions = buildMatchScheduleAdInsertions_KQHN(
    getMatchScheduleListAdBlocks_KQHN(),
    0,
  );
  const style = styleAttr ? ` style="${styleAttr}"` : "";
  let html = `<div class="no-matches"${style}>${message}</div>`;
  if (adInsertions.has(0)) {
    html += buildMatchScheduleAdMarkup_KQHN(adInsertions.get(0));
  }
  return html;
}

/**
 * Render match list grouped by league
 * @param {Array} matches - Array of match objects
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} HTML string
 */
function renderMatchList(matches, dateString) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return buildEmptyScheduleListHtml_KQHN("Không có trận đấu nào");
  }

  // Filter matches based on page type
  let filteredMatches = [];
  if (isSchedulePage) {
    // Schedule page: show live matches + future matches (not started/scheduled)
    filteredMatches = matches.filter(function (match) {
      if (!match || !match.status) {
        return false;
      }
      return isMatchLive(match) || DV2.isNotStartedStatus(match.status);
    });
  } else {
    // Results page: show finished matches + live matches (quá khứ + đang live)
    filteredMatches = matches.filter(function (match) {
      if (!match || !match.status) {
        return false;
      }
      return DV2.isFinishedStatus(match.status) || isMatchLive(match);
    });
  }

  if (filteredMatches.length === 0) {
    return buildEmptyScheduleListHtml_KQHN("Không có trận đấu nào");
  }

  const sorted = DV2.sortedMatchesFunction(filteredMatches);
  const adInsertions = buildMatchScheduleAdInsertions_KQHN(
    getMatchScheduleListAdBlocks_KQHN(),
    sorted.length,
  );

  let html = "";

  sorted.forEach(function (match, index) {
    html += renderMatchBox(match);

    const matchPosition = index + 1;
    if (adInsertions.has(matchPosition)) {
      const adMarkup = buildMatchScheduleAdMarkup_KQHN(adInsertions.get(matchPosition));
      if (adMarkup) {
        html += adMarkup;
      }
    }
  });

  return html;
}

/**
 * Load matches for a specific date
 * @param {string} dateString - Date string in YYYY-MM-DD format
 */
function loadMatchesForDate(dateString) {
  const $matchContainer = $("#match_list_container");
  if (!$matchContainer.length) {
    return;
  }

  // Remove loading if exists
  hideLoading();

  if (!matchesDataByDate[dateString]) {
    $matchContainer.find(".match_box").remove();
    $matchContainer.find(".no-matches").remove();
    $matchContainer.find(".dv2-match-schedule-ad").remove();
    $matchContainer.append(
      buildEmptyScheduleListHtml_KQHN(
        "Không có trận đấu nào trong ngày.",
        "padding: 20px; text-align: center; color: #8e8f92;",
      ),
    );
    refreshMatchScheduleReviveAds_KQHN($matchContainer);
    return;
  }

  const matches = matchesDataByDate[dateString];

  // Remove existing matches
  $matchContainer.find(".match_box").remove();
  $matchContainer.find(".no-matches").remove();
  $matchContainer.find(".dv2-match-schedule-ad").remove();

  // Render new matches (pass dateString for sorting logic)
  const html = renderMatchList(matches, dateString);
  $matchContainer.append(html);
  refreshMatchScheduleReviveAds_KQHN($matchContainer);
}

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* lich_truc_tiep.js */
(function(window, $, jQuery, Hls, Swiper) {
// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

// Constants
const DAYS_TO_DISPLAY_DESKTOP = 5;
const DAYS_TO_DISPLAY_MOBILE = 4; // Mobile: btn-live + 4 days (including today)
const NHADAI_COMMENTATOR_ID = 99999999999999999;

function isNhaDaiLivestreamLink(link) {
  if (!link) return false;
  if (link.commentatorId === NHADAI_COMMENTATOR_ID) return true;
  const name = String(link.commentator || "").trim().toLowerCase();
  return name === "nhà đài" || name === "nha dai" || name === "blv nhà đài";
}

function sortLivestreamLinksPreferRealBlv(links) {
  if (!Array.isArray(links)) return [];
  links.sort((a, b) => {
    const aIsNhaDai = isNhaDaiLivestreamLink(a);
    const bIsNhaDai = isNhaDaiLivestreamLink(b);
    if (aIsNhaDai && !bIsNhaDai) return 1;
    if (!aIsNhaDai && bIsNhaDai) return -1;
    return 0;
  });
  return links;
}

/**
 * Check if device is mobile (screen width <= 640px)
 * @returns {boolean} True if mobile
 */
function isMobile() {
  return window.innerWidth <= 640;
}

/**
 * Get number of days to display based on device type
 * @returns {number} Number of days to display
 */
function getDaysToDisplay() {
  return isMobile() ? DAYS_TO_DISPLAY_MOBILE : DAYS_TO_DISPLAY_DESKTOP;
}

// Global variables
let selectedDateIndex = -1; // -1 means LIVE button is active by default
let matchesDataByDate = {};
let isLiveMode = true; // Track if we're in live mode or date mode

// Init
$(document).ready(function () {
  // Mega-bundle loads on every DV2 page — only run for this layout's markup.
  if (!$(".dv2-vb2-container .mdx_-list").length && !$(".match_date_home .mdx_-list").length) {
    return;
  }
  renderDateList();
  loadDataForAllDays();
  setupDateClickHandlers();
  setupLiveButtonHandler();
  setupResizeHandler();
  bindVb2BlvDropdownEvents_LTT();
});

// =================================================
// Render date list
// =================================================

/**
 * Render days from today
 */
function renderDateList() {
  const $dateList = $(".mdx_-list");
  if (!$dateList.length) {
    return;
  }

  const today = new Date();
  let html = "";
  const daysToDisplay = getDaysToDisplay();

  for (let i = 0; i < daysToDisplay; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const dateDDMM = DV2.formatDateDDMM(date);
    const dayLabel = DV2.getVietnameseDayLabel(date, i);
    const dateString = DV2.getDateString(date);
    const activeClass = i === selectedDateIndex ? "active" : "";

    html += `
      <a href="javascript:void(0)" class="item f-date ${activeClass}" data-date="${dateString}" data-index="${i}">
        <span class="date-a date_of_day">${dateDDMM}</span>
        <span class="date-b date_of_week">${dayLabel}</span>
      </a>
    `;
  }

  $dateList.html(html);
}

// =================================================
// Setup event handlers
// =================================================

/**
 * Setup click handlers for date items
 */
function setupDateClickHandlers() {
  $(document).on("click", ".mdx_-list .item.f-date", function () {
    const $item = $(this);
    const index = parseInt($item.data("index"), 10);

    // Remove active from all date items
    $(".mdx_-list .item.f-date").removeClass("active");

    // Remove active from LIVE button
    $(".btn-live").removeClass("active");

    // Add active to clicked item
    $item.addClass("active");

    // Update selected date index and mode
    selectedDateIndex = index;
    isLiveMode = false;

    // Load matches for selected date
    const dateString = $item.data("date");
    loadMatchesForDate(dateString);
  });
}

/**
 * Setup click handler for LIVE button
 */
function setupLiveButtonHandler() {
  $(document).on("click", ".btn-live", function () {
    const $btn = $(this);

    // Remove active from all date items
    $(".mdx_-list .item.f-date").removeClass("active");

    // Add active to LIVE button
    $btn.addClass("active");

    // Update mode
    selectedDateIndex = -1;
    isLiveMode = true;

    // Load live matches
    loadLiveMatches();
  });
}

/**
 * Setup resize handler to re-render date list when screen size changes
 */
function setupResizeHandler() {
  let resizeTimer;
  let lastDaysToDisplay = getDaysToDisplay();

  $(window).on("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      const currentDaysToDisplay = getDaysToDisplay();

      // Only re-render if number of days changed
      if (currentDaysToDisplay !== lastDaysToDisplay) {
        lastDaysToDisplay = currentDaysToDisplay;

        // If selected date index is out of range, reset to live mode
        if (selectedDateIndex >= currentDaysToDisplay) {
          selectedDateIndex = -1;
          isLiveMode = true;
          $(".mdx_-list .item.f-date").removeClass("active");
          $(".btn-live").addClass("active");
        }

        // Re-render date list
        renderDateList();

        // Re-setup click handlers (in case DOM changed)
        setupDateClickHandlers();

        // Reload data if needed (to ensure we have data for all displayed days)
        loadDataForAllDays();
      }
    }, 250); // Debounce resize events
  });
}

// =================================================
// Load data functions
// =================================================

/**
 * Load data for all days
 */
function loadDataForAllDays() {
  const today = new Date();
  const fromDate = new Date(today);
  const toDate = new Date(today);
  const daysToDisplay = getDaysToDisplay();
  toDate.setDate(today.getDate() + daysToDisplay);

  DV2.fetchMatchesByDateRange(
    DV2.getDateString(fromDate),
    DV2.getDateString(toDate),
    function (response) {
      if (response && response.matches_by_date) {
        matchesDataByDate = response.matches_by_date;

        // Update live count badge
        updateLiveCountBadge();

        // Load live matches by default (since isLiveMode = true and selectedDateIndex = -1)
        if (isLiveMode) {
          loadLiveMatches();
        } else {
          // Load matches for selected date
          const selectedDate = new Date(today);
          selectedDate.setDate(today.getDate() + selectedDateIndex);
          const selectedDateString = DV2.getDateString(selectedDate);
          loadMatchesForDate(selectedDateString);
        }
      }
    },
    function (err) {
      console.error("[DATE LIST] Error loading data:", err);
    },
  );
}

// =================================================
// Match status and sorting functions
// =================================================

const EXCLUDED_MATCH_STATUSES = ["delay", "interrupt", "cut in half"];

function isExcludedMatchStatus(status) {
  return EXCLUDED_MATCH_STATUSES.includes(DV2.normalizeMatchStatus(status || ""));
}

/**
 * Check if match is currently live
 * @param {Object} match - Match object
 * @returns {boolean} True if match is live
 */
function isMatchLive(match) {
  if (!match || !match.kickoff) {
    return false;
  }

  const status = match.status || "";
  if (isExcludedMatchStatus(status)) {
    return false;
  }

  // Check if status is in LIVE_STATUS
  if (DV2.isLiveStatus(status)) {
    return true;
  }

  // Fallback: Check if livestream is available and within time range
  if (match.livestream && match.livestream.available) {
    const now = new Date();
    const kickoff = new Date(match.kickoff);
    const matchEndTime = new Date(kickoff.getTime() + 2 * 60 * 60 * 1000); // 2 hours after kickoff

    return kickoff <= now && now <= matchEndTime;
  }

  return false;
}

/**
 * Get match status priority for sorting
 * @param {Object} match - Match object
 * @returns {number} Priority (lower = higher priority)
 */
function getMatchStatusPriority(match) {
  if (isMatchLive(match)) {
    return 1; // Live matches first
  }

  const status = match.status || "";
  const now = new Date();
  const kickoff = new Date(match.kickoff);

  if (DV2.isFinishedStatus(status)) {
    return 4; // Finished matches last
  }

  if (kickoff > now && DV2.isNotStartedStatus(status)) {
    return 2; // Upcoming matches
  }

  return 3; // Other statuses
}

/**
 * Sort matches within a league (matches are already grouped by league)
 * @param {Array} matches - Array of match objects (all from same league)
 * @returns {Array} Sorted matches
 */
function sortMatches(matches) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return [];
  }

  return matches.slice().sort(function (a, b) {
    // Sort by status priority
    const priorityA = getMatchStatusPriority(a);
    const priorityB = getMatchStatusPriority(b);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Finally sort by kickoff time
    const kickoffA = new Date(a.kickoff || 0).getTime();
    const kickoffB = new Date(b.kickoff || 0).getTime();
    return kickoffA - kickoffB;
  });
}

/**
 * Group matches by league
 * @param {Array} matches - Array of match objects
 * @returns {Object} Matches grouped by league
 */
function groupMatchesByLeague(matches) {
  const grouped = {};

  matches.forEach(function (match) {
    const leagueId = match.league?.id || "unknown";
    const leagueName = match.league?.name || "Unknown League";

    if (!grouped[leagueId]) {
      grouped[leagueId] = {
        league: match.league,
        leagueName: leagueName,
        matches: [],
      };
    }

    grouped[leagueId].matches.push(match);
  });

  return grouped;
}

// =================================================
// Render match functions
// =================================================

/**
 * Format match status display
 * @param {Object} match - Match object
 * @returns {string} Formatted status
 */
function formatMatchStatus(match) {
  if (!match) {
    return "Chưa diễn ra";
  }

  const status = DV2.normalizeMatchStatus(match.status || "");

  // Check if live
  if (isMatchLive(match) || DV2.isLiveStatus(status)) {
    // Format specific live statuses
    if (
      status === "half-time" ||
      status === "halftime" ||
      status === "ht" ||
      status == "half time"
    ) {
      return "HT";
    }
    if (status === "first half") {
      return "Hiệp 1";
    }
    if (status === "second half") {
      return "Hiệp 2";
    }
    if (status === "overtime" || status === "overtime(deprecated)") {
      return "Hiệp phụ";
    }
    if (status === "penalty shoot-out" || status === "penalty") {
      return "Penalty";
    }
    return "Live";
  }

  // Check if finished
  if (DV2.isFinishedStatus(status)) {
    return "FT";
  }

  // Check if not started
  if (DV2.isNotStartedStatus(status)) {
    return "Chưa diễn ra";
  }

  // Other statuses
  if (status === "delay") {
    return "Hoãn";
  }
  if (status === "interrupt") {
    return "Tạm dừng";
  }
  if (status === "cancel") {
    return "Hủy";
  }

  return match.status || "Chưa diễn ra";
}

/**
 * Get match score
 * @param {Object} match - Match object
 * @returns {Object} Score object with home and away
 */
function getMatchScore(match) {
  if (!match || !match.score || !match.score.fulltime) {
    return { home: 0, away: 0 };
  }

  return {
    home: match.score.fulltime.home || 0,
    away: match.score.fulltime.away || 0,
  };
}

function escapeHtml_VB2(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getDetailUrl_VB2(matchId, link) {
  return window.DV2StreamLinks.getDetailUrl(matchId, link, { trailingSlash: true });
}

function renderLttBlvAvatar(link, label) {
  const avatar = link?.avatar || "";
  return `
    <img
      src="${escapeHtml_VB2(avatar)}"
      alt="${escapeHtml_VB2(label)}"
      width="24"
      height="24"
      onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
    />
  `;
}

function buildCommentatorDropdown_VB2(match) {
  const sortedLinks = window.DV2BlvDropdown.getSortedLinks(match);

  return window.DV2BlvDropdown.build({
    match,
    links: sortedLinks,
    getDetailUrl: getDetailUrl_VB2,
    escapeHtml: escapeHtml_VB2,
    menuPlacement: "down",
    emptyHtml: "",
    rootClass: "detail mt-2 match_item--commentator",
    renderToggle: ({ link, label }) => `
      ${renderLttBlvAvatar(link, label)}
      <span class="match_item--commentator-name">${escapeHtml_VB2(label)}</span>
    `,
    renderItemContent: ({ link, label }) => `
      ${renderLttBlvAvatar(link, label)}
      <span class="match_item--commentator-name">${escapeHtml_VB2(label)}</span>
    `,
  });
}

function bindVb2BlvDropdownEvents_LTT() {
  window.DV2BlvDropdown.bind($(".match_list_container"), {
    namespace: "vb2BlvDropdownLtt",
    documentCloseDelay: true,
  });
}

function getMatchScheduleListAdBlocks_VB2() {
  return window.DV2ListAds.getBlocks(window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS);
}

function buildMatchScheduleAdInsertions_VB2(adBlocks, totalItems) {
  return window.DV2ListAds.buildInsertions(adBlocks, totalItems, {
    breakpoint: window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_MOBILE_BREAKPOINT,
    repeatCycle: window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_REPEAT,
  });
}

function buildMatchScheduleAdMarkup_VB2(adBlock) {
  return window.DV2ListAds.buildMarkup(adBlock, {
    wrapperTag: "div",
    wrapperClass: "dv2-match-schedule-ad",
  });
}

function refreshMatchScheduleReviveAds_VB2($container) {
  window.DV2ListAds.refreshReviveAds($container);
}

/**
 * Render a single match item
 * @param {Object} match - Match object
 * @returns {string} HTML string
 */
function renderMatchItem(match) {
  if (!match) {
    return "";
  }

  const matchId = match.match_id || "";
  const slug = match.slug || "";
  const homeTeam = match.teams?.home || {};
  const awayTeam = match.teams?.away || {};
  const homeTeamName = homeTeam.name || "";
  const awayTeamName = awayTeam.name || "";
  const homeTeamLogo = homeTeam.logo || "";
  const awayTeamLogo = awayTeam.logo || "";
  const kickoff = new Date(match.kickoff || "");
  const matchTime = DV2.formatTimeHHMM(kickoff);
  const status = formatMatchStatus(match);
  const isLive = isMatchLive(match);
  const score = getMatchScore(match);
  const matchUrl = `/streams/${matchId || slug}`;

  // Status badge class
  const statusClass = isLive ? "live" : "pending";
  const statusText = isLive ? "Live" : status;

  // Commentator dropdown
  const commentatorDropdownHtml = buildCommentatorDropdown_VB2(match);

  // Info block: live vs not started/upcoming
  let infoBlockHtml = "";
  if (isLive) {
    // Check if Half Time
    const normalizedStatus = DV2.normalizeMatchStatus(match.status || "");
    const isHalfTime =
      normalizedStatus === "half-time" ||
      normalizedStatus === "halftime" ||
      normalizedStatus === "ht" ||
      normalizedStatus === "half time";
    const currentMinutes = match.currentMinutes || 0;
    const timeDisplay = isHalfTime ? "HT" : `${currentMinutes}'`;

    infoBlockHtml = `
        <div class="badge-live">
          <i class="dot"></i>
          ${statusText}
        </div>
        <div style="display: flex; gap: 6px">
          <div class="detail match_item--time">
            <b>${matchTime}</b>
          </div>
          <div class="time-loaded match_item--status">
            <span class="match-status ${statusClass}">${timeDisplay}</span>
          </div>
        </div>
    `;
  } else {
    // Not live: show time + date (if not today) and pending status
    const today = new Date();
    const isToday =
      kickoff.getFullYear() === today.getFullYear() &&
      kickoff.getMonth() === today.getMonth() &&
      kickoff.getDate() === today.getDate();

    const dateLabel = isToday ? "" : ` ${DV2.formatDateDDMM(kickoff)}`;
    const displayTime = `${matchTime}${dateLabel}`;

    infoBlockHtml = `
        <div style="display: flex; gap: 6px; flex-direction: column-reverse;">
          <div class="detail">
            <b>${displayTime}</b>
          </div>
          <div class="time-loaded">
            <span class="match-status pending">${status}</span>
          </div>
        </div>
    `;
  }

  const matchItemHtml = `
    <div class="vitem vitem-vertical ${isLive ? "vitem-live" : ""} match_item">
      <a href="${matchUrl}" class="match-link match_item--link"></a>
      <div class="vitem-info match_item--info">
        ${infoBlockHtml}
        ${commentatorDropdownHtml}
      </div>
      <div class="item-team match_item--team">
        <div class="team team-home match_item--team-home">
          <div class="team-logo match_item--home-logo">
            <img class="team-logo-img" loading="lazy" src="${homeTeamLogo}" 
            onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                 alt="${homeTeamName} logo" />
          </div>
          <h3 class="team-name match_item--home-name">${homeTeamName}</h3>
          <div class="vitem-card ml-3"></div>
        </div>
        <div class="team team-away match_item--team-away">
          <div class="team-logo match_item--away-logo">
            <img class="team-logo-img" loading="lazy" src="${awayTeamLogo}" 
            onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                 alt="${awayTeamName} logo" />
          </div>
          <h3 class="team-name match_item--away-name">${awayTeamName}</h3>
          <div class="vitem-card ml-3"></div>
        </div>
      </div>
      <div class="item-result match_item--result">
        <div class="ir-col">
          ${
            !isLive
              ? `<div class="xspace">vs</div>`
              : `
            <div class="match_item--score-home">${score.home}</div>
            <div class="match_item--score-away">${score.away}</div> 
            `
          }
        </div>
      </div>
      <div class="item-buttons match_item--button">
        <div class="ibs-live">
          <a href="${matchUrl}" class="btn btn-sm vebo2-btn-bet-hover">Xem ngay</a>
        </div>
        <div class="ibs-bet">
          <a href="${window.DV2_LINK_BET}" target="_blank" rel="nofollow" class="btn btn-sm btn-betnow vebo2-btn-bet">Đặt cược</a>
        </div>
      </div>
      <div class="clearfix"></div>
    </div>
  `;

  return matchItemHtml;
}

/**
 * Render match box wrapper with league header
 * @param {Object} match - Match object
 * @returns {string} HTML string
 */
function renderMatchBox(match) {
  const isHotMatch = DV2.appState.hotLeaguesRank.has(match.league.id);

  let html = `
      <div class="match_box match_item--box ${isHotMatch ? "hot-match" : ""}">
        <div class="mb_-header">
          <span class="item-league match_item--league">
            ${
              match.league?.logo
                ? `
              <i class="league-icon mr-2">
                <img loading="lazy" class="match_item--league-icon" src="${match.league.logo}" alt="${match.league.name}"
                  onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                 />
              </i>
            `
                : ""
            }
            <span class="item-league__name match_item--league-name">
              ${match.league.name}
            </span>
          </span>
        </div>
        <div class="match_list match_list-list match_item--list">
    `;

  html += renderMatchItem(match);

  html += `
        </div>
      </div>
    `;

  return html;
}

/**
 * Filter out finished matches
 * @param {Array} matches - Array of match objects
 * @returns {Array} Filtered matches without finished ones
 */
function filterFinishedMatches(matches) {
  if (!Array.isArray(matches)) {
    return [];
  }

  return matches.filter(function (match) {
    if (!match || !match.status) {
      return true; // Keep matches without status
    }
    if (isExcludedMatchStatus(match.status)) {
      return false;
    }
    return !DV2.isFinishedStatus(match.status);
  });
}

function buildEmptyScheduleListHtml_VB2(message, styleAttr = "") {
  const adInsertions = buildMatchScheduleAdInsertions_VB2(
    getMatchScheduleListAdBlocks_VB2(),
    0,
  );
  const style = styleAttr ? ` style="${styleAttr}"` : "";
  let html = `<div class="no-matches"${style}>${message}</div>`;
  if (adInsertions.has(0)) {
    html += buildMatchScheduleAdMarkup_VB2(adInsertions.get(0));
  }
  return html;
}

/**
 * Render match list grouped by league
 * @param {Array} matches - Array of match objects
 * @returns {string} HTML string
 */
function renderMatchList(matches) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return buildEmptyScheduleListHtml_VB2("Không có trận đấu nào");
  }

  // Filter out finished matches
  const filteredMatches = filterFinishedMatches(matches);
  if (filteredMatches.length === 0) {
    return buildEmptyScheduleListHtml_VB2("Không có trận đấu nào");
  }

  // Group by league first
  // const groupedByLeague = groupMatchesByLeague(filteredMatches);

  // Sort matches within each league group
  // Object.keys(groupedByLeague).forEach(function (leagueId) {
  //   const leagueGroup = groupedByLeague[leagueId];
  //   leagueGroup.matches = sortMatches(leagueGroup.matches);
  // });

  const sorted = DV2.sortedMatchesFunction(filteredMatches);
  const adInsertions = buildMatchScheduleAdInsertions_VB2(
    getMatchScheduleListAdBlocks_VB2(),
    sorted.length,
  );

  let html = "";

  sorted.forEach(function (match, index) {
    html += renderMatchBox(match);

    const matchPosition = index + 1;
    if (adInsertions.has(matchPosition)) {
      const adMarkup = buildMatchScheduleAdMarkup_VB2(adInsertions.get(matchPosition));
      if (adMarkup) {
        html += adMarkup;
      }
    }
  });

  return html;
}

/**
 * Update live count badge (total across all dates)
 */
function updateLiveCountBadge() {
  const $badge = $(".badge-live-count");
  if (!$badge.length) {
    return;
  }

  // Collect all matches from all dates
  let allMatches = [];
  Object.keys(matchesDataByDate).forEach(function (dateString) {
    const matches = matchesDataByDate[dateString] || [];
    allMatches = allMatches.concat(matches);
  });

  // Filter out finished matches first
  const filteredMatches = filterFinishedMatches(allMatches);
  // Count live matches
  const liveCount = filteredMatches.filter(function (match) {
    return isMatchLive(match);
  }).length;

  $badge.text(liveCount);
}

/**
 * Update live count badge for a specific date (legacy - kept for compatibility)
 * @param {string} dateString - Date string in YYYY-MM-DD format
 */
function updateLiveCountForDate(dateString) {
  // Always update with total live count across all dates
  updateLiveCountBadge();
}

/**
 * Load matches for a specific date
 * @param {string} dateString - Date string in YYYY-MM-DD format
 */
function loadMatchesForDate(dateString) {
  const $matchContainer = $(".match_list_container");
  if (!$matchContainer.length) {
    return;
  }

  if (!matchesDataByDate[dateString]) {
    $matchContainer.find(".match_box").remove();
    $matchContainer.find(".no-matches").remove();
    $matchContainer.find(".dv2-match-schedule-ad").remove();
    updateLiveCountForDate(dateString);
    $matchContainer.append(
      buildEmptyScheduleListHtml_VB2(
        "Không có trận đấu nào trong ngày.",
        "padding: 20px; text-align: center; color: #8e8f92;",
      ),
    );
    refreshMatchScheduleReviveAds_VB2($matchContainer);
    return;
  }

  const matches = matchesDataByDate[dateString];

  // Remove existing matches
  $matchContainer.find(".match_box").remove();
  $matchContainer.find(".no-matches").remove();
  $matchContainer.find(".dv2-match-schedule-ad").remove();

  // Render new matches
  const html = renderMatchList(matches);
  $matchContainer.append(html);
  bindVb2BlvDropdownEvents_LTT();
  refreshMatchScheduleReviveAds_VB2($matchContainer);
  updateLiveCountForDate(dateString);
}

/**
 * Load all live matches from all dates
 */
function loadLiveMatches() {
  const $matchContainer = $(".match_list_container");
  if (!$matchContainer.length) {
    return;
  }

  // Collect all matches from all dates
  let allMatches = [];
  Object.keys(matchesDataByDate).forEach(function (dateString) {
    const matches = matchesDataByDate[dateString] || [];
    allMatches = allMatches.concat(matches);
  });

  // Filter only live matches
  const liveMatches = allMatches.filter(function (match) {
    return isMatchLive(match);
  });

  // console.log(`[LIVE] Live matches:`, liveMatches);

  // Remove existing matches
  $matchContainer.find(".match_box").remove();
  $matchContainer.find(".no-matches").remove();
  $matchContainer.find(".dv2-match-schedule-ad").remove();

  // Render live matches or show message
  if (liveMatches.length === 0) {
    $matchContainer.append(
      buildEmptyScheduleListHtml_VB2(
        "Hiện tại không có trận đấu nào đang diễn ra.",
        "padding: 20px; text-align: center; color: #8e8f92;",
      ),
    );
    refreshMatchScheduleReviveAds_VB2($matchContainer);
  } else {
    const html = renderMatchList(liveMatches);
    $matchContainer.append(html);
    bindVb2BlvDropdownEvents_LTT();
    refreshMatchScheduleReviveAds_VB2($matchContainer);
  }

  // Update live count badge
  updateLiveCountBadge();
}

/**
 * Load data (legacy function - kept for compatibility)
 * @param {number} addingDays - Number of days to add
 */
function loadData(addingDays = 1) {
  const today = new Date();
  const fromDate = new Date(today);
  const toDate = new Date(today);
  fromDate.setDate(fromDate.getDate());
  toDate.setDate(toDate.getDate() + addingDays);

  DV2.fetchMatchesByDateRange(
    DV2.getDateString(fromDate),
    DV2.getDateString(toDate),
    function (res) {
      if (res && res.matches_by_date) {
        matchesDataByDate = res.matches_by_date;
      }
      loadLiveMatches();
    },
    function (err) {
      console.error("Error:", err);
    }
  );
}

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* match-live.js */
(function(window, $, jQuery, Hls, Swiper) {
$ = jQuery.noConflict();

const NHADAI_COMMENTATOR_ID = 99999999999999999;

function isNhaDaiLivestreamLink(link) {
  if (!link) return false;
  if (link.commentatorId === NHADAI_COMMENTATOR_ID) return true;
  const name = String(link.commentator || "").trim().toLowerCase();
  return name === "nhà đài" || name === "nha dai" || name === "blv nhà đài";
}

function sortLivestreamLinksPreferRealBlv(links) {
  if (!Array.isArray(links)) return [];
  links.sort((a, b) => {
    const aIsNhaDai = isNhaDaiLivestreamLink(a);
    const bIsNhaDai = isNhaDaiLivestreamLink(b);
    if (aIsNhaDai && !bIsNhaDai) return 1;
    if (!aIsNhaDai && bIsNhaDai) return -1;
    return 0;
  });
  return links;
}

function getPreferredLivestreamLink(match) {
  const links = match?.livestream?.links;
  if (!Array.isArray(links) || !links.length) return null;
  sortLivestreamLinksPreferRealBlv(links);
  return links[0] || null;
}

const appState = {
  hotLeaguesRank: new Map(),
};

const MATCH_LIVE_ROOT = ".dv2-layout-vb2.dv2-calendar-matchs";
let matchLiveSwiper = null;

const HAFT_TIME = ["half-time", "half time", "halftime", "ht"];

const LIVE_STATUS = [
  "interrupt",
  "first half",
  "firsthalf",
  "first-half",
  "fh",
  "half-time",
  "half time",
  "halftime",
  "ht",
  "second half",
  "secondhalf",
  "second-half",
  "sh",
  "extra time",
  "extratime",
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
];

function destroyMatchLiveSwiper() {
  if (matchLiveSwiper) {
    matchLiveSwiper.destroy(true, true);
    matchLiveSwiper = null;
  }
}

function initMatchLiveSwiper(slideCount) {
  destroyMatchLiveSwiper();
  const $root = $(MATCH_LIVE_ROOT);
  const el = $root.find(".mySwiper")[0];
  if (!el || slideCount < 1) return;

  const canLoop = slideCount >= 3;
  matchLiveSwiper = new Swiper(el, {
    slidesPerView: 1,
    spaceBetween: 16,
    centeredSlides: true,
    centeredSlidesBounds: true,
    initialSlide: Math.min(2, slideCount - 1),
    loop: canLoop,
    autoplay:
      slideCount > 1
        ? { delay: 3000, disableOnInteraction: false }
        : false,
    navigation: {
      nextEl: $root.find(".swiper-button-next")[0],
      prevEl: $root.find(".swiper-button-prev")[0],
    },
    breakpoints: {
      768: { slidesPerView: 1 },
      1024: { slidesPerView: 2 },
    },
    observer: true,
    observeSlideChildren: true,
  });
}

$(document).ready(() => {
  if ($(MATCH_LIVE_ROOT).length > 0) {
    loadHomeMatchesData_VB2();
  }
});

function renderHomeMatchCard_VB2(match) {
  const kickoff = new Date(match.kickoff).toLocaleTimeString("vn-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const home = match.teams?.home || {};
  const score = match.score || {};
  const away = match.teams?.away || {};
  const league = match.league || {};
  const isHot = appState.hotLeaguesRank.has(match.league.id);
  const preferredBlv = getPreferredLivestreamLink(match);
  const isLive = LIVE_STATUS.includes(match.status.toLowerCase());
  const statusLower = match.status.toLowerCase();
  const matchStatusText = isLive
    ? HAFT_TIME.includes(statusLower)
      ? "HT"
      : match.currentMinutes != null && match.currentMinutes !== ""
        ? `${match.currentMinutes}'`
        : "Live"
    : "";
  return `
                <div class="swiper-slide xitem xitem-big ${isHot ? "hot-game" : ""}" >
      <a href="/streams/${match?.match_id}" class="match-link"></a>
      ${
        isLive
          ? `<div class="stick stick-live"><i class="dot"></i>Live</div>`
          : ""
      }
      <div class="xitem-header">
        <div class="xleague">
          <img
            width="20"
            height="20"
            src="${league.logo}"
            onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
            alt="${league.logo}"
          />
          ${league.name}
        </div>
      </div>
      <div class="xitem-main">
        <div class="team team-home" style="">
          <div class="team-logo">
            <img
              src="${home.logo}"
            onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
              alt="${home.logo}"
              class="team-logo-img"
              loading="lazy"
            />
          </div>
          <div class="xname">
            <h3 class="team-name">${home.name}</h3>
            <div class="xcards"></div>
          </div>
        </div>
        <div class="xinfo">
          <div class="time-loaded">
            <span class="match-status ${isLive ? "live" : ""}">${matchStatusText}</span>
          </div>
          <div class="result">${
            isLive
              ? `<div>${score.fulltime.home}</div>
            <div class="xspace">-</div>
            <div>${score.fulltime.away}</div>`
              : "VS"
          }</div>
          <div class="detail"><b>${kickoff}</b></div>
        </div>
        <div class="team team-away">
          <div class="team-logo">
            <img
              src="${away.logo}"
              onerror="https://static.90pcdn.com/images/match.png"
              alt="${away.logo}"
              class="team-logo-img"
              loading="lazy"
            />
          </div>
          <div class="xname">
            <h3 class="team-name">${away.name}</h3>
            <div class="xcards"></div>
          </div>
        </div>
      </div>
      <div class="xitem-bottom">
        <div class="xcommentator">
          <img
            src="${preferredBlv?.avatar || ""}"
            width="32"
            height="32"
            style="border-radius: 50%; object-fit: contain"
            onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
          />
          ${preferredBlv?.commentator || ""}
        </div>
        <div class="xitem-buttons">
          <div class="ibs-live">
            <a href="/streams/${match.match_id}" class="btn btn-sm vebo2-btn-bet-hover">Xem ngay</a>
          </div>
          <div class="ibs-bet">
            <a href="${window.DV2_LINK_BET}" target="_blank" rel="nofollow" class="btn btn-sm btn-betnow vebo2-btn-bet">Đặt cược</a>
          </div>
        </div>
      </div>
    </div>
            `;
}

const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-first",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
});

function renderHomeMatches_VB2(matches, filter = "all") {
  const now = new Date();
  const twoHours = 2 * 60 * 60 * 1000;
  const filtered = matches
    .filter((m) => {
      const kickoff = new Date(m.kickoff);

      const end = new Date(kickoff.getTime() + twoHours);
      if (filter === "live") return now >= kickoff && now <= end;
      if (filter === "today") {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const endDay = new Date(now);
        endDay.setHours(23, 59, 59, 999);
        return kickoff > now && kickoff <= endDay;
      }
      return end >= now;
    })
    .sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
    );
  const sortedMatches = sortedMatchesFunction(filtered);

  const $c = $(`${MATCH_LIVE_ROOT} .swiper-wrapper`);
  $c.empty();
  if (!sortedMatches.length) {
    destroyMatchLiveSwiper();
    $c.html(`<div class="dv2-empty-state">Không có trận đấu</div>`);
    return;
  }
  const cards = sortedMatches.map((m) => renderHomeMatchCard_VB2(m)).join("");
  $c.append(cards);
  initMatchLiveSwiper(sortedMatches.length);
  // const grouped = groupMatchesByLeague_VB2(filtered);
  // Object.keys(grouped).forEach((league) => {
  //   // const logo = grouped[league][0]?.league?.logo || "";
  //   const cards = grouped[league]
  //     .map((m) => renderHomeMatchCard_VB2(m))
  //     .join("");
  //   $c.append(`
  //                       ${cards}
  //               `);
  // });
}

function loadHomeMatchesData_VB2() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const payload = {
    fromDate: today.toISOString().split("T")[0],
    toDate: tomorrow.toISOString().split("T")[0],
  };
  $.ajax({
    url: "https://vsc-apidev.helizones.com/api/data/lives/range-date",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: (res) => {
      if (res && res.matches_by_date) {
        const all = [];
        Object.keys(res.matches_by_date).forEach((d) =>
          all.push(...res.matches_by_date[d])
        );
        renderHomeMatches_VB2(all);
        // setupFilterButtons_VB2(all);
      } else
        $(".dv2-layout-vb2.dv2-calendar-matchs .swiper-wrapper").html(
          '<div class="dv2-empty-state">Không có dữ liệu</div>'
        );
    },
    error: () =>
      $(".dv2-layout-vb2.dv2-calendar-matchs .swiper-wrapper").html(
        '<div class="dv2-empty-state">Lỗi tải dữ liệu</div>'
      ),
  });
  DV2HotLeagues.load({
    ajax: $.ajax,
    setHotLeaguesRank: (rankMap) => {
      appState.hotLeaguesRank = rankMap;
    },
  });
}

// function setupFilterButtons_VB2(matches) {
//   $(".dv2-layout-vb.dv2-calendar-matchs .dv2-filter-btn")
//     .off("click")
//     .on("click", function () {
//       $(".dv2-layout-vb.dv2-calendar-matchs .dv2-filter-btn").removeClass(
//         "active"
//       );
//       $(this).addClass("active");
//       renderHomeMatches_VB(matches, $(this).data("filter"));
//     });
// }
function groupMatchesByLeague_VB2(matches) {
  const grouped = {};
  matches.forEach((m) => {
    const name = m.league?.name || "Giải đấu khác";
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(m);
  });
  return grouped;
}

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* tam-diem.js */
(function(window, $, jQuery, Hls, Swiper) {
$ = jQuery.noConflict();

const NHADAI_COMMENTATOR_ID = 99999999999999999;

function isNhaDaiLivestreamLink(link) {
  if (!link) return false;
  if (link.commentatorId === NHADAI_COMMENTATOR_ID) return true;
  const name = String(link.commentator || "").trim().toLowerCase();
  return name === "nhà đài" || name === "nha dai" || name === "blv nhà đài";
}

function sortLivestreamLinksPreferRealBlv(links) {
  if (!Array.isArray(links)) return [];
  links.sort((a, b) => {
    const aIsNhaDai = isNhaDaiLivestreamLink(a);
    const bIsNhaDai = isNhaDaiLivestreamLink(b);
    if (aIsNhaDai && !bIsNhaDai) return 1;
    if (!aIsNhaDai && bIsNhaDai) return -1;
    return 0;
  });
  return links;
}

function getPreferredLivestreamLink(match) {
  const links = match?.livestream?.links;
  if (!Array.isArray(links) || !links.length) return null;
  sortLivestreamLinksPreferRealBlv(links);
  return links[0] || null;
}

function escapeHtml_VB2(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getDetailUrl_VB2(matchId, link) {
  return window.DV2StreamLinks.getDetailUrl(matchId, link, { trailingSlash: true });
}

function renderVb2BlvAvatar(link, label) {
  const avatar = link?.avatar || "";
  return `
    <img
      src="${escapeHtml_VB2(avatar)}"
      width="32"
      height="32"
      alt="${escapeHtml_VB2(label)}"
      style="border-radius: 50%; object-fit: contain"
      onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
    />
  `;
}

function buildCommentatorDropdown_VB2(match) {
  const sortedLinks = window.DV2BlvDropdown.getSortedLinks(match);

  return window.DV2BlvDropdown.build({
    match,
    links: sortedLinks,
    getDetailUrl: getDetailUrl_VB2,
    escapeHtml: escapeHtml_VB2,
    menuPlacement: "down",
    emptyHtml: "<div></div>",
    toggleClass: "xcommentator",
    renderToggle: ({ link, label }) => `
      ${renderVb2BlvAvatar(link, label)}
      <p class="xcommentator-name">${escapeHtml_VB2(label)}</p>
    `,
    renderItemContent: ({ link, label }) => `
      ${renderVb2BlvAvatar(link, label)}
      <span class="xcommentator-name">${escapeHtml_VB2(label)}</span>
    `,
  });
}

function bindVb2BlvDropdownEvents() {
  window.DV2BlvDropdown.bind($(".dv2-tam-diem-vb2.dv2-calendar-matchs .dv2-grid"), {
    namespace: "vb2BlvDropdown",
    documentCloseDelay: true,
  });
}

$(document).ready(() => {
  if ($(".dv2-tam-diem-vb2.dv2-calendar-matchs").length > 0) {
    bindVb2BlvDropdownEvents();
    loadHomeMatchesData_VB2();
  }
});

/**
 * appState
 * @type {string[]}
 */
const appState = {
  hotLeaguesRank: new Map(),
};

/**
 * Haft time statuses
 * @type {string[]}
 */
const HAFT_TIME = ["half-time", "half time", "halftime", "ht"];

/**
 * Live match statuses
 * @type {string[]}
 */
const LIVE_STATUS = [
  // Tạm dừng / sự cố
  // "delay",
  // "interrupt",
  // "cut in half",
  // Hiệp 1
  "first half",
  "firsthalf",
  "first-half",
  "fh",
  // Nghỉ giữa hiệp
  "half-time",
  "half time",
  "halftime",
  "ht",
  // Hiệp 2
  "second half",
  "secondhalf",
  "second-half",
  "sh",
  // Hiệp phụ
  "extra time",
  "extratime",
  "extra time",
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  // Luân lưu
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
];
function renderHomeMatchCard_VB2(match) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
  });
  const kickoffDate = new Date(match.kickoff).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
  });
  const kickoff = new Date(match.kickoff).toLocaleTimeString("vn-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const home = match.teams?.home || {};
  const score = match.score || {};
  const away = match.teams?.away || {};
  const league = match.league || {};
  // const formattedTime = formatMatchTime_VB(kickoff);
  const isHot = appState.hotLeaguesRank.has(match.league.id);
  const isLive = LIVE_STATUS.includes(match.status.toLowerCase());
  const isToday = today === kickoffDate;

  return `
                <div class="xitem xitem-big ${isHot ? "hot-game" : ""}" >
      <a href="/streams/${match?.match_id}" class="match-link"></a>
      ${
        isLive
          ? `<div class="stick stick-live">
            <i class="dot"></i>Live
          </div>`
          : ""
      }
       
      <div class="xitem-header">
        <div class="xleague">
          <img
            width="20"
            height="20"
            src="${league.logo}"
            alt="${league.logo}"
             onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
          />
          <p class="xleague-name">${league.name}</p>
        </div>
      </div>
      <div class="xitem-main">
        <div class="team team-home" style="">
          <div class="team-logo">
            <img
              src="${home.logo}"
              alt="${home.logo}"
              class="team-logo-img"
              loading="lazy"
            onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
            />
          </div>
          <div class="xname">
            <h3 class="team-name">${home.name}</h3>
            <div class="xcards"></div>
          </div>
        </div>
        <div class="xinfo">
          <div class="time-loaded">
           <span class="match-status live"> ${
             isLive
               ? HAFT_TIME.includes(match.status.toLowerCase())
                 ? "HT"
                 : match.currentMinutes != null && match.currentMinutes !== ""
                   ? `${match.currentMinutes}'`
                   : "Live"
               : ""
           }</span>
          </div>
          <div class="result">${
            isLive
              ? ` <div>${score.fulltime.home}</div>
            <div class="xspace">-</div>
            <div>${score.fulltime.away}</div>`
              : "VS"
          }
          </div>
          <div class="detail"><b>${kickoff}</b></div>
          ${
            isToday
              ? ""
              : `<div class="detail">
                <b>${kickoffDate}</b>
              </div>`
          }
        </div>
        <div class="team team-away">
          <div class="team-logo">
            <img
              src="${away.logo}"
            onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
              alt="${away.logo}"
              class="team-logo-img"
              loading="lazy"
            />
          </div>
          <div class="xname">
            <h3 class="team-name">${away.name}</h3>
            <div class="xcards"></div>
          </div>
        </div>
      </div>
      <div class="xitem-bottom">
        ${buildCommentatorDropdown_VB2(match)}
        <div class="xitem-buttons">
          <div class="ibs-live">
            <a href="/streams/${match.match_id}" class="btn btn-sm vebo2-btn-bet-hover">Xem ngay</a>
          </div>
          <div class="ibs-bet">
            <a href="${window.DV2_LINK_BET}" target="_blank" rel="nofollow" class="btn btn-sm btn-betnow vebo2-btn-bet">Đặt cược</a>
          </div>
        </div>
      </div>
    </div>
            `;
}
const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-first",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
});

function getMatchListAdBlocks_VB2() {
  return window.DV2ListAds.getBlocks(window.DV2_SOCOLIVE_MATCH_LIST_ADS);
}

function buildMatchListAdInsertions_VB2(adBlocks, totalItems) {
  return window.DV2ListAds.buildInsertions(adBlocks, totalItems, {
    breakpoint: window.DV2_SOCOLIVE_MATCH_LIST_ADS_MOBILE_BREAKPOINT,
    repeatCycle: window.DV2_SOCOLIVE_MATCH_LIST_ADS_REPEAT,
  });
}

function buildMatchListAdMarkup_VB2(adBlock) {
  return window.DV2ListAds.buildMarkup(adBlock, {
    wrapperTag: "div",
    wrapperClass: "dv2-vb2-match-list-ad",
  });
}

function refreshMatchListReviveAds_VB2($container) {
  window.DV2ListAds.refreshReviveAds($container);
}

function renderHomeMatches_VB2(matches, filter = "all") {
  const now = new Date();

  const filtered = matches
    .filter((m) => {
      const kickoff = new Date(m.kickoff);

      if (filter === "live")
        return LIVE_STATUS.includes(m.status.toLowerCase());
      if (filter === "today") {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const endDay = new Date(now);
        endDay.setHours(23, 59, 59, 999);
        return (
          (m.status !== "Finished" && kickoff > now && kickoff <= endDay) ||
          LIVE_STATUS.includes(m.status.toLowerCase())
        );
      }
      if (filter === "tmr") {
        return kickoff.getDate() === now.getDate() + 1;
      }
      return (
        LIVE_STATUS.includes(m.status.toLowerCase()) ||
        kickoff.getTime() > now.getTime()
      );
    })
    .sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
    );
  const sortedMatches = sortedMatchesFunction(filtered);
  console.log("sortedMatches", sortedMatches);

  const $c = $(".dv2-tam-diem-vb2.dv2-calendar-matchs .dv2-grid");
  $c.empty();
  if (!sortedMatches.length) {
    const adInsertions = buildMatchListAdInsertions_VB2(
      getMatchListAdBlocks_VB2(),
      0,
    );
    let emptyHtml = `<div class="dv2-empty-state">Không có trận đấu</div>`;
    if (adInsertions.has(0)) {
      emptyHtml += buildMatchListAdMarkup_VB2(adInsertions.get(0));
    }
    $c.html(emptyHtml);
    refreshMatchListReviveAds_VB2($c);
    return;
  }

  const adInsertions = buildMatchListAdInsertions_VB2(
    getMatchListAdBlocks_VB2(),
    sortedMatches.length,
  );

  sortedMatches.forEach((match, index) => {
    $c.append(renderHomeMatchCard_VB2(match));

    const matchPosition = index + 1;
    if (adInsertions.has(matchPosition)) {
      const adMarkup = buildMatchListAdMarkup_VB2(adInsertions.get(matchPosition));
      if (adMarkup) {
        $c.append(adMarkup);
      }
    }
  });

  bindVb2BlvDropdownEvents();
  refreshMatchListReviveAds_VB2($c);
}

function loadHomeMatchesData_VB2() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const payload = {
    fromDate: yesterday.toISOString().split("T")[0],
    toDate: tomorrow.toISOString().split("T")[0],
  };
  $.ajax({
    url: "https://vsc-apidev.helizones.com/api/data/lives/range-date",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: (res) => {
      if (res && res.matches_by_date) {
        const all = [];
        Object.keys(res.matches_by_date).forEach((d) =>
          all.push(...res.matches_by_date[d]),
        );
        //remove những trận đã kết thúc (của ngày hôm qua)
        const isLiveAndTodayMatches = all.filter(
          (m) => m.status !== "Finished",
        );
        renderHomeMatches_VB2(isLiveAndTodayMatches);
        setupFilterButtons_VB2(isLiveAndTodayMatches);
      } else
        $(".dv2-tam-diem-vb2.dv2-calendar-matchs .dv2-grid").html(
          '<div class="dv2-empty-state">Không có dữ liệu</div>',
        );
    },
    error: () =>
      $(".dv2-tam-diem-vb2.dv2-calendar-matchs .dv2-grid").html(
        '<div class="dv2-empty-state">Lỗi tải dữ liệu</div>',
      ),
  });
  DV2HotLeagues.load({
    ajax: $.ajax,
    setHotLeaguesRank: (rankMap) => {
      appState.hotLeaguesRank = rankMap;
    },
  });
}

// filter theo trạng thái
function setupFilterButtons_VB2(matches) {
  $(".dv2-tam-diem-vb2.dv2-calendar-matchs .dv2-filter-btn")
    .off("click")
    .on("click", function () {
      $(".dv2-tam-diem-vb2.dv2-calendar-matchs .dv2-filter-btn").removeClass(
        "active",
      );
      $(this).addClass("active");
      renderHomeMatches_VB2(matches, $(this).data("filter"));
    });
}
// function groupMatchesByLeague_VB2(matches) {
//   const grouped = {};
//   matches.forEach((m) => {
//     const name = m.league?.name || "Giải đấu khác";
//     if (!grouped[name]) grouped[name] = [];
//     grouped[name].push(m);
//   });
//   return grouped;
// }

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* detail.js */
(function(window, $, jQuery, Hls, Swiper) {
// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

const POSTER_URL =
  "https://img.freepik.com/premium-photo/close-up-soccer-player-who-kicks-ball_207634-4089.jpg";
const BASE_API_URL = "https://vsc-apidev.helizones.com/api/data/";

const MATCH_STATUS = [
  // Trước trận
  "not started",
  "to be determined",
  // Hoãn / huỷ / sự cố
  // "delay",
  // "interrupt",
  // "cut in half",
  // "postponed",
  // "suspended",
  // "abandoned",
  // "cancel",
  // "abnormal(suggest hiding)",
  // Hiệp 1
  "first half",
  "firsthalf",
  "first-half",
  "fh",
  // Nghỉ giữa hiệp
  "half-time",
  "half time",
  "halftime",
  "ht",
  // Hiệp 2
  "second half",
  "secondhalf",
  "second-half",
  "sh",
  // Hiệp phụ
  "extra time",
  "extratime",
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  // Luân lưu
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
  // Kết thúc
  "finished",
  "ft",
  "end",
  "walkover"
];

const LIVE_STATUS = [
  // Tạm dừng / sự cố
  //  "delay",
  // "interrupt",
  // "cut in half",
  // Hiệp 1
  "first half",
  "firsthalf",
  "first-half",
  "fh",
  // Nghỉ giữa hiệp
  "half-time",
  "half time",
  "halftime",
  "ht",
  // Hiệp 2
  "second half",
  "secondhalf",
  "second-half",
  "sh",
  // Hiệp phụ
  "extra time",
  "extratime",
  "extra time",
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  // Luân lưu
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
];

// Global variables for retry logic
let retryTimeout = null;
let retryCount = 0;
let maxRetries = 3;
let retryInterval = 5000; // 5 seconds between retries
let maxRetryTime = 15000; // 15 seconds max retry time
let currentMatchDataCK2 = null;
let currentActiveLink_CK2 = null;
let detailScorePoll_CK2 = null;
let currentHls_CK2 = null;
let ck2PlaybackGeneration = 0;
let ck2ManifestTimeout = null;
let ck2NativeTimeout = null;

function applyPosterForActiveLink_CK2() {
  const video = document.getElementById("liveVideo");
  if (!video) return;
  DV2StreamKickoff.applyPosterForVideo(video, currentActiveLink_CK2, POSTER_URL);
}

function startDetailScorePoll_CK2(match) {
  if (!match) return;
  if (!detailScorePoll_CK2) {
    detailScorePoll_CK2 = DV2MatchScorePoll.create({
      container: ".dv2-layout-ck2",
    });
  }
  detailScorePoll_CK2.sync(match);
  detailScorePoll_CK2.start();
}

function getStreamChrome_CK2() {
  return window.DV2_StreamChrome;
}

function getStreamVideoWrapper_CK2() {
  return $(".dv2-layout-ck2 .dv2-video-wrapper").first();
}

function initStreamPlayerUi_CK2($video) {
  const $wrapper = getStreamVideoWrapper_CK2();
  const chrome = getStreamChrome_CK2();
  if (!$wrapper.length || !chrome) return;
  chrome.initPlayerUi($wrapper, $video ? $($video) : $wrapper.find("video").first());
}

function onHlsStreamReady_CK2() {
  const chrome = getStreamChrome_CK2();
  const $wrapper = getStreamVideoWrapper_CK2();
  if (chrome && $wrapper.length) {
    if (currentMatchDataCK2) {
      chrome.rememberOddsMatchData?.($wrapper, currentMatchDataCK2);
    }
    chrome.onHlsReady($wrapper);
  }
}

function initStreamOddsPanel_CK2(matchData) {
  const chrome = getStreamChrome_CK2();
  const $wrapper = getStreamVideoWrapper_CK2();
  if (!chrome || !$wrapper.length || !matchData) return;
  chrome.rememberOddsMatchData?.($wrapper, matchData);
  chrome.initOddsPanel?.($wrapper, matchData);
}

function clearStreamChrome_CK2() {
  const chrome = getStreamChrome_CK2();
  const $wrapper = getStreamVideoWrapper_CK2();
  if (chrome && $wrapper.length) {
    chrome.clearFullChrome($wrapper);
  }
}

const CK2_STREAM_LOADING_PLAYING_MS = 12000;

function showStreamLoading_CK2($videoContainer, message = "Đang tải luồng phát...") {
  if (!$videoContainer?.length) return $();
  hideStreamLoading_CK2($videoContainer);
  const safeMessage = String(message || "Đang tải luồng phát...")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const $overlay = $(`
    <div class="dv2-stream-loading" role="status" aria-live="polite" aria-busy="true">
      <div class="dv2-stream-loading__panel">
        <div class="dv2-stream-loading__spinner" aria-hidden="true"></div>
        <p class="dv2-stream-loading__text">${safeMessage}</p>
      </div>
    </div>
  `);
  $videoContainer.append($overlay);
  return $overlay;
}

function hideStreamLoading_CK2($videoContainer) {
  ($videoContainer?.length ? $videoContainer : getStreamVideoContainer_CK2())
    .find(".dv2-stream-loading")
    .remove();
}

function bindStreamLoadingUntilPlaying_CK2($videoContainer, video, onReady) {
  if (!$videoContainer?.length || !video) {
    onReady?.();
    return;
  }

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    video.removeEventListener("playing", onPlaying);
    video.removeEventListener("canplay", onCanPlay);
    clearTimeout(fallbackTimer);
    hideStreamLoading_CK2($videoContainer);
    onReady?.();
  };

  const onPlaying = () => finish();
  const onCanPlay = () => {
    if (!video.paused) finish();
  };

  video.addEventListener("playing", onPlaying);
  video.addEventListener("canplay", onCanPlay);

  const fallbackTimer = setTimeout(finish, CK2_STREAM_LOADING_PLAYING_MS);
}

function startLiveStream_CK2(streamUrl, options = {}) {
  initHLSPlayer(streamUrl, options);
}

// Khởi tạo HLS player với options
function clearCk2PlaybackTimers() {
  if (ck2ManifestTimeout) {
    clearTimeout(ck2ManifestTimeout);
    ck2ManifestTimeout = null;
  }
  if (ck2NativeTimeout) {
    clearTimeout(ck2NativeTimeout);
    ck2NativeTimeout = null;
  }
}

function destroyCurrentHls_CK2() {
  if (currentHls_CK2) {
    try {
      currentHls_CK2.destroy();
    } catch (e) {}
    currentHls_CK2 = null;
  }
}

function initHLSPlayer(videoSrc, options = {}) {
  const { enableRetry = false, matchData = null } = options;
  currentMatchDataCK2 = matchData || currentMatchDataCK2;

  ck2PlaybackGeneration += 1;
  const playbackGen = ck2PlaybackGeneration;
  clearCk2PlaybackTimers();
  destroyCurrentHls_CK2();

  const $videoContainer = getStreamVideoContainer_CK2();
  clearMatchOverlays_CK2($videoContainer);
  showStreamLoading_CK2($videoContainer, "Đang tải luồng phát...");

  const video = document.getElementById("liveVideo");

  video.autoplay = true;
  video.muted = true;
  initStreamPlayerUi_CK2(video);

  console.log(
    `[VSC LIVE] Initializing HLS player ${
      enableRetry ? "with retry" : "without retry"
    }`
  );

  if (enableRetry && matchData) {
    retryCount = 0;
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
    loadVideoCore(videoSrc, matchData, true, playbackGen);
  } else {
    loadVideoCore(videoSrc, null, false, playbackGen);
  }
}

$(document).ready(function () {
  if ($(".dv2-layout-ck2 #stream-player").length > 0) {
    loadStreamData();
  }
});

// Lấy match ID từ URL path dạng /streams/matchId
function getMatchId_CK2() {
  const params = new URLSearchParams(window.location.search);
  let matchId = params.get("match");
  if (!matchId) {
    if (typeof DV2_MATCH_ID !== "undefined" && DV2_MATCH_ID) {
      matchId = DV2_MATCH_ID;
    } else {
      matchId = "2y8m4zh54p4zql0";
    }
  }

  return matchId;
}

// Load thông tin livestream từ API
function loadStreamData() {
  const matchId = getMatchId_CK2();
  const $videoContainer = getStreamVideoContainer_CK2();

  console.log("[VSC LIVE] Loading livestream detail for ID:", matchId);

  // Tạo video element với poster trước
  const video = document.createElement("video");
  video.id = "liveVideo";
  video.controls = false; // Tạm thời ẩn controls khi loading
  video.autoplay = false; // Tạm thời tắt autoplay khi loading
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "true");
  video.poster = DV2StreamKickoff.resolvePosterUrl(currentActiveLink_CK2, POSTER_URL);
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.objectFit = "contain";

  // Clear container và thêm video element
  const videoContainer = document.getElementById("stream-player");
  videoContainer.innerHTML = "";
  videoContainer.appendChild(video);
  initStreamPlayerUi_CK2(video);

  const loadMatchData = () => {
    showStreamLoading_CK2($videoContainer, "Đang tải thông tin trận đấu...");

    // call api to get livestream data
    $.ajax({
    url: `${BASE_API_URL}lives/${matchId}`,
    method: "GET",
    success: function (res) {
      console.log("[VSC LIVE] API response:", res);

      const data = res?.data;
      if (!data) {
        return;
      }

      startDetailScorePoll_CK2(data);

      hideStreamLoading_CK2($videoContainer);

      initStreamOddsPanel_CK2(data);

      const linkState = setupStreamLinks_CK2(data);
      renderStreamLinksAdsBanner_CK2();
      applyPosterForActiveLink_CK2();

      // kiểm tra thời gian diễn ra trận đấu có lớn hơn 15 phút không, nếu lớn hơn 15 phút thì hiển thị countdown
      const kickoffTime = new Date(data?.matchInfo?.kickoff);
      const shouldShowCountdown =
        !Number.isNaN(kickoffTime.getTime()) &&
        (kickoffTime.getTime() - Date.now()) > 15 * 60 * 1000;

      if (shouldShowCountdown) {
        const showCountdown = () => {
          clearStreamChrome_CK2();
          renderMatchInfoCard($videoContainer, data, "countdown");
        };

        if (window.DV2StreamTvc?.playBeforeStream) {
          window.DV2StreamTvc.playBeforeStream($videoContainer, showCountdown);
        } else {
          showCountdown();
        }
        return;
      }

      // kiểm tra trạng thái trận đấu có kết thúc không, nếu kết thúc thì hiển thị kết quả 
      if (data?.matchInfo?.status?.toLowerCase() === "finished") {
        clearStreamChrome_CK2();
        renderMatchInfoCard($videoContainer, data, "result");
        return;
      }

      if (linkState?.activeLink?.url) {
        const streamUrl = linkState.activeLink.url;
        const isLiveMatch = LIVE_STATUS.includes(
          data?.matchInfo?.status?.toLowerCase()
        );

        const startStream = () => {
          if (isLiveMatch) {
            initHLSPlayer(streamUrl, { enableRetry: true, matchData: data });
          } else {
            initHLSPlayer(streamUrl, { enableRetry: false });
          }
        };

        if (window.DV2StreamTvc?.playBeforeStream) {
          window.DV2StreamTvc.playBeforeStream($videoContainer, startStream);
        } else {
          startStream();
        }
      }

    },
    error: function (xhr, status, error) {
      console.error("[VSC LIVE] API error:", error);
      hideStreamLoading_CK2($videoContainer);
    },
  });
  };

  loadMatchData();
}

// Load video core logic (shared between retry and non-retry modes)
function loadVideoCore(videoSrc, matchData, enableRetry, playbackGen) {
  const isStalePlayback = () => playbackGen !== ck2PlaybackGeneration;

  console.log(
    `[VSC LIVE] ${enableRetry ? "Retrying" : "Loading"} video (attempt ${
      enableRetry ? retryCount + 1 : 1
    }${enableRetry ? `/${maxRetries}` : ""})`
  );

  const $videoContainer = getStreamVideoContainer_CK2();
  if (isStalePlayback()) return;

  clearMatchOverlays_CK2($videoContainer);
  showStreamLoading_CK2(
    $videoContainer,
    enableRetry && retryCount > 0
      ? `Đang thử lại luồng phát... (${retryCount}/${maxRetries})`
      : "Đang tải luồng phát..."
  );

  const video = document.getElementById("liveVideo");
  const fallbackMatchData = matchData || currentMatchDataCK2;
  let hasFallback = false;

  const showFallback = () => {
    if (isStalePlayback() || hasFallback || !fallbackMatchData) return;
    hasFallback = true;
    clearCk2PlaybackTimers();
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
    destroyCurrentHls_CK2();
    hideStreamLoading_CK2($videoContainer);
    showLiveMatchError(fallbackMatchData);
  };

  try {
    if (Hls.isSupported()) {
      ck2ManifestTimeout = setTimeout(() => {
        if (isStalePlayback()) return;
        console.error("[VSC LIVE] Manifest load timeout");
        showFallback();
      }, maxRetryTime);

      const hlsInstance = new Hls({
        maxBufferLength: 10,
        liveSyncDuration: 3,
        enableWorker: true,
        xhrSetup: function (xhr, url) {
            xhr.withCredentials = false;
            xhr.referrerPolicy = "no-referrer-when-downgrade";
        },
      });
      currentHls_CK2 = hlsInstance;

      hlsInstance.loadSource(videoSrc);
      hlsInstance.attachMedia(video);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
        if (isStalePlayback()) return;
        console.log("[VSC LIVE] HLS manifest parsed successfully");
        clearCk2PlaybackTimers();
        if (retryTimeout) {
          clearTimeout(retryTimeout);
          retryTimeout = null;
        }
        bindStreamLoadingUntilPlaying_CK2($videoContainer, video, () => {
          if (isStalePlayback()) return;
          onHlsStreamReady_CK2();
        });
        video.muted = true;
        video.play().catch((err) => {
          console.warn("[VSC LIVE] Autoplay blocked:", err);
        });
      });

      hlsInstance.on(Hls.Events.ERROR, function (event, data) {
        if (isStalePlayback()) return;
        console.error("[VSC LIVE] HLS error:", data);
        if (data?.fatal && !enableRetry) {
          clearCk2PlaybackTimers();
          showFallback();
          return;
        }

        if (data.fatal && enableRetry) {
          retryCount++;

          if (retryCount < maxRetries) {
            console.log(
              `[VSC LIVE] Retrying in ${
                retryInterval / 1000
              } seconds... (${retryCount}/${maxRetries})`
            );

            retryTimeout = setTimeout(() => {
              if (isStalePlayback()) return;
              destroyCurrentHls_CK2();
              loadVideoCore(videoSrc, matchData, enableRetry, playbackGen);
            }, retryInterval);
          } else {
            console.error(
              "[VSC LIVE] Max retries reached, showing live match info"
            );
            clearCk2PlaybackTimers();
            if (retryTimeout) {
              clearTimeout(retryTimeout);
              retryTimeout = null;
            }
            destroyCurrentHls_CK2();
            showFallback();
          }
        }
      });
      video.addEventListener(
        "error",
        function () {
          if (isStalePlayback()) return;
          clearCk2PlaybackTimers();
          showFallback();
        },
        { once: true }
      );
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      ck2NativeTimeout = setTimeout(() => {
        if (isStalePlayback()) return;
        console.error("[VSC LIVE] Native HLS load timeout");
        if (!enableRetry) {
          showFallback();
        }
      }, maxRetryTime);

      video.playsInline = true;
      video.setAttribute("playsinline", "true");
      video.src = videoSrc;
      var playedNative = false;
      function tryPlaySafari() {
        if (isStalePlayback() || playedNative) return;
        playedNative = true;
        clearCk2PlaybackTimers();
        if (retryTimeout) {
          clearTimeout(retryTimeout);
          retryTimeout = null;
        }
        bindStreamLoadingUntilPlaying_CK2($videoContainer, video, () => {
          if (isStalePlayback()) return;
          onHlsStreamReady_CK2();
        });
        video.muted = true;
        video.play().catch((err) => {
          console.warn("[VSC LIVE] Autoplay blocked on Safari:", err);
        });
      }
      video.addEventListener("canplay", tryPlaySafari, { once: true });
      video.addEventListener("loadedmetadata", function () {
        setTimeout(function () {
          if (!playedNative && video.readyState >= 1) tryPlaySafari();
        }, 400);
      }, { once: true });
      video.addEventListener(
        "error",
        function () {
          if (isStalePlayback()) return;
          if (!enableRetry) {
            clearCk2PlaybackTimers();
            showFallback();
          }
        },
        { once: true }
      );

      if (enableRetry) {
        video.addEventListener("error", function () {
          if (isStalePlayback()) return;
          console.error("[VSC LIVE] Video load error on Safari");
          retryCount++;

          if (retryCount < maxRetries) {
            retryTimeout = setTimeout(() => {
              if (isStalePlayback()) return;
              loadVideoCore(videoSrc, matchData, enableRetry, playbackGen);
            }, retryInterval);
          } else {
            clearCk2PlaybackTimers();
            showFallback();
          }
        });
      }
    } else {
      console.error("[VSC LIVE] HLS not supported and not Safari");
      showFallback();
    }
  } catch (error) {
    console.error("[VSC LIVE] Exception during video load:", error);
    if (enableRetry) {
      retryCount++;

      if (retryCount < maxRetries) {
        retryTimeout = setTimeout(() => {
          if (isStalePlayback()) return;
          loadVideoCore(videoSrc, matchData, enableRetry, playbackGen);
        }, retryInterval);
      } else {
        clearCk2PlaybackTimers();
        showFallback();
      }
    } else {
      showFallback();
    }
  }
}

function getStreamVideoContainer_CK2() {
  return getStreamVideoWrapper_CK2();
}

function clearMatchOverlays_CK2($videoContainer) {
  const $container = $videoContainer?.length
    ? $videoContainer
    : getStreamVideoContainer_CK2();
  if (!$container.length) return;
  $container.find("#simulate-the-match-content-center").remove();
}

// Hiển thị live match info khi load video thất bại
function showLiveMatchError(matchData) {
  if (!matchData) return;
  clearStreamChrome_CK2();
  const $streamPlayer = $(".dv2-layout-ck2 #stream-player");
  const $videoContainer = getStreamVideoContainer_CK2();
  $streamPlayer.empty();

  // Tạo video element với poster trước
  const video = document.createElement("video");
  video.id = "liveVideo";
  video.controls = false;
  video.autoplay = false;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "true");
  video.poster = DV2StreamKickoff.resolvePosterUrl(currentActiveLink_CK2, POSTER_URL);
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.objectFit = "contain";

  const videoContainer = document.getElementById("stream-player");
  videoContainer.innerHTML = "";
  videoContainer.appendChild(video);
  initStreamPlayerUi_CK2(video);

  // Hiển thị match info với status "Live"
  renderMatchInfoCard($videoContainer, matchData, "live-error");
}

// Render match info card (countdown, result, hoặc live-error)
function renderMatchInfoCard($container, data, type = "countdown") {
  const { teams, league, matchInfo, score } = data;
  const homeTeam = teams?.home?.name || "Home Team";
  const awayTeam = teams?.away?.name || "Away Team";
  const leagueName = league?.name || "";
  const matchStatus = matchInfo?.status || "Not Started";
  const pen = score?.pen;
  const hasPen =
    (type === "result" || type === "live-error") &&
    pen &&
    (pen.home != null || pen.away != null);
  const penContent = hasPen
    ? `<div class="dv2-match-pen">
        <span class="dv2-match-pen-value"><span data-dv2-score-pen-home>${pen.home}</span> - <span data-dv2-score-pen-away>${pen.away}</span></span>
        <span class="dv2-match-pen-label">(Penalty)</span>
      </div>`
    : "";

  let timeBoxContent = "";

  if (type === "result") {
    // Hiển thị tỷ số cho trận đã kết thúc
    const homeScore = score?.fulltime?.home || 0;
    const awayScore = score?.fulltime?.away || 0;
    const homeLogo = teams?.home?.logo || "";
    const awayLogo = teams?.away?.logo || "";
    timeBoxContent = `
      <li class="flex  w-12 h-auto items-center justify-center" style="flex-direction: row;">
        ${
          homeLogo
            ? `<img src="${homeLogo}" alt="${homeTeam}" style="width:50px;height:50px;border-radius:50%;" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">`
            : ""
        }
        <span id="hEndScore" data-dv2-score-home>${homeScore}</span>
      </li>
      <li class="vs">:</li>
      <li class="flex w-12 h-auto items-center justify-center" style="flex-direction: row;">
        <span id="gEndScore" data-dv2-score-away>${awayScore}</span>
        ${
          awayLogo
            ? `<img src="${awayLogo}" alt="${awayTeam}" style="width:50px;height:50px;border-radius:50%;" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">`
            : ""
        }
      </li>
    `;
  } else if (type === "live-error") {
    // Hiển thị kết quả hiện tại cho live match bị lỗi
    const homeScore = score?.fulltime?.home || 0;
    const awayScore = score?.fulltime?.away || 0;
    const homeLogo = teams?.home?.logo || "";
    const awayLogo = teams?.away?.logo || "";
    timeBoxContent = `
      <li class="flex w-12 h-auto items-center justify-center" style="flex-direction: row;">
        ${
          homeLogo
            ? `<img src="${homeLogo}" alt="${homeTeam}" style="width:50px;height:50px;border-radius:50%;" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">`
            : ""
        }
        <span id="hEndScore" data-dv2-score-home>${homeScore}</span>
      </li>
      <li class="vs">:</li>
      <li class="flex w-12 h-auto items-center justify-center" style="flex-direction: row;">
        <span id="gEndScore" data-dv2-score-away>${awayScore}</span>
        ${
          awayLogo
            ? `<img src="${awayLogo}" alt="${awayTeam}" style="width:50px;height:50px;border-radius:50%;" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">`
            : ""
        }
      </li>
    `;
  } else {
    const kickoff = matchInfo?.kickoff;
    timeBoxContent = `<li colspan="3">${DV2StreamKickoff.renderTimeDisplay(kickoff)}</li>`;
  }

  const matchCardHtml = `
    <div id="simulate-the-match-content-center" class="flex flex-col justify-center items-center gap-4 p-4">
      <div class="dataBox_pop">
        <ul class="info">
          <li style="display:flex; flex-direction:column; align-items:center;">
            <div class="match-info__lname">${leagueName}</div>
            <h4>${matchStatus}</h4>
            <ul class="timeBox">
              ${timeBoxContent}
            </ul>
            ${penContent}
            <div class="teams flex gap-4 mt-2">
              <div class="homeTeam" title="${homeTeam}">${homeTeam}</div>
              <div class="vs">VS</div>
              <div class="guestTeam" title="${awayTeam}">${awayTeam}</div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  `;

  $container.append(matchCardHtml);

  if (type === "countdown" && data?.matchInfo?.kickoff) {
    DV2StreamKickoff.startCountdown(data.matchInfo.kickoff);
  }
}

function shouldShowPreMatchOverlay_CK2(matchData) {
  const kickoffTime = new Date(matchData?.matchInfo?.kickoff);
  return (
    !Number.isNaN(kickoffTime.getTime()) &&
    kickoffTime.getTime() - Date.now() > 15 * 60 * 1000
  );
}

// ========================================
// Ads Banner for detail page (stream links row)
// ========================================
function renderStreamLinksAdsBanner_CK2() {
    const $container = $(".dv2-layout-ck2.dv2-container .dv2-stream-list .dv2-bet-links");
    if (!$container.length) return;

    const html = window.DV2_SOCOLIVE_STREAM_BET_BUTTONS_HTML;
    if (typeof html === "string" && html.trim()) {
        $container.html(html);
    }

    if (!$container.children().length) return;
    window.DV2_StreamChrome?.refreshReviveAds?.($container);
}

function setupStreamLinks_CK2(data) {
  const links = DV2StreamLinks.sortForDetail(data?.livestream?.links);
  if (!links.length) return null;

  currentMatchDataCK2 = data;
  const resolved = DV2StreamLinks.resolveActiveLink(links);
  currentActiveLink_CK2 = resolved.activeLink;
  renderStreamLinks(links, resolved.activeIndex);
  applyPosterForActiveLink_CK2();
  return resolved;
}

// Render stream links
function renderStreamLinks(links, activeIndex = 0) {
  const $wrapLink = $(".dv2-stream-links-ck2");

  if (!links || links.length === 0) return;

  // Clear existing buttons
  $wrapLink.empty();

  links.forEach((link, index) => {
    const blvName = DV2StreamLinks.getBlvName(link, index);
    const liveId = link.liveId != null ? String(link.liveId) : "";
    const $button = $(`
      <button type="button"
        class="match_link--button py-1 px-3 font-semibold text-sm capitalize !text-[11px] lg:!text-sm border border-neutral-2 bg-btnlink text-neutral-4 flex items-center gap-1 flex-row-reverse !px-2 lg:!px-3 transition-all duration-150 bg-primary-1 text-white border-primary-1 hover:bg-primary-1 hover:text-white hover:border-primary-1 rounded-3xl 
        ${index === activeIndex ? "active" : ""}"
        data-link-index="${index}"
        data-live-id="${liveId}"
        data-stream-url="${link.url}">
        <span class="inline-block">${blvName}</span>
      </button>
    `);

    $button.on("click", function () {
      const linkIndex = Number($(this).attr("data-link-index"));
      const link = links[linkIndex];
      if (DV2StreamLinks.navigateForLink(link)) {
        return;
      }
      currentActiveLink_CK2 = link;
      applyPosterForActiveLink_CK2();
      const liveId = $(this).attr("data-live-id");
      if (liveId) {
        DV2StreamLinks.updateLiveIdInUrl(liveId);
      }
      $wrapLink.find(".match_link--button").removeClass("active");
      $(this).addClass("active");

      const $videoContainer = getStreamVideoContainer_CK2();
      const streamUrl = $(this).data("stream-url");

      if (currentMatchDataCK2) {
        initStreamOddsPanel_CK2(currentMatchDataCK2);
      }

      if (shouldShowPreMatchOverlay_CK2(currentMatchDataCK2) || !streamUrl) {
        clearStreamChrome_CK2();
        clearMatchOverlays_CK2($videoContainer);
        renderMatchInfoCard($videoContainer, currentMatchDataCK2, "countdown");
        return;
      }

      clearMatchOverlays_CK2($videoContainer);
      initHLSPlayer(streamUrl, { enableRetry: false, matchData: currentMatchDataCK2 });
    });

    $wrapLink.append($button);
  });
}

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* hightlight.js */
(function(window, $, jQuery, Hls, Swiper) {
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

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* home-match.js */
(function(window, $, jQuery, Hls, Swiper) {
$ = jQuery.noConflict();
const appState = {
  hotLeaguesRank: new Map(),
};
let featuredScorePoll = null;
/**
 * Live match statuses
 * @type {string[]}
 */
const LIVE_STATUS = [
  // Tạm dừng / sự cố
  // "delay",
  // "interrupt",
  // "cut in half",
  // Hiệp 1
  "first half",
  "firsthalf",
  "first-half",
  "fh",
  // Nghỉ giữa hiệp
  "half-time",
  "half time",
  "halftime",
  "ht",
  // Hiệp 2
  "second half",
  "secondhalf",
  "second-half",
  "sh",
  // Hiệp phụ
  "extra time",
  "extratime",
  "extra time",
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  // Luân lưu
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
];

const NHADAI_COMMENTATOR_ID = 99999999999999999;

function isNhaDaiLivestreamLink(link) {
  if (!link) return false;
  if (link.commentatorId === NHADAI_COMMENTATOR_ID) return true;
  const name = String(link.commentator || "").trim().toLowerCase();
  return name === "nhà đài" || name === "nha dai" || name === "blv nhà đài";
}

function sortLivestreamLinksPreferRealBlv(links) {
  if (!Array.isArray(links)) return [];
  links.sort((a, b) => {
    const aIsNhaDai = isNhaDaiLivestreamLink(a);
    const bIsNhaDai = isNhaDaiLivestreamLink(b);
    if (aIsNhaDai && !bIsNhaDai) return 1;
    if (!aIsNhaDai && bIsNhaDai) return -1;
    return 0;
  });
  return links;
}

function getPreferredLivestreamLink(match) {
  const links = match?.livestream?.links;
  if (!Array.isArray(links) || !links.length) return null;
  sortLivestreamLinksPreferRealBlv(links);
  return links[0] || null;
}

$(document).ready(() => {
  if ($(".dv2-ck2-home-featured-streams").length > 0) {
    // updateDateTime_VB();
    loadHomeMatchesData_CK2();
  }
});

const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-when-live-or-soon",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
  priorityCompetitionSoonMinutes: 10,
});

function getMatchIdFromMatch(match) {
  return DV2MatchScorePoll.getMatchId(match);
}

function syncFeaturedMatchSnapshot(match) {
  if (!featuredScorePoll) {
    featuredScorePoll = DV2MatchScorePoll.create({
      container: ".dv2-ck2-home-featured-streams",
    });
  }
  featuredScorePoll.sync(match);
}

function stopFeaturedMatchScorePolling() {
  featuredScorePoll?.stop();
}

function startFeaturedMatchScorePolling() {
  featuredScorePoll?.start();
}

function normalizeMatchStats_CK2(rawStats, defaults) {
  const result = { ...defaults };
  if (!rawStats || typeof rawStats !== "object") return result;

  for (const key of Object.keys(defaults)) {
    result[key] = {
      home: rawStats[key]?.home ?? defaults[key].home,
      away: rawStats[key]?.away ?? defaults[key].away,
    };
  }
  return result;
}

function renderHomeMatchCard_CK2(match) {
  console.log(match);
  const matchKickOff = match?.matchInfo?.kickoff ?? match?.kickoff;
  const kickoff = new Date(matchKickOff).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false,
  });
  console.log(kickoff);

  const home = match?.teams?.home || {};
  const score = match?.score || {};
  const away = match?.teams?.away || {};
  const league = match?.league || {};
  const defaultStats = {
    possession: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    corners: { home: 0, away: 0 },
    fouls: { home: 0, away: 0 },
  };
  const stats = normalizeMatchStats_CK2(match.stats, defaultStats);
  const sumOfCornors = stats.corners.home + stats.corners.away;
  const sumOfShots = stats.shotsOnTarget.home + stats.shotsOnTarget.away;

  const preferredBlv = getPreferredLivestreamLink(match);
  const matchId = getMatchIdFromMatch(match);
  const homeScore = score?.fulltime?.home ?? 0;
  const awayScore = score?.fulltime?.away ?? 0;
  const pen = score?.pen;
  const hasPen = pen && (pen.home != null || pen.away != null);
  return `
      <div class="flex flex-col xl:gap-4">
        <div class="w-full">
          <div class="pb-7 lg:pt-7 m-auto">
            <div class="relative">
              <a
               href="/streams/${matchId}" 
                class="absolute top-0 left-0 w-full h-full z-10"
              ></a>
              <div
                class="match-card-featured flex flex-col lg:flex-row gap-4 xl:gap-7 justify-center items-center"
              >
                <div
                  class="match-info-primary text-white flex-1 w-full px-2 lg:px-0"
                >
                  <div class="event-league text-center md:pb-4">
                    <div
                      class="flex justify-center items-center gap-2 mb-2 md:mb-4 text-text"
                    >
                        <img
                          onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                          width="20"
                          height="20"
                          src="${league.logo}"
                          alt="${league.logo}"
                        />
                        ${league.name}
                    </div>
                    <div
                      class="inline-flex gap-1.5 items-center font-semibold overflow-hidden hidden md:inline-flex rounded-3xl"
                      style="background-color: #4986f7"
                    >
                      <img
                        onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                        src=${preferredBlv?.avatar || ""}
                        alt=${preferredBlv?.commentator || ""}
                        class="w-8 h-8 rounded-full m-0.5"
                      /><span class="pr-3 py-1 text-sm md:text-base py-2 !pr-4">${
                        preferredBlv?.commentator || ""
                      }</span>
                       
                    </div>
                  </div>
                  <div
                    class="flex flex-row justify-between items-stretch gap-3 lg:gap-5 xl:gap-10 border-b border-gradient pb-4 mb-5"
                  >
                    <div
                      class="flex-1 items-center justify-start flex flex-col lg:flex-row-reverse gap-2 lg:gap-4 text-center"
                    >
                      <div
                        class="inline-flex justify-center items-center max-w-max p-2 lg:p-3 bg-[#5a5a5a] bg-opacity-25 rounded-full"
                      >
                        <img
                          onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                          class="w-10 h-10 md:w-16 md:h-16 object-cover rounded-full flex"
                          rel="nofollow"
                          src="${home.logo}"
                          alt="${home.logo}"
                        />
                      </div>
                      <h5
                        class="team-name text-base lg:text-2xl font-medium line-clamp-2 lg:text-right flex-1 min-h-10 lg:min-h-auto"
                      >
                        ${home.name}
                      </h5>
                    </div>
                    <div
                      class="text-2xl font-medium flex flex-col items-center justify-center gap-3"
                    >
                     ${
                       match?.currentMinute ?? match?.currentMinutes
                         ? `<span class="time text-minute font-normal text-sm lg:text-base capitalize" data-dv2-score-minute>
                           ${match?.currentMinute ?? match?.currentMinutes}'
                         </span>`
                         : ""
                     } <span
                        ><span class="" data-dv2-score-home>${homeScore}</span> -<!-- -->
                        <span class="" data-dv2-score-away>${awayScore}</span></span
                      >${
                        hasPen
                          ? `<span class="flex flex-col items-center leading-tight -mt-1">
                        <span class="text-base font-semibold text-white"><span data-dv2-score-pen-home>${pen.home}</span> - <span data-dv2-score-pen-away>${pen.away}</span></span>
                        <span class="text-xs font-normal text-white">(Penalty)</span>
                      </span>`
                          : ""
                      }<span class="time text-sm font-medium">${kickoff}</span>
                    </div>
                    <div
                      class="flex-1 items-center justify-start flex flex-col lg:flex-row gap-2 lg:gap-4 text-center"
                    >
                      <div
                        class="inline-flex justify-center items-center max-w-max p-2 lg:p-3 bg-[#5a5a5a] bg-opacity-25 rounded-full"
                      >
                        <img
                          onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                          class="w-10 h-10 md:w-16 md:h-16 object-cover rounded-full flex"
                          rel="nofollow"
                          src="${away.logo}"
                          alt="${away.logo}"
                        />
                      </div>
                      <h5
                        class="team-name text-base lg:text-2xl font-medium line-clamp-2 lg:text-left flex-1 min-h-10 lg:min-h-auto"
                      >
                        ${away.name}
                      </h5>
                    </div>
                  </div>
                  <div class="flex gap-1 justify-between md:justify-center">
                    <div
                      class="inline-flex gap-1.5 items-center font-semibold overflow-hidden md:hidden rounded-3xl"
                      style="background-color: #4986f7"
                    >
                      <img 
                        onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                        src="${preferredBlv?.avatar || ""}"
                        alt="${preferredBlv?.commentator || ""}" class="w-8 h-8
                        rounded-full m-0.5" /><span
                        class="pr-3 py-1 text-xs py-2 !pr-4 whitespace-nowrap text-ellipsis overflow-hidden"
                        >${preferredBlv?.commentator || ""}</span
                      >
                    </div>
                    <div
                      class="flex gap-1 shrink-0 justify-center z-10 relative"
                    >
                      <a class="cakhia-btn py-1 px-4 rounded-3xl font-semibold text-sm capitalize leading-5 bg-primary py-2 rounded-3xl cakhia-btn-hover"
                        href="/streams/${matchId}">Trực tiếp</a>
                      <a
                        href="${window.DV2_LINK_BET}"
                        target="_blank" rel="nofollow"
                        class="cakhia-btn-bet text-white py-1 px-3 rounded-3xl font-semibold text-sm capitalize text-sm leading-5 bg-primary-1 py-2 px-5 rounded-3xl"
                        >Đặt cược</a>
                    </div>
                  </div>
                </div>
                <div
                  class="match-stats text-neutral-4 text-sm flex-col gap-2 xl:flex"
                >
                  <div
                    class="o-row flex md:gap-4 xl:gap-7 items-center justify-between py-3 md:px-3 px-5 bg-stats rounded-2xl backdrop-blur-sm"
                  >
                    <div class="team team-home flex items-center gap-4">
                      <span class="w-8" id="home-possession">${stats?.possession?.home}%</span>
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5 flex justify-end"
                      >
                        <div
                          class="bg-neutral-3 h-1.5 rounded-full" id="home-possessionPercent"
                          style="width: ${stats?.possession?.home}%"
                        ></div>
                      </div>
                    </div>
                    <div class="title text-white capitalize text-xs xl:text-sm">
                      Kiểm soát bóng
                    </div>
                    <div
                      class="team team-away flex items-center gap-4 text-primary-1"
                    >
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5"
                      >
                        <div
                          class="h-1.5 rounded-full bg-primary-1" id="away-possessionPercent"
                          style="width: ${stats?.possession?.away}%"
                        ></div>
                      </div>
                      <span class="w-8 text-right" id="away-possession">${
                        stats?.possession?.away
                      }%</span>
                    </div>
                  </div>
                  <div
                    class="o-row flex md:gap-4 xl:gap-7 items-center justify-between py-3 md:px-3 px-5 bg-stats rounded-2xl backdrop-blur-sm"
                  >
                    <div class="team team-home flex items-center gap-4">
                      <span class="w-8" id="home-corners">${stats?.corners?.home}</span>
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5 flex justify-end"
                      >
                        <div
                          class="bg-neutral-3 h-1.5 rounded-full" id="home-cornersPercent"
                          style="width: ${
                            sumOfCornors !== 0
                              ? stats?.corners?.home / sumOfCornors
                              : 0
                          }"
                        ></div>
                      </div>
                    </div>
                    <div class="title text-white capitalize text-xs xl:text-sm">
                      Góc
                    </div>
                    <div
                      class="team team-away flex items-center gap-4 text-primary-1"
                    >
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5"
                      >
                        <div
                          class="h-1.5 rounded-full bg-primary-1"  id="away-cornersPercent"
                          style="width: ${
                            sumOfCornors !== 0
                              ? stats?.corners?.away / sumOfCornors
                              : 0
                          }"
                        ></div>
                      </div>
                      <span class="w-8 text-right" id="away-corners">${stats?.corners?.away}</span>
                    </div>
                  </div>
                  <div
                    class="o-row flex md:gap-4 xl:gap-7 items-center justify-between py-3 md:px-3 px-5 bg-stats rounded-2xl backdrop-blur-sm"
                  >
                    <div class="team team-home flex items-center gap-4">
                      <span class="w-8">0</span>
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5 flex justify-end"
                      >
                        <div
                          class="bg-neutral-3 h-1.5 rounded-full"
                          style="width: 0%"
                        ></div>
                      </div>
                    </div>
                    <div class="title text-white capitalize text-xs xl:text-sm">
                      Thẻ vàng
                    </div>
                    <div
                      class="team team-away flex items-center gap-4 text-primary-1"
                    >
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5"
                      >
                        <div
                          class="h-1.5 rounded-full bg-primary-1"
                          style="width: 0%"
                        ></div>
                      </div>
                      <span class="w-8 text-right">0</span>
                    </div>
                  </div>
                  <div
                    class="o-row flex md:gap-4 xl:gap-7 items-center justify-between py-3 md:px-3 px-5 bg-stats rounded-2xl backdrop-blur-sm"
                  >
                    <div class="team team-home flex items-center gap-4">
                      <span class="w-8">0</span>
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5 flex justify-end"
                      >
                        <div
                          class="bg-neutral-3 h-1.5 rounded-full"
                          style="width: 0%"
                        ></div>
                      </div>
                    </div>
                    <div class="title text-white capitalize text-xs xl:text-sm">
                      Thẻ đỏ
                    </div>
                    <div
                      class="team team-away flex items-center gap-4 text-primary-1"
                    >
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5"
                      >
                        <div
                          class="h-1.5 rounded-full bg-primary-1"
                          style="width: 0%"
                        ></div>
                      </div>
                      <span class="w-8 text-right">0</span>
                    </div>
                  </div>
                  <div
                    class="o-row flex md:gap-4 xl:gap-7 items-center justify-between py-3 md:px-3 px-5 bg-stats rounded-2xl backdrop-blur-sm"
                  >
                    <div class="team team-home flex items-center gap-4">
                      <span class="w-8" id="home-shots">${stats?.shotsOnTarget?.home}</span>
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5 flex justify-end"
                      >
                        <div
                          class="bg-neutral-3 h-1.5 rounded-full" id="home-shotsPercent"
                          style="width: ${
                            sumOfShots !== 0
                              ? stats?.shotsOnTarget?.home / sumOfShots
                              : 0
                          }"
                        ></div>
                      </div>
                    </div>
                    <div class="title text-white capitalize text-xs xl:text-sm">
                      Sút trúng đích
                    </div>
                    <div
                      class="team team-away flex items-center gap-4 text-primary-1"
                    >
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5"
                      >
                        <div
                          class="h-1.5 rounded-full bg-primary-1" id="away-shotsPercent"
                          style="width: ${
                            sumOfShots !== 0
                              ? stats?.shotsOnTarget?.away / sumOfShots
                              : 0
                          }"
                        ></div>
                      </div>
                      <span class="w-8 text-right" id="away-shots">${
                        stats?.shotsOnTarget?.away
                      }</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
            `;
}

function loadHomeMatchesData_CK2() {
  const $c = $(".dv2-ck2-home-featured-streams");
  $c.empty();
  stopFeaturedMatchScorePolling();
  featuredScorePoll?.destroy?.();
  featuredScorePoll = null;

  // Nếu có MATCH ID → call API lấy duy nhất 1 trận
  const MATCH_ID =
    typeof DV2_MATCH_ID !== "undefined" && DV2_MATCH_ID ? DV2_MATCH_ID : "";
  if (MATCH_ID !== "") {
    $.ajax({
      url: "https://vsc-apidev.helizones.com/api/data/lives/" + DV2_MATCH_ID,
      method: "GET",
      contentType: "application/json",
      success: (res) => {
        if (res && res.data) {
          try {
            const cards = renderHomeMatchCard_CK2(res.data);
            $c.append(cards);
            syncFeaturedMatchSnapshot(res.data);
            startFeaturedMatchScorePolling();
          } catch (error) {
            console.error("[CK2 home-match] Render error:", error);
            $c.html(
              '<div class="dv2-empty-state">Lỗi hiển thị dữ liệu trận đấu.</div>',
            );
          }
        } else {
          $c.html(
            '<div class="dv2-empty-state">Không có dữ liệu cho MATCH_ID.</div>',
          );
        }
      },
      error: () =>
        $c.html('<div class="dv2-empty-state">Lỗi tải dữ liệu MATCH_ID</div>'),
    });

    return; // DỪNG, KHÔNG chạy tiếp logic lấy list
  }

  // --- Không có MATCH_ID → lấy trận đầu tiên (cùng pipeline với suggested-stream.js) ---
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const payload = {
    fromDate: today.toISOString().split("T")[0],
    toDate: tomorrow.toISOString().split("T")[0],
  };

  function renderFirstFeaturedMatch(res) {
    if (res?.status !== "success" || !res?.matches_by_date) {
      $c.html('<div class="dv2-empty-state">Không có dữ liệu</div>');
      return;
    }

    let allMatches = [];
    Object.values(res.matches_by_date).forEach((dateMatches) => {
      allMatches = allMatches.concat(dateMatches);
    });

    allMatches = allMatches.filter(
      (match) => match?.status?.toLowerCase() !== "finished",
    );

    const sortMatches = sortedMatchesFunction(allMatches);

    if (!sortMatches.length) {
      $c.html(
        `<div class="dv2-empty-state">Hiện tại không có trận đấu nào đang diễn ra.</div>`,
      );
      return;
    }

    const match = sortMatches[0];
    const cards = renderHomeMatchCard_CK2(match);
    $c.append(cards);
    syncFeaturedMatchSnapshot(match);
    startFeaturedMatchScorePolling();
  }

  DV2HotLeagues.load({
    ajax: $.ajax,
    setHotLeaguesRank: (rankMap) => {
      appState.hotLeaguesRank = rankMap;
    },
  }).always(() => {
      $.ajax({
        url: "https://vsc-apidev.helizones.com/api/data/lives/range-date",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: renderFirstFeaturedMatch,
        error: () =>
          $c.html('<div class="dv2-empty-state">Lỗi tải dữ liệu</div>'),
      });
    });
}

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* list-match.js */
(function(window, $, jQuery, Hls, Swiper) {
$ = jQuery.noConflict();

$(document).ready(() => {
  if ($(".dv2-list-match").length > 0) {
    // updateDateTime_VB();
    loadHomeMatchesData_CK2();
  }
});
/**
 * Live match statuses
 * @type {string[]}
 */
const appState = {
  hotLeaguesRank: new Map(),
};
const LIVE_STATUS = [
  // Tạm dừng / sự cố
  // "delay",
  // "interrupt",
  // "cut in half",
  // Hiệp 1
  "first half",
  "firsthalf",
  "first-half",
  "fh",
  // Nghỉ giữa hiệp
  "half-time",
  "half time",
  "halftime",
  "ht",
  // Hiệp 2
  "second half",
  "secondhalf",
  "second-half",
  "sh",
  // Hiệp phụ
  "extra time",
  "extratime",
  "extra time",
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  // Luân lưu
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
];

const NHADAI_COMMENTATOR_ID = 99999999999999999;

function isNhaDaiLivestreamLink(link) {
  if (!link) return false;
  if (link.commentatorId === NHADAI_COMMENTATOR_ID) return true;
  const name = String(link.commentator || "").trim().toLowerCase();
  return name === "nhà đài" || name === "nha dai" || name === "blv nhà đài";
}

function sortLivestreamLinksPreferRealBlv(links) {
  if (!Array.isArray(links)) return [];
  links.sort((a, b) => {
    const aIsNhaDai = isNhaDaiLivestreamLink(a);
    const bIsNhaDai = isNhaDaiLivestreamLink(b);
    if (aIsNhaDai && !bIsNhaDai) return 1;
    if (!aIsNhaDai && bIsNhaDai) return -1;
    return 0;
  });
  return links;
}

function getPreferredLivestreamLink(match) {
  const links = match?.livestream?.links;
  if (!Array.isArray(links) || !links.length) return null;
  sortLivestreamLinksPreferRealBlv(links);
  return links[0] || null;
}

function renderHomeMatchCard_VB2(match, index) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
  });
  const kickoffDate = new Date(match.kickoff).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
  });
  const kickoff = new Date(match.kickoff).toLocaleTimeString("vn-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const home = match.teams?.home || {};
  const score = match.score || {};
  const away = match.teams?.away || {};
  const league = match.league || {};
  // const formattedTime = formatMatchTime_VB(kickoff);
  const preferredBlv = getPreferredLivestreamLink(match);
  const isHot = appState.hotLeaguesRank.has(match.league.id);
  const isLive = LIVE_STATUS.includes(match.status.toLowerCase());
  const isToday = today === kickoffDate;

  return `
        <div
          class="match-info-primary text-white lg:flex lg:flex-row lg:items-center gap-5 lg:border-b border-0 lg:justify-between lg:py-5 lg:px-4 relative border-gradient-2 ${
            index % 2 === 0 ? "bg-[#252E3F]" : "bg-transparent"
          }"
          >
          <a class="absolute top-0 left-0 w-full h-full ${isHot ? "ck2-list-match-hot" : ""}" href="/streams/${
            match?.match_id
          }"></a>
          <div class="hidden lg:flex lg:flex-col-reverse 2xl:flex-row gap-2 lg:flex-1 lg:items-start 2xl:items-center">
            <div class="w-full max-w-44 flex">
              <div class="inline-flex gap-1.5 items-center font-semibold overflow-hidden text-xs rounded-3xl"
                style="background-color:#4986F7"><img 
                  onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'" 
                  src=${preferredBlv?.avatar || ""}
                  alt=${preferredBlv?.commentator || ""} class="w-8 h-8 rounded-full m-0.5"><span
                  class="pr-3 py-1 whitespace-nowrap text-ellipsis overflow-hidden max-w-40">${
                    preferredBlv?.commentator || ""
                  }</span>
              </div>
            </div>
            <div class="event-league pointer-events-none">
              <div class="relative flex items-center gap-2 text-neutral-3">
                <div class="flex items-center justify-center gap-2">
                  <img width="20" height="20" src="${league.logo}" alt="${
                    league.logo
                    }" 
                    onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"/>
                  <span class="text-sm line-clamp-2 max-w-36">${
                    league.name
                  }</span>
                </div>
              </div>
            </div>
          </div>
          <div class="lg:w-full lg:max-w-[500px] ">
            <div class="event-league text-center p-3 pt-4 lg:hidden">
              <div class="relative flex justify-center items-center gap-2 text-neutral-3">
                <div class="flex items-center justify-center gap-2"> <img width="20" height="20" src="${
                  league.logo
                }" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                    alt="${league.logo}" />
                  <span class="text-sm line-clamp-2 max-w-36">${
                    league.name
                  }</span>
                </div>
              </div>
             ${
               isLive
                 ? ` <div class="h-6 flex flex-1 absolute right-0">
                <div class="flex items-center justify-center gap-1 live"><i class="fa-solid fa-circle" style="color: rgb(247 73 73)" 
                    aria-hidden="true"></i>
                  <span class="text-sm text-primary font-semibold">Live</span>
                </div>
              </div>`
                 : ""
             }
             
            </div>
              <div
              class="flex flex-row justify-center items-stretch gap-5 px-3 pb-3 mb-3 border-b border-gradient lg:p-0 lg:border-none lg:mb-0">
              <div class="flex-1 items-center justify-start flex flex-col gap-4 text-center lg:flex-row">
                <div class="inline-flex justify-center items-center max-w-max flex-1 basis-full"><img loading="lazy"
                    class="w-12 h-12 object-cover rounded-full" rel="nofollow" src="${
                      home.logo
                    }" alt="${home.logo}"
                    onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                    >
                </div>
                <h5 class="team-name text-sm font-medium line-clamp-2 min-h-10 lg:min-h-0 max-w-36 lg:text-left">
                  ${home.name}</h5>
              </div>
              <div class="w-24">
                <div class="text-2xl font-medium flex flex-col items-center justify-center gap-3"><span
                    class="time text-minute font-normal text-sm lg:text-base capitalize"> ${
                      match?.currentMinutes
                        ? `<span class="time text-minute font-normal text-sm lg:text-base capitalize">
                      ${match?.currentMinutes}'
                    </span>`
                        : ""
                    }</span><span>${
                      isLive
                        ? `${score.fulltime.home} - ${score.fulltime.away}`
                        : `VS`
                    }</span>
                    </span>
                    <span class="time text-sm  font-medium">${kickoff} ${
                      isToday ? "" : `${kickoffDate}`
                    }</span></div>
              </div>
              <div class="flex-1 items-center justify-start flex flex-col gap-4 text-center lg:flex-row-reverse">
                <div class="inline-flex justify-center items-center max-w-max flex-1 basis-full"><img loading="lazy"
                    class="w-12 h-12 object-cover rounded-full" rel="nofollow" src="${
                      away.logo
                      }" alt="${away.logo}"
                      onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                    >
                </div>
                <h5 class="team-name text-sm font-medium line-clamp-2 min-h-10 lg:min-h-0 max-w-36 lg:text-right">
                  ${away.name}</h5>
              </div>
            </div>
          </div>
          
          <div class="flex justify-between items-center gap-2 px-3 pb-4 lg:flex-1 lg:justify-end lg:p-0 z-10 relative">
            <div class="inline-flex gap-1.5 items-center font-semibold overflow-hidden lg:hidden text-xs rounded-3xl"
              style="background-color:#4986F7"><img src=${preferredBlv?.avatar || ""} onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                alt=${preferredBlv?.commentator || ""} class="w-8 h-8 rounded-full m-0.5"><span
                class="pr-3 py-1 whitespace-nowrap text-ellipsis overflow-hidden">${
                  preferredBlv?.commentator || ""
                }</span>
            </div>
            <div class="flex gap-1 shrink-0 lg:flex-col 2xl:flex-row lg:gap-2 z-10 relative text-center">
           ${
             isLive
               ? ` <a
                class="py-1 px-4 rounded-3xl font-semibold text-sm capitalize leading-5 bg-primary py-2 text-xs lg:text-sm lg:w-28 lg:leading-[22px] cakhia-btn-hover"
                href="/streams/${match?.match_id}">Trực tiếp</a>`
               : `<button type="button" class="py-1 px-3 font-semibold text-sm capitalize  text-sm border py-2 lg:w-28 text-xs lg:text-sm text-neutral-3 border-neutral-3 rounded-3xl"><span class="inline-block">Sắp diễn ra</span></button>`
           }
              <a href="${window.DV2_LINK_BET}"
              target="_blank" rel="nofollow"
              class="cakhia-btn-bet text-white py-1 px-3 rounded-3xl font-semibold text-sm capitalize text-sm leading-5 bg-primary-1 py-2 text-xs lg:text-sm">Đặt
              cược</a>
            </div>
          </div>
        </div>
    </div>
            `;
}
const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-first",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
});

function getMatchScheduleListAdBlocks_VB2() {
  return (
    window.DV2ListAds?.getBlocks?.(
      window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS,
    ) || []
  );
}

function buildMatchScheduleAdInsertions_VB2(adBlocks, totalItems) {
  return (
    window.DV2ListAds?.buildInsertions?.(adBlocks, totalItems, {
      breakpoint:
        window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_MOBILE_BREAKPOINT,
      repeatCycle: window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_REPEAT,
    }) || new Map()
  );
}

function buildMatchScheduleAdMarkup_VB2(adBlock) {
  return (
    window.DV2ListAds?.buildMarkup?.(adBlock, {
      wrapperTag: "div",
      wrapperClass: "dv2-match-schedule-ad",
    }) || ""
  );
}

function refreshMatchScheduleReviveAds_VB2($container) {
  window.DV2ListAds?.refreshReviveAds?.($container);
}

function renderLiveMatch_CK2(matches, filter = "all") {
  const now = new Date();
  const filtered = matches
    .filter((m) => {
      const kickoff = new Date(m.kickoff);

      if (filter === "live")
        return LIVE_STATUS.includes(m.status.toLowerCase());
      if (filter === "today") {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const endDay = new Date(now);
        endDay.setHours(23, 59, 59, 999);
        return (
          (m.status !== "Finished" && kickoff > now && kickoff <= endDay) ||
          LIVE_STATUS.includes(m.status.toLowerCase())
        );
      }
      if (filter === "tmr") {
        return kickoff.getDate() === now.getDate() + 1;
      }
      return (
        LIVE_STATUS.includes(m.status.toLowerCase()) ||
        kickoff.getTime() > now.getTime()
      );
    })
    .sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
    );

  const sortedMatches = sortedMatchesFunction(filtered);

  const $c = $(".dv2-container-ck2");
  $c.empty();

  const adBlocks = getMatchScheduleListAdBlocks_VB2();
  const adInsertions = buildMatchScheduleAdInsertions_VB2(
    adBlocks,
    sortedMatches.length,
  );

  if (!sortedMatches.length) {
    let emptyHtml = `<div class="dv2-empty-state">Hiện tại không có trận đấu nào đang diễn ra.</div>`;
    const emptyInsertions = buildMatchScheduleAdInsertions_VB2(
      adBlocks,
      0,
    );
    if (emptyInsertions.has(0)) {
      emptyHtml += buildMatchScheduleAdMarkup_VB2(
        emptyInsertions.get(0),
      );
    }
    $c.html(emptyHtml);
    refreshMatchScheduleReviveAds_VB2($c);
    return;
  }

  let html = "";
  sortedMatches.forEach((m, index) => {
    html += renderHomeMatchCard_VB2(m, index);

    const matchPosition = index + 1;
    if (adInsertions.has(matchPosition)) {
      html += buildMatchScheduleAdMarkup_VB2(
        adInsertions.get(matchPosition),
      );
    }
  });

  $c.append(html);
  refreshMatchScheduleReviveAds_VB2($c);
}

async function loadHomeMatchesData_CK2() {
  const today = new Date();
  const tomorrow = new Date(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  tomorrow.setDate(today.getDate() + 1);
  const payload = {
    // date: today.toISOString().split("T")[0],
    fromDate: yesterday.toISOString().split("T")[0],
    toDate: tomorrow.toISOString().split("T")[0],
  };

  $.ajax({
    url: "https://vsc-apidev.helizones.com/api/data/lives/range-date",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: (res) => {
      if (res && res.matches_by_date) {
        const all = [];
        Object.keys(res.matches_by_date).forEach((d) =>
          all.push(...res.matches_by_date[d]),
        );
        //remove những trận đã kết thúc (của ngày hôm qua)
        const isLiveAndTodayMatches = all.filter(
          (m) => m.status !== "Finished",
        );

        renderLiveMatch_CK2(isLiveAndTodayMatches);
        setupFilterButtons_CK2(isLiveAndTodayMatches);
      } else
        $(".dv2-list-match").html(
          '<div class="dv2-empty-state">Không có dữ liệu</div>',
        );
    },
    error: () =>
      $(".dv2-list-match").html(
        '<div class="dv2-empty-state">Lỗi tải dữ liệu</div>',
      ),
  });
  DV2HotLeagues.load({
    ajax: $.ajax,
    setHotLeaguesRank: (rankMap) => {
      appState.hotLeaguesRank = rankMap;
    },
  });
  // Process the array into a Map and store it in our state
}

// filter theo trạng thái
function setupFilterButtons_CK2(matches) {
  $(".dv2-list-match .dv2-filter-btn")
    .off("click")
    .on("click", function () {
      $(".dv2-list-match .dv2-filter-btn").removeClass(
        "from-[#FA764C] to-[#C84217]",
      );
      $(this).addClass("from-[#FA764C] to-[#C84217]");
      renderLiveMatch_CK2(matches, $(this).data("filter"));
    });
}

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* suggested-stream.js */
(function(window, $, jQuery, Hls, Swiper) {
$ = jQuery.noConflict();

const BASE_API_URL = "https://vsc-apidev.helizones.com/api/data/";
const SUGGESTED_STREAM_PAGE_SIZE = 12;
const appState = {
  hotLeaguesRank: new Map(),
};
const LIVE_STATUS = [
  // Tạm dừng / sự cố
  // "delay",
  // "interrupt",
  //"cut in half",
  // Hiệp 1
  "first half",
  "firsthalf",
  "first-half",
  "fh",
  // Nghỉ giữa hiệp
  "half-time",
  "half time",
  "halftime",
  "ht",
  // Hiệp 2
  "second half",
  "secondhalf",
  "second-half",
  "sh",
  // Hiệp phụ
  "extra time",
  "extratime",
  "extra time",
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  // Luân lưu
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
];

const NHADAI_COMMENTATOR_ID = 99999999999999999;

function isNhaDaiLivestreamLink(link) {
  if (!link) return false;
  if (link.commentatorId === NHADAI_COMMENTATOR_ID) return true;
  const name = String(link.commentator || "").trim().toLowerCase();
  return name === "nhà đài" || name === "nha dai" || name === "blv nhà đài";
}

function sortLivestreamLinksPreferRealBlv(links) {
  if (!Array.isArray(links)) return [];
  links.sort((a, b) => {
    const aIsNhaDai = isNhaDaiLivestreamLink(a);
    const bIsNhaDai = isNhaDaiLivestreamLink(b);
    if (aIsNhaDai && !bIsNhaDai) return 1;
    if (!aIsNhaDai && bIsNhaDai) return -1;
    return 0;
  });
  return links;
}

function getPreferredLivestreamLink(match) {
  const links = match?.livestream?.links;
  if (!Array.isArray(links) || !links.length) return null;
  sortLivestreamLinksPreferRealBlv(links);
  return links[0] || null;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getMatchId(match) {
  return match?.match_id || match?.matchId || match?.id || match?.slug || "";
}

function getSortedCommentatorLinks(match) {
  if (window.DV2StreamLinks?.sortForDetail) {
    return window.DV2StreamLinks.sortForDetail(match?.livestream?.links);
  }
  return sortLivestreamLinksPreferRealBlv(
    Array.isArray(match?.livestream?.links) ? [...match.livestream.links] : [],
  );
}

function getDetailUrl(matchId, link) {
  return window.DV2StreamLinks.getDetailUrl(matchId, link, { trailingSlash: false });
}

function renderBlvAvatar(link, label, className) {
  const avatar = link?.avatar;
  if (!avatar) return "";
  return `<img src="${escapeHtml(avatar)}" alt="${escapeHtml(label)}" class="${className}" onerror="this.style.display='none'">`;
}

function buildCommentatorDropdown(match) {
  const sortedLinks = getSortedCommentatorLinks(match);

  if (!sortedLinks.length) {
    return `
      <div class="inline-flex gap-1.5 items-center font-semibold overflow-hidden text-sm rounded-3xl" style="background-color: #4986f7">
        <span class="pr-3 py-1 whitespace-nowrap text-ellipsis overflow-hidden">BLV Nhà Đài</span>
      </div>
    `;
  }

  return window.DV2BlvDropdown.build({
    match,
    links: sortedLinks,
    getDetailUrl,
    escapeHtml,
    menuPlacement: "up",
    toggleClass:
      "ck2-blv-dropdown__toggle--pill inline-flex gap-1.5 items-center font-semibold text-sm rounded-3xl",
    renderToggle: ({ link, label, esc }) => `
      ${renderBlvAvatar(link, label, "w-8 h-8 rounded-full m-0.5")}
      <span class="py-1 whitespace-nowrap text-ellipsis overflow-hidden max-w-[120px]">${esc(label)}</span>
    `,
    renderItemContent: ({ link, label, esc }) => `
      ${renderBlvAvatar(link, label, "dv2-blv-dropdown__avatar")}
      <span class="dv2-blv-dropdown__label">${esc(label)}</span>
    `,
  });
}

function bindCk2BlvDropdownEvents() {
  window.DV2BlvDropdown.bind($("#match_list_ck2_container"), {
    namespace: "ck2BlvDropdown",
  });
}

let allMatchesGlobal = [];
let suggestedStreamVisibleCount = 0;
let suggestedStreamAdInsertions = new Map();

function getMatchListAdBlocks_CK2() {
  return window.DV2ListAds?.getBlocks?.(
    window.DV2_SOCOLIVE_MATCH_LIST_ADS,
  ) || [];
}

function buildMatchListAdInsertions_CK2(totalItems) {
  const blocks = getMatchListAdBlocks_CK2();
  return (
    window.DV2ListAds?.buildInsertions?.(blocks, totalItems, {
      breakpoint: window.DV2_SOCOLIVE_MATCH_LIST_ADS_MOBILE_BREAKPOINT,
      repeatCycle: window.DV2_SOCOLIVE_MATCH_LIST_ADS_REPEAT,
    }) || new Map()
  );
}

function buildMatchListAdMarkup_CK2(adBlock) {
  return (
    window.DV2ListAds?.buildMarkup?.(adBlock, {
      wrapperTag: "div",
      wrapperClass: "dv2-hot-content-ad",
    }) || ""
  );
}

function refreshMatchListReviveAds_CK2($container) {
  window.DV2ListAds?.refreshReviveAds?.($container);
}

$(document).ready(function () {
  // Only run on pages that actually render this block.
  // Without this guard the mega-bundle fires VSC APIs on every DV2 page.
  if ($(".ck2-suggested-streams").length || $("#match_list_ck2_container").length) {
    loadSuggestedStreamData();
  }
});

const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-first",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
});

function loadSuggestedStreamData() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const fromDate = today.toISOString().split("T")[0]; // YYYY-MM-DD
  const toDate = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

  const payload = {
    fromDate: fromDate,
    toDate: toDate,
  };

  console.log("[VSC LIVE] Loading suggested streams:", payload);
  DV2HotLeagues.load({
    url: `${BASE_API_URL}lives/competitions/hot`,
    ajax: $.ajax,
    setHotLeaguesRank: (rankMap) => {
      appState.hotLeaguesRank = rankMap;
    },
  });
  $.ajax({
    url: `${BASE_API_URL}lives/range-date`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: function (res) {
      console.log("[VSC LIVE] Suggested streams API response:", res);
      if (res?.status === "success" && res?.matches_by_date) {
        // Flatten all matches from all dates
        let allMatches = [];
        Object.values(res.matches_by_date).forEach((dateMatches) => {
          allMatches = allMatches.concat(dateMatches);
        });

        // Filter out finished matches
        allMatches = allMatches.filter(
          (match) => match?.status?.toLowerCase() !== "finished",
        );

        // Sort by priority:
        // 1. Live matches first (by kickoff time)
        // 2. Upcoming matches (by kickoff time)
        const sortMatches = sortedMatchesFunction(allMatches);
        // allMatches.sort((a, b) => {
        //   const aStatus = a?.status?.toLowerCase() || "";
        //   const bStatus = b?.status?.toLowerCase() || "";

        //   const aIsLive = LIVE_STATUS.includes(aStatus);
        //   const bIsLive = LIVE_STATUS.includes(bStatus);

        //   // Live matches come first
        //   if (aIsLive && !bIsLive) return -1;
        //   if (!aIsLive && bIsLive) return 1;

        //   // If both are live or both are not live, sort by kickoff time
        //   return new Date(a.kickoff) - new Date(b.kickoff);
        // });

        console.log(
          "[VSC LIVE] Filtered and sorted matches:",
          sortMatches.length,
        );
        console.log(
          "[VSC LIVE] First few matches:",
          sortMatches.slice(0, 3).map((m) => ({
            id: m.match_id,
            status: m.status,
            teams: `${m.teams?.home?.name} vs ${m.teams?.away?.name}`,
            kickoff: m.kickoff,
          })),
        );

        allMatchesGlobal = sortMatches;
        suggestedStreamVisibleCount = 0;
        initSuggestedStreams();
      } else {
        console.error("[VSC LIVE] Invalid API response");
        showError("Không thể tải danh sách trận đấu");
      }
    },
    error: function (xhr, status, error) {
      console.error("[VSC LIVE] API error:", error);
      showError("Có lỗi xảy ra khi tải dữ liệu");
    },
  });
}

function initSuggestedStreams() {
  const $container = $("#match_list_ck2_container");

  $container.empty();
  console.log('allMatchesGlobal',allMatchesGlobal);

  suggestedStreamAdInsertions = buildMatchListAdInsertions_CK2(
    allMatchesGlobal.length,
  );
  
  if (!allMatchesGlobal.length) {
    $container.html(
      '<div class="no-matches">Hiện tại không có trận đấu nào đang diễn ra.</div>',
    );
    if (suggestedStreamAdInsertions.has(0)) {
      $container.append(
        buildMatchListAdMarkup_CK2(
          suggestedStreamAdInsertions.get(0),
        ),
      );
    }
    refreshMatchListReviveAds_CK2($container);
    updateSuggestedLoadMoreVisibility();
    return;
  }

  renderNextSuggestedBatch();
  bindCk2BlvDropdownEvents();
  $("#ck2SuggestedLoadMore").off("click").on("click", renderNextSuggestedBatch);
}

function renderNextSuggestedBatch() {
  const $container = $("#match_list_ck2_container");
  const nextBatch = allMatchesGlobal.slice(
    suggestedStreamVisibleCount,
    suggestedStreamVisibleCount + SUGGESTED_STREAM_PAGE_SIZE,
  );

  if (!nextBatch.length) {
    updateSuggestedLoadMoreVisibility();
    return;
  }

  let html = "";
  nextBatch.forEach((match, localIndex) => {
    const globalPosition =
      suggestedStreamVisibleCount + localIndex + 1;

    html += generateMatchBlock(match);

    if (suggestedStreamAdInsertions.has(globalPosition)) {
      html += buildMatchListAdMarkup_CK2(
        suggestedStreamAdInsertions.get(globalPosition),
      );
    }
  });

  $container.append(html);
  refreshMatchListReviveAds_CK2($container);
  bindCk2BlvDropdownEvents();
  suggestedStreamVisibleCount += nextBatch.length;
  updateSuggestedLoadMoreVisibility();
}

function updateSuggestedLoadMoreVisibility() {
  const $btn = $("#ck2SuggestedLoadMore");
  const $footer = $(".ck2-suggested-streams-footer");

  const hasMore =
    allMatchesGlobal.length > SUGGESTED_STREAM_PAGE_SIZE &&
    suggestedStreamVisibleCount < allMatchesGlobal.length;

  if (!$btn.length) {
    return;
  }

  if (hasMore) {
    $footer.prop("hidden", false).show();
    $btn.prop("hidden", false);
  } else {
    $footer.prop("hidden", true).hide();
    $btn.prop("hidden", true);
  }
}

function generateMatchBlock(match) {
  const homeTeam = match?.teams?.home;
  const awayTeam = match?.teams?.away;
  const league = match?.league;
  const score = match?.score;

  // Determine match status and display
  const matchStatus = match?.status?.toLowerCase() || "not started";
  const LIVE_STATUS = [
    // Tạm dừng / sự cố
    // "delay",
    // "interrupt",
    // "cut in half",
    // Hiệp 1
    "first half",
    "firsthalf",
    "first-half",
    "fh",
    // Nghỉ giữa hiệp
    "half-time",
    "half time",
    "halftime",
    "ht",
    // Hiệp 2
    "second half",
    "secondhalf",
    "second-half",
    "sh",
    // Hiệp phụ
    "extra time",
    "extratime",
    "extra time",
    "et",
    "overtime",
    "overtime(deprecated)",
    "ot",
    // Luân lưu
    "penalty",
    "penalties",
    "penalty shoot-out",
    "penalty shootout",
  ];
  const isLive = LIVE_STATUS.includes(matchStatus);

  // Get current time display
  let currentTimeDisplay = "";
  if (isLive) {
    // Use currentMinutes if available, otherwise calculate from status
    if (match?.currentMinutes) {
      currentTimeDisplay = `${match.currentMinutes}'`;
    } else {
      currentTimeDisplay = getCurrentMatchTime(match);
    }
  } else {
    currentTimeDisplay = ""; // Don't show time for finished/upcoming matches
  }

  // Get scores
  const homeScore = score?.fulltime?.home || 0;
  const awayScore = score?.fulltime?.away || 0;

  const matchId = getMatchId(match);

  // Check hot match
  const isHot = appState.hotLeaguesRank.has(match.league.id);

  return `
    <div class="match-info-primary w-full match_list--item ${isHot ? "hot-match" :''} ">
        <div class="bg-white text-black rounded-xl flex flex-col h-full">
            <div class="relative flex-1">
                <a class="match_item--link absolute top-0 left-0 w-full h-full"
                    href="/streams/${matchId}"></a>
                <div class="event-league text-center p-3 pt-2">
                    <div class="flex justify-between items-center gap-2 text-neutral-3">
                        <div class="text-primary font-medium flex items-center gap-1 uppercase flex-1">
                            ${
                              isLive
                                ? `<img decoding="async" src="${DV2_IMAGE_PATH}cakhia/hot.png" alt="hot" class="">Live`
                                : ""
                            }
                        </div>
                        <div class="flex items-center justify-center gap-2">
                            <img decoding="async" class="match_item--llogo icon-cup text-2xl leading-6" src="${
                              league?.logo || ""
                            }" alt="${
                              league?.name || ""
                            }" style="width: 24px; height: 24px;"/>
                            <span class="match_item--lname text-sm whitespace-nowrap text-ellipsis overflow-hidden max-w-[150px]">
                                ${league?.name || ""}
                            </span>
                        </div>
                        <div class="h-6 flex flex-1 justify-end"></div>
                    </div>
                </div>
                <div class="flex flex-row justify-between items-stretch gap-3 px-2">
                    <div class="flex-1 items-center justify-start flex flex-col gap-4 text-center">
                        <div class="match_item--home-logo inline-flex justify-center items-center max-w-max">
                            <img class="w-12 h-12 object-cover rounded-full" rel="nofollow"
                                src="${homeTeam?.logo || ""}"
                                alt="${homeTeam?.name || ""}">
                        </div>
                        <h5 class="match_item--home-name team-name text-sm lg:text-base lg:leading-5 font-medium line-clamp-2 min-h-10 lg:min-h-auto">
                            ${homeTeam?.name || ""}
                        </h5>
                    </div>
                    <div class="text-2xl font-medium flex flex-col items-center justify-center gap-3">
                        ${
                          currentTimeDisplay
                            ? `<span class="match_item--current-time time text-minute font-normal text-sm lg:text-base capitalize">${currentTimeDisplay}</span>`
                            : ""
                        }
                        <span>
                            ${
                              isLive || matchStatus === "finished"
                                ? `<span class="match_item--home-score">${homeScore}</span> - <span class="match_item--away-score">${awayScore}</span>`
                                : `<span class="">vs</span>`
                            }
                        </span>
                        <span class="match_item--kickoff-time time text-sm font-medium">${formatKickoffTime(
                          match?.kickoff,
                        )}</span>
                    </div>
                    <div class="flex-1 items-center justify-start flex flex-col gap-4 text-center">
                        <div class="match_item--away-logo inline-flex justify-center items-center max-w-max">
                            <img loading="lazy" class="w-12 h-12 object-cover rounded-full" rel="nofollow"
                                src="${awayTeam?.logo || ""}"
                                alt="${awayTeam?.name || ""}">
                        </div>
                        <h5 class="match_item--away-name team-name text-sm lg:text-base lg:leading-5 font-medium line-clamp-2 min-h-10 lg:min-h-auto">
                            ${awayTeam?.name || ""}
                        </h5>
                    </div>
                </div>
            </div>
            <div class="flex justify-between items-center gap-2 px-2 pb-2 text-white z-10 pt-3 mt-3 border-t border-gradient">
                ${buildCommentatorDropdown(match)}
                <div class="flex gap-1 shrink-0">
                    <a class="${
                      isLive
                        ? "py-1 px-4 rounded-3xl font-semibold text-sm capitalize leading-5 text-xs leading-6 bg-primary cakhia-btn-hover"
                        : "py-2 px-3 font-semibold text-sm capitalize  text-sm border text-xs border-neutral-3 text-neutral-3 rounded-3xl cakhia-btn-hover"
                    } "
                        href="/streams/${matchId}"
                        <span class="inline-block">${
                          isLive ? "Trực tiếp" : "Sắp diễn ra"
                        }</span></a>
                    <a href="${window.DV2_LINK_BET}" target="_blank" rel="nofollow" class="cakhia-btn-bet text-white py-1 px-3 rounded-3xl font-semibold text-sm capitalize text-sm leading-5 bg-primary-1 text-xs leading-6">Đặt cược</a>
                </div>
            </div>
        </div>
    </div>
  `;
}

function getCurrentMatchTime(match) {
  // This would need to be calculated based on match start time and current time
  // For now, return a placeholder based on status
  const status = match?.status?.toLowerCase();
  if (status === "first half") return "45+";
  if (status === "half-time" || status === "half time") return "HT";
  if (status === "second half") return "90+";
  return "LIVE";
}

function formatKickoffTime(kickoffTime) {
  if (!kickoffTime) return "";

  const date = new Date(kickoffTime);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");

  return `${hours}:${minutes} ${day}/${month}`;
}

function showError(message) {
  const $container = $(".suggested-streams-container");
  $container.html(`
    <div class="error-message" style="color: red; text-align: center; padding: 20px;">
      ${message}
    </div>
  `);
}

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* common.js */
(function(window, $, jQuery, Hls, Swiper) {
/**
 * LuongSon V2 — Shared match statistics hover modal (jQuery)
 */
(function ($) {
  'use strict';

  // Keys align with upstream match detail: stats.ft / stats.h1 (array [home, away]).
  var STAT_ROWS = [
    { key: 'ballPossession', label: 'TL kiểm soát bóng', isPercent: true, aliases: ['possession'] },
    { key: 'attacks', label: 'Tấn công' },
    { key: 'dangerousAttack', label: 'Tấn công nguy hiểm' },
    { key: 'corner', label: 'Phạt góc' },
    { key: 'yellowCard', label: 'Thẻ vàng' },
    { key: 'redCard', label: 'Thẻ đỏ' },
    { key: 'shots', label: 'Sút bóng' },
    { key: 'shotsOnTarget', label: 'Sút cầu môn' },
    { key: 'shotsOffTarget', label: 'Sút ngoài cầu môn' },
    { key: 'blockedShots', label: 'Sút bị chặn' },
  ];

  var $portal = null;
  var $bodyEl = null;
  var $tabs = null;
  var currentTrigger = null;
  var currentStats = null;
  var activeTab = 'ft';
  var closeTimeout = null;
  var globalListenersBound = false;

  function toNumber(value) {
    var num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  /** Resolve a period stat: [home, away] | {home,away} | legacy object */
  function getStatPair(stat) {
    if (stat == null) return { home: 0, away: 0 };

    if (Array.isArray(stat)) {
      return { home: toNumber(stat[0]), away: toNumber(stat[1]) };
    }

    if (typeof stat === 'object') {
      return {
        home: toNumber(stat.home != null ? stat.home : stat[0]),
        away: toNumber(stat.away != null ? stat.away : stat[1]),
      };
    }

    return { home: 0, away: 0 };
  }

  function getRowStat(tabStats, row) {
    if (!tabStats || !row) return null;
    if (tabStats[row.key] != null) return tabStats[row.key];

    var aliases = row.aliases || [];
    var i;
    for (i = 0; i < aliases.length; i++) {
      if (tabStats[aliases[i]] != null) return tabStats[aliases[i]];
    }
    return null;
  }

  function formatValue(value, isPercent) {
    return isPercent ? String(toNumber(value)) + '%' : String(toNumber(value));
  }

  function calcBarPct(home, away, isPercent) {
    if (isPercent) {
      return {
        left: Math.max(0, Math.min(100, toNumber(home))),
        right: Math.max(0, Math.min(100, toNumber(away))),
      };
    }

    var total = toNumber(home) + toNumber(away);
    if (total <= 0) return { left: 50, right: 50 };

    return {
      left: Math.round((toNumber(home) / total) * 100),
      right: Math.round((toNumber(away) / total) * 100),
    };
  }

  /**
   * Upstream: stats.ft (toàn trận) + stats.h1 (hiệp 1).
   * Legacy: stats.all / stats.h2 still supported if present.
   */
  function getStatsForTab(stats, tab) {
    if (!stats || typeof stats !== 'object') return {};

    if (tab === 'h1' && stats.h1) return stats.h1;
    if (tab === 'h2' && stats.h2) return stats.h2;
    if ((tab === 'ft' || tab === 'all') && (stats.ft || stats.all)) {
      return stats.ft || stats.all;
    }

    // Flat legacy payload (no period keys) — treat as full match.
    if (!stats.ft && !stats.h1 && !stats.h2 && !stats.all) return stats;

    return {};
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
    return (
      '<div class="luongson-match-modal-row" data-stat="' +
      key +
      '">' +
      '<div class="luongson-match-modal-row__labels">' +
      '<span class="is-val is-home">' +
      left +
      '</span>' +
      '<span class="is-label">' +
      label +
      '</span>' +
      '<span class="is-val is-away">' +
      right +
      '</span>' +
      '</div>' +
      '<div class="luongson-match-modal-bars">' +
      '<div class="luongson-match-modal-bar is-home"><span style="width:' +
      leftPct +
      '%"></span></div>' +
      '<div class="luongson-match-modal-bar is-away"><span style="width:' +
      rightPct +
      '%"></span></div>' +
      '</div></div>'
    );
  }

  function renderRows(stats) {
    var tabStats = getStatsForTab(stats, activeTab);
    var html = '';

    $.each(STAT_ROWS, function (_, row) {
      var pair = getStatPair(getRowStat(tabStats, row));
      var bars = calcBarPct(pair.home, pair.away, row.isPercent);

      html += rowHtml(
        row.key,
        row.label,
        formatValue(pair.home, row.isPercent),
        formatValue(pair.away, row.isPercent),
        bars.left,
        bars.right
      );
    });

    return html;
  }

  function ensurePortal() {
    if ($portal && $portal.length) return $portal;

    $portal = $('<div>', {
      class: 'luongson-match-modal-portal',
      hidden: true,
    }).css({
      display: 'none',
      opacity: 0,
      transform: 'scale(.96)',
      'transform-origin': 'top center',
      transition: 'opacity .15s ease,transform .15s cubic-bezier(.2,0,.2,1)',
    });

    $portal.html(
      '<div class="luongson-match-modal-portal__panel" role="dialog" aria-label="Thống kê trận đấu">' +
        '<div class="luongson-match-modal-tabs">' +
        tabHtml('ft', 'Toàn trận', true) +
        tabHtml('h1', 'Hiệp 1', false) +
        '</div>' +
        '<div class="luongson-match-modal-body"></div>' +
        '</div>'
    );
    $('body').append($portal);

    $bodyEl = $portal.find('.luongson-match-modal-body');
    $tabs = $portal.find('.luongson-match-modal-tab');

    $tabs.on('click', function (e) {
      e.stopPropagation();
      setActiveTab($(this).attr('data-tab') || 'ft');
    });

    $portal.on('mouseenter', function () {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    });
    $portal.on('mouseleave', hidePopover);

    bindGlobalListeners();
    return $portal;
  }

  function setActiveTab(name) {
    activeTab = name === 'all' ? 'ft' : name || 'ft';
    $tabs.each(function () {
      $(this).toggleClass('is-active', $(this).attr('data-tab') === activeTab);
    });
    if ($bodyEl && $bodyEl.length) $bodyEl.html(renderRows(currentStats));
    if (currentTrigger && $portal && $portal.css('display') !== 'none') {
      showPopover(currentTrigger);
    }
  }

  function updatePanel(stats) {
    ensurePortal();
    currentStats = stats || {};
    if ($bodyEl && $bodyEl.length) $bodyEl.html(renderRows(currentStats));
  }

  function showPopover(trigger) {
    if (!trigger) return;

    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }

    currentTrigger = trigger;
    ensurePortal();
    $portal.removeAttr('hidden').css('display', 'block');

    var rect = trigger.getBoundingClientRect();
    var modalWidth = Math.min(384, $(window).width() - 24);
    $portal.css({
      width: modalWidth + 'px',
      maxWidth: 'calc(100vw - 24px)',
    });
    var modalHeight = $portal.outerHeight() || 440;
    var left = rect.left + rect.width / 2 - modalWidth / 2;
    if (left < 10) left = 10;
    if (left + modalWidth > $(window).width() - 10) {
      left = $(window).width() - modalWidth - 10;
    }

    var top = rect.bottom + 4;
    if (top + modalHeight > $(window).height() - 10 && rect.top - modalHeight - 4 > 0) {
      top = rect.top - modalHeight - 4;
    }

    $portal.css({ left: left + 'px', top: top + 'px' });

    requestAnimationFrame(function () {
      $portal.css({ opacity: 1, transform: 'scale(1)' });
    });
  }

  function hidePopover() {
    if (!$portal || !$portal.length) return;

    if (closeTimeout) clearTimeout(closeTimeout);
    closeTimeout = setTimeout(function () {
      $portal.css({ opacity: 0, transform: 'scale(0.96)' });
      setTimeout(function () {
        if (parseFloat($portal.css('opacity')) === 0) {
          $portal.css('display', 'none').attr('hidden', 'hidden');
          currentTrigger = null;
        }
      }, 150);
    }, 120);
  }

  function bindGlobalListeners() {
    if (globalListenersBound) return;
    globalListenersBound = true;

    $(window).on('scroll.lsMatchModal', function () {
      if (!$portal || $portal.css('display') === 'none' || !currentTrigger) return;
      var rect = currentTrigger.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > $(window).height()) {
        $portal.css({ display: 'none', opacity: 0 });
        currentTrigger = null;
      } else {
        showPopover(currentTrigger);
      }
    });

    $(window).on('resize.lsMatchModal', function () {
      if ($portal && $portal.css('display') !== 'none' && currentTrigger) {
        showPopover(currentTrigger);
      }
    });
  }

  function bindTriggers(root, selector, getStats) {
    if (!root || !selector) return;

    ensurePortal();

    $(root)
      .find(selector)
      .each(function () {
        var $trigger = $(this);
        if ($trigger.data('lsStatsBound')) return;
        $trigger.data('lsStatsBound', true);

        $trigger.on('mouseenter', function () {
          var el = this;
          var stats = typeof getStats === 'function' ? getStats(el) : null;
          updatePanel(stats);
          showPopover(el);
        });
        $trigger.on('mouseleave', hidePopover);
      });
  }

  function setCardStats(cardEl, stats) {
    if (cardEl) cardEl.__lsMatchStats = stats || null;
  }

  window.LuongsonMatchStatsModal = {
    STAT_ROWS: STAT_ROWS,
    ensurePortal: ensurePortal,
    updatePanel: updatePanel,
    showPopover: showPopover,
    hidePopover: hidePopover,
    bindTriggers: bindTriggers,
    setCardStats: setCardStats,
    getStatsForTab: getStatsForTab,
    renderRows: renderRows,
  };
})(jQuery);

/**
 * LuongSon V2 — Fallback ảnh mặc định khi load lỗi (jQuery)
 */
(function ($) {
  'use strict';

  var DEFAULT_IMG = null;
  var initialized = false;

  function getPluginUrl() {
    var pluginUrl =
      (typeof window.DV2_STREAMING_PLUGIN_URL !== 'undefined' && window.DV2_STREAMING_PLUGIN_URL) ||
      (window.dv2Streaming && window.dv2Streaming.pluginUrl) ||
      '';

    if (pluginUrl && pluginUrl.slice(-1) !== '/') {
      pluginUrl += '/';
    }

    return pluginUrl;
  }

  function getDefaultImgUrl() {
    if (DEFAULT_IMG) return DEFAULT_IMG;

    var pluginUrl = getPluginUrl();
    DEFAULT_IMG = pluginUrl
      ? pluginUrl + 'assets/images/default-img.png'
      : '../../assets/images/default-img.png';

    return DEFAULT_IMG;
  }

  function isDefaultImg(src) {
    return !src || src.indexOf('default-img.png') !== -1;
  }

  function applyFallback(img) {
    if (!img || img.tagName !== 'IMG' || $(img).data('lsImgFallback') === '1') return;

    var fallback = getDefaultImgUrl();
    var $img = $(img);
    var currentSrc = $img.attr('src') || img.currentSrc || img.src || '';

    if (isDefaultImg(currentSrc) || currentSrc === fallback) return;

    $img.data('lsImgFallback', '1').attr('src', fallback);
  }

  function handleImgError(e) {
    applyFallback(e.target);
  }

  function patchBrokenImages(root) {
    var $scope = root ? $(root) : $(document);
    $scope.find('img').each(function () {
      var img = this;
      if (img.complete && img.naturalWidth === 0 && ($(img).attr('src') || img.src)) {
        applyFallback(img);
      }
    });
  }

  function init(root) {
    if (!initialized) {
      initialized = true;
      // Capture phase needed so broken <img> error reaches document before bubble stop.
      document.addEventListener('error', handleImgError, true);
    }

    patchBrokenImages(root);
  }

  window.LuongsonImageFallback = {
    getDefaultImgUrl: getDefaultImgUrl,
    applyFallback: applyFallback,
    init: init,
  };

  $(function () {
    init();
  });
})(jQuery);

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* home-match.js */
(function(window, $, jQuery, Hls, Swiper) {
/**
 * LuongSon Sport — Home Featured Match (jQuery)
 * Ads ticker infinite scroll (from themes/html/js/modules/sliders.js)
 */
(function ($) {
  'use strict';

  function createFeaturedAdsTicker(container) {
    var $container = $(container);
    var $track = $container.find('ul').first();
    if (!$track.length || $track.data('lsHomeMatchTickerInit')) return;
    $track.data('lsHomeMatchTickerInit', true);

    var $originalChildren = $track.children().filter(function () {
      return !$(this).hasClass('clone-item') && $(this).attr('aria-hidden') !== 'true';
    });

    if (!$originalChildren.length) return;

    $track.children().each(function () {
      var $child = $(this);
      if ($child.hasClass('clone-item') || $child.attr('aria-hidden') === 'true') {
        $child.remove();
      }
    });

    $originalChildren.each(function () {
      $(this).addClass('ticker-item');
    });

    var speed = 38;
    var direction = -1;
    var singleSetWidth = 0;
    var currentX = 0;
    var isHovered = false;
    var isDragging = false;
    var startX = 0;
    var dragStartX = 0;
    var dragDistance = 0;
    var lastTimestamp = null;
    var rafId = null;

    function buildClones() {
      $track.find('.clone-item').remove();

      if (!$originalChildren.length) return;

      var containerWidth = $container.outerWidth() || $(window).width();
      var computedStyle = window.getComputedStyle($track.get(0));
      var gap = parseFloat(computedStyle.gap) || parseFloat(computedStyle.columnGap) || 12;

      var firstChild = $originalChildren.get(0);
      var lastChild = $originalChildren.get($originalChildren.length - 1);
      var firstRect = firstChild.getBoundingClientRect();
      var lastRect = lastChild.getBoundingClientRect();

      if (firstRect.width > 0 && lastRect.right - firstRect.left > 0) {
        singleSetWidth = lastRect.right - firstRect.left + gap;
      } else {
        singleSetWidth = lastChild.offsetLeft + lastChild.offsetWidth - firstChild.offsetLeft + gap;
      }

      if (singleSetWidth <= 0 || isNaN(singleSetWidth)) {
        singleSetWidth = $originalChildren.toArray().reduce(function (acc, el) {
          return acc + (el.offsetWidth || 80) + gap;
        }, 0);
      }

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

    function animate(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      var dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;

      if (!isHovered && !isDragging && singleSetWidth > 0) {
        currentX += direction * speed * dt;
        if (direction < 0) {
          while (currentX <= -singleSetWidth) {
            currentX += singleSetWidth;
          }
        } else {
          while (currentX >= 0) {
            currentX -= singleSetWidth;
          }
        }
        $track.get(0).style.setProperty('transform', 'translate3d(' + currentX + 'px, 0, 0)', 'important');
      }

      rafId = requestAnimationFrame(animate);
    }

    $container.on('mouseenter', function () {
      isHovered = true;
    });
    $container.on('mouseleave', function () {
      isHovered = false;
      lastTimestamp = null;
    });

    function pointerClientX(e) {
      var oe = e.originalEvent || e;
      if (oe.touches && oe.touches.length) return oe.touches[0].clientX;
      if (oe.changedTouches && oe.changedTouches.length) return oe.changedTouches[0].clientX;
      return e.clientX;
    }

    function onPointerDown(e) {
      isDragging = true;
      dragDistance = 0;
      startX = pointerClientX(e);
      dragStartX = currentX;
      $track.css('cursor', 'grabbing');
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      var clientX = pointerClientX(e);
      var dx = clientX - startX;
      dragDistance = Math.abs(dx);
      currentX = dragStartX + dx;

      if (singleSetWidth > 0) {
        while (currentX <= -singleSetWidth) currentX += singleSetWidth;
        while (currentX > 0) currentX -= singleSetWidth;
      }

      $track.get(0).style.setProperty('transform', 'translate3d(' + currentX + 'px, 0, 0)', 'important');
      var oe = e.originalEvent || e;
      if (oe.cancelable && String(e.type || '').indexOf('touch') === 0) {
        e.preventDefault();
      }
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      $track.css('cursor', '');
      lastTimestamp = null;
    }

    var trackEl = $track.get(0);

    $track.on('mousedown', onPointerDown);
    $(window).on('mousemove.lsHomeMatchTicker', onPointerMove);
    $(window).on('mouseup.lsHomeMatchTicker', onPointerUp);

    // Native listeners keep passive:false so touch drag can call preventDefault.
    trackEl.addEventListener('touchstart', function (e) {
      onPointerDown($.event.fix(e));
    }, { passive: true });
    trackEl.addEventListener('touchmove', function (e) {
      onPointerMove($.event.fix(e));
    }, { passive: false });
    trackEl.addEventListener('touchend', function (e) {
      onPointerUp($.event.fix(e));
    });

    trackEl.addEventListener(
      'click',
      function (e) {
        if (dragDistance > 6) {
          e.preventDefault();
          e.stopPropagation();
        }
        dragDistance = 0;
      },
      true
    );

    var resizeTimer = null;
    $(window).on('resize.lsHomeMatchTicker', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildClones();
        lastTimestamp = null;
      }, 150);
    });

    $(document).on('visibilitychange.lsHomeMatchTicker', function () {
      if (document.hidden) {
        lastTimestamp = null;
      }
    });

    buildClones();
    rafId = requestAnimationFrame(animate);

    return function destroy() {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }

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

  function getSortedLinks(match) {
    var links = match && match.livestream && match.livestream.links;
    if (window.DV2StreamLinks && window.DV2StreamLinks.sortForDetail) {
      return window.DV2StreamLinks.sortForDetail(links);
    }
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

  function flattenMatchesByDate(matchesByDate) {
    var all = [];
    if (!matchesByDate || typeof matchesByDate !== 'object') return all;
    $.each(Object.keys(matchesByDate).sort(), function (_, dateKey) {
      var day = matchesByDate[dateKey];
      if (Array.isArray(day)) all = all.concat(day);
    });
    return all;
  }

  function pickFeaturedMatch(matches) {
    if (!Array.isArray(matches) || !matches.length) return null;
    var i;
    for (i = 0; i < matches.length; i++) {
      if (isLiveStatus(matches[i] && matches[i].status)) return matches[i];
    }
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

    var links = getSortedLinks(match);
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
    $(
      '.luongson-home-match .luongson-featured-ads-ticker, .luongson-home-match .framer-cfqyq6'
    ).each(function () {
      createFeaturedAdsTicker(this);
    });
    initFeaturedMatchData();
  }

  $(initAll);
})(jQuery);

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* list-matches.js */
(function(window, $, jQuery, Hls, Swiper) {
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
    // Keep shared sorter in sync with proxy-resolved priority list.
    if (ids.length) {
      window.DV2_STREAMING_PRIORITY_COMPETITION_IDS = ids.join(',');
    }
  }

  function getPriorityRank(match) {
    var leagueId = match && match.league && match.league.id;
    if (!leagueId || !state.priorityCompetitionIdsOrdered.length) return Infinity;
    var index = state.priorityCompetitionIdsOrdered.indexOf(String(leagueId));
    return index === -1 ? Infinity : index;
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

  // live > priority > kickoff (live + priority always tops the list)
  function sortMatches(matches) {
    if (!Array.isArray(matches) || matches.length < 2) {
      return Array.isArray(matches) ? matches.slice() : [];
    }

    return matches.slice().sort(function (a, b) {
      var aLive = isLiveStatus(a && a.status);
      var bLive = isLiveStatus(b && b.status);
      if (aLive !== bLive) return aLive ? -1 : 1;

      var aRank = getPriorityRank(a);
      var bRank = getPriorityRank(b);
      if (aRank !== bRank) return aRank - bRank;

      var aKick = parseKickoffDate(a && a.kickoff);
      var bKick = parseKickoffDate(b && b.kickoff);
      if (!aKick && !bKick) return 0;
      if (!aKick) return 1;
      if (!bKick) return -1;
      return aKick.getTime() - bKick.getTime();
    });
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

  function getSortedLinks(match) {
    var links = match && match.livestream && match.livestream.links;
    if (window.DV2StreamLinks && window.DV2StreamLinks.sortForDetail) {
      return window.DV2StreamLinks.sortForDetail(links);
    }
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

  function flattenMatchesByDate(matchesByDate) {
    var all = [];
    if (!matchesByDate || typeof matchesByDate !== 'object') return all;
    $.each(Object.keys(matchesByDate).sort(), function (_, dateKey) {
      var day = matchesByDate[dateKey];
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
    var links = getSortedLinks(match);
    var hasDropdown = links.length > 1;
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
      '<button type="button" class="luongson-match-commentator-trigger"' +
      (hasDropdown ? ' aria-haspopup="listbox" aria-expanded="false"' : ' disabled') +
      '>' +
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

  function initCommentatorDropdown($root) {
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

    var $panel = $portal.find('.luongson-commentator-portal__panel');
    var $activeTrigger = null;

    function fillOptions(match) {
      var links = getSortedLinks(match);
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

    function openDropdown($trigger) {
      if ($activeTrigger && $activeTrigger.get(0) === $trigger.get(0) && $portal.css('display') !== 'none') {
        closeDropdown();
        return;
      }

      var $card = $trigger.closest('.luongson-match-card');
      fillOptions($card.length ? $card.get(0).__lsMatch : null);

      $activeTrigger = $trigger;
      $trigger.attr('aria-expanded', 'true');
      $portal.removeAttr('hidden').css('display', 'block');

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

      requestAnimationFrame(function () {
        $portal.css({ opacity: 1, transform: 'translateY(0) scale(1)' });
      });
    }

    function closeDropdown() {
      if ($activeTrigger) $activeTrigger.attr('aria-expanded', 'false');
      $portal.css({ opacity: 0, transform: 'translateY(-4px) scale(0.98)' });
      setTimeout(function () {
        if (parseFloat($portal.css('opacity')) === 0) {
          $portal.css('display', 'none').attr('hidden', 'hidden');
          $activeTrigger = null;
        }
      }, 150);
    }

    if (!$portal.data('lsPortalBound')) {
      $portal.data('lsPortalBound', true);

      $portal.on('click', function (e) {
        var $opt = $(e.target).closest('.luongson-commentator-option');
        if (!$opt.length || !$activeTrigger) return;
        e.preventDefault();
        e.stopPropagation();

        var $card = $activeTrigger.closest('.luongson-match-card');
        var match = $card.length ? $card.get(0).__lsMatch : null;
        if (!match) {
          closeDropdown();
          return;
        }

        var links = getSortedLinks(match);
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
        if (
          $portal.css('display') !== 'none' &&
          !$portal.is(e.target) &&
          !$portal.has(e.target).length &&
          (!$activeTrigger || (!$activeTrigger.is(e.target) && !$activeTrigger.has(e.target).length))
        ) {
          closeDropdown();
        }
      });

      $(document).on('keydown.lsListPortal', function (e) {
        if (e.key === 'Escape' && $portal.css('display') !== 'none') closeDropdown();
      });

      $(window).on('scroll.lsListPortal', function () {
        if ($portal.css('display') === 'none' || !$activeTrigger) return;
        var rect = $activeTrigger.get(0).getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > $(window).height()) {
          $portal.css({ display: 'none', opacity: 0 });
          $activeTrigger.attr('aria-expanded', 'false');
          $activeTrigger = null;
        } else {
          openDropdown($activeTrigger);
        }
      });

      $(window).on('resize.lsListPortal', function () {
        if ($portal.css('display') !== 'none' && $activeTrigger) openDropdown($activeTrigger);
      });
    }

    $root.find('.luongson-match-commentator-trigger').each(function () {
      var $btn = $(this);
      if ($btn.data('lsBound') || $btn.prop('disabled')) return;
      $btn.data('lsBound', true).on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openDropdown($btn);
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
    var matches = sortMatches(flattenMatchesByDate(res.matches_by_date));
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
    loadFirstPageFromSharedOrOwn();
  }

  $(initAll);
})(jQuery);

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* schedule.js */
(function(window, $, jQuery, Hls, Swiper) {
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
    // Keep shared sorter in sync with proxy-resolved priority list.
    if (ids.length) {
      window.DV2_STREAMING_PRIORITY_COMPETITION_IDS = ids.join(',');
    }
  }

  function getPriorityRank(match) {
    var leagueId = match && match.league && match.league.id;
    if (!leagueId || !state.priorityCompetitionIdsOrdered.length) return Infinity;
    var index = state.priorityCompetitionIdsOrdered.indexOf(String(leagueId));
    return index === -1 ? Infinity : index;
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

  // live > priority > kickoff (live + priority always tops the list)
  function sortMatches(matches) {
    if (!Array.isArray(matches) || matches.length < 2) {
      return Array.isArray(matches) ? matches.slice() : [];
    }

    return matches.slice().sort(function (a, b) {
      var aLive = isLiveStatus(a && a.status);
      var bLive = isLiveStatus(b && b.status);
      if (aLive !== bLive) return aLive ? -1 : 1;

      var aRank = getPriorityRank(a);
      var bRank = getPriorityRank(b);
      if (aRank !== bRank) return aRank - bRank;

      var aKick = parseKickoffDate(a && a.kickoff);
      var bKick = parseKickoffDate(b && b.kickoff);
      if (!aKick && !bKick) return 0;
      if (!aKick) return 1;
      if (!bKick) return -1;
      return aKick.getTime() - bKick.getTime();
    });
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

  function flattenMatchesByDate(matchesByDate) {
    var all = [];
    if (!matchesByDate || typeof matchesByDate !== 'object') return all;
    $.each(Object.keys(matchesByDate).sort(), function (_, dateKey) {
      var day = matchesByDate[dateKey];
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
    var matches = sortMatches(flattenMatchesByDate(res.matches_by_date));
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

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* stream-match.js */
(function(window, $, jQuery, Hls, Swiper) {
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
  // Server-side proxy keeps X-API-Key off the browser.
  // Public: GET /api/dv2-streaming-plugin/matches?id={matchId}
  var PROXY_BASE =
    typeof window.DV2_PROXY_API_BASE !== 'undefined' && window.DV2_PROXY_API_BASE
      ? String(window.DV2_PROXY_API_BASE).replace(/\/+$/, '')
      : '/api/dv2-streaming-plugin';
  var MATCHES_API = PROXY_BASE + '/matches';
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
      url: MATCHES_API,
      method: 'GET',
      data: { id: matchId },
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

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

/* top-commentators.js */
(function(window, $, jQuery, Hls, Swiper) {
/**
 * LuongSon Sport — Top bình luận viên (jQuery)
 * Load from API + infinite horizontal ticker + Follow button toggle
 */
(function ($) {
  'use strict';

  var MOBILE_MQ = '(max-width: 809.98px)';
  // Server-side proxy keeps X-API-Key off the browser.
  // Public: GET /api/dv2-streaming-plugin/commentators
  var PROXY_BASE =
    typeof window.DV2_PROXY_API_BASE !== 'undefined' && window.DV2_PROXY_API_BASE
      ? String(window.DV2_PROXY_API_BASE).replace(/\/+$/, '')
      : '/api/dv2-streaming-plugin';
  var COMMENTATORS_API = PROXY_BASE + '/commentators';
  var CARD_VARIANTS = ['is-blue', 'is-teal', 'is-green'];

  function getFallbackAvatar() {
    if (window.LuongsonImageFallback && window.LuongsonImageFallback.getDefaultImgUrl) {
      return window.LuongsonImageFallback.getDefaultImgUrl();
    }

    var pluginUrl =
      (typeof window.DV2_STREAMING_PLUGIN_URL !== 'undefined' && window.DV2_STREAMING_PLUGIN_URL) ||
      (window.dv2Streaming && window.dv2Streaming.pluginUrl) ||
      '';

    if (pluginUrl && pluginUrl.slice(-1) !== '/') {
      pluginUrl += '/';
    }

    return pluginUrl
      ? pluginUrl + 'assets/images/default-img.png'
      : '../../assets/images/default-img.png';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var RATING_OPTIONS = [
    { stars: '4.8', followers: '2.4K' },
    { stars: '4.9', followers: '3K' },
    { stars: '5.0', followers: '5K' },
  ];

  function formatMeta() {
    var pick = RATING_OPTIONS[Math.floor(Math.random() * RATING_OPTIONS.length)];
    return '★ ' + pick.stars + ' · ' + pick.followers + ' người theo dõi';
  }

  function buildCommentatorCard(blv, index) {
    var name = blv && blv.name ? String(blv.name) : 'Bình luận viên';
    var avatar = (blv && blv.avatar) || getFallbackAvatar();
    var meta = formatMeta();
    var variant = CARD_VARIANTS[index % CARD_VARIANTS.length];
    var id = blv && blv.id != null ? String(blv.id) : '';

    return (
      '<div class="luongson-commentator-card ' +
      variant +
      '"' +
      (id ? ' data-id="' + escapeHtml(id) + '"' : '') +
      '>' +
      '<div class="luongson-commentator-avatar" data-border="true">' +
      '<div class="luongson-commentator-avatar__media">' +
      '<img alt="' +
      escapeHtml(name) +
      '" decoding="async" draggable="false" height="360" loading="lazy" src="' +
      escapeHtml(avatar) +
      '" width="240" />' +
      '</div>' +
      '</div>' +
      '<div class="luongson-commentator-info">' +
      '<div class="luongson-commentator-info__name"><p>' +
      escapeHtml(name) +
      '</p></div>' +
      '<div class="luongson-commentator-info__meta"><p>' +
      escapeHtml(meta) +
      '</p></div>' +
      '</div>' +
      '<button type="button" class="luongson-commentator-follow-btn" data-framer-name="Follow Button">' +
      '<span class="luongson-commentator-follow-btn__label">♥️ Follow</span>' +
      '</button>' +
      '</div>'
    );
  }

  function createCommentatorsTicker(container) {
    var $container = $(container);
    var $track = $container.find('.luongson-commentators-track').first();
    if (!$track.length || $track.data('lsSportTickerInit')) return;
    $track.data('lsSportTickerInit', true);

    var $originalChildren = $track.children().filter(function () {
      return !$(this).hasClass('clone-item') && $(this).attr('aria-hidden') !== 'true';
    });

    if (!$originalChildren.length) return;

    $track.children().each(function () {
      var $child = $(this);
      if ($child.hasClass('clone-item') || $child.attr('aria-hidden') === 'true') {
        $child.remove();
      }
    });

    $originalChildren.each(function () {
      $(this).addClass('ticker-item');
    });

    var speed = 35;
    var direction = -1;
    var singleSetWidth = 0;
    var currentX = 0;
    var isHovered = false;
    var isDragging = false;
    var startX = 0;
    var dragStartX = 0;
    var dragDistance = 0;
    var lastTimestamp = null;
    var rafId = null;
    var disabled = false;

    function clearInlineCardSizes() {
      $originalChildren.each(function () {
        this.style.removeProperty('width');
        this.style.removeProperty('flex');
        this.style.removeProperty('min-width');
        this.style.removeProperty('max-width');
      });
      $track.get(0).style.removeProperty('transform');
      singleSetWidth = 0;
      currentX = 0;
    }

    function buildClones() {
      $track.find('.clone-item').remove();

      if (!$originalChildren.length) return;

      if (window.matchMedia(MOBILE_MQ).matches) {
        disabled = true;
        clearInlineCardSizes();
        return;
      }

      disabled = false;

      var containerWidth = $container.outerWidth() || $(window).width();
      var computedStyle = window.getComputedStyle($track.get(0));
      var gap = parseFloat(computedStyle.gap) || parseFloat(computedStyle.columnGap) || 10;

      if (containerWidth > 0) {
        var cols = containerWidth >= 1024 ? 3 : containerWidth >= 640 ? 2 : 1;
        var cardWidth = Math.floor((containerWidth - (cols - 1) * gap) / cols);
        $originalChildren.each(function () {
          this.style.setProperty('width', cardWidth + 'px', 'important');
          this.style.setProperty('flex', '0 0 ' + cardWidth + 'px', 'important');
          this.style.setProperty('min-width', cardWidth + 'px', 'important');
          this.style.setProperty('max-width', cardWidth + 'px', 'important');
        });
      }

      var firstChild = $originalChildren.get(0);
      var lastChild = $originalChildren.get($originalChildren.length - 1);
      var firstRect = firstChild.getBoundingClientRect();
      var lastRect = lastChild.getBoundingClientRect();
      var gapVal = gap;

      if (firstRect.width > 0 && lastRect.right - firstRect.left > 0) {
        singleSetWidth = lastRect.right - firstRect.left + gapVal;
      } else {
        singleSetWidth = lastChild.offsetLeft + lastChild.offsetWidth - firstChild.offsetLeft + gapVal;
      }

      if (singleSetWidth <= 0 || isNaN(singleSetWidth)) {
        singleSetWidth = $originalChildren.toArray().reduce(function (acc, el) {
          return acc + (el.offsetWidth || 280) + gapVal;
        }, 0);
      }

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

    function animate(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      var dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;

      if (!disabled && !isHovered && !isDragging && singleSetWidth > 0) {
        currentX += direction * speed * dt;
        if (direction < 0) {
          while (currentX <= -singleSetWidth) {
            currentX += singleSetWidth;
          }
        } else {
          while (currentX >= 0) {
            currentX -= singleSetWidth;
          }
        }
        $track.get(0).style.setProperty('transform', 'translate3d(' + currentX + 'px, 0, 0)', 'important');
      }

      rafId = requestAnimationFrame(animate);
    }

    $container.on('mouseenter', function () {
      isHovered = true;
    });
    $container.on('mouseleave', function () {
      isHovered = false;
      lastTimestamp = null;
    });

    function pointerClientX(e) {
      var oe = e.originalEvent || e;
      if (oe.touches && oe.touches.length) return oe.touches[0].clientX;
      if (oe.changedTouches && oe.changedTouches.length) return oe.changedTouches[0].clientX;
      return e.clientX;
    }

    function onPointerDown(e) {
      if (disabled) return;
      if ($(e.target).closest('.luongson-commentator-follow-btn').length) return;
      isDragging = true;
      dragDistance = 0;
      startX = pointerClientX(e);
      dragStartX = currentX;
      $track.css('cursor', 'grabbing');
    }

    function onPointerMove(e) {
      if (!isDragging || disabled) return;
      var clientX = pointerClientX(e);
      var dx = clientX - startX;
      dragDistance = Math.abs(dx);
      currentX = dragStartX + dx;
      $track.get(0).style.setProperty('transform', 'translate3d(' + currentX + 'px, 0, 0)', 'important');
      var oe = e.originalEvent || e;
      if (oe.cancelable && String(e.type || '').indexOf('touch') === 0) {
        e.preventDefault();
      }
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      $track.css('cursor', '');
      lastTimestamp = null;

      if (singleSetWidth > 0) {
        while (currentX <= -singleSetWidth) currentX += singleSetWidth;
        while (currentX > 0) currentX -= singleSetWidth;
      }
    }

    var trackEl = $track.get(0);

    $track.on('mousedown', onPointerDown);
    $(window).on('mousemove.lsCommentatorsTicker', onPointerMove);
    $(window).on('mouseup.lsCommentatorsTicker', onPointerUp);

    // Native listeners keep passive:false so touch drag can call preventDefault.
    trackEl.addEventListener('touchstart', function (e) {
      onPointerDown($.event.fix(e));
    }, { passive: true });
    trackEl.addEventListener('touchmove', function (e) {
      onPointerMove($.event.fix(e));
    }, { passive: false });
    trackEl.addEventListener('touchend', function (e) {
      onPointerUp($.event.fix(e));
    });

    trackEl.addEventListener(
      'click',
      function (e) {
        if (dragDistance > 6) {
          e.preventDefault();
          e.stopPropagation();
        }
        dragDistance = 0;
      },
      true
    );

    var resizeTimer = null;
    $(window).on('resize.lsCommentatorsTicker', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildClones();
        lastTimestamp = null;
      }, 150);
    });

    $(document).on('visibilitychange.lsCommentatorsTicker', function () {
      if (document.hidden) {
        lastTimestamp = null;
      }
    });

    buildClones();
    rafId = requestAnimationFrame(animate);

    return function destroy() {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }

  function initFollowButtons() {
    if ($(document).data('lsSportFollowInit')) return;
    $(document).data('lsSportFollowInit', true);

    $(document).on(
      'click.lsSportFollow',
      '.luongson-top-commentators .luongson-commentator-follow-btn, .luongson-top-commentators [data-framer-name="Follow Button"]',
      function (e) {
        e.preventDefault();
        e.stopPropagation();

        var $btn = $(this);
        var isFollowed = $btn.toggleClass('followed').hasClass('followed');
        var $textEl = $btn.find('.luongson-commentator-follow-btn__label, p, span').first();
        if ($textEl.length) {
          $textEl.text(isFollowed ? '♥️ Đã theo dõi' : '♥️ Follow');
        }
      }
    );
  }

  function initTickers() {
    $('.luongson-top-commentators .luongson-commentators-list').each(function () {
      createCommentatorsTicker(this);
    });
  }

  function renderCommentators(commentators) {
    var $tracks = $('.luongson-top-commentators .luongson-commentators-track');
    if (!$tracks.length) return;

    var html = $.map(commentators, function (blv, index) {
      return buildCommentatorCard(blv, index);
    }).join('');

    $tracks.html(html);

    initTickers();
    initFollowButtons();
  }

  function showTrackMessage(message) {
    $('.luongson-top-commentators .luongson-commentators-track').html(
      '<div class="luongson-commentators-empty" style="padding:24px 12px;text-align:center;color:#666;width:100%;">' +
        escapeHtml(message) +
        '</div>'
    );
  }

  function loadCommentators() {
    showTrackMessage('Đang tải danh sách bình luận viên...');

    $.ajax({
      url: COMMENTATORS_API,
      method: 'GET',
      dataType: 'json',
    })
      .done(function (data) {
        if (!data || data.message !== 'success' || !Array.isArray(data.commentators)) {
          showTrackMessage('Không có dữ liệu bình luận viên');
          return;
        }
        if (!data.commentators.length) {
          showTrackMessage('Không có bình luận viên nào');
          return;
        }
        renderCommentators(data.commentators);
      })
      .fail(function () {
        showTrackMessage('Lỗi khi tải danh sách bình luận viên');
      });
  }

  function initAll() {
    if (!$('.luongson-top-commentators .luongson-commentators-track').length) {
      return;
    }
    loadCommentators();
  }

  $(initAll);
})(jQuery);

})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);

