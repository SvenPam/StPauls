import json
import shutil
import subprocess
import unittest

from helpers import REPO


def run(*args: str) -> str:
    result = subprocess.run(args, cwd=REPO, capture_output=True, text=True)
    if result.returncode != 0:
        raise AssertionError(f"{' '.join(args)} failed:\n{result.stdout}{result.stderr}")
    return result.stdout + result.stderr


@unittest.skipUnless(shutil.which("bicep"), "bicep not on PATH (the deploy step compiles it in CI)")
class InfraTests(unittest.TestCase):
    def test_static_web_app(self):
        tpl = json.loads(run("bicep", "build", "infra/main.bicep", "--stdout"))
        res = tpl["resources"]
        res = list(res.values()) if isinstance(res, dict) else res
        self.assertEqual(len(res), 1)
        swa = res[0]
        self.assertEqual(swa["type"], "Microsoft.Web/staticSites")
        self.assertEqual(swa["apiVersion"], "2025-03-01")
        self.assertEqual(swa["sku"], {"name": "Free", "tier": "Free"})
        self.assertEqual(swa["properties"], {"provider": "Custom"})
        self.assertEqual(set(tpl["parameters"]), {"name", "location", "tags"})
        self.assertEqual(tpl["parameters"]["location"]["defaultValue"], "westeurope")
        self.assertEqual(set(tpl["outputs"]), {"name", "defaultHostname"})

    def test_parameter_file(self):
        out = json.loads(run("bicep", "build-params", "infra/main.bicepparam", "--stdout"))
        params = json.loads(out["parametersJson"])["parameters"]
        self.assertEqual(params["name"]["value"], "swa-stpauls-web")

    def test_lint_is_clean(self):
        out = run("bicep", "lint", "infra/main.bicep")
        self.assertNotIn("Warning", out)
        self.assertNotIn("Error", out)


if __name__ == "__main__":
    unittest.main()
