import { esc, cross, facebookIcon, navItems } from '../shared.mjs';

const css = `
/* Same order of things, built for reading: bigger type in a face made for low vision, a white header, big tap targets. */
:root{--navy:#002060;--navy-tint:#e9eef8;--gold:#c8a85a;--gold-dark:#8a6d22;--ink:#14181f;--muted:#4a5160;--page:#ffffff;--line:#c9d2e3;
--font:'Atkinson Hyperlegible',Verdana,sans-serif}
*,*::before,*::after{box-sizing:border-box}
html{font-size:100%}
body{margin:0;font:400 1.1875rem/1.7 var(--font);color:var(--ink);background:var(--page)}
img{display:block;max-width:100%}
a{color:var(--navy);text-decoration-thickness:2px;text-underline-offset:.18em}
a:hover{text-decoration-thickness:3px}
h1,h2,h3{color:var(--navy);line-height:1.2;text-wrap:balance}
.wrap{max-width:70rem;margin:0 auto;padding-left:max(1rem,env(safe-area-inset-left,0px));padding-right:max(1rem,env(safe-area-inset-right,0px))}
:focus-visible{outline:4px solid var(--gold-dark);outline-offset:3px}

.hd{position:relative;border-top:8px solid var(--navy);box-shadow:inset 0 3px 0 var(--gold)}
.hd__bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;padding-block:1.1rem}
.brand{display:flex;align-items:center;gap:.8rem;color:var(--navy);text-decoration:none}
.brand .cross{width:1.3rem;height:1.75rem;color:var(--gold-dark);flex:none}
.brand b{display:block;font-size:1.65rem;line-height:1.1}
.brand span span{display:block;color:var(--muted);font-size:1rem}
.tools{display:flex;align-items:center;gap:.5rem;font-size:1rem;color:var(--muted)}
.tools button{min-width:3rem;min-height:3rem;padding:0 .8rem;border:2px solid var(--navy);border-radius:8px;background:var(--page);color:var(--navy);font:700 1rem var(--font);cursor:pointer}
.tools button[aria-pressed="true"]{background:var(--navy);color:#fff}
.tools button:nth-of-type(2){font-size:1.25rem}
.nav{background:var(--navy-tint);border-block:1px solid var(--line)}
.nav ul{display:flex;flex-wrap:wrap;gap:.1rem;margin:0 auto;padding-block:.6rem;list-style:none}
.nav a{display:block;padding:.45rem .75rem;border-radius:8px;color:var(--navy);font-weight:700;text-decoration:none}
.nav a:hover{background:#fff;text-decoration:underline}
.nav a[aria-current]{background:var(--navy);color:#fff}
.menu{display:none}
.menu summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;min-height:3rem;padding:0 1.2rem;border-radius:8px;background:var(--navy);color:#fff;font-weight:700}
.menu summary::-webkit-details-marker{display:none}
.menu ul{position:absolute;left:0;right:0;top:100%;z-index:20;margin:0;padding:0 max(1rem,env(safe-area-inset-left,0px)) 1rem;list-style:none;background:var(--page);border-bottom:6px solid var(--navy);box-shadow:0 12px 24px rgb(0 32 96/.15)}
.menu a{display:block;padding:.8rem .25rem;border-bottom:2px solid var(--line);font-weight:700;text-decoration:none;font-size:1.25rem}
@media (max-width:760px){.nav{display:none}.menu{display:block}.tools{margin-left:auto}.tools span{display:none}}

.hero{padding-top:1.5rem}
.hero img{width:100%;aspect-ratio:21/8;object-fit:cover;object-position:50% 45%;border-radius:14px}
.hero__card{position:relative;max-width:36rem;margin:-4.5rem 0 0 1.5rem;padding:1.4rem 1.75rem;border-radius:14px;background:var(--page);box-shadow:0 6px 24px rgb(0 32 96/.16);border-left:8px solid var(--gold)}
.hero h1{margin:0;font-size:clamp(2.1rem,5vw,2.9rem)}
.hero p{margin:.3rem 0 0;font-size:1.3rem;color:var(--muted)}
@media (max-width:640px){.hero img{aspect-ratio:4/3}.hero__card{margin:-2.5rem .5rem 0}}

.sec{padding-top:2.75rem}
.sec h2{margin:0 0 1.25rem;font-size:2rem}
.notices{display:grid;gap:1rem;margin:0;padding:0;list-style:none}
.notice{padding:1.25rem 1.5rem;border:2px solid var(--line);border-radius:12px}
.notice h3{margin:0 0 .4rem;font-size:1.4rem}
.notice p{margin:0 0 .6rem;overflow-wrap:anywhere}
.notice a{font-weight:700}
.all{display:inline-flex;align-items:center;min-height:3rem;margin-top:1.25rem;padding:0 1.4rem;border-radius:8px;background:var(--navy);color:#fff;font-weight:700;text-decoration:none}
.all:hover{background:var(--gold);color:var(--ink)}

.cards{display:grid;gap:1.5rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))}
.card{min-width:0;border:2px solid var(--line);border-radius:12px;overflow:hidden}
.card__img{aspect-ratio:3/2;background:var(--navy)}
.card__img img{width:100%;height:100%;object-fit:cover}
.card__noimg{display:grid;place-items:center;height:100%;color:var(--gold)}
.card__noimg .cross{width:2.5rem;height:3.3rem}
.card__body{padding:1.1rem 1.4rem 1.4rem}
.card__date{margin:0 0 .3rem;font-weight:700;color:var(--muted);font-size:1rem}
.card h3{margin:0 0 .5rem;font-size:1.35rem}
.card p{margin:0}

.ft{margin-top:4rem;background:var(--navy-tint);border-top:6px solid var(--navy)}
.ft__grid{display:grid;gap:2rem;padding-block:2.5rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))}
.ft h2{margin:0 0 .6rem;font-size:1.3rem}
.ft ul{margin:0;padding:0;list-style:none}
.ft li{padding:.2rem 0}
.ft address{font-style:normal}
.fb{display:inline-flex;align-items:center;gap:.6rem;font-weight:700}
.fb svg{width:1.6rem;height:1.6rem}
.ft__legal{background:var(--navy);color:#fff;font-size:1rem}
.ft__legal p{margin:0;padding-block:1rem}
.ft__legal a{color:#fff}

.back{display:inline-flex;align-items:center;gap:.4rem;min-height:3rem;margin-top:1.5rem;padding:0 1.1rem;border:2px solid var(--navy);border-radius:8px;font-weight:700;text-decoration:none}
.art{max-width:44rem}
.art h1{margin:1.25rem 0 .75rem;font-size:clamp(2.2rem,5vw,3rem)}
.art__meta{display:flex;flex-wrap:wrap;gap:.25rem 1.25rem;margin:0 0 1.25rem;color:var(--muted);font-size:1.05rem}
.art__meta b{color:var(--ink)}
.art__lead{margin:0 0 1.5rem;font-size:1.45rem;line-height:1.5}
.art__img{width:100%;border-radius:14px;margin-bottom:2rem;aspect-ratio:4/3;object-fit:cover}
.prose{font-size:1.25rem;line-height:1.8}
.prose p{margin:0 0 1.3rem}
.morelist{margin:0;padding:0;list-style:none;border-top:2px solid var(--line)}
.morelist a{display:block;padding:.85rem .25rem;border-bottom:2px solid var(--line);font-weight:700;text-decoration:none}
.morelist a:hover{background:var(--navy-tint)}
`;

