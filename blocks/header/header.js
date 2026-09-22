// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetch the nav fragment as plain HTML.
 * Environment-aware: on localhost (`aem up`) the fragment lives under
 * /content/; on DA/EDS production it is served at the site root. Try the
 * likely path FIRST for the current environment so production never logs a
 * 404 for /content/nav.plain.html (and localhost never 404s for /nav...).
 */
async function loadNavFragment() {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const paths = isLocal
    ? ['/content/nav.plain.html', '/nav.plain.html']
    : ['/nav.plain.html', '/content/nav.plain.html'];
  let resp = await fetch(paths[0]);
  if (!resp.ok) resp = await fetch(paths[1]);
  if (!resp.ok) return null;
  const html = await resp.text();
  const container = document.createElement('div');
  container.innerHTML = html;
  return container;
}

function closeMenu(nav) {
  nav.setAttribute('aria-expanded', 'false');
  document.body.style.overflowY = '';
  const button = nav.querySelector('.nav-hamburger button');
  if (button) button.setAttribute('aria-label', 'Open navigation');
}

function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  const button = nav.querySelector('.nav-hamburger button');
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
}

// Inline SVG flags (24x16) — emoji flags don't render on most desktop browsers
// (they fall back to the two-letter country code as text), so use real SVGs.
const FLAG_SVGS = {
  us: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#b22234"/><g fill="#fff"><rect y="1.85" width="24" height="1.23"/><rect y="4.31" width="24" height="1.23"/><rect y="6.77" width="24" height="1.23"/><rect y="9.23" width="24" height="1.23"/><rect y="11.69" width="24" height="1.23"/><rect y="14.15" width="24" height="1.23"/></g><rect width="10" height="8.62" fill="#3c3b6e"/></svg>',
  gb: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" fill="#012169"/><path d="M0 0l24 16M24 0L0 16" stroke="#fff" stroke-width="3"/><path d="M0 0l24 16M24 0L0 16" stroke="#c8102e" stroke-width="1.5"/><path d="M12 0v16M0 8h24" stroke="#fff" stroke-width="5"/><path d="M12 0v16M0 8h24" stroke="#c8102e" stroke-width="3"/></svg>',
  fr: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="16" fill="#0055a4"/><rect x="8" width="8" height="16" fill="#fff"/><rect x="16" width="8" height="16" fill="#ef4135"/></svg>',
  de: '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="5.33" fill="#000"/><rect y="5.33" width="24" height="5.33" fill="#dd0000"/><rect y="10.66" width="24" height="5.34" fill="#ffce00"/></svg>',
};

// A small representative set of locales for the switcher (the source lists many;
// this shows the pattern). label is the trigger text; flag keys into FLAG_SVGS.
const LOCALES = [
  { label: 'en-US', name: 'United States', flag: 'us' },
  { label: 'es-US', name: 'Estados Unidos', flag: 'us' },
  { label: 'en-GB', name: 'United Kingdom', flag: 'gb' },
  { label: 'fr-FR', name: 'France', flag: 'fr' },
  { label: 'de-DE', name: 'Deutschland', flag: 'de' },
];

/**
 * Turn the authored "en-US" link into a real locale switcher: a toggle button
 * that reveals a dropdown of locales (flag + label + region name). The source
 * "en-US" was static text with no interaction.
 * @param {HTMLElement} nav the decorated <nav>
 */
