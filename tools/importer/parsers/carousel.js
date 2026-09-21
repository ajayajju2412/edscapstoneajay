/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel. Base: carousel.
 * Source: https://wknd.site/us/en.html (.carousel.cmp-carousel--hero)
 * Generated: 2026-09-21
 *
 * Block library structure: 2 columns, multiple rows.
 *   Row 1: block name only.
 *   Each subsequent row = one slide: [image cell, text content cell].
 *   Text cell may hold title (heading), description, and CTA link.
 */
export default function parse(element, { document }) {
  // Each carousel item is a slide. Fallback to teaser wrappers if item class differs.
  let slides = Array.from(element.querySelectorAll(':scope .cmp-carousel__item'));
  if (!slides.length) {
    slides = Array.from(element.querySelectorAll(':scope .teaser, :scope .cmp-teaser'));
  }

  const cells = [];

  slides.forEach((slide) => {
    // Image: mandatory first cell.
    const img = slide.querySelector('img');

    // Text content: title, description, CTA.
    const contentCell = [];
    const title = slide.querySelector('.cmp-teaser__title, h1, h2, h3');
    if (title) contentCell.push(title);

    const description = slide.querySelector('.cmp-teaser__description, p');
    if (description) contentCell.push(description);

    const ctaLinks = Array.from(slide.querySelectorAll(
      '.cmp-teaser__action-link, .cmp-teaser__action-container a',
    ));
    ctaLinks.forEach((cta) => contentCell.push(cta));

    // Skip empty slides (no image and no text).
    if (!img && !contentCell.length) return;

    cells.push([img || '', contentCell.length ? contentCell : '']);
  });

  // Empty-block guard: nothing extracted.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel', cells });
  element.replaceWith(block);
}
