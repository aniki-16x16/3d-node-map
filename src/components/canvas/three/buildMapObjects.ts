import { LockKeyhole } from "lucide-react";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as THREE from "three";
import { route } from "../../../domain/routing";
import type { Position } from "../../../domain/types";
import { nodeColor, nodeIcon } from "../../nodeAppearance";
import type { SceneData } from "./types";
export function buildMapObjects(
  scene: THREE.Scene,
  { nodes, edges, selected, selectedEdge, progress, playing }: SceneData,
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
        color: locked
          ? "#242c36"
          : n.type === "structure"
            ? "#c9d1d8"
            : done || n.id === selected
              ? "#294b3b"
              : "#1d2c37",
      }),
    );
    if (n.type === "structure") mesh.geometry.scale(0.5, 0.5, 1);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(pos(n));
    mesh.userData.id = n.id;
    scene.add(mesh);
    clickable.push(mesh);
    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({
        color: nodeColor(n),
      }),
    );
    mesh.add(border);
    if (n.type !== "structure") {
      const svg = renderToStaticMarkup(
        React.createElement(locked ? LockKeyhole : nodeIcon(n), {
          size: 96,
          color: locked ? "#81909a" : nodeColor(n),
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
    }
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
    const routed = route(a, b, e.ap, e.bp);
    const crossLayer = a.z !== b.z;
    const points = crossLayer
      ? [pos({ ...routed[0], z: a.z }), pos({ ...routed.at(-1)!, z: b.z })]
      : routed.map((p) => pos({ ...p, z: a.z }));
    const highlighted = e.id === selectedEdge;
    const color = highlighted ? 0xc1ebd5 : crossLayer ? 0x9abdc4 : 0x627382;
    const addEdgeObject = (object: THREE.Object3D) => {
      object.renderOrder = highlighted ? 10 : 0;
      scene.add(object);
    };
    if (crossLayer) {
      const start = points[0],
        end = points[1];
      const length = start.distanceTo(end);
      const direction = end.clone().sub(start).normalize();
      // Mesh dashes have real thickness on all WebGL implementations.
      for (let distance = 14; distance < length - 14; distance += 28) {
        const dashLength = Math.min(17, length - 14 - distance);
        const dash = new THREE.Mesh(
          new THREE.CylinderGeometry(2, 2, dashLength, 8),
          new THREE.MeshBasicMaterial({ color, depthTest: !highlighted }),
        );
        dash.position
          .copy(start)
          .addScaledVector(direction, distance + dashLength / 2);
        dash.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction,
        );
        addEdgeObject(dash);
      }
    } else {
      addEdgeObject(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: highlighted ? 1 : 0.85,
            depthTest: !highlighted,
          }),
        ),
      );
    }
    for (const [tip, neighbor] of [
      [points[0], points.find((p) => p.distanceToSquared(points[0]) > 0)],
      [
        points.at(-1)!,
        [...points]
          .reverse()
          .find((p) => p.distanceToSquared(points.at(-1)!) > 0),
      ],
    ]) {
      if (!tip || !neighbor) continue;
      const direction = tip.clone().sub(neighbor).normalize();
      const height = Math.min(
        crossLayer ? 16 : 12,
        tip.distanceTo(neighbor) / 2,
      );
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(crossLayer ? 6 : 4, height, 12),
        new THREE.MeshBasicMaterial({ color, depthTest: !highlighted }),
      );
      cone.position.copy(tip).addScaledVector(direction, -height / 2);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      addEdgeObject(cone);
    }
  }
  return clickable;
}
