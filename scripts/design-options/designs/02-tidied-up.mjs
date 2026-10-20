import { esc, cross, facebookIcon, navItems } from '../shared.mjs';

const css = `
/* Same layout as today: navy bar, photo with the name, notices, blog cards, footer. Tidier spacing and type. */
:root{--navy:#002060;--navy-deep:#00174a;--gold:#c8a85a;--gold-text:#7a6326;--ink:#1f2430;--muted:#596070;--page:#ffffff;--wash:#f3f5f9;--line:#dce1eb;--font:'Mulish','Century Gothic',CenturyGothic,sans-serif}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font:400 1.0625rem/1.65 var(--font);color:var(--ink);background:var(--page)}
img{display:block;max-width:100%}
a{color:var(--navy);text-underline-offset:.15em}
h1,h2,h3{color:var(--navy);line-height:1.2;text-wrap:balance}
.wrap{max-width:72rem;margin:0 auto;padding-left:max(1rem,env(safe-area-inset-left,0px));padding-right:max(1rem,env(safe-area-inset-right,0px))}
:focus-visible{outline:3px solid var(--gold);outline-offset:2px}

.hd{position:relative;background:var(--navy);border-bottom:4px solid var(--gold);color:#fff}
.hd__bar{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:4.25rem}
.brand{display:flex;align-items:center;gap:.6rem;color:#fff;text-decoration:none;font-weight:800;font-size:1.25rem;white-space:nowrap}
.brand .cross{width:.85rem;height:1.15rem;color:var(--gold);flex:none}
.hd__nav ul{display:flex;flex-wrap:wrap;margin:0;padding:0;list-style:none}
.hd__nav a{display:block;padding:.55rem .55rem .45rem;color:#dfe5f2;text-decoration:none;font-weight:600;font-size:.95rem;border-bottom:3px solid transparent}
.hd__nav a:hover,.hd__nav a[aria-current]{color:#fff;border-bottom-color:var(--gold)}
.hd__menu{display:none}
.hd__menu summary{list-style:none;cursor:pointer;padding:.45rem .9rem;border:2px solid var(--gold);border-radius:6px;font-weight:700}
.hd__menu summary::-webkit-details-marker{display:none}
.hd__menu ul{position:absolute;left:0;right:0;top:100%;z-index:20;margin:0;padding:.25rem max(1rem,env(safe-area-inset-left,0px)) 1rem;list-style:none;background:var(--navy);border-bottom:4px solid var(--gold)}
.hd__menu a{display:block;padding:.7rem 0;color:#fff;text-decoration:none;border-bottom:1px solid rgb(255 255 255/.14)}
@media (max-width:1080px){.hd__nav{display:none}.hd__menu{display:block}}

.hero{position:relative;display:grid;place-items:center;min-height:clamp(17rem,38vw,28rem);overflow:hidden;color:#fff;text-align:center;background:var(--navy)}
.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 45%}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgb(0 32 96/.2),rgb(0 32 96/.65))}
.hero__text{position:relative;z-index:1;padding-block:2.5rem}
.hero h1{margin:0;color:#fff;font-size:clamp(2.2rem,6vw,3.75rem);font-weight:800;letter-spacing:-.01em;text-shadow:0 2px 12px rgb(0 0 0/.35)}
.hero p{margin:.5rem 0 0;font-size:clamp(1.05rem,2.2vw,1.35rem);font-weight:600}
.hero p::before{content:"";display:block;width:3.5rem;height:3px;margin:0 auto .75rem;background:var(--gold)}

.sec{padding-block:2.5rem 0}
.sec__head{display:flex;flex-wrap:wrap;align-items:end;justify-content:space-between;gap:.5rem 1rem;margin-bottom:1.25rem}
.sec__head h2{margin:0;font-size:1.65rem;font-weight:800}
.sec__head h2::after{content:"";display:block;width:2.5rem;height:3px;margin-top:.45rem;background:var(--gold)}
.sec__head a{font-weight:700;font-size:.95rem}

.notices{display:grid;gap:1rem}
@media (min-width:760px){.notices{grid-template-columns:1fr 1fr}.notice:first-child{grid-column:1/-1}}
.notice{display:flex;flex-direction:column;gap:.35rem;min-width:0;padding:1rem 1.25rem;border:1px solid var(--line);border-left:5px solid var(--navy);border-radius:6px;background:var(--page);color:var(--ink);text-decoration:none}
.notice:hover{border-left-color:var(--gold);background:var(--wash)}
.notice h3{margin:0;font-size:1.125rem;font-weight:800}
.notice p{margin:0;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}
.notice .more{margin-top:auto;color:var(--navy);font-weight:700;font-size:.9rem}

.cards{display:grid;gap:1.5rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))}
.card{display:flex;flex-direction:column;min-width:0;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--page)}
.card__img{display:block;aspect-ratio:3/2;overflow:hidden;background:var(--navy)}
.card__img img{width:100%;height:100%;object-fit:cover}
.card__noimg{display:grid;place-items:center;height:100%;color:var(--gold)}
.card__noimg .cross{width:2.25rem;height:3rem}
.card__body{padding:1rem 1.25rem 1.25rem}
.card__meta{margin:0 0 .35rem;color:var(--muted);font-size:.9rem}
.tag{display:inline-block;padding:.05rem .55rem;border:1px solid var(--gold);border-radius:999px;color:var(--gold-text);font-size:.8rem;font-weight:700;text-decoration:none}
.card h3{margin:0 0 .4rem;font-size:1.2rem;font-weight:800}
.card h3 a{text-decoration:none}
.card h3 a:hover{text-decoration:underline}
.card p:last-child{margin:0}

.ft{margin-top:3.5rem;background:var(--navy-deep);color:#e6eaf3;border-top:4px solid var(--gold)}
.ft a{color:#f0d993}
.ft__grid{display:grid;gap:2rem;padding-block:2.5rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr))}
.ft h2{margin:0 0 .6rem;color:#fff;font-size:.85rem;text-transform:uppercase;letter-spacing:.08em}
.ft ul{margin:0;padding:0;list-style:none}
.ft li{padding:.15rem 0}
.ft address{font-style:normal}
.ft__brand{display:flex;align-items:center;gap:.5rem;margin:0 0 .3rem;color:#fff;font-weight:800;font-size:1.15rem}
.ft__brand .cross{width:.75rem;height:1rem;color:var(--gold)}
.ft p{margin:0 0 .5rem}
.fb{display:inline-flex;align-items:center;gap:.5rem}
.fb svg{width:1.4rem;height:1.4rem}
.ft__legal{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.5rem 1.5rem;padding-block:1rem;border-top:1px solid rgb(255 255 255/.15);font-size:.875rem}
.ft__legal p{margin:0;display:flex;flex-wrap:wrap;gap:1rem}

.crumbs{margin:1.5rem 0 0;font-size:.9rem;color:var(--muted)}
.art__grid{display:grid;gap:2.5rem}
@media (min-width:900px){.art__grid{grid-template-columns:minmax(0,1fr) 17rem}}
.art h1{margin:.5rem 0 .5rem;font-size:clamp(1.9rem,4vw,2.6rem);font-weight:800}
.art__meta{display:flex;flex-wrap:wrap;align-items:center;gap:.25rem .75rem;margin:0 0 1rem;color:var(--muted);font-size:.95rem}
.art__lead{max-width:40rem;margin:0 0 1.5rem;font-size:1.25rem;font-weight:600;color:var(--navy)}
.art__img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:8px;margin-bottom:1.75rem}
.prose{max-width:40rem}
.prose p{margin:0 0 1.1rem}
.aside{align-self:start;padding:1.25rem 1.5rem;border-radius:8px;background:var(--wash)}
.aside h2{margin:0 0 .5rem;font-size:1.05rem;font-weight:800}
.aside ul{margin:0 0 1.5rem;padding:0;list-style:none}
.aside ul:last-child{margin-bottom:0}
.aside li{padding:.3rem 0;border-bottom:1px solid var(--line);font-size:.95rem}
.aside a{text-decoration:none}
.aside a:hover{text-decoration:underline}
`;

