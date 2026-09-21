/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: content-landing template (about-us + magazine index).
 *
 * The two pages share the "editorial landing" template but have different
 * bodies, so this transformer detects and converts whichever structures exist:
 *
 *  magazine index:
 *    1. featured teaser (.cmp-teaser--featured)   -> columns-featured block
 *    2. static "All Articles" list (.image-list)  -> magazine-cards block ("all"),
 *       so the grid is index-driven from /query-index.json instead of a frozen
 *       snapshot of articles.
 *
 *  about-us:
 *    3. each contributor experience-fragment (.cmp-experiencefragment with an
 *       avatar + name + role + social links) -> one row of a contributors block,
 *       grouped per section ("Our Contributors", "WKND Guides").
 *
 * Contributor social icons are derived from the link label downstream (the
 * contributors block uses scripts/social-icons.js), so hrefs are preserved as-is.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const SOCIAL_NETWORKS = ['facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'pinterest', 'tiktok'];
function networkFromLabel(label) {
  const text = (label || '').trim().toLowerCase();
  return SOCIAL_NETWORKS.find((n) => text.includes(n)) || null;
}

/* ---- magazine index ------------------------------------------------------ */

function convertFeatured(element) {
  const feat = element.querySelector('.teaser.cmp-teaser--featured, [class*="teaser--featured"]');
  if (!feat) return;

  const content = feat.querySelector('.cmp-teaser__content') || feat;
  const img = feat.querySelector('picture, img');

  // text column: label (eyebrow) + heading + description + CTA link
  const textCol = document.createElement('div');
  content.childNodes.forEach((n) => textCol.append(n.cloneNode(true)));

  const imgCol = document.createElement('div');
  if (img) imgCol.append((img.closest('picture') || img).cloneNode(true));

  // columns-featured expects [ text, image ] cells in one row (image-left comes
  // from the block CSS ordering, matching the homepage featured article).
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-featured',
    cells: [[textCol, imgCol]],
  });
  feat.replaceWith(block);
}

function convertAllArticles(element) {
  // The static article grid becomes an index-driven magazine-cards rail. "all"
  // shows every indexed magazine article rather than a frozen list.
  const list = element.querySelector('.image-list.list, .image-list');
  if (!list) return;
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'magazine-cards',
    cells: [['all']],
  });
  list.replaceWith(block);
}

/* ---- about-us contributors ---------------------------------------------- */

function convertContributors(element) {
  // Each contributor is an experience fragment with avatar + name (h3) + role
  // (h5) + social links. Require BOTH an h3 and an h5 and exclude any XF inside
  // the footer/header — the footer XF (logo img + "Follow Us" h4 + social links)
  // would otherwise be mistaken for a contributor card and consumed.
  const cards = Array.from(element.querySelectorAll('.cmp-experiencefragment'))
    .filter((xf) => !xf.closest('footer, header, [role="contentinfo"], .cmp-experiencefragment--footer')
      && xf.querySelector('img')
      && xf.querySelector('h3')
      && xf.querySelector('h5')
      && xf.querySelector('a[href]'));
  if (!cards.length) return;

  // The "card root" is the AEM grid-column wrapper for the whole person card;
  // fall back to the cmp fragment itself. This is what we insert before / remove.
  const cardRoot = (xf) => xf.closest('.experiencefragment') || xf;

  // Group cards by the section they sit under ("Our Contributors" / "WKND
  // Guides"), keyed by the nearest PRECEDING <h2> in document order. This is
  // robust to WKND's nested containers — cards under the same heading form one
  // grid, and the heading (default content) stays above its grid.
  const headings = [...element.querySelectorAll('h2')];
  const precedingH2 = (node) => {
    let key = '__nohead__';
    headings.forEach((h) => {
      // h precedes node?
      if (h.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) {
        key = h.textContent.trim();
      }
    });
    return key;
  };

  const groups = new Map();
  cards.forEach((xf) => {
    const key = precedingH2(cardRoot(xf));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(xf);
  });

  groups.forEach((groupCards) => {
    const rows = groupCards.map((xf) => {
      const img = xf.querySelector('img');
      const name = xf.querySelector('h3, h4');
      const role = xf.querySelector('h5, h6');

      const socialCell = document.createElement('div');
      xf.querySelectorAll('a[href]').forEach((a) => {
        const label = (a.getAttribute('aria-label') || a.textContent || '').trim();
        if (!networkFromLabel(label)) return;
        const link = document.createElement('a');
        link.href = a.getAttribute('href') || '#';
        link.textContent = label;
        socialCell.append(link);
      });

      const avatarCell = document.createElement('div');
      if (img && img.getAttribute('src')) {
        const newImg = document.createElement('img');
        newImg.src = img.getAttribute('src');
        newImg.alt = name ? name.textContent.trim() : '';
        avatarCell.append(newImg);
      }

      return [
        avatarCell,
        name ? name.textContent.trim() : '',
        role ? role.textContent.trim() : '',
        socialCell,
      ];
    });

    const block = WebImporter.Blocks.createBlock(document, { name: 'contributors', cells: rows });
    // Insert the grid where the first card was, then remove every card root.
    const firstRoot = cardRoot(groupCards[0]);
    firstRoot.parentNode.insertBefore(block, firstRoot);
    groupCards.forEach((xf) => cardRoot(xf).remove());
  });
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.beforeTransform) return;

  // magazine index
  convertFeatured(element);
  convertAllArticles(element);

  // about-us contributors
  convertContributors(element);
}
