// eslint-disable-next-line import/no-unresolved
import { networkFromLabel } from '../../scripts/social-icons.js';

/**
 * Fetch the footer fragment as plain HTML.
 * Metadata-independent dual-fetch: /content first (localhost / aem up),
 * then root (DA/EDS production, where the fragment is served at site root).
 */
async function loadFooterFragment() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const container = document.createElement('div');
  container.innerHTML = html;
  return container;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await loadFooterFragment();
  block.textContent = '';
  if (!fragment) return;

  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Resolve relative image paths (authored relative in footer.plain.html)
  // against the content root so they work regardless of the page's URL depth.
  footer.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:)?\/\//.test(src) && !src.startsWith('/')) {
      img.src = `/${src.replace(/^\.?\//, '')}`;
    }
  });

  // Label the four footer sections for styling: brand, nav, social, legal
  const sections = [...footer.children];
  const names = ['brand', 'nav', 'social', 'legal'];
  sections.forEach((section, i) => {
    if (names[i]) section.classList.add(`footer-${names[i]}`);
  });

  // Tag each social link with a network class from its label so the icon CSS
  // doesn't depend on the href (authored links are "/" placeholders) or on
  // list order. e.g. "Facebook" -> .footer-social-facebook. The label→network
  // derivation is shared with the magazine social-links block (scripts/social-icons.js).
  const socialSection = footer.querySelector('.footer-social');
  if (socialSection) {
    // "Follow Us" is a label for the social links, not part of the page's
    // document outline. Authored as a heading in the fragment, it breaks
    // heading-order on every page (the footer level can't be right for every
    // template's main content). Demote it to a styled <p> so the footer never
    // contributes a heading to the outline.
    socialSection.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      const p = document.createElement('p');
      p.className = 'footer-social-label';
      p.innerHTML = h.innerHTML;
      h.replaceWith(p);
    });

    socialSection.querySelectorAll('a').forEach((a) => {
      const network = networkFromLabel(a.textContent);
      if (network) a.classList.add(`footer-social-${network}`);
    });
  }

  block.append(footer);
}
