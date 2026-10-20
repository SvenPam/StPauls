// The real content the mockups show, read from a fresh Eleventy build and from site/content.
// Lists come from the built pages so their order and summaries match the site exactly.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { parse } from 'yaml';

export const ARTICLE_SLUG = 'church-roof-completed';

// Blog images by their /uploads path, for the posts the mockups show. A post whose image file is
// missing on the site (the CWGC article) gets null, and each design shows its own no-picture card.
const POST_IMAGES = {
  '/uploads/acny/e0602c3ff16aebee9d69855cf771ce34.jpg': 'img/churchyard.jpg',
  '/uploads/content/generic-2.jpg': 'img/interior.jpg',
};

function frontMatter(text) {
  const [, yaml, body] = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return { data: parse(yaml), body };
}

const longDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// The regular pattern from Regular Church Services: Sunday 9:30am, the All Aboard family service on the
// second Sunday, a benefice service on a fifth Sunday, Remembrance Sunday at 10:30am.
function sundayService(d) {
  const nth = Math.ceil(d.getUTCDate() / 7);
  if (d.getUTCMonth() === 10 && nth === 2) return { time: '10:30am', name: 'Remembrance Sunday' };
  if (nth === 2) return { time: '9:30am', name: 'All Aboard family service' };
  if (nth === 5) return { time: '9:30am', name: 'Benefice service' };
  return { time: '9:30am', name: 'Family Sung Eucharist' };
}

function nextDay(from, weekday) {
  const d = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
  do d.setUTCDate(d.getUTCDate() + 1); while (d.getUTCDay() !== weekday);
  return d;
}

function dateParts(d) {
  return {
    date: d,
    weekday: d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' }),
    wd: d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
    day: String(d.getUTCDate()),
    month: d.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' }),
    mon: d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }),
  };
}

export async function extract(builtDir, contentDir, today = new Date()) {
  const home = cheerio.load(await readFile(path.join(builtDir, 'index.html'), 'utf8'));
  const art = cheerio.load(await readFile(path.join(builtDir, 'blog/article', ARTICLE_SLUG, 'index.html'), 'utf8'));

  const nav = home('.site-nav__list > li').map((_, li) => {
    const name = home(li).find('> a, > details > summary').first().text().trim();
    return { name, href: name === 'Home' ? 'index.html' : '#' };
  }).get();

  const notices = home('.home-notice').map((_, a) => ({
    title: home(a).find('h3').text().trim(),
    summary: home(a).find('p').text().trim(),
  })).get();

  const blogDir = path.join(contentDir, 'blog');
  const posts = [];
  for (const file of (await readdir(blogDir)).filter((f) => f.endsWith('.md') && f !== '_index.md')) {
    const { data } = frontMatter(await readFile(path.join(blogDir, file), 'utf8'));
    const slug = file.replace(/\.md$/, '');
    const date = new Date(data.date);
    posts.push({
      title: data.title,
      summary: data.summary,
      author: data.author,
      topic: home(`.card__title a[href$="/${slug}"]`).closest('.card').find('.topic').text().trim(),
      date,
      dateText: longDate(date),
      image: POST_IMAGES[data.image] ?? null,
      href: slug === ARTICLE_SLUG ? 'article.html' : '#',
    });
  }
  posts.sort((a, b) => b.date - a.date);
  const latest = posts.slice(0, 3);

  const { data: a } = frontMatter(await readFile(path.join(blogDir, `${ARTICLE_SLUG}.md`), 'utf8'));
  const article = {
    title: a.title,
    author: a.author,
    date: new Date(a.date),
    dateText: longDate(new Date(a.date)),
    topic: art('.topic-line .topic').text().trim(),
    lead: a.summary,
    image: POST_IMAGES[a.image],
    imageAlt: a.image_alt,
    body: art('.prose').html().trim(),
  };

  const topics = art('.blog-aside h2:contains("Blog Topics") + ul li').map((_, li) => art(li).text().trim()).get();
  const latestTitles = art('.blog-aside h2:contains("Latest") + ul li').map((_, li) => art(li).text().trim()).get();

  const sundays = [];
  let d = nextDay(today, 0);
  for (let i = 0; i < 4; i++) {
    sundays.push({ ...dateParts(d), ...sundayService(d) });
    d = new Date(d.getTime() + 7 * 864e5);
  }
  const wednesday = { ...dateParts(nextDay(today, 3)), time: '9:30am', name: 'Said Communion' };

  return {
    title: "St Paul's Warton",
    tagline: 'Serving Christ - Serving the Community',
    taglineParts: ['Serving Christ', 'Serving the Community'],
    today: dateParts(new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))),
    nav,
    notices,
    posts: latest,
    article,
    topics,
    latestTitles,
    services: {
      welcome: "A warm welcome to everyone, especially any who are visiting St Paul's for the first time",
      regular: [
        { day: 'Sundays', time: '9:30am', name: 'Family Sung Eucharist', detail: 'Common Worship, about an hour' },
        { day: 'Wednesdays', time: '9:30am', name: 'Said Communion', detail: 'A short service, then coffee in the vestry' },
      ],
      monthly: 'On the 2nd Sunday of the month the 9:30am service is All Aboard, a family service.',
      sundays,
      wednesday,
    },
    address: ['Church Road', 'Warton', 'Lancashire', 'PR4 1BD'],
    clergy: { name: 'Rev. Tracy Swindells', phone: '01772 679515' },
  };
}
