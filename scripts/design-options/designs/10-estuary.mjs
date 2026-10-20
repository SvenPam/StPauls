import { esc, cross, facebookIcon, navItems } from '../shared.mjs';

const css = `
/* New, quiet colours from the Ribble estuary: slate blue water, pale sky, wet sand. Big light type and lots of space. */
:root{--tide:#f3f6f7;--white:#ffffff;--slate:#2d4a5c;--deep:#182a36;--sky:#b9cfdc;--sand:#dcc9a4;--sand-text:#7d6233;--muted:#56666f;--line:#d4dee3;
--font:'Hanken Grotesk','Helvetica Neue',Arial,sans-serif}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font:400 1.0625rem/1.65 var(--font);color:var(--deep);background:var(--tide)}
img{display:block;max-width:100%}
a{color:var(--slate);text-underline-offset:.2em}
h1,h2,h3{color:var(--deep);line-height:1.1;text-wrap:balance}
.wrap{max-width:76rem;margin:0 auto;padding-left:max(1.25rem,env(safe-area-inset-left,0px));padding-right:max(1.25rem,env(safe-area-inset-right,0px))}
:focus-visible{outline:2px solid var(--slate);outline-offset:3px}

.hd{position:relative}
.hd__bar{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:5rem}
.brand{display:flex;align-items:center;gap:.6rem;color:var(--deep);text-decoration:none;font-weight:700;font-size:.95rem;letter-spacing:.16em;text-transform:uppercase}
.brand .cross{width:.7rem;height:.95rem;color:var(--slate)}
.hd__right{display:flex;align-items:center;gap:1.25rem}
.quick{display:flex;gap:1.25rem;margin:0;padding:0;list-style:none}
.quick a{color:var(--deep);text-decoration:none;font-weight:600}
.quick a:hover{text-decoration:underline}
@media (max-width:760px){.quick{display:none}}
.menu summary{display:flex;align-items:center;gap:.6rem;list-style:none;cursor:pointer;min-height:2.75rem;padding:0 1.1rem;border:1px solid var(--deep);border-radius:999px;font-weight:600}
.menu summary::-webkit-details-marker{display:none}
.menu summary::before{content:"";width:1.1rem;height:7px;border-block:2px solid currentColor}
.menu[open] summary{background:var(--deep);color:var(--white)}
.menu ul{position:absolute;left:0;right:0;top:100%;z-index:20;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,14rem),1fr));gap:0 2rem;margin:0;padding:1.5rem max(1.25rem,env(safe-area-inset-left,0px)) 2rem;list-style:none;background:var(--deep)}
.menu a{display:block;padding:.6rem 0;border-bottom:1px solid rgb(255 255 255/.15);color:var(--white);font-size:1.5rem;font-weight:300;text-decoration:none}
.menu a:hover{color:var(--sand)}

.hero{padding-block:2.5rem 2.5rem}
.hero h1{margin:0;font-size:clamp(2.8rem,8.5vw,6.6rem);font-weight:300;letter-spacing:-.03em;line-height:1}
.hero h1 span{display:block;color:var(--slate)}
.hero h1 span + span{color:var(--sand-text)}
.pano{width:100%;aspect-ratio:3/1;object-fit:cover;object-position:50% 40%}
@media (max-width:700px){.pano{aspect-ratio:4/3}}

.board{display:grid;background:var(--white);border-bottom:1px solid var(--line)}
@media (min-width:800px){.board{grid-template-columns:repeat(3,1fr)}}
.board > div{padding:1.75rem 1.5rem;border-top:1px solid var(--line)}
@media (min-width:800px){.board > div + div{border-left:1px solid var(--line)}.board > div{border-top:0}}
.board small{display:block;color:var(--sand-text);font-size:.8rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.board b{display:block;margin:.2rem 0;font-size:2.4rem;font-weight:300;line-height:1.1;font-variant-numeric:tabular-nums}
.board span{color:var(--muted)}

.sec{padding-top:4rem}
.sec__head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:.5rem 1rem;margin-bottom:1.5rem}
.sec__head h2{margin:0;font-size:clamp(2rem,4vw,2.8rem);font-weight:300;letter-spacing:-.02em}
.sec__head a{font-weight:600}
.notices{margin:0;padding:0;list-style:none;border-top:1px solid var(--deep)}
.notices a{display:grid;gap:.3rem 2.5rem;padding:1.25rem 0;border-bottom:1px solid var(--line);color:var(--deep);text-decoration:none}
@media (min-width:800px){.notices a{grid-template-columns:minmax(0,1fr) minmax(0,2fr)}}
.notices a:hover h3{text-decoration:underline}
.notices h3{margin:0;font-size:1.3rem;font-weight:600}
.notices p{margin:0;color:var(--muted);overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}

.posts{display:grid;gap:2rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))}
.post{min-width:0}
.post__img{aspect-ratio:4/3;overflow:hidden;background:var(--sky)}
.post__img img{width:100%;height:100%;object-fit:cover}
.post__noimg{display:grid;place-items:center;height:100%;color:var(--slate)}
.post__noimg .cross{width:1.6rem;height:2.1rem}
.post small{display:block;margin-top:1rem;color:var(--sand-text);font-size:.8rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.post h3{margin:.35rem 0 .4rem;font-size:1.45rem;font-weight:600;line-height:1.2}
.post h3 a{color:var(--deep);text-decoration:none}
.post h3 a:hover{text-decoration:underline}
.post p{margin:0;color:var(--muted)}

.ft{margin-top:5rem;background:var(--slate);color:#dbe6ec}
.ft a{color:var(--white)}
.ft__top{display:grid;gap:2rem;padding-block:3rem 2.5rem}
@media (min-width:860px){.ft__top{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr)}}
.ft__addr{margin:0;color:var(--white);font-size:clamp(1.6rem,3.5vw,2.3rem);font-weight:300;line-height:1.2;font-style:normal}
.ft h2{margin:0 0 .5rem;color:var(--sand);font-size:.8rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.ft ul{margin:0;padding:0;list-style:none}
.ft li{padding:.15rem 0}
.fb{display:inline-flex;align-items:center;gap:.5rem}
.fb svg{width:1.3rem;height:1.3rem}
.ft__legal{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.5rem 1.5rem;padding-block:1.1rem;border-top:1px solid rgb(255 255 255/.18);font-size:.875rem}
.ft__legal p{margin:0}

.art{max-width:42rem;margin:0 auto;padding-top:2.5rem}
.art__kicker{margin:0 0 1rem;color:var(--sand-text);font-size:.8rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.art__kicker a{color:inherit;text-decoration:none}
.art h1{margin:0 0 1.25rem;font-size:clamp(2.4rem,6vw,4rem);font-weight:300;letter-spacing:-.025em}
.art__lead{margin:0 0 1.5rem;font-size:1.35rem;line-height:1.5;color:var(--slate)}
.art__meta{margin:0 0 2.5rem;padding-top:1rem;border-top:1px solid var(--line);color:var(--muted);font-size:.95rem}
.art__img{max-width:64rem;margin:0 auto 2.5rem}
.art__img img{width:100%;aspect-ratio:3/2;object-fit:cover}
.prose{max-width:42rem;margin:0 auto;font-size:1.15rem;line-height:1.8}
.prose p{margin:0 0 1.3rem}
.morelist{max-width:42rem;margin:0 auto;padding:0;list-style:none;border-top:1px solid var(--deep)}
.morelist a{display:block;padding:.9rem 0;border-bottom:1px solid var(--line);color:var(--deep);font-size:1.25rem;font-weight:300;text-decoration:none}
.morelist a:hover{text-decoration:underline}
.art--more{padding-top:4rem}
.art--more h2{margin:0 0 1rem;font-size:1.8rem;font-weight:300}
`;

