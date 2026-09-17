import assert from "node:assert/strict";
import test from "node:test";
import {
  blankProgress,
  blankProject,
  conditionPass,
  duplicateNode,
  parseProject,
  settle,
  validate,
  visit,
  worldEdges,
} from "../src/domain/index";
import { demoProject } from "../src/examples/demoProject";
test("multiple starts; regions do not reveal neighbors before exit", () => {
  const p = demoProject();
  let s = settle(p, blankProgress());
  assert.deepEqual(new Set(s.discovered), new Set(["harbor", "camp"]));
  s = visit(p, "world", "harbor", s).state;
  assert(s.discovered.includes("forest"));
  let r = visit(p, "world", "forest", s);
  assert.equal(r.mapId, "woods");
  assert(r.state.completed.includes("entry"));
  assert(!r.state.discovered.includes("ruins"));
  assert(!r.state.discovered.includes("haven"));
});
test("keys unlock permanently, hidden nodes stay absent until their conditions pass", () => {
  const p = demoProject();
  let s = blankProgress();
  for (const [m, id] of [
    ["world", "harbor"],
    ["world", "forest"],
    ["woods", "fight1"],
    ["woods", "forest-fork"],
    ["woods", "rest1"],
    ["woods", "forest-merge"],
  ])
    s = visit(p, m, id, s).state;
  assert(s.discovered.includes("gate"));
  assert(!s.unlocked.includes("gate"));
  assert(!s.discovered.includes("secret"));
  s = visit(p, "woods", "chest1", s).state;
  assert(s.keys.includes("copper"));
  assert(s.unlocked.includes("gate"));
  s = settle(p, { ...s, keys: [] });
  assert(s.unlocked.includes("gate"));
  s = visit(p, "woods", "shop1", s).state;
  assert(s.discovered.includes("secret"));
});
test("exit opens target and enters specified area entrance; town returns to world", () => {
  const p = demoProject();
  let s = blankProgress();
  for (const [m, id] of [
    ["world", "harbor"],
    ["world", "forest"],
    ["woods", "fight1"],
    ["woods", "forest-fork"],
    ["woods", "chest1"],
    ["woods", "forest-merge"],
    ["woods", "gate"],
    ["woods", "exit-fork"],
  ])
    s = visit(p, m, id, s).state;
  const r = visit(p, "woods", "out1", s);
  assert.equal(r.mapId, "ruins-map");
  assert(r.state.completed.includes("ruin-entry"));
  assert(r.state.completed.includes("ruins"));
  const town = visit(p, "woods", "out2", r.state);
  assert.equal(town.mapId, "world");
  assert(town.state.completed.includes("haven"));
});
test("arbitrary completed nodes can be revisited without sequential movement", () => {
  const p = demoProject();
  let s = blankProgress();
  for (const [m, id] of [
    ["world", "harbor"],
    ["world", "forest"],
    ["woods", "fight1"],
    ["woods", "forest-fork"],
    ["woods", "rest1"],
    ["woods", "forest-merge"],
  ])
    s = visit(p, m, id, s).state;
  const r = visit(p, "woods", "entry", s);
  assert.equal(r.state.current, "entry");
  assert(!r.error);
});
test("card AND/OR combinations evaluate positive key and cross-area node rules", () => {
 const state = {...blankProgress(), keys: ["copper"], reached: ["entry"]};
 const condition = {op: "all" as const, groups: [{op: "all" as const, rules: [{type: "key" as const, ref: "copper"}]}, {op: "any" as const, rules: [{type: "visited" as const, ref: "entry"}, {type: "key" as const, ref: "moon"}]}]};
 assert.equal(conditionPass(condition, state), true);
 assert.equal(conditionPass(condition, {...state, reached: []}), false);
 assert.equal(conditionPass({...condition, op: "any"}, {...state, reached: []}), true);
});
test("directional routes and start conditions", () => {
  const p = demoProject(),
    w = p.maps[0];
  w.nodes.find((n) => n.id === "camp")!.show = {
    op: "all",
    groups: [{op: "all", rules: [{ type: "key", ref: "moon" }]}],
  };
  w.edges[0].directed = true;
  let s = settle(p, blankProgress());
  assert(!s.discovered.includes("camp"));
  assert(!visit(p, "world", "camp", s).state.completed.includes("camp"));
  assert(!s.discovered.includes("forest"));
});
test("JSON validates schema; invalid coordinate and node type are rejected", () => {
  const p = demoProject();
  assert.equal(parseProject(JSON.stringify(p)).maps.length, 3);
  assert.equal(validate(p).length, 0);
  assert.equal(worldEdges(p).filter((e) => e.generated).length, 3);
  p.maps[0].nodes[0].z = 1;
  assert.throws(() => parseProject(JSON.stringify(p)));
  p.maps[0].nodes[0].z = 0;
  p.maps[0].nodes[0].type = "chest";
  assert.throws(() => parseProject(JSON.stringify(p)));
});
test("duplicating an area remaps local condition references and connections", () => {
  const p = demoProject(),
    source = p.maps[0].nodes.find((n) => n.id === "forest")!;
  const copy = duplicateNode(p, "world", source, 120, 120, 0);
  const area = p.maps.find((m) => m.id === copy.mapId)!;
  assert.notEqual(copy.mapId, source.mapId);
  assert.equal(
    area.nodes.length,
    p.maps.find((m) => m.id === source.mapId)!.nodes.length,
  );
  assert(area.nodes.some((n) => n.id === area.defaultEntry));
  const secret = area.nodes.find((n) => n.name === "月之秘藏")!,
    shop = area.nodes.find((n) => n.name === "树梢商人")!;
  assert("ref" in secret.show.groups[0].rules[0]);
  assert.equal(secret.show.groups[0].rules[0].ref, shop.id);
  assert.notEqual(shop.id, "shop1");
  assert.doesNotThrow(() => parseProject(JSON.stringify(p)));
  assert.doesNotThrow(() => parseProject(JSON.stringify(blankProject())));
});
