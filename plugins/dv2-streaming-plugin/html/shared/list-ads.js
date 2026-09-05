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
