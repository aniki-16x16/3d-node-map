import type { Point, Port, NodeType } from "./types";
export const ports: Record<Port, [number, number]> = {
  top: [0, -34],
  right: [34, 0],
  bottom: [0, 34],
  left: [-34, 0],
};
export function portOffset(
  node: { type?: NodeType },
  port: Port,
): [number, number] {
  const scale = node.type === "structure" ? 0.5 : 1;
  return [ports[port][0] * scale, ports[port][1] * scale];
}
export function route(
  a: Point & { type?: NodeType },
  b: Point & { type?: NodeType },
  ap: Port,
  bp: Port,
): Point[] {
  const ao = portOffset(a, ap),
    bo = portOffset(b, bp);
  const s = { x: a.x + ao[0], y: a.y + ao[1] },
    t = { x: b.x + bo[0], y: b.y + bo[1] };
  const av = ["top", "bottom"].includes(ap),
    bv = ["top", "bottom"].includes(bp);
  if (av && bv)
    return [
      s,
      { x: s.x, y: (s.y + t.y) / 2 },
      { x: t.x, y: (s.y + t.y) / 2 },
      t,
    ];
  if (!av && !bv)
    return [
      s,
      { x: (s.x + t.x) / 2, y: s.y },
      { x: (s.x + t.x) / 2, y: t.y },
      t,
    ];
  return [s, av ? { x: s.x, y: t.y } : { x: t.x, y: s.y }, t];
}
