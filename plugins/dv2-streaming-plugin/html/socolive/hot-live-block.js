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
