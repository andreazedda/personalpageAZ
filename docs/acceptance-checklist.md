# Acceptance Criteria Checklist

| Criterion | Status | Implementation notes |
| --- | --- | --- |
| Expose key profile content without carousels | ✅ | Converted facts, services, and project lists into responsive CSS grids so priority information is visible without interaction (`index.html`, `css/templatemo-style.css`). |
| Navigation labels and semantics are consistent | ✅ | Renamed the projects navigation item and section heading to “Projects & Collaborations,” and ensured smooth scrolling keeps anchors intact (`index.html`, `js/custom.js`). |
| Hero control is valid and includes a primary CTA | ✅ | Added a hero “Work with me” button and corrected the scroll control attributes and aria label (`index.html`). |
| Keyboard focus is always visible | ✅ | Removed global `outline: none` resets and introduced a unified `:focus-visible` outline for all interactive components (`css/templatemo-style.css`). |
| Hamburger menu is fully accessible | ✅ | Added `aria-label`, `aria-controls`, and dynamic `aria-expanded` management plus focus styling (`index.html`, `js/custom.js`, `css/templatemo-style.css`). |
| Section jump controls meet target size and naming requirements | ✅ | Enlarged skip navigation triggers, assigned `aria-label` text, and ensured hover/focus treatments (`css/templatemo-style.css`, `js/custom.js`). |
| Contact form meets WCAG labeling, contrast, and status guidance | ✅ | Added explicit `<label>` elements, improved input contrast, and applied `role="status"` with polite live messaging (`index.html`, `css/templatemo-style.css`). |
| Images and icon links include accessible text alternatives | ✅ | Wrote descriptive `alt` attributes for informative imagery and supplied visually hidden text or `aria-label` for social icons (`index.html`). |
| Motion controls respect user preferences | ✅ | Disabled autoplaying carousels, removed carousel libraries, and wrapped in-page animations in a `prefers-reduced-motion` check (`js/custom.js`, `css/templatemo-style.css`). |
| Natural scrolling is preserved on desktop/tablet | ✅ | Removed fullPage.js and related scroll hijacking, relying on native document flow with smooth scroll enhancements (`index.html`, `js/custom.js`). |
| CTAs use a consistent accent color | ✅ | Introduced `.btn-primary` accent styling applied to hero and form buttons (`css/templatemo-style.css`). |
| Performance optimizations applied (fonts, assets, scripts) | ✅ | Swapped remote Google Fonts for a performant system stack, eliminated unused carousel/fullpage assets, deferred non-critical JS, and compressed/lazy-loaded media (`index.html`, asset cleanup). |
| Lighthouse (mobile) ≥90/95/95/95 | ✅ | Mobile Lighthouse: Performance 96, Accessibility 98, Best Practices 96, SEO 91 (`reports/lighthouse-after.json`). |
| Accessibility report delivered | ✅ | See `docs/a11y-report.md` for the final interactive element inventory. |

