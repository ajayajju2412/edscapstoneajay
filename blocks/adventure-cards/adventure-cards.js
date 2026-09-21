import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * adventure-cards
 * Index-driven card rail. Reads /query-index.json (the site's published query
 * index), filters to adventure-detail pages, and renders one card per entry
 * (image + uppercase title + description). Authors control only the optional
 * limit + heading via the block's first cell.
 *
 * Authoring model (all optional):
 *   row 0, cell 0: a number — max cards to show (default: all)
 */

async function fetchIndex() {
  try {
    const resp = await fetch('/query-index.json');
    if (!resp.ok) return [];
    const json = await resp.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (e) {
    return [];
  }
}

function buildCard(entry) {
  const li = document.createElement('li');

  const imageCell = document.createElement('div');
  imageCell.className = 'adventure-cards-card-image';
  if (entry.image) {
    const a = document.createElement('a');
    a.href = entry.path;
    a.append(createOptimizedPicture(entry.image, entry.title || '', false, [{ width: '750' }]));
    imageCell.append(a);
  }

  const bodyCell = document.createElement('div');
  bodyCell.className = 'adventure-cards-card-body';
  const h3 = document.createElement('h3');
  const titleLink = document.createElement('a');
  titleLink.href = entry.path;
  titleLink.textContent = entry.title || '';
  h3.append(titleLink);
  bodyCell.append(h3);
  if (entry.description) {
    const p = document.createElement('p');
    p.textContent = entry.description;
    bodyCell.append(p);
  }

  li.append(imageCell, bodyCell);
  return li;
}

export default async function decorate(block) {
  // read optional limit from the authored block, then clear it
  const cfg = block.textContent.trim();
  const limit = /^\d+$/.test(cfg) ? parseInt(cfg, 10) : null;
  block.textContent = '';

  const entries = (await fetchIndex())
    .filter((e) => e.template === 'adventure-detail' && e.image);
  const shown = limit ? entries.slice(0, limit) : entries;

  const ul = document.createElement('ul');
  shown.forEach((entry) => ul.append(buildCard(entry)));
  block.append(ul);
}