const header = (c, current) => `<header class="wrap hd"><div class="hd__bar">
<a class="brand" href="index.html">${cross()}<span>${esc(c.title)}</span></a>
<div class="hd__right"><ul class="quick"><li><a href="#">Services</a></li><li><a href="#">Calendar</a></li><li><a href="#">Contact</a></li></ul>
<details class="menu"><summary>Menu</summary><ul>${navItems(c, current)}</ul></details></div>
</div></header>`;

const footer = (c) => `<footer class="ft"><div class="wrap ft__top">
<address class="ft__addr">${c.address.map(esc).join(',<br>')}</address>
<div><h2>Visit</h2><ul><li><a href="#">Get directions</a></li><li><a href="#">Regular Church Services</a></li><li><a href="#">Church Calendar</a></li><li><a href="#">Contact Us</a></li></ul></div>
<div><h2>Also</h2><ul><li><a href="#">Safeguarding</a></li><li><a href="#">Site Map</a></li><li><a class="fb" href="#">${facebookIcon()}Facebook</a></li></ul></div>
</div><div class="wrap ft__legal"><p>&copy; ${c.today.date.getUTCFullYear()} ${esc(c.title)}</p><p><a href="#">Privacy Policy</a> &middot; <a href="#">Cookie Policy</a></p></div></footer>`;

