/**
 * Astra Sec — Mini Threat Attack Map
 * Canvas-based world map with animated attack arcs (Checkpoint style)
 * Uses Mercator projection, no external deps needed
 */
(function () {
  'use strict';

  const canvas = document.getElementById('h-threatmap');
  if (!canvas) return;

  const lastEl = document.getElementById('h-threatmap-last');
  const ctx = canvas.getContext('2d');

  // ─── World city nodes (lat/lon) ─────────────────────────────────────
  const cities = [
    { name: 'New York',     lat: 40.7,   lon: -74.0,  code: 'US' },
    { name: 'London',       lat: 51.5,   lon: -0.1,   code: 'UK' },
    { name: 'Moscow',       lat: 55.75,  lon: 37.6,   code: 'RU' },
    { name: 'Beijing',      lat: 39.9,   lon: 116.4,  code: 'CN' },
    { name: 'Mumbai',       lat: 19.1,   lon: 72.9,   code: 'IN' },
    { name: 'São Paulo',    lat: -23.5,  lon: -46.6,  code: 'BR' },
    { name: 'Lagos',        lat: 6.5,    lon: 3.4,    code: 'NG' },
    { name: 'Tokyo',        lat: 35.7,   lon: 139.7,  code: 'JP' },
    { name: 'Sydney',       lat: -33.9,  lon: 151.2,  code: 'AU' },
    { name: 'Berlin',       lat: 52.5,   lon: 13.4,   code: 'DE' },
    { name: 'Paris',        lat: 48.9,   lon: 2.3,    code: 'FR' },
    { name: 'Toronto',      lat: 43.7,   lon: -79.4,  code: 'CA' },
    { name: 'Seoul',        lat: 37.6,   lon: 127.0,  code: 'KR' },
    { name: 'Istanbul',     lat: 41.0,   lon: 29.0,   code: 'TR' },
    { name: 'Cairo',        lat: 30.0,   lon: 31.2,   code: 'EG' },
    { name: 'Tehran',       lat: 35.7,   lon: 51.4,   code: 'IR' },
    { name: 'Pyongyang',    lat: 39.0,   lon: 125.7,  code: 'KP' },
    { name: 'Bucharest',    lat: 44.4,   lon: 26.1,   code: 'RO' },
    { name: 'Singapore',    lat:  1.3,   lon: 103.8,  code: 'SG' },
    { name: 'Chicago',      lat: 41.9,   lon: -87.6,  code: 'US' },
    { name: 'Los Angeles',  lat: 34.1,   lon: -118.2, code: 'US' },
    { name: 'Frankfurt',    lat: 50.1,   lon: 8.7,    code: 'DE' },
    { name: 'Amsterdam',    lat: 52.4,   lon: 4.9,    code: 'NL' },
    { name: 'Johannesburg', lat: -26.2,  lon: 28.0,   code: 'ZA' },
    { name: 'Buenos Aires', lat: -34.6,  lon: -58.4,  code: 'AR' },
    { name: 'Mexico City',  lat: 19.4,   lon: -99.1,  code: 'MX' },
    { name: 'Taipei',       lat: 25.0,   lon: 121.5,  code: 'TW' },
    { name: 'Kiev',         lat: 50.5,   lon: 30.5,   code: 'UA' },
    { name: 'Warsaw',       lat: 52.2,   lon: 21.0,   code: 'PL' },
    { name: 'Jakarta',      lat: -6.2,   lon: 106.8,  code: 'ID' },
  ];

  // Attack types with colours
  const attackTypes = [
    { type: 'DDoS',     color: '#ff5f56', glow: 'rgba(255,95,86,0.6)'  },
    { type: 'Malware',  color: '#ffb800', glow: 'rgba(255,184,0,0.6)'  },
    { type: 'Phishing', color: '#00f5ff', glow: 'rgba(0,245,255,0.6)'  },
    { type: 'Brute',    color: '#c8ff00', glow: 'rgba(200,255,0,0.6)'  },
    { type: 'SQLi',     color: '#ff3cac', glow: 'rgba(255,60,172,0.6)' },
  ];

  // Active arcs pool
  let arcs = [];
  let nodes = []; // city pixel positions, computed after resize
  let W = 0, H = 0;

  // ─── Mercator projection ─────────────────────────────────────────────
  function latLonToXY(lat, lon, w, h) {
    const x = (lon + 180) / 360 * w;
    const latRad = lat * Math.PI / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = h / 2 - w * mercN / (2 * Math.PI);
    return { x, y };
  }

  // ─── Resize handler ──────────────────────────────────────────────────
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width  = W * window.devicePixelRatio;
    canvas.height = H * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    // Recompute city pixel positions
    nodes = cities.map(c => ({
      ...c,
      ...latLonToXY(c.lat, c.lon, W, H)
    }));
  }

  // ─── Draw the simplified world map (land masses as polygons) ─────────
  // We use a minimal SVG-path-style list of key land outline points
  function drawMap() {
    ctx.clearRect(0, 0, W, H);

    // Ocean: very dark teal
    ctx.fillStyle = 'rgba(0, 8, 20, 0.0)';
    ctx.fillRect(0, 0, W, H);

    // Draw latitude grid lines
    ctx.strokeStyle = 'rgba(200,255,0,0.04)';
    ctx.lineWidth = 0.5;
    for (let lat = -60; lat <= 80; lat += 30) {
      ctx.beginPath();
      for (let lon = -180; lon <= 180; lon += 5) {
        const p = latLonToXY(lat, lon, W, H);
        lon === -180 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    // Longitude grid lines
    for (let lon = -150; lon <= 180; lon += 30) {
      ctx.beginPath();
      for (let lat = -85; lat <= 85; lat += 5) {
        const p = latLonToXY(lat, lon, W, H);
        lat === -85 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // Draw simplified continents as filled shapes
    drawContinents();
  }

  // Simplified continent outlines (just enough to be recognisable at tiny size)
  function drawContinents() {
    const land = 'rgba(30,40,28,0.85)';
    const border = 'rgba(200,255,0,0.08)';

    function poly(pts) {
      ctx.beginPath();
      pts.forEach(([lat, lon], i) => {
        const p = latLonToXY(lat, lon, W, H);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fillStyle = land;
      ctx.fill();
      ctx.strokeStyle = border;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    // North America
    poly([[72,-140],[83,-100],[83,-70],[72,-65],[60,-65],[45,-53],[25,-80],[15,-85],[15,-92],[24,-110],[32,-117],[40,-125],[50,-130],[60,-140],[72,-140]]);
    // South America
    poly([[12,-72],[12,-62],[0,-50],[-5,-35],[-10,-37],[-23,-43],[-34,-53],[-55,-65],[-55,-72],[-40,-65],[-20,-70],[-5,-75],[10,-75],[12,-72]]);
    // Europe
    poly([[71,28],[64,14],[58,5],[44,-2],[37,-9],[36,3],[37,15],[42,28],[47,40],[55,38],[60,30],[65,25],[71,28]]);
    // Africa
    poly([[37,10],[32,33],[22,36],[12,44],[0,42],[-12,40],[-26,33],[-35,20],[-35,10],[-20,-17],[0,-18],[17,-16],[33,-17],[37,10]]);
    // Asia (simplified)
    poly([[72,30],[72,100],[65,140],[55,160],[45,135],[35,135],[25,120],[10,105],[0,103],[10,80],[20,60],[30,50],[37,55],[40,68],[50,80],[60,70],[65,40],[72,30]]);
    // Oceania/Australia
    poly([[-16,130],[-26,152],[-38,145],[-38,140],[-34,120],[-22,114],[-16,124],[-16,130]]);
    // Greenland
    poly([[83,-20],[83,-70],[72,-65],[65,-52],[65,-18],[72,-18],[83,-20]]);
  }

  // ─── City node dots ──────────────────────────────────────────────────
  function drawNodes() {
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,255,0,0.35)';
      ctx.fill();
    });
  }

  // ─── Arc rendering ───────────────────────────────────────────────────
  function spawnArc() {
    const from = nodes[Math.floor(Math.random() * nodes.length)];
    let to;
    do { to = nodes[Math.floor(Math.random() * nodes.length)]; } while (to === from);
    const at = attackTypes[Math.floor(Math.random() * attackTypes.length)];

    // Control point: midpoint lifted upward
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2 - Math.abs(to.x - from.x) * 0.3 - 10;

    arcs.push({
      from, to,
      cx: mx, cy: my,     // bezier control point
      progress: 0,
      speed: 0.008 + Math.random() * 0.012,
      color: at.color,
      glow: at.glow,
      type: at.type,
      trail: [],           // keep last N points for fading trail
      done: false,
    });

    // Update last-attack ticker
    if (lastEl) {
      lastEl.innerHTML =
        `<span style="color:${at.color}">[${at.type}]</span> ${from.code} → ${to.code} &nbsp;${from.name}`;
    }
  }

  // Quadratic bezier point
  function bezier(t, p0, p1, p2) {
    const mt = 1 - t;
    return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
  }

  function updateArcs() {
    arcs = arcs.filter(a => !a.done);
    arcs.forEach(a => {
      a.progress = Math.min(a.progress + a.speed, 1);
      const x = bezier(a.progress, a.from.x, a.cx, a.to.x);
      const y = bezier(a.progress, a.from.y, a.cy, a.to.y);
      a.trail.push({ x, y });
      if (a.trail.length > 18) a.trail.shift();
      if (a.progress >= 1) {
        a.done = true;
        // Impact pulse at target
        spawnImpact(a.to.x, a.to.y, a.color);
      }
    });
  }

  // Impact pulses
  let impacts = [];
  function spawnImpact(x, y, color) {
    impacts.push({ x, y, color, r: 1, maxR: 10, alpha: 1 });
  }

  function drawArcs() {
    arcs.forEach(a => {
      if (a.trail.length < 2) return;

      // Draw fading trail
      for (let i = 1; i < a.trail.length; i++) {
        const t = i / a.trail.length;
        ctx.beginPath();
        ctx.moveTo(a.trail[i - 1].x, a.trail[i - 1].y);
        ctx.lineTo(a.trail[i].x, a.trail[i].y);
        ctx.strokeStyle = a.color + Math.floor(t * 180).toString(16).padStart(2,'0');
        ctx.lineWidth = t * 1.2;
        ctx.stroke();
      }

      // Glowing head
      const head = a.trail[a.trail.length - 1];
      ctx.beginPath();
      ctx.arc(head.x, head.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = a.color;
      ctx.shadowColor = a.glow;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function drawImpacts() {
    impacts = impacts.filter(ip => ip.alpha > 0);
    impacts.forEach(ip => {
      ctx.beginPath();
      ctx.arc(ip.x, ip.y, ip.r, 0, Math.PI * 2);
      ctx.strokeStyle = ip.color + Math.floor(ip.alpha * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 1;
      ctx.stroke();
      ip.r     += 0.6;
      ip.alpha -= 0.045;
    });
  }

  // ─── Main animation loop ─────────────────────────────────────────────
  let frame = 0;
  function loop() {
    drawMap();    // redraw map each frame (lightweight)
    drawNodes();
    updateArcs();
    drawArcs();
    drawImpacts();
    frame++;
    requestAnimationFrame(loop);
  }

  // Spawn arcs at random intervals
  function scheduleArc() {
    spawnArc();
    const delay = 600 + Math.random() * 1200;
    setTimeout(scheduleArc, delay);
  }

  // ─── Boot ────────────────────────────────────────────────────────────
  function init() {
    resize();
    window.addEventListener('resize', () => { resize(); });

    // Initial burst of arcs
    for (let i = 0; i < 3; i++) {
      setTimeout(spawnArc, i * 400);
    }
    scheduleArc();
    loop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
