// Design 1 is the site as built today: the built home page and article, with their own CSS, script and
// images copied beside them, paths made relative, and every link but home and the article made inert.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { ARTICLE_SLUG } from './content.mjs';
import { wrapExisting } from './shared.mjs';

const ASSET = /(?<=["\s,(])\/(images|uploads|css|js|fonts)\/[^"\s,)]+/g;

export async function buildOriginal({ builtDir, outDir, bar }) {
  const pages = { 'index.html': 'index.html', 'article.html': `blog/article/${ARTICLE_SLUG}/index.html` };
  const assets = new Set();
  for (const [out, src] of Object.entries(pages)) {
    let html = await readFile(path.join(builtDir, src), 'utf8');
    for (const m of html.match(ASSET) ?? []) assets.add(m);
    html = html
      .replace(/ integrity="[^"]*"/g, '')
      .replace(ASSET, (m) => `assets${m}`)
      .replace(/href="\/"/g, 'href="index.html"')
      .replace(new RegExp(`href="/blog/article/${ARTICLE_SLUG}"`, 'g'), 'href="article.html"')
      .replace(/href="(\/[^"]*|https?:[^"]*|mailto:[^"]*)"/g, 'href="#"');
    await writeFile(path.join(outDir, out), wrapExisting(html, bar(out === 'index.html' ? 'home' : 'article')));
  }
  for (const a of assets) {
    const from = path.join(builtDir, a);
    const to = path.join(outDir, 'assets', a);
    await mkdir(path.dirname(to), { recursive: true });
    try {
      await copyFile(from, to);
    } catch {
      // Live has this image missing too (the CWGC article), so the copy keeps it broken.
    }
    if (a.endsWith('.css')) {
      const css = await readFile(to, 'utf8');
      await writeFile(to, css.replace(/url\(\/fonts\//g, 'url(../fonts/'));
      for (const f of css.match(/\/fonts\/[^)"']+/g) ?? []) {
        await mkdir(path.join(outDir, 'assets/fonts'), { recursive: true });
        await copyFile(path.join(builtDir, f), path.join(outDir, 'assets', f));
      }
    }
  }
}
