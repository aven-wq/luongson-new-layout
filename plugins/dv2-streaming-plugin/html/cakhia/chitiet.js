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