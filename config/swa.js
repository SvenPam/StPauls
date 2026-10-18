// Writes staticwebapp.config.json for Azure Static Web Apps after each build.
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

export async function buildSwaConfig(outDir = '_site', data = readData()) {
  const legacy = data.legacy ?? {};
  const uploads = await legacyUploads(outDir);
  const routes = [
    ...(legacy.rewrites ?? []).map(({ from, to }) => ({ route: from, rewrite: to })),
    ...(legacy.redirects ?? []).map(({ from, to }) => ({ route: from, redirect: to, statusCode: 301 })),
    ...uploads.flatMap((file) =>
      (legacy.upload_prefixes ?? []).map((prefix) => ({
        route: `${prefix}/${file}`,
        redirect: `/uploads/legacy/${file.split('/').map(encodeURIComponent).join('/')}`,
        statusCode: 301,
      })),
    ),
  ];
  const globalHeaders = {};
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
  await writeFile(path.join(outDir, 'staticwebapp.config.json'), `${JSON.stringify(config, null, 2)}\n`);
  return config;
}

export default function (eleventyConfig) {
  eleventyConfig.on('eleventy.after', async ({ directories }) => {
    await buildSwaConfig(directories?.output ?? '_site');
  });
}
