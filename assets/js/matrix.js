/**
 * SCS Platform - Matrix Rain Effect
 * Easter egg for terminal page
 */

(function() {
  'use strict';

  var canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var isActive = false;
  var animationId = null;

  // Matrix characters
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  var charArray = chars.split('');

  var fontSize = 14;
  var columns = 0;
  var drops = [];

  function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    columns = Math.floor(canvas.width / fontSize);
    drops = [];
    
    for (var i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }
  }

  function draw() {
    // Semi-transparent black to create trail effect
    ctx.fillStyle = 'rgba(5, 5, 8, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Green text
    ctx.fillStyle = '#0f0';
    ctx.font = fontSize + 'px JetBrains Mono';

    for (var i = 0; i < drops.length; i++) {
      var char = charArray[Math.floor(Math.random() * charArray.length)];
      
      // Varying shades of green
      var opacity = Math.random() * 0.5 + 0.5;
      ctx.fillStyle = 'rgba(0, 255, 0, ' + opacity + ')';
      
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);

      // Reset drop to top randomly after it crosses screen
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }

      drops[i]++;
    }
  }

  function start() {
    if (isActive) return;
    isActive = true;
    canvas.classList.add('active');
    
    init();
    
    function loop() {
      if (!isActive) return;
      draw();
      animationId = requestAnimationFrame(loop);
    }
    
    loop();
  }

  function stop() {
    isActive = false;
    canvas.classList.remove('active');
    
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    
    // Clear canvas
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Auto-trigger on Konami code
  var konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  var konamiIndex = 0;

  document.addEventListener('keydown', function(e) {
    if (e.code === konamiCode[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        // Trigger matrix effect for 4 seconds
        start();
        setTimeout(stop, 4000);
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });

  // Also expose for terminal command
  window.triggerMatrix = start;

  // Handle resize
  window.addEventListener('resize', function() {
    if (isActive) {
      init();
    }
  });

})();
