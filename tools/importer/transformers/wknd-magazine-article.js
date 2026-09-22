/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: magazine-article template cleanup + block synthesis.
 *
 * WKND magazine pages carry structures that map to our blocks but aren't plain
 * rich text, so we convert them into block tables in beforeTransform (while the
 * source DOM is intact, before html2md flattens everything):
 *
 *   1. .cmp-byline (avatar + name + occupations)  -> writer-details block
 *   2. article share buttons (.cmp-button group)  -> social-links block
 *   3. pull-quote <blockquote> (+ attribution)     -> quote block
 *   4. remove the WKND "SHARE THIS STORY" sidebar + related-articles rail
 *      (site chrome that has no place in the imported article body)
 *   5. remove the contentfragment title that echoes the page <h1>
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Kept in sync with scripts/social-icons.js SOCIAL_NETWORKS. Inlined here rather
// than imported: this transformer is bundled into the browser importer context,
// which has no module resolution to the runtime /scripts helpers.
const SOCIAL_NETWORKS = ['facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'pinterest', 'tiktok'];

function networkFromLabel(label) {
  const text = (label || '').trim().toLowerCase();
  return SOCIAL_NETWORKS.find((n) => text.includes(n)) || null;
}

function convertByline(element) {
  element.querySelectorAll('.cmp-byline').forEach((byline) => {
    const rows = [];

    // avatar image — the byline lazy-loads via data-cmp-src; the rendered <img>
    // is present after page load, but be defensive and fall back to data-cmp-src.
    const imgEl = byline.querySelector('img');
    const imgWrap = byline.querySelector('.cmp-byline__image');
    let src = imgEl && imgEl.getAttribute('src');
    if (!src && imgWrap) {
      const holder = imgWrap.querySelector('[data-cmp-src]');
      if (holder) src = holder.getAttribute('data-cmp-src').replace('{.width}', '');
    }
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      const name = byline.querySelector('.cmp-byline__name');
      img.alt = name ? name.textContent.trim() : 'Author';
      rows.push([img]);
    }

    const name = byline.querySelector('.cmp-byline__name');
    if (name && name.textContent.trim()) rows.push([name.textContent.trim()]);

    const occ = byline.querySelector('.cmp-byline__occupations');
    if (occ && occ.textContent.trim()) rows.push([occ.textContent.trim()]);

    if (!rows.length) return;
    const block = WebImporter.Blocks.createBlock(document, { name: 'writer-details', cells: rows });
    // Replace ONLY the byline element — the share buttons are siblings inside
    // the same experience fragment and are converted separately by
    // convertSocialLinks; replacing the whole wrapper here would delete them.
    byline.replaceWith(block);
  });
}

function convertSocialLinks(element) {
  // The article share buttons render as <a class="cmp-button" aria-label="Facebook"
  // href="#">. The site FOOTER's "Follow Us" links match the same selector, so
  // exclude anything inside a footer/contentinfo and dedupe by NETWORK (label
  // text like "Facebook WKND Button" would otherwise slip past a raw-label dedupe).
  const buttons = Array.from(element.querySelectorAll('a.cmp-button[aria-label]'))
    .filter((a) => !a.closest('footer, [role="contentinfo"], .footer, .experiencefragment--footer'));
  if (!buttons.length) return;

  const rows = [];
  const seen = new Set();
  buttons.forEach((a) => {
    const label = (a.getAttribute('aria-label') || a.textContent || '').trim();
    if (!label) return;
    // Only keep genuine share buttons whose label maps to a known network, one
    // per network. This drops footer buttons ("... WKND Button") that survived
    // the footer-scope filter and any non-social cmp-buttons.
    const network = networkFromLabel(label);
    if (!network || seen.has(network)) return;
    seen.add(network);
    const link = document.createElement('a');
    link.href = a.getAttribute('href') || '#';
    link.textContent = network.charAt(0).toUpperCase() + network.slice(1);
    rows.push([link]);
  });
  if (!rows.length) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'social-links', cells: rows });
  // anchor the block where the button group lived
  const container = buttons[0].closest('.buildingblock, .aem-Grid') || buttons[0].parentElement;
  container.replaceWith(block);
  // clean up any now-empty button wrappers left behind
  element.querySelectorAll('.cmp-button, .button.cmp-button--secondary').forEach((el) => {
    if (!el.closest('.social-links')) el.remove();
  });
}

function convertPullQuotes(element) {
  element.querySelectorAll('blockquote').forEach((bq) => {
    // WKND groups the quote and its "- Author" attribution as sibling nodes in a
    // .cmp-text; capture the attribution paragraph if it follows the blockquote.
    const quotation = document.createElement('p');
    quotation.textContent = bq.textContent.replace(/\s+/g, ' ').trim();

    const cells = [[quotation]];
    // attribution: a sibling paragraph starting with "-" or the next <p>
    let attribution = bq.nextElementSibling;
    while (attribution && attribution.tagName !== 'P' && attribution.textContent.trim() === '') {
      attribution = attribution.nextElementSibling;
    }
    if (attribution && attribution.tagName === 'P' && /^[-–—]/.test(attribution.textContent.trim())) {
      const em = document.createElement('em');
      em.textContent = attribution.textContent.replace(/^[-–—]\s*/, '').trim();
      const attP = document.createElement('p');
      attP.append(em);
      cells.push([attP]);
      attribution.remove();
    }

    const block = WebImporter.Blocks.createBlock(document, { name: 'quote', cells });
    bq.replaceWith(block);
  });
}

function convertBylineHeading(element) {
  // The "By <author>" byline is an <h4> in the source, sitting right under the
  // page <h1> — that skips h2/h3 and fails heading-order. A byline is not part
  // of the document outline, so demote it to a plain <p>. Match by the "By "
  // prefix so we never touch section headings.
  element.querySelectorAll('h2, h3, h4, h5, h6').forEach((h) => {
    if (!/^\s*by\s+\S/i.test(h.textContent)) return;
    const p = document.createElement('p');
    p.innerHTML = h.innerHTML;
    h.replaceWith(p);
  });
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.beforeTransform) return;

  // 5. Remove the contentfragment title(s) that echo the page H1.
  WebImporter.DOMUtils.remove(element, ['h3.cmp-contentfragment__title']);

  // 6. Demote the "By <author>" byline heading to a paragraph (heading-order).
  convertBylineHeading(element);

  // 4. Remove the WKND sidebar (SHARE THIS STORY + related-articles list) — it's
  //    page chrome, not article content, and duplicates the footer/nav intent.
  WebImporter.DOMUtils.remove(element, [
    'aside.cmp-layoutcontainer--sidebar',
    'aside.container.responsivegrid',
  ]);

  // 3 → 1: order matters. Convert quotes inside the body first, then the byline
  //         and social buttons (which live in the experience fragment).
  convertPullQuotes(element);
  convertByline(element);
  convertSocialLinks(element);
}
