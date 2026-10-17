import re
import unittest

from helpers import REPO

WF = (REPO / ".github/workflows/deploy.yml").read_text()


class DeployWorkflowTests(unittest.TestCase):
    def test_oidc_only(self):
        self.assertIn("id-token: write", WF)
        self.assertIn("contents: read", WF)
        self.assertIn("uses: azure/login@v3", WF)
        for s in ("creds:", "client-secret", "AZURE_CREDENTIALS", "secrets.AZURE_STATIC_WEB_APPS"):
            self.assertNotIn(s, WF)
        self.assertNotRegex(WF, r"(?m)^\s+environment:")

    def test_secret_and_variable_names(self):
        used = set(re.findall(r"\$\{\{\s*(?:secrets|vars)\.(\w+)", WF))
        self.assertEqual(used, {"AZURE_CLIENT_ID", "AZURE_TENANT_ID",
                                "AZURE_SUBSCRIPTION_ID", "AZURE_RESOURCE_GROUP"})

    def test_token_is_masked_before_it_is_output(self):
        self.assertLess(WF.index('echo "::add-mask::$token"'),
                        WF.index('echo "token=$token" >> "$GITHUB_OUTPUT"'))

    def test_tests_and_build_run_before_deploy(self):
        self.assertIn("HUGO_VERSION: 0.167.0", WF)
        steps = ["python3 -m unittest discover -s tests", "hugo --source site --minify",
                 "uses: azure/login@v3", "uses: Azure/static-web-apps-deploy@v1"]
        pos = [WF.index(s) for s in steps]
        self.assertEqual(pos, sorted(pos))

    def test_triggers_and_concurrency(self):
        for p in ("'site/**'", "'infra/**'", "'.pages.yml'", "'.github/workflows/deploy.yml'"):
            self.assertIn(p, WF)
        self.assertIn("workflow_dispatch:", WF)
        self.assertIn("cancel-in-progress: false", WF)

    def test_uploads_prebuilt_site(self):
        self.assertIn("app_location: site/public", WF)
        self.assertIn("skip_app_build: true", WF)


if __name__ == "__main__":
    unittest.main()
