import { esc, cross, facebookIcon, navItems } from '../shared.mjs';

const css = `
/* Blue and gold, but the home page leads with what a visitor needs: when to come, where, and what's coming up. */
:root{--navy:#002060;--navy-deep:#00174a;--navy-tint:#eef2f9;--gold:#c8a85a;--gold-pale:#f6eed8;--gold-text:#7a6326;--ink:#1d2330;--muted:#596070;--page:#ffffff;--line:#dce1eb;
--font:'Mulish','Century Gothic',sans-serif}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font:400 1.0625rem/1.6 var(--font);color:var(--ink);background:var(--page)}
img{display:block;max-width:100%}
a{color:var(--navy);text-underline-offset:.15em}
h1,h2,h3{color:var(--navy);line-height:1.2;text-wrap:balance}
.wrap{max-width:74rem;margin:0 auto;padding-left:max(1rem,env(safe-area-inset-left,0px));padding-right:max(1rem,env(safe-area-inset-right,0px))}
:focus-visible{outline:3px solid var(--gold);outline-offset:2px}

.hd{position:relative;background:var(--navy);color:#fff}
.hd__bar{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:4rem}
.brand{display:flex;align-items:center;gap:.55rem;color:#fff;text-decoration:none;font-weight:800;font-size:1.2rem;white-space:nowrap}
.brand .cross{width:.8rem;height:1.1rem;color:var(--gold)}
.hd__nav ul{display:flex;flex-wrap:wrap;margin:0;padding:0;list-style:none}
.hd__nav a{display:block;padding:.5rem .55rem;color:#dfe5f2;text-decoration:none;font-weight:600;font-size:.93rem;border-radius:6px}
.hd__nav a:hover{background:rgb(255 255 255/.1);color:#fff}
.hd__nav a[aria-current]{color:var(--gold)}
.hd__menu{display:none}
.hd__menu summary{list-style:none;cursor:pointer;padding:.45rem .9rem;border-radius:6px;background:var(--gold);color:var(--navy);font-weight:800}
.hd__menu summary::-webkit-details-marker{display:none}
.hd__menu ul{position:absolute;left:0;right:0;top:100%;z-index:20;margin:0;padding:.25rem max(1rem,env(safe-area-inset-left,0px)) 1rem;list-style:none;background:var(--navy)}
.hd__menu a{display:block;padding:.7rem 0;color:#fff;text-decoration:none;border-bottom:1px solid rgb(255 255 255/.14)}
@media (max-width:1080px){.hd__nav{display:none}.hd__menu{display:block}}

.welcome{display:grid;background:var(--navy);color:#fff}
@media (min-width:880px){.welcome{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
.welcome__text{padding:2.75rem max(1.25rem,env(safe-area-inset-left,0px)) 3rem;max-width:38rem;justify-self:end;width:100%}
@media (min-width:880px){.welcome__text{padding-right:3rem}}
.eyebrow{margin:0 0 .5rem;color:var(--gold);font-weight:800;font-size:.85rem;letter-spacing:.1em;text-transform:uppercase}
.welcome h1{margin:0 0 .75rem;color:#fff;font-size:clamp(2.1rem,4.6vw,3.1rem);font-weight:800}
.welcome__lead{margin:0 0 1.5rem;font-size:1.15rem;color:#dfe5f2}
.times{display:grid;gap:.75rem;margin:0 0 1.75rem;padding:0;list-style:none}
.times li{display:grid;grid-template-columns:7.5rem 1fr;gap:.75rem;padding:.75rem 1rem;border-radius:8px;background:rgb(255 255 255/.07);border-left:4px solid var(--gold)}
.times b{display:block;color:var(--gold);font-size:1.25rem;font-variant-numeric:tabular-nums}
.times small{display:block;color:#c5cee0;font-size:.85rem}
.times span{font-weight:700}
.times span small{font-weight:400}
.btns{display:flex;flex-wrap:wrap;gap:.75rem}
.btn{display:inline-flex;align-items:center;min-height:2.9rem;padding:0 1.3rem;border-radius:999px;font-weight:800;text-decoration:none}
.btn--gold{background:var(--gold);color:var(--navy)}
.btn--line{border:2px solid rgb(255 255 255/.6);color:#fff}
.btn:hover{filter:brightness(1.08)}
.welcome__photo{min-height:18rem}
.welcome__photo img{width:100%;height:100%;object-fit:cover}

.coming{padding-block:2.25rem;background:var(--gold-pale)}
.coming h2{margin:0 0 1rem;font-size:1.45rem;font-weight:800}
.dates{display:grid;gap:1rem;margin:0;padding:0;list-style:none;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))}
.date{display:flex;gap:1rem;align-items:center;padding:.9rem 1rem;border-radius:10px;background:var(--page);box-shadow:0 1px 3px rgb(0 32 96/.1)}
.date__cal{flex:none;display:grid;place-items:center;width:3.75rem;padding:.35rem 0;border-radius:8px;background:var(--navy);color:#fff;line-height:1.05;text-align:center}
.date__cal b{font-size:1.6rem}
.date__cal span{font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;color:var(--gold)}
.date strong{display:block;color:var(--navy)}
.date small{color:var(--muted);font-size:.9rem}
.date--special .date__cal{background:var(--gold);color:var(--navy)}
.date--special .date__cal span{color:var(--navy)}
.coming__note{margin:1rem 0 0;color:var(--muted);font-size:.95rem}

.split{display:grid;gap:2.5rem;padding-top:2.75rem}
@media (min-width:900px){.split{grid-template-columns:minmax(0,1.7fr) minmax(0,1fr)}}
.head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:.5rem 1rem;margin-bottom:.75rem}
.head h2{margin:0;font-size:1.6rem;font-weight:800}
.head a{font-weight:700;font-size:.95rem}
.notices{margin:0;padding:0;list-style:none;border-top:2px solid var(--navy)}
.notices li{padding:.9rem 0;border-bottom:1px solid var(--line)}
.notices h3{margin:0 0 .2rem;font-size:1.1rem;font-weight:800}
.notices h3 a{text-decoration:none}
.notices h3 a:hover{text-decoration:underline}
.notices p{margin:0;color:var(--muted);overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.side{display:grid;gap:1.25rem;align-content:start}
.box{padding:1.25rem 1.4rem;border-radius:10px;background:var(--navy-tint)}
.box h2{margin:0 0 .6rem;font-size:1.2rem;font-weight:800}
.box p{margin:0 0 .5rem}
.box address{font-style:normal;margin-bottom:.75rem}
.map{display:block;margin:0 0 .9rem;border-radius:8px;overflow:hidden;aspect-ratio:16/10}
.map img{width:100%;height:100%;object-fit:cover}

.posts{display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))}
.post{display:grid;grid-template-columns:7rem 1fr;gap:1rem;align-items:start;min-width:0}
.post__img{aspect-ratio:1;border-radius:8px;overflow:hidden;background:var(--navy)}
.post__img img{width:100%;height:100%;object-fit:cover}
.post__noimg{display:grid;place-items:center;height:100%;color:var(--gold)}
.post__noimg .cross{width:1.5rem;height:2rem}
.post small{color:var(--muted);font-size:.875rem}
.post h3{margin:.1rem 0 .3rem;font-size:1.1rem;font-weight:800}
.post h3 a{text-decoration:none}
.post h3 a:hover{text-decoration:underline}
.post p{margin:0;font-size:.95rem}
.sec{padding-top:2.75rem}

.ft{margin-top:3.5rem;background:var(--navy-deep);color:#dfe5f2;border-top:4px solid var(--gold)}
.ft a{color:#f0d993}
.ft__grid{display:grid;gap:2rem;padding-block:2.25rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))}
.ft h2{margin:0 0 .5rem;color:#fff;font-size:.85rem;text-transform:uppercase;letter-spacing:.08em}
.ft ul{margin:0;padding:0;list-style:none}
.ft address{font-style:normal}
.ft p{margin:0 0 .4rem}
.fb{display:inline-flex;align-items:center;gap:.5rem}
.fb svg{width:1.35rem;height:1.35rem}
.ft__legal{padding-block:1rem;border-top:1px solid rgb(255 255 255/.15);font-size:.875rem}
.ft__legal p{margin:0}

.art__grid{display:grid;gap:2.5rem;padding-top:2rem}
@media (min-width:900px){.art__grid{grid-template-columns:minmax(0,1fr) 19rem}}
.crumbs{margin:0 0 .5rem;font-size:.9rem;color:var(--muted)}
.art h1{margin:0 0 .6rem;font-size:clamp(1.9rem,4vw,2.6rem);font-weight:800}
.art__meta{margin:0 0 1.25rem;color:var(--muted)}
.art__lead{margin:0 0 1.5rem;font-size:1.25rem;font-weight:600;color:var(--navy)}
.art__img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:10px;margin-bottom:1.75rem}
.prose{max-width:40rem}
.prose p{margin:0 0 1.1rem}
.join{position:sticky;top:1rem;padding:1.4rem;border-radius:10px;background:var(--navy);color:#fff}
.join h2{margin:0 0 .75rem;color:#fff;font-size:1.25rem}
.join .times{margin-bottom:1rem}
.join .times li{grid-template-columns:5.5rem 1fr}
.join .times b{font-size:1.05rem}
`;

