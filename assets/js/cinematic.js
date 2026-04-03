/**
 * SCS — CINEMATIC 3D SCROLL ENGINE v4.0
 * ─────────────────────────────────────────────────────────────
 * Features:
 *  • Three.js starfield / particle system background
 *  • 3D perspective-driven scene transitions
 *  • Smooth lerp scroll (fixed parallax overwrite bug)
 *  • CSS 3D tilt on holo-panels via mouse tracking
 *  • Matrix rain canvas
 *  • Full terminal engine with command history
 *  • Real-time clock, session ID, live stat counters
 *  • Magnetic cursor with hover states
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ════════════════════════════════════════════════════
     CONSTANTS
     ════════════════════════════════════════════════════ */
  const SCROLL_LERP = 0.12;   // smooth scroll factor
  const MOUSE_LERP  = 0.08;   // cursor lag factor
  const SCENE_COUNT = 4;

  /* ════════════════════════════════════════════════════
     STATE
     ════════════════════════════════════════════════════ */
  const st = {
    scrollY: 0,
    targetScrollY: 0,
    mouseX: 0, mouseY: 0,
    targetMouseX: window.innerWidth  / 2,
    targetMouseY: window.innerHeight / 2,
    nX: 0, nY: 0,          // normalised mouse [-1,1]
    targetNX: 0, targetNY: 0,
    scene: 0,
    matrixActive: false,
    terminalReady: false,
    terminalBooted: false,
    cmdHistory: [],
    cmdHistoryIdx: -1,
    currentCmd: '',
    raf: null,
  };

  /* ════════════════════════════════════════════════════
     ELEMENT CACHE
     ════════════════════════════════════════════════════ */
  let els = {};

  function resolveEls() {
    els = {
      bgCanvas:      document.getElementById('cin-bg-canvas'),
      splineRoom:    document.getElementById('cin-room'),
      splineGlobe:   document.getElementById('cin-globe'),
      scene1:        document.getElementById('cin-s1'),
      scene2ui:      document.getElementById('cin-s2'),
      holoPanel:     document.getElementById('cin-s3'),
      termOverlay:   document.getElementById('cin-term'),
      enteringText:  document.getElementById('cin-entering'),
      matrixCanvas:  document.getElementById('cin-matrix'),
      termBody:      document.getElementById('cin-term-body'),
      termInput:     document.getElementById('cin-term-input'),
      termOutput:    document.getElementById('cin-term-output'),
      cursorDot:     document.getElementById('cin-cursor-dot'),
      cursorRing:    document.getElementById('cin-cursor-ring'),
      progressDots:  document.querySelectorAll('.cin-progress-dot'),
      miniCards:     document.querySelectorAll('.cin-mini-card'),
      holoPanels:    document.querySelectorAll('.cin-holo-panel'),
      gridCanvas:    document.getElementById('cin-grid-canvas'),
    };
  }

  /* ════════════════════════════════════════════════════
     MATH HELPERS
     ════════════════════════════════════════════════════ */
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  function sceneProgress(p, start, end) {
    return clamp((p - start) / (end - start), 0, 1);
  }

  /* ════════════════════════════════════════════════════
     SCROLL
     ════════════════════════════════════════════════════ */
  function initScroll() {
    const onScroll = () => { st.targetScrollY = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    st.scrollY = st.targetScrollY = window.scrollY;
  }

  function calcProgress() {
    const max = window.innerHeight * 4;
    return clamp(st.scrollY / max, 0, 1);
  }

  /* ════════════════════════════════════════════════════
     MOUSE + CURSOR
     ════════════════════════════════════════════════════ */
  function initMouse() {
    document.addEventListener('mousemove', (e) => {
      st.targetMouseX = e.clientX;
      st.targetMouseY = e.clientY;
      st.targetNX = (e.clientX / window.innerWidth  - 0.5) * 2;
      st.targetNY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    // Cursor hover state
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('a, button, .cin-progress-dot, .cin-term-dot, input')) {
        if (els.cursorRing) els.cursorRing.classList.add('hovering');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, .cin-progress-dot, .cin-term-dot, input')) {
        if (els.cursorRing) els.cursorRing.classList.remove('hovering');
      }
    });
    document.addEventListener('mousedown', () => {
      if (els.cursorRing) els.cursorRing.classList.add('clicking');
    });
    document.addEventListener('mouseup', () => {
      if (els.cursorRing) els.cursorRing.classList.remove('clicking');
    });
  }

  function updateCursor() {
    st.mouseX = lerp(st.mouseX, st.targetMouseX, MOUSE_LERP + 0.05);
    st.mouseY = lerp(st.mouseY, st.targetMouseY, MOUSE_LERP + 0.05);
    st.nX     = lerp(st.nX,     st.targetNX,     MOUSE_LERP);
    st.nY     = lerp(st.nY,     st.targetNY,     MOUSE_LERP);

    if (els.cursorDot) {
      els.cursorDot.style.left = st.mouseX + 'px';
      els.cursorDot.style.top  = st.mouseY + 'px';
    }
    if (els.cursorRing) {
      els.cursorRing.style.left = st.mouseX + 'px';
      els.cursorRing.style.top  = st.mouseY + 'px';
    }
  }

  /* ════════════════════════════════════════════════════
     THREE.JS STARFIELD / PARTICLE BACKGROUND
     ════════════════════════════════════════════════════ */
  function initThreeBackground() {
    // Load Three.js from CDN, then build scene
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
    script.onload = buildThreeScene;
    script.onerror = () => console.warn('Three.js not loaded, skipping starfield');
    document.head.appendChild(script);
  }

  function buildThreeScene() {
    if (typeof THREE === 'undefined') return;

    const canvas = els.bgCanvas;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 600;

    /* ─── STAR PARTICLES ─── */
    const starCount = 1800;
    const starGeo   = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors    = new Float32Array(starCount * 3);
    const sizes     = new Float32Array(starCount);

    const palette = [
      [0.78, 1.0,  0.0],   // acid green
      [0.0,  0.96, 1.0],   // cyan
      [1.0,  1.0,  1.0],   // white
      [0.6,  0.6,  1.0],   // blue-violet
    ];

    for (let i = 0; i < starCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1200 - 200;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = col[0];
      colors[i * 3 + 1] = col[1];
      colors[i * 3 + 2] = col[2];
      sizes[i] = Math.random() * 2.2 + 0.4;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
    starGeo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1));

    const starMat = new THREE.PointsMaterial({
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    // Try to set size from attribute
    starMat.size = 1.5;

    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    /* ─── CONNECTION LINES ─── */
    const lineCount  = 60;
    const lineGeo    = new THREE.BufferGeometry();
    const linePos    = new Float32Array(lineCount * 6);
    const lineColors = new Float32Array(lineCount * 6);

    for (let i = 0; i < lineCount; i++) {
      const x1 = (Math.random() - 0.5) * 1600;
      const y1 = (Math.random() - 0.5) * 900;
      const z1 = (Math.random() - 0.5) * 400 - 100;
      const x2 = x1 + (Math.random() - 0.5) * 300;
      const y2 = y1 + (Math.random() - 0.5) * 200;

      linePos[i * 6]     = x1; linePos[i * 6 + 1] = y1; linePos[i * 6 + 2] = z1;
      linePos[i * 6 + 3] = x2; linePos[i * 6 + 4] = y2; linePos[i * 6 + 5] = z1;

      // Acid green or cyan
      const useAcid = Math.random() > 0.5;
      const r = useAcid ? 0.78 : 0.0;
      const g = useAcid ? 1.0  : 0.96;
      const b = useAcid ? 0.0  : 1.0;
      lineColors[i * 6] = r; lineColors[i * 6 + 1] = g; lineColors[i * 6 + 2] = b;
      lineColors[i * 6 + 3] = r; lineColors[i * 6 + 4] = g; lineColors[i * 6 + 5] = b;
    }

    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    lineGeo.setAttribute('color',    new THREE.BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    /* ─── RESIZE ─── */
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    /* ─── ANIMATE ─── */
    let frame = 0;
    function animateThree() {
      requestAnimationFrame(animateThree);
      frame++;

      // Slow rotation
      stars.rotation.y += 0.00015;
      stars.rotation.x  = st.nY * 0.06;
      lines.rotation.y  = stars.rotation.y;
      lines.rotation.x  = st.nY * 0.04;

      // Camera drift with mouse
      camera.position.x = lerp(camera.position.x, st.nX * 40, 0.02);
      camera.position.y = lerp(camera.position.y, st.nY * -25, 0.02);

      // Pulse opacity based on scroll
      const p = calcProgress();
      starMat.opacity = p > 0.75 ? 0.08 : 0.4 + (1 - p) * 0.35;
      lineMat.opacity = p > 0.75 ? 0.02 : 0.08 + (1 - p) * 0.1;

      renderer.render(scene, camera);
    }
    animateThree();
  }

  /* ════════════════════════════════════════════════════
     3D PERSPECTIVE GRID (Scene 2 floor)
     ════════════════════════════════════════════════════ */
  function initGrid() {
    const gridEl = document.querySelector('.cin-3d-grid');
    if (!gridEl) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'cin-grid-canvas';
    gridEl.appendChild(canvas);
    els.gridCanvas = canvas;

    const ctx = canvas.getContext('2d');
    let w, h;

    function resize() {
      w = canvas.width  = gridEl.offsetWidth;
      h = canvas.height = gridEl.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function drawGrid(opacity) {
      ctx.clearRect(0, 0, w, h);
      const vp = { x: w / 2, y: h * 0.05 }; // vanishing point
      const rows = 16;
      const cols = 24;

      ctx.save();
      ctx.globalAlpha = opacity;

      // Horizontal lines
      for (let r = 0; r <= rows; r++) {
        const t = r / rows;
        const y = vp.y + (h - vp.y) * (t * t);    // perspective squeeze
        const xl = w * (0.5 - t * 0.5);
        const xr = w * (0.5 + t * 0.5);

        const alpha = t * 0.8;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0,245,255,${alpha * 0.25})`;
        ctx.lineWidth = t < 0.3 ? 0.5 : 1;
        ctx.moveTo(xl, y);
        ctx.lineTo(xr, y);
        ctx.stroke();
      }

      // Vertical lines
      for (let c = 0; c <= cols; c++) {
        const t = c / cols;
        const startX = w * t;
        // Find where this line starts at horizon
        const startY = vp.y;
        const endX   = lerp(vp.x, startX, 1);
        const endY   = h;

        const dist = Math.abs(t - 0.5);
        const alpha = 0.2 - dist * 0.15;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0,245,255,${Math.max(0, alpha)})`;
        ctx.lineWidth = 0.5;
        ctx.moveTo(vp.x + (startX - vp.x) * 0, startY);
        ctx.lineTo(startX, endY);
        ctx.stroke();
      }

      // Horizon glow
      const horizGrad = ctx.createLinearGradient(0, vp.y - 2, 0, vp.y + 8);
      horizGrad.addColorStop(0, 'rgba(0,245,255,0)');
      horizGrad.addColorStop(0.5, `rgba(0,245,255,${opacity * 0.4})`);
      horizGrad.addColorStop(1, 'rgba(0,245,255,0)');
      ctx.fillStyle = horizGrad;
      ctx.fillRect(0, vp.y - 2, w, 10);

      ctx.restore();
    }

    // Expose draw function
    els.drawGrid = drawGrid;
  }

  /* ════════════════════════════════════════════════════
     SCENE ENGINE (main render loop)
     ════════════════════════════════════════════════════ */
  function renderFrame() {
    st.scrollY = lerp(st.scrollY, st.targetScrollY, SCROLL_LERP);
    updateCursor();
    applyScenes();
    st.raf = requestAnimationFrame(renderFrame);
  }

  function applyScenes() {
    const p  = calcProgress();
    const s1 = sceneProgress(p, 0,    0.25);
    const s2 = sceneProgress(p, 0.25, 0.50);
    const s3 = sceneProgress(p, 0.50, 0.75);
    const s4 = sceneProgress(p, 0.75, 1.00);

    /* ── Progress indicator ── */
    let activeScene = 0;
    if (p >= 0.75) activeScene = 3;
    else if (p >= 0.50) activeScene = 2;
    else if (p >= 0.25) activeScene = 1;

    if (activeScene !== st.scene) {
      st.scene = activeScene;
      updateProgressDots(activeScene);
    }

    /* ── SPLINE ROOM: 3D zoom-in effect ── */
    if (els.splineRoom) {
      const zoom     = 1 + s2 * 0.14 + s3 * 0.06;
      const roomOp   = clamp(1 - s4 * 2.8, 0, 1);
      const tiltX    = s2 * 3;    // subtle perspective tilt inward
      els.splineRoom.style.transform = `scale(${zoom}) perspective(900px) rotateX(${tiltX}deg)`;
      els.splineRoom.style.opacity   = roomOp;
    }

    /* ── SCENE 1: fade + slide out during s2 ── */
    if (els.scene1) {
      const fadeOut  = clamp(1 - s2 * 2.5, 0, 1);
      const slideX   = easeOut(s2) * -80;
      const tiltY    = s2 * -6;    // 3D rotate out
      els.scene1.style.opacity   = fadeOut;
      els.scene1.style.transform = `translateX(${slideX}px) perspective(600px) rotateY(${tiltY}deg)`;

      // Parallax when scene 1 visible
      if (p < 0.28) {
        const px = st.nX * -12;
        const py = st.nY * -7;
        // Merge with existing transform
        els.scene1.style.transform =
          `translate(${px}px,${py}px) perspective(600px) rotateY(${tiltY}deg)`;
      }
    }

    /* ── HERO MINI CARDS (follow scene1 opacity) ── */
    if (els.miniCards.length) {
      const cardOp = clamp(1 - s2 * 3, 0, 1);
      els.miniCards.forEach(c => {
        c.style.opacity = cardOp;
      });
    }

    /* ── GLOBE: scale in during s2, subtle tilt ── */
    if (els.splineGlobe) {
      const gOp    = clamp(s2 * 3, 0, 1);
      const gScale = 0.4 + s2 * 0.65;
      const gFade  = clamp(1 - (s4 - 0.3) * 3.5, 0, 1);
      const panX   = st.nX * 18;
      const panY   = st.nY * 10;

      els.splineGlobe.style.opacity   = gOp * gFade;
      els.splineGlobe.style.transform =
        `translateY(calc(-50% + ${panY}px)) translateX(${panX}px) scale(${gScale})`;
    }

    /* ── SCENE 2 UI stats ── */
    if (els.scene2ui) {
      const sIn  = clamp(s2 * 3.5, 0, 1);
      const sOut = clamp(1 - s3 * 3.5, 0, 1);
      const slide = (1 - Math.min(s2 * 3.5, 1)) * 35;
      els.scene2ui.style.opacity   = easeOut(sIn) * sOut;
      els.scene2ui.style.transform = `translateY(${slide}px)`;
    }

    /* ── 3D GRID FLOOR ── */
    if (els.drawGrid) {
      const gridOp  = clamp(s2 * 2.5, 0, 1) * clamp(1 - s3 * 2.5, 0, 1);
      const gridEl  = document.querySelector('.cin-3d-grid');
      if (gridEl) gridEl.style.opacity = gridOp;
      if (gridOp > 0.01) els.drawGrid(gridOp);
    }

    /* ── HOLO PANELS (3D entry) ── */
    if (els.holoPanel) {
      const pIn  = clamp(s3 * 3.5, 0, 1);
      const pOut = clamp(1 - s4 * 5, 0, 1);
      const masterOp = easeOut(pIn) * pOut;
      els.holoPanel.style.opacity       = masterOp;
      els.holoPanel.style.pointerEvents = masterOp > 0.05 ? 'auto' : 'none';

      // Each panel enters with 3D flip
      els.holoPanels.forEach((panel, i) => {
        const pDelay = i * 0.1;
        const pAmt   = clamp((s3 - pDelay) * 5, 0, 1);
        const slideY = (1 - easeOut(pAmt)) * 55;
        const rotX   = (1 - easeOut(pAmt)) * 20;
        const rotY   = [-6, 0, 6][i] || 0;  // subtle fan spread

        panel.style.opacity   = easeOut(pAmt) * pOut;
        panel.style.transform =
          `perspective(800px) rotateY(${rotY}deg) rotateX(${rotX}deg) translateY(${slideY}px)`;

        // Mark visible for hover float animation
        if (pAmt > 0.9 && pOut > 0.5) {
          panel.classList.add('panel-visible');
          panel.style.setProperty('--panel-rot-y', `${rotY}deg`);
          panel.style.setProperty('--panel-rot-x', `2deg`);
        } else {
          panel.classList.remove('panel-visible');
        }
      });
    }

    /* ── ENTERING TEXT ── */
    if (els.enteringText) {
      const eIn  = clamp(s4 * 7, 0, 1);
      const eOut = clamp((s4 - 0.25) * 6, 0, 1);
      els.enteringText.style.opacity = eIn * (1 - eOut);
    }

    /* ── TERMINAL OVERLAY ── */
    if (els.termOverlay) {
      const termOp = clamp((s4 - 0.18) * 6, 0, 1);
      els.termOverlay.style.opacity       = termOp;
      els.termOverlay.style.pointerEvents = termOp > 0.45 ? 'auto' : 'none';

      if (termOp > 0.45) {
        els.termOverlay.classList.add('active');
        if (!st.matrixActive) {
          st.matrixActive = true;
          els.matrixCanvas && els.matrixCanvas.classList.add('active');
        }
        if (!st.terminalReady && els.termInput) {
          st.terminalReady = true;
          setTimeout(() => els.termInput.focus(), 350);
          if (!st.terminalBooted) {
            st.terminalBooted = true;
            bootTerminal();
          }
        }
      } else {
        els.termOverlay.classList.remove('active');
        if (st.matrixActive) {
          st.matrixActive = false;
          els.matrixCanvas && els.matrixCanvas.classList.remove('active');
        }
        st.terminalReady = false;
      }
    }
  }

  /* ════════════════════════════════════════════════════
     PROGRESS DOTS
     ════════════════════════════════════════════════════ */
  function updateProgressDots(active) {
    els.progressDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === active);
    });
  }

  function initProgressDots() {
    const targets = [0, 0.27, 0.52, 0.77];
    els.progressDots.forEach((dot, i) => {
      dot.style.cursor = 'pointer';
      dot.addEventListener('click', () => {
        const max = window.innerHeight * 4;
        window.scrollTo({ top: targets[i] * max, behavior: 'smooth' });
      });
    });
  }

  /* ════════════════════════════════════════════════════
     HOLO PANEL 3D TILT (mouse-based per-panel)
     ════════════════════════════════════════════════════ */
  function initPanelHover() {
    els.holoPanels.forEach((panel, i) => {
      const baseRotY = [-6, 0, 6][i] || 0;
      panel.addEventListener('mousemove', (e) => {
        const rect = panel.getBoundingClientRect();
        const x    = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
        const y    = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
        const rotX = y * -8;
        const rotY = x *  8 + baseRotY;

        panel.style.transform =
          `perspective(800px) rotateY(${rotY}deg) rotateX(${rotX}deg) translateY(0px)`;
        panel.style.boxShadow = `
          ${x * 15}px ${y * 10}px 50px rgba(0,245,255,0.12),
          0 0 0 1px rgba(0,245,255,0.2),
          0 30px 80px rgba(0,0,0,0.7),
          inset 0 1px 0 rgba(255,255,255,0.08)
        `;
      });
      panel.addEventListener('mouseleave', () => {
        panel.style.transform = `perspective(800px) rotateY(${baseRotY}deg) rotateX(2deg) translateY(0)`;
        panel.style.boxShadow = '';
      });
    });
  }

  /* ════════════════════════════════════════════════════
     MATRIX RAIN
     ════════════════════════════════════════════════════ */
  function initMatrix() {
    const canvas = els.matrixCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const charsKana = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ';
    const charsHex  = '0123456789ABCDEF';
    const chars     = '01' + charsHex + charsKana + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const fontSize  = 13;
    let cols  = Math.floor(canvas.width / fontSize);
    let drops = Array.from({ length: cols }, () => Math.random() * -100);

    function drawMatrix() {
      // Semi-transparent fade
      ctx.fillStyle = 'rgba(5,5,8,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x    = i * fontSize;
        const y    = drops[i] * fontSize;

        // Brighter head char
        const isHead = drops[i] % 1 < 0.05;
        const alpha  = isHead ? 1.0 : 0.15 + Math.random() * 0.55;
        ctx.fillStyle = isHead
          ? `rgba(255,255,255,${alpha})`
          : `rgba(200,255,0,${alpha})`;
        ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.55;
      }
    }

    setInterval(drawMatrix, 48);
  }

  /* ════════════════════════════════════════════════════
     TERMINAL ENGINE
     ════════════════════════════════════════════════════ */
  const COMMANDS = {
    help,    whoami,  ls,      status,
    nmap,    hack,    ctf,     join,
    clear,   exit,   man,     echo,
    ping,    scan,   decrypt, projects,
  };

  function bootTerminal() {
    const lines = [
      { text: '> Initialising SCS-OS v4.0.0 kernel...', delay: 150,  cls: 'info' },
      { text: '> Loading threat intelligence corpus... OK', delay: 500,  cls: 'success' },
      { text: '> Mounting encrypted filesystem AES-256... OK', delay: 900,  cls: 'success' },
      { text: '> Establishing VPN tunnel [TUN0]... OK', delay: 1300, cls: 'success' },
      { text: '> Spawning auditor daemon... OK', delay: 1700, cls: 'success' },
      { text: '', delay: 2000, cls: '' },
      { text: '> System ready. Type "help" for available commands.', delay: 2200, cls: 'info' },
    ];
    lines.forEach(({ text, delay, cls }) => {
      setTimeout(() => printLine(text, cls), delay);
    });
    // Set session ID
    const sid = document.getElementById('cin-session-id');
    if (sid) sid.textContent = Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  function printLine(text, cls = '') {
    if (!els.termOutput) return;
    const div = document.createElement('div');
    div.className = `term-out-line ${cls}`;
    // Allow basic HTML spans for coloured segments
    div.innerHTML = text
      .replace(/\[OK\]/g, '<span style="color:#27c93f">[OK]</span>')
      .replace(/\[FAIL\]/g, '<span style="color:#ff5f56">[FAIL]</span>')
      .replace(/\[WARN\]/g, '<span style="color:#ffbd2e">[WARN]</span>');
    els.termOutput.appendChild(div);
    scrollTerm();
  }

  function printLines(lines) {
    lines.forEach((l, i) => {
      setTimeout(() => printLine(l.text || l, l.cls || ''), i * 55);
    });
  }

  function scrollTerm() {
    if (els.termBody) {
      els.termBody.scrollTop = els.termBody.scrollHeight;
    }
  }

  function echoCmd(cmd) {
    if (!els.termOutput) return;
    const d = document.createElement('div');
    d.className = 'term-out-line';
    d.innerHTML = `<span style="color:var(--acid)">guest@scs:~$</span> <span style="color:var(--white)">${escHtml(cmd)}</span>`;
    els.termOutput.appendChild(d);
    scrollTerm();
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ─── COMMANDS ─── */
  function help() {
    printLines([
      { text: '┌─ SCS COMMAND INTERFACE ─────────────────────────────────┐', cls: 'info' },
      { text: '│  help      — Show this menu                               │', cls: 'dim' },
      { text: '│  whoami    — Display identity card                        │', cls: 'dim' },
      { text: '│  ls        — List directory                               │', cls: 'dim' },
      { text: '│  status    — Live system diagnostics                      │', cls: 'dim' },
      { text: '│  nmap      — Network reconnaissance scan                  │', cls: 'dim' },
      { text: '│  scan      — Vulnerability scanner                        │', cls: 'dim' },
      { text: '│  hack      — Initiate breach simulation                   │', cls: 'warn' },
      { text: '│  decrypt   — Decrypt a sample payload                     │', cls: 'warn' },
      { text: '│  ctf       — CTF leaderboard                              │', cls: 'dim' },
      { text: '│  projects  — Open research projects                       │', cls: 'dim' },
      { text: '│  join      — Recruitment portal (redirects)               │', cls: 'success' },
      { text: '│  ping      — Ping SCS network nodes                       │', cls: 'dim' },
      { text: '│  man [cmd] — Manual for a command                         │', cls: 'dim' },
      { text: '│  echo      — Echo a string                                │', cls: 'dim' },
      { text: '│  clear     — Clear terminal output                        │', cls: 'dim' },
      { text: '│  exit      — Close terminal / scroll to top               │', cls: 'dim' },
      { text: '└───────────────────────────────────────────────────────────┘', cls: 'info' },
    ]);
  }

  function whoami() {
    const sess = Math.random().toString(36).slice(2, 10).toUpperCase();
    printLines([
      { text: '╔══ IDENTITY RECORD ════════════════════════════════════════╗', cls: 'info' },
      { text: '║  USER     :  guest                                         ║', cls: '' },
      { text: '║  ROLE     :  Unauthenticated Visitor                       ║', cls: 'warn' },
      { text: '║  ACCESS   :  LEVEL 0 — Read Only                          ║', cls: '' },
      { text: '║  GEO      :  [REDACTED BY IDS]                             ║', cls: 'dim' },
      { text: '║  SHELL    :  /bin/scs-bash v4.0.0                          ║', cls: '' },
      { text: `║  SESSION  :  ${sess}-GUEST                              ║`, cls: 'info' },
      { text: '╚══════════════════════════════════════════════════════════════╝', cls: 'info' },
      { text: '  → Upgrade access by joining SCS: join.html', cls: 'success' },
    ]);
  }

  function ls(raw) {
    const path = (raw || '').replace('ls', '').trim() || '/home/guest';
    printLines([
      { text: `Listing: ${path}`, cls: 'dim' },
      { text: 'total 9', cls: 'dim' },
      { text: 'drwxr-xr-x  scs-core/', cls: 'info' },
      { text: 'drwxr-x---  red-team/         [LOCKED — member only]', cls: 'warn' },
      { text: 'drwxr-x---  blue-team/        [LOCKED — member only]', cls: 'warn' },
      { text: 'drwxr-x---  osint/            [LOCKED — member only]', cls: 'warn' },
      { text: 'drwxr-x---  ctf-writeups/     [LOCKED — member only]', cls: 'warn' },
      { text: '-rw-r--r--  README.md', cls: '' },
      { text: '-rw-r--r--  manifesto.txt', cls: '' },
      { text: '-rwx------  ./init_membership  [LOCKED]', cls: 'error' },
      { text: '', cls: '' },
      { text: '  Unlock restricted dirs: run "join"', cls: 'dim' },
    ]);
  }

  function status() {
    const threats = Math.floor(Math.random() * 600 + 1200);
    const nodes   = Math.floor(Math.random() * 10  + 86);
    const ctfRnd  = Math.floor(Math.random() * 10  + 1);
    const upDays  = Math.floor(Math.random() * 99  + 1);
    const upHrs   = Math.floor(Math.random() * 23);
    const sess    = Math.floor(Math.random() * 8   + 3);
    printLines([
      { text: '── LIVE SYSTEM STATUS ──────────────────────────────────────', cls: 'info' },
      { text: `  Threats blocked   : ${threats.toLocaleString()}`, cls: 'success' },
      { text: `  Node integrity    : ${nodes}%`, cls: 'success' },
      { text: `  Active sessions   : ${sess}`, cls: '' },
      { text: `  CTF running       : YES — Round #${ctfRnd}`, cls: 'warn' },
      { text: `  Uptime            : ${upDays}d ${upHrs}h`, cls: '' },
      { text: '  IDS               : ACTIVE', cls: 'success' },
      { text: '  Honeypots         : 14 deployed', cls: 'warn' },
      { text: '  VPN               : TUN0 CONNECTED', cls: 'success' },
      { text: '────────────────────────────────────────────────────────────', cls: 'info' },
    ]);
  }

  function nmap(raw) {
    const target = (raw || '').replace('nmap', '').trim() || 'scs.local';
    const ip = `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
    const portMap = { 22:'ssh', 80:'http', 443:'https', 3389:'rdp', 8080:'http-proxy', 4444:'krb524', 53:'dns', 21:'ftp' };
    const lines = [
      { text: `Starting nmap 7.94 → ${target} (${ip})`, cls: 'info' },
      { text: 'HOST IS UP — latency 1.2ms', cls: 'success' },
      { text: 'PORT       STATE    SERVICE', cls: 'dim' },
    ];
    Object.entries(portMap).forEach(([p, svc]) => {
      const open = Math.random() > 0.38;
      lines.push({ text: `  ${p.padEnd(9)}${open?'open  ':'closed'}  ${svc}`, cls: open ? 'success' : 'dim' });
    });
    lines.push({ text: `Nmap done — 1 IP scanned in ${(Math.random()*3+1).toFixed(2)}s`, cls: 'info' });
    lines.forEach(({ text, cls }, i) => {
      setTimeout(() => printLine(text, cls), i * 90);
    });
  }

  function scan() {
    const stages = [
      { text: '[*] Initialising vulnerability scanner v2.4...', cls: 'info', d: 0 },
      { text: '[*] Detecting open services...', cls: 'info', d: 400 },
      { text: '[!] CVE-2023-1234 — Apache Log4j [CRITICAL]', cls: 'error', d: 900 },
      { text: '[!] CVE-2022-0847 — Linux DirtyPipe [HIGH]', cls: 'error', d: 1300 },
      { text: '[~] CVE-2021-3156 — sudo heap overflow [MEDIUM]', cls: 'warn', d: 1700 },
      { text: '[+] No SMB signing vulnerabilities detected.', cls: 'success', d: 2100 },
      { text: '── Scan complete. 3 CVEs found. ──', cls: 'info', d: 2500 },
    ];
    stages.forEach(({ text, cls, d }) => setTimeout(() => printLine(text, cls), d));
  }

  function hack() {
    const seq = [
      { text: '[!] INITIATING BREACH SIMULATION...', cls: 'hack', d: 0 },
      { text: '[*] Recon phase — scanning attack surface...', cls: 'info', d: 400 },
      { text: '[*] Found vectors: SSH:22, HTTP:80, SMB:445', cls: 'warn', d: 800 },
      { text: '[*] Attempting SQL injection... [FAIL]', cls: 'error', d: 1200 },
      { text: '[*] Deploying XSS payload... [FAIL]', cls: 'error', d: 1600 },
      { text: '[*] Fuzzing endpoint parameters...', cls: 'info', d: 2100 },
      { text: '[+] Discovered /admin/upload — unrestricted!', cls: 'success', d: 2600 },
      { text: '[*] Crafting RCE payload...', cls: 'info', d: 3100 },
      { text: '  ████████████████████░░░░  86%...', cls: 'hack', d: 3600 },
      { text: '[!] COUNTERMEASURE TRIGGERED — SESSION RESET', cls: 'error', d: 4100 },
      { text: '', cls: '', d: 4400 },
      { text: '  SCS reminds you: Hack only what you own.', cls: 'warn', d: 4600 },
      { text: '  → Learn legal hacking with us: join.html', cls: 'success', d: 4900 },
    ];
    seq.forEach(({ text, cls, d }) => setTimeout(() => printLine(text, cls), d));
  }

  function decrypt() {
    const payload = btoa('SCS_SECRET_' + Date.now()).slice(0, 24);
    const seq = [
      { text: '[*] Loading encrypted payload...', cls: 'info', d: 0 },
      { text: `[*] Payload: ${payload}`, cls: 'dim', d: 500 },
      { text: '[*] Attempting AES-256 brute-force...', cls: 'warn', d: 1000 },
      { text: '  ▓▓▓▓▓▓▓▓░░░░░░░░  48%...', cls: 'hack', d: 1600 },
      { text: '[!] Insufficient compute — keyspace too large.', cls: 'error', d: 2300 },
      { text: '[+] Fallback: dictionary attack phase...', cls: 'info', d: 2800 },
      { text: '[!] DECRYPTION FAILED — 256-bit encryption holds.', cls: 'error', d: 3400 },
      { text: '', cls: '', d: 3600 },
      { text: '  Use proper cryptanalysis. See our workshops: events.html', cls: 'success', d: 3800 },
    ];
    seq.forEach(({ text, cls, d }) => setTimeout(() => printLine(text, cls), d));
  }

  function ctf() {
    printLines([
      { text: '┌─ CTF LEADERBOARD (CURRENT ROUND #7) ───────────────────────┐', cls: 'info' },
      { text: '│  Rank   Handle          Score      Status                    │', cls: 'dim' },
      { text: '│  #1     0xDeadBeef      4,820 pts  🏆 CHAMPION               │', cls: 'hack' },
      { text: '│  #2     n4cr0m4nc3r     4,210 pts                             │', cls: '' },
      { text: '│  #3     shellsh3ll      3,890 pts                             │', cls: '' },
      { text: '│  #4     bufferfl0w      3,542 pts                             │', cls: '' },
      { text: '│  #5     p4ss-the-hash   3,120 pts                             │', cls: '' },
      { text: '│  ...    ......          ....                                  │', cls: 'dim' },
      { text: '│  ???    guest           0 pts      [join to participate]       │', cls: 'warn' },
      { text: '└───────────────────────────────────────────────────────────────┘', cls: 'info' },
    ]);
  }

  function projects() {
    printLines([
      { text: '── ACTIVE RESEARCH PROJECTS ──────────────────────────────────', cls: 'info' },
      { text: '  [1] AstraNet — Distributed threat intelligence aggregator', cls: '' },
      { text: '      Status: ACTIVE  |  Language: Python, Go', cls: 'dim' },
      { text: '  [2] HexLens — Browser-based hex editor + disassembler', cls: '' },
      { text: '      Status: BETA    |  Language: TypeScript, WASM', cls: 'dim' },
      { text: '  [3] ShadowVM — Isolated malware analysis sandbox', cls: '' },
      { text: '      Status: ACTIVE  |  Language: Rust, C', cls: 'dim' },
      { text: '  [4] CipherMap — Visual cryptography training tool', cls: '' },
      { text: '      Status: PLANNING', cls: 'dim' },
      { text: '──────────────────────────────────────────────────────────────', cls: 'info' },
      { text: '  → See all projects: projects.html', cls: 'success' },
    ]);
  }

  function ping(raw) {
    const host = (raw || '').replace('ping', '').trim() || 'scs.local';
    const lines = [{ text: `PING ${host} — 56 bytes`, cls: 'info' }];
    for (let i = 0; i < 4; i++) {
      const ms = (Math.random() * 8 + 1).toFixed(1);
      lines.push({ text: `64 bytes from ${host}: seq=${i+1} ttl=64 time=${ms}ms`, cls: 'success', d: i * 350 });
    }
    lines.push({ text: `4 transmitted, 4 received — 0% loss`, cls: 'success', d: 1500 });
    lines.forEach(({ text, cls, d = 0 }, i) => setTimeout(() => printLine(text, cls), i * 350));
  }

  function man(raw) {
    const cmd = (raw || '').replace('man', '').trim();
    const docs = {
      hack:    '  hack — Simulates a breach sequence against a sandboxed target.',
      nmap:    '  nmap [host] — Performs a TCP SYN scan on the target host.',
      scan:    '  scan — Runs a CVE vulnerability assessment on the local subnet.',
      decrypt: '  decrypt — Attempts to decrypt a demo AES-256 payload.',
      ctf:     '  ctf — Displays the current CTF round leaderboard.',
      status:  '  status — Dumps real-time system metrics.',
    };
    if (docs[cmd]) {
      printLine('MANUAL ENTRY', 'info');
      printLine(docs[cmd]);
    } else {
      printLine(`No manual entry for "${cmd}". Try "help" for command list.`, 'warn');
    }
  }

  function echo(raw) {
    const msg = (raw || '').replace(/^echo\s*/i, '');
    printLine(msg || '');
  }

  function join() {
    printLines([
      { text: '[*] Opening SCS recruitment portal...', cls: 'info' },
      { text: '[+] Redirecting to join.html in 2 seconds...', cls: 'success' },
    ]);
    setTimeout(() => { window.location.href = 'join.html'; }, 2000);
  }

  function clear() {
    if (els.termOutput) els.termOutput.innerHTML = '';
  }

  function exit() {
    printLines([
      { text: '[*] Terminating session...', cls: 'warn' },
      { text: '[+] Goodbye, guest.', cls: 'info' },
    ]);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 900);
  }

  /* ─── INPUT HANDLER + HISTORY ─── */
  function initTerminal() {
    if (!els.termInput) return;

    els.termInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const raw = els.termInput.value.trim();
        if (!raw) return;

        // History
        st.cmdHistory.unshift(raw);
        if (st.cmdHistory.length > 50) st.cmdHistory.pop();
        st.cmdHistoryIdx = -1;
        st.currentCmd = '';

        const cmd = raw.toLowerCase().split(' ')[0];
        echoCmd(raw);
        els.termInput.value = '';

        if (COMMANDS[cmd]) {
          COMMANDS[cmd](raw);
        } else {
          printLine(`Command not found: ${escHtml(cmd)} — type "help"`, 'error');
        }

      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (st.cmdHistoryIdx === -1) st.currentCmd = els.termInput.value;
        st.cmdHistoryIdx = Math.min(st.cmdHistoryIdx + 1, st.cmdHistory.length - 1);
        els.termInput.value = st.cmdHistory[st.cmdHistoryIdx] || '';

      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        st.cmdHistoryIdx = Math.max(st.cmdHistoryIdx - 1, -1);
        els.termInput.value = st.cmdHistoryIdx === -1 ? st.currentCmd : st.cmdHistory[st.cmdHistoryIdx];

      } else if (e.key === 'Tab') {
        e.preventDefault();
        const partial = els.termInput.value.trim().toLowerCase();
        const matches = Object.keys(COMMANDS).filter(c => c.startsWith(partial));
        if (matches.length === 1) {
          els.termInput.value = matches[0];
        } else if (matches.length > 1) {
          printLine(matches.join('  '), 'dim');
        }
      }
    });

    // Quick buttons
    document.querySelectorAll('.cin-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        if (!cmd) return;
        echoCmd(cmd);
        if (COMMANDS[cmd]) COMMANDS[cmd](cmd);
        els.termInput && els.termInput.focus();
      });
    });

    // Mac traffic light dots
    const dotClose = document.getElementById('cin-dot-close');
    const dotMin   = document.getElementById('cin-dot-min');
    const dotFull  = document.getElementById('cin-dot-full');

    if (dotClose) {
      dotClose.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    if (dotMin) {
      dotMin.addEventListener('click', () => {
        const max = window.innerHeight * 4;
        window.scrollTo({ top: max * 0.6, behavior: 'smooth' });
      });
    }
    if (dotFull) {
      dotFull.addEventListener('click', () => {
        const el = document.getElementById('cin-term');
        if (!el) return;
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          el.requestFullscreen().catch(() => {});
        }
      });
    }
  }

  /* ════════════════════════════════════════════════════
     LIVE STATS
     ════════════════════════════════════════════════════ */
  function initLiveStats() {
    const threatEl = document.getElementById('cin-stat-threats');
    const nodeEl   = document.getElementById('cin-stat-nodes');
    const ctfEl    = document.getElementById('cin-stat-ctf');

    let threats = 1247;
    let nodes   = 94;

    if (ctfEl) ctfEl.textContent = '#7';

    setInterval(() => {
      threats += Math.floor(Math.random() * 12);
      nodes    = Math.max(80, Math.min(99, nodes + (Math.random() > 0.55 ? 1 : -1)));
      if (threatEl) threatEl.textContent = threats.toLocaleString();
      if (nodeEl)   nodeEl.textContent   = nodes + '%';
    }, 2400);
  }

  /* ════════════════════════════════════════════════════
     REAL-TIME CLOCK
     ════════════════════════════════════════════════════ */
  function initClock() {
    const el = document.getElementById('cin-clock');
    const tick = () => {
      if (el) el.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ════════════════════════════════════════════════════
     NAVBAR
     ════════════════════════════════════════════════════ */
  function initNav() {
    const burger = document.querySelector('.cin-nav-hamburger');
    const links  = document.querySelector('.cin-nav-links');
    if (!burger || !links) return;
    burger.addEventListener('click', () => {
      const open = links.style.display === 'flex';
      links.style.display = open ? 'none' : 'flex';
      if (!open) {
        links.style.flexDirection = 'column';
        links.style.position = 'absolute';
        links.style.top = '60px';
        links.style.left = '50%';
        links.style.transform = 'translateX(-50%)';
        links.style.background = 'rgba(5,5,8,0.95)';
        links.style.border = '1px solid rgba(200,255,0,0.1)';
        links.style.borderRadius = '12px';
        links.style.padding = '12px';
        links.style.gap = '6px';
        links.style.backdropFilter = 'blur(20px)';
      }
    });
  }

  /* ════════════════════════════════════════════════════
     RESIZE HANDLER
     ════════════════════════════════════════════════════ */
  function initResize() {
    window.addEventListener('resize', () => {
      // Recalculate on resize
    }, { passive: true });
  }

  /* ════════════════════════════════════════════════════
     BOOT
     ════════════════════════════════════════════════════ */
  function init() {
    resolveEls();
    initScroll();
    initMouse();
    initThreeBackground();
    initGrid();
    initMatrix();
    initTerminal();
    initLiveStats();
    initClock();
    initNav();
    initProgressDots();
    initResize();

    requestAnimationFrame(renderFrame);
    setTimeout(initPanelHover, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