const header = (c, current) => `<header class="hd"><div class="wrap hd__bar">
<a class="brand" href="index.html">${cross()}<span>${esc(c.title)}</span></a>
<nav class="hd__nav" aria-label="Main"><ul>${navItems(c, current)}</ul></nav>
<details class="hd__menu"><summary>Menu</summary><ul>${navItems(c, current)}</ul></details>
</div></header>`;

const footer = (c) => `<footer class="ft"><div class="wrap ft__grid">
<div><p class="ft__brand">${cross()}${esc(c.title)}</p><p>${esc(c.tagline)}</p></div>
<div><h2>Find us</h2><address>${c.address.map(esc).join(',<br>')}</address><p><a href="#">Get directions</a></p></div>
<div><h2>Visit</h2><ul><li><a href="#">Regular Church Services</a></li><li><a href="#">Church Calendar</a></li><li><a href="#">Contact Us</a></li><li><a href="#">Safeguarding</a></li></ul></div>
<div><h2>Follow us</h2><a class="fb" href="#">${facebookIcon()}Find us on Facebook</a></div>
</div><div class="wrap ft__legal"><span>&copy; ${c.today.date.getUTCFullYear()} ${esc(c.title)}</span><p><a href="#">Privacy Policy</a><a href="#">Cookie Policy</a><a href="#">Site Map</a></p></div></footer>`;

