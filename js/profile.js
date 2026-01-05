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

  /**
   * Initialize profile rendering
   */
  function init() {
    initLanguage();
    loadProfileData()
      .then(data => {
        profileData = data;
        applyI18nToDom();
        renderAll();
      })
      .catch(err => {
        console.error('Profile data loading failed, using fallback HTML:', err);
        showLocalPreviewWarning(err);
      });
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
    renderOperatingSystem();
    renderCollaborationModes();
    renderServices();
    renderProjects();
    renderToolbox();
    renderProofs();
    renderContact();
    initCopyEmail();
  }

  /**
   * Render Operating System block in About section
   */
  function renderOperatingSystem() {
    const container = document.getElementById('operating-system');
    if (!container || !profileData) return;

    const os = profileData.operatingSystem;
    if (!os || !Array.isArray(os.blocks) || !os.blocks.length) return;

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
    
    if (heroTitle) {
      heroTitle.textContent = t(profileData.hero.greeting);
    }
    if (heroSubtitle) {
      heroSubtitle.textContent = t(profileData.hero.subtitle);
    }

    if (heroTagline && profileData.person && profileData.person.tagline) {
      heroTagline.textContent = t(profileData.person.tagline);
    }

    if (heroHighlights && profileData.hero && Array.isArray(profileData.hero.highlights)) {
      heroHighlights.innerHTML = tList(profileData.hero.highlights)
        .map(item => `<li>${item}</li>`)
        .join('');
    }

    if (heroLocation && profileData.person && profileData.person.location) {
      heroLocation.textContent = t(profileData.person.location);
    }

    if (heroCurrent && profileData.focusNow) {
      heroCurrent.textContent = `${t(profileData.focusNow.role)} — ${t(profileData.focusNow.company)}`;
    }

    if (heroLinkedIn && Array.isArray(profileData.social)) {
      const linkedIn = profileData.social.find(s => s.platform === 'LinkedIn');
      if (linkedIn && linkedIn.url) {
        heroLinkedIn.href = linkedIn.url;
      }
    }
  }

  /**
   * Render Focus Now section
   */
  function renderFocusNow() {
    const container = document.getElementById('focus-now-content');
    if (!container) return;

    const focus = profileData.focusNow;
    
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

    const html = (profileData.projects || []).map(project => {
      const status = normalizeStatus(project.status);
      const links = Array.isArray(project.links) ? project.links : [];
      const contained = Array.isArray(project.contained) ? project.contained : [];
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
                const name = item && item.name ? String(item.name) : 'Item';
                const tagline = item && item.tagline ? String(item.tagline) : '';
                return `<li><span class="contained-name">${t(name)}</span>${tagline ? ` — <span class="contained-tagline">${t(tagline)}</span>` : ''}</li>`;
              }).join('')}
            </ul>
          </div>
        `
        : '';

      return `
        <article class="project-card" id="${projectAnchorId(project)}" data-status="${status}">
          <div class="project-header">
            <div class="project-header-row">
              <h3>${t(project.name)}</h3>
              <span class="status-badge status-${status}">${statusLabelI18n(status)}</span>
            </div>
            <p class="project-tagline">${t(project.tagline)}</p>
          </div>
          <div class="project-body">
            <p class="project-purpose"><strong>${ui('projects.purposeLabel', 'Purpose:')}</strong> ${t(project.purpose)}</p>
            <div class="project-builds">
              <strong>${ui('projects.whatIBuildLabel', 'What I build:')}</strong>
              <ul>
                ${tList((project.whatIBuild || []).slice(0, 3)).map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
            <div class="project-outputs">
              <strong>${ui('projects.outputsLabel', 'Outputs:')}</strong>
              <ul>
                ${tList((project.outputs || []).slice(0, 3)).map(item => `<li>${item}</li>`).join('')}
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

    const education = Array.isArray(profileData.education) ? profileData.education : [];
    if (!education.length) return;

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

    const html = profileData.proofs.map(proof => {
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

    const html = profileData.collaborationModes.map(mode => `
      <div class="collab-mode">
        <h4>${t(mode.mode)}</h4>
        <p>${t(mode.description)}</p>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  /**
   * Render background in About section
   */
  function renderBackground() {
    const container = document.getElementById('background-list');
    if (!container || !profileData) return;

    const html = profileData.background.map(bg => `
      <div class="background-item">
        <h4>${t(bg.role)}</h4>
        <p class="org-period">${t(bg.organization)} • ${t(bg.period)}</p>
        <p class="focus">${t(bg.focus)}</p>
        <div class="tools">
          ${tList(bg.tools).map(tool => `<span class="tag">${tool}</span>`).join('')}
        </div>
      </div>
    `).join('');

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
