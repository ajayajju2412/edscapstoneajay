import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * adventures-filter
 * Index-driven adventures grid with a category filter bar (WKND "Current
 * Adventures"). Fetches /query-index.json at render time, builds one card per
 * indexed adventure, and derives the filter tabs from the distinct `category`
 * values in the index — so both the grid AND the filter options stay in sync
 * with content, with no code change when adventures are added/recategorised.
 *
 * Each index row may carry a comma-separated `category` (e.g. "Cycling, Travel"),
 * so a card can match more than one filter. Uncategorised adventures show only
 * under "All".
 *
 * Authoring model: the block is empty (or holds an optional order hint); all
 * data comes from the index.
 */

const INDEX_PATH = '/query-index.json';
const ADVENTURES_PREFIX = '/us/en/adventures/';

// canonical filter order matching the source site; any extra categories found
// in the index are appended after these, so new categories still surface.
const PREFERRED_ORDER = ['Climbing', 'Cycling', 'Skiing', 'Surfing', 'Travel'];

// Fallback category per adventure slug, captured from wknd.site's "Current
// Adventures" filter (each tab's membership). Used ONLY when the index row has
// no `category` (the detail page's category metadata is currently absent on
// DA). When the index does carry a category it wins, so restoring the meta
// later needs no code change. Note this is the source's FILTER grouping — not
// the "Activity" field: e.g. beervana/napa/gastronomic/riverside/yosemite →
// Travel, mountain biking → Cycling. A slug may have more than one category.
// Slugs absent here (e.g. cycling-southern-utah) are uncategorised on the
// source and show only under "All".
const CATEGORY_FALLBACK = {
  'bali-surf-camp': 'Surfing',
  'beervana-portland': 'Travel',
  'climbing-new-zealand': 'Climbing',
  'colorado-rock-climbing': 'Climbing',
  'cycling-tuscany': 'Cycling, Travel',
  'downhill-skiing-wyoming': 'Skiing',
  'gastronomic-marais-tour': 'Travel',
  'napa-wine-tasting': 'Travel',
  'riverside-camping-australia': 'Travel',
  'ski-touring-mont-blanc': 'Skiing',
  'surf-camp-costa-rica': 'Surfing',
  'tahoe-skiing': 'Skiing',
  'west-coast-cycling': 'Cycling',
  'whistler-mountain-biking': 'Cycling',
  'yosemite-backpacking': 'Travel',
};

// The index `category` if present, else the slug fallback above.
function categoryFor(entry) {
  if (entry.category && entry.category.trim()) return entry.category;
  const slug = (entry.path || '').replace(ADVENTURES_PREFIX, '').replace(/\/$/, '');
  return CATEGORY_FALLBACK[slug] || '';
}

function toKey(s) {
  return (s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseCategories(raw) {
  return (raw || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

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
  li.className = 'adventures-filter-card';
  // space-separated category keys for filtering; "all" always matches
  const keys = parseCategories(categoryFor(entry)).map(toKey);
  li.dataset.categories = ['all', ...keys].join(' ');

  const imageCell = document.createElement('div');
  imageCell.className = 'adventures-filter-card-image';
  if (entry.image) {
    const a = document.createElement('a');
    a.href = entry.path;
    a.append(createOptimizedPicture(entry.image, entry.title || '', false, [{ width: '750' }]));
    imageCell.append(a);
  }

  const bodyCell = document.createElement('div');
  bodyCell.className = 'adventures-filter-card-body';
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
  block.textContent = '';

  const adventures = (await fetchIndex())
    .filter((e) => e.path && e.path.startsWith(ADVENTURES_PREFIX) && e.image)
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  // distinct categories present in the index, ordered by PREFERRED_ORDER then extras
  const present = new Set();
  adventures.forEach((e) => parseCategories(categoryFor(e)).forEach((c) => present.add(c)));
  const ordered = [
    ...PREFERRED_ORDER.filter((c) => present.has(c)),
    ...[...present].filter((c) => !PREFERRED_ORDER.includes(c)).sort(),
  ];
  const labels = ['All', ...ordered];

  // filter bar
  const filters = document.createElement('div');
  filters.className = 'adventures-filter-filters';
  filters.setAttribute('role', 'tablist');

  // card grid
  const grid = document.createElement('ul');
  grid.className = 'adventures-filter-grid';
  adventures.forEach((entry) => grid.append(buildCard(entry)));

  labels.forEach((label, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'adventures-filter-filter';
    button.textContent = label;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', i === 0);
    const key = toKey(label);
    button.addEventListener('click', () => {
      filters.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', 'false'));
      button.setAttribute('aria-selected', 'true');
      grid.querySelectorAll('.adventures-filter-card').forEach((card) => {
        const cats = (card.dataset.categories || 'all').split(/\s+/);
        card.hidden = !(key === 'all' || cats.includes(key));
      });
    });
    filters.append(button);
  });

  block.append(filters, grid);
}
