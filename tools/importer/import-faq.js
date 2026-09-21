/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import faqTransformer from './transformers/wknd-faq.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY (accordion + columns are synthesized by the transformer)
const parsers = {};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'faq',
  description: 'FAQ page: two columns — intro + accordion of Q&A (main) and a contact/help sidebar',
  urls: ['https://wknd.site/us/en/faqs.html'],
  blocks: [],
  sections: [],
};

const transformers = [
  cleanupTransformer,
  faqTransformer,
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

    // 1. beforeTransform (cleanup + synthesize columns(faq) + accordion)
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
        blocks: ['columns', 'accordion'],
      },
    }];
  },
};
