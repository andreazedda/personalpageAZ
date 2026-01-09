# Dossier Migration Notes

This repo is a static, progressive-enhancement site.

- Fallback HTML lives in `index.html` (readable without JS).
- The canonical content source is `data/profile.json`.
- Hydration/rendering lives in `js/profile.js`.

## What changed

### Files changed

- `index.html`
  - Added a **Reading Contract** banner and a **DOCUMENT INDEX**.
  - Introduced explicit semantic grouping into two layers:
    - **NOTE** (principles/methods)
    - **EVIDENCE** (verifiable facts)
  - Reintroduced all existing section containers (Focus, Education, Capabilities, Toolbox, Projects, Examples, Proof, Reading, Courses, Contact) under the new IA so no information is lost.

- `data/profile.json`
  - Added schema fields for dossier requirements (see below).
  - Added i18n keys for new navigation and dossier UI.

- `js/profile.js`
  - Added renderers for the new dossier sections (contexts + reading-by-domain).
  - Updated Projects rendering to show **Technical Spec Cards** (`projects[].spec`).
  - Fixed a common render bug causing `[object Object]` for contained project taglines.
  - Added a lightweight console validation (`validateProfileData`) to catch missing/invalid structures.

- `tools/validate_profile_json.py`
  - Adds a strict JSON + basic schema check for `data/profile.json`.

- `css/custom.css`
  - Added minimal styles for the dossier banner, sticky index, contexts cards, and project spec block.

## Schema changes (additions)

### Dossier UI / i18n

Under `i18n.en` and `i18n.it`:

- `nav.index`, `nav.note`, `nav.evidence`
- `contract.title`, `contract.text`, `contract.subtext`
- `index.*` keys for the Document Index anchor labels
- `note.*` and `evidence.*` section headings
- `contexts.*` section labels
- `projects.spec.*` labels for the Technical Spec Card
- `reading.domainTitle`, `reading.why`

### Operational & Research Contexts

New top-level object:

```json
"contexts": {
  "disclaimer": {"en": "...", "it": "..."},
  "direct_work": ["..."],
  "operational_exposure": ["..."]
}
```

### Project Technical Spec Card

Each project in `projects[]` now supports an optional `spec` block:

```json
"spec": {
  "status": "prototype|production|concept",
  "boundary": {"en": "...", "it": "..."},
  "purpose": {"en": "...", "it": "..."},
  "inputs": [{"en": "...", "it": "..."}],
  "outputs": [{"en": "...", "it": "..."}],
  "reuse": [{"en": "...", "it": "..."}],
  "constraints": [{"en": "...", "it": "..."}],
  "current_focus": [{"en": "...", "it": "..."}]
}
```

The old fields (`purpose`, `whatIBuild`, `outputs`, etc.) are still present and still rendered (no information loss).

### Reading by domain

`reading.domains[]` was added:

```json
"reading": {
  "domains": [
    {
      "domain": {"en": "Causality", "it": "Causalità"},
      "books": [
        {
          "title": "...",
          "author": "...",
          "status": "reading|completed",
          "topic_tags": ["..."],
          "why_it_matters": {"en": "...", "it": "..."}
        }
      ]
    }
  ],
  "now_reading": [ ... ],
  "completed": [ ... ]
}
```

Renderer priority:
1) `reading.domains` (preferred)
2) Legacy `reading.now_reading` + `reading.completed`

## How to add new entries

### Add a new container/project

1) Edit `data/profile.json` → `projects[]`.
2) Add a new object with a unique `id`.
3) Include `spec` with the standardized fields.
4) Optional:
   - `links[]` (only add real URLs; keep `url: null` if private)
   - `contained[]` for sub-projects (use localized objects for `tagline` if needed)

### Add a new context entry

- Add strings to:
  - `contexts.direct_work[]` or
  - `contexts.operational_exposure[]`

### Add a new book

1) Choose a domain in `reading.domains[]`.
2) Add a `books[]` entry with:
   - `title`, `author`
   - `status` (`reading` or `completed`)
   - `why_it_matters` (one line)

## Notes / constraints

- No analytics, cookies, or heavy dependencies were added.
- All new rendering is plain JS and keeps progressive enhancement intact.

## Quick validation

Run locally before pushing:

- `python tools/validate_profile_json.py`
