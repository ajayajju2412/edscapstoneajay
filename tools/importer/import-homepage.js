/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselParser from './parsers/carousel.js';
import columnsFeaturedParser from './parsers/columns-featured.js';
import cardsParser from './parsers/cards.js';
import heroParser from './parsers/hero.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import homepageTransformer from './transformers/wknd-homepage.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  carousel: carouselParser,
  'columns-featured': columnsFeaturedParser,
  cards: cardsParser,
  hero: heroParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Site landing page: full-width hero banner followed by stacked feature/teaser sections linking into the main content areas',
  urls: ['https://wknd.site/us/en.html'],
  blocks: [
    { name: 'carousel', instances: ['.carousel.cmp-carousel--hero'] },
    { name: 'columns-featured', instances: ['.teaser.cmp-teaser--featured'] },
    { name: 'cards', instances: ['.image-list.list'] },
    { name: 'hero', instances: ['.teaser.cmp-teaser--hero.cmp-teaser--imagebottom'] },
  ],
  sections: [
    { id: 's1', name: 'hero-carousel', selector: ['.carousel.cmp-carousel--hero'], style: null, blocks: ['carousel'], defaultContent: [] },
    { id: 's2', name: 'featured-article', selector: ['.teaser.cmp-teaser--featured'], style: 'light-grey', blocks: ['columns-featured'], defaultContent: [] },
    { id: 's3', name: 'recent-articles', selector: ['.cmp-layout-container--fixed:nth-of-type(1) .image-list.list', '.image-list.list'], style: null, blocks: ['cards'], defaultContent: ['.title.cmp-title--underline', '.separator'] },
    { id: 's4', name: 'next-adventures', selector: ['.teaser.cmp-teaser--hero.cmp-teaser--imagebottom'], style: null, blocks: ['hero'], defaultContent: ['.title.cmp-title--underline'] },
    { id: 's5', name: 'destinations', selector: ['.cmp-layout-container--fixed:nth-of-type(2) .image-list.list', '.image-list.list'], style: null, blocks: ['cards'], defaultContent: ['.title.cmp-title--underline', '.separator'] },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, then section breaks/metadata, THEN the
// homepage rail swap. sectionsTransformer must run before homepageTransformer:
// it anchors section breaks to the static .image-list.list elements, which the
// homepage transformer then replaces with index-driven blocks. If the swap ran
// first, those selectors would be gone and the sections would merge into one.
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  homepageTransformer,
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already replaced by a prior parser
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path (map root/homepage URL to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
