import assert from "node:assert/strict";
import test from "node:test";
import {
  availableKeys,
  blankProject,
  duplicateNode,
  newNode,
  parseProject,
  validate,
} from "../src/domain";
import { deleteArea } from "../src/domain/deleteArea";
function fixture() {
  const p = blankProject();
  p.maps.push(
    { id: "a", kind: "area", name: "A", nodes: [], edges: [] },
    { id: "b", kind: "area", name: "B", nodes: [], edges: [] },
  );
  p.keys = [
    { id: "global", name: "G", mapId: null },
    { id: "local", name: "L", mapId: "a" },
  ];
  const n = newNode("chest", 0, 0);
  n.rewards = ["local"];
  n.enter = {
    op: "all",
    rules: [{ op: "any", rules: [{ type: "key", ref: "local", not: false }] }],
  };
  const globalChest = newNode("chest", 100, 0);
  globalChest.rewards = ["global"];
  p.maps[1].nodes.push(n, globalChest);
  return { p, n };
}
test("key options combine global and current area only", () => {
  const { p } = fixture();
  assert.deepEqual(
    availableKeys(p, "world").map((k) => k.id),
    ["global"],
  );
  assert.deepEqual(
    availableKeys(p, "a").map((k) => k.id),
    ["global", "local"],
  );
  assert.deepEqual(
    availableKeys(p, "b").map((k) => k.id),
    ["global"],
  );
  assert.deepEqual(
    parseProject(JSON.stringify(p)),
    JSON.parse(JSON.stringify(p)),
  );
});
test("duplicated areas get independent local keys and nested references", () => {
  const { p } = fixture();
  const region = newNode("region", 0, 0);
  region.mapId = "a";
  p.maps[0].nodes.push(region);
  const copy = duplicateNode(p, "world", region, 1, 1, 0);
  const key = p.keys.find((k) => k.mapId === copy.mapId)!;
  assert.notEqual(key.id, "local");
  const node = p.maps.find((m) => m.id === copy.mapId)!.nodes[0];
  assert.deepEqual(node.rewards, [key.id]);
  assert.deepEqual(p.maps.find((m) => m.id === copy.mapId)!.nodes[1].rewards, [
    "global",
  ]);
  assert.ok(JSON.stringify(node.enter).includes(key.id));
  assert.deepEqual(
    parseProject(JSON.stringify(p)),
    JSON.parse(JSON.stringify(p)),
  );
});
test("cross-area copies drop inaccessible rewards and nested conditions", () => {
  const { p, n } = fixture();
  const copy = duplicateNode(p, "b", n, 0, 0, 0);
  assert.deepEqual(copy.rewards, []);
  const globalCopy = duplicateNode(p, "b", p.maps[1].nodes[1], 100, 0, 0);
  assert.deepEqual(globalCopy.rewards, ["global"]);
  assert.ok(!JSON.stringify(copy.enter).includes("local"));
  assert.deepEqual(n.rewards, ["local"]);
});
test("import rejects missing scopes, invalid owners and cross-area references", () => {
  const { p, n } = fixture();
  const old = JSON.parse(JSON.stringify(p));
  delete old.keys[0].mapId;
  assert.throws(() => parseProject(JSON.stringify(old)));
  p.keys[1].mapId = "world";
  assert.throws(() => parseProject(JSON.stringify(p)));
  p.keys[1].mapId = "a";
  p.maps[2].nodes.push({ ...structuredClone(n), id: "foreign" });
  assert.throws(() => parseProject(JSON.stringify(p)));
  assert.ok(validate(p).some((e) => e.includes("奖励钥匙失效")));
});
test("deleting an area removes only its local keys", () => {
  const { p } = fixture();
  deleteArea(p, "a");
  assert.deepEqual(
    p.keys.map((k) => k.id),
    ["global"],
  );
});
