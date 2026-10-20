import { esc, cross, facebookIcon, navItems } from '../shared.mjs';

// The strip of coloured panes, a fixed pattern so every page shows the same window.
const PANES = 'rsaesrea sraesaer asrerase'.replace(/ /g, '').split('');
const glass = () => `<div class="glass" aria-hidden="true">${PANES.map((p) => `<span class="p-${p}"></span>`).join('')}</div>`;

const css = `
/* New colours from a stained glass window: ruby, sapphire, emerald and amber on white, with dark lead lines.
   Each part of the site keeps its own colour, so people learn where they are. */
:root{--lead:#17181f;--paper:#ffffff;--wash:#f5f5f7;--ink:#1a1b22;--muted:#555a66;--line:#dfe0e6;
--ruby:#a3172f;--sapphire:#1c3f95;--emerald:#0b6b52;--amber:#e3a21a;--amber-text:#8a5a00;
--display:'Bricolage Grotesque','Arial Black',sans-serif;--sans:'Figtree','Segoe UI',sans-serif}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font:400 1.0625rem/1.65 var(--sans);color:var(--ink);background:var(--paper)}
img{display:block;max-width:100%}
a{color:var(--sapphire);text-underline-offset:.15em}
h1,h2,h3{font-family:var(--display);font-weight:800;color:var(--lead);line-height:1.1;text-wrap:balance}
.wrap{max-width:74rem;margin:0 auto;padding-left:max(1rem,env(safe-area-inset-left,0px));padding-right:max(1rem,env(safe-area-inset-right,0px))}
:focus-visible{outline:3px solid var(--amber);outline-offset:2px}

.glass{display:grid;grid-template-columns:repeat(24,1fr);gap:3px;height:16px;padding:3px;background:var(--lead)}
.p-r{background:var(--ruby)}.p-s{background:var(--sapphire)}.p-e{background:var(--emerald)}.p-a{background:var(--amber)}

.hd{position:relative;background:var(--lead);color:#fff}
.hd__bar{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:4.25rem}
.brand{display:flex;align-items:center;gap:.6rem;color:#fff;text-decoration:none;font:800 1.35rem var(--display)}
.brand .cross{width:.85rem;height:1.15rem;color:var(--amber)}
.hd__nav ul{display:flex;flex-wrap:wrap;margin:0;padding:0;list-style:none}
.hd__nav a{display:block;padding:.5rem .55rem;color:#e6e7ec;font-weight:500;text-decoration:none;border-bottom:3px solid transparent}
.hd__nav a:hover,.hd__nav a[aria-current]{color:#fff;border-bottom-color:var(--amber)}
.hd__menu{display:none}
.hd__menu summary{list-style:none;cursor:pointer;padding:.45rem 1rem;border-radius:6px;background:var(--amber);color:var(--lead);font-weight:700}
.hd__menu summary::-webkit-details-marker{display:none}
.hd__menu ul{position:absolute;left:0;right:0;top:100%;z-index:20;margin:0;padding:.5rem max(1rem,env(safe-area-inset-left,0px)) 1rem;list-style:none;background:var(--lead)}
.hd__menu a{display:block;padding:.65rem 0;border-bottom:1px solid rgb(255 255 255/.14);color:#fff;text-decoration:none;font-weight:600}
@media (max-width:1080px){.hd__nav{display:none}.hd__menu{display:block}}

.hero{display:grid;gap:2.5rem;align-items:center;padding-block:3rem}
@media (min-width:860px){.hero{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)}}
.hero h1{margin:0 0 1rem;font-size:clamp(2.8rem,7.5vw,5.2rem);letter-spacing:-.02em}
.hero__tag{margin:0 0 1.75rem;font:700 clamp(1.3rem,3vw,1.8rem)/1.25 var(--display)}
.hero__tag span{display:block}
.hero__tag span:first-child{color:var(--sapphire)}
.hero__tag span:last-child{color:var(--ruby)}
.chips{display:flex;flex-wrap:wrap;gap:.6rem;margin:0;padding:0;list-style:none}
.chips li{display:flex;flex-direction:column;padding:.6rem 1rem;border-radius:10px;background:var(--wash);border-left:5px solid var(--sapphire)}
.chips b{font:800 1.2rem var(--display)}
.chips span{color:var(--muted);font-size:.9rem}
.arch{justify-self:center;width:min(100%,24rem);padding:12px 12px 0}
.arch img{width:100%;aspect-ratio:11/14;object-fit:cover;border-radius:50% 50% 0 0/39% 39% 0 0;box-shadow:0 0 0 6px var(--lead),0 0 0 12px var(--amber),0 0 0 15px var(--lead)}

.label{display:inline-flex;align-items:center;gap:.5rem;margin:0 0 .5rem;font-weight:700;font-size:.85rem;letter-spacing:.1em;text-transform:uppercase}
.label::before{content:"";width:.9rem;height:.9rem;border:2px solid var(--lead);background:currentColor}
.sec{padding-top:3rem}
.sec__head{display:flex;flex-wrap:wrap;align-items:end;justify-content:space-between;gap:.5rem 1rem;margin-bottom:1.25rem}
.sec__head h2{margin:0;font-size:clamp(1.8rem,4vw,2.4rem)}
.sec__head a{font-weight:700}
.sec--notices .label{color:var(--ruby)}
.sec--blog .label{color:var(--emerald)}

.notices{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))}
.notice{display:flex;flex-direction:column;gap:.4rem;min-width:0;padding:1.1rem 1.25rem;border-radius:4px;background:var(--wash);border-top:5px solid var(--ruby);color:var(--ink);text-decoration:none}
.notice:hover{background:#fbeef0}
.notice h3{margin:0;font-size:1.2rem}
.notice p{margin:0;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}

.sundays{margin-top:3rem;background:var(--sapphire);color:#fff}
.sundays .wrap{display:grid;gap:1.5rem;padding-block:2.25rem}
@media (min-width:860px){.sundays .wrap{grid-template-columns:16rem 1fr;align-items:center}}
.sundays h2{margin:0;color:#fff;font-size:2rem}
.sundays .label{color:var(--amber)}
.sundays .label::before{border-color:#fff}
.sundays ul{display:grid;gap:.75rem;margin:0;padding:0;list-style:none;grid-template-columns:repeat(auto-fit,minmax(min(100%,12rem),1fr))}
.sundays li{padding:.8rem 1rem;border-radius:4px;background:rgb(255 255 255/.1);border-top:4px solid var(--amber)}
.sundays li b{display:block;font:800 1.3rem var(--display)}
.sundays li span{display:block;color:#d9e1f5;font-size:.95rem}

.cards{display:grid;gap:1.5rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))}
.card{min-width:0}
.card__img{aspect-ratio:4/3;border-radius:10rem 10rem 4px 4px/7rem 7rem 4px 4px;overflow:hidden;background:var(--emerald);border:4px solid var(--lead)}
.card__img img{width:100%;height:100%;object-fit:cover}
.card__noimg{display:grid;place-items:center;height:100%;color:var(--amber)}
.card__noimg .cross{width:2.25rem;height:3rem}
.card small{display:block;margin-top:.85rem;color:var(--emerald);font-weight:700}
.card h3{margin:.2rem 0 .4rem;font-size:1.35rem}
.card h3 a{color:var(--lead);text-decoration:none}
.card h3 a:hover{color:var(--emerald);text-decoration:underline}
.card p{margin:0;color:var(--muted)}

.ft{margin-top:4rem;background:var(--lead);color:#e3e4ea}
.ft a{color:#f3c860}
.ft__grid{display:grid;gap:2rem;padding-block:2.5rem 2rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))}
.ft__name{margin:0 0 .3rem;color:#fff;font:800 1.5rem/1.1 var(--display)}
.ft h2{margin:0 0 .5rem;color:#fff;font-size:1rem}
.ft ul{margin:0;padding:0;list-style:none}
.ft address{font-style:normal}
.ft p{margin:0 0 .4rem}
.fb{display:inline-flex;align-items:center;gap:.5rem}
.fb svg{width:1.35rem;height:1.35rem}
.ft__legal{padding-block:1rem;border-top:1px solid rgb(255 255 255/.15);font-size:.9rem}
.ft__legal p{margin:0}

.art__grid{display:grid;gap:3rem;padding-top:2.5rem}
@media (min-width:920px){.art__grid{grid-template-columns:minmax(0,1fr) 18rem}}
.art .label{color:var(--emerald)}
.art h1{margin:0 0 .75rem;font-size:clamp(2.2rem,5vw,3.4rem);letter-spacing:-.01em}
.art__meta{margin:0 0 1.25rem;color:var(--muted)}
.art__lead{margin:0 0 1.75rem;font:700 1.35rem/1.4 var(--display);color:var(--emerald)}
.art__img{width:100%;aspect-ratio:16/10;object-fit:cover;border:4px solid var(--lead);border-radius:4px;margin-bottom:2rem}
.prose{max-width:42rem;font-size:1.125rem}
.prose p{margin:0 0 1.2rem}
.side{align-self:start;padding:1.25rem;border-radius:4px;background:var(--wash);border-top:5px solid var(--emerald)}
.side h2{margin:0 0 .6rem;font-size:1.2rem}
.side ul{margin:0 0 1.25rem;padding:0;list-style:none}
.side ul:last-child{margin:0}
.side li{padding:.35rem 0;border-bottom:1px solid var(--line)}
.side a{color:var(--ink);text-decoration:none}
.side a:hover{color:var(--emerald);text-decoration:underline}
`;

