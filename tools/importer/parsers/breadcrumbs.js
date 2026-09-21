/* eslint-disable */
/* global WebImporter */
/**
 * Parser for breadcrumbs. Base: breadcrumbs.
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html (.breadcrumb.cmp-breadcrumb--fixed)
 * Generated: 2026-09-21
 *
 * Block structure: single column, one crumb per row.
 *   Row 1: block name only.
 *   Each subsequent row = one breadcrumb crumb.
 *     - Linked crumbs keep their anchor (href preserved).
 *     - The final/active crumb is the current page label (plain text).
 */
export default function parse(element, { document }) {
  // Breadcrumb items live in an ordered list; be defensive about the wrapper.
  const items = Array.from(
    element.querySelectorAll('.cmp-breadcrumb__item, li'),
  );

  const cells = [];

  items.forEach((item) => {
    // Linked crumb: preserve the anchor (and its href).
    const link = item.querySelector('a[href]');
    if (link) {
      // Ensure the anchor carries visible text (source nests it in a <span>).
      const label = (link.textContent || '').trim();
      if (label) {
        cells.push([link]);
        return;
      }
    }

    // Current/active crumb (no link): use its text label.
    const label = (item.textContent || '').replace(/\s+/g, ' ').trim();
    if (label) cells.push([label]);
  });

  // Empty-block guard: nothing extracted.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'breadcrumbs', cells });
  element.replaceWith(block);
}
