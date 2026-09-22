/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: homepage template (/us/en).
 *
 * The source homepage has two frozen `.image-list.list` grids:
 *   1. "Recent Articles"  — cards linking to /us/en/magazine/* articles.
 *   2. "Destinations"     — cards linking to /us/en/adventures/* detail pages.
 *
 * Both are replaced with their index-driven counterparts so the homepage rails
 * are live (fetch /query-index.json at render time) instead of a static
 * snapshot — a newly published article/adventure appears with zero code change:
 *   - magazine grid  -> magazine-cards block ("4 recent"): the 4 most recently
 *                       modified magazine articles.
 *   - adventures grid -> adventure-cards block (default 4): trip cards.
 *
 * The rail is identified by the destination of its links (magazine vs
 * adventures), not by DOM position, so it is robust to source reordering. The
 * "Recent Articles" / "Where do you want to go?" headings (default content) and
 * the authored "All Articles" / "All Trips" links are preserved above/after the
 * block — the index blocks promote those links to the primary CTA at render.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

function railTarget(list) {
  // The element to replace: the whole .image-list wrapper if present, else the list.
  return list.closest('.image-list') || list;
}

function linkKind(list) {
  // Decide which index this grid maps to from the paths its cards link to.
  const hrefs = [...list.querySelectorAll('a[href]')].map((a) => a.getAttribute('href') || '');
  if (hrefs.some((h) => /\/us\/en\/magazine\//.test(h))) return 'magazine';
  if (hrefs.some((h) => /\/us\/en\/adventures\//.test(h))) return 'adventures';
  return null;
}

function convertRails(element) {
  const lists = [...element.querySelectorAll('.image-list.list, .image-list')];
  // de-dupe nested matches (.image-list.list inside .image-list), keep outermost
  const roots = lists.filter((l) => !lists.some((o) => o !== l && o.contains(l)));

  roots.forEach((list) => {
    const kind = linkKind(list);
    let block = null;
    if (kind === 'magazine') {
      // homepage rail: 4 most-recent magazine articles (see magazine-cards.js).
      block = WebImporter.Blocks.createBlock(document, {
        name: 'magazine-cards',
        cells: [['4 recent']],
      });
      railTarget(list).replaceWith(block);
    } else if (kind === 'adventures') {
      // homepage rail: default 4 adventures (see adventure-cards.js).
      block = WebImporter.Blocks.createBlock(document, {
        name: 'adventure-cards',
        cells: [['']],
      });
      railTarget(list).replaceWith(block);
    }
    if (block) pullTitleIntoSection(block);
  });
}

/**
 * A rail's section title (e.g. "Recent Articles") sits in the source DOM BEFORE
 * the rail, so the section break inserted by wknd-sections lands AFTER the title
 * — trapping it in the previous section (e.g. the grey Featured band). Move the
 * heading to just after the break so it belongs to the rail's own section.
 */
function pullTitleIntoSection(block) {
  const hr = block.previousElementSibling;
  if (!hr || hr.tagName !== 'HR') return;
  const before = hr.previousElementSibling;
  if (!before) return;
  // the section title is a heading (or a wrapper whose last child is a heading)
  const heading = /^H[1-6]$/.test(before.tagName)
    ? before
    : before.querySelector && [...before.querySelectorAll('h1,h2,h3')].pop();
  if (!heading) return;
  // move the heading to sit right after the break, before the rail block
  hr.after(heading);
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.beforeTransform) return;
  convertRails(element);
}
