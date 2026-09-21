/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsParser from './parsers/cards.js';
import columnsFeaturedParser from './parsers/columns-featured.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import contentLandingTransformer from './transformers/wknd-content-landing.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  cards: cardsParser,
  'columns-featured': columnsFeaturedParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'content-landing',
  description: 'Editorial landing/index: intro header + featured teaser and index-driven card grid (magazine) or contributor person-card grids (about-us)',
  urls: ['https://wknd.site/us/en/magazine.html', 'https://wknd.site/us/en/about-us.html'],
  blocks: [
    { name: 'columns-featured', instances: ['.teaser.cmp-teaser--featured'] },
  ],
  sections: [],
};

// TRANSFORMER REGISTRY - cleanup + content-landing synthesis first, then sections
const transformers = [
  cleanupTransformer,
  contentLandingTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

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

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
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

    // 1. beforeTransform (cleanup + synthesize columns-featured / magazine-cards / contributors)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find remaining block elements (columns-featured is synthesized by the
    //    transformer as a table, so nothing here needs a parser on magazine; the
    //    registry is kept for robustness / future default-content blocks).
    const seen = new Set();
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE)
      .filter((b) => {
        if (seen.has(b.element)) return false;
        seen.add(b.element);
        return true;
      });

    // 3. Parse each block; skip elements already replaced by a prior parser/transformer
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      }
    });

    // 4. afterTransform
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
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
