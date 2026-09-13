import { LockKeyhole } from "lucide-react";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as THREE from "three";
import { route } from "../../../domain/routing";
import type { Position } from "../../../domain/types";
import { colors, ICONS as icons } from "../../nodeAppearance";
import type { SceneData } from "./types";
export function buildMapObjects(
  scene: THREE.Scene,
  { nodes, edges, selected, progress, playing }: SceneData,
  pos: (n: Position) => THREE.Vector3,
  span: number,
) {
  const layers = [...new Set([0, ...nodes.map((n) => n.z)])].sort(
    (a, b) => a - b,
  );
  const texture = (text: string, color: string, width = 512, height = 96) => {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d")!;
    ctx.font = '46px "Microsoft YaHei", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(text, width / 2, height / 2, width - 12);
    return new THREE.CanvasTexture(c);
  };
  const label = (
    text: string,
    position: THREE.Vector3,
    color: string,
    size = 170,
  ) => {
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
  const clickable: THREE.Mesh[] = [];
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
    let points: THREE.Vector3[];
    if (a.z === b.z)
      points = route(a, b, e.ap, e.bp).map((p) => pos({ ...p, z: a.z }));
    else {
      const r = route(a, b, e.ap, e.bp);
      points = [
        pos({ ...r[0], z: a.z }),
        pos({ ...r[0], z: a.z }).add(new THREE.Vector3(0, (b.z - a.z) * 90, 0)),
        pos({ ...r.at(-1)!, z: b.z }).add(
          new THREE.Vector3(0, -(b.z - a.z) * 90, 0),
        ),
        pos({ ...r.at(-1)!, z: b.z }),
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
      const end = points.at(-1)!,
        dir = end.clone().sub(points.at(-2)!).normalize();
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
  return clickable;
}
