import { esc, cross, facebookIcon, navItems } from '../shared.mjs';

const css = `
/* Blue and gold laid out like the front of the parish magazine: masthead, a lead story, notices down the side. */
:root{--navy:#002060;--navy-deep:#00174a;--gold:#c8a85a;--gold-text:#7a6326;--ink:#1c1f27;--muted:#565c68;--page:#ffffff;--wash:#f4f5f8;--line:#d9dde5;
--serif:'Libre Caslon Text',Georgia,serif;--sans:'Mulish','Century Gothic',sans-serif}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font:400 1.0625rem/1.6 var(--sans);color:var(--ink);background:var(--page)}
img{display:block;max-width:100%}
a{color:var(--navy);text-underline-offset:.15em}
h1,h2,h3{font-family:var(--serif);font-weight:700;color:var(--navy);line-height:1.2;text-wrap:balance}
.wrap{max-width:74rem;margin:0 auto;padding-left:max(1rem,env(safe-area-inset-left,0px));padding-right:max(1rem,env(safe-area-inset-right,0px))}
:focus-visible{outline:3px solid var(--gold);outline-offset:2px}

.dateline{background:var(--navy);color:#dfe5f2;font-size:.85rem}
.dateline .wrap{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.25rem 1rem;padding-block:.45rem}
.mast{padding-block:1.75rem 1.25rem;text-align:center}
.mast .cross{width:.9rem;height:1.2rem;margin:0 auto .5rem;color:var(--gold)}
.mast a{text-decoration:none}
.mast__name{display:block;font:700 clamp(2.4rem,7.5vw,4.6rem)/1 var(--serif);color:var(--navy);letter-spacing:-.01em}
.mast__tag{display:block;margin-top:.5rem;font:italic 400 clamp(1rem,2.4vw,1.25rem)/1.3 var(--serif);color:var(--gold-text)}
.nav{position:relative;border-top:1px solid var(--navy);border-bottom:3px solid var(--navy);box-shadow:0 3px 0 var(--page),0 5px 0 var(--gold)}
.nav ul{display:flex;flex-wrap:wrap;justify-content:center;margin:0 auto;padding:0;list-style:none}
.nav a{display:block;padding:.6rem .7rem;color:var(--navy);text-decoration:none;font-size:.8rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.nav a:hover{text-decoration:underline}
.nav a[aria-current]{color:var(--gold-text)}
.menu{display:none;text-align:center}
.menu summary{display:inline-block;list-style:none;cursor:pointer;padding:.6rem 1rem;font-size:.85rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--navy)}
.menu summary::-webkit-details-marker{display:none}
.menu ul{display:block;padding-bottom:.75rem}
.menu a{font-size:1rem;border-top:1px solid var(--line)}
@media (max-width:900px){.nav > ul{display:none}.menu{display:block}}

.front{display:grid;gap:2.5rem;padding-top:2.25rem}
@media (min-width:920px){.front{grid-template-columns:minmax(0,2fr) minmax(0,1fr)}.front > aside{border-left:1px solid var(--line);padding-left:2rem}}
.kicker{margin:0 0 .4rem;color:var(--gold-text);font-size:.78rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.lead__img{display:block;aspect-ratio:3/2;overflow:hidden;margin-bottom:1rem;background:var(--navy)}
.lead__img img{width:100%;height:100%;object-fit:cover}
.lead h2{margin:0 0 .5rem;font-size:clamp(1.9rem,4vw,2.7rem)}
.lead h2 a,.story h3 a{text-decoration:none}
.lead h2 a:hover,.story h3 a:hover{text-decoration:underline}
.standfirst{margin:0 0 .5rem;font:italic 400 1.25rem/1.45 var(--serif);color:var(--ink)}
.byline{margin:0;color:var(--muted);font-size:.9rem}
.stories{display:grid;gap:1.75rem;margin-top:2rem;padding-top:1.75rem;border-top:3px double var(--navy)}
@media (min-width:640px){.stories{grid-template-columns:1fr 1fr}.stories .story + .story{border-left:1px solid var(--line);padding-left:1.75rem}}
.story{min-width:0}
.story__img{aspect-ratio:16/9;overflow:hidden;margin-bottom:.75rem}
.story__img img{width:100%;height:100%;object-fit:cover}
.story h3{margin:0 0 .4rem;font-size:1.4rem}
.story p{margin:0 0 .4rem}

.panel h2{margin:0 0 .75rem;padding:.5rem .8rem;background:var(--navy);color:#fff;font-family:var(--sans);font-size:.85rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.panel + .panel{margin-top:2rem}
.notices{margin:0;padding:0;list-style:none}
.notices li{padding:.75rem 0;border-bottom:1px solid var(--line)}
.notices li:first-child{padding-top:.25rem}
.notices h3{margin:0 0 .2rem;font-size:1.1rem}
.notices h3 a{text-decoration:none}
.notices h3 a:hover{text-decoration:underline}
.notices p{margin:0;font-size:.93rem;color:var(--muted);overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}
.svc{display:grid;grid-template-columns:auto 1fr;gap:.2rem 1rem;margin:0}
.svc dt{font:700 1.6rem/1.1 var(--serif);color:var(--navy);font-variant-numeric:lining-nums tabular-nums}
.svc dd{margin:0 0 .6rem;font-size:.95rem}
.svc dd b{display:block}
.svc__next{margin:.5rem 0 0;padding:.75rem .9rem;background:var(--wash);border-left:3px solid var(--gold);font-size:.95rem}

.ft{margin-top:3.5rem;background:var(--navy);color:#dfe5f2}
.ft a{color:#f0d993}
.ft__grid{display:grid;gap:2rem;padding-block:2.25rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))}
.ft__name{margin:0 0 .25rem;font:700 1.6rem/1.1 var(--serif);color:#fff}
.ft h2{margin:0 0 .5rem;color:#fff;font-family:var(--sans);font-size:.8rem;letter-spacing:.12em;text-transform:uppercase}
.ft ul{margin:0;padding:0;list-style:none}
.ft address{font-style:normal}
.ft p{margin:0 0 .4rem}
.fb{display:inline-flex;align-items:center;gap:.5rem}
.fb svg{width:1.3rem;height:1.3rem}
.ft__legal{padding-block:1rem;border-top:1px solid rgb(255 255 255/.15);font-size:.85rem}
.ft__legal p{margin:0}

.art{max-width:46rem;margin:0 auto;padding-top:2.5rem}
.art__head{text-align:center}
.art--body{padding-top:0}
.art h1{margin:0 0 .75rem;font-size:clamp(2.2rem,5.5vw,3.4rem)}
.art .standfirst{font-size:1.4rem}
.art__by{display:flex;flex-wrap:wrap;justify-content:center;gap:.25rem 1.25rem;margin:1.25rem 0 1.75rem;padding-block:.6rem;border-block:1px solid var(--line);color:var(--muted);font-size:.9rem}
.art__by b{color:var(--ink)}
.art__img{max-width:60rem;margin:0 auto 2rem}
.art__img img{width:100%;aspect-ratio:16/9;object-fit:cover}
.prose{font:400 1.15rem/1.75 var(--serif)}
.prose p{margin:0 0 1.15rem}
.prose p:first-child::first-letter{float:left;margin:.06em .12em 0 0;font-size:3.6em;line-height:.8;font-weight:700;color:var(--gold-text)}
.alsoin{max-width:46rem;margin:2.5rem auto 0;padding-top:1rem;border-top:3px double var(--navy)}
.alsoin h2{margin:0 0 .75rem;font-size:1.3rem}
.alsoin ul{margin:0;padding:0;list-style:none;columns:2 16rem;column-gap:2rem}
.alsoin li{break-inside:avoid;padding:.45rem 0;border-bottom:1px solid var(--line);font-family:var(--serif)}
.alsoin a{text-decoration:none}
.alsoin a:hover{text-decoration:underline}
`;

