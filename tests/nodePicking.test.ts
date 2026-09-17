import assert from "node:assert/strict";
import test from "node:test";
import { blankProject, newNode } from "../src/domain/project";
import { canPickNode, resolveExitTarget } from "../src/domain/nodePicking";
import { worldEdges } from "../src/domain/world";

test("exit targets accept regional entrances and world towns and infer the world route", () => {
  const project = blankProject();
  const entrance = newNode("entrance", 0, 0);
  entrance.z = 2;
  const battle = newNode("battle", 0, 0);
  const otherEntrance = newNode("entrance", 0, 0);
  const exit = newNode("exit", 100, 0);
  const region = { ...newNode("region", 0, 0), mapId: "target" };
  const otherRegion = { ...newNode("region", 100, 0), mapId: "other" };
  const town = newNode("town", 200, 0);
  project.maps[0].nodes.push(region, otherRegion, town);
  project.maps.push(
    {
      id: "target",
      kind: "area",
      name: "Target",
      nodes: [entrance, battle, exit],
      edges: [],
    },
    {
      id: "other",
      kind: "area",
      name: "Other",
      nodes: [otherEntrance],
      edges: [],
    },
  );
  const request = { type: "exit-target", mapId: "target" };
  for (const id of [entrance.id, otherEntrance.id, town.id])
    assert.equal(canPickNode(project, request, id), true);
  for (const id of [battle.id, region.id, exit.id, "missing"])
    assert.equal(canPickNode(project, request, id), false);
  assert.equal(canPickNode(project, null, entrance.id), false);
  assert.equal(
    canPickNode(project, { type: "visited", mapId: "target" }, battle.id),
    true,
  );
  assert.deepEqual(resolveExitTarget(project, otherEntrance.id), {
    target: otherRegion.id,
    targetEntry: otherEntrance.id,
  });
  Object.assign(exit, resolveExitTarget(project, otherEntrance.id));
  assert.equal(worldEdges(project)[0].b, otherRegion.id);
  Object.assign(exit, resolveExitTarget(project, town.id));
  assert.equal(exit.targetEntry, "");
  assert.equal(worldEdges(project)[0].b, town.id);
  project.maps[0].nodes = [region, town];
  assert.equal(canPickNode(project, request, otherEntrance.id), false);
});
