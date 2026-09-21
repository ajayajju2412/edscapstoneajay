/*
 * tabs-minimal-dark-withimg
 * Forked tabs variant: a category filter bar above a responsive grid of
 * image cards. The first row holds the filter labels; each remaining row is
 * a card (image + heading + description) tagged with one or more categories.
 *
 * Authoring model:
 *   row 0            → filter labels (comma-separated or one cell per label)
 *   rows 1..n        → cards; cell 0 = image, cell 1 = content.
 *                      A card's categories come from a data-category on the
 *                      content, or are inferred as "all".
 */

import { toClassName } from '../../scripts/aem.js';

export default function decorate(block) {
  const rows = [...block.children];
  const [filterRow, ...cardRows] = rows;

  // Build the filter bar
  const filters = document.createElement('div');
  filters.className = 'tabs-minimal-dark-withimg-filters';
  filters.setAttribute('role', 'tablist');

  const labels = [];
  if (filterRow) {
    filterRow.querySelectorAll(':scope > div').forEach((cell) => {
      cell.textContent.split(',').forEach((raw) => {
        const label = raw.trim();
        if (label) labels.push(label);
      });
    });
    filterRow.remove();
  }
  if (!labels.some((l) => toClassName(l) === 'all')) labels.unshift('All');

  // Build the card grid
  const grid = document.createElement('ul');
  grid.className = 'tabs-minimal-dark-withimg-grid';

  cardRows.forEach((row) => {
    const li = document.createElement('li');
    li.className = 'tabs-minimal-dark-withimg-card';
    [...row.children].forEach((cell) => {
      if (cell.querySelector('picture, img')) {
        cell.className = 'tabs-minimal-dark-withimg-card-image';
      } else {
        cell.className = 'tabs-minimal-dark-withimg-card-body';
      }
      li.append(cell);
    });
    li.dataset.category = row.dataset.category || 'all';
    grid.append(li);
    row.remove();
  });

  labels.forEach((label, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tabs-minimal-dark-withimg-filter';
    button.textContent = label;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', i === 0);
    const key = toClassName(label);
    button.addEventListener('click', () => {
      filters.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', false));
      button.setAttribute('aria-selected', true);
      grid.querySelectorAll('.tabs-minimal-dark-withimg-card').forEach((card) => {
        const cats = (card.dataset.category || 'all').split(/\s+/);
        const show = key === 'all' || cats.includes(key);
        card.hidden = !show;
      });
    });
    filters.append(button);
  });

  block.prepend(grid);
  block.prepend(filters);
}
