/**
 * SCS Platform - Premium Custom Cursor
 * Creates a dot that follows the mouse instantly and a ring that lags behind with smooth lerp
 */

(function() {
  'use strict';

  const cDot = document.getElementById('c-dot');
  const cRing = document.getElementById('c-ring');

  if (!cDot || !cRing) return;

  // Skip on touch devices
  if (window.matchMedia('(pointer: coarse)').matches) {
    cDot.style.display = 'none';
    cRing.style.display = 'none';
    return;
  }

  // Initialize positions at center of viewport
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  // Set initial positions
  cDot.style.left = mouseX + 'px';
  cDot.style.top = mouseY + 'px';
  cRing.style.left = ringX + 'px';
  cRing.style.top = ringY + 'px';

  // Lerp factor - smooth delay for ring
  const lerpFactor = 0.15;

  // Track mouse position
  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Instantly move the dot
    cDot.style.left = mouseX + 'px';
    cDot.style.top = mouseY + 'px';
  });

  // Animation loop for ring - requestAnimationFrame for 60fps
  function animate() {
    // Lerp the ring position towards mouse
    ringX += (mouseX - ringX) * lerpFactor;
    ringY += (mouseY - ringY) * lerpFactor;

    cRing.style.left = ringX + 'px';
    cRing.style.top = ringY + 'px';

    requestAnimationFrame(animate);
  }

  // Start the animation loop
  animate();

  // Hover effects on interactive elements
  var hoverSelectors = [
    'a',
    'button',
    '.card',
    '.team-card',
    '.project-card',
    '.event-card',
    '.resource-card',
    '.btn-fill',
    '.btn-ghost',
    '.nav-link',
    '.term-cmd',
    '[data-hover]',
    'input',
    'textarea',
    'select'
  ].join(', ');

  document.addEventListener('mouseover', function(e) {
    if (e.target.closest(hoverSelectors)) {
      // Scale up dot
      cDot.style.transform = 'translate(-50%, -50%) scale(2.5)';
      // Change color to plasma
      cDot.style.background = 'var(--plasma)';
      // Add ring hover effect
      cRing.classList.add('hover');
    }
  });

  document.addEventListener('mouseout', function(e) {
    if (e.target.closest(hoverSelectors)) {
      // Reset dot
      cDot.style.transform = 'translate(-50%, -50%) scale(1)';
      // Reset color to acid
      cDot.style.background = 'var(--acid)';
      // Remove ring hover effect
      cRing.classList.remove('hover');
    }
  });

  // Hide cursor when leaving the window
  document.addEventListener('mouseleave', function() {
    cDot.style.opacity = '0';
    cRing.style.opacity = '0';
  });

  document.addEventListener('mouseenter', function() {
    cDot.style.opacity = '1';
    cRing.style.opacity = '1';
  });

})();
