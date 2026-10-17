import json
import re
import tempfile
import unittest
from pathlib import Path

from helpers import build_site, find_banned


class LayoutTests(unittest.TestCase):
    """Every page shares baseof.html, so the 404 page carries the layout checks."""

    @classmethod
    def setUpClass(cls):
        cls._tmp = tempfile.TemporaryDirectory()
        cls.out = Path(cls._tmp.name) / "public"
        empty = Path(cls._tmp.name) / "content"
        empty.mkdir()
        build_site(cls.out, content_dir=empty)
        cls.page = (cls.out / "404.html").read_text(encoding="utf-8")

    @classmethod
    def tearDownClass(cls):
        cls._tmp.cleanup()

    def test_single_bundled_stylesheet(self):
        links = re.findall(r'<link rel="stylesheet" href="([^"]+)" integrity="sha256-[^"]+"', self.page)
        self.assertEqual(len(links), 1)
        self.assertRegex(links[0], r"^/css/site\.min\.[0-9a-f]{64}\.css$")
        self.assertNotIn("/Content/", self.page)
        self.assertFalse((self.out / "Content").exists())
        self.assertTrue((self.out / "favicon.ico").is_file())

    def test_css_budget(self):
        css = next((self.out / "css").glob("site.min.*.css"))
        self.assertLess(css.stat().st_size, 25_000)

    def test_content_cannot_overflow(self):
        css = next((self.out / "css").glob("site.min.*.css")).read_text()
        for sel in (".prose img", ".prose iframe", ".prose video", ".prose table"):
            self.assertIn(sel, css)
        self.assertRegex(css, r"\.prose img[^{]*\{[^}]*max-width:100%")
        self.assertRegex(css, r"\.prose img[^{]*\{[^}]*height:auto")

    def test_focus_is_never_hidden(self):
        css = next((self.out / "css").glob("site.min.*.css")).read_text()
        self.assertNotRegex(css, r":focus[^{]*\{[^}]*outline:(none|0)[;}]")
        self.assertIn(":focus-visible", css)

    def test_header_and_footer(self):
        self.assertIn('class="navbar-brand"', self.page)
        self.assertIn('href="/notices/"', self.page)
        self.assertIn("PR4 1BD", self.page)
        self.assertIn("https://www.facebook.com/stpaulswarton", self.page)

    def test_not_found_page(self):
        self.assertIn("Page Not Found", self.page)
        self.assertNotIn("linkhelp.clients.google.com", self.page)

    def test_no_personal_details_or_trackers(self):
        self.assertEqual(find_banned(self.out), [])

    def test_root_has_index_page(self):
        # Azure/static-web-apps-deploy refuses a folder with no index.html at its root.
        self.assertTrue((self.out / "index.html").is_file())
        self.assertIn('href="/notices/"', (self.out / "index.html").read_text(encoding="utf-8"))

    def test_swa_config(self):
        cfg = json.loads((self.out / "staticwebapp.config.json").read_text())
        self.assertEqual(cfg["responseOverrides"]["404"], {"rewrite": "/404.html", "statusCode": 404})
        self.assertIn({"route": "/", "redirect": "/notices/", "statusCode": 302}, cfg["routes"])


if __name__ == "__main__":
    unittest.main()
