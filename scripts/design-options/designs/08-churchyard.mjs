import { esc, cross, facebookIcon, navItems } from '../shared.mjs';

const css = `
/* New colours taken from the churchyard photos: yew green, crocus purple, pale stone. A calmer, more spacious page. */
:root{--yew:#1d3a2a;--moss:#3c6446;--crocus:#62378f;--crocus-pale:#efe8f6;--stone:#eef0eb;--paper:#fbfcfa;--ink:#1b2620;--muted:#55615a;--line:#d3dad2;--snow:#ffffff;
--serif:'Alegreya',Georgia,serif;--sans:'Alegreya Sans','Trebuchet MS',sans-serif}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font:400 1.125rem/1.6 var(--sans);color:var(--ink);background:var(--paper)}
img{display:block;max-width:100%}
a{color:var(--crocus);text-underline-offset:.15em}
h1,h2,h3{font-family:var(--serif);font-weight:700;color:var(--yew);line-height:1.15;text-wrap:balance}
.wrap{max-width:74rem;margin:0 auto;padding-left:max(1.25rem,env(safe-area-inset-left,0px));padding-right:max(1.25rem,env(safe-area-inset-right,0px))}
:focus-visible{outline:3px solid var(--crocus);outline-offset:2px}

.hd{position:relative;background:var(--paper);border-bottom:1px solid var(--line)}
.hd__bar{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:4.75rem}
.brand{display:flex;align-items:center;gap:.6rem;color:var(--yew);text-decoration:none}
.brand .cross{width:.9rem;height:1.2rem;color:var(--crocus)}
.brand b{font:700 1.5rem/1 var(--serif)}
.hd__nav ul{display:flex;flex-wrap:wrap;margin:0;padding:0;list-style:none}
.hd__nav a{display:block;padding:.5rem .55rem;color:var(--yew);font-weight:500;text-decoration:none}
.hd__nav a:hover{color:var(--crocus)}
.hd__nav a[aria-current]{color:var(--crocus);text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.4em}
.hd__menu{display:none}
.hd__menu summary{list-style:none;cursor:pointer;padding:.45rem 1rem;border-radius:999px;background:var(--yew);color:var(--snow);font-weight:700}
.hd__menu summary::-webkit-details-marker{display:none}
.hd__menu ul{position:absolute;left:0;right:0;top:100%;z-index:20;margin:0;padding:.5rem max(1.25rem,env(safe-area-inset-left,0px)) 1rem;list-style:none;background:var(--paper);border-bottom:1px solid var(--line);box-shadow:0 12px 24px rgb(29 58 42/.12)}
.hd__menu a{display:block;padding:.65rem 0;border-bottom:1px solid var(--line);color:var(--yew);font:700 1.2rem var(--serif);text-decoration:none}
@media (max-width:1100px){.hd__nav{display:none}.hd__menu{display:block}}

.intro{display:grid;gap:2.5rem;align-items:center;padding-block:3rem}
@media (min-width:900px){.intro{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);padding-block:4rem}}
.intro h1{margin:0 0 1.25rem;font-size:clamp(2.6rem,6vw,4.4rem);font-weight:700;letter-spacing:-.01em}
.intro h1 span{display:block;color:var(--moss);font-style:italic;font-weight:500}
.welcome{margin:0 0 1.75rem;font:italic 400 1.3rem/1.45 var(--serif);color:var(--muted);max-width:30rem}
.times{display:grid;gap:.5rem;margin:0 0 1.75rem;padding:0;list-style:none;max-width:30rem}
.times li{display:flex;align-items:baseline;gap:1rem;padding:.6rem 0;border-bottom:1px solid var(--line)}
.times b{min-width:6.5rem;color:var(--crocus);font:700 1.35rem var(--serif);font-variant-numeric:lining-nums}
.times span{color:var(--muted)}
.times strong{color:var(--ink);font-weight:500}
.btn{display:inline-flex;align-items:center;min-height:3rem;padding:0 1.4rem;border-radius:999px;background:var(--yew);color:var(--snow);font-weight:700;text-decoration:none}
.btn:hover{background:var(--crocus)}
.collage{position:relative;padding:0 0 3rem 3rem}
.collage__big{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:4px}
.collage__small{position:absolute;left:0;bottom:0;width:38%;aspect-ratio:1;object-fit:cover;border:8px solid var(--paper);border-radius:4px}
@media (max-width:600px){.collage{padding:0 0 2rem 1.5rem}}

.band{background:var(--stone);padding-block:3.5rem}
.row{display:grid;gap:1.5rem 3rem}
@media (min-width:860px){.row{grid-template-columns:16rem minmax(0,1fr)}}
.row__head h2{margin:0 0 .5rem;font-size:2.1rem}
.row__head a{font-weight:700}
.notices{margin:0;padding:0;list-style:none;border-top:2px solid var(--yew)}
.notices li{display:grid;gap:.25rem 2rem;padding:1.1rem 0;border-bottom:1px solid var(--line)}
@media (min-width:700px){.notices li{grid-template-columns:15rem minmax(0,1fr)}}
.notices h3{margin:0;font-size:1.3rem}
.notices h3 a{color:var(--yew);text-decoration:none}
.notices h3 a:hover{color:var(--crocus);text-decoration:underline}
.notices p{margin:0;color:var(--muted);overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}

.photos{padding-block:3.5rem}
.photos__grid{display:grid;gap:.75rem;grid-template-columns:repeat(4,1fr)}
@media (max-width:700px){.photos__grid{grid-template-columns:1fr 1fr}}
.photos__grid img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:4px}
.photos__head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:.5rem 1rem;margin-bottom:1.25rem}
.photos__head h2{margin:0;font-size:2.1rem}
.photos__head a{font-weight:700}

.posts{display:grid;gap:2rem}
.post{display:grid;gap:1rem 1.75rem;align-items:center}
@media (min-width:700px){.post{grid-template-columns:minmax(0,1fr) minmax(0,1.4fr)}}
.post__img{aspect-ratio:3/2;border-radius:4px;overflow:hidden;background:var(--yew)}
.post__img img{width:100%;height:100%;object-fit:cover}
.post__noimg{display:grid;place-items:center;height:100%;color:var(--crocus-pale)}
.post__noimg .cross{width:2.25rem;height:3rem}
.post small{color:var(--moss);font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:.85rem}
.post h3{margin:.25rem 0 .5rem;font-size:1.65rem}
.post h3 a{color:var(--yew);text-decoration:none}
.post h3 a:hover{color:var(--crocus);text-decoration:underline}
.post p{margin:0;color:var(--muted)}

.ft{margin-top:4rem;background:var(--yew);color:#dfe8e1}
.ft a{color:#d9c6f0}
.ft__grid{display:grid;gap:2rem;padding-block:3rem 2rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))}
.ft__name{margin:0 0 .3rem;color:var(--snow);font:700 1.7rem/1.1 var(--serif)}
.ft h2{margin:0 0 .5rem;color:var(--snow);font:700 1.15rem var(--serif)}
.ft ul{margin:0;padding:0;list-style:none}
.ft address{font-style:normal}
.ft p{margin:0 0 .4rem}
.fb{display:inline-flex;align-items:center;gap:.5rem}
.fb svg{width:1.35rem;height:1.35rem}
.ft__legal{padding-block:1rem;border-top:1px solid rgb(255 255 255/.15);font-size:.95rem}
.ft__legal p{margin:0}

.art{max-width:44rem;margin:0 auto;padding-top:3rem}
.art__kicker{margin:0 0 .75rem;color:var(--moss);font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:.9rem}
.art__kicker a{color:inherit}
.art h1{margin:0 0 1rem;font-size:clamp(2.4rem,5.5vw,3.6rem)}
.art__lead{margin:0 0 1rem;font:italic 400 1.45rem/1.45 var(--serif);color:var(--muted)}
.art__meta{margin:0 0 2rem;color:var(--muted)}
.art__img{max-width:60rem;margin:0 auto 2.25rem}
.art__img img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:4px}
.prose{max-width:44rem;margin:0 auto}
.prose p{margin:0 0 1.2rem}
.more{max-width:44rem;margin:3rem auto 0;padding-top:1.5rem;border-top:2px solid var(--yew)}
.more h2{margin:0 0 1rem;font-size:1.6rem}
.more ul{margin:0;padding:0;list-style:none}
.more li{padding:.5rem 0;border-bottom:1px solid var(--line);font:500 1.2rem var(--serif)}
.more a{color:var(--yew);text-decoration:none}
.more a:hover{color:var(--crocus);text-decoration:underline}
`;

