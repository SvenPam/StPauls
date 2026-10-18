// Builds the site from a fixture content folder and serves it the way Static Web Apps does:
// /path and /path/ both serve /path/index.html, anything else missing gets 404.html.
// Usage: node serve.js <content dir> <port>
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, mkdtempSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';

const [content, port] = process.argv.slice(2);
const out = mkdtempSync(join(tmpdir(), 'stpauls-'));
execFileSync(process.env.HUGO ?? 'hugo', [
  '--source', resolve('../site'),
  '--contentDir', resolve(content),
  '--destination', out,
  '--minify', '--panicOnWarning', '--quiet',
], { stdio: 'inherit' });

const types = {
  '.html': 'text/html; charset=utf-8', '.xml': 'application/xml', '.css': 'text/css',
  '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

const find = (path) => {
  const file = join(out, decodeURIComponent(path));
  if (!file.startsWith(out)) return null;
  if (existsSync(file) && statSync(file).isFile()) return file;
  const index = join(file, 'index.html');
  return existsSync(index) ? index : null;
};

createServer((req, res) => {
  const file = find(new URL(req.url, 'http://x').pathname);
  const status = file ? 200 : 404;
  const path = file ?? join(out, '404.html');
  res.writeHead(status, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
  createReadStream(path).pipe(res);
}).listen(Number(port), () => console.log(`Serving ${content} on ${port}`));