const header = (c, current) => `<header class="hd"><div class="wrap hd__bar">
<a class="brand" href="index.html">${cross()}<span>${esc(c.title)}</span></a>
<nav class="hd__nav" aria-label="Main"><ul>${navItems(c, current)}</ul></nav>
<details class="hd__menu"><summary>Menu</summary><ul>${navItems(c, current)}</ul></details>
</div></header>${glass()}`;

const footer = (c) => `<footer class="ft">${glass()}<div class="wrap ft__grid">
<div><p class="ft__name">${esc(c.title)}</p><p>${esc(c.tagline)}</p></div>
<div><h2>Find us</h2><address>${c.address.map(esc).join('<br>')}</address><p><a href="#">Get directions</a></p></div>
<div><h2>Visit</h2><ul><li><a href="#">Regular Church Services</a></li><li><a href="#">Church Calendar</a></li><li><a href="#">Contact Us</a></li><li><a href="#">Safeguarding</a></li></ul></div>
<div><h2>Follow us</h2><a class="fb" href="#">${facebookIcon()}Find us on Facebook</a></div>
</div><div class="wrap ft__legal"><p>&copy; ${c.today.date.getUTCFullYear()} ${esc(c.title)} &middot; <a href="#">Privacy Policy</a> &middot; <a href="#">Cookie Policy</a> &middot; <a href="#">Site Map</a></p></div></footer>`;

