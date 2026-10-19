// Writes staticwebapp.config.json for Azure Static Web Apps after each build. Compact, because Azure caps it at 20 KB.
// Routes come from site/data/legacy.yaml plus one redirect per legacy upload file and prefix,
// because Static Web Apps redirects cannot use captures. Routes are decoded, targets encoded.
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readData } from './data.js';

// Files under <outDir>/uploads/legacy/ as sorted posix paths relative to it. A missing folder gives none.
async function legacyUploads(outDir) {
  const dir = path.join(outDir, 'uploads/legacy');
  let entries;
  try {
    entries = await readdir(dir, { recursive: true, withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  return entries
    .filter((e) => e.isFile())
    .map((e) => path.relative(dir, path.join(e.parentPath, e.name)).split(path.sep).join('/'))
    .sort();
}

// The CSP. frame-src lists the https host of every embeds.yaml entry, so a new embed type is allowed with it.
// form-action allows the site's own address because Web3Forms redirects there after a post, also from the test URL.
export function contentSecurityPolicy(embeds = {}, siteUrl) {
  const frames = Object.values(embeds).map(({ host }) => `https://${host}`);
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' https: data:",
    "font-src 'self'",
    "connect-src 'self'",
    `frame-src ${frames.join(' ')}`,
    ["form-action 'self'", siteUrl && new URL(siteUrl).origin, 'https://api.web3forms.com'].filter(Boolean).join(' '),
    'upgrade-insecure-requests',
  ].join('; ');
}

// Fingerprinted files are cached for a year. Fonts keep their names, uploads may be replaced under the same name.
// HTML is left to the platform default, so a publish shows within a minute.
const YEAR = 'public, max-age=31536000';
const cacheRoutes = [
  ['/css/*', `${YEAR}, immutable`],
  ['/js/*', `${YEAR}, immutable`],
  ['/images/*', `${YEAR}, immutable`],
  ['/fonts/*', YEAR],
  ['/uploads/*', 'public, max-age=86400'],
].map(([route, cache]) => ({ route, headers: { 'Cache-Control': cache } }));

export async function buildSwaConfig(outDir = '_site', data = readData()) {
  const legacy = data.legacy ?? {};
  const uploads = await legacyUploads(outDir);
  const routes = [
    ...cacheRoutes,
    ...(legacy.rewrites ?? []).map(({ from, to }) => ({ route: from, rewrite: to })),
    ...(legacy.redirects ?? []).map(({ from, to }) => ({ route: from, redirect: to, statusCode: 301 })),
    ...(legacy.editor?.routes ?? []).map((route) => ({ route, redirect: legacy.editor.url, statusCode: 302 })),
    ...uploads.flatMap((file) =>
      (legacy.upload_prefixes ?? []).map((prefix) => ({
        route: `${prefix}/${file}`,
        redirect: `/uploads/legacy/${file.split('/').map(encodeURIComponent).join('/')}`,
        statusCode: 301,
      })),
    ),
  ];
  const globalHeaders = {
    'Content-Security-Policy': contentSecurityPolicy(data.embeds, data.site?.url),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
    'X-Frame-Options': 'DENY',
    'Cross-Origin-Opener-Policy': 'same-origin',
  };
  if (data.site?.hsts_max_age) globalHeaders['Strict-Transport-Security'] = `max-age=${data.site.hsts_max_age}`;
  const config = {
    trailingSlash: 'never',
    globalHeaders,
    routes,
    responseOverrides: {
      404: { rewrite: '/404.html', statusCode: 404 },
    },
  };
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'staticwebapp.config.json'), `${JSON.stringify(config)}\n`);
  return config;
}

export default function (eleventyConfig) {
  eleventyConfig.on('eleventy.after', async ({ directories }) => {
    await buildSwaConfig(directories?.output ?? '_site');
  });
}
