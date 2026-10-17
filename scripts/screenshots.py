#!/usr/bin/env python3
"""Full-page screenshots of live and new pages, side by side, for sign-off.

Sandbox only, never run in CI. Needs Playwright for Python and its Chromium:

    python3 scripts/screenshots.py --out shots --width 390 --width 1280 \\
        live-notices=http://stpaulswarton.co.uk/notices \\
        new-notices=http://localhost:8080/notices/

Writes <out>/<name>-<width>.png for every page and width.
"""

import argparse
import sys
from pathlib import Path

SANDBOX_CHROMIUM = Path("/opt/pw-browsers/chromium")


def parse_page(arg: str) -> tuple[str, str]:
    name, sep, url = arg.partition("=")
    if not sep or not name or not url.startswith(("http://", "https://")):
        raise argparse.ArgumentTypeError(f"expected name=url, got {arg!r}")
    return name, url


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", required=True, type=Path, help="folder for the PNG files")
    parser.add_argument("--width", action="append", type=int, required=True,
                        help="viewport width in CSS pixels, repeat for several")
    parser.add_argument("--height", type=int, default=800, help="viewport height (default 800)")
    parser.add_argument("--chromium", type=Path,
                        default=SANDBOX_CHROMIUM if SANDBOX_CHROMIUM.exists() else None,
                        help="Chromium executable (default: the sandbox copy when present)")
    parser.add_argument("pages", nargs="+", type=parse_page, metavar="name=url")
    args = parser.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright is missing. Install it with: pip install playwright "
              "(Chromium is already in /opt/pw-browsers in the sandbox).", file=sys.stderr)
        return 2

    args.out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=str(args.chromium) if args.chromium else None)
        for width in args.width:
            page = browser.new_page(viewport={"width": width, "height": args.height})
            for name, url in args.pages:
                page.goto(url, wait_until="networkidle")
                path = args.out / f"{name}-{width}.png"
                page.screenshot(path=str(path), full_page=True)
                print(path)
            page.close()
        browser.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
