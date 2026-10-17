import re
import unittest

from helpers import REPO

WF = (REPO / ".github/workflows/deploy.yml").read_text()
DOC = (REPO / "docs/features/page-cms/page-cms-how-to-set-up-azure-and-pages-cms.md").read_text(encoding="utf-8")


class SetupHowToTests(unittest.TestCase):
    def test_mentions_every_secret_and_variable(self):
        for name in set(re.findall(r"\$\{\{\s*(?:secrets|vars)\.(\w+)", WF)):
            self.assertIn(name, DOC)

    def test_federated_subject_is_exact(self):
        # GitHub sends owner and repo with their numeric IDs (seen in the first deploy run).
        self.assertIn("repo:SvenPam@3789646/StPauls@1423163125:ref:refs/heads/main", DOC)
        self.assertNotIn("repo:SvenPam/StPauls:", DOC)

    def test_no_em_dash(self):
        self.assertNotIn("—", DOC)


DNS = REPO / "docs/features/page-cms/page-cms-how-to-move-dns-to-cloudflare.md"


class DnsHowToTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = DNS.read_text(encoding="utf-8")

    def test_front_matter_and_title(self):
        self.assertTrue(self.doc.startswith("---\n"))
        self.assertIn("tags: [how-to, stpauls, dns]", self.doc)
        self.assertEqual(len(re.findall(r"(?m)^# ", self.doc)), 1)

    def test_no_em_dash(self):
        self.assertNotIn("—", self.doc)

    def test_records_table(self):
        self.assertIn("## Current records", self.doc)
        self.assertIn("| Type | Name | Value | TTL | Notes |", self.doc)

    def test_mail_records_are_checked(self):
        for name in ("MX", "_dmarc.stpaulswarton.co.uk", "SPF", "DKIM"):
            self.assertIn(name, self.doc)

    def test_asuid_records_are_checked(self):
        self.assertIn("asuid.stpaulswarton.co.uk", self.doc)
        self.assertIn("asuid.www.stpaulswarton.co.uk", self.doc)

    def test_rollback_uses_recorded_nameservers(self):
        self.assertIn("## Roll back", self.doc)
        self.assertRegex(self.doc, r"(?s)## Roll back.*old nameservers")

    def section(self, heading):
        return self.doc.split(f"\n## {heading}\n", 1)[1].split("\n## ", 1)[0]

    def test_rollback_restores_missing_registrar_records(self):
        # Many registrars clear their zone when custom nameservers are set.
        rb = self.section("Roll back")
        self.assertIn("re-enter", rb)
        self.assertIn("records table", rb)

    def test_scan_extras_are_checked_not_deleted(self):
        zone = self.section("Create the Cloudflare zone")
        self.assertNotIn("Delete anything the scan added", zone)
        self.assertIn("@<old nameserver>", zone)
        self.assertIn("registrar's own record list", self.section("Change the nameservers"))

    def test_pending_zone_can_be_removed(self):
        self.assertIn("pending too long", self.section("Create the Cloudflare zone"))
        self.assertNotIn("stay pending until you try again", self.doc)

    def test_records_stay_dns_only(self):
        self.assertIn("DNS only", self.doc)
        for line in self.doc.splitlines():
            if "Proxied" in line or "orange cloud" in line:
                self.assertRegex(line, r"(?i)\b(not|don't|do not)\b", line)

    def test_message_has_no_personal_details(self):
        msg = self.doc.split("## Message to the church", 1)[1].split("\n## ", 1)[0]
        self.assertLess(len(msg.split()), 170)
        for term in ("pammenter", "ste-pam", "linkedin", "@"):
            self.assertNotIn(term, msg.lower())
        self.assertIn("[name]", msg)


if __name__ == "__main__":
    unittest.main()
