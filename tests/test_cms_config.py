import re
import unittest

from helpers import REPO

CFG = (REPO / ".pages.yml").read_text()


class PagesCmsConfigTests(unittest.TestCase):
    """Plain text checks: the CI runner has no guaranteed YAML library."""

    def test_media_maps_to_hugo_static(self):
        self.assertRegex(CFG, r"(?m)^\s+input: site/static/uploads$")
        self.assertRegex(CFG, r"(?m)^\s+output: /uploads$")
        self.assertTrue((REPO / "site/static/uploads").is_dir())

    def test_notices_collection(self):
        self.assertRegex(CFG, r"(?m)^\s+path: site/content/notices$")
        self.assertRegex(CFG, r'(?m)^\s+filename: "\{primary\}\.md"$')

    def test_index_file_excluded(self):
        self.assertRegex(CFG, r"(?m)^\s+exclude: \[_index\.md\]$")

    def test_field_names_match_content_model(self):
        names = set(re.findall(r"(?m)^\s*- name: (\S+)$", CFG))
        self.assertEqual(names, {"notices", "title", "date", "summary", "location", "body"})


if __name__ == "__main__":
    unittest.main()
