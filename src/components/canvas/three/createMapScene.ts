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
    // SVG Y grows downward: smaller Y is north, away from the initial camera.
    new THREE.Vector3(n.x - cx, n.z * 180, n.y - cy);
  camera.position.set(0, 1050, 1050);
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
  const axes = document.createElement("canvas");
  axes.className = "view-axes";
  axes.width = axes.height = 264;
  axes.setAttribute("role", "img");
  axes.setAttribute("aria-label", "当前视角坐标轴：X，Y 正方向为北，Z 为上");
  el.appendChild(axes);
  const ctx = axes.getContext("2d")!;
  const directions = [
    { vector: new THREE.Vector3(1, 0, 0), label: "X", color: "#f18d91" },
    { vector: new THREE.Vector3(0, 0, -1), label: "Y 北", color: "#94dcb3" },
    { vector: new THREE.Vector3(0, 1, 0), label: "Z", color: "#8dbaff" },
  ];
  const drawAxes = () => {
    ctx.clearRect(0, 0, 264, 264);
    const inverse = camera.quaternion.clone().invert();
    const projected = directions.map((axis) => ({
      ...axis,
      point: axis.vector.clone().applyQuaternion(inverse),
    }));
    projected.sort((a, b) => a.point.z - b.point.z);
    ctx.font = '22px "Microsoft YaHei", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const { point, label, color } of projected) {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(132 - point.x * 35, 132 + point.y * 35);
      ctx.lineTo(132, 132);
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(132, 132);
      ctx.lineTo(132 + point.x * 70, 132 - point.y * 70);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(132 + point.x * 70, 132 - point.y * 70, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(label, 132 + point.x * 96, 132 - point.y * 96);
    }
  };
  let raf: number;
  const frame = () => {
    raf = requestAnimationFrame(frame);
    controls.update();
    renderer.render(scene, camera);
    drawAxes();
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
    axes.remove();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
