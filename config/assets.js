// One stylesheet and one script, minified, content-hashed and written to the output folder.
// Exposes global `assets` ({ css, js } each { url, integrity }), a `build.year`, and passes site/static through to the root.
import CleanCSS from 'clean-css';
import { minify } from 'terser';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ASSETS = 'site/assets';

async function emit(out, dir, ext, code) {
  const hash = createHash('sha256').update(code).digest();
  const url = `/${dir}/site.${hash.toString('hex').slice(0, 10)}.${ext}`;
  await mkdir(path.join(out, dir), { recursive: true });
  await writeFile(path.join(out, url), code);
  return { url, integrity: `sha256-${hash.toString('base64')}` };
}

export async function buildAssets(out) {
  const files = (await readdir(path.join(ASSETS, 'css'))).filter((f) => f.endsWith('.css')).sort();
  const cssSource = (await Promise.all(files.map((f) => readFile(path.join(ASSETS, 'css', f), 'utf8')))).join('\n');
  const min = new CleanCSS({ level: 1 }).minify(cssSource);
  if (min.errors.length) throw new Error(min.errors.join('\n'));

  const js = await minify(await readFile(path.join(ASSETS, 'js/site.js'), 'utf8'), { compress: true, mangle: true });

  return { css: await emit(out, 'css', 'css', min.styles), js: await emit(out, 'js', 'js', js.code) };
}

export default function (eleventyConfig) {
  let current;
  eleventyConfig.on('eleventy.before', ({ directories }) => {
    current = buildAssets(directories.output);
  });
  eleventyConfig.addGlobalData('assets', () => current);
  eleventyConfig.addGlobalData('build', { year: new Date().getFullYear() });
  eleventyConfig.addPassthroughCopy({ 'site/static': '/' });
}
