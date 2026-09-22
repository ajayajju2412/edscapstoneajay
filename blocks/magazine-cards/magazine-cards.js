import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * magazine-cards
 * Index-driven card rail for Magazine articles — the article counterpart to
 * adventure-cards. Fetches /query-index.json at render time and builds cards
 * from entries under /us/en/magazine/ (image, uppercase title, description,
 * link). As magazine articles are added/reordered in the index, this rail
 * reflects them with no code change.
 *
 * Authoring model (all optional, in the block's first cell):
 *   - a number  -> how many cards to DISPLAY (default 4). Display count only;
 *                  every indexed article is still fetched, so a new page is
 *                  never silently hidden — an "All Articles" link covers the
 *                  rest.
 *   - "all"     -> show every indexed article (no display limit)
 */

const DEFAULT_DISPLAY = 4;
const INDEX_PATH = '/query-index.json';
const MAGAZINE_PREFIX = '/us/en/magazine/';
const MAGAZINE_LISTING = '/us/en/magazine';

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
  imageCell.className = 'magazine-cards-card-image';
  if (entry.image) {
    const a = document.createElement('a');
    a.href = entry.path;
    a.append(createOptimizedPicture(entry.image, entry.title || '', false, [{ width: '750' }]));
    imageCell.append(a);
  }

  const bodyCell = document.createElement('div');
  bodyCell.className = 'magazine-cards-card-body';
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
  // read optional config tokens from the authored block, then clear it.
  //   - a number → display count (default 4)
  //   - "all"    → no display limit
  //   - "recent" → sort by lastModified desc (newest first) instead of by title;
  //                used by the homepage "Recent Articles" rail
  const cfg = block.textContent.trim().toLowerCase();
  const tokens = cfg.split(/\s+/).filter(Boolean);
  const recent = tokens.includes('recent');
  let display = DEFAULT_DISPLAY;
  if (tokens.includes('all')) display = Infinity;
  else {
    const num = tokens.find((t) => /^\d+$/.test(t));
    if (num) display = parseInt(num, 10);
  }
  block.textContent = '';

  // On the "recent" (homepage) rail, exclude whichever article is already shown
  // as the Featured Article above so it isn't duplicated. The featured article
  // is whatever a preceding block on the page links to under /us/en/magazine/;
  // derive it from the DOM (auto-adapts if the featured article changes) rather
  // than hardcoding a path.
  const excluded = new Set();
  if (recent) {
    const featuredLink = [...document.querySelectorAll('main .columns-featured a[href], main .columns a[href]')]
      .map((a) => { try { return new URL(a.href, window.location.origin).pathname.replace(/\.html?$/, ''); } catch { return null; } })
      .find((p) => p && p.startsWith(MAGAZINE_PREFIX));
    if (featuredLink) excluded.add(featuredLink);
  }

  // Every magazine-article page in the index (scoped by path in helix-query.yaml).
  const articles = (await fetchIndex())
    .filter((e) => e.path && e.path.startsWith(MAGAZINE_PREFIX) && e.image
      && !excluded.has(e.path.replace(/\.html?$/, '')))
    .sort((a, b) => (recent
      // newest first by lastModified (falling back to 0)
      ? (Number(b.lastModified) || 0) - (Number(a.lastModified) || 0)
      // stable display order: by title (indexer order is not guaranteed)
      : (a.title || '').localeCompare(b.title || '')));

  const shown = Number.isFinite(display) ? articles.slice(0, display) : articles;

  const ul = document.createElement('ul');
  shown.forEach((entry) => ul.append(buildCard(entry)));
  block.append(ul);

  // "All Articles" link to the full magazine listing — covers anything beyond
  // the visible count so added articles are never silently hidden. Styled as
  // the site's primary CTA (flat yellow, from styles.css a.button.primary). If
  // the page already authors an "All Articles" link right after this block,
  // promote that one in place; otherwise emit our own when the list overflows.
  const section = block.closest('.magazine-cards-wrapper')?.parentElement
    || block.closest('div')?.parentElement;
  const authoredLink = section && [...section.querySelectorAll('p > a')]
    .find((a) => /all articles/i.test(a.textContent)
      || (a.getAttribute('href') || '').replace(/\.html$/, '').endsWith(MAGAZINE_LISTING));

  if (authoredLink) {
    authoredLink.classList.add('button', 'primary');
    authoredLink.closest('p').className = 'button-wrapper';
  } else if (articles.length > shown.length) {
    const more = document.createElement('p');
    more.className = 'button-wrapper magazine-cards-more';
    const link = document.createElement('a');
    link.href = MAGAZINE_LISTING;
    link.textContent = 'All Articles';
    link.className = 'button primary';
    more.append(link);
    block.append(more);
  }
}