const header = (c, current) => `<header class="hd"><div class="wrap hd__bar">
<a class="brand" href="index.html">${cross()}<span>${esc(c.title)}</span></a>
<nav class="hd__nav" aria-label="Main"><ul>${navItems(c, current)}</ul></nav>
<details class="hd__menu"><summary>Menu</summary><ul>${navItems(c, current)}</ul></details>
</div></header>`;

const times = (c) => `<ul class="times">${c.services.regular.map((s) => `<li><b>${esc(s.time)}<small>${esc(s.day)}</small></b><span>${esc(s.name)}<small>${esc(s.detail)}</small></span></li>`).join('')}</ul>`;

const footer = (c) => `<footer class="ft"><div class="wrap ft__grid">
<div><h2>${esc(c.title)}</h2><p>${esc(c.tagline)}</p></div>
<div><h2>Find us</h2><address>${c.address.map(esc).join(', ')}</address></div>
<div><h2>Visit</h2><ul><li><a href="#">Regular Church Services</a></li><li><a href="#">Church Calendar</a></li><li><a href="#">Contact Us</a></li></ul></div>
<div><h2>Follow us</h2><a class="fb" href="#">${facebookIcon()}Find us on Facebook</a></div>
</div><div class="wrap ft__legal"><p>&copy; ${c.today.date.getUTCFullYear()} ${esc(c.title)} &middot; <a href="#">Privacy Policy</a> &middot; <a href="#">Cookie Policy</a> &middot; <a href="#">Safeguarding</a></p></div></footer>`;

