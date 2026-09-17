import { allNodes, availableKeys } from "./project";
import type { ConditionGroup, Project } from "./types";
export function validate(p: Project): string[] {
  const errors: string[] = [],
    nodes = allNodes(p),
    ids = new Set(nodes.map((n) => n.id));
  const check = (c: ConditionGroup, name: string, mapId: string): void =>
    c.groups.forEach((group) => group.rules.forEach((r) => {
      if (!(r.type === "key" ? availableKeys(p, mapId) : nodes).some((i) => i.id === r.ref)) errors.push(name + "：条件引用已失效");
    }));
  if (ids.size !== nodes.length) errors.push("节点 ID 重复");
  const world = p.maps.find((m) => m.kind === "world")!;
  if (!world.nodes.some((n) => n.start)) errors.push("世界地图没有起点");
  for (const m of p.maps) {
    if (
      m.kind === "area" &&
      !m.nodes.some((n) => n.id === m.defaultEntry && n.type === "entrance")
    )
      errors.push(`${m.name}：未设置默认入口`);
    for (const n of m.nodes) {
      check(n.show, n.name, m.id);
      check(n.enter, n.name, m.id);
      if (
        n.rewards.some((id) => !availableKeys(p, m.id).some((k) => k.id === id))
      )
        errors.push(`${n.name}：奖励钥匙失效或不属于当前地图`);
      if (
        n.type === "region" &&
        !p.maps.some((m) => m.id === n.mapId && m.kind === "area")
      )
        errors.push(`${n.name}：未关联二级地图`);
      if (n.type === "exit") {
        const t = world.nodes.find((t) => t.id === n.target);
        if (!t) errors.push(`${n.name}：未绑定有效出口目标`);
        else if (
          t.type === "region" &&
          !p.maps
            .find((m) => m.id === t.mapId)
            ?.nodes.some((e) => e.id === n.targetEntry && e.type === "entrance")
        )
          errors.push(`${n.name}：未绑定目标入口`);
      }
    }
    for (const e of m.edges)
      if (
        !m.nodes.some((n) => n.id === e.a) ||
        !m.nodes.some((n) => n.id === e.b)
      )
        errors.push(`${m.name}：连线端点失效`);
    const reachable = new Set(
      m.nodes.filter((n) => n.start || n.type === "entrance").map((n) => n.id),
    );
    if (m.kind === "world")
      for (const a of p.maps)
        for (const n of a.nodes)
          if (n.type === "exit" && n.target) reachable.add(n.target);
    let changed = true;
    while (changed) {
      changed = false;
      for (const e of m.edges) {
        if (reachable.has(e.a) && !reachable.has(e.b)) {
          reachable.add(e.b);
          changed = true;
        }
        if (!e.directed && reachable.has(e.b) && !reachable.has(e.a)) {
          reachable.add(e.a);
          changed = true;
        }
      }
    }
    for (const n of m.nodes)
      if (!reachable.has(n.id)) errors.push(`${n.name}：没有可达路径`);
  }
  return [...new Set(errors)];
}