// Working text-size buttons. The choice is not remembered between pages in the mockup.
const sizeScript = `<script>
document.querySelectorAll('[data-size]').forEach(function (b) {
  b.addEventListener('click', function () {
    document.documentElement.style.fontSize = b.dataset.size;
    document.querySelectorAll('[data-size]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
  });
});
</script>`;

const header = (c, current) => `<header class="hd">
<div class="wrap hd__bar"><a class="brand" href="index.html">${cross()}<span><b>${esc(c.title)}</b><span>${esc(c.tagline)}</span></span></a>
<div class="tools"><span>Text size</span><button type="button" data-size="100%" aria-pressed="true" aria-label="Normal text">A</button><button type="button" data-size="118%" aria-pressed="false" aria-label="Larger text">A+</button></div>
<details class="menu"><summary>Menu</summary><ul>${navItems(c, current)}</ul></details></div>
<nav class="nav" aria-label="Main"><ul class="wrap">${navItems(c, current)}</ul></nav>
</header>`;

const footer = (c) => `<footer class="ft"><div class="wrap ft__grid">
<div><h2>Find us</h2><address>${c.address.map(esc).join('<br>')}</address><p><a href="#">Get directions</a></p></div>
<div><h2>Useful pages</h2><ul><li><a href="#">Regular Church Services</a></li><li><a href="#">Church Calendar</a></li><li><a href="#">Contact Us</a></li><li><a href="#">Safeguarding</a></li></ul></div>
<div><h2>Follow us</h2><a class="fb" href="#">${facebookIcon()}Find us on Facebook</a></div>
</div><div class="ft__legal"><p class="wrap">&copy; ${c.today.date.getUTCFullYear()} ${esc(c.title)} &middot; <a href="#">Privacy Policy</a> &middot; <a href="#">Cookie Policy</a> &middot; <a href="#">Site Map</a></p></div></footer>`;

