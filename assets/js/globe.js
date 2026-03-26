// globe.js
window.GlobeSim = (function () {
  let scene, camera, renderer;
  let globeGroup, outerStreamsGroup;
  let points, lines;
  let targetZoom = 1;
  let currentZoom = 1;
  let dataFlows = [];
  const PARTICLE_COUNT = 3000;
  const RADIUS = 5;
  let positions;

  let time = 0;
  let glassPanel;

  function init() {
    const container = document.getElementById('globe-container');
    if (!container || typeof THREE === 'undefined') return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 15;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // ==========================================
    // 1. CYBER NETWORK PARTICLES (NODES)
    // ==========================================
    positions = new Float32Array(PARTICLE_COUNT * 3);
    const opacities = new Float32Array(PARTICLE_COUNT);
    const pointSizes = new Float32Array(PARTICLE_COUNT);

    // Distribute particles across a sphere
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phi = Math.acos(-1 + (2 * Math.random()));
      const theta = Math.random() * Math.PI * 2;

      // Slight depth variation for organic feel
      const r = RADIUS + (Math.random() - 0.5) * 0.15;

      positions[i * 3] = r * Math.cos(theta) * Math.sin(phi);
      positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = r * Math.cos(phi);

      opacities[i] = Math.random() * 0.8 + 0.2; // Base glow intensity
      pointSizes[i] = Math.random() * 2 + 1;    // Variable node sizes
    }

    const pGeometry = new THREE.BufferGeometry();
    pGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));
    pGeometry.setAttribute('aSize', new THREE.BufferAttribute(pointSizes, 1));

    const pMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0xc8ff00) } // Acid neon green
      },
      vertexShader: `
        attribute float aOpacity;
        attribute float aSize;
        varying float vOpacity;
        uniform float time;
        void main() {
          vOpacity = aOpacity;
          // Pulse the size based on position and time
          float pulse = sin(time * 3.0 + position.y * 10.0 + position.x * 5.0) * 0.5 + 0.5;
          
          // Random flicker factor based on vertex ID (simulated using position)
          float flicker = fract(sin(dot(position.xyz ,vec3(12.9898,78.233,45.164))) * 43758.5453);
          float activeFlicker = (sin(time * 10.0 * flicker) > 0.8) ? 1.5 : 1.0;
          
          gl_PointSize = aSize * (1.0 + pulse * 1.2) * activeFlicker * (15.0 / - (modelViewMatrix * vec4(position, 1.0)).z);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        void main() {
          // Circular particle mask
          float dist = distance(gl_PointCoord, vec2(0.5));
          if(dist > 0.5) discard;
          
          // Soft blurred edge
          float alpha = (0.5 - dist) * 2.0 * vOpacity;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    points = new THREE.Points(pGeometry, pMaterial);
    globeGroup.add(points);

    // ==========================================
    // 2. NETWORK CONNECTIONS (LINES)
    // ==========================================
    const linePositions = [];
    const lineOpacitiesArray = [];
    const MAX_DISTANCE = 0.8;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Connect a scattered subset
      if (Math.random() > 0.35) continue;

      const p1 = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);

      let connections = 0;
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        if (connections > 3) break; // Limit branches per node

        const p2 = new THREE.Vector3(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
        const dist = p1.distanceTo(p2);

        if (dist < MAX_DISTANCE) {
          linePositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
          // Assign identical random phase anchor to both vertices of the line segment
          const rnd = Math.random();
          lineOpacitiesArray.push(rnd, rnd);
          connections++;
        }
      }
    }

    const lGeometry = new THREE.BufferGeometry();
    lGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lGeometry.setAttribute('aOpacity', new THREE.Float32BufferAttribute(lineOpacitiesArray, 1));

    const lMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x00ff9c) } // Cyan/mint connection lines
      },
      vertexShader: `
        attribute float aOpacity;
        varying float vOpacity;
        uniform float time;
        void main() {
          // Data travelling/flashing effect across network links
          float pulse = sin(time * 4.0 + aOpacity * 20.0) * 0.5 + 0.5;
          // Intense random flash
          float flash = step(0.98, fract(sin(time * 2.0 + aOpacity) * 43758.5453)) * 2.0;

          vOpacity = (pulse + flash) * 0.6;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        void main() {
          gl_FragColor = vec4(color, vOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    lines = new THREE.LineSegments(lGeometry, lMaterial);
    globeGroup.add(lines);

    // ==========================================
    // 3. OUTER ATMOSPHERIC GLOW
    // ==========================================
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff9c,
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const glowSphere = new THREE.Mesh(new THREE.SphereGeometry(5.3, 32, 32), glowMaterial);
    globeGroup.add(glowSphere);

    // ==========================================
    // 4. DATA FLOW SYSTEM (NODE EXTRACTION)
    // ==========================================
    glassPanel = document.querySelector('.glass-panel');

    function spawnDataFlow() {
      const idx = Math.floor(Math.random() * PARTICLE_COUNT);
      const start = new THREE.Vector3(positions[idx * 3], positions[idx * 3 + 1], positions[idx * 3 + 2]);

      // Sync with globe's current rotation/position
      globeGroup.updateMatrixWorld();
      start.applyMatrix4(globeGroup.matrixWorld);

      const isMobile = window.innerWidth < 768;

      // Target area: near the glass panel
      const target = isMobile ?
        new THREE.Vector3((Math.random() - 0.5) * 5, -12 - Math.random() * 5, (Math.random() - 0.5) * 5) : // Mobile: Downward
        new THREE.Vector3(-16 - Math.random() * 4, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 5);  // Desktop: Leftward

      // Curved path control point
      const control = isMobile ?
        new THREE.Vector3((start.x + target.x) / 1.5, start.y - (Math.random() * 8), (start.z + target.z) / 1.5) :
        new THREE.Vector3((start.x + target.x) / 1.5, (start.y + target.y) / 1.5 + (Math.random() - 0.5) * 12, (start.z + target.z) / 1.5 + (Math.random() - 0.5) * 8);

      // Particle Head
      const headGeom = new THREE.SphereGeometry(0.04, 6, 6);
      const headMat = new THREE.MeshBasicMaterial({
        color: 0xc8ff00,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      const head = new THREE.Mesh(headGeom, headMat);
      scene.add(head);

      // Trail - using multiple segment lines for smooth curves
      const trailSegments = 12;
      const trailPositions = new Float32Array(trailSegments * 3);
      const trailGeom = new THREE.BufferGeometry();
      trailGeom.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      const trailMat = new THREE.LineBasicMaterial({
        color: 0x00f5ff, // Cyan trail
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      const trailLine = new THREE.Line(trailGeom, trailMat);
      scene.add(trailLine);

      dataFlows.push({
        head,
        trailLine,
        trailPositions,
        path: { start, control, target },
        progress: 0,
        speed: 0.004 + Math.random() * 0.008,
        history: [] // To store points for trail
      });
    }

    // Initial burst
    for (let i = 0; i < 15; i++) spawnDataFlow();

    // Continuous spawn loop
    setInterval(() => {
      if (dataFlows.length < 40) spawnDataFlow();
    }, 400);

    // ==========================================
    // LISTENERS & LOOP
    // ==========================================
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);

    animate();
  }

  let mouseX = 0; let mouseY = 0;
  let targetX = 0; let targetY = 0;

  function onMouseMove(event) {
    targetX = (event.clientX / window.innerWidth) * 2 - 1;
    targetY = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  function onWindowResize() {
    const container = document.getElementById('globe-container');
    if (!container || !camera || !renderer) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function animate() {
    requestAnimationFrame(animate);

    time += 0.01;

    mouseX += (targetX - mouseX) * 0.05;
    mouseY += (targetY - mouseY) * 0.05;

    // Continuous smooth rotation mixed with Parallax
    globeGroup.rotation.y += 0.001;
    globeGroup.rotation.x = mouseY * 0.15;
    globeGroup.rotation.z = -mouseX * 0.15;

    // Floating animation (smoother)
    globeGroup.position.y = Math.sin(time * 1.2) * 0.4;

    // Update custom shaders
    if (points && points.material) points.material.uniforms.time.value = time;
    if (lines && lines.material) lines.material.uniforms.time.value = time;

    // Update advanced data flows
    for (let i = dataFlows.length - 1; i >= 0; i--) {
      const df = dataFlows[i];
      df.progress += df.speed;

      // Quadratic Bezier calculation
      const t = df.progress;
      const invT = 1 - t;

      // Current World position of source (globe rotates, but particle detaches)
      // For cinematically "detaching", we use the initial start point but account for globe rotation AT SPAWN.
      // Or if we want them to feel like they follow the globe's rotation initially, we apply it.
      // Let's keep them as world-space travelers after launch.

      const pos = new THREE.Vector3();
      pos.x = invT * invT * df.path.start.x + 2 * invT * t * df.path.control.x + t * t * df.path.target.x;
      pos.y = invT * invT * df.path.start.y + 2 * invT * t * df.path.control.y + t * t * df.path.target.y;
      pos.z = invT * invT * df.path.start.z + 2 * invT * t * df.path.control.z + t * t * df.path.target.z;

      df.head.position.copy(pos);
      df.head.scale.setScalar(Math.sin(t * Math.PI) * (1.5 - t)); // Depth/progress based size
      df.head.material.opacity = Math.sin(t * Math.PI) * 1.5;

      // Update trail
      df.history.push(pos.clone());
      if (df.history.length > 12) df.history.shift();

      for (let j = 0; j < 12; j++) {
        const p = df.history[j] || pos;
        df.trailPositions[j * 3] = p.x;
        df.trailPositions[j * 3 + 1] = p.y;
        df.trailPositions[j * 3 + 2] = p.z;
      }
      df.trailLine.geometry.attributes.position.needsUpdate = true;
      df.trailLine.material.opacity = Math.sin(t * Math.PI) * 0.5;

      if (df.progress >= 1) {
        // Impact!
        if (glassPanel) {
          glassPanel.style.boxShadow = '0 0 50px rgba(200, 255, 0, 0.3)';
          setTimeout(() => {
            if (glassPanel) glassPanel.style.boxShadow = '';
          }, 100);
        }

        scene.remove(df.head);
        scene.remove(df.trailLine);
        dataFlows.splice(i, 1);
      }
    }

    // Zooming behavior synced to scroll phase
    currentZoom += (targetZoom - currentZoom) * 0.05;
    camera.position.z = 15 / currentZoom;

    renderer.render(scene, camera);
  }

  return {
    init: init,
    setZoom: function (zoom) {
      targetZoom = Math.max(1, zoom);
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (typeof window.GlobeSim !== 'undefined') window.GlobeSim.init();
  }, 100);
});
