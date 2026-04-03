/**
 * SCS — CINEMATIC ENGINE v5.0
 * GSAP ScrollTrigger  +  Three.js Globe & Starfield
 * ─────────────────────────────────────────────────
 */
(function () {
  'use strict';

  /* ══════════════════════ STATE ══════════════════════ */
  const st = {
    nX: 0, nY: 0,
    targetNX: 0, targetNY: 0,
    matrixActive: false,
    terminalBooted: false,
    cmdHistory: [], cmdHistoryIdx: -1, currentCmd: '',
    globeT: 0,
  };

  let els = {};

  /* ══════════════════ ELEMENT CACHE ══════════════════ */
  function resolveEls() {
    els = {
      bgCanvas:     document.getElementById('cin-bg-canvas'),
      bgRoom:       document.getElementById('cin-room'),
      gridCanvas:   document.getElementById('cin-grid-canvas'),
      globe:        document.getElementById('cin-globe'),
      globeCanvas:  document.getElementById('cin-globe-canvas'),
      scene1:       document.getElementById('cin-s1'),
      s1Cards:      document.getElementById('cin-s1-cards'),
      miniCards:    document.querySelectorAll('.cin-mini-card'),
      scene2ui:     document.getElementById('cin-s2'),
      holoWrap:     document.getElementById('cin-s3'),
      holoPanels:   document.querySelectorAll('.cin-holo-panel'),
      entering:     document.getElementById('cin-entering'),
      termOverlay:  document.getElementById('cin-term'),
      matrixCanvas: document.getElementById('cin-matrix'),
      termBody:     document.getElementById('cin-term-body'),
      termInput:    document.getElementById('cin-term-input'),
      termOutput:   document.getElementById('cin-term-output'),
      cursorDot:    document.getElementById('cin-cursor-dot'),
      cursorRing:   document.getElementById('cin-cursor-ring'),
      progressDots: document.querySelectorAll('.cin-progress-dot'),
      thrThreat:    document.getElementById('cin-stat-threats'),
      thrNodes:     document.getElementById('cin-stat-nodes'),
      thrCtf:       document.getElementById('cin-stat-ctf'),
      clock:        document.getElementById('cin-clock'),
      sessionId:    document.getElementById('cin-session-id'),
    };
  }

  /* ══════════════════════ GSAP ════════════════════════ */
  function initGSAP() {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // ── Initial hidden states ──
    gsap.set([els.scene2ui, els.holoWrap, els.entering, els.termOverlay], { opacity: 0 });
    gsap.set(els.holoPanels, { opacity: 0, y: 70, rotationX: 22, transformPerspective: 900, force3D: true });
    gsap.set(els.globe, { opacity: 0, scale: 0.4, yPercent: -50 });

    // ── Master scroll timeline ──
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.cin-scroll-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.4,
        onUpdate(self) {
          const p = self.progress;
          // Progress dots
          let a = 0;
          if (p >= 0.75) a = 3;
          else if (p >= 0.5) a = 2;
          else if (p >= 0.25) a = 1;
          els.progressDots.forEach((d, i) => d.classList.toggle('active', i === a));

          // Grid opacity
          const gridOp = smoothstep(0.2, 0.45, p) * (1 - smoothstep(0.45, 0.65, p));
          if (els.gridCanvas) els.gridCanvas.style.opacity = gridOp;

          // Terminal activation
          if (p > 0.8 && !st.matrixActive)      activateTerminal();
          if (p <= 0.8 && st.matrixActive)       deactivateTerminal();
        }
      }
    });

    // ── S1 → S2: hero exits, globe enters ──
    tl.to(els.scene1,  { opacity: 0, x: -90, rotationY: -7, transformPerspective: 700, duration: 0.5, ease: 'power2.in' }, 0.55)
      .to(els.s1Cards,  { opacity: 0, x: 60, duration: 0.4 }, 0.55)
      .to(els.miniCards, { opacity: 0, y: 12, stagger: 0.04, duration: 0.35 }, 0.6)
      .to(els.bgRoom,   { scale: 1.14, filter: 'brightness(0.35) contrast(1.1) saturate(0.6)', transformOrigin: 'center center', duration: 2, ease: 'none' }, 0)
      .to(els.globe,    { opacity: 1, scale: 1, yPercent: -50, duration: 0.7, ease: 'expo.out' }, 0.8)
      .to(els.scene2ui, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 1.0)

    // ── S2 → S3: globe exits, panels enter ──
      .to(els.globe,    { opacity: 0, scale: 0.72, duration: 0.45, ease: 'power2.in' }, 1.8)
      .to(els.scene2ui, { opacity: 0, y: -20, duration: 0.4 }, 1.8)
      .to(els.bgRoom,   { opacity: 0.35, duration: 0.45 }, 1.9)
      .to(els.holoWrap, { opacity: 1, duration: 0.01 }, 1.95)
      .to(els.holoPanels, { opacity: 1, y: 0, rotationX: 0, stagger: 0.18, duration: 0.65, ease: 'power3.out' }, 2.0)

    // ── S3 → S4: panels exit, terminal enters ──
      .to(els.holoPanels, { opacity: 0, y: -30, stagger: 0.08, duration: 0.35 }, 2.9)
      .to(els.holoWrap,   { opacity: 0, duration: 0.01 }, 3.05)
      .to(els.entering,   { opacity: 1, duration: 0.18 }, 3.1)
      .to(els.entering,   { opacity: 0, duration: 0.18 }, 3.3)
      .to(els.bgRoom,     { opacity: 0, duration: 0.5 }, 3.2)
      .to(els.termOverlay, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 3.3);

    // ── Progress dot clicks ──
    const snaps = [0, 0.25, 0.5, 0.75];
    els.progressDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const max = window.innerHeight * 4;
        window.scrollTo({ top: snaps[i] * max, behavior: 'smooth' });
      });
    });

    // ── Panel 3D hover via GSAP ──
    setTimeout(initPanelHover, 300);
  }

  function smoothstep(lo, hi, t) {
    const x = Math.max(0, Math.min(1, (t - lo) / (hi - lo)));
    return x * x * (3 - 2 * x);
  }

  /* ════════════════ TERMINAL ACTIVATION ══════════════ */
  function activateTerminal() {
    st.matrixActive = true;
    els.termOverlay.classList.add('active');
    els.termOverlay.style.pointerEvents = 'auto';
    els.matrixCanvas && els.matrixCanvas.classList.add('active');
    if (!st.terminalBooted) {
      st.terminalBooted = true;
      setTimeout(() => {
        els.termInput && els.termInput.focus();
        bootTerminal();
      }, 350);
    }
  }
  function deactivateTerminal() {
    st.matrixActive = false;
    els.termOverlay.classList.remove('active');
    els.termOverlay.style.pointerEvents = 'none';
    els.matrixCanvas && els.matrixCanvas.classList.remove('active');
  }

  /* ══════════════════════ MOUSE ═══════════════════════ */
  function initMouse() {
    document.addEventListener('mousemove', e => {
      st.targetNX = (e.clientX / window.innerWidth  - 0.5) * 2;
      st.targetNY = (e.clientY / window.innerHeight - 0.5) * 2;
      if (typeof gsap === 'undefined') return;
      gsap.to(els.cursorDot,  { x: e.clientX, y: e.clientY, duration: 0.08, ease: 'power1.out' });
      gsap.to(els.cursorRing, { x: e.clientX, y: e.clientY, duration: 0.22, ease: 'power2.out' });
      // Globe mouse pan (only while visible)
      if (els.globe) {
        gsap.to(els.globe, { x: st.targetNX * 20, duration: 1.1, ease: 'power2.out', overwrite: 'auto' });
      }
    }, { passive: true });
    document.addEventListener('mousedown', () => els.cursorRing?.classList.add('clicking'));
    document.addEventListener('mouseup', () => els.cursorRing?.classList.remove('clicking'));
    document.addEventListener('mouseover', e => {
      if (e.target.closest('a,button,.cin-progress-dot,.cin-term-dot,input'))
        els.cursorRing?.classList.add('hovering');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest('a,button,.cin-progress-dot,.cin-term-dot,input'))
        els.cursorRing?.classList.remove('hovering');
    });
  }

  /* ════════════════ PANEL 3D HOVER ═══════════════════ */
  function initPanelHover() {
    if (typeof gsap === 'undefined') return;
    const bases = [-7, 0, 7];
    els.holoPanels.forEach((panel, i) => {
      const ry = bases[i] || 0;
      panel.addEventListener('mousemove', e => {
        const r = panel.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width  - 0.5) * 2;
        const y = ((e.clientY - r.top)  / r.height - 0.5) * 2;
        gsap.to(panel, { rotationX: y * -9, rotationY: x * 9 + ry, duration: 0.4, ease: 'power2.out', transformPerspective: 900, overwrite: 'auto' });
        gsap.to(panel, { boxShadow: `${x*16}px ${y*10}px 55px rgba(0,245,255,.14), 0 0 0 1px rgba(0,245,255,.24), 0 30px 80px rgba(0,0,0,.75)`, duration: 0.4 });
      });
      panel.addEventListener('mouseleave', () => {
        gsap.to(panel, { rotationX: 0, rotationY: ry, duration: 0.7, ease: 'elastic.out(1,0.6)', transformPerspective: 900, overwrite: 'auto' });
        gsap.to(panel, { boxShadow: '', duration: 0.5 });
      });
    });
  }

  /* ════════════ THREE.JS STARFIELD BACKGROUND ═════════ */
  function buildStarfield() {
    const canvas = els.bgCanvas;
    if (!canvas || typeof THREE === 'undefined') return;
    const R = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    R.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    R.setSize(window.innerWidth, window.innerHeight);
    R.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const cam   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    cam.position.z = 600;

    const N = 1600, pos = new Float32Array(N*3), col = new Float32Array(N*3);
    const pal = [[0.78,1,0],[0,0.96,1],[1,1,1],[0.6,0.6,1]];
    for (let i=0; i<N; i++) {
      pos[i*3]   = (Math.random()-.5)*1800;
      pos[i*3+1] = (Math.random()-.5)*1000;
      pos[i*3+2] = (Math.random()-.5)*1000-100;
      const c = pal[Math.floor(Math.random()*pal.length)];
      col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col,3));
    const mat = new THREE.PointsMaterial({ vertexColors:true, size:1.6, sizeAttenuation:true, transparent:true, opacity:0.65, blending:THREE.AdditiveBlending, depthWrite:false });
    const stars = new THREE.Points(geo, mat);
    scene.add(stars);

    // Connection lines
    const lN=55, lPos=new Float32Array(lN*6), lCol=new Float32Array(lN*6);
    for (let i=0;i<lN;i++){
      const x1=(Math.random()-.5)*1500, y1=(Math.random()-.5)*900, z1=(Math.random()-.5)*400-100;
      lPos[i*6]=x1;lPos[i*6+1]=y1;lPos[i*6+2]=z1;
      lPos[i*6+3]=x1+(Math.random()-.5)*280;lPos[i*6+4]=y1+(Math.random()-.5)*180;lPos[i*6+5]=z1;
      const acid=Math.random()>.5;
      const r=acid?.78:0, g=acid?1:.96, b=acid?0:1;
      lCol[i*6]=r;lCol[i*6+1]=g;lCol[i*6+2]=b;lCol[i*6+3]=r;lCol[i*6+4]=g;lCol[i*6+5]=b;
    }
    const lGeo=new THREE.BufferGeometry();
    lGeo.setAttribute('position',new THREE.BufferAttribute(lPos,3));
    lGeo.setAttribute('color',   new THREE.BufferAttribute(lCol,3));
    const lMat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0.1,blending:THREE.AdditiveBlending,depthWrite:false});
    const lines=new THREE.LineSegments(lGeo,lMat);
    scene.add(lines);

    window.addEventListener('resize',()=>{ cam.aspect=window.innerWidth/window.innerHeight; cam.updateProjectionMatrix(); R.setSize(window.innerWidth,window.innerHeight); });

    let t=0;
    (function loop(){
      requestAnimationFrame(loop); t+=0.00012;
      stars.rotation.y = t;
      stars.rotation.x = st.nY * 0.05;
      lines.rotation.y = t;
      cam.position.x = st.nX * 35;
      cam.position.y = st.nY * -20;
      // fade near terminal
      const p = window.scrollY / (window.innerHeight*4);
      mat.opacity  = p>.75 ? 0.08 : 0.4 + (1-p)*.28;
      lMat.opacity = p>.75 ? 0.02 : 0.08 + (1-p)*.08;
      R.render(scene,cam);
    })();
  }

  /* ═══════════════ THREE.JS GLOBE ════════════════════ */
  function buildGlobe() {
    const canvas = els.globeCanvas;
    if (!canvas || typeof THREE === 'undefined') return;

    const W = canvas.parentElement.offsetWidth  || 400;
    const H = canvas.parentElement.offsetHeight || 400;

    const R   = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
    R.setPixelRatio(Math.min(window.devicePixelRatio,2));
    R.setSize(W,H);
    R.setClearColor(0x000000,0);

    const scene  = new THREE.Scene();
    const cam    = new THREE.PerspectiveCamera(44, W/H, 0.1, 100);
    cam.position.z = 2.8;

    const grp = new THREE.Group();
    scene.add(grp);

    // ── Core sphere (dark)
    grp.add(new THREE.Mesh(
      new THREE.SphereGeometry(1,40,40),
      new THREE.MeshBasicMaterial({ color:0x010812, transparent:true, opacity:0.92 })
    ));

    // ── Wireframe overlay
    grp.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.001,24,24),
      new THREE.MeshBasicMaterial({ color:0x00f5ff, wireframe:true, transparent:true, opacity:0.1 })
    ));

    // ── Lat / Lon grid lines
    function latLine(latDeg, opacity) {
      const r = Math.cos(latDeg*Math.PI/180);
      const y = Math.sin(latDeg*Math.PI/180);
      const pts=[];
      for(let i=0;i<=80;i++) {
        const a=i/80*Math.PI*2;
        pts.push(new THREE.Vector3(r*Math.cos(a),y,r*Math.sin(a)));
      }
      const g=new THREE.BufferGeometry().setFromPoints(pts);
      return new THREE.Line(g, new THREE.LineBasicMaterial({color:0x00f5ff,transparent:true,opacity}));
    }
    function lonLine(lonDeg, opacity){
      const r=(lonDeg*Math.PI/180);
      const pts=[];
      for(let i=0;i<=80;i++){
        const a=(i/80)*Math.PI*2;
        pts.push(new THREE.Vector3(Math.cos(a)*Math.cos(r),Math.sin(a),Math.cos(a)*Math.sin(r)));
      }
      const g=new THREE.BufferGeometry().setFromPoints(pts);
      return new THREE.Line(g,new THREE.LineBasicMaterial({color:0x00f5ff,transparent:true,opacity}));
    }
    for(let lat=-75;lat<=75;lat+=30) grp.add(latLine(lat, lat%30===0?0.22:0.08));
    for(let lon=0;lon<360;lon+=30) grp.add(lonLine(lon, 0.1));

    // ── Glowing node dots (major cities)
    const cities = [
      [37.77,-122.42],[40.71,-74.01],[51.51,-0.13],[35.68,139.69],
      [22.32,114.17],[1.35,103.82],[48.86,2.35],[-33.87,151.21],
      [55.75,37.62],[19.08,72.88],
    ];
    const nodeMat  = new THREE.MeshBasicMaterial({ color:0xc8ff00 });
    const ringMat  = new THREE.MeshBasicMaterial({ color:0xc8ff00, transparent:true, opacity:0.4, side:THREE.DoubleSide });
    cities.forEach(([lat,lon])=>{
      const φ=lat*Math.PI/180, λ=lon*Math.PI/180;
      const x=Math.cos(φ)*Math.cos(λ), y=Math.sin(φ), z=Math.cos(φ)*Math.sin(λ);
      const dot=new THREE.Mesh(new THREE.SphereGeometry(0.022,8,8),nodeMat);
      dot.position.set(x,y,z); grp.add(dot);
      const ring=new THREE.Mesh(new THREE.RingGeometry(0.028,0.045,16),ringMat.clone());
      ring.position.set(x*1.003,y*1.003,z*1.003); ring.lookAt(0,0,0); grp.add(ring);
    });

    // ── Orbital ring (animated)
    const orbPts=[];
    for(let i=0;i<=120;i++){
      const a=i/120*Math.PI*2;
      orbPts.push(new THREE.Vector3(Math.cos(a)*1.25, Math.sin(a*0.28)*0.12, Math.sin(a)*1.25));
    }
    const orbLine=new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(orbPts),
      new THREE.LineBasicMaterial({color:0x00f5ff,transparent:true,opacity:0.45})
    );
    scene.add(orbLine);   // scene (not grp) so it doesn't rotate with globe

    // Traveler dot on orbital
    const traveler=new THREE.Mesh(
      new THREE.SphereGeometry(0.038,8,8),
      new THREE.MeshBasicMaterial({color:0x00f5ff})
    );
    scene.add(traveler);
    // Traveler glow halo
    const travHalo=new THREE.Mesh(
      new THREE.SphereGeometry(0.06,8,8),
      new THREE.MeshBasicMaterial({color:0x00f5ff,transparent:true,opacity:0.15})
    );
    traveler.add(travHalo);

    // ── Atmosphere glow shell
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.09,32,32),
      new THREE.MeshBasicMaterial({color:0x00f5ff,transparent:true,opacity:0.04,side:THREE.BackSide})
    ));
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.14,32,32),
      new THREE.MeshBasicMaterial({color:0x00c5ff,transparent:true,opacity:0.02,side:THREE.BackSide})
    ));

    // ── Lights
    scene.add(new THREE.AmbientLight(0x112233,2));
    const pl=new THREE.PointLight(0x00f5ff,2,10);
    pl.position.set(3,2,3); scene.add(pl);
    const pl2=new THREE.PointLight(0xc8ff00,0.8,8);
    pl2.position.set(-3,-1,-2); scene.add(pl2);

    (function loopGlobe(){
      requestAnimationFrame(loopGlobe);
      st.globeT += 0.007;
      grp.rotation.y  = st.globeT * 0.28;
      grp.rotation.x  = st.nY * 0.25;
      orbLine.rotation.y = -st.globeT * 0.12;

      const ta=st.globeT*1.4;
      traveler.position.set(Math.cos(ta)*1.25, Math.sin(ta*0.28)*0.12, Math.sin(ta)*1.25);
      R.render(scene,cam);
    })();
  }

  /* ═════════════ PERSPECTIVE GRID CANVAS ═════════════ */
  function initGrid() {
    const canvas=els.gridCanvas; if(!canvas) return;
    const ctx=canvas.getContext('2d');
    let W,H;
    function resize(){ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight*.45; }
    resize();
    window.addEventListener('resize',resize,{passive:true});

    function draw(){
      ctx.clearRect(0,0,W,H);
      const vx=W/2, vy=H*.04;
      const rows=18, cols=24;
      // Horizontal lines
      for(let r=0;r<=rows;r++){
        const t=r/rows, y=vy+(H-vy)*(t*t);
        const xl=W*(.5-t*.5), xr=W*(.5+t*.5);
        ctx.beginPath(); ctx.strokeStyle=`rgba(0,245,255,${t*.24})`; ctx.lineWidth=t<.2?.5:1;
        ctx.moveTo(xl,y); ctx.lineTo(xr,y); ctx.stroke();
      }
      // Vertical lines
      for(let c=0;c<=cols;c++){
        const t=c/cols,bx=W*t;
        ctx.beginPath(); ctx.strokeStyle=`rgba(0,245,255,${Math.max(0,.18-Math.abs(t-.5)*.2)})`;
        ctx.lineWidth=.5; ctx.moveTo(vx+(bx-vx)*0, vy); ctx.lineTo(bx, H); ctx.stroke();
      }
      // Horizon glow
      const hg=ctx.createLinearGradient(0,vy-2,0,vy+8);
      hg.addColorStop(0,'rgba(0,245,255,0)'); hg.addColorStop(.5,'rgba(0,245,255,.5)'); hg.addColorStop(1,'rgba(0,245,255,0)');
      ctx.fillStyle=hg; ctx.fillRect(0,vy-2,W,10);
    }
    draw();
    window.addEventListener('resize',draw,{passive:true});
  }

  /* ════════════════ MATRIX RAIN ═══════════════════════ */
  function initMatrix() {
    const canvas=els.matrixCanvas; if(!canvas) return;
    const ctx=canvas.getContext('2d');
    function resize(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
    resize(); window.addEventListener('resize',resize,{passive:true});
    const chars='01アイウエオカキサシスタチツABCDEF0123456789';
    const fs=13; let cols=Math.floor(canvas.width/fs);
    let drops=Array.from({length:cols},()=>Math.random()*-100);
    setInterval(()=>{
      ctx.fillStyle='rgba(5,5,8,0.06)'; ctx.fillRect(0,0,canvas.width,canvas.height);
      for(let i=0;i<drops.length;i++){
        const ch=chars[Math.floor(Math.random()*chars.length)];
        const x=i*fs, y=drops[i]*fs;
        const head=(drops[i]%1)<.06;
        ctx.fillStyle=head?`rgba(255,255,255,${.7+Math.random()*.3})`:`rgba(200,255,0,${.15+Math.random()*.55})`;
        ctx.font=`${fs}px 'JetBrains Mono',monospace`;
        ctx.fillText(ch,x,y);
        if(y>canvas.height&&Math.random()>.975) drops[i]=0;
        drops[i]+=.55;
      }
    },48);
  }

  /* ═══════════════ TERMINAL ENGINE ════════════════════ */
  const CMD = { help,whoami,ls,status,nmap,scan,hack,ctf,projects,ping,join,clear,exit:cmdExit };

  function bootTerminal() {
    [
      {t:'> Initialising SCS-OS v4.0 kernel...',      d:150,  c:'info'},
      {t:'> Loading threat intelligence corpus... [OK]',d:550,  c:'success'},
      {t:'> Mounting encrypted filesystem AES-256... [OK]',d:950, c:'success'},
      {t:'> Establishing VPN tunnel [TUN0]... [OK]',   d:1350, c:'success'},
      {t:'> System ready. Type "help" for commands.',   d:1800, c:'info'},
    ].forEach(({t,d,c})=>setTimeout(()=>printLine(t,c),d));
    if(els.sessionId) els.sessionId.textContent=Math.random().toString(36).slice(2,10).toUpperCase();
  }

  function printLine(text,cls=''){
    if(!els.termOutput) return;
    const d=document.createElement('div');
    d.className=`term-out-line ${cls}`;
    d.innerHTML=text.replace(/\[OK\]/g,'<span style="color:#27c93f">[OK]</span>').replace(/\[FAIL\]/g,'<span style="color:#ff5f56">[FAIL]</span>');
    els.termOutput.appendChild(d);
    els.termBody&&(els.termBody.scrollTop=els.termBody.scrollHeight);
  }
  function printLines(lines){ lines.forEach((l,i)=>setTimeout(()=>printLine(l.t||l,l.c||''),i*55)); }
  function echoCmd(cmd){
    if(!els.termOutput) return;
    const d=document.createElement('div'); d.className='term-out-line';
    d.innerHTML=`<span style="color:var(--acid)">guest@scs:~$</span> <span style="color:var(--white)">${esc(cmd)}</span>`;
    els.termOutput.appendChild(d);
    els.termBody&&(els.termBody.scrollTop=els.termBody.scrollHeight);
  }
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  function help(){ printLines([
    {t:'┌─ SCS COMMANDS ──────────────────────────────────────────────┐',c:'info'},
    {t:'│ help     whoami   ls        status    nmap     scan          │',c:'dim'},
    {t:'│ hack     ctf      projects  ping      join     clear   exit  │',c:'dim'},
    {t:'└──────────────────────────────────────────────────────────────┘',c:'info'},
  ]); }
  function whoami(){ const s=Math.random().toString(36).slice(2,10).toUpperCase(); printLines([
    {t:'╔══ IDENTITY RECORD ══════════════════════════════════════════╗',c:'info'},
    {t:'║  USER   : guest                                              ║'},
    {t:'║  ROLE   : Unauthenticated Visitor                           ║',c:'warn'},
    {t:'║  ACCESS : LEVEL 0 — Read Only                               ║'},
    {t:`║  SESSION: ${s}-GUEST                                     ║`,c:'info'},
    {t:'╚═════════════════════════════════════════════════════════════╝',c:'info'},
    {t:'  → Join SCS to upgrade: join.html',c:'success'},
  ]); }
  function ls(){ printLines([
    {t:'drwxr-xr-x  scs-core/',c:'info'},{t:'drwxr-x---  red-team/  [LOCKED]',c:'warn'},
    {t:'drwxr-x---  blue-team/ [LOCKED]',c:'warn'},{t:'drwxr-x---  osint/     [LOCKED]',c:'warn'},
    {t:'-rw-r--r--  README.md'},{t:'-rwx------  ./init_membership [LOCKED]',c:'error'},
  ]); }
  function status(){ printLines([
    {t:'── LIVE SYSTEM STATUS ─────────────────────────────────────',c:'info'},
    {t:`  Threats blocked : ${(Math.floor(Math.random()*600)+1200).toLocaleString()}`,c:'success'},
    {t:`  Node integrity  : ${Math.floor(Math.random()*10+86)}%`,c:'success'},
    {t:'  IDS             : ACTIVE',c:'success'},{t:'  Honeypots       : 14 deployed',c:'warn'},
    {t:`  CTF running     : YES — Round #${Math.floor(Math.random()*10+1)}`,c:'warn'},
    {t:'──────────────────────────────────────────────────────────',c:'info'},
  ]); }
  function nmap(raw){ const ip=`192.168.${~~(Math.random()*255)}.${~~(Math.random()*255)}`; const ports={22:'ssh',80:'http',443:'https',3389:'rdp',8080:'proxy'};
    printLine(`Nmap → ${(raw||'').replace('nmap','').trim()||'scs.local'} (${ip})`, 'info');
    Object.entries(ports).forEach(([p,s],i)=>setTimeout(()=>printLine(`  ${p.padEnd(7)} ${Math.random()>.38?'open  ':'closed'} ${s}`,Math.random()>.38?'success':'dim'),i*80));
    setTimeout(()=>printLine(`Done — scanned in ${(Math.random()*3+1).toFixed(2)}s`,'info'),500);
  }
  function scan(){ [{t:'[*] Initialising scanner...',c:'info',d:0},{t:'[!] CVE-2023-1234 — Log4j [CRITICAL]',c:'error',d:600},{t:'[!] CVE-2022-0847 — DirtyPipe [HIGH]',c:'error',d:1100},{t:'[~] CVE-2021-3156 — sudo overflow [MEDIUM]',c:'warn',d:1600},{t:'Scan complete. 3 CVEs found.',c:'info',d:2100}].forEach(({t,c,d})=>setTimeout(()=>printLine(t,c),d)); }
  function hack(){ [{t:'[!] INITIATING BREACH SEQUENCE...',c:'hack',d:0},{t:'[*] Scanning attack surface...',c:'info',d:400},{t:'[*] Vectors found: SSH, HTTP, SMB',c:'warn',d:800},{t:'[*] SQL injection... [FAIL]',c:'error',d:1200},{t:'[+] Discovered /admin/upload — unrestricted!',c:'success',d:1800},{t:'  ████████████████░░░░  82%...',c:'hack',d:2400},{t:'[!] COUNTERMEASURE TRIGGERED — ABORT',c:'error',d:3000},{t:'  SCS: Only hack what you own. → join.html',c:'warn',d:3400}].forEach(({t,c,d})=>setTimeout(()=>printLine(t,c),d)); }
  function ctf(){ printLines([
    {t:'┌─ CTF LEADERBOARD ─────────────────────────────────────┐',c:'info'},
    {t:'│  #1  0xDeadBeef     4,820 pts  🏆                      │',c:'hack'},
    {t:'│  #2  n4cr0m4nc3r    4,210 pts                          │'},
    {t:'│  #3  shellsh3ll     3,890 pts                          │'},
    {t:'│  ??? guest          0 pts  [join first]                │',c:'warn'},
    {t:'└───────────────────────────────────────────────────────┘',c:'info'},
  ]); }
  function projects(){ printLines([
    {t:'── ACTIVE RESEARCH ────────────────────────────────',c:'info'},
    {t:'  [1] AstraNet   — Threat intelligence aggregator'},{t:'  [2] HexLens    — Browser hex editor + disassembler'},
    {t:'  [3] ShadowVM   — Malware analysis sandbox'},{t:'  → projects.html',c:'success'},
  ]); }
  function ping(raw){ const h=(raw||'').replace('ping','').trim()||'scs.local';
    printLine(`PING ${h}`,'info');
    for(let i=0;i<4;i++) setTimeout(()=>printLine(`64 bytes from ${h}: seq=${i+1} ttl=64 time=${(Math.random()*8+1).toFixed(1)}ms`,'success'),i*350);
    setTimeout(()=>printLine('4 transmitted, 4 received, 0% loss','success'),1500);
  }
  function join(){ printLines([{t:'[*] Opening recruitment portal...',c:'info'},{t:'[+] Redirecting to join.html...',c:'success'}]); setTimeout(()=>{window.location.href='join.html';},1800); }
  function clear(){ if(els.termOutput) els.termOutput.innerHTML=''; }
  function cmdExit(){ printLines([{t:'[*] Terminating session...',c:'warn'},{t:'[+] Goodbye.',c:'info'}]); setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),900); }

  function initTerminal(){
    if(!els.termInput) return;
    els.termInput.addEventListener('keydown', e=>{
      if(e.key==='Enter'){
        const raw=els.termInput.value.trim(); if(!raw) return;
        st.cmdHistory.unshift(raw); st.cmdHistoryIdx=-1; st.currentCmd='';
        const cmd=raw.toLowerCase().split(' ')[0];
        echoCmd(raw); els.termInput.value='';
        CMD[cmd] ? CMD[cmd](raw) : printLine(`Command not found: ${esc(cmd)} — type "help"`, 'error');
      } else if(e.key==='ArrowUp'){
        e.preventDefault();
        if(st.cmdHistoryIdx===-1) st.currentCmd=els.termInput.value;
        st.cmdHistoryIdx=Math.min(st.cmdHistoryIdx+1,st.cmdHistory.length-1);
        els.termInput.value=st.cmdHistory[st.cmdHistoryIdx]||'';
      } else if(e.key==='ArrowDown'){
        e.preventDefault();
        st.cmdHistoryIdx=Math.max(st.cmdHistoryIdx-1,-1);
        els.termInput.value=st.cmdHistoryIdx===-1?st.currentCmd:st.cmdHistory[st.cmdHistoryIdx];
      } else if(e.key==='Tab'){
        e.preventDefault();
        const p=els.termInput.value.trim().toLowerCase();
        const m=Object.keys(CMD).filter(c=>c.startsWith(p));
        if(m.length===1) els.termInput.value=m[0];
        else if(m.length>1) printLine(m.join('  '),'dim');
      }
    });
    document.querySelectorAll('.cin-quick-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const cmd=btn.dataset.cmd; if(!cmd) return;
        echoCmd(cmd); CMD[cmd]&&CMD[cmd](cmd);
        els.termInput&&els.termInput.focus();
      });
    });
    // Traffic light dots
    document.getElementById('cin-dot-close')?.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
    document.getElementById('cin-dot-min')?.addEventListener('click',()=>window.scrollTo({top:window.innerHeight*4*.6,behavior:'smooth'}));
    document.getElementById('cin-dot-full')?.addEventListener('click',()=>{
      const el=document.getElementById('cin-term');
      if(!el) return;
      document.fullscreenElement?document.exitFullscreen():el.requestFullscreen().catch(()=>{});
    });
  }

  /* ══════════════════ LIVE STATS ══════════════════════ */
  function initLiveStats(){
    let threats=1247, nodes=94;
    if(els.thrCtf) els.thrCtf.textContent='#7';
    setInterval(()=>{
      threats+=Math.floor(Math.random()*12);
      nodes=Math.max(80,Math.min(99,nodes+(Math.random()>.55?1:-1)));
      if(els.thrThreat) els.thrThreat.textContent=threats.toLocaleString();
      if(els.thrNodes)  els.thrNodes.textContent=nodes+'%';
    },2400);
  }

  /* ══════════════════ CLOCK ═══════════════════════════ */
  function initClock(){
    const tick=()=>{ if(els.clock) els.clock.textContent=new Date().toLocaleTimeString('en-GB',{hour12:false}); };
    tick(); setInterval(tick,1000);
  }

  /* ══════════════════ NAVBAR ══════════════════════════ */
  function initNav(){
    const b=document.querySelector('.cin-nav-hamburger');
    const l=document.querySelector('.cin-nav-links');
    if(!b||!l) return;
    b.addEventListener('click',()=>{
      const open=l.style.display==='flex';
      Object.assign(l.style,open?{display:'none'}:{
        display:'flex',flexDirection:'column',position:'absolute',
        top:'60px',left:'50%',transform:'translateX(-50%)',
        background:'rgba(5,5,8,.96)',border:'1px solid rgba(200,255,0,.1)',
        borderRadius:'12px',padding:'12px',gap:'6px',backdropFilter:'blur(20px)',zIndex:'100',
      });
    });
  }

  /* nX/nY smooth update (called from rAF) */
  function updateNXY(){
    st.nX += (st.targetNX - st.nX) * .06;
    st.nY += (st.targetNY - st.nY) * .06;
    requestAnimationFrame(updateNXY);
  }

  /* ══════════════════ BOOT ════════════════════════════ */
  function init(){
    resolveEls();
    initMouse();
    initGSAP();
    buildStarfield();
    buildGlobe();
    initGrid();
    initMatrix();
    initTerminal();
    initLiveStats();
    initClock();
    initNav();
    updateNXY();

    // Animate scene 1 text in via GSAP
    if(typeof gsap !== 'undefined'){
      gsap.from('.cin-entry-label',{opacity:0,y:20,duration:1,delay:.2,ease:'power2.out'});
      gsap.from('.cin-title-line', {opacity:0,y:30,duration:1,delay:.4,stagger:.12,ease:'power3.out'});
      gsap.from('.cin-entry-sub',  {opacity:0,y:20,duration:1,delay:.8,ease:'power2.out'});
      gsap.from('.cin-entry-cta',  {opacity:0,y:18,duration:1,delay:1.0,ease:'power2.out'});
      gsap.from('.cin-entry-scroll-hint',{opacity:0,duration:.8,delay:1.4});
      gsap.from('.cin-float-card', {opacity:0,x:40,rotationY:20,stagger:.12,duration:.9,delay:1.0,ease:'power3.out',transformPerspective:600});
    }
  }

  document.readyState==='loading'
    ? document.addEventListener('DOMContentLoaded',init)
    : init();

})();
