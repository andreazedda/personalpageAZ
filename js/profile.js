/**
 * Profile Data Renderer
 * Loads profile.json and populates sections with data-driven content
 * Progressive enhancement: works with fallback HTML if JSON fails
 */

(function() {
  'use strict';

  const DATA_URL = 'data/profile.json';
  let profileData = null;

  /**
   * Initialize profile rendering
   */
  function init() {
    loadProfileData()
      .then(data => {
        profileData = data;
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
          <h4>${block.title || ''}</h4>
          ${items.length ? `
            <ul>
              ${items.map(item => `<li>${item}</li>`).join('')}
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
      heroTitle.textContent = profileData.hero.greeting;
    }
    if (heroSubtitle) {
      heroSubtitle.textContent = profileData.hero.subtitle;
    }

    if (heroTagline && profileData.person && profileData.person.tagline) {
      heroTagline.textContent = profileData.person.tagline;
    }

    if (heroHighlights && profileData.hero && Array.isArray(profileData.hero.highlights)) {
      heroHighlights.innerHTML = profileData.hero.highlights
        .map(item => `<li>${item}</li>`)
        .join('');
    }

    if (heroLocation && profileData.person && profileData.person.location) {
      heroLocation.textContent = profileData.person.location;
    }

    if (heroCurrent && profileData.focusNow) {
      heroCurrent.textContent = `${profileData.focusNow.role} — ${profileData.focusNow.company}`;
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
        <h3>${focus.role} — ${focus.company}</h3>
        <p class="period">${focus.period}</p>
        <p class="description">${focus.description}</p>
      </div>
      <div class="focus-activities">
        <ul>
          ${focus.activities.map(activity => `<li>${activity}</li>`).join('')}
        </ul>
      </div>
      <div class="focus-keywords">
        ${focus.keywords.map(keyword => `<span class="tag">${keyword}</span>`).join('')}
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
        <h3>${service.title}</h3>
        <p>${service.description}</p>
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
            <strong>Contained:</strong>
            <ul>
              ${contained.slice(0, 5).map(item => {
                const name = item && item.name ? String(item.name) : 'Item';
                const tagline = item && item.tagline ? String(item.tagline) : '';
                return `<li><span class="contained-name">${name}</span>${tagline ? ` — <span class="contained-tagline">${tagline}</span>` : ''}</li>`;
              }).join('')}
            </ul>
          </div>
        `
        : '';

      return `
        <article class="project-card" id="${projectAnchorId(project)}" data-status="${status}">
          <div class="project-header">
            <div class="project-header-row">
              <h3>${project.name}</h3>
              <span class="status-badge status-${status}">${statusLabel(status)}</span>
            </div>
            <p class="project-tagline">${project.tagline}</p>
          </div>
          <div class="project-body">
            <p class="project-purpose"><strong>Purpose:</strong> ${project.purpose}</p>
            <div class="project-builds">
              <strong>What I build:</strong>
              <ul>
                ${(project.whatIBuild || []).slice(0, 3).map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
            <div class="project-outputs">
              <strong>Outputs:</strong>
              <ul>
                ${(project.outputs || []).slice(0, 3).map(item => `<li>${item}</li>`).join('')}
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
            <h4>${item.degree}</h4>
            ${isPlaceholder ? '<span class="status-badge status-concept">TODO</span>' : ''}
          </div>
          <p class="org-period">${item.institution} • ${item.period}</p>
          ${notes.length ? `
            <ul class="education-notes">
              ${notes.map(n => `<li>${n}</li>`).join('')}
            </ul>
          ` : ''}
          ${tags.length ? `
            <div class="education-tags">
              ${tags.map(t => `<span class="tag">${t}</span>`).join('')}
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
            <span>${proof.label}${isPlaceholder}</span>
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
        <h4>${mode.mode}</h4>
        <p>${mode.description}</p>
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
        <h4>${bg.role}</h4>
        <p class="org-period">${bg.organization} • ${bg.period}</p>
        <p class="focus">${bg.focus}</p>
        <div class="tools">
          ${bg.tools.map(tool => `<span class="tag">${tool}</span>`).join('')}
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
