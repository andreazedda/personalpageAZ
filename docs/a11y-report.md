# Accessibility Interaction Report

The following inventory documents all focusable controls on the rebuilt single-page experience, including their accessible names, roles, and state behaviors verified via keyboard navigation.

| Location | Element / Selector | Role | Accessible name | State handling |
| --- | --- | --- | --- | --- |
| Global header | `#logo` brand link | Link | “Andrea Zedda” (link text) | Receives focus-visible outline; navigates to top of page. |
| Global header | `.navbar-toggle` button | Button | “Open menu” (aria-label) | `aria-expanded` toggles between `true`/`false` and focus ring persists while menu is open. |
| Global header | Primary navigation links | Link | Visible text (e.g., “Home”, “Services”) | Smooth scroll to corresponding section; focus outline visible. |
| Hero section | `.btn.btn-primary` CTA | Link styled as button | “Work with me” (link text) | Focus ring + hover state in accent color; targets contact section. |
| Hero section | `.scroll-down` control | Button | “Scroll to the next section” (aria-label) | Keyboard activated; triggers smooth scroll to `#slide02`, retains focus styling. |
| About / Services / Projects | Cards and content | — | — | Informational content only (no hidden interactive controls). |
| Contact section | `#ajax-contact input#name` | Textbox | “Name” (`<label>` text) | Required attribute enforced; focus outline visible. |
| Contact section | `#ajax-contact input#email` | Textbox | “Email” (`<label>` text) | Required attribute enforced; focus outline visible. |
| Contact section | `#ajax-contact textarea#message` | Textbox | “How can I help?” (`<label>` text) | Required attribute enforced; resizable with consistent focus styling. |
| Contact section | Submit button | Button | “Submit” (button text) | Primary accent styling and focus outline. |
| Contact status | `#form-messages` | Status region | n/a (`role="status"`) | Announces success/error messages with polite live updates and remains in DOM. |
| Site footer | Social icon links | Link | `aria-label` values (“Facebook”, “Twitter”, “LinkedIn”, “Instagram”) | Include visually hidden text mirror for redundancy; focus outline visible. |

## Keyboard traversal summary
- Tab order follows document source from branding link through footer, matching visual layout.
- `:focus-visible` styling uses a 2px accent outline plus box-shadow for all interactive elements, ensuring WCAG 2.4.7 compliance.
- No custom keyboard traps or inactive elements are present; the custom toggle script updates `aria-expanded` as the navigation opens or closes.

## Live regions and reduced motion
- Form submission feedback is surfaced through `#form-messages` with `role="status" aria-live="polite" aria-atomic="true"` to satisfy WCAG 4.1.3.
- Motion-sensitive users benefit from the `prefers-reduced-motion` guard in `js/custom.js`, which disables smooth-scroll easing and data-animate transitions when reduction is requested.

