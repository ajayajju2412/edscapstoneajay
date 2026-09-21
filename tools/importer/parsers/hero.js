/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero. Base: hero.
 * Source: https://wknd.site/us/en.html (.teaser.cmp-teaser--hero.cmp-teaser--imagebottom)
 * Generated: 2026-09-21
 *
 * Block library structure: 1 column, 3 rows.
 *   Row 1: block name.
 *   Row 2: background image (optional).
 *   Row 3: title (heading), subheading, CTA.
 */
export default function parse(element, { document }) {
  const img = element.querySelector('img');
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = element.querySelector('.cmp-teaser__description, p');
  const ctaLinks = Array.from(element.querySelectorAll(
    '.cmp-teaser__action-link, .cmp-teaser__action-container a',
  ));

  // Empty-block guard.
  if (!img && !title && !description) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image (optional).
  if (img) cells.push([img]);

  // Row 3: text content in a single cell.
  const contentCell = [];
  if (title) contentCell.push(title);
  if (description) contentCell.push(description);
  ctaLinks.forEach((cta) => contentCell.push(cta));
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
