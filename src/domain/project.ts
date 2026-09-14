import type { ConditionGroup, MapNode, NodeType, Project } from "./types";
export const TYPES: Record<NodeType, string> = {
  structure: "结构",
  town: "城镇",
  region: "战斗区域",
  battle: "战斗",
  shop: "商店",
  rest: "休息",
  checkpoint: "检查点",
  chest: "宝箱",
  entrance: "入口",
  exit: "出口",
};
export const uid = () => crypto.randomUUID();
export const emptyCondition = (): ConditionGroup => ({ op: "all", rules: [] });
export const newNode = (
  type: NodeType,
  x: number,
  y: number,
  z = 0,
): MapNode => ({
  id: uid(),
  type,
  name: TYPES[type],
  x,
  y,
  z,
  start: false,
  show: emptyCondition(),
  enter: emptyCondition(),
  rewards: [],
});
export const blankProject = (): Project => ({
  version: 1,
  name: "未命名地图",
  keys: [],
  maps: [
    { id: "world", name: "世界地图", kind: "world", nodes: [], edges: [] },
  ],
});
export function duplicateNode(
  project: Project,
  mapId: string,
  source: MapNode,
  x: number,
  y: number,
  z: number,
): MapNode {
  const copy = {
    ...structuredClone(source),
    id: uid(),
    name: `${source.name} 副本`,
    x,
    y,
    z,
    start: false,
  };
  if (source.type === "region") {
    const original = project.maps.find((m) => m.id === source.mapId);
    if (original) {
      const area = structuredClone(original),
        ids = new Map(area.nodes.map((n) => [n.id, uid()]));
      const remap = (c: ConditionGroup) =>
        c.rules.forEach((r) =>
          r.rules
            ? remap(r)
            : r.type === "visited" &&
              ids.has(r.ref) &&
              (r.ref = ids.get(r.ref)!),
        );
      area.id = uid();
      area.name = copy.name;
      area.defaultEntry = ids.get(area.defaultEntry || "");
      area.nodes.forEach((n) => {
        n.id = ids.get(n.id)!;
        remap(n.show);
        remap(n.enter);
        if (n.target === source.id) {
          n.target = copy.id;
          n.targetEntry = ids.get(n.targetEntry || "");
        }
      });
      area.edges = area.edges.map((e) => ({
        ...e,
        id: uid(),
        a: ids.get(e.a)!,
        b: ids.get(e.b)!,
      }));
      project.maps.push(area);
      copy.mapId = area.id;
    }
  }
  project.maps.find((m) => m.id === mapId)!.nodes.push(copy);
  return copy;
}
export const allNodes = (p: Project) => p.maps.flatMap((m) => m.nodes);