function buildLocaleSwitcher(nav) {
  const link = [...nav.querySelectorAll('.nav-tools a[href]')]
    .find((a) => /langnavtoggle/i.test(a.getAttribute('href') || '') || /^[a-z]{2}-[a-z]{2}$/i.test(a.textContent.trim()));
  if (!link) return;

  const current = link.textContent.trim() || 'en-US';
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-locale';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-locale-toggle';
  toggle.setAttribute('aria-haspopup', 'listbox');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = current;

  const list = document.createElement('ul');
  list.className = 'nav-locale-list';
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  LOCALES.forEach((loc) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', loc.label === current ? 'true' : 'false');
    li.innerHTML = `<span class="nav-locale-flag" aria-hidden="true">${FLAG_SVGS[loc.flag] || ''}</span>`
      + `<span class="nav-locale-code">${loc.label}</span>`
      + `<span class="nav-locale-name">${loc.name}</span>`;
    li.addEventListener('click', () => {
      toggle.textContent = loc.label;
      [...list.children].forEach((c) => c.setAttribute('aria-selected', 'false'));
      li.setAttribute('aria-selected', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      list.hidden = true;
    });
    list.append(li);
  });

  const close = () => { toggle.setAttribute('aria-expanded', 'false'); list.hidden = true; };
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    list.hidden = open;
  });
  document.addEventListener('click', (e) => { if (!wrapper.contains(e.target)) close(); });
  window.addEventListener('keydown', (e) => { if (e.code === 'Escape') close(); });

  wrapper.append(toggle, list);
  link.replaceWith(wrapper);
}

/**
 * Build the search form (form controls are created in JS, never in the fragment).
 * @returns {HTMLElement} the search form element
 */
function buildSearch() {
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = '/us/en/search';
  form.innerHTML = `
    <label class="nav-search-label" for="nav-search-input">Search</label>
    <input id="nav-search-input" name="q" type="search" placeholder="Search" autocomplete="off" />
    <button type="submit" class="nav-search-submit" aria-label="Submit search"></button>`;
  return form;
}

/**
 * loads and decorates the header nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await loadNavFragment();
  block.textContent = '';
  if (!fragment) return;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Resolve relative image paths (authored relative in nav.plain.html) against
  // the content root so they work regardless of the host page's URL depth.
  nav.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:)?\/\//.test(src) && !src.startsWith('/')) {
      img.src = `/${src.replace(/^\.?\//, '')}`;
    }
  });

  // section roles: brand (logo), sections (primary nav), tools (locale + sign-in)
  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // brand: strip any button decoration EDS may have applied to the logo link
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a.button');
    if (brandLink) {
      brandLink.className = '';
      const container = brandLink.closest('.button-container');
      if (container) container.className = '';
    }
  }

  // primary nav: expose the top-level list as .nav-list (flat list of links)
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    const topList = navSections.querySelector(':scope > ul');
    if (topList) topList.classList.add('nav-list');

    // active-page highlight: mark the nav link whose section matches the current
    // path (wknd highlights the current section's link with a yellow block).
    // Compare on the first path segment after /us/en so e.g.
    // /us/en/adventures/bali-surf-camp still highlights "Adventures".
    const here = window.location.pathname.replace(/\.html?$/, '').replace(/\/$/, '');
    const sectionOf = (p) => {
      const m = p.match(/^\/us\/en\/([^/]+)/);
      return m ? m[1] : '';
    };
    const currentSection = sectionOf(here);
    navSections.querySelectorAll('a[href]').forEach((a) => {
      let dest;
      try { dest = new URL(a.href, window.location.origin).pathname; } catch { return; }
      dest = dest.replace(/\.html?$/, '').replace(/\/$/, '');
      if (dest === here || (currentSection && sectionOf(dest) === currentSection)) {
        a.setAttribute('aria-current', 'page');
        a.closest('li')?.classList.add('nav-active');
      }
    });

    // search box lives in the nav row (right of the primary links), matching source
    navSections.append(buildSearch());
  }

  // locale switcher: turn the static "en-US" link into a real dropdown
  buildLocaleSwitcher(nav);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // reset menu state when crossing the desktop/mobile breakpoint
  isDesktop.addEventListener('change', () => closeMenu(nav));

  // collapse mobile menu on escape
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && !isDesktop.matches) closeMenu(nav);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // Scroll-triggered shrink (desktop): wknd's header compacts after scrolling
  // down (~194px → ~114px). Add .nav-scrolled past a threshold; CSS handles the
  // size transition. rAF-throttled so scrolling stays smooth.
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      navWrapper.classList.toggle('nav-scrolled', window.scrollY > 100);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
