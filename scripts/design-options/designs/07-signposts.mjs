import { esc, cross, facebookIcon } from '../shared.mjs';

// Line icons for the signposts, 24px grid, drawn in currentColor.
const ICONS = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  notice: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  pen: '<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.2c2.6.4 4.5 2.7 4.5 5.8"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10M10 20v-5h4v5"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>',
  form: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
};
const icon = (name) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

// Every section of the site, from the main menu and footer, as a signpost.
const SIGNS = [
  ['Church services', 'clock'], ['Calendar', 'calendar'], ['Notices', 'notice'], ['Blog', 'pen'],
  ['Groups', 'people'], ['Community', 'home'], ['Gallery', 'image'], ['Forms', 'form'],
  ['Safeguarding', 'shield'], ['Contact us', 'mail'], ['About us', 'info'], ['Useful links', 'link'],
];

const css = `
/* Blue and gold with no dropdown menus: the home page is a set of big signposts to every part of the site. */
:root{--navy:#002060;--navy-mid:#0b2f7a;--navy-tint:#eef2f9;--gold:#c8a85a;--gold-text:#7a6326;--ink:#1d2330;--muted:#596070;--page:#ffffff;--line:#dce1eb;
--font:'Nunito','Century Gothic',sans-serif}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font:400 1.0625rem/1.6 var(--font);color:var(--ink);background:var(--page)}
img{display:block;max-width:100%}
a{color:var(--navy);text-underline-offset:.15em}
h1,h2,h3{color:var(--navy);line-height:1.2;text-wrap:balance}
.wrap{max-width:72rem;margin:0 auto;padding-left:max(1rem,env(safe-area-inset-left,0px));padding-right:max(1rem,env(safe-area-inset-right,0px))}
:focus-visible{outline:3px solid var(--gold);outline-offset:3px}

.hd{background:var(--navy);color:#fff;border-bottom:4px solid var(--gold)}
.hd__bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.75rem 1rem;padding-block:.8rem}
.brand{display:flex;align-items:center;gap:.6rem;color:#fff;text-decoration:none;font-weight:800;font-size:1.3rem}
.brand .cross{width:.85rem;height:1.15rem;color:var(--gold)}
.hd__links{display:flex;flex-wrap:wrap;gap:.5rem}
.pill{display:inline-flex;align-items:center;gap:.45rem;min-height:2.75rem;padding:0 1rem;border-radius:999px;color:#fff;font-weight:800;text-decoration:none;border:2px solid rgb(255 255 255/.35)}
.pill .ico{width:1.2rem;height:1.2rem;color:var(--gold)}
.pill:hover{border-color:var(--gold)}
.pill--gold{background:var(--gold);border-color:var(--gold);color:var(--navy)}
.pill--gold .ico{color:var(--navy)}

.hero{position:relative;display:flex;align-items:end;min-height:clamp(13rem,30vw,20rem);overflow:hidden;background:var(--navy);color:#fff}
.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 60%}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgb(0 32 96/.9),rgb(0 32 96/.45) 55%,rgb(0 32 96/.1))}
.hero .wrap{position:relative;z-index:1;width:100%;padding-block:2rem}
.hero h1{margin:0;color:#fff;font-size:clamp(2.2rem,5.5vw,3.4rem);font-weight:800}
.hero p{margin:.3rem 0 0;font-size:1.2rem;font-weight:700;color:#f0d993}

.signs{padding-top:2.5rem}
.signs h2,.sec h2,.h2{margin:0 0 1.1rem;font-size:1.6rem;font-weight:800}
.tiles{display:grid;gap:.9rem;margin:0;padding:0;list-style:none;grid-template-columns:repeat(auto-fill,minmax(min(100%,10.5rem),1fr))}
@media (max-width:420px){.tiles{grid-template-columns:1fr 1fr}}
.tile{display:flex;flex-direction:column;justify-content:space-between;gap:1.25rem;min-height:8.5rem;height:100%;padding:1.1rem;border-radius:14px;background:var(--navy);color:#fff;font-size:1.1rem;font-weight:800;line-height:1.2;text-decoration:none;transition:transform .15s ease,background .15s ease}
.tile .ico{width:2.25rem;height:2.25rem;color:var(--gold)}
.tile:hover{background:var(--gold);color:var(--navy);transform:translateY(-2px)}
.tile:hover .ico{color:var(--navy)}
@media (prefers-reduced-motion:reduce){.tile{transition:none}.tile:hover{transform:none}}

.two{display:grid;gap:2.5rem;padding-top:2.75rem}
@media (min-width:880px){.two{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)}}
.acc{border-top:2px solid var(--navy)}
.acc details{border-bottom:1px solid var(--line)}
.acc summary{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:3.5rem;padding:.6rem .25rem;cursor:pointer;list-style:none;color:var(--navy);font-weight:800;font-size:1.1rem}
.acc summary::-webkit-details-marker{display:none}
.acc summary::after{content:"+";flex:none;display:grid;place-items:center;width:2rem;height:2rem;border-radius:50%;background:var(--navy-tint);font-size:1.3rem;line-height:1}
.acc details[open] summary::after{content:"\\2212"}
.acc details > div{padding:0 .25rem 1rem}
.acc p{margin:0 0 .5rem;overflow-wrap:anywhere}
.acc a{font-weight:800}
.list{margin:0;padding:0;list-style:none;display:grid;gap:1rem}
.list a{display:grid;grid-template-columns:5.5rem 1fr;gap:1rem;align-items:center;padding:.6rem;border-radius:12px;background:var(--navy-tint);color:var(--ink);text-decoration:none}
.list a:hover{background:#e0e7f4}
.thumb{aspect-ratio:1;border-radius:10px;overflow:hidden;background:var(--navy)}
.thumb img{width:100%;height:100%;object-fit:cover}
.thumb .cross{display:block;width:1.4rem;height:1.9rem;margin:1.6rem auto;color:var(--gold)}
.list b{display:block;color:var(--navy);font-size:1.05rem;line-height:1.25}
.list small{color:var(--muted)}

.ft{margin-top:3.5rem;background:var(--navy);color:#dfe5f2;border-top:4px solid var(--gold)}
.ft a{color:#f0d993}
.ft__in{display:flex;flex-wrap:wrap;justify-content:space-between;gap:1.5rem 2rem;padding-block:2rem}
.ft p{margin:0 0 .3rem}
.ft b{color:#fff;font-size:1.1rem}
.ft address{font-style:normal}
.fb{display:inline-flex;align-items:center;gap:.5rem;font-weight:700}
.fb svg{width:1.35rem;height:1.35rem}
.ft__legal{padding-block:1rem;border-top:1px solid rgb(255 255 255/.15);font-size:.875rem}
.ft__legal p{margin:0}

.crumbs{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;margin:1.5rem 0 0}
.crumbs a{display:inline-flex;align-items:center;min-height:2.5rem;padding:0 .9rem;border-radius:999px;background:var(--navy-tint);font-weight:800;text-decoration:none}
.art{max-width:44rem}
.art h1{margin:1.25rem 0 .5rem;font-size:clamp(2rem,4.5vw,2.8rem);font-weight:800}
.art__meta{margin:0 0 1.25rem;color:var(--muted)}
.art__lead{margin:0 0 1.5rem;font-size:1.3rem;font-weight:700;color:var(--navy)}
.art__img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:14px;margin-bottom:1.75rem}
.prose p{margin:0 0 1.15rem}
.next .tiles{grid-template-columns:repeat(auto-fill,minmax(min(100%,9rem),1fr))}
.next .tile{min-height:7rem;font-size:1rem}
.sec{padding-top:2.5rem}
`;

