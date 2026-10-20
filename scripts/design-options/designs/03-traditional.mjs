import { esc, cross, facebookIcon, navItems } from '../shared.mjs';

const css = `
/* Same layout, dressed like a church noticeboard: the name set in a classic book face, centred under a gold cross. */
:root{--navy:#002060;--navy-deep:#001a4f;--gold:#c8a85a;--gold-soft:#e6d6a8;--gold-text:#7a6326;--ink:#20242e;--muted:#5a606c;--page:#ffffff;--wash:#f5f6f9;--line:#dfe2e8;
--serif:'EB Garamond',Garamond,'Times New Roman',serif;--sans:'Mulish','Century Gothic',sans-serif}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font:400 1.0625rem/1.65 var(--sans);color:var(--ink);background:var(--page)}
img{display:block;max-width:100%}
a{color:var(--navy);text-underline-offset:.15em}
h1,h2,h3{font-family:var(--serif);font-weight:600;color:var(--navy);line-height:1.15;text-wrap:balance}
.wrap{max-width:72rem;margin:0 auto;padding-left:max(1rem,env(safe-area-inset-left,0px));padding-right:max(1rem,env(safe-area-inset-right,0px))}
:focus-visible{outline:3px solid var(--gold);outline-offset:2px}

.hd{position:relative;background:var(--navy);color:#fff;text-align:center}
.hd__top{padding-block:1.6rem 1.2rem}
.brand{display:inline-flex;flex-direction:column;align-items:center;gap:.35rem;color:#fff;text-decoration:none}
.brand .cross{width:1rem;height:1.35rem;color:var(--gold)}
.brand__name{font:600 clamp(2rem,5.5vw,3.1rem)/1 var(--serif);font-variant-caps:small-caps;letter-spacing:.05em}
.brand__tag{font:italic 400 clamp(1.05rem,2.4vw,1.3rem)/1.3 var(--serif);color:var(--gold-soft)}
.hd__nav{border-top:1px solid rgb(200 168 90/.45);border-bottom:4px double var(--gold)}
.hd__nav ul{display:flex;flex-wrap:wrap;justify-content:center;margin:0 auto;list-style:none}
.hd__nav a{display:block;padding:.7rem .7rem;color:#e5e9f3;text-decoration:none;font-size:.8rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.hd__nav a:hover,.hd__nav a[aria-current]{color:var(--gold)}
.hd__menu{display:none;padding-bottom:1rem}
.hd__menu summary{display:inline-block;list-style:none;cursor:pointer;padding:.45rem 1.1rem;border:1px solid var(--gold);color:var(--gold-soft);font-size:.85rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.hd__menu summary::-webkit-details-marker{display:none}
.hd__menu ul{margin:.75rem 0 0;padding:0;list-style:none}
.hd__menu a{display:block;padding:.6rem 0;color:#fff;text-decoration:none;font-family:var(--serif);font-size:1.25rem;border-top:1px solid rgb(255 255 255/.12)}
@media (max-width:900px){.hd__nav{display:none}.hd__menu{display:block}.hd{border-bottom:4px double var(--gold)}}

.photo{height:clamp(14rem,34vw,26rem);overflow:hidden;background:var(--navy)}
.photo img{width:100%;height:100%;object-fit:cover;object-position:50% 40%}
.welcome{max-width:46rem;margin:0 auto;padding-block:2.25rem .5rem;text-align:center;font:italic 400 clamp(1.3rem,3vw,1.65rem)/1.4 var(--serif);color:var(--navy)}

.orn{display:flex;align-items:center;gap:1rem;max-width:34rem;margin:3rem auto 1.5rem;font-size:clamp(1.7rem,3.5vw,2.2rem);text-align:center}
.orn::before,.orn::after{content:"";flex:1;height:1px;background:var(--gold)}
.orn a{text-decoration:none}

.notices{max-width:46rem;margin:0 auto;padding:0;list-style:none}
.notices li{padding:1.1rem 0;border-bottom:1px solid var(--line)}
.notices li:first-child{border-top:1px solid var(--line)}
.notices h3{margin:0 0 .3rem;font-size:1.45rem}
.notices h3 a{text-decoration:none}
.notices h3 a:hover{text-decoration:underline}
.notices p{margin:0;overflow-wrap:anywhere}
.more{display:inline-block;margin-top:.35rem;color:var(--gold-text);font-size:.8rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}

.cards{display:grid;gap:2rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))}
.card{min-width:0;text-align:center}
.card__img{display:block;padding:6px;border:1px solid var(--gold);aspect-ratio:4/3;background:var(--page)}
.card__img img,.card__noimg{width:100%;height:100%;object-fit:cover}
.card__noimg{display:grid;place-items:center;background:var(--navy);color:var(--gold)}
.card__noimg .cross{width:2rem;height:2.7rem}
.card__meta{margin:.9rem 0 .25rem;color:var(--gold-text);font-size:.78rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.card h3{margin:0 0 .4rem;font-size:1.5rem}
.card h3 a{text-decoration:none}
.card h3 a:hover{text-decoration:underline}
.card p{margin:0}

.ft{margin-top:4rem;background:var(--navy);color:#e3e7f1;text-align:center;border-top:4px double var(--gold)}
.ft__in{display:grid;justify-items:center;gap:.75rem;padding-block:2.5rem 1.5rem}
.ft .cross{width:.8rem;height:1.1rem;color:var(--gold)}
.ft__name{margin:0;font:600 1.8rem/1 var(--serif);font-variant-caps:small-caps;letter-spacing:.05em;color:#fff}
.ft address{font-style:normal}
.ft a{color:var(--gold-soft)}
.ft__links{display:flex;flex-wrap:wrap;justify-content:center;gap:.4rem 1.25rem;margin:0;padding:0;list-style:none}
.fb{display:inline-flex;align-items:center;gap:.5rem}
.fb svg{width:1.3rem;height:1.3rem}
.ft__legal{padding-block:1rem;border-top:1px solid rgb(255 255 255/.12);font-size:.85rem}
.ft__legal p{margin:0}

.art{max-width:44rem;margin:0 auto;padding-top:2.5rem;text-align:center}
.art h1{margin:0 0 .75rem;font-size:clamp(2.3rem,5vw,3.2rem)}
.art__meta{margin:0;color:var(--gold-text);font-size:.8rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.art__meta a{color:inherit}
.art__lead{margin:1.5rem 0;font:italic 400 1.45rem/1.45 var(--serif);color:var(--navy)}
.art__img{padding:6px;border:1px solid var(--gold);margin:0 0 2rem}
.art__img img{width:100%;aspect-ratio:16/10;object-fit:cover}
.prose{text-align:left;font:400 1.25rem/1.7 var(--serif)}
.prose p{margin:0 0 1.15rem}
.prose p:first-child::first-letter{float:left;margin:.08em .1em 0 0;font-size:3.4em;line-height:.8;color:var(--navy)}
.moreart{max-width:46rem;margin:0 auto;padding:0;list-style:none;columns:2 16rem;column-gap:2rem}
.moreart li{break-inside:avoid;padding:.5rem 0;border-bottom:1px solid var(--line);font-family:var(--serif);font-size:1.2rem}
.moreart a{text-decoration:none}
.moreart a:hover{text-decoration:underline}
`;

