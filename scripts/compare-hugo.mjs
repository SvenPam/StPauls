#!/usr/bin/env node
// Compares a Hugo build with an Eleventy build, page by page. Sandbox only, never run in CI.
//
//   node scripts/compare-hugo.mjs <hugo out> <eleventy out>
//
// Lists HTML and XML files that are in only one build. For files in both, it tokenises each
// file (tags, attributes, text) and prints a diff of the normalised tokens. Exit 1 on any difference.
//
// Normalised, because they differ by tool and not by content:
// - asset hashes, `integrity` values and generated image file names become placeholders
// - whitespace on its own between tags is dropped, runs of whitespace in text become one space,
//   and text next to a block tag is trimmed (Hugo ran with --minify)
// - attribute quoting and order, entity spelling, `/>` on void elements, comments
// - CSS in `style` attributes, the viewport `content`, SVG path data (compared as absolute numbers)
// Everything else, including text, attribute values, element structure and URLs, is compared as is.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { decodeHTML, decodeXML } from 'entities';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style']);
const KEEP_SPACE = new Set(['pre', 'textarea']);
// Whitespace next to these tags never shows on the page, so it is dropped.
const BLOCK = new Set([
  'html', 'head', 'body', 'title', 'meta', 'link', 'script', 'style', 'base', 'noscript',
  'address', 'article', 'aside', 'blockquote', 'details', 'summary', 'dialog', 'div', 'dl', 'dt', 'dd',
  'fieldset', 'legend', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hgroup', 'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'caption',
  'colgroup', 'col', 'tbody', 'thead', 'tfoot', 'tr', 'td', 'th', 'ul', 'option', 'optgroup', 'select',
  'br', 'source', 'track', 'iframe',
]);

async function listFiles(root) {
  const out = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (/\.(html|xml)$/.test(entry.name)) out.push(path.relative(root, full).split(path.sep).join('/'));
    }
  }
  await walk(root);
  return out.sort();
}

// Tool-specific names: Hugo's site.min.<sha256>.css and Eleventy's site.<10 hex>.css, Hugo's
// name_hu_<hex>.png and Eleventy's name-<width>.<8 hex>.png.
function placeholders(value) {
  return value
    .replace(/\/(css|js)\/site(?:\.min)?\.[0-9a-f]{8,64}\.(css|js)\b/g, '/$1/site.[hash].$2')
    .replace(/\/images\/((?:[\w-]+\/)*[\w-]+?)_hu_[0-9a-f]+\.(\w+)/g, '/images/$1.[img].$2')
    .replace(/\/images\/((?:[\w-]+\/)*[\w-]+?)-\d+\.[0-9a-f]{8}\.(\w+)/g, '/images/$1.[img].$2');
}

const collapse = (s) => s.replace(/\s+/g, ' ').trim();
const css = (s) => collapse(s).replace(/\s*([:;,])\s*/g, '$1').replace(/;$/, '');

// SVG path data as absolute commands with numbers rounded to 3 places, so the minifier's
// relative/absolute rewrites and number spelling compare equal while the shape still has to match.
function svgPath(d) {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/g) ?? [];
  const ARGS = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0;
  const out = [];
  const r = (n) => String(Math.round(n * 1000) / 1000);
  const num = () => {
    const t = tokens[i++];
    return Number(t);
  };
  // Arc flags can be written as single digits with no separator ("1010.1").
  const flag = () => {
    const t = tokens[i];
    if (t.length > 1 && /^[01]/.test(t)) { tokens[i] = t.slice(1); return Number(t[0]); }
    i++;
    return Number(t);
  };
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    else if (!cmd) return collapse(d);
    const rel = cmd === cmd.toLowerCase();
    const c = cmd.toLowerCase();
    if (c === 'z') { out.push('Z'); x = sx; y = sy; continue; }
    const a = [];
    for (let k = 0; k < ARGS[c]; k++) a.push(c === 'a' && (k === 3 || k === 4) ? flag() : num());
    if (a.some(Number.isNaN)) return collapse(d);
    const ox = rel ? x : 0, oy = rel ? y : 0;
    if (c === 'h') { x = a[0] + ox; out.push(`L${r(x)},${r(y)}`); continue; }
    if (c === 'v') { y = a[0] + oy; out.push(`L${r(x)},${r(y)}`); continue; }
    if (c === 'a') {
      x = a[5] + ox; y = a[6] + oy;
      out.push(`A${r(a[0])},${r(a[1])},${r(a[2])},${a[3]},${a[4]},${r(x)},${r(y)}`);
      continue;
    }
    const pts = [];
    for (let k = 0; k < a.length; k += 2) pts.push(`${r(a[k] + ox)},${r(a[k + 1] + oy)}`);
    x = a[a.length - 2] + ox; y = a[a.length - 1] + oy;
    const upper = c === 'm' ? 'M' : c.toUpperCase();
    out.push(`${upper}${pts.join(',')}`);
    if (c === 'm') { sx = x; sy = y; cmd = rel ? 'l' : 'L'; }
  }
  return out.join(' ');
}

