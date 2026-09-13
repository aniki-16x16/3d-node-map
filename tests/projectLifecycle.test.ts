import assert from "node:assert/strict";
import test from "node:test";
import {
  createHistoryState,
  projectHistoryReducer,
} from "../src/domain/history";
import { newNode } from "../src/domain/project";
import {
  restoreDraft,
  saveDraft,
  STORAGE_KEY,
} from "../src/services/projectStorage";

test("startup creates a fresh empty project without consuming a saved draft", () => {
  const state = createHistoryState();
  assert.equal(state.project.maps.length, 1);
  assert.equal(state.project.maps[0].kind, "world");
  assert.equal(state.project.maps[0].nodes.length, 0);
  assert.equal(state.project.keys.length, 0);
  assert.equal(state.dirty, false);
  const second = createHistoryState();
  state.project.maps[0].nodes.push(newNode("town", 0, 0));
  assert.equal(second.project.maps[0].nodes.length, 0);
});

test("draft saving and explicit restoring round-trip; malformed drafts fail", () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
  assert.equal(restoreDraft(storage), null);
  const { project } = createHistoryState();
  project.name = "我的路线";
  project.maps[0].nodes.push(newNode("town", 10, 20));
  saveDraft(project, storage);
  const before = data.get(STORAGE_KEY);
  createHistoryState();
  assert.equal(data.get(STORAGE_KEY), before);
  assert.deepEqual(restoreDraft(storage), project);
  data.set(STORAGE_KEY, '{"version":1}');
  assert.throws(() => restoreDraft(storage));
});

test("drag updates form one undo step and editing after undo clears redo", () => {
  let state = createHistoryState();
  const project = structuredClone(state.project);
  project.maps[0].nodes.push(newNode("town", 10, 20));
  state = projectHistoryReducer(state, { type: "commit", project });
  const beforeDrag = state.project;
  for (const x of [30, 40, 50]) {
    const moved = structuredClone(state.project);
    moved.maps[0].nodes[0].x = x;
    state = projectHistoryReducer(state, { type: "replace", project: moved });
  }
  state = projectHistoryReducer(state, {
    type: "checkpoint",
    project: beforeDrag,
  });
  assert.equal(state.past.length, 2);
  state = projectHistoryReducer(state, { type: "undo" });
  assert.equal(state.project.maps[0].nodes[0].x, 10);
  state = projectHistoryReducer(state, { type: "redo" });
  assert.equal(state.project.maps[0].nodes[0].x, 50);
  state = projectHistoryReducer(state, { type: "undo" });
  state = projectHistoryReducer(state, {
    type: "commit",
    project: { ...state.project, name: "新分支" },
  });
  assert.equal(state.future.length, 0);
});