const header = (c, current) => `<header class="hd"><div class="wrap hd__bar">
<a class="brand" href="index.html">${cross()}<b>${esc(c.title)}</b></a>
<nav class="hd__nav" aria-label="Main"><ul>${navItems(c, current)}</ul></nav>
<details class="hd__menu"><summary>Menu</summary><ul>${navItems(c, current)}</ul></details>
</div></header>`;

const footer = (c) => `<footer class="ft"><div class="wrap ft__grid">
<div><p class="ft__name">${esc(c.title)}</p><p>${esc(c.tagline)}</p></div>
<div><h2>Find us</h2><address>${c.address.map(esc).join('<br>')}</address><p><a href="#">Get directions</a></p></div>
<div><h2>Visit</h2><ul><li><a href="#">Regular Church Services</a></li><li><a href="#">Church Calendar</a></li><li><a href="#">Contact Us</a></li><li><a href="#">Safeguarding</a></li></ul></div>
<div><h2>Follow us</h2><a class="fb" href="#">${facebookIcon()}Find us on Facebook</a></div>
</div><div class="wrap ft__legal"><p>&copy; ${c.today.date.getUTCFullYear()} ${esc(c.title)} &middot; <a href="#">Privacy Policy</a> &middot; <a href="#">Cookie Policy</a> &middot; <a href="#">Site Map</a></p></div></footer>`;

