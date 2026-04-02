/**
 * SCS — CINEMATIC SCROLL ENGINE
 * Controls: scroll-driven scenes, parallax, terminal, matrix rain
 * Scenes: Entry → Room → Desk → Monitor → Terminal
 */

(function () {
  'use strict';

  /* ────────────────────────────────────────────────
     CONSTANTS
     ──────────────────────────────────────────────── */
  const LERP = 0.09;
  const MOUSE_LERP = 0.07;

  /* ────────────────────────────────────────────────
     STATE
     ──────────────────────────────────────────────── */
  const st = {
    scrollY: 0,
    targetScrollY: 0,
    mouseX: 0, mouseY: 0,
    targetMouseX: 0, targetMouseY: 0,
    scene: 0,
    terminalReady: false,
    matrixActive: false,
  };

  /* ────────────────────────────────────────────────
     ELEMENTS — resolved after DOM ready
     ──────────────────────────────────────────────── */
  let els = {};

  function resolveEls() {
    els = {
      scrollContainer: document.getElementById('cin-scroll'),
      splineRoom:      document.getElementById('cin-room'),
      splineGlobe:     document.getElementById('cin-globe'),
      scene1:          document.getElementById('cin-s1'),
      scene2ui:        document.getElementById('cin-s2'),
      holoPanel:       document.getElementById('cin-s3'),
      termOverlay:     document.getElementById('cin-term'),
      enteringText:    document.getElementById('cin-entering'),
      matrixCanvas:    document.getElementById('cin-matrix'),
      termBody:        document.getElementById('cin-term-body'),
      termInput:       document.getElementById('cin-term-input'),
      termOutput:      document.getElementById('cin-term-output'),
      cursorDot:       document.getElementById('cin-cursor-dot'),
      cursorRing:      document.getElementById('cin-cursor-ring'),
      progressDots:    document.querySelectorAll('.cin-progress-dot'),
      miniCards:       document.querySelectorAll('.cin-mini-card'),
      holoPanels:      document.querySelectorAll('.cin-holo-panel'),
    };
  }

  /* ────────────────────────────────────────────────
     SCROLL TRACKING
     ──────────────────────────────────────────────── */
  function initScroll() {
    window.addEventListener('scroll', () => {
      st.targetScrollY = window.scrollY;
    }, { passive: true });
    st.scrollY = window.scrollY;
    st.targetScrollY = window.scrollY;
  }

  /* ────────────────────────────────────────────────
     MOUSE TRACKING + CUSTOM CURSOR
     ──────────────────────────────────────────────── */
  function initMouse() {
    document.addEventListener('mousemove', (e) => {
      st.targetMouseX = e.clientX;
      st.targetMouseY = e.clientY;
      // Normalised [-1, 1]
      st.targetNX = (e.clientX / window.innerWidth  - 0.5) * 2;
      st.targetNY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  function updateCursor() {
    st.mouseX += (st.targetMouseX - st.mouseX) * MOUSE_LERP;
    st.mouseY += (st.targetMouseY - st.mouseY) * MOUSE_LERP;
    st.nX = st.nX || 0;
    st.nY = st.nY || 0;
    st.nX += ((st.targetNX || 0) - st.nX) * MOUSE_LERP;
    st.nY += ((st.targetNY || 0) - st.nY) * MOUSE_LERP;

    if (els.cursorDot) {
      els.cursorDot.style.left = st.mouseX + 'px';
      els.cursorDot.style.top  = st.mouseY + 'px';
    }
    if (els.cursorRing) {
      // Slight lag
      els.cursorRing.style.left = st.mouseX + 'px';
      els.cursorRing.style.top  = st.mouseY + 'px';
    }
  }

  /* ────────────────────────────────────────────────
     SCENE CALCULATIONS
     ──────────────────────────────────────────────── */
  function calcProgress() {
    const maxScroll = window.innerHeight * 4; // 5vh container, 1vh viewport
    const raw = st.scrollY / maxScroll;
    return Math.max(0, Math.min(1, raw));
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  function sceneProgress(p, start, end) {
    return clamp01((p - start) / (end - start));
  }

  /* ────────────────────────────────────────────────
     MAIN RENDER LOOP
     ──────────────────────────────────────────────── */
  function renderFrame() {
    // Lerp smooth scroll
    st.scrollY += (st.targetScrollY - st.scrollY) * LERP;

    updateCursor();
    applyScenes();
    applyParallax();

    requestAnimationFrame(renderFrame);
  }

  /* ────────────────────────────────────────────────
     SCENE TRANSITIONS
     ──────────────────────────────────────────────── */
  function applyScenes() {
    const p = calcProgress(); // 0 → 1 total progress

    // Progress band assignments
    // Scene 1: 0 → 0.25
    // Scene 2: 0.25 → 0.5
    // Scene 3: 0.5 → 0.75
    // Scene 4: 0.75 → 1.0

    const s1 = sceneProgress(p, 0,    0.25); // entry
    const s2 = sceneProgress(p, 0.25, 0.50); // desk / globe
    const s3 = sceneProgress(p, 0.50, 0.75); // monitor / holo
    const s4 = sceneProgress(p, 0.75, 1.00); // terminal

    // ── Determine active scene for indicator
    let activeScene = 0;
    if (p >= 0.75) activeScene = 3;
    else if (p >= 0.50) activeScene = 2;
    else if (p >= 0.25) activeScene = 1;

    if (activeScene !== st.scene) {
      st.scene = activeScene;
      updateProgressDots(activeScene);
    }

    // ── SPLINE ROOM: scale zoom effect
    if (els.splineRoom) {
      // Gentle zoom as user scrolls
      const zoomAmt = 1 + s2 * 0.12 + s3 * 0.06;
      // Fade room out as terminal fully takes over
      const roomOpacity = clamp01(1 - s4 * 2.5);
      els.splineRoom.style.transform = `scale(${zoomAmt})`;
      els.splineRoom.style.opacity   = roomOpacity;
    }

    // ── SCENE 1: entry text
    if (els.scene1) {
      // Fade + slide out during scene 2
      const s1Fade  = clamp01(1 - s2 * 2.2);
      const s1Slide = s2 * 80;
      els.scene1.style.opacity   = s1Fade;
      els.scene1.style.transform = `translateX(${-s1Slide}px)`;
    }

    // ── SPLINE GLOBE: fade/scale in during scene 2
    if (els.splineGlobe) {
      const globeOp    = clamp01(s2 * 2.5);
      const globeScale = 0.6 + s2 * 0.45;
      // fade out slightly in scene 4
      const globeFade  = clamp01(1 - (s4 - 0.4) * 3);
      els.splineGlobe.style.opacity   = globeOp * globeFade;
      els.splineGlobe.style.transform = `translateY(-50%) scale(${globeScale})`;

      // Subtle parallax pan with mouse
      const panX = st.nX * 15;
      const panY = st.nY * 8;
      els.splineGlobe.style.transform = `translateY(calc(-50% + ${panY}px)) translateX(${panX}px) scale(${globeScale})`;
    }

    // ── SCENE 2 UI (bottom stat cards)
    if (els.scene2ui) {
      const s2InOp  = clamp01(s2 * 3);
      const s2OutOp = clamp01(1 - s3 * 3);
      const s2Slide = (1 - Math.min(s2 * 3, 1)) * 30;
      els.scene2ui.style.opacity   = s2InOp * s2OutOp;
      els.scene2ui.style.transform = `translateY(${s2Slide}px)`;
    }

    // ── SCENE 3 HOLOGRAPHIC PANELS
    if (els.holoPanel) {
      const s3In  = clamp01(s3 * 3);
      const s3Out = clamp01(1 - s4 * 4);
      els.holoPanel.style.opacity        = s3In * s3Out;
      els.holoPanel.style.pointerEvents  = s3In > 0.1 ? 'auto' : 'none';

      // Animate each panel individually
      els.holoPanels.forEach((panel, i) => {
        const pDelay = i * 0.12;
        const pIn = clamp01((s3 - pDelay) * 4);
        panel.style.opacity   = pIn * s3Out;
        panel.style.transform = `translateY(${(1 - easeInOut(pIn)) * 40}px)`;
      });
    }

    // ── ENTERING TEXT
    if (els.enteringText) {
      // Show briefly at start of scene 4
      const eIn  = clamp01((s4 - 0.0) * 6);
      const eOut = clamp01((s4 - 0.3) * 5);
      els.enteringText.style.opacity = eIn * (1 - eOut);
    }

    // ── SCENE 4 TERMINAL
    if (els.termOverlay) {
      const termOp = clamp01((s4 - 0.15) * 5);
      els.termOverlay.style.opacity       = termOp;
      els.termOverlay.style.pointerEvents = termOp > 0.5 ? 'auto' : 'none';

      if (termOp > 0.5) {
        els.termOverlay.classList.add('active');
        // Activate matrix rain
        if (!st.matrixActive) {
          st.matrixActive = true;
          if (els.matrixCanvas) els.matrixCanvas.classList.add('active');
        }
        // Focus input once
        if (!st.terminalReady && els.termInput) {
          st.terminalReady = true;
          setTimeout(() => els.termInput.focus(), 300);
          if (!st.terminalBooted) {
            st.terminalBooted = true;
            bootTerminal();
          }
        }
      } else {
        els.termOverlay.classList.remove('active');
        if (st.matrixActive) {
          st.matrixActive = false;
          if (els.matrixCanvas) els.matrixCanvas.classList.remove('active');
        }
        st.terminalReady = false;
      }
    }
  }

  /* ────────────────────────────────────────────────
     PARALLAX on mouse move
     ──────────────────────────────────────────────── */
  function applyParallax() {
    if (els.scene1) {
      const pX = st.nX * -12;
      const pY = st.nY * -7;
      // Only when scene 1 is visible
      if (calcProgress() < 0.3) {
        els.scene1.style.transform = `translate(${pX}px, ${pY}px)`;
      }
    }
  }

  /* ────────────────────────────────────────────────
     PROGRESS DOTS UPDATE
     ──────────────────────────────────────────────── */
  function updateProgressDots(active) {
    els.progressDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === active);
    });
  }

  /* ────────────────────────────────────────────────
     PROGRESS DOTS — CLICK SCROLL
     ──────────────────────────────────────────────── */
  function initProgressDots() {
    const targets = [0, 0.27, 0.52, 0.77]; // scroll percent of each scene
    els.progressDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const maxScroll = window.innerHeight * 4;
        window.scrollTo({ top: targets[i] * maxScroll, behavior: 'smooth' });
      });
    });
  }

  /* ════════════════════════════════════════════════
     MATRIX RAIN
     ════════════════════════════════════════════════ */
  function initMatrix() {
    const canvas = els.matrixCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const fontSize = 13;
    let cols = Math.floor(canvas.width / fontSize);
    let drops = Array.from({ length: cols }, () => Math.random() * -100);

    function drawMatrix() {
      ctx.fillStyle = 'rgba(5,5,8,0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#c8ff00';
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Vary brightness
        const alpha = 0.15 + Math.random() * 0.6;
        ctx.fillStyle = `rgba(200, 255, 0, ${alpha})`;
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.6;
      }
    }

    setInterval(drawMatrix, 50);
  }

  /* ════════════════════════════════════════════════
     TERMINAL ENGINE
     ════════════════════════════════════════════════ */
  const TERM_COMMANDS = {
    help: cmdHelp,
    whoami: cmdWhoami,
    hack: cmdHack,
    nmap: cmdNmap,
    ls: cmdLs,
    status: cmdStatus,
    clear: cmdClear,
    join: cmdJoin,
    ctf: cmdCtf,
    exit: cmdExit,
  };

  function bootTerminal() {
    const introLines = [
      { text: '> Initialising SCS Secure Shell...', delay: 200, cls: 'info' },
      { text: '> Loading threat intelligence modules... [OK]', delay: 600, cls: 'success' },
      { text: '> Mounting encrypted filesystem... [OK]', delay: 1000, cls: 'success' },
      { text: '> Establishing VPN tunnel... [OK]', delay: 1400, cls: 'success' },
      { text: '> Type "help" to list available commands.', delay: 2000, cls: 'info' },
    ];

    introLines.forEach(({ text, delay, cls }) => {
      setTimeout(() => printLine(text, cls), delay);
    });
  }

  function printLine(text, cls = '') {
    if (!els.termOutput) return;
    const div = document.createElement('div');
    div.className = `term-out-line ${cls}`;
    div.textContent = text;
    els.termOutput.appendChild(div);
    scrollTerminal();
  }

  function printLines(lines) {
    lines.forEach((l, i) => {
      setTimeout(() => printLine(l.text, l.cls || ''), i * 60);
    });
  }

  function scrollTerminal() {
    if (els.termBody) {
      els.termBody.scrollTop = els.termBody.scrollHeight;
    }
  }

  function echoCommand(cmd) {
    if (!els.termOutput) return;
    const wrap = document.createElement('div');
    wrap.className = 'term-out-line';
    wrap.innerHTML = `<span style="color:var(--acid)">guest@scs:~$</span> <span style="color:var(--white)">${escHtml(cmd)}</span>`;
    els.termOutput.appendChild(wrap);
    scrollTerminal();
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ─── COMMAND IMPLEMENTATIONS ───

  function cmdHelp() {
    printLines([
      { text: '┌─ AVAILABLE COMMANDS ────────────────────────┐', cls: 'info' },
      { text: '│  help      — Show this menu                  │', cls: 'dim' },
      { text: '│  whoami    — Display user identity           │', cls: 'dim' },
      { text: '│  ls        — List directory contents         │', cls: 'dim' },
      { text: '│  status    — System status report            │', cls: 'dim' },
      { text: '│  nmap      — Network scan                    │', cls: 'dim' },
      { text: '│  hack      — Initiate breach sequence        │', cls: 'warn' },
      { text: '│  ctf       — CTF challenge leaderboard       │', cls: 'dim' },
      { text: '│  join      — Recruitment portal              │', cls: 'success' },
      { text: '│  clear     — Clear terminal                  │', cls: 'dim' },
      { text: '│  exit      — Exit terminal                   │', cls: 'dim' },
      { text: '└──────────────────────────────────────────────┘', cls: 'info' },
    ]);
  }

  function cmdWhoami() {
    printLines([
      { text: '╔══ IDENTITY RECORD ═══════════════════════════╗', cls: 'info' },
      { text: '║  USER     :  guest                           ║', cls: '' },
      { text: '║  ROLE     :  Unauthenticated                 ║', cls: 'warn' },
      { text: '║  ACCESS   :  LEVEL 0 — Read Only             ║', cls: '' },
      { text: '║  LOCATION :  [REDACTED]                      ║', cls: 'dim' },
      { text: '║  SHELL    :  /bin/scs-bash 3.0.0             ║', cls: '' },
      { text: '║  SESSION  :  ' + Math.random().toString(36).slice(2, 10).toUpperCase() + '-SCS             ║', cls: 'info' },
      { text: '╚══════════════════════════════════════════════╝', cls: 'info' },
      { text: '  → Join SCS to upgrade access level: join.html', cls: 'success' },
    ]);
  }

  function cmdLs() {
    printLines([
      { text: 'total 42', cls: 'dim' },
      { text: 'drwxr-xr-x  scs-core/', cls: 'info' },
      { text: 'drwxr-x---  red-team/', cls: 'warn' },
      { text: 'drwxr-x---  blue-team/', cls: 'success' },
      { text: 'drwxr-x---  osint/', cls: 'info' },
      { text: '-rw-r--r--  README.md', cls: '' },
      { text: '-rw-r--r--  manifesto.txt', cls: '' },
      { text: '-rwx------  ./init_membership [LOCKED — join first]', cls: 'error' },
    ]);
  }

  function cmdStatus() {
    const threats = Math.floor(Math.random() * 500 + 1200);
    const nodes   = Math.floor(Math.random() * 10 + 85);
    printLines([
      { text: '── SYSTEM STATUS ─────────────────────────────', cls: 'info' },
      { text: `  Threats blocked  :  ${threats.toLocaleString()}`, cls: 'success' },
      { text: `  Node integrity   :  ${nodes}%`, cls: 'success' },
      { text: `  Active sessions  :  ${Math.floor(Math.random()*8+3)}`, cls: '' },
      { text: `  CTF running      :  YES — Round #${Math.floor(Math.random()*10+1)}`, cls: 'warn' },
      { text: `  Uptime           :  ${Math.floor(Math.random()*99+1)}d ${Math.floor(Math.random()*23)}h`, cls: '' },
      { text: '  IDS              :  ACTIVE', cls: 'success' },
      { text: '  Honeypots        :  12 deployed', cls: 'warn' },
      { text: '──────────────────────────────────────────────', cls: 'info' },
    ]);
  }

  function cmdNmap() {
    const ips = Array.from({length: 6}, () =>
      `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`
    );
    const ports = [22, 80, 443, 3389, 8080, 4444];
    const lines = [
      { text: 'Starting nmap 7.94 — Network scan...', cls: 'info' },
      { text: `Nmap scan report for scs.local (${ips[0]})`, cls: '' },
    ];
    ports.forEach(p => {
      const open = Math.random() > 0.4;
      lines.push({
        text: `  ${p}/tcp   ${open ? 'open  ' : 'closed'}   ${portName(p)}`,
        cls: open ? 'success' : 'dim',
      });
    });
    lines.push({ text: 'Nmap done — 1 IP scanned in 2.14 seconds', cls: 'info' });
    printLines(lines);
  }

  function portName(p) {
    const m = {22:'ssh', 80:'http', 443:'https', 3389:'rdp', 8080:'http-proxy', 4444:'krb524'};
    return m[p] || 'unknown';
  }

  function cmdHack() {
    const sequence = [
      { text: '[!] INITIATING BREACH SEQUENCE...', cls: 'hack' },
      { text: '[*] Scanning target surface...', cls: 'info' },
      { text: '[*] Found 3 potential vectors: SSH, HTTP, SMB', cls: 'warn' },
      { text: '[*] Attempting SQL injection... BLOCKED', cls: 'error' },
      { text: '[*] Attempting XSS payload... BLOCKED', cls: 'error' },
      { text: '[*] Fuzzing parameters...', cls: 'info' },
      { text: '[+] Discovered hidden endpoint: /admin/upload', cls: 'success' },
      { text: '[*] Crafting exploit...', cls: 'info' },
      { text: '██████████████████████░░ 90%...', cls: 'hack' },
      { text: '[!] SECURITY COUNTERMEASURE DETECTED — ABORT', cls: 'error' },
      { text: '', cls: '' },
      { text: '  SCS reminds you: Only hack what you own.', cls: 'warn' },
      { text: '  → Enroll in our ethical hacking track: join.html', cls: 'success' },
    ];
    sequence.forEach(({ text, cls }, i) => {
      setTimeout(() => printLine(text, cls), i * 180);
    });
  }

  function cmdCtf() {
    printLines([
      { text: '┌─ CTF LEADERBOARD (CURRENT ROUND) ───────────┐', cls: 'info' },
      { text: '│  #1   0xDeadBeef     4210 pts   🏆            │', cls: 'hack' },
      { text: '│  #2   n4cr0m4nc3r    3890 pts                 │', cls: '' },
      { text: '│  #3   shellsh3ll     3542 pts                 │', cls: '' },
      { text: '│  #4   bufferflow     3120 pts                 │', cls: '' },
      { text: '│  #5   p4ss-the-hash  2988 pts                 │', cls: '' },
      { text: '│  ...                                          │', cls: 'dim' },
      { text: '│  guest              0 pts    [join first]      │', cls: 'warn' },
      { text: '└──────────────────────────────────────────────┘', cls: 'info' },
    ]);
  }

  function cmdJoin() {
    printLines([
      { text: '[*] Opening recruitment portal...', cls: 'info' },
      { text: '[+] Redirecting to join.html in 2 seconds...', cls: 'success' },
    ]);
    setTimeout(() => { window.location.href = 'join.html'; }, 2000);
  }

  function cmdClear() {
    if (els.termOutput) els.termOutput.innerHTML = '';
  }

  function cmdExit() {
    printLines([
      { text: '[*] Terminating session...', cls: 'warn' },
      { text: '[+] Goodbye.', cls: 'info' },
    ]);
    const maxScroll = window.innerHeight * 4;
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 800);
  }

  /* ─── TERMINAL INPUT HANDLER ─── */
  function initTerminal() {
    if (!els.termInput) return;

    els.termInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const raw = els.termInput.value.trim();
        if (!raw) return;

        const cmd = raw.toLowerCase().split(' ')[0];
        echoCommand(raw);
        els.termInput.value = '';

        if (TERM_COMMANDS[cmd]) {
          TERM_COMMANDS[cmd](raw);
        } else {
          printLine(`Command not found: ${cmd} — type "help" for options`, 'error');
        }
      }
    });

    // Quick command buttons
    document.querySelectorAll('.cin-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        echoCommand(cmd);
        if (TERM_COMMANDS[cmd]) TERM_COMMANDS[cmd]();
        if (els.termInput) els.termInput.focus();
      });
    });

    // Mac traffic light dots
    const dotClose = document.getElementById('cin-dot-close');
    const dotMin   = document.getElementById('cin-dot-min');
    const dotFull  = document.getElementById('cin-dot-full');

    if (dotClose) {
      dotClose.addEventListener('click', () => {
        // Scroll back up to scene 1
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    if (dotMin) {
      dotMin.addEventListener('click', () => {
        // Scroll back a bit
        const maxScroll = window.innerHeight * 4;
        window.scrollTo({ top: maxScroll * 0.6, behavior: 'smooth' });
      });
    }
    if (dotFull) {
      dotFull.addEventListener('click', () => {
        const el = document.getElementById('cin-term');
        if (el) {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            el.requestFullscreen().catch(() => {});
          }
        }
      });
    }
  }

  /* ════════════════════════════════════════════════
     LIVE STATS TICK (scene 2 cards)
     ════════════════════════════════════════════════ */
  function initLiveStats() {
    const threatEl = document.getElementById('cin-stat-threats');
    const nodeEl   = document.getElementById('cin-stat-nodes');
    const ctfEl    = document.getElementById('cin-stat-ctf');

    let threats = 1247;
    let nodes = 94;
    let ctf = 7;

    setInterval(() => {
      threats += Math.floor(Math.random() * 8);
      nodes = Math.max(80, Math.min(99, nodes + (Math.random() > 0.5 ? 1 : -1)));
      if (threatEl) threatEl.textContent = threats.toLocaleString();
      if (nodeEl)   nodeEl.textContent   = nodes + '%';
    }, 2000);

    // CTF round stays static
    if (ctfEl) ctfEl.textContent = `#${ctf}`;
  }

  /* ════════════════════════════════════════════════
     REAL-TIME CLOCK in terminal status bar
     ════════════════════════════════════════════════ */
  function initClock() {
    const el = document.getElementById('cin-clock');
    function tick() {
      if (el) {
        el.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
      }
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ════════════════════════════════════════════════
     SESSION ID
     ════════════════════════════════════════════════ */
  function initSession() {
    const el = document.getElementById('cin-session-id');
    if (el) {
      el.textContent = Math.random().toString(36).slice(2, 10).toUpperCase();
    }
  }

  /* ════════════════════════════════════════════════
     NAVBAR MOBILE TOGGLE
     ════════════════════════════════════════════════ */
  function initNav() {
    const burger = document.querySelector('.cin-nav-hamburger');
    const links  = document.querySelector('.cin-nav-links');
    if (!burger || !links) return;
    burger.addEventListener('click', () => {
      links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
    });
  }

  /* ════════════════════════════════════════════════
     HOVER GLOW on holo panels
     ════════════════════════════════════════════════ */
  function initPanelHover() {
    els.holoPanels.forEach(panel => {
      panel.addEventListener('mousemove', (e) => {
        const rect = panel.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
        const y = ((e.clientY - rect.top ) / rect.height - 0.5) * 2;
        panel.style.boxShadow = `
          ${x * 10}px ${y * 10}px 40px rgba(0,245,255,0.1),
          0 0 0 1px rgba(0,245,255,0.15),
          0 20px 60px rgba(0,0,0,0.7)
        `;
      });
      panel.addEventListener('mouseleave', () => {
        panel.style.boxShadow = '';
      });
    });
  }

  /* ════════════════════════════════════════════════
     BOOT
     ════════════════════════════════════════════════ */
  function init() {
    resolveEls();
    initScroll();
    initMouse();
    initMatrix();
    initTerminal();
    initLiveStats();
    initClock();
    initSession();
    initNav();
    initProgressDots();
    requestAnimationFrame(renderFrame);

    // Defer panel hover (needs els.holoPanels resolved)
    setTimeout(initPanelHover, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