const card = (p) => `<article class="card"><div class="card__img">${p.image ? `<img src="../${p.image}" alt="">` : `<span class="card__noimg">${cross()}</span>`}</div>
<div class="card__body"><p class="card__date">${esc(p.dateText)}</p><h3><a href="${p.href}">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p></div></article>`;

export default {
  slug: '04-easy-reading',
  name: 'Easy reading',
  group: 'slight',
  summary: 'The same order of things, made for reading: larger text in a typeface designed for people with poor eyesight, a white header, big buttons and a text size switch.',
  needs: 'Nothing new.',
  fonts: 'family=Atkinson+Hyperlegible:wght@400;700',
  css,
  home: (c) => `${header(c, 'Home')}
<main class="wrap">
<section class="hero"><img src="../img/exterior.jpg" alt="St Paul's Church, Warton, in spring">
<div class="hero__card"><h1>${esc(c.title)}</h1><p>${esc(c.tagline)}</p></div></section>
<section class="sec"><h2>Church Notices</h2>
<ul class="notices">${c.notices.map((n) => `<li class="notice"><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p><a href="#">Read the full notice</a></li>`).join('')}</ul>
<a class="all" href="#">See all notices</a></section>
<section class="sec"><h2>Latest Blog Articles</h2><div class="cards">${c.posts.map(card).join('')}</div>
<a class="all" href="#">See all blog articles</a></section>
</main>
${footer(c)}
${sizeScript}`,
  article: (c) => {
    const a = c.article;
    return `${header(c, 'Blog')}
<main class="wrap">
<a class="back" href="#"><span aria-hidden="true">&larr;</span> Back to the blog</a>
<article class="art">
<h1>${esc(a.title)}</h1>
<p class="art__meta"><span>By <b>${esc(a.author)}</b></span><span>${esc(a.dateText)}</span><span>Topic: <a href="#">${esc(a.topic)}</a></span></p>
<p class="art__lead">${esc(a.lead)}</p>
<img class="art__img" src="../${a.image}" alt="${esc(a.imageAlt)}">
<div class="prose">${a.body}</div>
<section class="sec"><h2>More blog articles</h2><ul class="morelist">${c.latestTitles.filter((t) => t !== a.title).slice(0, 4).map((t) => `<li><a href="#">${esc(t)}</a></li>`).join('')}</ul></section>
</article>
</main>
${footer(c)}
${sizeScript}`;
  },
};
