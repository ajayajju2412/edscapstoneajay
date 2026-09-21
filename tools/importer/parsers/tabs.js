/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs. Base: tabs.
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html (.tabs .cmp-tabs)
 * Generated: 2026-09-21
 *
 * Block library convention: 2 columns, multiple rows.
 *   Row 1: block name only.
 *   Each subsequent row = one tab: [tab label (mandatory), tab content (mandatory)].
 *   Panel content is the content-fragment body (paragraphs, images, lists).
 */
export default function parse(element, { document }) {
  // Tab labels live in the tablist; panels are the tabpanel siblings.
  const labels = Array.from(
    element.querySelectorAll('.cmp-tabs__tablist .cmp-tabs__tab, [role="tab"]'),
  );
  const panels = Array.from(
    element.querySelectorAll('.cmp-tabs__tabpanel, [role="tabpanel"]'),
  );

  const cells = [];

  panels.forEach((panel, i) => {
    // Label text for this tab (fallback to a generic label if missing).
    const label = labels[i]
      ? (labels[i].textContent || '').replace(/\s+/g, ' ').trim()
      : `Tab ${i + 1}`;

    // Panel content: prefer the content-fragment elements body, fall back to the panel.
    const contentRoot = panel.querySelector('.cmp-contentfragment__elements') || panel;

    // Collect meaningful content nodes (paragraphs, images, lists, headings).
    const contentCell = [];
    const nodes = Array.from(contentRoot.querySelectorAll('p, ul, ol, img, h2, h3, h4, blockquote'));
    nodes.forEach((node) => {
      if (node.tagName === 'IMG') {
        // Keep the image element itself.
        if (node.getAttribute('src')) contentCell.push(node);
        return;
      }
      // Skip empty layout paragraphs; keep text or image-bearing nodes.
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      const hasImg = node.querySelector && node.querySelector('img');
      if (text || hasImg) contentCell.push(node);
    });

    // Skip tabs with no label and no content.
    if (!label && !contentCell.length) return;

    cells.push([label, contentCell.length ? contentCell : '']);
  });

  // Empty-block guard: nothing extracted.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', cells });
  element.replaceWith(block);
}