const header = (c, current) => `<div class="dateline"><div class="wrap"><span>${esc(c.today.weekday)} ${c.today.day} ${esc(c.today.month)} ${c.today.date.getUTCFullYear()}</span><span>${c.address.map(esc).join(', ')}</span></div></div>
<header class="wrap mast"><a href="index.html">${cross()}<span class="mast__name">${esc(c.title)}</span><span class="mast__tag">${esc(c.tagline)}</span></a></header>
<nav class="nav" aria-label="Main"><ul class="wrap">${navItems(c, current)}</ul>
<details class="menu"><summary>Sections</summary><ul>${navItems(c, current)}</ul></details></nav>`;

const footer = (c) => `<footer class="ft"><div class="wrap ft__grid">
<div><p class="ft__name">${esc(c.title)}</p><p>${esc(c.tagline)}</p></div>
<div><h2>Find us</h2><address>${c.address.map(esc).join('<br>')}</address></div>
<div><h2>Also on the site</h2><ul><li><a href="#">Latest Parish Magazine</a></li><li><a href="#">Church Calendar</a></li><li><a href="#">Contact Us</a></li><li><a href="#">Safeguarding</a></li></ul></div>
<div><h2>Follow us</h2><a class="fb" href="#">${facebookIcon()}Find us on Facebook</a></div>
</div><div class="wrap ft__legal"><p>&copy; ${c.today.date.getUTCFullYear()} ${esc(c.title)} &middot; <a href="#">Privacy Policy</a> &middot; <a href="#">Cookie Policy</a> &middot; <a href="#">Site Map</a></p></div></footer>`;

