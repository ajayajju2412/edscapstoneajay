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
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // 1. Remove the duplicate content-fragment title(s) that echo the page H1.
    WebImporter.DOMUtils.remove(element, [
      'h3.cmp-contentfragment__title',
    ]);

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