export default {
  slug: '10-estuary',
  name: 'Estuary',
  group: 'overhaul',
  summary: 'Quiet and modern, in colours from the Ribble estuary: slate blue, pale sky and sand. Big, light lettering, a wide photo and the key facts on one line like a sign board.',
  needs: 'Service times kept in Site settings.',
  fonts: 'family=Hanken+Grotesk:wght@300;400;600;700',
  css,
  home: (c) => `${header(c, 'Home')}
<main>
<section class="wrap hero"><h1><span>${esc(c.taglineParts[0])}</span><span>${esc(c.taglineParts[1])}</span></h1></section>
<img class="pano" src="../img/exterior.jpg" alt="St Paul's Church, Warton, in spring">
<section class="board">
<div><small>Sundays</small><b>9:30am</b><span>Family Sung Eucharist</span></div>
<div><small>Wednesdays</small><b>9:30am</b><span>Said Communion, then coffee</span></div>
<div><small>Find us</small><b>${esc(c.address[0])}</b><span>${esc(c.address[1])}, ${esc(c.address[3])} &middot; <a href="#">Directions</a></span></div>
</section>
<section class="wrap sec"><div class="sec__head"><h2>Notices</h2><a href="#">All notices</a></div>
<ul class="notices">${c.notices.map((n) => `<li><a href="#"><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p></a></li>`).join('')}</ul></section>
<section class="wrap sec"><div class="sec__head"><h2>From the blog</h2><a href="#">All articles</a></div>
<div class="posts">${c.posts.map((p) => `<article class="post"><div class="post__img">${p.image ? `<img src="../${p.image}" alt="">` : `<span class="post__noimg">${cross()}</span>`}</div>
<small>${esc(p.dateText)}</small><h3><a href="${p.href}">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p></article>`).join('')}</div></section>
</main>
${footer(c)}`,
  article: (c) => {
    const a = c.article;
    return `${header(c, 'Blog')}
<main class="wrap">
<article>
<div class="art">
<p class="art__kicker"><a href="#">Blog</a> &middot; <a href="#">${esc(a.topic)}</a></p>
<h1>${esc(a.title)}</h1>
<p class="art__lead">${esc(a.lead)}</p>
<p class="art__meta">By ${esc(a.author)} &middot; ${esc(a.dateText)}</p>
</div>
<div class="art__img"><img src="../${a.image}" alt="${esc(a.imageAlt)}"></div>
<div class="prose">${a.body}</div>
</article>
<section class="art art--more"><h2>More from the blog</h2><ul class="morelist">${c.latestTitles.filter((t) => t !== a.title).slice(0, 5).map((t) => `<li><a href="#">${esc(t)}</a></li>`).join('')}</ul></section>
</main>
${footer(c)}`;
  },
};
