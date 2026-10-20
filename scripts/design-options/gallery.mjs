// The page Paul opens: every design in its group, with a screenshot, a short note and links in.
import { esc } from './shared.mjs';

export const GROUPS = {
  base: { title: 'Where we are now', text: 'The new site as it stands today, built to match the old one.' },
  slight: { title: 'Small changes', text: 'Same blue and gold, same layout. Tidier and easier to read.' },
  layout: { title: 'Same colours, new layout', text: 'Blue and gold stay, but the home page is arranged differently.' },
  overhaul: { title: 'Something new', text: 'New colours and a new layout. The words and photos stay the same.' },
};

const css = `
:root{--bg:#f5f6f8;--surface:#ffffff;--ink:#1b2130;--muted:#566072;--line:#dde1e8;--accent:#002060;--accent-ink:#ffffff;--gold:#8a6f2c;--shadow:rgb(16 24 40/.08);
--font:'Mulish','Century Gothic',system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#11141b;--surface:#1a1e28;--ink:#e9ecf2;--muted:#a4adbc;--line:#2c3241;--accent:#d2b56a;--accent-ink:#11141b;--gold:#d2b56a;--shadow:rgb(0 0 0/.3);color-scheme:dark}}
:root[data-theme="dark"]{--bg:#11141b;--surface:#1a1e28;--ink:#e9ecf2;--muted:#a4adbc;--line:#2c3241;--accent:#d2b56a;--accent-ink:#11141b;--gold:#d2b56a;--shadow:rgb(0 0 0/.3);color-scheme:dark}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:400 1rem/1.6 var(--font)}
.page{max-width:76rem;margin:0 auto;padding-block:2.5rem 4rem;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.eyebrow{display:flex;align-items:center;gap:.5rem;margin:0 0 .5rem;color:var(--gold);font-weight:700;font-size:.85rem;letter-spacing:.08em;text-transform:uppercase}
.eyebrow svg{width:.6rem;height:.8rem}
h1{margin:0 0 1rem;font-size:clamp(2rem,5vw,2.75rem);font-weight:800;line-height:1.15;text-wrap:balance}
.intro{display:grid;gap:1.5rem;align-items:start;margin-bottom:1rem}
@media (min-width:860px){.intro{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)}}
.intro p{margin:0 0 .75rem;max-width:38rem;font-size:1.0625rem}
.ask{padding:1.25rem 1.5rem;border-radius:10px;background:var(--surface);border:1px solid var(--line)}
.ask h2{margin:0 0 .4rem;font-size:1.05rem}
.ask p{margin:0;font-size:1rem;color:var(--muted)}
.group{margin-top:3rem}
.group__head{display:flex;flex-wrap:wrap;align-items:baseline;gap:.25rem 1rem;padding-bottom:.75rem;margin-bottom:1.25rem;border-bottom:1px solid var(--line)}
.group__head h2{margin:0;font-size:1.4rem;font-weight:800}
.group__head p{margin:0;color:var(--muted)}
.grid{display:grid;gap:1.5rem;grid-template-columns:repeat(auto-fill,minmax(min(100%,21rem),1fr))}
.card{display:flex;flex-direction:column;min-width:0;border-radius:12px;background:var(--surface);border:1px solid var(--line);box-shadow:0 1px 3px var(--shadow);overflow:hidden}
.shot{position:relative;display:block;aspect-ratio:16/10;background:var(--line);border-bottom:1px solid var(--line)}
.shot__desk{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
.shot__phone{position:absolute;right:4%;bottom:-6%;width:21%;max-width:100%;aspect-ratio:390/780;object-fit:cover;object-position:top;border-radius:10px;border:3px solid #1b2130;box-shadow:0 6px 18px rgb(0 0 0/.3);background:#fff}
.shot:hover .shot__desk,.shot:focus-visible .shot__desk{opacity:.92}
.card__body{display:flex;flex-direction:column;gap:.5rem;flex:1;padding:1.5rem 1.25rem 1.25rem}
.card__title{display:flex;align-items:center;gap:.6rem;margin:0;font-size:1.2rem;font-weight:800}
.num{display:inline-grid;place-items:center;flex:none;width:1.9rem;height:1.9rem;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-size:.95rem;font-variant-numeric:tabular-nums}
.card__body p{margin:0}
.needs{color:var(--muted);font-size:.95rem}
.needs b{color:var(--ink)}
.links{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:auto;padding-top:.5rem}
.btn{display:inline-flex;align-items:center;min-height:2.6rem;padding:.4rem 1rem;border-radius:999px;border:2px solid var(--accent);color:var(--accent);font-weight:700;text-decoration:none}
.btn--fill{background:var(--accent);color:var(--accent-ink)}
.btn:hover{filter:brightness(1.1)}
:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.foot{margin-top:3rem;color:var(--muted);font-size:.9rem}
`;

const card = (d, i) => `<article class="card">
<a class="shot" href="${d.slug}/index.html" aria-label="Open design ${i + 1}, ${esc(d.name)}">
<img class="shot__desk" src="thumbs/${d.slug}-desktop.jpg" alt="">
<img class="shot__phone" src="thumbs/${d.slug}-phone.jpg" alt=""></a>
<div class="card__body">
<h3 class="card__title"><span class="num">${i + 1}</span>${esc(d.name)}</h3>
<p>${esc(d.summary)}</p>
<p class="needs"><b>Needs from you:</b> ${esc(d.needs)}</p>
<div class="links"><a class="btn btn--fill" href="${d.slug}/index.html">Home page</a><a class="btn" href="${d.slug}/article.html">Article</a></div>
</div></article>`;

export function gallery(designs, madeOn) {
  const groups = Object.entries(GROUPS).map(([key, g]) => {
    const items = designs.map((d, i) => [d, i]).filter(([d]) => d.group === key);
    return `<section class="group" aria-labelledby="g-${key}"><div class="group__head"><h2 id="g-${key}">${g.title}</h2><p>${g.text}</p></div>
<div class="grid">${items.map(([d, i]) => card(d, i)).join('\n')}</div></section>`;
  }).join('\n');
  return `<title>St Paul's Website Designs</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mulish:wght@400;700;800&display=swap">
<style>${css}</style>
<div class="page">
<p class="eyebrow"><svg viewBox="0 0 24 32" aria-hidden="true"><path fill="currentColor" d="M10 0h4v9h8v4h-8v19h-4V13H2V9h8z"/></svg>St Paul's Warton</p>
<h1>Ten looks for the church website</h1>
<div class="intro"><div>
<p>Here are ten ways the website could look. Number 1 is the site as it is now. The others go from small tidy-ups to something completely new.</p>
<p>Tap a picture to open that design. The grey bar at the top lets you switch between the home page and a blog article, or step on to the next design. The words and photos are the real ones from the site. Only the home page and one article are filled in, so other links won't go anywhere.</p>
<p>It's worth looking on your phone as well as a computer.</p>
</div>
<div class="ask"><h2>When you've had a look</h2><p>Let us know the two or three you like best, and anything you'd keep or avoid from any of them. Mixing bits from different designs is fine.</p></div>
</div>
${groups}
<p class="foot">Mockups made ${esc(madeOn)}. Nothing on the real website has changed.</p>
</div>`;
}

// The same page as a standalone document, for hosting the mockups anywhere.
export const galleryDocument = (designs, madeOn) => `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
</head>
<body>
${gallery(designs, madeOn)}
</body>
</html>
`;