const card = (p) => `<article class="card">
<a class="card__img" href="${p.href}" tabindex="-1" aria-hidden="true">${p.image ? `<img src="../${p.image}" alt="">` : `<span class="card__noimg">${cross()}</span>`}</a>
<div class="card__body"><p class="card__meta">${esc(p.dateText)} <a class="tag" href="#">${esc(p.topic)}</a></p>
<h3><a href="${p.href}">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p></div></article>`;

export default {
  slug: '02-tidied-up',
  name: 'Tidied up',
  group: 'slight',
  summary: 'The site you know with the rough edges smoothed: a brighter photo, clearer headings, notices as tidy boxes and a picture on every blog card.',
  needs: 'Nothing new.',
  fonts: 'family=Mulish:wght@400;600;700;800',
  css,
  home: (c) => `${header(c, 'Home')}
<main>
<section class="hero"><img src="../img/exterior.jpg" alt="">
<div class="wrap hero__text"><h1>${esc(c.title)}</h1><p>${esc(c.tagline)}</p></div></section>
<section class="wrap sec"><div class="sec__head"><h2>Church Notices</h2><a href="#">All notices</a></div>
<div class="notices">${c.notices.map((n) => `<a class="notice" href="#"><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p><span class="more">Read more</span></a>`).join('')}</div></section>
<section class="wrap sec"><div class="sec__head"><h2>Latest Blog Articles</h2><a href="#">All articles</a></div>
<div class="cards">${c.posts.map(card).join('')}</div></section>
</main>
${footer(c)}`,
  article: (c) => {
    const a = c.article;
    return `${header(c, 'Blog')}
<main class="wrap art">
<p class="crumbs"><a href="index.html">Home</a> &rsaquo; <a href="#">Blog</a></p>
<div class="art__grid"><article>
<h1>${esc(a.title)}</h1>
<p class="art__meta"><span>By ${esc(a.author)}</span><span>${esc(a.dateText)}</span><a class="tag" href="#">${esc(a.topic)}</a></p>
<p class="art__lead">${esc(a.lead)}</p>
<img class="art__img" src="../${a.image}" alt="${esc(a.imageAlt)}">
<div class="prose">${a.body}</div>
</article>
<aside class="aside"><h2>Blog Topics</h2><ul>${c.topics.map((t) => `<li><a href="#">${esc(t)}</a></li>`).join('')}</ul>
<h2>Latest</h2><ul>${c.latestTitles.map((t) => `<li><a href="${t === a.title ? 'article.html' : '#'}">${esc(t)}</a></li>`).join('')}</ul></aside>
</div></main>
${footer(c)}`;
  },
};
