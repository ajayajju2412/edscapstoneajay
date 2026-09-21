// eslint-disable-next-line import/no-unresolved
import { networkFromLabel, SOCIAL_ICON_SVGS } from '../../scripts/social-icons.js';

/*
 * social-links — article share buttons (Facebook / Twitter / Instagram, …).
 * Each authored row is one share link. WKND authors these with placeholder
 * hrefs ("#"), so the icon is derived from the link's LABEL text via the shared
 * scripts/social-icons.js helper — never from the href. (Keying an icon off an
 * href substring is exactly the bug that left the footer icons blank; this block
 * shares the footer's fix so it can't regress independently.)
 *
 * Authored block: one link per row. Cell text/href are preserved; we prepend an
 * inline SVG icon and keep the visible text label beside it.
 */

export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'social-links-list';

  [...block.children].forEach((row) => {
    const cell = row.firstElementChild || row;
    const link = cell.querySelector('a') || cell;
    const label = link.textContent.trim();
    if (!label) return;

    const network = networkFromLabel(label);

    const item = document.createElement('li');
    const anchor = document.createElement('a');
    anchor.href = link.getAttribute('href') || '#';
    anchor.className = 'social-links-link';
    if (network) anchor.classList.add(`social-links-${network}`);
    anchor.setAttribute('aria-label', label);

    if (network && SOCIAL_ICON_SVGS[network]) {
      const icon = document.createElement('span');
      icon.className = 'social-links-icon';
      icon.innerHTML = SOCIAL_ICON_SVGS[network];
      anchor.append(icon);
    }

    const text = document.createElement('span');
    text.className = 'social-links-label';
    text.textContent = label;
    anchor.append(text);

    item.append(anchor);
    list.append(item);
  });

  block.textContent = '';
  block.append(list);
}
