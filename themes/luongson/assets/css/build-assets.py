#!/usr/bin/env python3
"""Rebuild minified CSS bundles for the LuongSon theme.

Run from theme root:
  python3 assets/css/build-assets.py
"""
from __future__ import annotations

import re
from pathlib import Path

CSS_DIR = Path(__file__).resolve().parent
DIST = CSS_DIR / "dist"

CORE_FILES = [
    "reset.css",
    "global.css",
    "components.css",
    "responsive.css",
    "animations.css",
    "luongson-overrides.css",
    "custom.css",
]

CONDITIONAL = ["blog.css", "nha-cai-uy-tin.css", "blv-form.css"]


def minify_css(css: str) -> str:
    css = re.sub(r"/\*[^*]*\*+(?:[^/*][^*]*\*+)*/", "", css)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r"\s*([{}:;,>~+])\s*", r"\1", css)
    css = re.sub(r";}", "}", css)
    return css.strip()


def rewrite_urls_for_dist(css: str) -> str:
    """assets/css/*.css uses ../fonts; dist/ needs ../../fonts."""
    return css.replace("../fonts/", "../../fonts/")


def main() -> None:
    DIST.mkdir(exist_ok=True)

    parts = [(CSS_DIR / name).read_text(encoding="utf-8") for name in CORE_FILES]
    core_min = minify_css(rewrite_urls_for_dist("\n".join(parts)))
    out = DIST / "luongson-core.min.css"
    out.write_text(core_min, encoding="utf-8")
    print(f"Wrote {out} ({len(core_min)} bytes)")

    for name in CONDITIONAL:
        src = CSS_DIR / name
        if not src.exists():
            continue
        dest = DIST / name.replace(".css", ".min.css")
        data = minify_css(rewrite_urls_for_dist(src.read_text(encoding="utf-8")))
        dest.write_text(data, encoding="utf-8")
        print(f"Wrote {dest} ({len(data)} bytes)")


if __name__ == "__main__":
    main()
