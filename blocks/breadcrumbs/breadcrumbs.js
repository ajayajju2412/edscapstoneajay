/*
 * Breadcrumbs Block
 * Renders a breadcrumb trail from an authored list of links.
 * Each row holds one crumb (a link, or plain text for the current page).
 */

export default function decorate(block) {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');

  const list = document.createElement('ol');
  list.className = 'breadcrumbs-list';

  const rows = [...block.children];
  rows.forEach((row, i) => {
    const item = document.createElement('li');
    item.className = 'breadcrumbs-item';
    const content = row.firstElementChild || row;
    item.append(...content.childNodes);

    // Authored crumb hrefs carry a `.html` suffix (e.g. /us/en/adventures.html)
    // which 404s on EDS (extensionless routing). Strip `.html` from internal
    // links so the crumb points at the real page.
    item.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && !/^(https?:)?\/\//.test(href)) {
        a.setAttribute('href', href.replace(/\.html(?=$|[?#])/, ''));
      }
    });

    if (i === rows.length - 1) {
      item.setAttribute('aria-current', 'page');
    }
    list.append(item);
  });

  nav.append(list);
  block.innerHTML = '';
  block.append(nav);
}
