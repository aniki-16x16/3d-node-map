import { conditionPass } from "./conditions";
import type {
  AtlasMap,
  MapNode,
  Progress,
  Project,
  VisitResult,
} from "./types";
import { worldEdges } from "./world";
export const blankProgress = (): Progress => ({
  discovered: [],
  unlocked: [],
  reached: [],
  completed: [],
  keys: [],
  routes: [],
  current: null,
  log: [],
});
export function available(p: Project, map: AtlasMap, state: Progress) {
  const ids = new Set(
    map.nodes
      .filter(
        (n) =>
          n.start ||
          state.completed.includes(n.id) ||
          state.routes.includes(n.id),
      )
      .map((n) => n.id),
  );
  const edges = map.kind === "world" ? worldEdges(p) : map.edges;
  for (const e of edges) {
    if (e.generated) {
      if (state.completed.includes(e.exitId!)) ids.add(e.b);
      continue;
    }
    const a = map.nodes.find((n) => n.id === e.a),
      b = map.nodes.find((n) => n.id === e.b);
    if (state.completed.includes(e.a) && a?.type !== "region") ids.add(e.b);
    if (!e.directed && state.completed.includes(e.b) && b?.type !== "region")
      ids.add(e.a);
  }
  return ids;
}
export function settle(p: Project, input: Progress): Progress {
  const state = structuredClone(input);
  for (const m of p.maps) {
    const candidates = available(p, m, state);
    for (const n of m.nodes) {
      if (
        candidates.has(n.id) &&
        conditionPass(n.show, state) &&
        !state.discovered.includes(n.id)
      )
        state.discovered.push(n.id);
      if (
        state.discovered.includes(n.id) &&
        conditionPass(n.enter, state) &&
        !state.unlocked.includes(n.id)
      )
        state.unlocked.push(n.id);
    }
  }
  return state;
}
export function visit(
  p: Project,
  mapId: string,
  nodeId: string,
  input: Progress,
): VisitResult {
  let state = settle(p, input),
    map = p.maps.find((m) => m.id === mapId),
    n = map?.nodes.find((n) => n.id === nodeId);
  if (!n || !state.discovered.includes(n.id) || !state.unlocked.includes(n.id))
    return { state, mapId, error: "此节点尚未开放" };
  const complete = (item: MapNode) => {
    for (const k of ["discovered", "unlocked", "reached", "completed"] as const)
      if (!state[k].includes(item.id)) state[k].push(item.id);
    if (["battle", "chest"].includes(item.type))
      state.keys = [...new Set([...state.keys, ...item.rewards])];
    state.current = item.id;
    state.log = [`到达 ${item.name}`, ...state.log].slice(0, 30);
  };
  complete(n);
  let destination = mapId;
  const enterRegion = (region: MapNode, entryId?: string) => {
    const inner = p.maps.find((m) => m.id === region.mapId),
      entry = inner?.nodes.find(
        (n) =>
          n.id === (entryId || inner.defaultEntry) && n.type === "entrance",
      );
    if (!entry) return "目标区域未配置有效入口";
    state = settle(p, state);
    if (
      (!state.discovered.includes(entry.id) &&
        !conditionPass(entry.show, state)) ||
      (!state.unlocked.includes(entry.id) && !conditionPass(entry.enter, state))
    )
      return "目标入口的条件未满足";
    if (region.id !== n.id) complete(region);
    complete(entry);
    destination = inner!.id;
  };
  let error: string | undefined;
  if (n.type === "region") error = enterRegion(n);
  if (n.type === "exit") {
    const world = p.maps.find((m) => m.kind === "world")!,
      target = world.nodes.find((t) => t.id === n.target);
    if (!target) error = "出口尚未绑定目标";
    else {
      state.routes = [...new Set([...state.routes, target.id])];
      state = settle(p, state);
      if (
        !state.discovered.includes(target.id) ||
        !state.unlocked.includes(target.id)
      )
        error = "出口已完成，目标节点的条件尚未满足";
      else if (target.type === "region")
        error = enterRegion(target, n.targetEntry);
      else {
        complete(target);
        destination = world.id;
      }
    }
  }
  return { state: settle(p, state), mapId: destination, error };
}
