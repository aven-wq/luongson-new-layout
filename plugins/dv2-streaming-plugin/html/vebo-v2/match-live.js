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
