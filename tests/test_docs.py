import re
import unittest

from helpers import REPO

WF = (REPO / ".github/workflows/deploy.yml").read_text()
DOC = (REPO / "docs/how-to-set-up-azure-and-pages-cms.md").read_text(encoding="utf-8")


class SetupHowToTests(unittest.TestCase):
    def test_mentions_every_secret_and_variable(self):
        for name in set(re.findall(r"\$\{\{\s*(?:secrets|vars)\.(\w+)", WF)):
            self.assertIn(name, DOC)

    def test_federated_subject_is_exact(self):
        self.assertIn("repo:SvenPam/StPauls:ref:refs/heads/main", DOC)

    def test_no_em_dash(self):
        self.assertNotIn("—", DOC)


if __name__ == "__main__":
    unittest.main()
