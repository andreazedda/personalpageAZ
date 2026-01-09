/**
 * Profile Data Renderer
 * Loads profile.json and populates sections with data-driven content
 * Progressive enhancement: works with fallback HTML if JSON fails
 */

(function() {
  'use strict';

  const DATA_URL = 'data/profile.json';
  const SUPPORTED_LANGS = ['en', 'it'];
  const DEFAULT_LANG = 'en';
  const LANG_STORAGE_KEY = 'personalpageAZ.lang';

  let profileData = null;
  let currentLang = DEFAULT_LANG;

  function normalizeLang(value) {
    const raw = String(value || '').toLowerCase();
    if (!raw) return null;
    const short = raw.split('-')[0];
    return SUPPORTED_LANGS.includes(short) ? short : null;
  }

  function getLangFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      return normalizeLang(params.get('lang'));
    } catch (_) {
      return null;
    }
  }

  function setLangInUrl(lang) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url.toString());
    } catch (_) {
      // no-op
    }
  }

  function resolveInitialLang() {
    const fromUrl = getLangFromUrl();
    if (fromUrl) return fromUrl;

    try {
      const fromStorage = normalizeLang(window.localStorage.getItem(LANG_STORAGE_KEY));
      if (fromStorage) return fromStorage;
    } catch (_) {
      // no-op
    }

    const fromBrowser = normalizeLang(navigator.language || navigator.userLanguage);
    return fromBrowser || DEFAULT_LANG;
  }

  function saveLang(lang) {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (_) {
      // no-op
    }
  }

  function setDocumentLang(lang) {
    try {
      document.documentElement.lang = lang;
    } catch (_) {
      // no-op
    }
  }

  function t(value) {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      const localized = value[currentLang] ?? value[DEFAULT_LANG];
      if (localized == null) return '';
      return String(localized);
    }
    return String(value);
  }

  function tList(list) {
    return (Array.isArray(list) ? list : []).map(item => t(item)).filter(Boolean);
  }

  function normalizeExternalUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) return '';

    // Common user input: "www.example.com" -> "https://www.example.com"
    const withScheme = /^https?:\/\//i.test(raw)
      ? raw
      : (raw.startsWith('www.') ? `https://${raw}` : raw);

    try {
      const parsed = new URL(withScheme);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
      return parsed.toString();
    } catch (_) {
      return '';
    }
  }

  function ui(key, fallback) {
    const table = profileData && profileData.i18n && profileData.i18n[currentLang];
    if (table && typeof table === 'object' && table[key] != null) return String(table[key]);
    return fallback;
  }

  function applyI18nToDom() {
    if (!profileData || !profileData.i18n) return;

    const nodes = document.querySelectorAll('[data-i18n]');
    nodes.forEach(node => {
      const key = node.getAttribute('data-i18n');
      if (!key) return;
      const text = ui(key, null);
      if (text == null) return;
      node.textContent = text;
    });

    const langLinks = document.querySelectorAll('.lang-switch [data-lang]');
    langLinks.forEach(link => {
      const lang = normalizeLang(link.getAttribute('data-lang'));
      if (!lang) return;
      if (lang === currentLang) link.classList.add('active');
      else link.classList.remove('active');
    });
  }

  function initLanguage() {
    currentLang = resolveInitialLang();
    setDocumentLang(currentLang);
    setLangInUrl(currentLang);
    saveLang(currentLang);

    document.addEventListener('click', (e) => {
      const target = e.target && e.target.closest ? e.target.closest('[data-lang]') : null;
      if (!target) return;
      const lang = normalizeLang(target.getAttribute('data-lang'));
      if (!lang || lang === currentLang) return;
      e.preventDefault();

      currentLang = lang;
      setDocumentLang(currentLang);
      setLangInUrl(currentLang);
      saveLang(currentLang);
      applyI18nToDom();
      if (profileData) renderAll();
    }, { passive: false });
  }

  function initDiscoveryProgress() {
    const progress = document.getElementById('discovery-progress');
    if (!progress) return;

    const textNode = document.getElementById('discovery-progress-text');
    const fillNode = document.getElementById('discovery-progress-fill');

    const steps = Array.from(document.querySelectorAll('details.discovery-step'));
    if (!steps.length) {
      if (textNode) textNode.textContent = '0/0';
      if (fillNode) fillNode.style.width = '0%';
      return;
    }

    const levelForPct = (pct) => {
      if (pct >= 0.95) return 5;
      if (pct >= 0.75) return 4;
      if (pct >= 0.5) return 3;
      if (pct >= 0.25) return 2;
      return 1;
    };

    const update = () => {
      const opened = steps.filter(s => s.open).length;
      const total = steps.length;
      const pct = total ? (opened / total) : 0;
      const width = `${Math.round(pct * 100)}%`;

      if (fillNode) fillNode.style.width = width;

      const label = ui('discovery.progress', 'Knowledge');
      const levelLabel = ui('discovery.level', 'Level');
      const level = levelForPct(pct);

      if (textNode) {
        textNode.textContent = `${label}: ${opened}/${total} • ${levelLabel} ${level}/5`;
      }
    };

    steps.forEach(step => {
      step.addEventListener('toggle', update);
    });

    update();
  }

  /**
   * Initialize profile rendering
   */
  function init() {
    initLanguage();
    initDiscoveryProgress();
    loadProfileData()
      .then(data => {
        profileData = data;
        validateProfileData(profileData);
        applyI18nToDom();
        renderAll();
        initDiscoveryProgress();
      })
      .catch(err => {
        console.error('Profile data loading failed, using fallback HTML:', err);
        showLocalPreviewWarning(err);
      });
  }

  function validateProfileData(data) {
    try {
      if (!data || typeof data !== 'object') return;

      const warn = (msg) => console.warn(`[profile.json] ${msg}`);

      if (!data.person) warn('Missing person');
      if (!data.i18n) warn('Missing i18n');

      if (!Array.isArray(data.projects)) warn('Missing projects[]');
      if (Array.isArray(data.projects)) {
        data.projects.forEach(p => {
          if (!p || !p.id) warn('Project missing id');
          if (!p || !p.name) warn(`Project ${p && p.id ? p.id : '(unknown)'} missing name`);
          if (p && p.contained && !Array.isArray(p.contained)) warn(`Project ${p.id} contained should be an array`);
        });
      }

      if (data.reading) {
        const hasDomains = Array.isArray(data.reading.domains);
        const hasLegacy = Array.isArray(data.reading.now_reading) || Array.isArray(data.reading.completed);
        if (!hasDomains && !hasLegacy) warn('Reading has neither domains[] nor legacy now_reading/completed lists');
      }
    } catch (_) {
      // no-op
    }
  }

  function showLocalPreviewWarning(err) {
    try {
      const isFileProtocol = window.location && window.location.protocol === 'file:';
      if (!isFileProtocol) return;

      if (document.getElementById('data-load-warning')) return;

      const banner = document.createElement('div');
      banner.id = 'data-load-warning';
      banner.setAttribute('role', 'status');
      banner.style.cssText = [
        'position:fixed',
        'left:12px',
        'right:12px',
        'bottom:12px',
        'z-index:3000',
        'padding:12px 14px',
        'border-radius:12px',
        'border:1px solid rgba(255,255,255,0.16)',
        'background:rgba(11,15,20,0.92)',
        'backdrop-filter:saturate(1.2) blur(10px)',
        'color:#e5e7eb',
        'font:14px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
      ].join(';');

      const details = (err && err.message) ? String(err.message) : 'blocked';

      banner.innerHTML = `
        <strong style="color:#d4af37">Local preview note:</strong>
        Your browser is blocking <code style="color:#c8d0da">data/profile.json</code> because this page is opened via <code style="color:#c8d0da">file://</code>.
        You are seeing fallback HTML only.
        <span style="display:block;margin-top:6px;color:#a7b0bb">
          Fix: run a local server in this folder, e.g. <code style="color:#c8d0da">python -m http.server 8000</code>
          then open <code style="color:#c8d0da">http://localhost:8000</code>.
          (${details})
        </span>
      `;

      document.body.appendChild(banner);
    } catch (_) {
      // no-op
    }
  }

  /**
   * Load profile data from JSON
   */
  function loadProfileData() {
    return fetch(DATA_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      });
  }

  /**
   * Render all sections
   */
  function renderAll() {
    if (!profileData) return;

    applyI18nToDom();
    
    renderHero();
    renderFocusNow();
    renderEducation();
    renderBackground();
    renderCollaborators();
    renderOperatingSystem();
    renderCollaborationModes();
    renderServices();
    renderContexts();
    renderProjects();
    renderProjectExamples();
    renderToolbox();
    renderProofs();
    renderFuturePlans();
    renderReading();
    renderCourses();
    renderContact();
    initCopyEmail();
  }

  /**
   * Render Operational & Research Contexts (Evidence)
   */
  function renderContexts() {
    const container = document.getElementById('contexts-content');
    if (!container || !profileData || !profileData.contexts) return;

    const direct = Array.isArray(profileData.contexts.direct_work) ? profileData.contexts.direct_work : [];
    const exposure = Array.isArray(profileData.contexts.operational_exposure) ? profileData.contexts.operational_exposure : [];
    const logos = profileData.contexts && profileData.contexts.logos && typeof profileData.contexts.logos === 'object'
      ? profileData.contexts.logos
      : {};

    const renderContextItem = (value) => {
      const name = t(value);
      const logo = value != null && logos[value] ? String(logos[value]) : '';
      const logoHtml = logo
        ? `<img class="context-logo" src="${logo}" alt="${name} logo" loading="lazy" decoding="async" />`
        : '';
      return `<li class="context-item">${logoHtml}<span class="context-name">${name}</span></li>`;
    };

    if (!direct.length && !exposure.length) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="contexts-grid">
        <div class="context-card">
          <h4>${ui('contexts.directWork', 'DIRECT WORK')}</h4>
          <ul>
            ${direct.map(renderContextItem).join('')}
          </ul>
        </div>
        <div class="context-card">
          <h4>${ui('contexts.exposure', 'OPERATIONAL EXPOSURE')}</h4>
          <ul>
            ${exposure.map(renderContextItem).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Render Project Examples section (concrete builds, separate from containers)
   */
  function renderProjectExamples() {
    const container = document.getElementById('project-examples-grid');
    if (!container) return;

    const explicitItems = Array.isArray(profileData.projectExamples) ? profileData.projectExamples : [];

    const projectAnchorId = (project) => {
      const base = project && project.id ? String(project.id) : String((project && project.name) || 'project');
      return `project-${base}`.toLowerCase().replace(/\s+/g, '-');
    };

    const derivedItems = (() => {
      const projects = Array.isArray(profileData.projects) ? profileData.projects : [];
      const examples = [];

      projects.forEach(project => {
        if (!project || !project.contained || !Array.isArray(project.contained)) return;
        const within = project.name || project.id || '';
        const withinHref = project.id ? `#${projectAnchorId(project)}` : '';

        project.contained.forEach(item => {
          if (!item || !item.name) return;
          examples.push({
            id: `${project.id || 'container'}-${String(t(item.name)).toLowerCase().replace(/\s+/g, '-')}`,
            name: item.name,
            tagline: item.tagline || project.tagline || '',
            status: project.status || 'prototype',
            within,
            withinHref,
            links: item.url ? [{ label: ui('projectExamples.linkLabel', 'Link'), url: item.url }] : [],
            highlights: Array.isArray(item.highlights) ? item.highlights : [],
            tags: Array.isArray(project.tags) ? project.tags.slice(0, 4) : []
          });
        });
      });

      return examples.slice(0, 8);
    })();

    const items = explicitItems.length ? explicitItems : derivedItems;
    if (!items.length) {
      container.innerHTML = '<p class="text-center text-light">No examples available yet.</p>';
      return;
    }

    const normalizeStatus = (status) => {
      const value = String(status || '').toLowerCase();
      if (value === 'production' || value === 'prototype' || value === 'concept') return value;
      return 'prototype';
    };

    const statusLabelI18n = (status) => {
      if (currentLang === 'it') {
        if (status === 'production') return 'Produzione';
        if (status === 'prototype') return 'Prototipo';
        return 'Concetto';
      }
      if (status === 'production') return 'Production';
      if (status === 'prototype') return 'Prototype';
      return 'Concept';
    };

    const anchorId = (example) => {
      const base = example.id ? String(example.id) : String(example.name || 'example');
      return `example-${base}`.toLowerCase().replace(/\s+/g, '-');
    };

    const html = items.map(example => {
      const status = normalizeStatus(example.status);
      const links = Array.isArray(example.links) ? example.links : [];
      const tags = Array.isArray(example.tags) ? example.tags : [];
      const bullets = Array.isArray(example.highlights) ? example.highlights : [];

      const linksHtml = links.length
        ? `
          <div class="project-links" aria-label="Links">
            ${links.map(link => {
              const isPlaceholder = !!link.placeholder || !link.url || link.url === '#';
              const safeLabel = link.label || 'Link';
              if (isPlaceholder) {
                return `<span class="project-link placeholder">${safeLabel} (TODO)</span>`;
              }
              const url = normalizeExternalUrl(link.url);
              if (!url) return `<span class="project-link placeholder">${safeLabel} (TODO)</span>`;
              return `<a class="project-link" href="${url}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`;
            }).join('')}
          </div>
        `
        : '';

      const within = example.within ? t(example.within) : '';
      const withinHref = example.withinHref ? String(example.withinHref) : '';
      const withinHtml = within
        ? `<p class="project-purpose"><strong>${ui('projectExamples.withinLabel', 'Within:')}</strong> ${withinHref ? `<a href="${withinHref}">${within}</a>` : within}</p>`
        : '';

      return `
        <article class="project-card" id="${anchorId(example)}" data-status="${status}">
          <div class="project-header">
            <div class="project-header-row">
              <h3>${t(example.name)}</h3>
              <span class="status-badge status-${status}">${statusLabelI18n(status)}</span>
            </div>
            <p class="project-tagline">${t(example.tagline)}</p>
          </div>
          <div class="project-body">
            ${withinHtml}
            ${example.purpose ? `<p class="project-purpose"><strong>${ui('projects.purposeLabel', 'Purpose:')}</strong> ${t(example.purpose)}</p>` : ''}
            ${bullets.length ? `
              <div class="project-builds">
                <strong>${ui('projectExamples.highlightsLabel', 'Highlights:')}</strong>
                <ul>
                  ${tList(bullets.slice(0, 4)).map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${linksHtml}
          </div>
          ${tags.length ? `
            <div class="project-tags" aria-label="Tags">
              ${tags.slice(0, 10).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </article>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Render collaborators / people I worked with block in About section (hidden until populated)
   */
  function renderCollaborators() {
    const section = document.getElementById('collaborators-section');
    const container = document.getElementById('collaborators-content');
    if (!section || !container || !profileData) return;

    // Prefer the new schema if present.
    const collaborators = Array.isArray(profileData.collaborators)
      ? profileData.collaborators
      : (Array.isArray(profileData.people) ? profileData.people : []);
    const nonEmptyCollaborators = collaborators.filter(p => p && (p.name || p.role || p.context || p.note || p.link || p.image));

    if (!nonEmptyCollaborators.length) {
      section.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    section.style.display = '';

    const linkLabel = ui('collaborators.linkLabel', 'Profile');
    const sourcesLabel = ui('collaborators.sourcesLabel', 'Sources');
    const epistemicLabel = ui('collaborators.epistemicLabel', 'Why it matters');
    const mustSayLabel = ui('collaborators.mustSayLabel', 'What this must convey');

    const normalizeGroupKey = (key) => {
      const k = String(key || '').trim().toLowerCase();
      if (!k) return 'other';
      if (k === 'academic') return 'academic';
      if (k === 'consortium') return 'consortium';
      if (k === 'industrial' || k === 'industry') return 'industrial';
      return 'other';
    };

    const groupOrder = ['academic', 'consortium', 'industrial', 'other'];
    const grouped = { academic: [], consortium: [], industrial: [], other: [] };
    nonEmptyCollaborators.forEach(person => {
      const key = normalizeGroupKey(person.group_key || person.groupKey || person.group || person.category);
      grouped[key].push(person);
    });

    const groupTitle = (key) => {
      if (key === 'academic') return ui('collaborators.group.academic', 'Academic context');
      if (key === 'consortium') return ui('collaborators.group.consortium', 'Consortium / program context');
      if (key === 'industrial') return ui('collaborators.group.industrial', 'Industry / operations context');
      return ui('collaborators.group.other', 'Other');
    };

    const renderCard = (person) => {
      const name = t(person.name || '');
      const role = t(person.role || '');
      const context = t(person.context || '');
      const note = t(person.note || '');
      const publicSummary = t(person.public_summary || person.publicSummary || '');
      const period = t(person.period || '');
      const link = person.link ? String(person.link) : '';
      const href = normalizeExternalUrl(link);
      const image = person.image ? String(person.image) : '';

      const epistemicRaw = person.epistemic || person.epistemic_function || person.epistemicFunction || [];
      const epistemicList = Array.isArray(epistemicRaw) ? epistemicRaw : (epistemicRaw ? [epistemicRaw] : []);

      const mustSay = t(person.must_say || person.mustSay || '');

      const rawSources = Array.isArray(person.sources) ? person.sources : [];
      const sources = rawSources
        .map(s => (typeof s === 'string' ? { url: s } : s))
        .filter(s => s && s.url)
        .map(s => {
          const url = normalizeExternalUrl(String(s.url));
          if (!url) return null;
          const label = s.label ? t(s.label) : url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
          return { url, label };
        })
        .filter(Boolean);

      const initials = String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join('');

      const avatar = image
        ? `<img src="${image}" alt="${name}" loading="lazy" decoding="async" />`
        : `<span aria-hidden="true">${initials || '—'}</span>`;

      const card = `
        <div class="collaborator-item">
          <div class="collaborator-top">
            <div class="collaborator-avatar">${avatar}</div>
            <div class="collaborator-main">
              <div class="collaborator-header">
                <h4>${name}</h4>
                ${period ? `<span class="collaborator-period">${period}</span>` : ''}
              </div>
              ${role ? `<p class="collaborator-role">${role}</p>` : ''}
            </div>
          </div>
          ${context ? `<p class="collaborator-context">${context}</p>` : ''}
          ${publicSummary ? `<p class="collaborator-context">${publicSummary}</p>` : ''}
          ${epistemicList.length ? `
            <div class="collaborator-epistemic">
              <span class="collaborator-block-label">${epistemicLabel}</span>
              <ul>
                ${tList(epistemicList).map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${mustSay ? `
            <div class="collaborator-mustsay">
              <span class="collaborator-block-label">${mustSayLabel}</span>
              <p class="collaborator-mustsay-text">${mustSay}</p>
            </div>
          ` : ''}
          ${note ? `<p class="collaborator-note">${note}</p>` : ''}
          ${sources.length ? `
            <div class="collaborator-sources">
              <span class="collaborator-link-label">${sourcesLabel}</span>
              <div class="collaborator-sources-links">
                ${sources.slice(0, 3).map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a>`).join('')}
              </div>
            </div>
          ` : ''}
          ${href ? `<span class="collaborator-link-label">${linkLabel}</span>` : ''}
        </div>
      `;

      // If an external link exists, make the whole card clickable (no nested anchors).
      if (href) {
        return `<a class="collaborator-card-link" href="${href}" target="_blank" rel="noopener noreferrer">${card}</a>`;
      }

      return card;
    };

    const sectionsHtml = groupOrder
      .filter(key => grouped[key] && grouped[key].length)
      .map(key => {
        const cardsHtml = grouped[key].map(renderCard).join('');
        return `
          <h3 class="collaborators-group-title">${groupTitle(key)}</h3>
          ${cardsHtml}
        `;
      })
      .join('');

    container.innerHTML = sectionsHtml;
  }

  /**
   * Render Operating System block in About section
   */
  function renderOperatingSystem() {
    const container = document.getElementById('operating-system');
    if (!container || !profileData) return;

    const os = profileData.operatingSystem;
    if (os && Array.isArray(os.blocks) && os.blocks.length) {
      const html = os.blocks.map(block => {
        const items = Array.isArray(block.items) ? block.items : [];
        return `
          <div class="operating-item">
            <h4>${t(block.title || '')}</h4>
            ${items.length ? `
              <ul>
                ${tList(items).map(item => `<li>${item}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `;
      }).join('');
      container.innerHTML = html;
      return;
    }

    // New schema fallback: render boundary rules from about.boundary_rules.
    const rules = profileData.about && Array.isArray(profileData.about.boundary_rules)
      ? profileData.about.boundary_rules
      : [];
    if (!rules.length) return;

    container.innerHTML = `
      <div class="operating-item">
        <h4>${currentLang === 'it' ? 'Regole' : 'Rules'}</h4>
        <ul>
          ${tList(rules).map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  /**
   * Render hero section
   */
  function renderHero() {
    const heroTitle = document.querySelector('#hero-title');
    const heroSubtitle = document.querySelector('#hero-subtitle');
    const heroTagline = document.querySelector('#hero-tagline');
    const heroLocation = document.querySelector('#hero-location');
    const heroCurrent = document.querySelector('#hero-current');
    const heroLinkedIn = document.querySelector('#hero-linkedin');
    const heroHighlights = document.querySelector('#hero-highlights');
    const heroPrimaryBtn = document.querySelector('.hero-cta .btn');
    const heroEmailBtn = document.querySelector('.hero-cta a[href^="mailto:"]');
    
    const hero = profileData && profileData.hero ? profileData.hero : {};
    const person = profileData && profileData.person ? profileData.person : {};

    if (heroTitle) {
      heroTitle.textContent = t(hero.title || hero.greeting || person.name || '');
    }
    if (heroSubtitle) {
      heroSubtitle.textContent = t(hero.subtitle || person.title || '');
    }

    if (heroTagline && person.tagline) {
      heroTagline.textContent = t(person.tagline);
    }

    const highlights = Array.isArray(hero.bullets)
      ? hero.bullets
      : (Array.isArray(hero.highlights) ? hero.highlights : []);

    if (heroHighlights && highlights.length) {
      heroHighlights.innerHTML = tList(highlights)
        .map(item => `<li>${item}</li>`)
        .join('');
    }

    if (heroLocation && person.location) {
      heroLocation.textContent = t(person.location);
    }

    if (heroCurrent) {
      if (profileData.focusNow && (profileData.focusNow.role || profileData.focusNow.company)) {
        heroCurrent.textContent = `${t(profileData.focusNow.role)} — ${t(profileData.focusNow.company)}`;
      } else if (Array.isArray(profileData.background) && profileData.background.length) {
        const first = profileData.background[0] || {};
        heroCurrent.textContent = `${t(first.role)} — ${t(first.organization)}`.replace(/^\s*—\s*|\s*—\s*$/g, '').trim();
      } else {
        heroCurrent.textContent = '';
      }
    }

    if (heroLinkedIn && Array.isArray(profileData.social)) {
      const linkedIn = profileData.social.find(s => s.platform === 'LinkedIn');
      if (linkedIn && linkedIn.url) {
        heroLinkedIn.href = linkedIn.url;
      }
    }

    // Optional: drive CTAs from the new schema if available.
    if (heroPrimaryBtn && hero.secondary_cta && hero.secondary_cta.href) {
      heroPrimaryBtn.textContent = t(hero.secondary_cta.label) || heroPrimaryBtn.textContent;
      heroPrimaryBtn.setAttribute('href', String(hero.secondary_cta.href));
    }

    if (heroEmailBtn && person.email) {
      heroEmailBtn.setAttribute('href', `mailto:${String(person.email)}`);
    }
  }

  /**
   * Render Focus Now section
   */
  function renderFocusNow() {
    const container = document.getElementById('focus-now-content');
    if (!container) return;

    // New schema: focus_now.items[]
    if (profileData.focus_now && Array.isArray(profileData.focus_now.items) && profileData.focus_now.items.length) {
      const html = profileData.focus_now.items.map(item => {
        const tags = Array.isArray(item.tags) ? item.tags : [];
        return `
          <div class="focus-card">
            <h3>${t(item.title)}</h3>
            ${item.one_liner ? `<p class="description">${t(item.one_liner)}</p>` : ''}
            ${tags.length ? `<div class="focus-keywords">${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
          </div>
        `;
      }).join('');

      container.innerHTML = html;
      return;
    }

    // Backward-compatible schema: focusNow
    const focus = profileData.focusNow;
    if (!focus) return;

    const html = `
      <div class="focus-header">
        <h3>${t(focus.role)} — ${t(focus.company)}</h3>
        <p class="period">${t(focus.period)}</p>
        <p class="description">${t(focus.description)}</p>
      </div>
      <div class="focus-activities">
        <ul>
          ${tList(focus.activities).map(activity => `<li>${activity}</li>`).join('')}
        </ul>
      </div>
      <div class="focus-keywords">
        ${tList(focus.keywords).map(keyword => `<span class="tag">${keyword}</span>`).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Render Services section
   */
  function renderServices() {
    const container = document.getElementById('services-grid');
    if (!container) return;

    const html = profileData.services.map(service => `
      <div class="service-card">
        <div class="service-icon">
          <i class="fa ${service.icon}" aria-hidden="true"></i>
        </div>
        <h3>${t(service.title)}</h3>
        <p>${t(service.description)}</p>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  /**
   * Render Projects section
   */
  function renderProjects() {
    const container = document.getElementById('projects-grid');
    if (!container) return;

    const normalizeStatus = (status) => {
      const value = String(status || '').toLowerCase();
      if (value === 'production' || value === 'prototype' || value === 'concept') return value;
      return 'prototype';
    };

    const statusLabel = (status) => {
      if (status === 'production') return 'Production';
      if (status === 'prototype') return 'Prototype';
      return 'Concept';
    };

    const statusLabelI18n = (status) => {
      if (currentLang === 'it') {
        if (status === 'production') return 'Produzione';
        if (status === 'prototype') return 'Prototipo';
        return 'Concetto';
      }
      return statusLabel(status);
    };

    const projectAnchorId = (project) => {
      const base = project.id ? String(project.id) : String(project.name || 'project');
      return `project-${base}`.toLowerCase().replace(/\s+/g, '-');
    };

    const specLabel = (key, fallback) => ui(key, fallback);
    const renderSpecList = (items) => {
      const arr = Array.isArray(items) ? items : [];
      if (!arr.length) return '';
      return `<ul>${tList(arr).map(x => `<li>${x}</li>`).join('')}</ul>`;
    };

    const html = (profileData.projects || []).map(project => {
      const status = normalizeStatus(project.status);
      const links = Array.isArray(project.links) ? project.links : [];
      const contained = Array.isArray(project.contained) ? project.contained : [];
      const evidenceBullets = Array.isArray(project.evidence_bullets) ? project.evidence_bullets : [];
      const projectLogo = project && project.logo ? String(project.logo) : '';
      const projectLogoHtml = projectLogo
        ? `<img class="project-logo" src="${projectLogo}" alt="${t(project.name)} logo" loading="lazy" decoding="async" />`
        : '';

      const spec = project && project.spec && typeof project.spec === 'object' ? project.spec : null;
      const linksHtml = links.length
        ? `
          <div class="project-links" aria-label="Links">
            ${links.map(link => {
              const isPlaceholder = !!link.placeholder || !link.url || link.url === '#';
              const safeLabel = link.label || 'Link';
              if (isPlaceholder) {
                return `<span class="project-link placeholder">${safeLabel} (TODO)</span>`;
              }
              return `<a class="project-link" href="${link.url}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`;
            }).join('')}
          </div>
        `
        : '';

      const containedHtml = contained.length
        ? `
          <div class="project-contained">
            <strong>${ui('projects.containedLabel', 'Contained:')}</strong>
            <ul>
              ${contained.slice(0, 5).map(item => {
                const name = item && item.name ? item.name : 'Item';
                const tagline = item && item.tagline ? item.tagline : '';
                const url = item && item.url ? normalizeExternalUrl(item.url) : '';
                const image = item && item.image ? String(item.image) : '';
                const logoHtml = image
                  ? `<img class="contained-logo" src="${image}" alt="${t(name)} logo" loading="lazy" decoding="async" />`
                  : '';

                const nameHtml = url
                  ? `<a class="contained-name" href="${url}" target="_blank" rel="noopener noreferrer">${logoHtml}<span class="contained-name-text">${t(name)}</span></a>`
                  : `<span class="contained-name">${logoHtml}<span class="contained-name-text">${t(name)}</span></span>`;
                return `<li>${nameHtml}${tagline ? ` — <span class="contained-tagline">${t(tagline)}</span>` : ''}</li>`;
              }).join('')}
            </ul>
          </div>
        `
        : '';

      return `
        <article class="project-card" id="${projectAnchorId(project)}" data-status="${status}">
          <div class="project-header">
            <div class="project-header-row">
              <h3 class="project-title">${projectLogoHtml}<span class="project-title-text">${t(project.name)}</span></h3>
              <span class="status-badge status-${status}">${statusLabelI18n(status)}</span>
            </div>
            <p class="project-tagline">${t(project.tagline)}</p>
          </div>
          <div class="project-body">
            ${spec ? `
              <div class="project-spec" aria-label="Technical spec">
                <div class="spec-row"><strong>${specLabel('projects.spec.status', 'Status')}</strong> <span>${statusLabelI18n(normalizeStatus(spec.status || project.status))}</span></div>
                <div class="spec-row"><strong>${specLabel('projects.spec.boundary', 'Boundary')}</strong> <span>${t(spec.boundary)}</span></div>
                <div class="spec-row"><strong>${specLabel('projects.spec.purpose', 'Purpose')}</strong> <div>${t(spec.purpose)}</div></div>
                <div class="spec-row"><strong>${specLabel('projects.spec.inputs', 'Inputs')}</strong>${renderSpecList(spec.inputs)}</div>
                <div class="spec-row"><strong>${specLabel('projects.spec.outputs', 'Outputs')}</strong>${renderSpecList(spec.outputs)}</div>
                <div class="spec-row"><strong>${specLabel('projects.spec.reuse', 'Reuse')}</strong>${renderSpecList(spec.reuse)}</div>
                <div class="spec-row"><strong>${specLabel('projects.spec.constraints', 'Constraints')}</strong>${renderSpecList(spec.constraints)}</div>
                <div class="spec-row"><strong>${specLabel('projects.spec.currentFocus', 'Current focus')}</strong>${renderSpecList(spec.current_focus)}</div>
              </div>
            ` : ''}
            ${evidenceBullets.length ? `
              <div class="project-builds">
                <strong>${ui('projects.originLabel', 'Origin / evidence:')}</strong>
                <ul>
                  ${tList(evidenceBullets.slice(0, 8)).map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            <p class="project-purpose"><strong>${ui('projects.purposeLabel', 'Purpose:')}</strong> ${t(project.purpose)}</p>
            <div class="project-builds">
              <strong>${ui('projects.whatIBuildLabel', 'What I build:')}</strong>
              <ul>
                ${tList((project.whatIBuild || [])).map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
            <div class="project-outputs">
              <strong>${ui('projects.outputsLabel', 'Outputs:')}</strong>
              <ul>
                ${tList((project.outputs || [])).map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
            ${containedHtml}
            ${linksHtml}
          </div>
          <div class="project-tags" aria-label="Tags">
            ${(project.tags || []).slice(0, 10).map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </article>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Render Education section
   */
  function renderEducation() {
    const container = document.getElementById('education-list');
    if (!container || !profileData) return;

    // New schema: timeline.education[]
    const timelineEducation = profileData.timeline && Array.isArray(profileData.timeline.education)
      ? profileData.timeline.education
      : [];

    if (timelineEducation.length) {
      const html = timelineEducation.map(item => {
        const tags = Array.isArray(item.tags) ? item.tags : [];
        const researchFocus = Array.isArray(item.research_focus) ? item.research_focus : [];
        const coreStack = Array.isArray(item.core_stack) ? item.core_stack : [];

        const researchFocusTitle = ui('education.researchFocusTitle', 'Research focus');
        const coreStackTitle = ui('education.coreStackTitle', 'Core stack');

        return `
          <div class="education-item">
            <div class="education-header">
              <h4>${t(item.title)}</h4>
            </div>
            <p class="org-period">${t(item.org)} • ${t(item.period)}</p>
            ${item.summary ? `<p class="focus">${t(item.summary)}</p>` : ''}
            ${(researchFocus.length || coreStack.length) ? `
              <div class="education-notes">
                ${researchFocus.length ? `
                  <div class="mb-sm">
                    <strong>${researchFocusTitle}</strong>
                    <ul>
                      ${tList(researchFocus.slice(0, 4)).map(n => `<li>${n}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${coreStack.length ? `
                  <div>
                    <strong>${coreStackTitle}</strong>
                    <ul>
                      ${tList(coreStack.slice(0, 6)).map(n => `<li>${n}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>
            ` : ''}
            ${tags.length ? `
              <div class="education-tags">
                ${tags.slice(0, 10).map(tag => `<span class="tag">${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      container.innerHTML = html;
      return;
    }

    // Backward-compatible schema: education[]
    const education = Array.isArray(profileData.education) ? profileData.education : [];
    if (!education.length) {
      container.innerHTML = '';
      return;
    }

    const html = education.map(item => {
      const isPlaceholder = !!item.placeholder;
      const notes = Array.isArray(item.notes) ? item.notes : [];
      const tags = Array.isArray(item.tags) ? item.tags : [];

      return `
        <div class="education-item${isPlaceholder ? ' placeholder' : ''}">
          <div class="education-header">
            <h4>${t(item.degree)}</h4>
            ${isPlaceholder ? '<span class="status-badge status-concept">TODO</span>' : ''}
          </div>
          <p class="org-period">${t(item.institution)} • ${t(item.period)}</p>
          ${notes.length ? `
            <ul class="education-notes">
              ${tList(notes).map(n => `<li>${n}</li>`).join('')}
            </ul>
          ` : ''}
          ${tags.length ? `
            <div class="education-tags">
              ${tList(tags).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Render Toolbox section
   */
  function renderToolbox() {
    const tagsContainer = document.getElementById('toolbox-tags');
    const capabilitiesContainer = document.getElementById('toolbox-capabilities');
    
    if (tagsContainer) {
      const tagsHtml = profileData.toolbox.tags
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');
      tagsContainer.innerHTML = tagsHtml;
    }

    if (capabilitiesContainer) {
      const capabilitiesHtml = profileData.toolbox.capabilities
        .map(cap => `<li>${cap}</li>`)
        .join('');
      capabilitiesContainer.innerHTML = `<ul>${capabilitiesHtml}</ul>`;
    }
  }

  /**
   * Render Proofs section
   */
  function renderProofs() {
    const container = document.getElementById('proofs-list');
    if (!container) return;

    // New schema: proof.categories[].items[]
    if (profileData.proof && Array.isArray(profileData.proof.categories) && profileData.proof.categories.length) {
      const badgeTextForStatus = (status) => {
        const s = String(status || '').toLowerCase();
        if (s === 'private') return ui('proof.badgePrivate', 'Private');
        if (s === 'available_on_request') return ui('proof.badgeOnRequest', 'Available on request');
        if (s === 'not_public_yet') return ui('proof.badgeNotPublic', 'Not public yet');
        if (s === 'todo') return ui('proof.badgeTodo', 'TODO');
        return ui('proof.badgeNotPublic', 'Not public yet');
      };

      const html = profileData.proof.categories.map(group => {
        const title = t(group.category);
        const items = Array.isArray(group.items) ? group.items : [];

        const itemsHtml = items.map(item => {
          const url = normalizeExternalUrl(item.url);
          const label = t(item.label);
          const status = String(item.status || '').toLowerCase();
          const bullets = Array.isArray(item.bullets) ? item.bullets : [];
          const source = item.source ? t(item.source) : '';

          const bulletsHtml = bullets.length
            ? `<ul class="proof-bullets">${tList(bullets.slice(0, 12)).map(b => `<li>${b}</li>`).join('')}</ul>`
            : '';
          const sourceHtml = source ? `<div class="proof-source">${source}</div>` : '';

          if (url && (status === 'public' || !status)) {
            return `
              <div class="proof-item">
                <a href="${url}" class="proof-link" target="_blank" rel="noopener noreferrer">
                  <span>${label}</span>
                </a>
                ${bulletsHtml}
                ${sourceHtml}
              </div>
            `;
          }

          return `
            <div class="proof-item">
              <span class="proof-link placeholder">
                <span>${label}</span>
                <span class="status-badge status-concept">${badgeTextForStatus(status)}</span>
              </span>
              ${bulletsHtml}
              ${sourceHtml}
            </div>
          `;
        }).join('');

        // Put category title as a full-width separator.
        return `
          <div class="proof-category-title"><strong>${title}</strong></div>
          ${itemsHtml}
        `;
      }).join('');

      container.innerHTML = html;
      return;
    }

    // Backward-compatible schema: proofs[]
    const proofs = Array.isArray(profileData.proofs) ? profileData.proofs : [];
    if (!proofs.length) return;

    const html = proofs.map(proof => {
      const isPlaceholder = proof.placeholder ? ' (TODO)' : '';
      const linkClass = proof.placeholder ? 'proof-link placeholder' : 'proof-link';
      const href = proof.placeholder ? '#' : proof.url;
      
      return `
        <div class="proof-item">
          <a href="${href}" class="${linkClass}" ${!proof.placeholder ? 'target="_blank" rel="noopener noreferrer"' : ''}>
            <i class="fa ${proof.icon}" aria-hidden="true"></i>
            <span>${t(proof.label)}${isPlaceholder}</span>
          </a>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Render collaboration modes in About section
   */
  function renderCollaborationModes() {
    const container = document.getElementById('collaboration-modes');
    if (!container || !profileData) return;

    const modes = Array.isArray(profileData.collaboration_modes)
      ? profileData.collaboration_modes
      : (Array.isArray(profileData.collaborationModes) ? profileData.collaborationModes : []);
    if (!modes.length) return;

    const html = modes.map(mode => {
      const title = t(mode.title || mode.mode);
      const desc = t(mode.one_liner || mode.description);
      const tags = Array.isArray(mode.tags) ? mode.tags : [];
      return `
        <div class="collab-mode">
          <h4>${title}</h4>
          ${desc ? `<p>${desc}</p>` : ''}
          ${tags.length ? `<div class="collab-tags">${tags.slice(0, 8).map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Render background in About section
   */
  function renderBackground() {
    const container = document.getElementById('background-list');
    if (!container || !profileData) return;

    const html = profileData.background.map(bg => {
      const evidence = Array.isArray(bg.evidence_bullets) ? bg.evidence_bullets : [];
      return `
        <div class="background-item">
          <h4>${t(bg.role)}</h4>
          <p class="org-period">${t(bg.organization)} • ${t(bg.period)}</p>
          <p class="focus">${t(bg.focus)}</p>
          ${evidence.length ? `
            <ul class="education-notes">
              ${tList(evidence.slice(0, 4)).map(n => `<li>${n}</li>`).join('')}
            </ul>
          ` : ''}
          <div class="tools">
            ${tList(bg.tools).map(tool => `<span class="tag">${tool}</span>`).join('')}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Render Contact section
   */
  function renderContact() {
    const container = document.getElementById('contact-info');
    if (!container) return;

    const person = profileData.person;

    const linkedIn = Array.isArray(profileData.social)
      ? profileData.social.find(s => s.platform === 'LinkedIn')
      : null;
    
    const html = `
      <div class="contact-item">
        <i class="fa fa-map-marker"></i>
        <span>${person.location}</span>
      </div>
      <div class="contact-item">
        <i class="fa fa-envelope"></i>
        <span>${person.email}</span>
      </div>
      ${linkedIn && linkedIn.url ? `
        <div class="contact-item">
          <i class="fa fa-linkedin"></i>
          <a href="${linkedIn.url}" target="_blank" rel="noopener noreferrer">
            LinkedIn Profile
          </a>
        </div>
      ` : ''}
    `;

    container.innerHTML = html;
  }

  /**
   * Initialize copy email functionality
   */
  function initCopyEmail() {
    const copyBtn = document.getElementById('copy-email-btn');
    if (!copyBtn) return;

    copyBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const email = profileData.person.email;
      
      // Try modern clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email)
          .then(() => {
            showCopyFeedback(copyBtn, 'Copied!');
          })
          .catch(err => {
            console.error('Clipboard copy failed:', err);
            fallbackCopyEmail(email, copyBtn);
          });
      } else {
        fallbackCopyEmail(email, copyBtn);
      }
    });
  }

  /**
   * Fallback copy method for older browsers
   */
  function fallbackCopyEmail(email, btn) {
    const textarea = document.createElement('textarea');
    textarea.value = email;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      showCopyFeedback(btn, 'Copied!');
    } catch (err) {
      console.error('Fallback copy failed:', err);
      showCopyFeedback(btn, 'Copy failed');
    }
    
    document.body.removeChild(textarea);
  }

  /**
   * Show visual feedback after copy
   */
  function showCopyFeedback(btn, message) {
    const originalText = btn.textContent;
    btn.textContent = message;
    btn.classList.add('copied');
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('copied');
    }, 2000);
  }

  /**
   * Render Future Plans section
   */
  function renderFuturePlans() {
    const container = document.getElementById('future-plans-content');
    if (!container || !profileData.futurePlans) return;

    const html = profileData.futurePlans.map(section => `
      <div class="future-category mb-lg">
        <h3 class="mb-md">${t(section.category)}</h3>
        <ul class="future-items">
          ${section.items.map(item => `<li>${t(item)}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  /**
   * Render Reading section
   */
  function renderReading() {
    const container = document.getElementById('reading-content');
    if (!container || !profileData.reading) return;

    const whyLabel = ui('reading.why', 'Why it matters');

    if (Array.isArray(profileData.reading.domains) && profileData.reading.domains.length) {
      const html = profileData.reading.domains.map(domain => {
        const books = Array.isArray(domain.books) ? domain.books : [];
        if (!books.length) return '';

        return `
          <div class="reading-section mb-lg">
            <h3 class="mb-md">${t(domain.domain)}</h3>
            <div class="reading-grid">
              ${books.map(book => {
                const tags = Array.isArray(book.topic_tags) ? book.topic_tags : [];
                const status = book.status ? String(book.status) : '';
                return `
                  <div class="card reading-card">
                    <h4>${t(book.title)}</h4>
                    <p class="book-author">${t(book.author)}</p>
                    ${tags.length ? `<div class="mt-sm">${tags.slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
                    ${status ? `<div class="mt-sm"><span class="tag">${status}</span></div>` : ''}
                    ${book.why_it_matters ? `<p class="book-impact mt-sm text-light"><strong>${whyLabel}:</strong> ${t(book.why_it_matters)}</p>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = html;
      return;
    }

    // Backward-compatible: now_reading + completed
    const now = Array.isArray(profileData.reading.now_reading) ? profileData.reading.now_reading : [];
    const completed = Array.isArray(profileData.reading.completed) ? profileData.reading.completed : [];

    const nowTitle = ui('reading.nowTitle', 'Now Reading');
    const completedTitle = ui('reading.completedTitle', 'Completed');

    const nowHtml = now.length ? `
      <div class="reading-section mb-lg">
        <h3 class="mb-md">${nowTitle}</h3>
        <div class="reading-grid">
          ${now.map(book => `
            <div class="card reading-card">
              <h4>${t(book.title)}</h4>
              <p class="book-author">${t(book.author)}</p>
              ${(Array.isArray(book.topic_tags) ? book.topic_tags : []).slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const completedHtml = completed.length ? `
      <div class="reading-section">
        <h3 class="mb-md">${completedTitle}</h3>
        <div class="reading-grid">
          ${completed.map(book => `
            <div class="card reading-card">
              <h4>${t(book.title)}</h4>
              <p class="book-author">${t(book.author)}</p>
              ${(Array.isArray(book.topic_tags) ? book.topic_tags : []).slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    container.innerHTML = nowHtml + completedHtml;
  }

  /**
   * Render University Courses section
   */
  function renderCourses() {
    const container = document.getElementById('courses-content');
    if (!container || !profileData.universityCourses) return;

    const courses = profileData.universityCourses;
    const sections = [];

    const phdLabel = ui('courses.levelPhd', 'PhD');
    const mastersLabel = ui('courses.levelMasters', "Master's Degree");
    const bachelorsLabel = ui('courses.levelBachelors', "Bachelor's Degree");

    if (courses.phd) {
      sections.push({
        title: phdLabel,
        ...courses.phd
      });
    }

    if (courses.masters) {
      sections.push({
        title: mastersLabel,
        ...courses.masters
      });
    }

    if (courses.bachelors) {
      sections.push({
        title: bachelorsLabel,
        ...courses.bachelors
      });
    }

    const html = sections.map(section => `
      <div class="courses-section mb-lg">
        <h3 class="mb-sm">${section.title} — ${section.institution}</h3>
        <p class="text-light mb-md">${section.period}</p>
        <div class="courses-grid">
          ${section.courses.map(course => `
            <div class="card course-card">
              <h4>${t(course.name)}</h4>
              <div class="course-meta">
                <span class="course-credits">${course.credits} CFU</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.profileRenderer = {
    getData: () => profileData,
    reload: init
  };
})();
