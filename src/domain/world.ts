import type { MapEdge, Project } from "./types";
export function worldEdges(p: Project): MapEdge[] {
  const world = p.maps.find((m) => m.kind === "world")!;
  return [
    ...world.edges,
    ...p.maps
      .filter((m) => m.kind === "area")
      .flatMap((m) => {
        const parent = world.nodes.find((n) => n.mapId === m.id);
        return parent
          ? m.nodes
              .filter((n) => n.type === "exit" && n.target)
              .map((n) => ({
                id: `exit-${n.id}`,
                a: parent.id,
                b: n.target!,
                ap: "right" as const,
                bp: "left" as const,
                directed: true,
                exitId: n.id,
                generated: true,
              }))
          : [];
      }),
  ];
}
