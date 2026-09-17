import assert from "node:assert/strict";
import test from "node:test";
import { moveSelectedNodes, nodesInSelection } from "../src/domain/selection";
import { newNode } from "../src/domain/project";

test("group drag preserves relative positions, leaves other nodes untouched and uses original positions on every move", () => {
  const a = { ...newNode("structure", 100, 100), id: "a" };
  const b = { ...newNode("structure", 153, 181), id: "b" };
  const other = { ...newNode("structure", 250, 250), id: "other" };
  const origins = [a, b];
  const moved = moveSelectedNodes([a, b, other], origins, a, 40, -40);
  assert.equal(moved[0].x, 136);
  assert.equal(moved[0].y, 68);
  assert.equal(moved[1].x - moved[0].x, b.x - a.x);
  assert.equal(moved[1].y - moved[0].y, b.y - a.y);
  assert.equal(moved[2], other);
  assert.deepEqual(moveSelectedNodes(moved, origins, a, 40, -40), moved);
  const single = moveSelectedNodes([a, b], [a], a, 40, -40);
  assert.equal(single[1], b);
});
test("marquee accounts for pan, zoom, boundaries and current layer", () => {
  const inside = { ...newNode("structure", 100, 100), id: "inside", z: 0 };
  const boundary = { ...inside, id: "boundary", x: 120 };
  const outside = { ...inside, id: "outside", x: 121 };
  const otherLayer = { ...inside, id: "other-layer", z: 1 };
  assert.deepEqual(
    nodesInSelection(
      [inside, boundary, outside, otherLayer],
      0,
      { x: 70, y: 40, k: 0.5 },
      { x: 120, y: 90, width: 10, height: 10 },
    ),
    ["inside", "boundary"],
  );
  assert.deepEqual(
    nodesInSelection(
      [inside],
      0,
      { x: 0, y: 0, k: 1 },
      { x: 0, y: 0, width: 5, height: 5 },
    ),
    [],
  );
});
