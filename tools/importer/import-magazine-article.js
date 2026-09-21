/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import breadcrumbsParser from './parsers/breadcrumbs.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import magazineArticleTransformer from './transformers/wknd-magazine-article.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  breadcrumbs: breadcrumbsParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'magazine-article',
  description: 'Long-form article: hero image, breadcrumb, title + byline, flowing rich-text body with pull-quotes, author byline card and share links',
  urls: ['https://wknd.site/us/en/magazine/ski-touring.html'],
  blocks: [
    { name: 'breadcrumbs', instances: ['.breadcrumb.cmp-breadcrumb--fixed', '.breadcrumb .cmp-breadcrumb', 'nav.cmp-breadcrumb'] },
  ],
  sections: [],
};

// TRANSFORMER REGISTRY - cleanup + magazine synthesis first, then section breaks
const transformers = [
  cleanupTransformer,
  magazineArticleTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
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
      elements.forEach((element) => {
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

    // 1. beforeTransform (cleanup + synthesize writer-details/social-links/quote)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page (dedupe elements matched by multiple selectors)
    const seen = new Set();
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE)
      .filter((b) => {
        if (seen.has(b.element)) return false;
        seen.add(b.element);
        return true;
      });

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
