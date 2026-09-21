/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: FAQ template (/us/en/faqs).
 *
 * Source layout: two columns — main (wider): intro paragraph + a 7-item
 * cmp-accordion; sidebar (narrow): "Need more help?" + contact paragraph.
 *
 * EDS only decorates TOP-LEVEL blocks (a block table nested inside another
 * block's cell is never decorated). So we do NOT nest the accordion inside a
 * columns block. Instead we rebuild <main> as a flat, ordered set of
 * top-level nodes and let CSS (main .section.faq) lay them out in two columns:
 *
 *   1. h1 "FAQs"                 (default content, keeps the yellow underline)
 *   2. intro paragraph           (default content)
 *   3. accordion block           (top-level -> decorated to <details> items)
 *   4. sidebar block             (top-level -> "Need more help?" + contact)
 *
 * A `faq` Section Metadata style groups these so the FAQ CSS can place the
 * sidebar beside the intro+accordion.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

function buildAccordion(accEl) {
  const rows = [];
  accEl.querySelectorAll('.cmp-accordion__item').forEach((item) => {
    const titleEl = item.querySelector('.cmp-accordion__title');
    const panelEl = item.querySelector('.cmp-accordion__panel');
    const question = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';
    if (!question) return;

    const answerCell = document.createElement('div');
    if (panelEl) {
      const inner = panelEl.querySelector('.cmp-accordion__panel-content, .cmp-container') || panelEl;
      inner.childNodes.forEach((n) => answerCell.append(n.cloneNode(true)));
      if (!answerCell.textContent.trim()) {
        answerCell.textContent = panelEl.textContent.replace(/\s+/g, ' ').trim();
      }
      // strip empty heading artifacts WKND emits in some panels
      answerCell.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((hEl) => {
        if (!hEl.textContent.trim() && !hEl.querySelector('img')) hEl.remove();
      });
    }
    rows.push([question, answerCell]);
  });
  if (!rows.length) return null;
  return WebImporter.Blocks.createBlock(document, { name: 'accordion', cells: rows });
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.beforeTransform) return;

  const accEl = element.querySelector('.cmp-accordion');
  if (!accEl) return;

  // Capture the pieces we want, BEFORE rebuilding.
  const h1 = element.querySelector('h1');
  const introP = [...element.querySelectorAll('p')]
    .find((p) => /WKND is a collective/i.test(p.textContent));
  const accordionBlock = buildAccordion(accEl);

  // sidebar: "Need more help?" heading + its contact paragraph(s)
  const helpH = [...element.querySelectorAll('h1,h2,h3,h4,h5,h6')]
    .find((h) => /need more help/i.test(h.textContent));
  const sidebarRows = [];
  if (helpH) {
    const cell = document.createElement('div');
    const h = document.createElement('h3');
    h.textContent = helpH.textContent.trim();
    cell.append(h);
    const sidebarContainer = helpH.closest('.container, .cmp-container') || helpH.parentElement;
    sidebarContainer.querySelectorAll('p').forEach((p) => {
      if (p.textContent.trim()) cell.append(p.cloneNode(true));
    });
    sidebarRows.push([cell]);
  }
  const sidebarBlock = sidebarRows.length
    ? WebImporter.Blocks.createBlock(document, { name: 'faq-sidebar', cells: sidebarRows })
    : null;

  // Rebuild <main> content as a single faq section, in order.
  const section = document.createElement('div');
  if (h1) section.append(h1.cloneNode(true));
  if (introP) section.append(introP.cloneNode(true));
  if (accordionBlock) section.append(accordionBlock);
  if (sidebarBlock) section.append(sidebarBlock);

  // Section Metadata: style=faq (drives the two-column CSS).
  const sectionMeta = WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: { style: 'faq' },
  });
  section.append(sectionMeta);

  // Replace the entire page body content with our rebuilt section.
  element.textContent = '';
  element.append(section);
}
