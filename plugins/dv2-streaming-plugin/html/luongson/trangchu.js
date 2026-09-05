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

