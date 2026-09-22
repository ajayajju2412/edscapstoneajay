/*
 * members-only — locked "Members Only" teaser grid for the magazine landing.
 * Two-column grid of gated article teasers: a thumbnail with a lock badge, a
 * title, a tagline, and a disabled "Read More" affordance (content is behind
 * sign-in on the source, so the CTA is non-functional/muted by design).
 *
 * Authored block: one row per locked teaser, cells in order:
 *   cell 0: thumbnail image (picture/img)
 *   cell 1: title            -> <h3>
 *   cell 2: tagline          -> muted line
 *   cell 3: cta label        -> disabled "Read More" button (text only)
 */

export default function decorate(block) {
  const cards = [...block.children].map((row) => {
    const cells = [...row.children];
    const card = document.createElement('div');
    card.className = 'members-only-card';

    const picCell = cells.find((c) => c.querySelector('picture, img'));
    if (picCell) {
      const media = document.createElement('div');
      media.className = 'members-only-media';
      const pic = picCell.querySelector('picture') || picCell.querySelector('img');
      media.append(pic);
      // lock badge overlay (source shows a lock on each gated thumbnail)
      const lock = document.createElement('span');
      lock.className = 'members-only-lock';
      lock.setAttribute('aria-hidden', 'true');
      media.append(lock);
      card.append(media);
    }

    const rest = cells.filter((c) => c !== picCell);
    const textCells = rest.filter((c) => c.textContent.trim());
    // title = first text cell
    if (textCells[0]) {
      const h3 = document.createElement('h3');
      h3.className = 'members-only-title';
      h3.textContent = textCells[0].textContent.trim();
      card.append(h3);
    }
    // tagline = second text cell (if it isn't the CTA)
    if (textCells[1] && !/^read more$/i.test(textCells[1].textContent.trim())) {
      const p = document.createElement('p');
      p.className = 'members-only-tagline';
      p.textContent = textCells[1].textContent.trim();
      card.append(p);
    }
    // disabled "Read More" — the content is gated, so it's a non-actionable label
    const cta = document.createElement('span');
    cta.className = 'members-only-cta';
    cta.setAttribute('aria-disabled', 'true');
    cta.textContent = 'Read More';
    card.append(cta);

    return card;
  });

  block.textContent = '';
  cards.forEach((c) => block.append(c));
}