const post = (p) => `<article class="post"><div class="post__img">${p.image ? `<img src="../${p.image}" alt="">` : `<span class="post__noimg">${cross()}</span>`}</div>
<div><small>${esc(p.dateText)}</small><h3><a href="${p.href}">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p></div></article>`;

export default {
  slug: '05-welcome-first',
  name: 'Welcome first',
  group: 'layout',
  summary: 'The home page opens with what a visitor needs: service times, where to find the church and the next few Sundays. Notices and the blog follow.',
  needs: 'Service times kept in Site settings, updated when they change. The Sundays list fills itself from those.',
  fonts: 'family=Mulish:wght@400;600;700;800',
  css,
  home: (c) => {
    const s = c.services;
    return `${header(c, 'Home')}
<main>
<section class="welcome">
<div class="welcome__text">
<p class="eyebrow">${esc(c.title)}</p>
<h1>Join us on Sunday at 9:30am</h1>
<p class="welcome__lead">${esc(s.welcome)}.</p>
${times(c)}
<div class="btns"><a class="btn btn--gold" href="#">Get directions</a><a class="btn btn--line" href="#">All service times</a></div>
</div>
<div class="welcome__photo"><img src="../img/exterior.jpg" alt="St Paul's Church, Warton, in spring"></div>
</section>
<section class="coming"><div class="wrap">
<h2>The next four Sundays</h2>
<ul class="dates">${s.sundays.map((d) => `<li class="date${d.name === 'Remembrance Sunday' ? ' date--special' : ''}"><span class="date__cal"><b>${d.day}</b><span>${esc(d.mon)}</span></span><span><strong>${esc(d.name)}</strong><small>${esc(d.weekday)} at ${esc(d.time)}</small></span></li>`).join('')}</ul>
<p class="coming__note">${esc(s.monthly)} Said Communion is every Wednesday at 9:30am.</p>
</div></section>
<div class="wrap split">
<section><div class="head"><h2>Church Notices</h2><a href="#">All notices</a></div>
<ul class="notices">${c.notices.map((n) => `<li><h3><a href="#">${esc(n.title)}</a></h3><p>${esc(n.summary)}</p></li>`).join('')}</ul></section>
<aside class="side">
<section class="box"><h2>Find us</h2><a class="map" href="#"><img src="../img/map.jpg" alt="Map showing St Paul's Church, Warton"></a>
<address>${c.address.map(esc).join(', ')}</address><a href="#">Get directions</a></section>
<section class="box"><h2>Talk to us</h2><p>${esc(c.clergy.name)}</p><p>${esc(c.clergy.phone)}</p><a href="#">Send us a message</a></section>
</aside>
</div>
<section class="wrap sec"><div class="head"><h2>From the Blog</h2><a href="#">All articles</a></div>
<div class="posts">${c.posts.map(post).join('')}</div></section>
</main>
${footer(c)}`;
  },
  article: (c) => {
    const a = c.article;
    return `${header(c, 'Blog')}
<main class="wrap art__grid">
<article class="art">
<p class="crumbs"><a href="index.html">Home</a> &rsaquo; <a href="#">Blog</a> &rsaquo; <a href="#">${esc(a.topic)}</a></p>
<h1>${esc(a.title)}</h1>
<p class="art__meta">By ${esc(a.author)} &middot; ${esc(a.dateText)}</p>
<p class="art__lead">${esc(a.lead)}</p>
<img class="art__img" src="../${a.image}" alt="${esc(a.imageAlt)}">
<div class="prose">${a.body}</div>
</article>
<aside><div class="join"><h2>Join us on Sunday</h2>${times(c)}<a class="btn btn--gold" href="#">Get directions</a></div></aside>
</main>
${footer(c)}`;
  },
};
