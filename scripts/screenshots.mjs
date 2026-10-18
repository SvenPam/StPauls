#!/usr/bin/env node
// Full-page screenshots of live and new pages, side by side, for sign-off.
// Sandbox only, never run in CI. Uses @playwright/test's Chromium (npm ci first):
//
//   node scripts/screenshots.mjs --out shots --width 390 --width 1280 \
//     live-notices=http://stpaulswarton.co.uk/notices \
//     new-notices=http://localhost:8080/notices/
//
// Writes <out>/<name>-<width>.png for every page and width. In the sandbox Chromium is found
// in /opt/pw-browsers through PLAYWRIGHT_BROWSERS_PATH; --chromium names another executable.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';

function usage(message) {
  console.error(`${message}\nUsage: node scripts/screenshots.mjs --out <dir> --width <px> [--width <px> ...] [--height <px>] [--chromium <path>] <name>=<url> ...`);
  return 2;
}

function parsePage(arg) {
  const at = arg.indexOf('=');
  const name = at > 0 ? arg.slice(0, at) : '';
  const url = at > 0 ? arg.slice(at + 1) : '';
  return name && /^https?:\/\//.test(url) ? { name, url } : null;
}

async function main() {
  let args;
  try {
    args = parseArgs({
      allowPositionals: true,
      options: {
        out: { type: 'string' },
        width: { type: 'string', multiple: true },
        height: { type: 'string', default: '800' },
        chromium: { type: 'string' },
      },
    });
  } catch (err) {
    return usage(err.message);
  }
  const { out, width = [], height, chromium: executablePath } = args.values;
  const widths = width.map(Number);
  const pages = args.positionals.map(parsePage);
  if (!out) return usage('--out is required');
  if (!widths.length || widths.some((w) => !Number.isInteger(w) || w < 1)) return usage('--width needs a whole number of CSS pixels, repeat for several');
  if (!Number.isInteger(Number(height)) || Number(height) < 1) return usage('--height needs a whole number of CSS pixels');
  if (!pages.length) return usage('at least one name=url is required');
  const bad = args.positionals.find((_, i) => !pages[i]);
  if (bad) return usage(`expected name=url, got ${JSON.stringify(bad)}`);

  await mkdir(out, { recursive: true });
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  try {
    for (const w of widths) {
      const page = await browser.newPage({ viewport: { width: w, height: Number(height) } });
      for (const { name, url } of pages) {
        await page.goto(url, { waitUntil: 'networkidle' });
        const file = path.join(out, `${name}-${w}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(file);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return 0;
}

process.exitCode = await main();
