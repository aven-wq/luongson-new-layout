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