const header = (c) => `<header class="hd"><div class="wrap hd__bar">
<a class="brand" href="index.html">${cross()}<span>${esc(c.title)}</span></a>
<nav class="hd__links" aria-label="Quick links"><a class="pill" href="#">${icon('clock')}Services</a><a class="pill pill--gold" href="index.html#signposts">${icon('home')}All sections</a></nav>
</div></header>`;

const footer = (c) => `<footer class="ft"><div class="wrap ft__in">
<div><p><b>${esc(c.title)}</b></p><address>${c.address.map(esc).join(', ')}</address><p><a href="#">Get directions</a></p></div>
<div><p><a href="#">Contact Us</a> &middot; <a href="#">Site Map</a></p><a class="fb" href="#">${facebookIcon()}Find us on Facebook</a></div>
</div><div class="wrap ft__legal"><p>&copy; ${c.today.date.getUTCFullYear()} ${esc(c.title)} &middot; <a href="#">Privacy Policy</a> &middot; <a href="#">Cookie Policy</a></p></div></footer>`;

const tiles = (signs) => `<ul class="tiles">${signs.map(([label, ico]) => `<li><a class="tile" href="#">${icon(ico)}<span>${esc(label)}</span></a></li>`).join('')}</ul>`;

export default {
  slug: '07-signposts',
  name: 'Signposts',
  group: 'layout',
  summary: 'No dropdown menus. The home page is a set of big, clear buttons to every part of the site, with notices you tap to open. Easy on a phone.',
  needs: 'Nothing new.',
  fonts: 'family=Nunito:wght@400;700;800',
  css,
  home: (c) => `${header(c)}
<main>
<section class="hero"><img src="../img/interior.jpg" alt=""><div class="wrap"><h1>${esc(c.title)}</h1><p>${esc(c.tagline)}</p></div></section>
<section class="wrap signs" id="signposts"><h2>Where would you like to go?</h2>${tiles(SIGNS)}</section>
<div class="wrap two">
<section><h2 class="h2">Church Notices</h2>
<div class="acc">${c.notices.map((n, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(n.title)}</summary><div><p>${esc(n.summary)}</p><a href="#">Read the full notice</a></div></details>`).join('')}</div></section>
<section><h2 class="h2">Latest from the Blog</h2>
<ul class="list">${c.posts.map((p) => `<li><a href="${p.href}"><span class="thumb">${p.image ? `<img src="../${p.image}" alt="">` : cross()}</span><span><b>${esc(p.title)}</b><small>${esc(p.dateText)}</small></span></a></li>`).join('')}</ul></section>
</div>
</main>
${footer(c)}`,
  article: (c) => {
    const a = c.article;
    return `${header(c)}
<main class="wrap">
<nav class="crumbs" aria-label="You are here"><a href="index.html">&larr; Home</a><a href="#">Blog</a><a href="#">${esc(a.topic)}</a></nav>
<article class="art">
<h1>${esc(a.title)}</h1>
<p class="art__meta">By ${esc(a.author)} &middot; ${esc(a.dateText)}</p>
<p class="art__lead">${esc(a.lead)}</p>
<img class="art__img" src="../${a.image}" alt="${esc(a.imageAlt)}">
<div class="prose">${a.body}</div>
</article>
<section class="sec next"><h2>Where next?</h2>${tiles([['Blog', 'pen'], ['Notices', 'notice'], ['Calendar', 'calendar'], ['Church services', 'clock'], ['Contact us', 'mail']])}</section>
</main>
${footer(c)}`;
  },
};
