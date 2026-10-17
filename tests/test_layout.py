import json
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

    def test_page_uses_legacy_css(self):
        self.assertIn('href="/Content/bootstrap.css"', self.page)
        self.assertIn('href="/Content/Site.css"', self.page)
        for f in ["Content/bootstrap.css", "Content/Site.css", "Content/Image/map.png",
                  "Content/Image/social-sprites.png", "fonts/muli.woff2"]:
            self.assertTrue((self.out / f).is_file(), f)

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
