/**
 * Astra Sec — Live Intel Panel
 * Combines real public threat feeds + realistic random simulation
 * to make the threat counter + log truly feel "live"
 */
(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────────
  const state = {
    total:    2847,  // starting baseline
    ddos:     412,
    malware:  891,
    phish:    763,
    brute:    781,
    perMin:   0,
    barPct:   0.78,
    logIdx:   0,
  };

  // ─── DOM refs ───────────────────────────────────────────────────
  const els = {
    val:      document.getElementById('h-threat-val'),
    delta:    document.getElementById('h-threat-delta'),
    bar:      document.getElementById('h-threat-bar'),
    barPulse: document.getElementById('h-threat-bar-pulse'),
    ddos:     document.getElementById('h-stat-ddos'),
    malware:  document.getElementById('h-stat-malware'),
    phish:    document.getElementById('h-stat-phish'),
    brute:    document.getElementById('h-stat-brute'),
    ts:       document.getElementById('h-live-ts'),
  };

  if (!els.val) return; // Not on landing page

  // ─── Realistic log event pool ────────────────────────────────────
  // Based on real-world cyber event categories
  const logEvents = [
    { cls: 'h-log-err',  msg: '[BLOCK] DDoS burst — 142Gbps → dropped' },
    { cls: 'h-log-ok',   msg: '[OK] TLS 1.3 handshake — verified' },
    { cls: 'h-log-warn', msg: '[!]   port.scan 0.0.0.0/0 — detected' },
    { cls: 'h-log-ok',   msg: '[OK] IDS signature update — applied' },
    { cls: 'h-log-err',  msg: '[BLOCK] SQLi attempt — 10.42.1.7' },
    { cls: 'h-log-warn', msg: '[!]   brute.ssh — 284 attempts/min' },
    { cls: 'h-log-ok',   msg: '[OK] WAF rule #4427 — triggered' },
    { cls: 'h-log-info', msg: '[→]   geo.block CN/RU — enforced' },
    { cls: 'h-log-err',  msg: '[BLOCK] XSS payload — /api/query' },
    { cls: 'h-log-ok',   msg: '[OK] cert rotation — complete' },
    { cls: 'h-log-warn', msg: '[!]   anon.proxy — tor exit node' },
    { cls: 'h-log-info', msg: '[→]   threat.intel feed — synced' },
    { cls: 'h-log-err',  msg: '[BLOCK] ransom.beacon — quarantine' },
    { cls: 'h-log-ok',   msg: '[OK] vpn.tunnel — re-established' },
    { cls: 'h-log-warn', msg: '[!]   CSRF token mismatch — /auth' },
    { cls: 'h-log-info', msg: '[→]   honeypot.hit — 185.220.101.x' },
    { cls: 'h-log-err',  msg: '[BLOCK] RCE attempt — CVE-2024-3400' },
    { cls: 'h-log-ok',   msg: '[OK] 2FA verified — session start' },
    { cls: 'h-log-warn', msg: '[!]   malware.sig match — epoch.exe' },
    { cls: 'h-log-info', msg: '[→]   SIEM alert #8821 — resolved' },
    { cls: 'h-log-err',  msg: '[BLOCK] phish.link → astrasec.fake' },
    { cls: 'h-log-ok',   msg: '[OK] sandbox.detonation — clean' },
    { cls: 'h-log-warn', msg: '[!]   API rate limit — 10k/s burst' },
    { cls: 'h-log-info', msg: '[→]   threat.map updated — 47 IPs' },
  ];

  // ─── Live clock ─────────────────────────────────────────────────
  function updateClock() {
    if (!els.ts) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    els.ts.textContent = `${hh}:${mm}:${ss}`;
  }

  // ─── Format number with commas ───────────────────────────────────
  function fmt(n) { return n.toLocaleString(); }

  // ─── Flash a stat cell briefly ───────────────────────────────────
  function flashCell(el) {
    if (!el) return;
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 500);
  }

  // ─── Render counters ─────────────────────────────────────────────
  function renderCounters() {
    if (els.val)     els.val.textContent     = fmt(state.total);
    if (els.ddos)    els.ddos.textContent    = fmt(state.ddos);
    if (els.malware) els.malware.textContent = fmt(state.malware);
    if (els.phish)   els.phish.textContent   = fmt(state.phish);
    if (els.brute)   els.brute.textContent   = fmt(state.brute);

    // Update /min delta badge
    if (els.delta) {
      const sign = state.perMin >= 0 ? '+' : '';
      els.delta.textContent = `${sign}${state.perMin}/min`;
    }

    // Update bar + pulse dot position
    const pct = Math.min(state.barPct * 100, 100);
    if (els.bar) els.bar.style.width = `${pct}%`;
    if (els.barPulse) els.barPulse.style.right = `${100 - pct}%`;
  }

  // ─── Boot-up count animation ─────────────────────────────────────
  function bootCount(targetEl, finalVal, duration = 1200) {
    if (!targetEl) return;
    let start = 0;
    const step = Math.ceil(finalVal / (duration / 16));
    const ticker = setInterval(() => {
      start = Math.min(start + step, finalVal);
      targetEl.textContent = fmt(start);
      if (start >= finalVal) clearInterval(ticker);
    }, 16);
  }

  // ─── Add a log line ──────────────────────────────────────────────
  function pushLog(cls, msg) {
    if (!els.logLines) return;

    const lines = els.logLines.querySelectorAll('.h-log-line');
    // Keep max 3 lines, remove oldest
    if (lines.length >= 3) lines[0].remove();

    const div = document.createElement('div');
    div.className = 'h-log-line';
    div.style.opacity = '0';
    div.innerHTML = `<span class="${cls}">${msg.split('—')[0].trim()}</span>${msg.includes('—') ? ' — ' + msg.split('—')[1].trim() : ''}`;
    els.logLines.appendChild(div);

    // Fade in
    requestAnimationFrame(() =>
      requestAnimationFrame(() => { div.style.opacity = '1'; })
    );
  }

  // ─── Simulate incremental live attack events ─────────────────────
  function simulateTick() {
    // Each tick: random new threats arrive
    const categories = ['ddos', 'malware', 'phish', 'brute'];
    const count = Math.floor(Math.random() * 4) + 1; // 1-4 threats per tick

    let minuteTotal = 0;
    for (let i = 0; i < count; i++) {
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const inc = Math.floor(Math.random() * 3) + 1;
      state[cat] += inc;
      state.total += inc;
      minuteTotal += inc;

      // Flash stat cell
      const cellMap = {
        ddos: els.ddos, malware: els.malware, phish: els.phish, brute: els.brute
      };
      flashCell(cellMap[cat]);
    }

    state.perMin = minuteTotal * 12; // approximate per-minute rate

    // Advance bar slightly (0.78 → 0.96 range, then reset to 0.6)
    state.barPct += Math.random() * 0.01;
    if (state.barPct > 0.96) state.barPct = 0.62;

    renderCounters();
  }

  // ─── Fetch real threat data from public APIs ─────────────────────
  // AbuseIPDB, Shodan, etc. require API keys — but we can use open feeds
  // Using URLhaus (MalwareBazaar open API) for real malware count approximation

  async function fetchRealThreatCount() {
    try {
      // URLhaus statistics - open, no auth needed
      const resp = await fetch('https://urlhaus-api.abuse.ch/v1/urls/recent/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'limit=10'
      });
      if (!resp.ok) return;
      const data = await resp.json();
      if (data && data.urls && data.urls.length > 0) {
        // Use URL count to nudge our malware counter with real data
        const realUrls = data.urls.filter(u => u.url_status === 'online').length;
        if (realUrls > 0) {
          state.malware += realUrls;
          state.total   += realUrls;
          renderCounters();

          // Push a real log entry
          const entry = data.urls[0];
          if (entry && entry.tags && entry.tags.length > 0) {
            pushLog('h-log-err', `[BLOCK] malware.url — ${entry.tags[0]} campaign`);
          } else {
            pushLog('h-log-err', `[BLOCK] live malware URL — neutralized`);
          }
        }
      }
    } catch (_) {
      // Silently fail — simulation continues regardless
    }
  }

  // ─── Stream log events ───────────────────────────────────────────
  function streamLog() {
    const event = logEvents[state.logIdx % logEvents.length];
    state.logIdx++;
    pushLog(event.cls, event.msg);
  }

  // ─── Init ────────────────────────────────────────────────────────
  function init() {
    // Boot-up animation: count up from 0 to baseline
    bootCount(els.val,     state.total,   1400);
    bootCount(els.ddos,    state.ddos,    1000);
    bootCount(els.malware, state.malware, 1200);
    bootCount(els.phish,   state.phish,   1100);
    bootCount(els.brute,   state.brute,   1000);

    // Bar fill animation boot
    setTimeout(() => {
      if (els.bar) els.bar.style.width = `${state.barPct * 100}%`;
    }, 900);

    // Clock: tick every second
    updateClock();
    setInterval(updateClock, 1000);

    // Simulate: new threats every 2.4s
    setInterval(simulateTick, 2400);

    // Log stream: new event every 2.8s
    setInterval(streamLog, 2800);

    // Real data fetch on load + every 60s
    fetchRealThreatCount();
    setInterval(fetchRealThreatCount, 60000);
  }

  // Boot after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
