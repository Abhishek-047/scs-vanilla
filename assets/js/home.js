/**
 * SCS Platform - Premium 3D Cyberpunk Home Page
 * Hero animations, typing effects, 3D mouse interaction, glitch effects
 */

(function() {
  'use strict';

  // ===== ON PAGE LOAD =====
  window.addEventListener('load', () => {
    initHeroAnimations();
    initTypingEffect();
    initCyberGlitch();
    initHeroScreen();
    init3DInteraction();
    initScrollEffects();
  });

  // ===== HERO ANIMATIONS ON LOAD =====
  function initHeroAnimations() {
    const srElements = document.querySelectorAll('.hero .sr');
    srElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, 300 + index * 150);
    });

    // Animate cyber letters
    animateCyberLetters();
  }

  // ===== CYBER TEXT LETTER ANIMATION =====
  function animateCyberLetters() {
    const cyberText = document.getElementById('cyber-text');
    if (!cyberText) return;

    const text = cyberText.textContent;
    cyberText.innerHTML = '';
    
    // Split into letters with spans
    text.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'letter';
      span.textContent = char;
      span.style.transitionDelay = (i * 0.08) + 's';
      cyberText.appendChild(span);
    });

    // Trigger animation after a short delay
    setTimeout(() => {
      cyberText.classList.add('animated');
    }, 500);
  }

  // ===== TYPING EFFECT =====
  const typingWords = ['Secure', 'Protect', 'Defend', 'Hack'];
  let typingIndex = 0;
  let typingCharIndex = 0;
  let isDeleting = false;
  const typingElement = document.getElementById('typing-text');

  function initTypingEffect() {
    if (!typingElement) return;
    typeText();
  }

  function typeText() {
    const currentWord = typingWords[typingIndex];
    
    if (isDeleting) {
      typingElement.textContent = currentWord.substring(0, typingCharIndex - 1);
      typingCharIndex--;
    } else {
      typingElement.textContent = currentWord.substring(0, typingCharIndex + 1);
      typingCharIndex++;
    }

    let typeSpeed = isDeleting ? 25 : 50;

    if (!isDeleting && typingCharIndex === currentWord.length) {
      // Word complete - pause before deleting
      typeSpeed = 2000;
      isDeleting = true;
    } else if (isDeleting && typingCharIndex === 0) {
      // Word deleted - move to next word
      isDeleting = false;
      typingIndex = (typingIndex + 1) % typingWords.length;
      typeSpeed = 500;
    }

    setTimeout(typeText, typeSpeed);
  }

  // ===== CYBER GLITCH EFFECT =====
  function initCyberGlitch() {
    const cyberText = document.getElementById('cyber-text');
    if (!cyberText) return;

    // Random glitch every 3-8 seconds
    function randomGlitch() {
      const delay = 3000 + Math.random() * 5000;
      
      setTimeout(() => {
        cyberText.classList.add('glitch');
        
        // Add RGB split
        cyberText.style.animation = 'glitch-rgb 0.2s ease-in-out';
        
        setTimeout(() => {
          cyberText.classList.remove('glitch');
          cyberText.style.animation = '';
        }, 300);
        
        randomGlitch();
      }, delay);
    }

    // Start glitch after initial animation
    setTimeout(randomGlitch, 3000);
  }

  // ===== HERO SCREEN TERMINAL =====
  const terminalLines = [
    { text: '$ connecting to SCS network...', delay: 500, type: 'prompt' },
    { text: '✓ Connection established', delay: 1200, type: 'success' },
    { text: '$ scs status --verbose', delay: 1800, type: 'prompt' },
    { text: 'SYSTEM: ONLINE', delay: 2500, type: 'info' },
    { text: 'MEMBERS: 47 active', delay: 2800, type: 'info' },
    { text: 'PROJECTS: 4 running', delay: 3100, type: 'info' },
    { text: 'CVEs: 72 discovered', delay: 3400, type: 'info' },
    { text: '$ init security scan...', delay: 4200, type: 'prompt' },
    { text: '▓▓▓▓▓▓▓▓▓▓ 100%', delay: 5500, type: 'success' },
    { text: '✓ All systems secure', delay: 5800, type: 'success' },
    { text: '$ _', delay: 6200, type: 'prompt' }
  ];

  function initHeroScreen() {
    const screenContent = document.getElementById('screen-content');
    if (!screenContent) return;

    // Add lines with delay
    terminalLines.forEach((line, index) => {
      setTimeout(() => {
        const lineEl = document.createElement('div');
        lineEl.className = `hero-screen-line ${line.type}`;
        lineEl.textContent = line.text;
        screenContent.appendChild(lineEl);
        
        // Auto-scroll
        screenContent.scrollTop = screenContent.scrollHeight;
      }, line.delay);
    });

    // Keep adding random status lines
    setTimeout(continueTerminalOutput, 7000);
  }

  const statusMessages = [
    '$ monitoring network traffic...',
    '$ checking for vulnerabilities...',
    '$ updating threat database...',
    '$ scanning dark web...',
    '$ analyzing malware samples...',
    '$ processing threat intelligence...',
    '$ _'
  ];

  let statusIndex = 0;
  function continueTerminalOutput() {
    const screenContent = document.getElementById('screen-content');
    if (!screenContent) return;

    // Rotate through status messages
    const lineEl = document.createElement('div');
    lineEl.className = 'hero-screen-line prompt';
    lineEl.textContent = statusMessages[statusIndex];
    screenContent.appendChild(lineEl);
    
    statusIndex = (statusIndex + 1) % statusMessages.length;
    
    // Auto-scroll
    screenContent.scrollTop = screenContent.scrollHeight;

    // Continue every 3-5 seconds
    setTimeout(continueTerminalOutput, 3000 + Math.random() * 2000);
  }

  // ===== 3D MOUSE INTERACTION =====
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  const heroWrapper = document.getElementById('hero-wrapper');
  const heroScreen = document.getElementById('hero-screen');

  function init3DInteraction() {
    if (!heroWrapper) return;

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Normalize to -1 to 1
      mouseX = ((e.clientX / windowWidth) - 0.5) * 2;
      mouseY = ((e.clientY / windowHeight) - 0.5) * 2;
    });

    // Smooth lerp animation
    function animate3D() {
      // Lerp towards target
      targetX += (mouseX - targetX) * 0.08;
      targetY += (mouseY - targetY) * 0.08;

      // Apply subtle rotation to hero wrapper
      if (heroWrapper) {
        heroWrapper.style.transform = 
          `rotateY(${targetX * 3}deg) rotateX(${-targetY * 3}deg)`;
      }

      // Apply stronger effect to screen
      if (heroScreen) {
        const screenX = targetX * 8;
        const screenY = targetY * 8;
        heroScreen.style.transform = 
          `perspective(1000px) rotateY(${screenX}deg) rotateX(${-screenY}deg)`;
      }

      requestAnimationFrame(animate3D);
    }

    animate3D();
  }

  // ===== SCROLL EFFECTS =====
  function initScrollEffects() {
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress (0 to 1)
      const progress = Math.min(scrollY / (windowHeight * 0.5), 1);
      
      // Scale down hero as user scrolls
      if (heroWrapper) {
        const scale = 1 - (progress * 0.3);
        const opacity = 1 - progress;
        
        heroWrapper.style.transform += ` scale(${scale})`;
        heroWrapper.style.opacity = opacity;
      }

      // Add blur effect
      if (progress > 0.3) {
        heroSection.style.backdropFilter = `blur(${progress * 10}px)`;
      }
    });
  }

  // ===== EASTER EGG: Double click logo =====
  const navLogo = document.getElementById('nav-logo');
  if (navLogo) {
    navLogo.addEventListener('dblclick', () => {
      document.body.style.animation = 'glitch 0.2s ease';
      setTimeout(() => {
        document.body.style.animation = '';
      }, 200);
    });
  }

  // ===== EASTER EGG: Type "scs" =====
  let typedBuffer = '';
  const scsSecret = 'scs';
  
  document.addEventListener('keypress', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    typedBuffer += e.key.toLowerCase();
    
    if (typedBuffer.length > scsSecret.length) {
      typedBuffer = typedBuffer.slice(-scsSecret.length);
    }
    
    if (typedBuffer === scsSecret) {
      document.body.style.filter = 'invert(1)';
      setTimeout(() => {
        document.body.style.filter = '';
        window.location.href = 'terminal.html';
      }, 300);
      typedBuffer = '';
    }
  });

})();