export default {
  slug: '08-churchyard',
  name: 'Churchyard',
  group: 'overhaul',
  summary: 'New colours from the churchyard photos: yew green, crocus purple and pale stone. A calmer page with more space, service times up front and a strip of church photos.',
  needs: 'Service times kept in Site settings. Uses photos already on the site.',
  fonts: 'family=Alegreya:ital,wght@0,500;0,700;1,400;1,500&family=Alegreya+Sans:wght@400;500;700',
  css,
  home: (c) => `${header(c, 'Home')}
<main>
<section class="wrap intro">
<div>
<h1>${esc(c.taglineParts[0])}<span>${esc(c.taglineParts[1])}</span></h1>
<p class="welcome">${esc(c.services.welcome)}.</p>
<ul class="times">${c.services.regular.map((s) => `<li><b>${esc(s.time)}</b><span><strong>${esc(s.day)}</strong>, ${esc(s.name)}</span></li>`).join('')}</ul>
<a class="btn" href="#">Find the church</a>
</div>
<div class="collage"><img class="collage__big" src="../img/exterior.jpg" alt="St Paul's Church, Warton, with crocuses in the churchyard"><img class="collage__small" src="../img/snowdrops.jpg" alt="Snowdrops in the churchyard"></div>
</section>
<section class="band"><div class="wrap row">
<div class="row__head"><h2>Notices</h2><a href="#">All notices</a></div>
<ul class="notices">${c.notices.map((n) => `<li><h3><a href="#">${esc(n.title)}</a></h3><p>${esc(n.summary)}</p></li>`).join('')}</ul>
</div></section>
<section class="wrap photos"><div class="photos__head"><h2>Around the church</h2><a href="#">Church Gallery</a></div>
<div class="photos__grid"><img src="../img/crocus.jpg" alt="Crocuses"><img src="../img/interior.jpg" alt="Inside St Paul's"><img src="../img/organ.jpg" alt="The organ"><img src="../img/needlework.jpg" alt="Mothers' Union needlework"></div></section>
<section class="wrap row">
<div class="row__head"><h2>From the blog</h2><a href="#">All articles</a></div>
<div class="posts">${c.posts.map((p) => `<article class="post"><div class="post__img">${p.image ? `<img src="../${p.image}" alt="">` : `<span class="post__noimg">${cross()}</span>`}</div>
<div><small>${esc(p.dateText)}</small><h3><a href="${p.href}">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p></div></article>`).join('')}</div>
</section>
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
<p class="art__meta">By ${esc(a.author)}, ${esc(a.dateText)}</p>
</div>
<div class="art__img"><img src="../${a.image}" alt="${esc(a.imageAlt)}"></div>
<div class="prose">${a.body}</div>
</article>
<section class="more"><h2>More from the blog</h2><ul>${c.latestTitles.filter((t) => t !== a.title).slice(0, 5).map((t) => `<li><a href="#">${esc(t)}</a></li>`).join('')}</ul></section>
</main>
${footer(c)}`;
  },
};
