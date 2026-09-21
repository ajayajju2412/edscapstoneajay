/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import adventuresListingTransformer from './transformers/wknd-adventures-listing.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY (blocks are synthesized by the transformer as tables)
const parsers = {};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'adventures-listing',
  description: 'Adventures category listing: intro teaser + index-driven adventures grid with a category filter',
  urls: ['https://wknd.site/us/en/adventures.html'],
  blocks: [],
  sections: [],
};

const transformers = [
  cleanupTransformer,
  adventuresListingTransformer,
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

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform (cleanup + synthesize columns-featured + adventures-filter)
    executeTransformers('beforeTransform', main, payload);

    // 2. afterTransform
    executeTransformers('afterTransform', main, payload);

    // 3. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 4. Generate sanitized path
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
        blocks: ['columns-featured', 'adventures-filter'],
      },
    }];
  },
};