function attrValue(tag, name, value, attrs) {
  if (name === 'integrity') return '[integrity]';
  if (name === 'class') return collapse(value);
  if (name === 'style') return css(value);
  if (name === 'content' && tag === 'meta' && attrs.name === 'viewport') return css(value);
  if (name === 'd' && tag === 'path') return svgPath(value);
  return placeholders(value);
}

// One start tag from `i` (just past its name), read as the HTML tokeniser does: an unquoted
// value runs to whitespace or `>`, so `href=/>` is the value "/" and not a self-closing tag.
function readTag(src, i, decode) {
  const attrs = {};
  let selfClosing = false;
  while (i < src.length) {
    while (/\s/.test(src[i])) i++;
    if (src[i] === '>') return { attrs, selfClosing, end: i + 1 };
    if (src[i] === '/') { selfClosing = src[i + 1] === '>'; i++; continue; }
    let name = '';
    while (i < src.length && !/[\s=>]/.test(src[i]) && !(src[i] === '/' && name)) name += src[i++];
    while (/\s/.test(src[i])) i++;
    let value = '';
    if (src[i] === '=') {
      i++;
      while (/\s/.test(src[i])) i++;
      if (src[i] === '"' || src[i] === "'") {
        const q = src[i];
        const close = src.indexOf(q, i + 1);
        value = src.slice(i + 1, close);
        i = close + 1;
      } else {
        while (i < src.length && !/[\s>]/.test(src[i])) value += src[i++];
      }
    }
    if (name) attrs[name.toLowerCase()] = decode(value);
    selfClosing = false;
  }
  return { attrs, selfClosing, end: i };
}

// Tokens: { t: 'open'|'close'|'text'|'other', name, attrs, text }.
function tokenise(src, xml) {
  const decode = xml ? decodeXML : decodeHTML;
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      i = end < 0 ? src.length : end + 3;
    } else if (src.startsWith('<![CDATA[', i)) {
      const end = src.indexOf(']]>', i);
      tokens.push({ t: 'text', text: src.slice(i + 9, end < 0 ? src.length : end) });
      i = end < 0 ? src.length : end + 3;
    } else if (src.startsWith('<!', i) || src.startsWith('<?', i)) {
      const end = src.indexOf('>', i);
      const raw = src.slice(i, end + 1);
      tokens.push({ t: 'other', text: /^<!doctype/i.test(raw) ? collapse(raw).toLowerCase() : collapse(raw) });
      i = end + 1;
    } else if (/^<\/?[a-zA-Z]/.test(src.slice(i, i + 3))) {
      const m = /^<(\/?)([a-zA-Z][\w:-]*)/.exec(src.slice(i, i + 80));
      const name = xml ? m[2] : m[2].toLowerCase();
      if (m[1]) {
        tokens.push({ t: 'close', name });
        i = src.indexOf('>', i) + 1;
        continue;
      }
      const tag = readTag(src, i + m[0].length, decode);
      i = tag.end;
      tokens.push({ t: 'open', name, attrs: tag.attrs });
      if (!xml && RAW.has(name)) {
        const end = src.toLowerCase().indexOf(`</${name}`, i);
        const body = src.slice(i, end < 0 ? src.length : end);
        if (body.trim()) tokens.push({ t: 'text', text: body, raw: true });
        i = end < 0 ? src.length : end;
      } else if (tag.selfClosing && (xml || !VOID.has(name))) {
        tokens.push({ t: 'close', name });
      }
    } else {
      const end = src.indexOf('<', i + 1);
      const stop = end < 0 ? src.length : end;
      tokens.push({ t: 'text', text: decode(src.slice(i, stop)) });
      i = stop;
    }
  }
  return tokens;
}

