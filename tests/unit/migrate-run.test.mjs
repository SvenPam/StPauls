// Runs the migration end to end on the saved snapshots with a fake fetch, into a temporary site folder.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { parse } from 'yaml';
import * as m from '../../scripts/migrate.mjs';

const LIVE = 'http://live.test';
const snap = (name) => readFileSync(`tests/fixtures/live/${name}`, 'utf8');

// A page with legacy upload links in two spellings, built from a real page's markup.
const formsPage = snap('page-diary.html')
  .replace('Church Diary', 'Forms')
  .replace(/<iframe[^>]*><\/iframe>/, '<p><a href="/Areas/st_pauls/Uploads/baptism-form.pdf">Baptism form</a> and <a href="http://www.stpaulswarton.co.uk/areas/ST_PAULS/uploads/Baptism-Form.pdf">again</a></p>' +
    '<p><img src="https://media.acny.uk/media/thumbs/e0/60/e0602c.jpg?h=300&amp;w=350&amp;mode=crop" alt="Crocus"></p>' +
    '<p><img src="https://media.acny.uk/media/venues/gone.jpg" alt="Gone"></p>');

const PAGES = {
  '/': snap('home.html'),
  '/blog': snap('blog-index.html'),
  '/blog/article/church-roof-completed': snap('article.html'),
  '/calendar/event/16/mu-advent-carol-service': snap('event.html'),
  '/notices/notice/46/news-pew-sheets': snap('notice.html'),
  '/page/about/church-diary': snap('page-diary.html'),
  '/page/gallery/church-gallery': snap('page-gallery.html'),
  '/page/forms/st-pauls-forms': formsPage,
};

let site;
let report;
let out;
let argv;
let jpeg;
let CONTACT_BEFORE;
const requested = [];

const fetch = async (url) => {
  requested.push(String(url));
  const u = new URL(url);
  if (u.origin === LIVE && u.pathname === '/sitemap.xml') {
    const locs = Object.keys(PAGES).map((p) => `<url><loc>${LIVE}${p}</loc></url>`).join('');
    return new Response(`<?xml version="1.0"?><urlset>${locs}</urlset>`);
  }
  if (u.origin === LIVE && PAGES[u.pathname]) return new Response(PAGES[u.pathname]);
  if (u.pathname.endsWith('/gone.jpg')) return new Response('denied', { status: 403 });
  if (/\.(jpe?g|png|gif)$/i.test(u.pathname)) return new Response(jpeg);
  if (/\.pdf$/i.test(u.pathname)) return new Response('%PDF-1.4 fixture');
  return new Response('not found', { status: 404 });
};

before(async () => {
  jpeg = await sharp({ create: { width: 40, height: 30, channels: 3, background: { r: 200, g: 100, b: 50 } } }).jpeg().toBuffer();
  site = mkdtempSync(join(tmpdir(), 'migrate-'));
  report = join(site, 'report.md');
  out = join(site, '_out');
  for (const dir of readdirSync('site/content/page')) {
    const from = join('site/content/page', dir, '_index.md');
    if (existsSync(from)) cpSync(from, join(site, 'content/page', dir, '_index.md'));
  }
  cpSync('site/content/page/_index.md', join(site, 'content/page/_index.md'));
  for (const s of ['blog', 'calendar', 'notices']) cpSync(`site/content/${s}/_index.md`, join(site, `content/${s}/_index.md`));
  cpSync('site/content/_index.md', join(site, 'content/_index.md'));
  cpSync('site/content/page/about/contact-us.md', join(site, 'content/page/about/contact-us.md'));
  writeFileSync(join(site, 'content/notices/practice.md'), '---\ntitle: Practice\ndate: 2026-10-10\n---\n<p>Practice</p>\n');
  CONTACT_BEFORE = readFileSync(join(site, 'content/page/about/contact-us.md'), 'utf8');
  mkdirSync(join(site, 'static/uploads'), { recursive: true });
  mkdirSync(join(site, 'data'), { recursive: true });
  cpSync('site/data/legacy.yaml', join(site, 'data/legacy.yaml'));
  const dates = join(site, 'dates.csv');
  writeFileSync(dates, 'kind,id,start,end,location\nevent,16,2015-12-01T19:30,2015-12-01T21:00,"St Michael\'s, Kirkham"\n');
  argv = ['--live', LIVE, '--site', site, '--report', report, '--dates', dates];
  assert.equal(await m.main(argv, { fetch, log: () => {} }), 0);
});

after(() => rmSync(site, { recursive: true, force: true }));

test('writes the expected files', () => {
  for (const f of ['content/blog/church-roof-completed.md', 'content/calendar/16-mu-advent-carol-service.md', 'content/notices/46-news-pew-sheets.md', 'content/page/about/church-diary.md', 'content/page/gallery/church-gallery.md'])
    assert.ok(existsSync(join(site, f)), f);
  assert.ok(statSync(join(site, 'static/uploads/acny')).isDirectory());
  assert.ok(existsSync(join(site, 'static/uploads/content/generic-2.jpg')));
});

