/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: adventure-detail template cleanup.
 * 1. The WKND adventure content-fragment repeats the page title as an
 *    <h3 class="cmp-contentfragment__title"> inside the detail body — this
 *    duplicates the page <h1>. Remove those before parsing.
 * 2. The adventure key facts are a <dl class="cmp-contentfragment__elements">
 *    of label/value pairs. Convert it into an `adventure-meta` block table so
 *    it renders as a clean grid instead of a raw bulleted list.
 * 3. The "Share this Adventure" label is an <h5> in the source, which sits
 *    directly under the page <h1> and so skips h2–h4 (an a11y heading-order
 *    violation). Promote it to <h2> — the correct next level after the page
 *    title — and keep its small visual size via adventure-detail CSS.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // 1. Remove the duplicate content-fragment title(s) that echo the page H1.
    WebImporter.DOMUtils.remove(element, [
      'h3.cmp-contentfragment__title',
    ]);

    // 3. Promote the "Share this Adventure" h5 to h2 so heading levels don't
    //    jump h1 → h5. Match by text so it is robust to markup differences.
    element.querySelectorAll('h3, h4, h5, h6').forEach((h) => {
      if (!/^\s*share this adventure\s*$/i.test(h.textContent)) return;
      const h2 = document.createElement('h2');
      h2.innerHTML = h.innerHTML;
      h.replaceWith(h2);
    });

    // 2. Convert the adventure metadata definition list into an adventure-meta block.
    element.querySelectorAll('dl.cmp-contentfragment__elements').forEach((dl) => {
      const rows = [];
      dl.querySelectorAll('.cmp-contentfragment__element').forEach((el) => {
        const label = el.querySelector('.cmp-contentfragment__element-title');
        const value = el.querySelector('.cmp-contentfragment__element-value');
        if (!label) return;
        rows.push([
          label.textContent.trim(),
          value ? value.textContent.trim() : '',
        ]);
      });
      if (!rows.length) return;
      const block = WebImporter.Blocks.createBlock(document, {
        name: 'adventure-meta',
        cells: rows,
      });
      dl.replaceWith(block);
    });
  }
}
