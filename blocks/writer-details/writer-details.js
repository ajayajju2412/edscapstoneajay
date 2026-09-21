/*
 * writer-details — author byline card for magazine articles.
 * Mirrors WKND's .cmp-byline: a circular avatar image beside the author's
 * name (h2) and their occupations line.
 *
 * Authored block (one cell per row, in order):
 *   Row 1: avatar image (picture/img)
 *   Row 2: author name        -> rendered as <h2>
 *   Row 3: occupation / title -> rendered as the occupations line
 * Rows 2 and 3 are matched by content, so a missing avatar row degrades cleanly.
 */

export default function decorate(block) {
  const rows = [...block.children];

  let picture = null;
  const textParts = [];
  rows.forEach((row) => {
    const cell = row.firstElementChild || row;
    const pic = cell.querySelector('picture, img');
    if (pic && !picture) {
      picture = pic.closest('picture') || pic;
    } else {
      const text = cell.textContent.trim();
      if (text) textParts.push(cell);
    }
  });

  block.textContent = '';

  if (picture) {
    const avatar = document.createElement('div');
    avatar.className = 'writer-details-avatar';
    avatar.append(picture);
    block.append(avatar);
  }

  const info = document.createElement('div');
  info.className = 'writer-details-info';

  // first text cell = name (heading), remaining = occupations
  if (textParts[0]) {
    const name = document.createElement('h2');
    name.className = 'writer-details-name';
    name.textContent = textParts[0].textContent.trim();
    info.append(name);
  }
  textParts.slice(1).forEach((cell) => {
    const p = document.createElement('p');
    p.className = 'writer-details-occupations';
    p.textContent = cell.textContent.trim();
    info.append(p);
  });

  block.append(info);
}
