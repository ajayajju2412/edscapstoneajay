/*
 * Shared social-network helpers.
 *
 * Both the footer's "Follow Us" links and the magazine social-links share block
 * derive their icon from the link's visible LABEL text, never from the href —
 * authored share links use placeholder hrefs ("/" or "#"), so href-substring
 * matching silently fails to render any icon (a real bug we already hit once in
 * the footer). Keeping this logic in one place means the fix can't regress in
 * only one of the two blocks.
 */

export const SOCIAL_NETWORKS = [
  'facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'pinterest', 'tiktok',
];

/**
 * Resolve a social network name from a link's label text.
 * @param {string} label visible text of the link (e.g. "Facebook", "instagram")
 * @returns {string|null} network key from SOCIAL_NETWORKS, or null if none match
 */
export function networkFromLabel(label) {
  const text = (label || '').trim().toLowerCase();
  return SOCIAL_NETWORKS.find((n) => text.includes(n)) || null;
}

/*
 * Inline SVG glyphs per network. Each icon carries its OWN fill/stroke presentation
 * attributes so it renders correctly without any CSS help:
 *   - solid glyphs (facebook, twitter, …) set fill="currentColor" on the <svg>
 *   - instagram is an OUTLINE glyph: fill="none" stroke="currentColor" so the
 *     rounded-square + lens render hollow (its lens dot re-enables fill locally).
 *
 * IMPORTANT: do NOT add a blanket `svg { fill: currentcolor }` rule in block CSS.
 * A CSS fill always wins over an SVG's own presentation attributes, so it would
 * force-fill instagram's outline shapes solid and erase the camera glyph. Keep
 * the fill decision here, per-icon, where it can be correct for both styles.
 *
 * Used by social-links / contributors where the icon sits inline (currentColor
 * inherits the link's color). The footer renders its icons as CSS background
 * images instead, so it only needs networkFromLabel above.
 */
export const SOCIAL_ICON_SVGS = {
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M23 4.9c-.8.35-1.7.6-2.6.7a4.5 4.5 0 0 0 2-2.5c-.9.5-1.9.9-2.9 1.1a4.5 4.5 0 0 0-7.7 4.1A12.8 12.8 0 0 1 2.5 3.6a4.5 4.5 0 0 0 1.4 6 4.4 4.4 0 0 1-2-.6v.06a4.5 4.5 0 0 0 3.6 4.4 4.5 4.5 0 0 1-2 .08 4.5 4.5 0 0 0 4.2 3.1A9 9 0 0 1 1 18.6a12.7 12.7 0 0 0 6.9 2c8.3 0 12.8-6.9 12.8-12.8v-.6c.9-.6 1.6-1.4 2.3-2.3z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M23 7.5a3 3 0 0 0-2.1-2.1C19 4.9 12 4.9 12 4.9s-7 0-8.9.5A3 3 0 0 0 1 7.5 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.5a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23.5 12 31 31 0 0 0 23 7.5zM9.75 15.5v-7l6 3.5z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05a4.2 4.2 0 0 1 3.75-2.06c4 0 4.75 2.64 4.75 6.07V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9z"/></svg>',
  pinterest: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2a10 10 0 0 0-3.65 19.31c-.09-.8-.17-2.04.03-2.92l1.18-5s-.3-.6-.3-1.5c0-1.4.82-2.45 1.83-2.45.86 0 1.28.65 1.28 1.42 0 .87-.55 2.17-.84 3.38-.24 1 .5 1.84 1.5 1.84 1.8 0 3.19-1.9 3.19-4.65 0-2.43-1.75-4.13-4.24-4.13-2.89 0-4.59 2.17-4.59 4.4 0 .87.34 1.81.76 2.32a.3.3 0 0 1 .07.29l-.28 1.15c-.05.19-.15.23-.35.14-1.3-.6-2.11-2.5-2.11-4.02 0-3.28 2.38-6.29 6.87-6.29 3.61 0 6.41 2.57 6.41 6.01 0 3.58-2.26 6.47-5.4 6.47-1.05 0-2.04-.55-2.38-1.2l-.65 2.46c-.23.9-.86 2.04-1.29 2.73A10 10 0 1 0 12 2z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M16.5 3c.3 2 1.5 3.6 3.5 3.9V10c-1.3 0-2.5-.4-3.5-1.1v6.4a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.06v3.2a2.6 2.6 0 1 0 1.8 2.5V3z"/></svg>',
};
