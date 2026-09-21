/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: adventures-listing template (/us/en/adventures).
 *
 *  1. Intro teaser (.cmp-teaser: "Experience the world with us" + copy + image)
 *     -> columns-featured block (reuses the homepage featured layout).
 *  2. "Current Adventures" — the source tabs/category component with its static
 *     .image-list grid -> an empty `adventures-filter` block. That block is
 *     index-driven: it fetches /query-index.json at render time, builds the card
 *     grid, and derives the category filter tabs from each adventure's `category`
 *     meta. So the frozen source grid is replaced by a live, self-updating one.
 *
 * The "Current Adventures" heading (default content) is preserved above the block.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

function convertIntroTeaser(element) {
  // The first teaser on the page is the intro promo (heading + copy + image).
  // Guard against the tabs/category grid, which is not a teaser.
  const teaser = element.querySelector('.teaser .cmp-teaser, .cmp-teaser');
  if (!teaser) return;
  // must have both text and an image to be the intro promo
  const img = teaser.querySelector('picture, img');
  const heading = teaser.querySelector('h1, h2, h3');
  if (!img || !heading) return;

  const content = teaser.querySelector('.cmp-teaser__content') || teaser;
  const textCol = document.createElement('div');
  content.childNodes.forEach((n) => {
    if (!(n.nodeType === 1 && n.matches && n.matches('picture, img'))) {
      textCol.append(n.cloneNode(true));
    }
  });
  const imgCol = document.createElement('div');
  imgCol.append((img.closest('picture') || img).cloneNode(true));

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-featured',
    cells: [[textCol, imgCol]],
  });
  const teaserRoot = teaser.closest('.teaser') || teaser;
  teaserRoot.replaceWith(block);
}

function convertCurrentAdventures(element) {
  // The category tabs component holds the static adventure grid. Replace the
  // whole component with an empty index-driven adventures-filter block.
  const tabs = element.querySelector('.tabs.panelcontainer, .cmp-tabs');
  const list = element.querySelector('.image-list, .image-list.list');
  const target = (tabs && (tabs.closest('.tabs') || tabs))
    || (list && (list.closest('.image-list') || list));
  if (!target) return;

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'adventures-filter',
    cells: [['']],
  });
  target.replaceWith(block);
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.beforeTransform) return;
  convertIntroTeaser(element);
  convertCurrentAdventures(element);
}
