import type { Project } from "./types";
export function canPickNode(
  project: Project,
  request: { type: string; mapId: string } | null,
  id: string,
): boolean {
  if (!request || request.type === "key") return false;
  return project.maps.some((map) =>
    map.nodes.some(
      (node) =>
        node.id === id &&
        (request.type !== "exit-target" ||
          resolveExitTarget(project, node.id) !== null),
    ),
  );
}

export function resolveExitTarget(
  project: Project,
  id: string,
): { target: string; targetEntry: string } | null {
  const world = project.maps.find((map) => map.kind === "world");
  if (world?.nodes.some((node) => node.id === id && node.type === "town"))
    return { target: id, targetEntry: "" };
  const area = project.maps.find(
    (map) =>
      map.kind === "area" &&
      map.nodes.some((node) => node.id === id && node.type === "entrance"),
  );
  const region =
    area &&
    world?.nodes.find(
      (node) => node.type === "region" && node.mapId === area.id,
    );
  return region ? { target: region.id, targetEntry: id } : null;
}
