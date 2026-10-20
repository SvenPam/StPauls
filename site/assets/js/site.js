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

  // Event labels and countdowns from the visitor's clock, the rules in config/dates.js. Lists also hide
  // events that ended since the last build; the nightly build drops them for good.
  const now = Date.now();
  const H = 36e5;
  const D = 24 * H;
  document.querySelectorAll('[data-end]').forEach((el) => {
    const ms = Date.parse(el.dataset.start) - now;
    const st = now > Date.parse(el.dataset.end) ? 'Expired' : ms <= 0 ? 'Active' : ms < 7 * D ? 'Soon' : '';
    const label = el.querySelector('.status');
    if (el.matches('.countdown')) {
      el.textContent = st === 'Active' ? 'In Progress' : st === 'Expired' ? st
        : ms < H ? `${Math.max(1, ms / 6e4 | 0)} minutes to go` : ms < D ? `${ms / H | 0} hours to go` : `${ms / D | 0} days to go`;
    } else if (label) {
      el.hidden = st === 'Expired' && !!el.closest('.event-list,.home-events');
      label.textContent = st === 'Active' ? (el.matches('li') ? st : 'In Progress') : st;
    }
  });
  // A month, the home column or the calendar list with nothing left.
  document.querySelectorAll('.home-events__month,.home-events,.event-list').forEach((g) => {
    if (!g.querySelector('[data-end]:not([hidden])')) g.hidden = true;
  });
  const empty = document.querySelector('.event-list[hidden]~.event-empty');
  if (empty) empty.hidden = false;

  // The email subject names the enquiry type. Without script the type is still in the body.
  const form = document.querySelector('.contact-form');
  if (form) {
    const { subject, enquiry_type: type } = form.elements;
    const set = () => { subject.value = `${subject.dataset.subject}: ${type.value}`; };
    set();
    type.addEventListener('change', set);
  }
})();
