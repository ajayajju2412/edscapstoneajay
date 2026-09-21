import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * adventure-cards
 * Index-driven card rail (article-list style). Fetches /query-index.json at
 * render time and builds cards from that JSON — image, uppercase title,
 * description, link — rather than from baked-in static content. As adventure
 * pages are added/reordered in the index, this rail reflects them with no code
 * change.
 *
 * Authoring model (all optional, in the block's first cell):
 *   - a number  → how many cards to DISPLAY (default 4). This is a display
 *                 count only; every indexed adventure is still fetched, so a
 *                 new page is never silently hidden — it just may fall past the
 *                 visible count, with the "All Trips" link covering the rest.
 *   - "all"     → show every indexed adventure (no display limit)
 */

const DEFAULT_DISPLAY = 4;
const INDEX_PATH = '/query-index.json';
const ADVENTURES_PREFIX = '/us/en/adventures/';
const ADVENTURES_LISTING = '/us/en/adventures';

async function fetchIndex() {
  try {
    const resp = await fetch(INDEX_PATH);
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
  // read optional display count from the authored block, then clear it
  const cfg = block.textContent.trim().toLowerCase();
  let display = DEFAULT_DISPLAY;
  if (cfg === 'all') display = Infinity;
  else if (/^\d+$/.test(cfg)) display = parseInt(cfg, 10);
  block.textContent = '';

  // Every adventure-detail page in the index (scoped by path in helix-query.yaml).
  const adventures = (await fetchIndex())
    .filter((e) => e.path && e.path.startsWith(ADVENTURES_PREFIX) && e.image)
    // stable display order: by title (indexer order is not guaranteed)
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  const shown = Number.isFinite(display) ? adventures.slice(0, display) : adventures;

  const ul = document.createElement('ul');
  shown.forEach((entry) => ul.append(buildCard(entry)));
  block.append(ul);

  // "All Trips" link to the full adventures listing — covers anything beyond
  // the visible count so added pages are never silently hidden.
  //
  // Style it as the site's primary CTA button (flat yellow, from styles.css
  // `a.button.primary`). If the page already authors an "All Trips" link
  // right after this block (the homepage does), promote that one in place;
  // otherwise emit our own.
  const section = block.closest('.adventure-cards-wrapper')?.parentElement
    || block.closest('div')?.parentElement;
  const authoredLink = section && [...section.querySelectorAll('p > a')]
    .find((a) => /all trips/i.test(a.textContent)
      || (a.getAttribute('href') || '').replace(/\.html$/, '').endsWith(ADVENTURES_LISTING));

  if (authoredLink) {
    authoredLink.classList.add('button', 'primary');
    authoredLink.closest('p').className = 'button-wrapper';
  } else if (adventures.length > shown.length) {
    const more = document.createElement('p');
    more.className = 'button-wrapper adventure-cards-more';
    const link = document.createElement('a');
    link.href = ADVENTURES_LISTING;
    link.textContent = 'All Trips';
    link.className = 'button primary';
    more.append(link);
    block.append(more);
  }
}