// Merge neighbouring text, then apply the whitespace rules.
function normalise(tokens, xml) {
  const merged = [];
  for (const tok of tokens) {
    const last = merged[merged.length - 1];
    if (tok.t === 'text' && last?.t === 'text' && !tok.raw && !last.raw) last.text += tok.text;
    else merged.push({ ...tok });
  }
  const isBlock = (tok) => !tok || tok.t === 'other' || ((tok.t === 'open' || tok.t === 'close') && (xml || BLOCK.has(tok.name)));
  const out = [];
  let keep = 0;
  for (let k = 0; k < merged.length; k++) {
    const tok = merged[k];
    if (tok.t === 'open' && KEEP_SPACE.has(tok.name)) keep++;
    if (tok.t === 'close' && KEEP_SPACE.has(tok.name)) keep = Math.max(0, keep - 1);
    if (tok.t !== 'text') { out.push(tok); continue; }
    if (tok.raw || keep) { out.push(tok); continue; }
    // Whitespace on its own between two tags is dropped, as the brief asks: Hugo's minifier
    // removes some of it and keeps some. Text with words keeps its spaces, collapsed.
    if (!tok.text.trim()) continue;
    let text = tok.text.replace(/\s+/g, ' ');
    if (isBlock(merged[k - 1])) text = text.replace(/^ /, '');
    if (isBlock(merged[k + 1])) text = text.replace(/ $/, '');
    if (text) out.push({ t: 'text', text });
  }
  return out;
}

function render(tok) {
  if (tok.t === 'other') return tok.text;
  if (tok.t === 'close') return `</${tok.name}>`;
  if (tok.t === 'text') return `"${tok.raw ? collapse(tok.text) : placeholders(tok.text)}"`;
  const attrs = Object.keys(tok.attrs).sort()
    .map((name) => `${name}="${attrValue(tok.name, name, tok.attrs[name], tok.attrs)}"`);
  return `<${[tok.name, ...attrs].join(' ')}>`;
}

export async function linesOf(file) {
  const xml = file.endsWith('.xml');
  return normalise(tokenise(await readFile(file, 'utf8'), xml), xml).map(render);
}

// Line diff from the longest common subsequence, as hunks with two lines of context.
function diff(a, b) {
  const n = a.length, m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const ops = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { ops.push([' ', a[i]]); i++; j++; }
    else if (j < m && (i === n || lcs[i][j + 1] >= lcs[i + 1][j])) ops.push(['+', b[j++]]);
    else ops.push(['-', a[i++]]);
  }
  const CONTEXT = 2;
  const show = ops.map(() => false);
  ops.forEach(([op], k) => {
    if (op !== ' ') for (let c = Math.max(0, k - CONTEXT); c <= Math.min(ops.length - 1, k + CONTEXT); c++) show[c] = true;
  });
  const PREFIX = { ' ': '             ', '-': '  - hugo     ', '+': '  + eleventy ' };
  const lines = [];
  ops.forEach(([op, line], k) => {
    if (show[k]) lines.push(`${PREFIX[op]}${line}`);
    else if (show[k - 1]) lines.push('             ...');
  });
  return ops.some(([op]) => op !== ' ') ? lines : [];
}

async function main() {
  const [hugoDir, elevDir] = process.argv.slice(2);
  if (!hugoDir || !elevDir) {
    console.error('Usage: node scripts/compare-hugo.mjs <hugo out> <eleventy out>');
    return 2;
  }
  const hugo = await listFiles(hugoDir);
  const elev = await listFiles(elevDir);
  const onlyHugo = hugo.filter((f) => !elev.includes(f));
  const onlyElev = elev.filter((f) => !hugo.includes(f));
  let differ = 0;
  for (const f of onlyHugo) console.log(`Only in Hugo:     ${f}`);
  for (const f of onlyElev) console.log(`Only in Eleventy: ${f}`);
  for (const f of hugo.filter((x) => elev.includes(x))) {
    const lines = diff(await linesOf(path.join(hugoDir, f)), await linesOf(path.join(elevDir, f)));
    if (lines.length) {
      differ++;
      console.log(`\n=== ${f}`);
      console.log(lines.join('\n'));
    }
  }
  const same = hugo.filter((x) => elev.includes(x)).length - differ;
  console.log(`\n${same} same, ${differ} different, ${onlyHugo.length} only in Hugo, ${onlyElev.length} only in Eleventy`);
  return differ || onlyHugo.length || onlyElev.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exitCode = await main();
