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