test('an event location from the export is written', () => {
  assert.match(readFileSync(join(site, 'content/calendar/16-mu-advent-carol-service.md'), 'utf8'), /^location: St Michael's, Kirkham$/m);
});

test('migrated items keep their live URL', () => {
  assert.match(readFileSync(join(site, 'content/calendar/16-mu-advent-carol-service.md'), 'utf8'), /^url: \/calendar\/event\/16\/mu-advent-carol-service$/m);
  assert.match(readFileSync(join(site, 'content/notices/46-news-pew-sheets.md'), 'utf8'), /^url: \/notices\/notice\/46\/news-pew-sheets$/m);
});

test('the written files only use site topics', () => {
  const topics = Object.keys(parse(readFileSync('site/data/topics.yaml', 'utf8')));
  let seen = 0;
  for (const dir of ['blog', 'calendar', 'notices']) {
    for (const f of readdirSync(join(site, 'content', dir))) {
      const fm = parse(readFileSync(join(site, 'content', dir, f), 'utf8').split('---\n')[1]) ?? {};
      for (const key of ['blogtopics', 'eventtopics', 'noticetopics']) {
        if (fm[key] === undefined) continue;
        seen += 1;
        assert.ok(topics.includes(fm[key]), `${f}: ${fm[key]}`);
      }
    }
  }
  assert.ok(seen >= 3);
});

test('each upload is downloaded once', () => {
  const pdfs = requested.filter((u) => /baptism-form\.pdf$/i.test(u));
  assert.equal(pdfs.length, 1);
});

test('a second run changes nothing', async () => {
  assert.equal(await m.main([...argv, '--check'], { fetch, log: () => {} }), 0);
});

test('extra legacy upload spellings are appended once, existing routes kept', async () => {
  const text = readFileSync(join(site, 'data/legacy.yaml'), 'utf8');
  assert.match(text, /# uploads \(spec 07\)/);
  assert.match(text, /\{ from: \/Calendar, to: \/calendar \}/);
  assert.match(text, /from: \/areas\/ST_PAULS\/uploads\/Baptism-Form\.pdf, to: \/uploads\/legacy\/baptism-form\.pdf/);
  assert.equal(await m.updateLegacy(join(site, 'data/legacy.yaml'), [{ dest: 'uploads/legacy/baptism-form.pdf', legacyPaths: ['/Areas/st_pauls/Uploads/baptism-form.pdf', '/areas/ST_PAULS/uploads/Baptism-Form.pdf'] }], { check: true }), false);
  assert.equal(text.match(/# uploads \(spec 07\)/g).length, 1);
});

test('files the script did not write are untouched', () => {
  assert.equal(readFileSync(join(site, 'content/page/about/contact-us.md'), 'utf8'), CONTACT_BEFORE);
  assert.ok(existsSync(join(site, 'content/notices/practice.md')));
  assert.match(readFileSync(join(site, 'content/_index.md'), 'utf8'), /^lead: Serving Christ - Serving the Community$/m);
});

test('the report lists policy text, inferred dates, unknown topics and files it did not write', () => {
  const rep = readFileSync(report, 'utf8');
  for (const h of ['## Policy text that no longer applies', '## Inferred dates', '## Unknown topics', '## Files the script did not write']) assert.ok(rep.includes(h), h);
  assert.match(rep, /notices\/practice\.md/);
  assert.match(rep, /news-pew-sheets \| 2026-10-01 \| inferred/);
  assert.doesNotMatch(rep, /mu-advent-carol-service/);
  assert.match(rep, /\| uploads\/acny\/gone\.jpg \| https:\/\/media\.acny\.uk\/media\/venues\/gone\.jpg \| HTTP 403 \|/);
});

test('check mode lists a changed file', async () => {
  const p = join(site, 'content/notices/46-news-pew-sheets.md');
  const before = readFileSync(p, 'utf8');
  writeFileSync(p, before + '<p>Edited in practice</p>\n');
  const lines = [];
  try {
    assert.equal(await m.main([...argv, '--check'], { fetch, log: (s) => lines.push(s) }), 1);
  } finally {
    assert.equal(readFileSync(p, 'utf8'), before + '<p>Edited in practice</p>\n');
    writeFileSync(p, before);
  }
  assert.ok(lines.some((l) => l.includes('content/notices/46-news-pew-sheets.md')));
});

test('the migrated fixture builds', () => {
  execFileSync('npx', ['eleventy', `--output=${out}`], {
    env: { ...process.env, CONTENT: join(site, 'content'), UPLOADS: join(site, 'static/uploads') }, stdio: 'pipe',
  });
  assert.ok(existsSync(join(out, 'calendar/event/16/mu-advent-carol-service/index.html')));
  const article = readFileSync(join(out, 'blog/article/church-roof-completed/index.html'), 'utf8');
  assert.match(article, /church roof works have now been completed/);
  assert.ok(existsSync(join(out, 'page/about/church-diary/index.html')));
});
