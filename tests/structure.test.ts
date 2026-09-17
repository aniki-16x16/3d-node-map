import assert from "node:assert/strict";
import test from "node:test";
import { blankProject, newNode, duplicateNode } from "../src/domain/project";
import { parseProject } from "../src/domain/serialization";
import { route } from "../src/domain/routing";
import { conditionPass } from "../src/domain/conditions";
import { blankProgress } from "../src/domain/exploration";

test("structure nodes preserve conditions through import and duplication and use smaller ports", () => {
  const project = blankProject();
  const structure = newNode("structure", 0, 0);
  structure.enter.groups.push({op: "all", rules: [{ type: "key", ref: "key" }]});
  project.maps.push({
    id: "area",
    kind: "area",
    name: "Area",
    nodes: [structure],
    edges: [],
  });
  const restored = parseProject(JSON.stringify(project));
  assert.equal(restored.maps[1].nodes[0].type, "structure");
  const copy = duplicateNode(restored, "area", structure, 100, 0, 1);
  assert.deepEqual(copy.enter, structure.enter);
  const progress = blankProgress();
  assert.equal(conditionPass(structure.enter, progress), false);
  progress.keys.push("key");
  assert.equal(conditionPass(structure.enter, progress), true);
  const points = route(structure, newNode("battle", 200, 0), "right", "left");
  assert.deepEqual(points[0], { x: 17, y: 0 });
  assert.deepEqual(points.at(-1), { x: 166, y: 0 });
});
