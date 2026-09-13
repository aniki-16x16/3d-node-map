import type { Point, Port } from "./types";
export const ports: Record<Port, [number, number]> = {
  top: [0, -34],
  right: [34, 0],
  bottom: [0, 34],
  left: [-34, 0],
};
export function route(a: Point, b: Point, ap: Port, bp: Port): Point[] {
  const s = { x: a.x + ports[ap][0], y: a.y + ports[ap][1] },
    t = { x: b.x + ports[bp][0], y: b.y + ports[bp][1] };
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
