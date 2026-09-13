import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Position } from "../../../domain/types";
import { buildMapObjects } from "./buildMapObjects";
import type { CameraPose, SceneData } from "./types";
export function createMapScene(
  el: HTMLDivElement,
  data: SceneData,
  pose: { current: CameraPose | undefined },
  onSelect: (id: string) => void,
) {
  const { nodes } = data;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    el.textContent = "此浏览器未能启动 WebGL，请启用硬件加速后重试。";
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(42, 1, 1, 15000);
  const minX = nodes.length ? Math.min(...nodes.map((n) => n.x)) : 0,
    maxX = nodes.length ? Math.max(...nodes.map((n) => n.x)) : 900;
  const minY = nodes.length ? Math.min(...nodes.map((n) => n.y)) : 0,
    maxY = nodes.length ? Math.max(...nodes.map((n) => n.y)) : 600;
  const cx = (minX + maxX) / 2,
    cy = (minY + maxY) / 2;
  const pos = (n: Position) =>
    new THREE.Vector3(n.x - cx, n.z * 180, -(n.y - cy));
  camera.position.set(700, 1050, 1050);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 180;
  controls.maxDistance = 8000;
  if (pose.current) {
    camera.position.copy(pose.current.position);
    controls.target.copy(pose.current.target);
  }
  const clickable = buildMapObjects(
    scene,
    data,
    pos,
    Math.max(1100, maxX - minX + 300, maxY - minY + 300),
  );
  const resize = () => {
    renderer.setSize(el.clientWidth, el.clientHeight);
    camera.aspect = el.clientWidth / el.clientHeight;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(el);
  resize();
  const ray = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let down: [number, number] | undefined;
  const start = (e: PointerEvent) => {
    down = [e.clientX, e.clientY];
  };
  const click = (e: PointerEvent) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5)
      return;
    const r = el.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(clickable)[0];
    if (hit) onSelect(String(hit.object.userData.id));
  };
  renderer.domElement.addEventListener("pointerdown", start);
  renderer.domElement.addEventListener("pointerup", click);
  let raf: number;
  const frame = () => {
    raf = requestAnimationFrame(frame);
    controls.update();
    renderer.render(scene, camera);
  };
  frame();
  return () => {
    pose.current = {
      position: camera.position.clone(),
      target: controls.target.clone(),
    };
    cancelAnimationFrame(raf);
    observer.disconnect();
    controls.dispose();
    scene.traverse((o) => {
      if ("geometry" in o) (o.geometry as THREE.BufferGeometry).dispose();
      if (!("material" in o)) return;
      const material = o.material as THREE.Material | THREE.Material[];
      const mats = Array.isArray(material) ? material : [material];
      mats.filter(Boolean).forEach((m) => {
        if ("map" in m) (m.map as THREE.Texture | null)?.dispose();
        m.dispose();
      });
    });
    renderer.dispose();
    renderer.domElement.remove();
  };
}
