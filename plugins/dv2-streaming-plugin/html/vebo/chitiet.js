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