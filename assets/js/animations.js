/**
 * SCS Platform - Premium Animations (Awwwards Level)
 * Preloader, split text, mouse reactive, parallax, tilt, matrix rain
 */

(function() {
  'use strict';

  // ===== PRELOADER =====
  function initPreloader() {
    var preloader = document.getElementById('preloader');
    if (!preloader) return;

    var messages = [
      'Initializing SCS...',
      'Decrypting modules...',
      'Establishing connection...',
      'Access Granted.'
    ];

    var messageEl = preloader.querySelector('.preloader-message');
    var progressEl = preloader.querySelector('.preloader-progress');
    var progressBar = preloader.querySelector('.preloader-bar');
    var messageIndex = 0;
    var progress = 0;

    function updateProgress() {
      progress += Math.random() * 20 + 10;
      if (progress >= 100) progress = 100;
      
      progressEl.textContent = Math.floor(progress) + '%';
      progressBar.style.width = progress + '%';

      if (progress < 100) {
        setTimeout(updateProgress, 100 + Math.random() * 150);
      } else {
        // Done - hide preloader
        setTimeout(function() {
          preloader.classList.add('loaded');
          document.body.classList.add('loaded');
          
          // Trigger hero animations
          setTimeout(function() {
            initHeroAnimations();
          }, 200);
        }, 300);
      }
    }

    function showNextMessage() {
      if (messageIndex < messages.length) {
        messageEl.style.opacity = '0';
        messageEl.style.transform = 'translateY(10px)';
        
        setTimeout(function() {
          messageEl.textContent = messages[messageIndex];
          messageEl.style.opacity = '1';
          messageEl.style.transform = 'translateY(0)';
          messageIndex++;
          
          if (messageIndex < messages.length) {
            setTimeout(showNextMessage, 300 + Math.random() * 200);
          }
        }, 150);
      }
    }

    // Start preloader sequence
    showNextMessage();
    updateProgress();
  }

  // ===== HERO SPLIT TEXT ANIMATION =====
  function initHeroAnimations() {
    var heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;

    var accentEl = heroTitle.querySelector('.accent');
    if (!accentEl) return;

    // Get the text and split into letters
    var text = accentEl.textContent;
    accentEl.innerHTML = '';

    // Create letter spans
    for (var i = 0; i < text.length; i++) {
      var span = document.createElement('span');
      span.className = 'hero-letter';
      span.textContent = text[i];
      span.style.animationDelay = (i * 0.08) + 's';
      accentEl.appendChild(span);
    }

    // Add visible class after animation
    setTimeout(function() {
      heroTitle.classList.add('letters-animated');
    }, text.length * 80 + 500);
  }

  // ===== MOUSE REACTIVE GLOW =====
  function initMouseGlow() {
    var hero = document.getElementById('hero');
    var glowElement = document.querySelector('.hero-glow-1');
    
    if (!hero || !glowElement) return;

    var mouseX = 0;
    var mouseY = 0;
    var currentX = 0;
    var currentY = 0;

    document.addEventListener('mousemove', function(e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function animate() {
      // Lerp towards mouse position
      currentX += (mouseX * 30 - currentX) * 0.08;
      currentY += (mouseY * 30 - currentY) * 0.08;

      glowElement.style.transform = 'translate(' + currentX + 'px, ' + currentY + 'px)';
      glowElement.style.background = 'radial-gradient(600px circle at ' + 
        (50 + mouseX * 20) + '% ' + 
        (50 + mouseY * 20) + '%, ' +
        'rgba(200,255,0,0.15), transparent 50%)';

      requestAnimationFrame(animate);
    }

    animate();
  }

  // ===== HERO PARALLAX =====
  function initHeroParallax() {
    var hero = document.getElementById('hero');
    if (!hero) return;

    var heroContent = hero.querySelector('.hero-content');
    var heroGlows = hero.querySelectorAll('.hero-glow');

    var mouseX = 0;
    var mouseY = 0;

    document.addEventListener('mousemove', function(e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function animate() {
      // Content parallax (opposite direction, subtle)
      if (heroContent) {
        heroContent.style.transform = 'translate(' + (-mouseX * 5) + 'px, ' + (-mouseY * 5) + 'px)';
      }

      // Glows parallax (different speeds)
      heroGlows.forEach(function(glow, index) {
        var speed = (index + 1) * 8;
        var x = mouseX * speed;
        var y = mouseY * speed;
        glow.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
      });

      requestAnimationFrame(animate);
    }

    animate();
  }

  // ===== SMOOTH SCROLL =====
  function initSmoothScroll() {
    var scrollTarget = 0;
    var currentScroll = 0;
    var ease = 0.08;

    function update() {
      currentScroll += (scrollTarget - currentScroll) * ease;
      
      if (Math.abs(scrollTarget - currentScroll) > 0.5) {
        window.scrollTo(0, currentScroll);
        requestAnimationFrame(update);
      } else {
        window.scrollTo(0, scrollTarget);
      }
    }

    document.querySelectorAll('a[href^="#"]').forEach(function(link) {
      link.addEventListener('click', function(e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        e.preventDefault();
        var target = document.querySelector(targetId);
        
        if (target) {
          scrollTarget = target.getBoundingClientRect().top + window.pageYOffset;
          update();
        }
      });
    });
  }

  // ===== SECTION PARALLAX =====
  function initSectionParallax() {
    var sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', function() {
      var scrolled = window.pageYOffset;
      
      sections.forEach(function(section) {
        var speed = 0.05;
        var offset = section.offsetTop;
        var yPos = -(scrolled - offset) * speed;
        
        // Only apply if visible
        if (scrolled + window.innerHeight > offset && scrolled < offset + section.offsetHeight) {
          // Subtle parallax on section elements
          var content = section.querySelector('.container');
          if (content) {
            content.style.transform = 'translateY(' + (scrolled * speed * 0.1) + 'px)';
          }
        }
      });
    }, { passive: true });
  }

  // ===== CARD TILT EFFECT =====
  function initCardTilt() {
    var cards = document.querySelectorAll('.team-card, .project-card, .event-card, .resource-card');
    
    cards.forEach(function(card) {
      card.addEventListener('mousemove', function(e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;
        
        var rotateX = (y - centerY) / 10;
        var rotateY = (centerX - x) / 10;

        card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.02)';
        card.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 30px rgba(200,255,0,' + (1 - Math.abs(rotateX + rotateY) / 50) * 0.1 + ')';
      });

      card.addEventListener('mouseleave', function() {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        card.style.boxShadow = '';
      });
    });
  }

  // ===== MAGNETIC CURSOR ON BUTTONS =====
  function initMagneticCursor() {
    var buttons = document.querySelectorAll('a, button, .nav-link, .term-cmd');
    var cursor = document.getElementById('c-dot');
    var cursorRing = document.getElementById('c-ring');
    
    if (!cursor || !cursorRing) return;

    buttons.forEach(function(btn) {
      btn.addEventListener('mouseenter', function() {
        cursor.classList.add('magnetic');
        cursorRing.classList.add('magnetic');
      });

      btn.addEventListener('mouseleave', function() {
        cursor.classList.remove('magnetic');
        cursorRing.classList.remove('magnetic');
      });
    });
  }

  // ===== MATRIX RAIN EASTER EGG =====
  function initMatrixRain() {
    var canvas = document.getElementById('matrix-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'matrix-canvas';
      canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;opacity:0;transition:opacity 0.5s;';
      document.body.appendChild(canvas);
    }

    var ctx = canvas.getContext('2d');
    var konamiCode = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    var keyIndex = 0;
    var isMatrixActive = false;
    var columns = [];
    var fontSize = 14;
    var drops = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = [];
      for (var i = 0; i < columns; i++) {
        drops[i] = 1;
      }
    }

    function drawMatrix() {
      if (!isMatrixActive) return;

      ctx.fillStyle = 'rgba(5, 5, 8, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0';
      ctx.font = fontSize + 'px monospace';

      for (var i = 0; i < drops.length; i++) {
        var text = String.fromCharCode(33 + Math.random() * 93);
        var x = i * fontSize;
        var y = drops[i] * fontSize;

        // Green gradient effect
        var alpha = Math.random() * 0.5 + 0.5;
        ctx.fillStyle = 'rgba(0, 255, 0, ' + alpha + ')';
        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      requestAnimationFrame(drawMatrix);
    }

    function triggerMatrix() {
      if (isMatrixActive) return;
      
      isMatrixActive = true;
      resize();
      canvas.style.opacity = '1';
      
      // Glitch effect
      document.body.style.animation = 'glitch 0.1s ease-in-out';
      setTimeout(function() {
        document.body.style.animation = '';
      }, 100);

      drawMatrix();

      // Stop after 4 seconds
      setTimeout(function() {
        isMatrixActive = false;
        canvas.style.opacity = '0';
      }, 4000);
    }

    // Listen for Konami code
    document.addEventListener('keydown', function(e) {
      if (e.key === konamiCode[keyIndex]) {
        keyIndex++;
        if (keyIndex === konamiCode.length) {
          keyIndex = 0;
          triggerMatrix();
        }
      } else {
        keyIndex = 0;
      }
    });

    window.addEventListener('resize', resize);
  }

  // ===== SCROLL REVEAL =====
  function initScrollReveal() {
    var srElements = document.querySelectorAll('.sr');
    if (srElements.length === 0) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          // Add scale effect on entry
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0) scale(1)';
          
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    srElements.forEach(function(el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px) scale(0.95)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      observer.observe(el);
    });
  }

  // ===== COUNT UP ANIMATION =====
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var duration = 2000;
    var startTime = performance.now();
    var isDecimal = el.getAttribute('data-decimal') === 'true';

    function update(currentTime) {
      var elapsed = currentTime - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = target * eased;

      el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = isDecimal ? target.toFixed(1) : target;
      }
    }

    requestAnimationFrame(update);
  }

  function initCountUp() {
    var countElements = document.querySelectorAll('[data-count]');
    if (countElements.length === 0) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    countElements.forEach(function(el) {
      observer.observe(el);
    });
  }

  // ===== TYPING EFFECT FOR HERO =====
  function initHeroTyping() {
    var typingElement = document.getElementById('hero-typing');
    if (!typingElement) return;

    var texts = ['Secure', 'Protect', 'Defend', 'Hack'];
    var textIndex = 0;
    var charIndex = 0;
    var isDeleting = false;
    var typingSpeed = 150;
    var deletingSpeed = 50;
    var pauseTime = 2000;

    function type() {
      var currentText = texts[textIndex];

      if (!isDeleting) {
        typingElement.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === currentText.length) {
          setTimeout(function() {
            isDeleting = true;
            type();
          }, pauseTime);
          return;
        }

        setTimeout(type, typingSpeed);
      } else {
        typingElement.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          textIndex = (textIndex + 1) % texts.length;
          setTimeout(type, 500);
          return;
        }

        setTimeout(type, deletingSpeed);
      }
    }

    setTimeout(type, 2000);
  }

  // ===== NAVBAR SCROLL EFFECT =====
  function initNavbarScroll() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', function() {
      var currentScroll = window.pageYOffset;
      if (currentScroll > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // ===== INITIALIZE ALL =====
  document.addEventListener('DOMContentLoaded', function() {
    initPreloader();
    initScrollReveal();
    initCountUp();
    initHeroTyping();
    initNavbarScroll();
    initMouseGlow();
    initHeroParallax();
    initSmoothScroll();
    initSectionParallax();
    initCardTilt();
    initMagneticCursor();
    initMatrixRain();
  });

  window.addEventListener('load', function() {
    initCountUp();
  });

})();
