"""Shared helpers for the site tests. Standard library only."""

import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
FIXTURES = REPO / "tests" / "fixtures"

BANNED = [
    "stephen pammenter",
    "ste-pam.com",
    "linkedin.com",
    "licdn.com",
    "ua-68397826",
    "google-analytics.com",
    "googletagmanager.com",
    "disqus",
]


def build_site(dest: Path, content_dir: Path | None = None, *,
               minify: bool = False, strict: bool = True) -> None:
    """Build the Hugo site into dest. Raises AssertionError if Hugo fails."""
    cmd = ["hugo", "--source", str(REPO / "site"),
           "--destination", str(Path(dest).resolve()), "--quiet"]
    if content_dir is not None:
        cmd += ["--contentDir", str(Path(content_dir).resolve())]
    if minify:
        cmd.append("--minify")
    if strict:
        cmd.append("--panicOnWarning")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise AssertionError(f"hugo failed ({result.returncode}):\n{result.stderr}")


def find_banned(out: Path) -> list[str]:
    """Return '<relative path>: <term>' for every banned term in the built site."""
    hits = []
    for f in sorted(Path(out).rglob("*")):
        if f.suffix in {".html", ".css", ".js", ".json", ".xml"} and f.is_file():
            text = f.read_text(encoding="utf-8-sig").lower()
            hits += [f"{f.relative_to(out)}: {b}" for b in BANNED if b in text]
    return hits
