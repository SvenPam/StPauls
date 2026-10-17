import tempfile
import unittest
from pathlib import Path

from helpers import FIXTURES, build_site, find_banned


class NoticesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._tmp = tempfile.TemporaryDirectory()
        cls.out = Path(cls._tmp.name)
        build_site(cls.out, FIXTURES / "content")
        read = lambda p: (cls.out / p).read_text(encoding="utf-8")
        cls.list = read("notices/index.html")
        cls.newer = read("notices/newer/index.html")
        cls.older = read("notices/older/index.html")

    @classmethod
    def tearDownClass(cls):
        cls._tmp.cleanup()

    def test_list_is_newest_first(self):
        i = [self.list.index(t) for t in ("Fixture future", "Fixture newer", "Fixture older")]
        self.assertEqual(i, sorted(i))

    def test_list_links_and_dates(self):
        self.assertIn('href="/notices/newer"', self.list)
        self.assertIn("01-Feb-26", self.list)

    def test_summary_only_when_set(self):
        self.assertEqual(self.list.count('class="notice-summary"'), 2)
        self.assertIn("Newer summary", self.list)
        self.assertNotIn("Older body", self.list)

    def test_location_only_when_set(self):
        self.assertIn('class="notice-location">Church Hall<', self.newer)
        self.assertNotIn('class="notice-location"', self.older)

    def test_single_shows_title_and_date(self):
        self.assertIn("<h1>Fixture newer</h1>", self.newer)
        self.assertIn("01-Feb-26", self.newer)

    def test_body_html_is_rendered_raw(self):
        self.assertIn('<a href="https://example.org/">a link</a>', self.newer)
        self.assertIn("<li>Item one</li>", self.newer)
        self.assertIn("*stars*", self.newer)
        self.assertNotIn("&lt;p&gt;", self.newer)
        self.assertNotIn("<pre>", self.newer)

    def test_long_text_wraps(self):
        css = next((self.out / "css").glob("site.min.*.css")).read_text()
        self.assertRegex(css, r"\.card__title[^{]*\{[^}]*overflow-wrap:anywhere")
        self.assertRegex(css, r"\.prose[^{]*\{[^}]*overflow-wrap:anywhere")

    def test_list_is_a_card_grid(self):
        notices = len(list((FIXTURES / "content/notices").glob("[!_]*.md")))
        self.assertEqual(self.list.count('<article class="card">'), notices)
        self.assertRegex(self.list, r'class="[^"]*\bcard-grid\b')

    def test_single_body_in_prose(self):
        self.assertRegex(self.newer, r'<div class="prose">\s*<p>First block</p>')

    def test_future_dated_notice_is_published(self):
        self.assertTrue((self.out / "notices/future/index.html").is_file())

    def test_no_personal_details_or_trackers(self):
        self.assertEqual(find_banned(self.out), [])


class EmptyNoticesTests(unittest.TestCase):
    def test_empty_section_message(self):
        with tempfile.TemporaryDirectory() as tmp:
            build_site(Path(tmp), FIXTURES / "empty")
            html = (Path(tmp) / "notices/index.html").read_text(encoding="utf-8")
        self.assertIn("Could not find any notices.", html)


class RealContentTests(unittest.TestCase):
    """Builds whatever Paul has saved, as the pipeline does. Asserts nothing about it."""

    def test_real_content_builds(self):
        with tempfile.TemporaryDirectory() as tmp:
            build_site(Path(tmp), minify=True, strict=False)


if __name__ == "__main__":
    unittest.main()
