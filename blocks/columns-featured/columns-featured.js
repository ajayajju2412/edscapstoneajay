/*
 * columns-featured
 * Forked "columns" variant used for the homepage Featured Article promo:
 * an image column beside a text column (label + heading + body + CTA) on a
 * light card. Scoped entirely to its own .columns-featured class.
 */

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-featured-${cols.length}-cols`);

  // flag image-only columns so CSS can order/size them
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-featured-img-col');
        }
      }
    });
  });
}
