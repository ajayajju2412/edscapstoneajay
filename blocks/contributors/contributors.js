// eslint-disable-next-line import/no-unresolved
import { networkFromLabel, SOCIAL_ICON_SVGS } from '../../scripts/social-icons.js';

/*
 * contributors — a centered grid of person cards (WKND "Our Contributors" /
 * "WKND Guides"). Each card: circular avatar, name, role, and social icon links.
 *
 * Authored block: one row per person, cells in order:
 *   cell 0: avatar image (picture/img)
 *   cell 1: name              -> <h3>
 *   cell 2: role / title      -> role line
 *   cell 3: social links      -> icon links (Facebook / Twitter / Instagram, …)
 *
 * Social icons are derived from each link's LABEL text (shared
 * scripts/social-icons.js), never from the href — the placeholder-href icon bug
 * we already fixed in the footer and social-links.
 */

function buildSocial(cell) {
  const wrap = document.createElement('div');
  wrap.className = 'contributors-social';
  [...cell.querySelectorAll('a')].forEach((a) => {
    const label = a.textContent.trim() || a.getAttribute('aria-label') || '';
    const network = networkFromLabel(label);
    const link = document.createElement('a');
    link.href = a.getAttribute('href') || '#';
    link.className = 'contributors-social-link';
    link.setAttribute('aria-label', label || network || 'social');
    if (network) {
      link.classList.add(`contributors-social-${network}`);
      if (SOCIAL_ICON_SVGS[network]) link.innerHTML = SOCIAL_ICON_SVGS[network];
    } else {
      link.textContent = label;
    }
    wrap.append(link);
  });
  return wrap.children.length ? wrap : null;
}

export default function decorate(block) {
  const cards = [...block.children].map((row) => {
    const cells = [...row.children];
    const card = document.createElement('div');
    card.className = 'contributors-card';

    // avatar (first cell containing an image)
    const picCell = cells.find((c) => c.querySelector('picture, img'));
    if (picCell) {
      const avatar = document.createElement('div');
      avatar.className = 'contributors-avatar';
      const pic = picCell.querySelector('picture') || picCell.querySelector('img');
      avatar.append(pic);
      card.append(avatar);
    }

    // remaining text/social cells, in authored order (skipping the avatar cell)
    const rest = cells.filter((c) => c !== picCell);
    // name = first non-empty text cell; role = next; socials = cell with links
    const textCells = rest.filter((c) => !c.querySelector('a[href]') && c.textContent.trim());
    if (textCells[0]) {
      const name = document.createElement('h3');
      name.className = 'contributors-name';
      name.textContent = textCells[0].textContent.trim();
      card.append(name);
    }
    if (textCells[1]) {
      const role = document.createElement('p');
      role.className = 'contributors-role';
      role.textContent = textCells[1].textContent.trim();
      card.append(role);
    }

    const socialCell = rest.find((c) => c.querySelector('a[href]'));
    if (socialCell) {
      const social = buildSocial(socialCell);
      if (social) card.append(social);
    }

    return card;
  });

  block.textContent = '';
  cards.forEach((c) => block.append(c));
}
