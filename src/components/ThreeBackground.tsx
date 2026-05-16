import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    const getPrimary = () => {
      const styles = getComputedStyle(document.body);
      const c = styles.getPropertyValue("--primary").trim();
      const tmp = new THREE.Color();
      try { tmp.set(c.startsWith("oklch") ? "#5fb8ff" : c || "#5fb8ff"); } catch { tmp.set("#5fb8ff"); }
      return tmp;
    };
    const getAccent = () => {
      const c = getComputedStyle(document.body).getPropertyValue("--accent").trim();
      const tmp = new THREE.Color();
      try { tmp.set(c.startsWith("oklch") ? "#b366ff" : c || "#b366ff"); } catch { tmp.set("#b366ff"); }
      return tmp;
    };

    // Particle field
    const PARTICLES = 1200;
    const positions = new Float32Array(PARTICLES * 3);
    const colors = new Float32Array(PARTICLES * 3);
    const primary = getPrimary();
    const accent = getAccent();
    for (let i = 0; i < PARTICLES; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      const mix = Math.random();
      const c = primary.clone().lerp(accent, mix);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.6, vertexColors: true, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Floating wireframe torus knots — "4D" feel
    const knots: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const knotGeo = new THREE.TorusKnotGeometry(6 + i * 2, 0.4, 200, 24);
      const knotMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? primary : accent,
        wireframe: true, transparent: true, opacity: 0.18,
      });
      const knot = new THREE.Mesh(knotGeo, knotMat);
      knot.position.set((i - 1) * 22, (i - 1) * 8, -10 - i * 8);
      scene.add(knot);
      knots.push(knot);
    }

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      points.rotation.y = t * 0.04 + mouse.x * 0.3;
      points.rotation.x = t * 0.02 + mouse.y * 0.2;

      knots.forEach((k, i) => {
        k.rotation.x = t * (0.15 + i * 0.05);
        k.rotation.y = t * (0.2 - i * 0.04);
        k.position.y += Math.sin(t + i) * 0.02;
      });

      camera.position.x += (mouse.x * 6 - camera.position.x) * 0.04;
      camera.position.y += (-mouse.y * 6 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
      geo.dispose(); mat.dispose();
      knots.forEach(k => { k.geometry.dispose(); (k.material as THREE.Material).dispose(); });
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 -z-10 pointer-events-none" aria-hidden />;
}
