import type { MapNode } from "./types";
import { snapCoordinate } from "./layout";

export function moveSelectedNodes(
  nodes: MapNode[],
  origins: Pick<MapNode, "id" | "x" | "y">[],
  anchor: { x: number; y: number },
  dx: number,
  dy: number,
): MapNode[] {
  const offsetX = snapCoordinate(anchor.x + dx) - anchor.x;
  const offsetY = snapCoordinate(anchor.y + dy) - anchor.y;
  const positions = new Map(origins.map((node) => [node.id, node]));
  return nodes.map((node) => {
    const origin = positions.get(node.id);
    return origin
      ? { ...node, x: origin.x + offsetX, y: origin.y + offsetY }
      : node;
  });
}
export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
export function nodesInSelection(
  nodes: MapNode[],
  layer: number,
  view: { x: number; y: number; k: number },
  box: SelectionBox,
): string[] {
  return nodes
    .filter((node) => {
      const x = node.x * view.k + view.x,
        y = node.y * view.k + view.y;
      return (
        node.z === layer &&
        x >= box.x &&
        x <= box.x + box.width &&
        y >= box.y &&
        y <= box.y + box.height
      );
    })
    .map((node) => node.id);
}
