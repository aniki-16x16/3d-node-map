import assert from "node:assert/strict";
import test from "node:test";
import { Skull, Swords } from "lucide-react";
import { blankProject, newNode, duplicateNode } from "../src/domain/project";
import { parseProject } from "../src/domain/serialization";
import { nodeColor, nodeIcon, colors } from "../src/components/nodeAppearance";

test("boss appearance and flag survive saving and duplication; existing battles remain normal", () => {
  const p = blankProject();
  const battle = { ...newNode("battle", 0, 0), boss: true, rewards: ["key"] };
  p.keys.push({ id: "key", name: "Key", mapId: null });
  p.maps.push({
    id: "area",
    kind: "area",
    name: "Area",
    nodes: [battle],
    edges: [],
  });
  const restored = parseProject(JSON.stringify(p));
  const boss = restored.maps[1].nodes[0];
  assert.equal(boss.boss, true);
  assert.equal(nodeIcon(boss), Skull);
  assert.notEqual(nodeColor(boss), colors.battle);
  const copy = duplicateNode(restored, "area", boss, 100, 100, 0);
  assert.equal(copy.boss, true);
  assert.deepEqual(copy.rewards, ["key"]);
  const normal = newNode("battle", 0, 0);
  assert.equal(nodeIcon(normal), Swords);
  assert.equal(nodeColor(normal), colors.battle);
  p.maps[1].nodes = [normal];
  assert.doesNotThrow(() => parseProject(JSON.stringify(p)));
});

test("reward cardinality and boss flag are checked when importing", () => {
  const p = blankProject();
  const battle = newNode("battle", 0, 0);
  p.maps.push({
    id: "area",
    kind: "area",
    name: "Area",
    nodes: [battle],
    edges: [],
  });
  battle.rewards = ["a", "b"];
  assert.throws(() => parseProject(JSON.stringify(p)));
  battle.rewards = ["a"];
  assert.doesNotThrow(() => parseProject(JSON.stringify(p)));
  battle.rewards = [];
  assert.doesNotThrow(() => parseProject(JSON.stringify(p)));
  assert.throws(() =>
    parseProject(
      JSON.stringify(p).replace('"rewards":[]', '"rewards":[],"boss":"yes"'),
    ),
  );
});
