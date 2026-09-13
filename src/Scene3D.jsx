import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Castle,
  Mountain,
  Swords,
  Store,
  Tent,
  Flag,
  Gem,
  LogIn,
  DoorOpen,
  LockKeyhole,
} from "lucide-react";
import { route } from "./model";
export const colors = {
  town: "#a6d8cb",
  region: "#c1abec",
  battle: "#e5a98b",
  shop: "#e0c284",
  rest: "#a1cdb8",
  checkpoint: "#b5bed4",
  chest: "#e1cb83",
  entrance: "#97c8e1",
  exit: "#b6a2de",
};
const glyphs = {
  town: "⌂",
  region: "◇",
  battle: "⚔",
  shop: "▣",
  rest: "♧",
  checkpoint: "⚑",
  chest: "▤",
  entrance: "↪",
  exit: "↗",
};
const icons = {
  town: Castle,
  region: Mountain,
  battle: Swords,
  shop: Store,
  rest: Tent,
  checkpoint: Flag,
  chest: Gem,
  entrance: LogIn,
  exit: DoorOpen,
};
export default function Scene3D({
  nodes,
  edges,
  selected,
  progress,
  playing,
  onSelect,
}) {
  const host = useRef(),
    action = useRef(onSelect),
    pose = useRef();
  action.current = onSelect;
  useEffect(() => {
    const el = host.current;
    let renderer;
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
    const pos = (n) => new THREE.Vector3(n.x - cx, n.z * 180, -(n.y - cy));
    camera.position.set(700, 1050, 1050);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 180;
    controls.maxDistance = 8000;
    if (pose.current) {
      camera.position.copy(pose.current.position);
      controls.target.copy(pose.current.target);
    }
    const layers = [...new Set([0, ...nodes.map((n) => n.z)])].sort(
      (a, b) => a - b,
    );
    const texture = (text, color, width = 512, height = 96) => {
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      const ctx = c.getContext("2d");
      ctx.font = '46px "Microsoft YaHei", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      ctx.fillText(text, width / 2, height / 2, width - 12);
      return new THREE.CanvasTexture(c);
    };
    const label = (text, position, color, size = 170) => {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture(text, color),
          transparent: true,
          depthTest: false,
        }),
      );
      s.position.copy(position);
      s.scale.set(size, (size * 96) / 512, 1);
      scene.add(s);
    };
    const span = Math.max(1100, maxX - minX + 300, maxY - minY + 300);
    for (const z of layers) {
      const grid = new THREE.GridHelper(
        span,
        Math.ceil(span / 60),
        0x3b4853,
        0x26303a,
      );
      grid.position.y = z * 180 - 9;
      grid.material.transparent = true;
      grid.material.opacity = 0.5;
      scene.add(grid);
      label(
        `Z ${z > 0 ? "+" : ""}${z}`,
        new THREE.Vector3(-span / 2, z * 180, span / 2 + 45),
        "#728594",
        110,
      );
    }
    const clickable = [];
    for (const n of nodes) {
      const locked = playing && !progress.unlocked.includes(n.id),
        done = playing && progress.completed.includes(n.id);
      const shape = new THREE.Shape();
      shape.moveTo(0, 34);
      shape.quadraticCurveTo(3, 34, 7, 29);
      shape.lineTo(29, 7);
      shape.quadraticCurveTo(36, 0, 29, -7);
      shape.lineTo(7, -29);
      shape.quadraticCurveTo(0, -36, -7, -29);
      shape.lineTo(-29, -7);
      shape.quadraticCurveTo(-36, 0, -29, 7);
      shape.lineTo(-7, 29);
      shape.quadraticCurveTo(-3, 34, 0, 34);
      const mesh = new THREE.Mesh(
        new THREE.ExtrudeGeometry(shape, { depth: 7, bevelEnabled: false }),
        new THREE.MeshBasicMaterial({
          color: locked ? "#242c36" : done ? "#294b3b" : "#1d2c37",
        }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.copy(pos(n));
      mesh.userData.id = n.id;
      scene.add(mesh);
      clickable.push(mesh);
      const border = new THREE.LineSegments(
        new THREE.EdgesGeometry(mesh.geometry),
        new THREE.LineBasicMaterial({
          color: n.id === selected ? "#ffffff" : colors[n.type],
        }),
      );
      mesh.add(border);
      const svg = renderToStaticMarkup(
        React.createElement(locked ? LockKeyhole : icons[n.type], {
          size: 96,
          color: locked ? "#81909a" : colors[n.type],
          strokeWidth: 1.6,
        }),
      );
      const iconTexture = new THREE.TextureLoader().load(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      );
      const icon = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: iconTexture,
          transparent: true,
          depthTest: false,
        }),
      );
      icon.position.copy(pos(n).add(new THREE.Vector3(0, 19, 0)));
      icon.scale.set(26, 26, 1);
      scene.add(icon);
      label(
        n.name,
        pos(n).add(new THREE.Vector3(0, 1, 68)),
        locked ? "#81909a" : "#c9dae3",
        190,
      );
    }
    for (const e of edges) {
      const a = nodes.find((n) => n.id === e.a),
        b = nodes.find((n) => n.id === e.b);
      if (!a || !b) continue;
      let points;
      if (a.z === b.z)
        points = route(a, b, e.ap, e.bp).map((p) => pos({ ...p, z: a.z }));
      else {
        const r = route(a, b, e.ap, e.bp);
        points = [
          pos({ ...r[0], z: a.z }),
          pos({ ...r[0], z: a.z }).add(
            new THREE.Vector3(0, (b.z - a.z) * 90, 0),
          ),
          pos({ ...r.at(-1), z: b.z }).add(
            new THREE.Vector3(0, -(b.z - a.z) * 90, 0),
          ),
          pos({ ...r.at(-1), z: b.z }),
        ];
      }
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: a.z !== b.z ? 0x9abdc4 : 0x627382,
          transparent: true,
          opacity: 0.85,
        }),
      );
      scene.add(line);
      if (e.directed) {
        const end = points.at(-1),
          dir = end.clone().sub(points.at(-2)).normalize();
        scene.add(
          new THREE.ArrowHelper(
            dir,
            end.clone().addScaledVector(dir, -18),
            18,
            0x9aabba,
            12,
            8,
          ),
        );
      }
    }
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
    let down;
    const start = (e) => {
      down = [e.clientX, e.clientY];
    };
    const click = (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5)
        return;
      const r = el.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(clickable)[0];
      if (hit) action.current(hit.object.userData.id);
    };
    renderer.domElement.addEventListener("pointerdown", start);
    renderer.domElement.addEventListener("pointerup", click);
    let raf;
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
        o.geometry?.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.filter(Boolean).forEach((m) => {
          m.map?.dispose();
          m.dispose();
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [nodes, edges, selected, progress, playing]);
  return <div className="scene3d" ref={host} />;
}
