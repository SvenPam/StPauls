// Page shell and small helpers shared by every mockup.

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A plain Latin cross, drawn in currentColor.
export const cross = (cls = 'cross') =>
  `<svg class="${cls}" viewBox="0 0 24 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M10 0h4v9h8v4h-8v19h-4V13H2V9h8z"/></svg>`;

export const facebookIcon = (cls = 'fb') =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/></svg>`;

// Top-level menu items as list items. The mockups do not open the About, Services and Gallery submenus.
export const navItems = (c, current = 'Home') => c.nav.map((item) =>
  `<li><a href="${item.href}"${item.name === current ? ' aria-current="page"' : ''}>${esc(item.name)}</a></li>`).join('');

export const addressLines = (c, sep = '<br>') => c.address.map(esc).join(sep);

// The bar above every mockup: which design this is, home or article, and the way to the others.
// It is not part of any design, so it keeps to the system font and a plain dark grey.
const MOCK_CSS = `
.mockbar{all:initial;display:block;background:#2b2d31;color:#f2f2f3;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:8px max(16px,env(safe-area-inset-left,0px))}
.mockbar *{all:unset;box-sizing:border-box}
.mockbar__in{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 16px;max-width:80rem;margin:0 auto}
.mockbar__name{display:block;font-weight:600}
.mockbar__name span{opacity:.75;font-weight:400}
.mockbar__links{display:flex;flex-wrap:wrap;gap:4px 6px}
.mockbar a{display:inline-block;padding:4px 10px;border-radius:999px;color:#f2f2f3;text-decoration:none;cursor:pointer;border:1px solid #55585e}
.mockbar a:hover,.mockbar a:focus-visible{background:#45484e;outline:none}
.mockbar a[aria-current]{background:#f2f2f3;color:#2b2d31;border-color:#f2f2f3}
.mocktoast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:1000;max-width:calc(100% - 32px);padding:10px 16px;border-radius:8px;background:#2b2d31;color:#fff;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 4px 16px rgb(0 0 0/.25)}
`;

const MOCK_JS = `<script>
document.addEventListener('click', function (e) {
  var a = e.target.closest('a[href="#"]');
  if (!a) return;
  e.preventDefault();
  var t = document.querySelector('.mocktoast') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'mocktoast', role: 'status' }));
  t.textContent = 'This is a mockup. Only the home page and one article are filled in.';
  clearTimeout(t._h); t.hidden = false; t._h = setTimeout(function () { t.hidden = true; }, 2600);
});
</script>`;

export function mockBar({ number, total, name, which, prev, next }) {
  const cur = (w) => (which === w ? ' aria-current="page"' : '');
  return `<div class="mockbar"><div class="mockbar__in">
<span class="mockbar__name">Design ${number} of ${total}: ${esc(name)} <span>(${which === 'home' ? 'home page' : 'article'})</span></span>
<span class="mockbar__links">
<a href="index.html"${cur('home')}>Home</a><a href="article.html"${cur('article')}>Article</a>
<a href="../${prev}/${which === 'home' ? 'index' : 'article'}.html" aria-label="Previous design">&#8249;</a><a href="../index.html">All designs</a><a href="../${next}/${which === 'home' ? 'index' : 'article'}.html" aria-label="Next design">&#8250;</a>
</span></div></div>`;
}

export function doc({ title, fonts, css, bar, body }) {
  const fontLinks = fonts
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts}&display=swap">`
    : '';
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${fontLinks}
<style>${MOCK_CSS}${css}</style>
</head>
<body>
${bar}
${body}
${MOCK_JS}
</body>
</html>
`;
}

// Inserts the bar and toast into a page that already exists (the original design).
export function wrapExisting(html, bar) {
  return html
    .replace('</head>', `<style>${MOCK_CSS}</style>\n</head>`)
    .replace(/<body([^>]*)>/, `<body$1>\n${bar}`)
    .replace('</body>', `${MOCK_JS}\n</body>`);
}
