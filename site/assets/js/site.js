// Enhances a menu that already works without script. Exposes nothing global.
(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  const groups = () => document.querySelectorAll('details.site-nav__group[open]');

  if (toggle && nav) {
    const set = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('aria-controls', 'site-nav');
    set(false);
    if (location.hash === '#site-nav') history.replaceState(null, '', location.pathname + location.search);
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      set(!nav.classList.contains('is-open'));
    });
    toggle.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        toggle.click();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const open = groups();
      if (open.length) {
        open.forEach((d) => { d.open = false; d.querySelector('summary').focus(); });
      } else if (nav.classList.contains('is-open')) {
        set(false);
        toggle.focus();
      }
    });
  }

  document.addEventListener('click', (e) => {
    groups().forEach((d) => { if (!d.contains(e.target)) d.open = false; });
  });
  // An open dropdown would cover the content that focus moves on to. Moving to another
  // dropdown is left to <details name>, which closes this one after the click, not before.
  document.addEventListener('focusout', (e) => {
    if (nav && nav.contains(e.relatedTarget)) return;
    groups().forEach((d) => { if (d.contains(e.target)) d.open = false; });
  });

  // Events that ended since the last build. The nightly build drops them for good.
  const cards = document.querySelectorAll('.event-list .card[data-end]');
  let left = cards.length;
  cards.forEach((c) => { if (Date.parse(c.dataset.end) < Date.now()) { c.hidden = true; left--; } });
  const empty = document.querySelector('.event-empty');
  if (empty && cards.length && !left) empty.hidden = false;
})();
