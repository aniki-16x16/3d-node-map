import assert from "node:assert/strict";
import test from "node:test";
import { deleteArea } from "../src/domain/deleteArea";
import {
  createHistoryState,
  projectHistoryReducer,
} from "../src/domain/history";
import { newNode } from "../src/domain/project";

test("area deletion cleans references and undo restores the complete map", () => {
  const state = createHistoryState();
  const region = newNode("region", 0, 0);
  region.mapId = "area";
  const entry = newNode("entrance", 0, 0);
  const exit = newNode("exit", 10, 10);
  exit.target = region.id;
  exit.targetEntry = entry.id;
  exit.enter.groups.push({
    op: "all",
    rules: [{ type: "visited", ref: entry.id }],
  });
  state.project.maps[0].nodes.push(region, exit);
  state.project.maps[0].edges.push({
    id: "edge",
    a: region.id,
    b: exit.id,
    ap: "top",
    bp: "bottom",
    directed: false,
  });
  state.project.maps.push({
    id: "area",
    kind: "area",
    name: "Area",
    nodes: [entry],
    edges: [],
    defaultEntry: entry.id,
  });
  const deleted = deleteArea(structuredClone(state.project), "area");
  assert.equal(deleted.maps.length, 1);
  assert.deepEqual(
    deleted.maps[0].nodes.map((n) => n.id),
    [exit.id],
  );
  assert.equal(deleted.maps[0].edges.length, 0);
  assert.equal(deleted.maps[0].nodes[0].target, undefined);
  assert.equal(deleted.maps[0].nodes[0].targetEntry, undefined);
  assert.deepEqual(deleted.maps[0].nodes[0].enter.groups, []);
  const committed = projectHistoryReducer(state, {
    type: "commit",
    project: deleted,
  });
  assert.deepEqual(
    projectHistoryReducer(committed, { type: "undo" }).project,
    state.project,
  );
  assert.deepEqual(
    deleteArea(structuredClone(state.project), state.project.maps[0].id),
    state.project,
  );
});
