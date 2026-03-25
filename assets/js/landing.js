/**
 * SCS Platform - Story-Driven Landing Page
 * Advanced Scroll-Based Cinematic Experience
 */

(function() {
  'use strict';

  // Constants & LERP
  const LERP_FACTOR = 0.08;
  const ZOOM_ORIGIN = { x: 65, y: 65 }; // Rough laptop screen position %

  // State
  let state = {
    mouseX: 0,
    mouseY: 0,
    targetMouseX: 0,
    targetMouseY: 0,
    scroll: 0,
    targetScroll: 0,
    isTerminalActive: false,
    terminalTriggered: false,
    videoScale: 1.4,
    targetVideoScale: 1.0
  };

  // Elements
  const els = {
    storyContainer: document.getElementById('story-container'),
    hackerVideoContainer: document.querySelector('.hero-bg'),
    hackerVideo: document.getElementById('hackerVideo'),
    hackerOverlay: document.querySelector('.overlay'),
    cyberText: document.querySelector('.title-cyber'),
    typingText: document.getElementById('landing-typing-text'),
    heroContent: document.getElementById('hero-content'),
    heroText: document.getElementById('hero-text'),
    globeContainer: document.getElementById('globe-container'),
    scrollIndicator: document.getElementById('scroll-indicator'),
    terminalSection: document.getElementById('terminal-section'),
    matrixCanvas: document.getElementById('matrix-canvas'),
    exitBtn: document.querySelector('.landing-exit'),
    magneticBtns: document.querySelectorAll('.magnetic-btn'),
    revealElements: document.querySelectorAll('.sr')
  };

  function init() {
    initScrollAndMouseTracker();
    initTypingEffect();
    initGlitchEffect();
    initAnimationsLoop();
    initTerminalExit();
    initEasterEggs();
    initMagneticButtons();
    initScrollReveals();
  }

  // ===== 1. TRACKERS =====
  function initScrollAndMouseTracker() {
    document.addEventListener('mousemove', (e) => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      state.targetMouseX = ((e.clientX / windowWidth) - 0.5) * 2;
      state.targetMouseY = ((e.clientY / windowHeight) - 0.5) * 2;
    }, { passive: true });

    window.addEventListener('scroll', () => {
      state.targetScroll = window.scrollY;
    }, { passive: true });
    
    // Set initial scroll
    state.scroll = window.scrollY;
    state.targetScroll = window.scrollY;
  }

  // ===== 2. ANIMATION LOOP (RequestAnimationFrame) =====
  function initAnimationsLoop() {
    function animate() {
      // Lerp mouse
      state.mouseX += (state.targetMouseX - state.mouseX) * LERP_FACTOR;
      state.mouseY += (state.targetMouseY - state.mouseY) * LERP_FACTOR;

      // Lerp scroll
      state.scroll += (state.targetScroll - state.scroll) * LERP_FACTOR;

      applyParallaxAndGlow();
      applyScrollStory();

      requestAnimationFrame(animate);
    }
    animate();
  }

  function applyParallaxAndGlow() {
    // Scale animation
    state.videoScale += (state.targetVideoScale - state.videoScale) * (LERP_FACTOR * 0.4);

    if (els.hackerVideoContainer) {
      const moveX = state.mouseX * 20;
      const moveY = state.mouseY * 20;
      els.hackerVideoContainer.style.transform = `translate(${moveX}px, ${moveY}px) scale(${state.videoScale})`;
    }
  }

  function applyScrollStory() {
    if (!els.storyContainer) return;
    
    const windowHeight = window.innerHeight;
    const scrollMax = windowHeight * 3; 
    
    let rawProgress = state.scroll / scrollMax;
    let progress = Math.max(0, Math.min(1, rawProgress));

    // Phase 1 (0.0 to 0.33): Normal
    // Phase 2 (0.33 to 0.66): Slight zoom
    // Phase 3 (0.66 to 1.0): Strong zoom, fade bg, transition section
    
    let p1 = Math.min(progress / 0.33, 1);
    let p2 = Math.max(0, Math.min((progress - 0.33) / 0.33, 1));
    let p3 = Math.max(0, Math.min((progress - 0.66) / 0.34, 1));
    
    // Zoom logic
    let currentZoom = 1;
    if (p2 > 0) currentZoom = 1 + p2 * 1.5; // Slight zoom up to 2.5x
    if (p3 > 0) currentZoom = 2.5 + p3 * 15; // Strong zoom into the network
    
    if (window.GlobeSim) {
       window.GlobeSim.setZoom(currentZoom);
    }
    
    // Fade out text/left columns
    let fadeOut = Math.max(0, p2); 
    if (els.heroText) {
      els.heroText.style.opacity = 1 - fadeOut * 2;
      els.heroText.style.transform = `translateX(${-fadeOut * 100}px)`;
    }
    
    if (els.scrollIndicator) {
      els.scrollIndicator.style.opacity = 1 - p1;
    }

    // Globe moves to center slightly
    if (els.globeContainer) {
      let shiftValue = window.innerWidth < 768 ? 0 : (window.innerWidth * 0.15);
      let moveLeft = p1 * shiftValue; 
      els.globeContainer.style.transform = `translateX(${-moveLeft}px)`;
      els.globeContainer.style.opacity = 1 - p3;
    }
    
    let bgFadeOut = Math.max(0, p3);
    if (els.hackerVideo) els.hackerVideo.style.opacity = 1 - bgFadeOut;
    if (els.hackerOverlay) els.hackerOverlay.style.opacity = 1 - bgFadeOut;
    
    // Transition Section (text "> entering secure system...")
    const transitionSection = document.getElementById('transition-section');
    if (transitionSection) {
       // Fade in during first half of Phase 3, fade out at end of Phase 3
       let tOp = Math.max(0, Math.min((p3 - 0.2) / 0.3, 1)); 
       let tOut = Math.max(0, Math.min((p3 - 0.8) / 0.2, 1));
       transitionSection.style.opacity = tOp * (1 - tOut);
    }

    if (els.terminalSection) {
      let termOp = Math.max(0, Math.min((p3 - 0.9) / 0.1, 1));
      els.terminalSection.style.opacity = termOp;
      
      if (termOp > 0.9) {
        els.terminalSection.style.pointerEvents = 'auto';
        if (els.matrixCanvas) els.matrixCanvas.classList.add('active');
        
        if (!state.terminalTriggered) {
          state.terminalTriggered = true;
          const termInput = document.getElementById('term-input');
          if (termInput) termInput.focus();
        }
      } else {
        els.terminalSection.style.pointerEvents = 'none';
        if (els.matrixCanvas) els.matrixCanvas.classList.remove('active');
        state.terminalTriggered = false;
      }
    }
  }



  // ===== 4. EFFECTS & UTILS =====
  function initTypingEffect() {
    const fullText = "Secure. Protect. Exploit. Repeat.";
    let charIndex = 0;

    if (!els.typingText) return;

    function typeLoop() {
      els.typingText.textContent = fullText.substring(0, charIndex);
      
      if (charIndex < fullText.length) {
        charIndex++;
        // Slight randomness in typing speed
        const speed = 50 + Math.random() * 50;
        setTimeout(typeLoop, speed);
      } else {
        // Done typing, maybe blink cursor indefinitely
      }
    }
    
    // Start after a short delay
    setTimeout(typeLoop, 800);
  }



  function initGlitchEffect() {
    if (!els.cyberText) return;
    function randomGlitch() {
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        els.cyberText.classList.add('glitch-active');
        setTimeout(() => {
          if(Math.random() > 0.5) els.cyberText.classList.remove('glitch-active');
          setTimeout(() => {
            els.cyberText.classList.remove('glitch-active');
          }, 100);
        }, 150);
        randomGlitch();
      }, delay);
    }
    setTimeout(randomGlitch, 1000);
  }

  function initMagneticButtons() {
    els.magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.setProperty('--tx', `${x * 0.3}px`);
        btn.style.setProperty('--ty', `${y * 0.3}px`);
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.setProperty('--tx', '0px');
        btn.style.setProperty('--ty', '0px');
      });
    });
  }

  function initScrollReveals() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Only once
          // observer.unobserve(entry.target); 
        }
      });
    }, { threshold: 0.1 });

    els.revealElements.forEach(el => {
      // Except those in the hero which are visible by default
      if (!el.closest('.landing-hero')) {
        observer.observe(el);
      }
    });

    // Add visible class styling if it doesn't exist
    const style = document.createElement('style');
    style.textContent = `
      .sr { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.1, 0.5, 0.3, 1); }
      .sr.visible { opacity: 1; transform: translateY(0); }
      .d1 { transition-delay: 0.1s; }
      .d2 { transition-delay: 0.2s; }
      .d3 { transition-delay: 0.3s; }
      .d4 { transition-delay: 0.4s; }
    `;
    document.head.appendChild(style);
  }

  function initEasterEggs() {
    const navLogo = document.getElementById('nav-logo');
    if (navLogo) {
      navLogo.addEventListener('dblclick', () => {
        document.body.style.animation = 'glitch 0.2s ease';
        setTimeout(() => document.body.style.animation = '', 200);
      });
    }

    let typedBuffer = '';
    const scsSecret = 'scs';
    document.addEventListener('keypress', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      typedBuffer += e.key.toLowerCase();
      if (typedBuffer.length > scsSecret.length) typedBuffer = typedBuffer.slice(-scsSecret.length);
      if (typedBuffer === scsSecret) {
        document.body.style.filter = 'invert(1)';
        setTimeout(() => {
          document.body.style.filter = '';
          window.location.href = 'terminal.html';
        }, 300);
        typedBuffer = '';
      }
    });
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
