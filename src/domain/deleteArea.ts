import type { ConditionGroup, Project } from "./types";

/** Remove an area and references to its nodes and world-map representations. */
export function deleteArea(project: Project, id: string) {
  const area = project.maps.find((map) => map.id === id && map.kind === "area");
  if (!area) return project;
  const removed = new Set(area.nodes.map((node) => node.id));
  for (const map of project.maps)
    for (const node of map.nodes) if (node.mapId === id) removed.add(node.id);
  const clean = (condition: ConditionGroup) => {
    for (const group of condition.groups) group.rules = group.rules.filter((rule) => rule.type !== "visited" || !removed.has(rule.ref));
    condition.groups = condition.groups.filter((g) => g.rules.length);
  };
  project.maps = project.maps.filter((map) => map.id !== id);
  project.keys = project.keys.filter((k) => k.mapId !== id);
  for (const map of project.maps) {
    map.nodes = map.nodes.filter((node) => !removed.has(node.id));
    map.edges = map.edges.filter(
      (edge) => !removed.has(edge.a) && !removed.has(edge.b),
    );
    for (const node of map.nodes) {
      if (node.target && removed.has(node.target)) {
        delete node.target;
        delete node.targetEntry;
      }
      if (node.targetEntry && removed.has(node.targetEntry))
        delete node.targetEntry;
      clean(node.show);
      clean(node.enter);
    }
  }
  return project;
}
