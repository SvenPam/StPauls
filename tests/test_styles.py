import colorsys
import re
import unittest

from helpers import REPO

TOKENS = REPO / "site/assets/css/10-tokens.css"


def luminance(c: str) -> float:
    def channel(v: int) -> float:
        s = v / 255
        return s / 12.92 if s <= 0.04045 else ((s + 0.055) / 1.055) ** 2.4
    r, g, b = (int(c[i:i + 2], 16) for i in (1, 3, 5))
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)


def contrast(a: str, b: str) -> float:
    """WCAG 2.2 contrast ratio of two #rrggbb colours."""
    hi, lo = sorted((luminance(a), luminance(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def tokens() -> dict[str, str]:
    """--name: #rrggbb pairs from 10-tokens.css, lower case, 3-digit hex expanded."""
    out = {}
    for name, value in re.findall(r"(--[\w-]+)\s*:\s*#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b", TOKENS.read_text()):
        value = value.lower()
        if len(value) == 3:
            value = "".join(ch * 2 for ch in value)
        out[name] = "#" + value
    return out


def lighten(c: str, points: float) -> str:
    """Raise HSL lightness by the given percentage points."""
    r, g, b = (int(c[i:i + 2], 16) / 255 for i in (1, 3, 5))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    r, g, b = colorsys.hls_to_rgb(h, min(1.0, l + points / 100), s)
    return "#" + "".join(f"{round(v * 255):02x}" for v in (r, g, b))


class TokenTests(unittest.TestCase):
    def test_live_palette_kept(self):
        t = tokens()
        self.assertEqual(t["--navy"], "#002060")
        self.assertEqual(t["--gold"], "#c8a85a")
        self.assertEqual(t["--page"], "#fdfdf7")
        self.assertEqual(t["--footer-bg"], "#0c0c0e")

    def test_token_contrast(self):
        t = tokens()
        pairs = [("--text", "--page", 4.5), ("--text", "--surface", 4.5),
                 ("--gold-text", "--page", 4.5), ("--gold-text", "--surface", 4.5),
                 ("--muted", "--surface", 4.5), ("--muted", "--page", 4.5), ("--date", "--surface", 4.5),
                 ("--date", "--page", 4.5), ("--nav-text", "--navy", 4.5),
                 ("--gold", "--navy", 4.5), ("--footer-text", "--footer-bg", 4.5),
                 ("--gold", "--footer-bg", 4.5), ("--navy", "--page", 4.5)]
        for fg, bg, need in pairs:
            self.assertGreaterEqual(round(contrast(t[fg], t[bg]), 2), need, f"{fg} on {bg}")

    def test_gold_text_is_as_close_to_live_as_allowed(self):
        # Darkened only as far as needed: one step lighter would fail on the page colour.
        t = tokens()
        self.assertLess(contrast(lighten(t["--gold-text"], 2), t["--page"]), 4.5)

    def test_date_is_as_close_to_live_as_allowed(self):
        t = tokens()
        self.assertLess(contrast(lighten(t["--date"], 2), t["--surface"]), 4.5)


class FocusTests(unittest.TestCase):
    def test_main_focus_outline_is_visible(self):
        # WCAG 1.4.11: the default outline needs 3:1 on the page and on cards.
        base = (REPO / "site/assets/css/20-base.css").read_text()
        colour = re.search(r":focus-visible\s*\{[^}]*outline:[^;}]*var\((--[\w-]+)\)", base).group(1)
        t = tokens()
        for bg in ("--page", "--surface", "--panel"):
            self.assertGreaterEqual(contrast(t[colour], t[bg]), 3, f"{colour} on {bg}")

    def test_card_hover_keeps_text_contrast(self):
        # Dates and links on a card are checked on --surface, so hover must not change the background.
        css = (REPO / "site/assets/css/50-components.css").read_text()
        rule = re.search(r"\.card:hover[^{]*\{([^}]*)\}", css).group(1)
        self.assertNotIn("background", rule)

    def test_dropdown_closes_when_focus_leaves(self):
        # An open desktop dropdown would cover the content focus moves to.
        js = (REPO / "site/assets/js/site.js").read_text()
        self.assertIn("focusout", js)
        self.assertIn("relatedTarget", js)


if __name__ == "__main__":
    unittest.main()