const services = (c) => {
  const next = c.services.sundays[0];
  return `<section class="panel"><h2>Services</h2><dl class="svc">${c.services.regular.map((s) => `<dt>${esc(s.time)}</dt><dd><b>${esc(s.day)}</b>${esc(s.name)}</dd>`).join('')}</dl>
<p class="svc__next">This Sunday, ${next.day} ${esc(next.month)}: ${esc(next.name)} at ${esc(next.time)}.</p></section>`;
};

export default {
  slug: '06-parish-magazine',
  name: 'Parish magazine',
  group: 'layout',
  summary: 'Laid out like the front page of the parish magazine: a masthead, the newest blog story large, other stories below and notices and service times down the side.',
  needs: 'Works best when blog articles have a picture. Service times kept in Site settings.',
  fonts: 'family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Mulish:wght@400;700;800',
  css,
  home: (c) => {
    const [lead, ...rest] = c.posts;
    return `${header(c, 'Home')}
<main class="wrap front">
<div>
<article class="lead">
${lead.image ? `<a class="lead__img" href="${lead.href}" tabindex="-1" aria-hidden="true"><img src="../${lead.image}" alt=""></a>` : ''}
<p class="kicker">${esc(lead.topic)}</p>
<h2><a href="${lead.href}">${esc(lead.title)}</a></h2>
<p class="standfirst">${esc(lead.summary)}</p>
<p class="byline">By ${esc(lead.author)} &middot; ${esc(lead.dateText)}</p>
</article>
<div class="stories">${rest.map((p) => `<article class="story">
${p.image ? `<div class="story__img"><img src="../${p.image}" alt=""></div>` : ''}
<p class="kicker">${esc(p.topic)}</p><h3><a href="${p.href}">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p><p class="byline">${esc(p.dateText)}</p></article>`).join('')}</div>
</div>
<aside>
<section class="panel"><h2>Church Notices</h2><ul class="notices">${c.notices.map((n) => `<li><h3><a href="#">${esc(n.title)}</a></h3><p>${esc(n.summary)}</p></li>`).join('')}</ul></section>
${services(c)}
</aside>
</main>
${footer(c)}`;
  },
  article: (c) => {
    const a = c.article;
    return `${header(c, 'Blog')}
<main class="wrap">
<article>
<div class="art"><div class="art__head">
<p class="kicker">${esc(a.topic)}</p>
<h1>${esc(a.title)}</h1>
<p class="standfirst">${esc(a.lead)}</p>
</div>
<p class="art__by"><span>By <b>${esc(a.author)}</b></span><span>${esc(a.dateText)}</span></p></div>
<div class="art__img"><img src="../${a.image}" alt="${esc(a.imageAlt)}"></div>
<div class="art art--body prose">${a.body}</div>
</article>
<section class="alsoin"><h2>Also in the blog</h2><ul>${c.latestTitles.filter((t) => t !== a.title).map((t) => `<li><a href="#">${esc(t)}</a></li>`).join('')}</ul></section>
</main>
${footer(c)}`;
  },
};
