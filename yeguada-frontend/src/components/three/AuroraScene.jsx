// components/three/AuroraScene.jsx
// Campo de partículas ondulante (verde → oro) para las pantallas de acceso.
//
// Rendimiento (pensado para móviles):
//  · Toda la animación vive en el vertex shader: la CPU solo actualiza un
//    uniform de tiempo por frame (cero trabajo por partícula en JS).
//  · Un único draw call (THREE.Points); sin luces, sombras ni post-proceso.
//  · Densidad y pixel-ratio adaptativos según dispositivo (táctil / pocos núcleos).
//  · Se pausa cuando la pestaña está oculta o el canvas sale de pantalla.
//  · Con prefers-reduced-motion dibuja un solo fotograma estático.
//  · Sin WebGL → no renderiza nada (el CSS de AuthShell ya tiene un degradado).
//  · Libera geometría, material y renderer al desmontar.
import React, { useEffect, useRef } from 'react';
import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute,
  ShaderMaterial, Points, AdditiveBlending, Color,
} from 'three';

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform vec2  uPointer;
  attribute float aSeed;
  varying float vH;
  varying float vFade;
  void main() {
    vec3 p = position;
    float w = sin(p.x * 0.55 + uTime * 0.55) * 0.55
            + sin(p.z * 0.48 - uTime * 0.40) * 0.50
            + sin((p.x + p.z) * 0.30 + uTime * 0.25) * 0.35;
    p.y += w + aSeed * 0.15;
    // Las el puntero levanta una pequeña ola (calculado en GPU)
    float d = distance(p.xz, uPointer * 7.0);
    p.y += exp(-d * 0.35) * 0.45;
    vH = clamp((w + 1.4) / 2.8, 0.0, 1.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vFade = smoothstep(26.0, 6.0, -mv.z);
    gl_PointSize = uSize * (0.6 + vH * 0.9) * (14.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uLow;
  uniform vec3 uHigh;
  varying float vH;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(mix(uLow, uHigh, vH), min(1.0, a * 1.6) * vFade * (0.45 + vH * 0.55));
  }
`;

function profile() {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const lowCpu = (navigator.hardwareConcurrency || 4) <= 4;
  const small = window.innerWidth < 640;
  const lite = coarse || lowCpu || small;
  return {
    lite,
    cols: lite ? 36 : 72,
    rows: lite ? 22 : 40,
    dpr: Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 1.75),
    fps: lite ? 30 : 60,
    size: lite ? 5.0 : 4.2,
  };
}

export default function AuroraScene({ className }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const cfg = profile();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer;
    try {
      renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
    } catch {
      return undefined; // sin WebGL
    }
    renderer.setPixelRatio(cfg.dpr);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';

    const scene = new Scene();
    const camera = new PerspectiveCamera(50, 1, 0.1, 60);
    camera.position.set(0, 5.5, 10);
    camera.lookAt(0, -0.5, -1);

    // Rejilla de partículas en el plano XZ
    const count = cfg.cols * cfg.rows;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const spanX = 30, spanZ = 22;
    for (let i = 0, r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++, i++) {
        pos[i * 3]     = (c / (cfg.cols - 1) - 0.5) * spanX + (Math.random() - 0.5) * 0.3;
        pos[i * 3 + 1] = -1.2;
        pos[i * 3 + 2] = (r / (cfg.rows - 1) - 0.5) * spanZ - 2 + (Math.random() - 0.5) * 0.3;
        seed[i] = Math.random();
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(pos, 3));
    geometry.setAttribute('aSeed', new BufferAttribute(seed, 1));

    const material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: cfg.size * cfg.dpr },
        uPointer: { value: [0, 0] },
        uLow: { value: new Color('#4F9A3C') },
        uHigh: { value: new Color('#FFB92E') },
      },
    });
    scene.add(new Points(geometry, material));

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (e) => {
      const r = mount.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    // En táctil no hay "hover": se omite el seguimiento del puntero.
    if (!cfg.lite) window.addEventListener('pointermove', onPointer, { passive: true });

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 0.8 ? 66 : 50; // más abierto en vertical (móvil)
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ── Bucle con límite de FPS, pausable ──
    let raf = 0, running = false, visible = true, inView = true, last = 0, t = 0;
    const frameMs = 1000 / cfg.fps;

    const draw = () => {
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      material.uniforms.uPointer.value = [pointer.x, pointer.y];
      material.uniforms.uTime.value = t;
      renderer.render(scene, camera);
    };

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = now - last;
      if (dt < frameMs) return;
      last = now - (dt % frameMs);
      t += Math.min(dt, 100) / 1000;
      draw();
    };
    const start = () => {
      if (running || reduceMotion || !visible || !inView) return;
      running = true; last = performance.now(); raf = requestAnimationFrame(loop);
    };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    const onVisibility = () => { visible = !document.hidden; visible ? start() : stop(); };
    document.addEventListener('visibilitychange', onVisibility);
    const io = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; inView ? start() : stop(); });
    io.observe(mount);

    t = 3; draw(); // primer fotograma inmediato (y único si reduce-motion)
    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointer);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
