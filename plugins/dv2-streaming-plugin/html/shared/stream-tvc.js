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
