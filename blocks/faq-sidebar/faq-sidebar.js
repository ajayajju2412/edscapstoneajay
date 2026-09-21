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
}
