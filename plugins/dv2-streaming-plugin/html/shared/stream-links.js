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