const header = (c, current) => `<header class="hd">
<div class="wrap hd__top"><a class="brand" href="index.html">${cross()}<span class="brand__name">${esc(c.title)}</span><span class="brand__tag">${esc(c.tagline)}</span></a></div>
<nav class="hd__nav" aria-label="Main"><ul class="wrap">${navItems(c, current)}</ul></nav>
<details class="wrap hd__menu"><summary>Menu</summary><ul>${navItems(c, current)}</ul></details>
</header>`;

const footer = (c) => `<footer class="ft"><div class="wrap ft__in">
${cross()}<p class="ft__name">${esc(c.title)}</p>
<address>${c.address.map(esc).join(', ')}</address>
<ul class="ft__links"><li><a href="#">Regular Church Services</a></li><li><a href="#">Church Calendar</a></li><li><a href="#">Contact Us</a></li><li><a href="#">Safeguarding</a></li><li><a href="#">Site Map</a></li></ul>
<a class="fb" href="#">${facebookIcon()}Find us on Facebook</a>
</div><div class="wrap ft__legal"><p>&copy; ${c.today.date.getUTCFullYear()} ${esc(c.title)} &middot; <a href="#">Privacy Policy</a> &middot; <a href="#">Cookie Policy</a></p></div></footer>`;

const card = (p) => `<article class="card">
<a class="card__img" href="${p.href}" tabindex="-1" aria-hidden="true">${p.image ? `<img src="../${p.image}" alt="">` : `<span class="card__noimg">${cross()}</span>`}</a>
<p class="card__meta">${esc(p.dateText)}</p><h3><a href="${p.href}">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p></article>`;

export default {
  slug: '03-traditional',
  name: 'Traditional',
  group: 'slight',
  summary: 'The same layout, dressed more like a church noticeboard: the name in a classic book typeface under a gold cross, and the welcome from the services page under the photo.',
  needs: 'Nothing new.',
  fonts: 'family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Mulish:wght@400;700',
  css,
  home: (c) => `${header(c, 'Home')}
<main>
<div class="photo"><img src="../img/wall.jpg" alt="St Paul's Church, Warton"></div>
<p class="wrap welcome">${esc(c.services.welcome)}</p>
<section class="wrap"><h2 class="orn"><a href="#">Church Notices</a></h2>
<ul class="notices">${c.notices.map((n) => `<li><h3><a href="#">${esc(n.title)}</a></h3><p>${esc(n.summary)}</p><a class="more" href="#">Read more</a></li>`).join('')}</ul></section>
<section class="wrap"><h2 class="orn"><a href="#">Latest from the Blog</a></h2>
<div class="cards">${c.posts.map(card).join('')}</div></section>
</main>
${footer(c)}`,
  article: (c) => {
    const a = c.article;
    return `${header(c, 'Blog')}
<main class="wrap">
<article class="art">
<p class="art__meta">${esc(a.dateText)} &middot; <a href="#">${esc(a.topic)}</a></p>
<h1>${esc(a.title)}</h1>
<p class="art__meta">By ${esc(a.author)}</p>
<p class="art__lead">${esc(a.lead)}</p>
<div class="art__img"><img src="../${a.image}" alt="${esc(a.imageAlt)}"></div>
<div class="prose">${a.body}</div>
</article>
<h2 class="orn">More from the Blog</h2>
<ul class="moreart">${c.latestTitles.filter((t) => t !== a.title).map((t) => `<li><a href="#">${esc(t)}</a></li>`).join('')}</ul>
</main>
${footer(c)}`;
  },
};
