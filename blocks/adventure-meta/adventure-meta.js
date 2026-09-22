/*
 * adventure-meta
 * A compact label/value grid for an adventure's key facts (Activity,
 * Adventure Type, Trip Length, Group Size, Difficulty, Price). Each row of the
 * authored block is one pair: cell 0 = label, cell 1 = value.
 */

export default function decorate(block) {
  const dl = document.createElement('dl');
  dl.className = 'adventure-meta-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const label = cells[0];
    const value = cells[1];
    if (!label) return;

    // wknd groups each label+value as one item (value stacked under label) with
    // a left accent border; wrap the pair so the border/spacing applies per item
    const item = document.createElement('div');
    item.className = 'adventure-meta-item';

    const dt = document.createElement('dt');
    dt.className = 'adventure-meta-label';
    dt.append(...label.childNodes);

    const dd = document.createElement('dd');
    dd.className = 'adventure-meta-value';
    if (value) dd.append(...value.childNodes);

    item.append(dt, dd);
    dl.append(item);
  });

  block.textContent = '';
  block.append(dl);
}
