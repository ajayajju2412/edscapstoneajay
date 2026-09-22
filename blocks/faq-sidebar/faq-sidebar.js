/*
 * faq-sidebar — the "Need more help?" contact box beside the FAQ accordion.
 * Content-only block (heading + contact paragraph); layout/placement in the
 * two-column FAQ grid comes from the `.section.faq` rules in styles.css.
 * Unwraps the single authored cell so its children sit directly in the block.
 */
export default function decorate(block) {
  const cell = block.querySelector(':scope > div > div');
  if (cell) {
    block.textContent = '';
    while (cell.firstChild) block.append(cell.firstChild);
  }

  // "Need more help?" is a label for this contact box, not part of the page's
  // document outline. As a heading it skips levels (page h1 → sidebar h3),
  // failing heading-order. Demote to a styled <p>.
  block.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    const p = document.createElement('p');
    p.className = 'faq-sidebar-label';
    p.innerHTML = h.innerHTML;
    h.replaceWith(p);
  });
}