export default {
  slug: '09-stained-glass',
  name: 'Stained glass',
  group: 'overhaul',
  summary: 'Bold and colourful, taken from a stained glass window: ruby, sapphire, emerald and amber with dark lead lines. Each part of the site has its own colour, and photos sit in arched frames.',
  needs: 'Service times kept in Site settings.',
  fonts: 'family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@400;500;700',
  css,
  home: (c) => `${header(c, 'Home')}
<main>
<section class="wrap hero">
<div>
<h1>${esc(c.title)}</h1>
<p class="hero__tag"><span>${esc(c.taglineParts[0])}</span><span>${esc(c.taglineParts[1])}</span></p>
<ul class="chips">${c.services.regular.map((s) => `<li><b>${esc(s.day)} ${esc(s.time)}</b><span>${esc(s.name)}</span></li>`).join('')}</ul>
</div>
<div class="arch"><img src="../img/exterior.jpg" alt="St Paul's Church, Warton, in spring"></div>
</section>
<section class="wrap sec sec--notices"><div class="sec__head"><div><p class="label">Notices</p><h2>Church Notices</h2></div><a href="#">All notices</a></div>
<div class="notices">${c.notices.slice(0, 3).map((n) => `<a class="notice" href="#"><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p></a>`).join('')}</div></section>
<section class="sundays"><div class="wrap"><div><p class="label">Services</p><h2>Coming Sundays</h2></div>
<ul>${c.services.sundays.map((d) => `<li><b>${d.day} ${esc(d.month)}</b><span>${esc(d.time)}, ${esc(d.name)}</span></li>`).join('')}</ul></div></section>
<section class="wrap sec sec--blog"><div class="sec__head"><div><p class="label">Blog</p><h2>Latest from the Blog</h2></div><a href="#">All articles</a></div>
<div class="cards">${c.posts.map((p) => `<article class="card"><div class="card__img">${p.image ? `<img src="../${p.image}" alt="">` : `<span class="card__noimg">${cross()}</span>`}</div>
<small>${esc(p.dateText)}</small><h3><a href="${p.href}">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p></article>`).join('')}</div></section>
</main>
${footer(c)}`,
  article: (c) => {
    const a = c.article;
    return `${header(c, 'Blog')}
<main class="wrap art__grid">
<article class="art">
<p class="label">Blog &middot; ${esc(a.topic)}</p>
<h1>${esc(a.title)}</h1>
<p class="art__meta">By ${esc(a.author)} &middot; ${esc(a.dateText)}</p>
<p class="art__lead">${esc(a.lead)}</p>
<img class="art__img" src="../${a.image}" alt="${esc(a.imageAlt)}">
<div class="prose">${a.body}</div>
</article>
<aside class="side"><h2>Blog Topics</h2><ul>${c.topics.map((t) => `<li><a href="#">${esc(t)}</a></li>`).join('')}</ul>
<h2>Latest</h2><ul>${c.latestTitles.map((t) => `<li><a href="${t === a.title ? 'article.html' : '#'}">${esc(t)}</a></li>`).join('')}</ul></aside>
</main>
${footer(c)}`;
  },
};
