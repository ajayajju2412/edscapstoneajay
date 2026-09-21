/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards. Base: cards.
 * Source: https://wknd.site/us/en.html (.image-list.list)
 * Generated: 2026-09-21
 *
 * Block library structure: 2 columns, multiple rows; first row is block name.
 *   Each subsequent row = one card: [image cell, text content cell].
 *   Text cell: title (heading), optional description, optional CTA.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll(':scope .cmp-image-list__item, :scope li'));

  const cells = [];

  items.forEach((item) => {
    // Image: mandatory first cell.
    const img = item.querySelector('img');

    // Text content: title styled as heading, description, CTA.
    const contentCell = [];

    const titleText = item.querySelector('.cmp-image-list__item-title');
    const titleLink = item.querySelector('.cmp-image-list__item-title-link');
    if (titleText) {
      const heading = document.createElement('h3');
      const linkHref = titleLink ? titleLink.getAttribute('href') : null;
      if (linkHref) {
        const a = document.createElement('a');
        a.setAttribute('href', linkHref);
        a.textContent = titleText.textContent.trim();
        heading.appendChild(a);
      } else {
        heading.textContent = titleText.textContent.trim();
      }
      contentCell.push(heading);
    }

    const description = item.querySelector('.cmp-image-list__item-description');
    if (description) contentCell.push(description);

    // Skip empty cards.
    if (!img && !contentCell.length) return;

    cells.push([img || '', contentCell.length ? contentCell : '']);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
