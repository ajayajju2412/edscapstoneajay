/*
 * members-only — locked "Members Only" teaser grid for the magazine landing.
 * Matches wknd's gated teaser: a vertical card with a yellow flag-shaped lock
 * badge overlapping the title, the serif title, a grey tagline, a grey
 * "Read More" button, and a full-width article image at the bottom.
 *
 * Authored block: one row per locked teaser, cells in order:
 *   cell 0: article image (picture/img)
 *   cell 1: title            -> <h3> (with lock badge)
 *   cell 2: tagline          -> grey uppercase line
 *   cell 3: cta label        -> "Read More" button (gated content)
 */

export default function decorate(block) {
  const cards = [...block.children].map((row) => {
    const cells = [...row.children];
    const card = document.createElement('div');
    card.className = 'members-only-card';

    const picCell = cells.find((c) => c.querySelector('picture, img'));
    const rest = cells.filter((c) => c !== picCell);
    const textCells = rest.filter((c) => c.textContent.trim());

    // title row = yellow lock badge overlapping the serif title
    if (textCells[0]) {
      const titleRow = document.createElement('div');
      titleRow.className = 'members-only-titlerow';

      const lock = document.createElement('span');
      lock.className = 'members-only-lock';
      lock.setAttribute('aria-hidden', 'true');

      const h3 = document.createElement('h3');
      h3.className = 'members-only-title';
      h3.textContent = textCells[0].textContent.trim();

      titleRow.append(lock, h3);
      card.append(titleRow);
    }

    // tagline = second text cell (if it isn't the CTA)
    if (textCells[1] && !/^read more$/i.test(textCells[1].textContent.trim())) {
      const p = document.createElement('p');
      p.className = 'members-only-tagline';
      p.textContent = textCells[1].textContent.trim();
      card.append(p);
    }

    // "Read More" — content is gated behind sign-in, so it's a non-actionable
    // label styled as wknd's grey button
    const cta = document.createElement('span');
    cta.className = 'members-only-cta';
    cta.setAttribute('aria-disabled', 'true');
    cta.textContent = 'Read More';
    card.append(cta);

    // article image sits at the bottom of the card (full card width)
    if (picCell) {
      const media = document.createElement('div');
      media.className = 'members-only-media';
      const pic = picCell.querySelector('picture') || picCell.querySelector('img');
      media.append(pic);
      card.append(media);
    }

    return card;
  });

  block.textContent = '';
  cards.forEach((c) => block.append(c));
}
