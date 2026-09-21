/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 * Removes non-authorable site chrome so the import contains only page-level
 * authorable content. Every selector below is verified against
 * migration-work/cleaned.html for the WKND homepage.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Mobile nav trigger + overlay (cleaned.html lines 568, 574) and the
    // Adobe demdex ID-syncing iframe (line 566) — remove before parsing so
    // they cannot interfere with block matching.
    WebImporter.DOMUtils.remove(element, [
      '#toggleNav',
      '#mobileNav',
      'iframe#destination_publishing_iframe_wkndsite_0',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome: header experience fragment (line 5) and
    // footer experience fragment (line 471). These wrap the utility nav,
    // language navigation, sign-in buttons, logo, main nav, search and the
    // footer nav/social/copyright — none of which authors create per page.
    WebImporter.DOMUtils.remove(element, [
      'header.cmp-experiencefragment--header',
      'footer.cmp-experiencefragment--footer',
      'iframe',
      'meta',
      'link',
      'noscript',
    ]);
  }
}
