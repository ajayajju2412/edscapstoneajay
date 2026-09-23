/*
 * magazine-sidebar — the right-hand column on wknd magazine-article pages.
 *
 * The source article layout is two columns: the article body on the left and a
 * sidebar on the right holding "SHARE THIS STORY" share icons and an
 * index-driven list of other magazine articles (title + date). Our import
 * captured only the single article column, so this module rebuilds that layout
 * client-side on magazine-article pages:
 *   1. keeps the hero image + breadcrumb full-width at the top;
 *   2. moves the remaining article content into a left column;
 *   3. appends a right-column sidebar (share links + related-articles list).
 * The related list is index-driven (fetched from /query-index.json) so it stays
 * in sync as articles are added — the same pattern as magazine-cards.
 */

import { SOCIAL_ICON_SVGS } from './social-icons.js';

const INDEX_PATH = '/query-index.json';
const MAGAZINE_PREFIX = '/us/en/magazine/';
const SIDEBAR_COUNT = 4;
const SHARE_NETWORKS = ['facebook', 'twitter', 'pinterest'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function currentPath() {
  // strip a leading /content (local `aem up` preview) and any .html suffix so
  // the same checks work locally and on the hosted preview/live
  return window.location.pathname.replace(/^\/content/, '').replace(/\.html?$/, '');
}

function isMagazineArticle() {
  const path = currentPath();
  // an article lives under /us/en/magazine/ (the bare /magazine listing is not one)
  return path.startsWith(MAGAZINE_PREFIX) && path !== '/us/en/magazine';
}

/* "Wednesday, 30 Sep 2020" from a unix-seconds (or ms) lastModified value */
function formatDate(lastModified) {
  const n = Number(lastModified);
  if (!n) return '';
  const d = new Date(n < 1e12 ? n * 1000 : n);
  if (Number.isNaN(d.getTime())) return '';
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

async function fetchArticles() {
  try {
    const resp = await fetch(INDEX_PATH);
    if (!resp.ok) return [];
    const json = await resp.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (e) {
    return [];
  }
}

function buildShare() {
  const wrap = document.createElement('div');
  wrap.className = 'magazine-sidebar-share';

  const heading = document.createElement('h5');
  heading.className = 'magazine-sidebar-heading';
  heading.textContent = 'SHARE THIS STORY';
  wrap.append(heading);

  const links = document.createElement('div');
  links.className = 'magazine-sidebar-share-links';
  const url = encodeURIComponent(window.location.href);
  const shareHref = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    twitter: `https://twitter.com/intent/tweet?url=${url}`,
    pinterest: `https://www.pinterest.com/pin/create/button/?url=${url}`,
  };
  SHARE_NETWORKS.forEach((net) => {
    const a = document.createElement('a');
    a.className = `magazine-sidebar-share-link magazine-sidebar-share-${net}`;
    a.href = shareHref[net] || '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', `Share on ${net}`);
    if (SOCIAL_ICON_SVGS[net]) a.innerHTML = SOCIAL_ICON_SVGS[net];
    links.append(a);
  });
  wrap.append(links);
  return wrap;
}

function buildRelated(articles) {
  const here = currentPath();
  const items = articles
    .filter((e) => e.path && e.path.startsWith(MAGAZINE_PREFIX)
      && e.path.replace(/\.html?$/, '') !== here)
    .sort((a, b) => (Number(b.lastModified) || 0) - (Number(a.lastModified) || 0))
    .slice(0, SIDEBAR_COUNT);
  if (!items.length) return null;

  const ul = document.createElement('ul');
  ul.className = 'magazine-sidebar-list';
  items.forEach((entry) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = entry.path.replace(/\.html?$/, '');

    const title = document.createElement('span');
    title.className = 'magazine-sidebar-list-title';
    title.textContent = entry.title || '';
    a.append(title);

    const date = formatDate(entry.lastModified);
    if (date) {
      const dateEl = document.createElement('span');
      dateEl.className = 'magazine-sidebar-list-date';
      dateEl.textContent = date;
      a.append(dateEl);
    }
    li.append(a);
    ul.append(li);
  });
  return ul;
}

export default async function decorateMagazineSidebar(main) {
  if (!isMagazineArticle()) return;

  const section = main.querySelector('.section.writer-details-container')
    || main.querySelector('.section');
  if (!section || section.querySelector('.magazine-article-body')) return;

  // Everything currently in the section, in order. The hero image (first
  // wrapper holding an img) and the breadcrumb wrapper stay full-width on top;
  // the rest becomes the left column.
  const wrappers = [...section.children];
  const heroWrapper = wrappers.find((w) => w.querySelector('picture, img'));
  const breadcrumbWrapper = wrappers.find((w) => w.classList.contains('breadcrumbs-wrapper'));
  const topWrappers = [heroWrapper, breadcrumbWrapper].filter(Boolean);
  const bodyWrappers = wrappers.filter((w) => !topWrappers.includes(w));

  // two-column grid: article body (left) + sidebar (right)
  const grid = document.createElement('div');
  grid.className = 'magazine-article-body';

  const mainCol = document.createElement('div');
  mainCol.className = 'magazine-article-main';
  bodyWrappers.forEach((w) => mainCol.append(w));

  const aside = document.createElement('aside');
  aside.className = 'magazine-article-aside';
  aside.append(buildShare());

  grid.append(mainCol, aside);
  section.append(grid);

  // populate the index-driven related list (async; layout already in place)
  const related = buildRelated(await fetchArticles());
  if (related) {
    const sep = document.createElement('hr');
    sep.className = 'magazine-sidebar-sep';
    aside.append(sep, related);
  }
}
