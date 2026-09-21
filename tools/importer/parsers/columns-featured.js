/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured. Base: columns.
 * Source: https://wknd.site/us/en.html (.teaser.cmp-teaser--featured)
 * Generated: 2026-09-21
 *
 * Block library structure: multiple columns/rows; first row is block name.
 * This featured teaser is laid out as 2 columns in one content row:
 *   [text content cell (pretitle, title, description, CTA), image cell].
 */
export default function parse(element, { document }) {
  // Text content: pretitle, title, description, CTA link.
  const contentCell = [];
  const pretitle = element.querySelector('.cmp-teaser__pretitle');
  if (pretitle) contentCell.push(pretitle);

  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  if (title) contentCell.push(title);

  const description = element.querySelector('.cmp-teaser__description, p:not(.cmp-teaser__pretitle)');
  if (description) contentCell.push(description);

  const ctaLinks = Array.from(element.querySelectorAll(
    '.cmp-teaser__action-link, .cmp-teaser__action-container a',
  ));
  ctaLinks.forEach((cta) => contentCell.push(cta));

  // Image column.
  const img = element.querySelector('img');

  // Empty-block guard.
  if (!contentCell.length && !img) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [
    [contentCell.length ? contentCell : '', img || ''],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-featured', cells });
  element.replaceWith(block);
}
