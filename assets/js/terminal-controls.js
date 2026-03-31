/**
 * SCS — Terminal Mac-style Traffic Light Controls
 * Red   → Close  (go back to hero / close tab)
 * Yellow → Minimize (collapse terminal to a slim title bar)
 * Green  → Fullscreen (native browser fullscreen toggle)
 */
(function () {
  'use strict';

  // Detect which page we're on
  const isLandingPage = document.body.classList.contains('landing-page');
  const isTerminalPage = document.body.classList.contains('terminal-page');

  function initTerminalControls() {
    const dotClose      = document.getElementById('t-dot-close');
    const dotMinimize   = document.getElementById('t-dot-minimize');
    const dotFullscreen = document.getElementById('t-dot-fullscreen');
    const terminalEl    = document.querySelector('.terminal-fullscreen');

    if (!dotClose || !terminalEl) return;

    // ─── Hover: show symbol icons on dots ───────────────────────
    const dotsData = [
      { el: dotClose,      icon: '✕' },
      { el: dotMinimize,   icon: '−' },
      { el: dotFullscreen, icon: isTerminalPage ? '⛶' : '⤢' },
    ];

    dotsData.forEach(({ el, icon }) => {
      if (!el) return;
      el.style.cursor = 'pointer';
      el.style.position = 'relative';
      el.style.display = 'inline-flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '8px';
      el.style.fontWeight = '700';
      el.style.color = 'transparent';
      el.style.transition = 'color 0.15s ease, transform 0.15s ease';

      el.addEventListener('mouseenter', () => {
        el.style.color = 'rgba(0,0,0,0.7)';
        el.style.transform = 'scale(1.15)';
        el.textContent = icon;
      });
      el.addEventListener('mouseleave', () => {
        el.style.color = 'transparent';
        el.style.transform = 'scale(1)';
        el.textContent = '';
      });
    });

    // ─── RED: Close ─────────────────────────────────────────────
    dotClose.addEventListener('click', (e) => {
      e.stopPropagation();

      if (isLandingPage) {
        // Scroll back to the hero (top of page)
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Flash red briefly then scroll
        terminalEl.style.transition = 'opacity 0.3s ease';
        terminalEl.style.opacity = '0';
        setTimeout(() => {
          terminalEl.style.opacity = '1';
          terminalEl.style.transition = '';
        }, 350);

      } else if (isTerminalPage) {
        // Close: try history back, otherwise go to index
        if (document.referrer && document.referrer.includes(location.hostname)) {
          window.history.back();
        } else {
          // Animate close before redirect
          terminalEl.style.transition = 'transform 0.3s cubic-bezier(0.4,0,1,1), opacity 0.3s ease';
          terminalEl.style.transform = 'scale(0.96)';
          terminalEl.style.opacity = '0';
          setTimeout(() => { window.location.href = 'index.html'; }, 320);
        }
      }
    });

    // ─── YELLOW: Minimize ───────────────────────────────────────
    if (dotMinimize) {
      let isMinimized = false;
      const termContent   = terminalEl.querySelector('.terminal-content');
      const termInput     = terminalEl.querySelector('.terminal-input-line');
      const termCmds      = terminalEl.querySelector('.terminal-quick-commands');
      const termStatus    = document.querySelector('.terminal-status-bar');

      dotMinimize.addEventListener('click', (e) => {
        e.stopPropagation();

        isMinimized = !isMinimized;

        const hiddenEls = [termContent, termInput, termCmds, termStatus].filter(Boolean);

        if (isMinimized) {
          // Collapse: hide body, shrink terminal
          hiddenEls.forEach(el => {
            el.style.transition = 'opacity 0.2s ease, max-height 0.3s ease';
            el.style.opacity = '0';
            el.style.maxHeight = '0';
            el.style.overflow = 'hidden';
          });
          terminalEl.style.transition = 'height 0.35s cubic-bezier(0.16,1,0.3,1), border-radius 0.3s ease';
          terminalEl.style.height = '46px';
          terminalEl.style.borderRadius = '10px';
          terminalEl.style.overflow = 'hidden';

          // Indicate minimized state in title bar
          const titleSpan = terminalEl.querySelector('.terminal-title-bar span:last-child');
          if (titleSpan) titleSpan.textContent = 'guest@scs-terminal — minimized';

          dotMinimize.title = 'Restore';

        } else {
          // Restore
          terminalEl.style.transition = 'height 0.4s cubic-bezier(0.16,1,0.3,1), border-radius 0.3s ease';
          terminalEl.style.height = '';
          terminalEl.style.overflow = '';

          setTimeout(() => {
            hiddenEls.forEach(el => {
              el.style.maxHeight = '';
              el.style.overflow = '';
              el.style.opacity = '1';
            });
            terminalEl.style.borderRadius = '';
          }, 100);

          const titleSpan = terminalEl.querySelector('.terminal-title-bar span:last-child');
          if (titleSpan) titleSpan.textContent = 'guest@scs-terminal — bash';

          dotMinimize.title = 'Minimize';
        }
      });
    }

    // ─── GREEN: Fullscreen / Window Zoom ───────────────────────
    if (dotFullscreen) {
      let zoomed = false;

      if (isTerminalPage) {
        // On the dedicated terminal page: use native Fullscreen API
        dotFullscreen.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        });

        // Sync dot state when user exits fullscreen via Esc
        document.addEventListener('fullscreenchange', () => {
          if (document.fullscreenElement) {
            dotFullscreen.style.background = '#27c93f';
            dotFullscreen.style.boxShadow = '0 0 8px rgba(39,201,63,0.7)';
          } else {
            dotFullscreen.style.background = '';
            dotFullscreen.style.boxShadow = '';
          }
        });

      } else {
        // On landing page: zoom/scale the terminal section to fill more screen
        const termSection = document.getElementById('terminal-section');

        dotFullscreen.addEventListener('click', (e) => {
          e.stopPropagation();
          zoomed = !zoomed;

          if (zoomed) {
            // Attempt native fullscreen
            if (terminalEl.requestFullscreen) {
              terminalEl.requestFullscreen().catch(() => {});
            }
          } else {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            }
          }
        });
      }
    }
  }

  // ─── CSS: Make dots interactive / clickable ─────────────────
  const style = document.createElement('style');
  style.textContent = `
    .terminal-dot {
      cursor: pointer;
      user-select: none;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .terminal-dots:hover .terminal-dot { filter: brightness(1.15); }
    .terminal-dot.red:hover    { box-shadow: 0 0 8px 2px rgba(255,95,86,0.6); }
    .terminal-dot.yellow:hover { box-shadow: 0 0 8px 2px rgba(255,189,46,0.6); }
    .terminal-dot.green:hover  { box-shadow: 0 0 8px 2px rgba(39,201,63,0.6); }

    /* Minimized terminal bar click to restore */
    .terminal-header-bar { cursor: default; }
  `;
  document.head.appendChild(style);

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTerminalControls);
  } else {
    initTerminalControls();
  }

})();
