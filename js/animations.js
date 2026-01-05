/**
 * Premium animations and scroll effects
 */

(function() {
  'use strict';

  // ===== SCROLL REVEAL ANIMATIONS =====
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.service-card, .project-card, .card, .education-item, .background-item');
    
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Add stagger effect
          setTimeout(() => {
            entry.target.classList.add('reveal-active');
          }, index * 80);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach((el) => {
      el.classList.add('reveal-item');
      observer.observe(el);
    });
  }

  // ===== PARALLAX EFFECT FOR HERO =====
  function initParallax() {
    // Disabled - causes text overlap issues
    return;
  }

  // ===== ENHANCED HOVER GLOW FOR CARDS =====
  function initCardGlow() {
    const cards = document.querySelectorAll('.service-card, .project-card');
    
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }

  // ===== SMOOTH NAVIGATION WITH OFFSET =====
  function initSmoothNav() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '') return;
        
        const target = document.querySelector(href);
        if (!target) return;
        
        e.preventDefault();
        
        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = target.offsetTop - headerHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      });
    });
  }

  // ===== HEADER FADE ON SCROLL =====
  function initHeaderFade() {
    const header = document.querySelector('header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll <= 0) {
        header.style.transform = 'translateY(0)';
        header.style.opacity = '1';
      } else if (currentScroll > lastScroll && currentScroll > 100) {
        // Scrolling down
        header.style.transform = 'translateY(-100%)';
        header.style.opacity = '0.95';
      } else {
        // Scrolling up
        header.style.transform = 'translateY(0)';
        header.style.opacity = '1';
      }
      
      lastScroll = currentScroll;
    });
  }

  // ===== ANIMATED COUNTER FOR NUMBERS =====
  function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      element.textContent = value;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const endValue = parseInt(target.getAttribute('data-count'));
          animateValue(target, 0, endValue, 2000);
          observer.unobserve(target);
        }
      });
    }, observerOptions);

    counters.forEach(counter => observer.observe(counter));
  }

  // ===== CURSOR GLOW EFFECT =====
  function initCursorGlow() {
    const cursorGlow = document.createElement('div');
    cursorGlow.className = 'cursor-glow';
    document.body.appendChild(cursorGlow);

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;
    
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateGlow() {
      glowX += (mouseX - glowX) * 0.1;
      glowY += (mouseY - glowY) * 0.1;
      
      cursorGlow.style.left = glowX + 'px';
      cursorGlow.style.top = glowY + 'px';
      
      requestAnimationFrame(animateGlow);
    }
    
    animateGlow();
  }

  // ===== INITIALIZE ALL EFFECTS =====
  function init() {
    // Wait for DOM and profile data to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // Initialize effects with small delays to ensure content is rendered
    setTimeout(() => {
      initScrollReveal();
      initCardGlow();
      initSmoothNav();
      initHeaderFade();
      initCounters();
      initCursorGlow();
      
      // Parallax only on larger screens
      if (window.innerWidth > 768) {
        initParallax();
      }
    }, 500);
  }

  init();
})();
