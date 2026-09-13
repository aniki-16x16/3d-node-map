export const TYPES = {
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
export const emptyCondition = () => ({ op: "all", rules: [] });
export const newNode = (type, x, y, z = 0) => ({
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
export const blankProject = () => ({
  version: 1,
  name: "未命名地图",
  keys: [],
  maps: [
    { id: "world", name: "世界地图", kind: "world", nodes: [], edges: [] },
  ],
});
export function duplicateNode(project, mapId, source, x, y, z) {
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
      const remap = (c) =>
        c.rules.forEach((r) =>
          r.rules
            ? remap(r)
            : r.type === "visited" &&
              ids.has(r.ref) &&
              (r.ref = ids.get(r.ref)),
        );
      area.id = uid();
      area.name = copy.name;
      area.defaultEntry = ids.get(area.defaultEntry);
      area.nodes.forEach((n) => {
        n.id = ids.get(n.id);
        remap(n.show);
        remap(n.enter);
        if (n.target === source.id) {
          n.target = copy.id;
          n.targetEntry = ids.get(n.targetEntry);
        }
      });
      area.edges = area.edges.map((e) => ({
        ...e,
        id: uid(),
        a: ids.get(e.a),
        b: ids.get(e.b),
      }));
      project.maps.push(area);
      copy.mapId = area.id;
    }
  }
  project.maps.find((m) => m.id === mapId).nodes.push(copy);
  return copy;
}
const node = (id, type, name, x, y, z = 0, extra = {}) => ({
  ...newNode(type, x, y, z),
  id,
  name,
  ...extra,
});
const edge = (a, b, ap = "right", bp = "left") => ({
  id: `${a}-${b}`,
  a,
  b,
  ap,
  bp,
  directed: false,
});
export function demoProject() {
  return {
    version: 1,
    name: "远境 · 探索之路",
    keys: [
      { id: "copper", name: "铜钥匙" },
      { id: "moon", name: "月之碎片" },
    ],
    maps: [
      {
        id: "world",
        name: "世界地图",
        kind: "world",
        nodes: [
          node("harbor", "town", "晨曦港", 160, 330, 0, { start: true }),
          node("forest", "region", "回声森林", 440, 220, 0, { mapId: "woods" }),
          node("camp", "town", "旅人营地", 440, 480, 0, { start: true }),
          node("ruins", "region", "失落遗迹", 780, 220, 0, {
            mapId: "ruins-map",
          }),
          node("haven", "town", "月光城", 1020, 390),
        ],
        edges: [
          edge("harbor", "forest"),
          edge("camp", "forest", "top", "bottom"),
        ],
      },
      {
        id: "woods",
        name: "回声森林",
        kind: "area",
        defaultEntry: "entry",
        nodes: [
          node("entry", "entrance", "林间入口", 160, 330),
          node("fight1", "battle", "林地守卫", 380, 330),
          node("chest1", "chest", "遗落的宝箱", 600, 180, 0, {
            rewards: ["copper"],
          }),
          node("rest1", "rest", "静谧营火", 600, 480),
          node("gate", "checkpoint", "古老封印", 840, 330, 0, {
            enter: {
              op: "all",
              rules: [{ type: "key", ref: "copper", not: false }],
            },
          }),
          node("shop1", "shop", "树梢商人", 600, 330, 1),
          node("secret", "chest", "月之秘藏", 820, 180, -2, {
            show: {
              op: "all",
              rules: [{ type: "visited", ref: "shop1", not: false }],
            },
            rewards: ["moon"],
          }),
          node("out1", "exit", "遗迹之门", 1070, 220, 0, {
            target: "ruins",
            targetEntry: "ruin-entry",
          }),
          node("out2", "exit", "归途", 1070, 470, 0, { target: "haven" }),
        ],
        edges: [
          edge("entry", "fight1"),
          edge("fight1", "chest1"),
          edge("fight1", "rest1"),
          edge("chest1", "gate"),
          edge("rest1", "gate"),
          edge("fight1", "shop1", "top", "left"),
          edge("shop1", "secret"),
          edge("gate", "out1"),
          edge("gate", "out2"),
        ],
      },
      {
        id: "ruins-map",
        name: "失落遗迹",
        kind: "area",
        defaultEntry: "ruin-entry",
        nodes: [
          node("ruin-entry", "entrance", "遗迹入口", 200, 320),
          node("ruin-battle", "battle", "石像守卫", 480, 320),
          node("ruin-exit", "exit", "通往月光城", 780, 320, 0, {
            target: "haven",
          }),
        ],
        edges: [
          edge("ruin-entry", "ruin-battle"),
          edge("ruin-battle", "ruin-exit"),
        ],
      },
    ],
  };
}
export const blankProgress = () => ({
  discovered: [],
  unlocked: [],
  reached: [],
  completed: [],
  keys: [],
  routes: [],
  current: null,
  log: [],
});
export const allNodes = (p) => p.maps.flatMap((m) => m.nodes);
export function conditionPass(condition, state) {
  if (!condition?.rules?.length) return true;
  const values = condition.rules.map((r) =>
    r.rules
      ? conditionPass(r, state)
      : r.not
        ? !(r.type === "key" ? state.keys : state.reached).includes(r.ref)
        : (r.type === "key" ? state.keys : state.reached).includes(r.ref),
  );
  return condition.op === "any" ? values.some(Boolean) : values.every(Boolean);
}
export function worldEdges(p) {
  const world = p.maps.find((m) => m.kind === "world");
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
                b: n.target,
                ap: "right",
                bp: "left",
                directed: true,
                exitId: n.id,
                generated: true,
              }))
          : [];
      }),
  ];
}
export function available(p, map, state) {
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
      if (state.completed.includes(e.exitId)) ids.add(e.b);
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
export function settle(p, input) {
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
export function visit(p, mapId, nodeId, input) {
  let state = settle(p, input),
    map = p.maps.find((m) => m.id === mapId),
    n = map?.nodes.find((n) => n.id === nodeId);
  if (!n || !state.discovered.includes(n.id) || !state.unlocked.includes(n.id))
    return { state, mapId, error: "此节点尚未开放" };
  const complete = (item) => {
    for (const k of ["discovered", "unlocked", "reached", "completed"])
      if (!state[k].includes(item.id)) state[k].push(item.id);
    if (["battle", "chest"].includes(item.type))
      state.keys = [...new Set([...state.keys, ...item.rewards])];
    state.current = item.id;
    state.log = [`到达 ${item.name}`, ...state.log].slice(0, 30);
  };
  complete(n);
  let destination = mapId;
  const enterRegion = (region, entryId) => {
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
    destination = inner.id;
  };
  let error;
  if (n.type === "region") error = enterRegion(n);
  if (n.type === "exit") {
    const world = p.maps.find((m) => m.kind === "world"),
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
export function validate(p) {
  const errors = [],
    nodes = allNodes(p),
    ids = new Set(nodes.map((n) => n.id));
  const check = (c, name) =>
    c?.rules?.forEach((r) =>
      r.rules
        ? check(r, name)
        : !(r.type === "key" ? p.keys : nodes).some((i) => i.id === r.ref) &&
          errors.push(`${name}：条件引用已失效`),
    );
  if (ids.size !== nodes.length) errors.push("节点 ID 重复");
  const world = p.maps.find((m) => m.kind === "world");
  if (!world.nodes.some((n) => n.start)) errors.push("世界地图没有起点");
  for (const m of p.maps) {
    if (
      m.kind === "area" &&
      !m.nodes.some((n) => n.id === m.defaultEntry && n.type === "entrance")
    )
      errors.push(`${m.name}：未设置默认入口`);
    for (const n of m.nodes) {
      check(n.show, n.name);
      check(n.enter, n.name);
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
export function parseProject(text) {
  const p = JSON.parse(text);
  if (
    p.version !== 1 ||
    typeof p.name !== "string" ||
    !Array.isArray(p.keys) ||
    !Array.isArray(p.maps) ||
    p.maps.filter((m) => m.kind === "world").length !== 1
  )
    throw Error("不是有效的 Node Atlas v1 地图文件");
  const ids = new Set();
  const condition = (c, depth = 0) =>
    c &&
    depth < 12 &&
    ["all", "any"].includes(c.op) &&
    Array.isArray(c.rules) &&
    c.rules.every((r) =>
      r.rules
        ? condition(r, depth + 1)
        : ["key", "visited"].includes(r.type) &&
          typeof r.ref === "string" &&
          typeof r.not === "boolean",
    );
  for (const k of p.keys)
    if (typeof k.id !== "string" || typeof k.name !== "string")
      throw Error("钥匙格式错误");
  for (const m of p.maps) {
    if (
      typeof m.id !== "string" ||
      typeof m.name !== "string" ||
      !["world", "area"].includes(m.kind) ||
      !Array.isArray(m.nodes) ||
      !Array.isArray(m.edges) ||
      ids.has(m.id)
    )
      throw Error("地图格式错误");
    ids.add(m.id);
    for (const n of m.nodes) {
      if (
        typeof n.id !== "string" ||
        ids.has(n.id) ||
        typeof n.name !== "string" ||
        !(
          m.kind === "world"
            ? ["town", "region"]
            : [
                "battle",
                "shop",
                "rest",
                "checkpoint",
                "chest",
                "entrance",
                "exit",
              ]
        ).includes(n.type) ||
        !Number.isFinite(n.x) ||
        !Number.isFinite(n.y) ||
        !Number.isInteger(n.z) ||
        (m.kind === "world" && n.z !== 0) ||
        !condition(n.show) ||
        !condition(n.enter) ||
        !Array.isArray(n.rewards) ||
        !n.rewards.every((k) => typeof k === "string")
      )
        throw Error("节点格式错误");
      ids.add(n.id);
    }
    for (const e of m.edges)
      if (
        typeof e.id !== "string" ||
        typeof e.a !== "string" ||
        typeof e.b !== "string" ||
        !["top", "bottom", "left", "right"].includes(e.ap) ||
        !["top", "bottom", "left", "right"].includes(e.bp) ||
        typeof e.directed !== "boolean"
      )
        throw Error("连线格式错误");
  }
  return p;
}
export const ports = {
  top: [0, -34],
  right: [34, 0],
  bottom: [0, 34],
  left: [-34, 0],
};
export function route(a, b, ap, bp) {
  const s = { x: a.x + ports[ap][0], y: a.y + ports[ap][1] },
    t = { x: b.x + ports[bp][0], y: b.y + ports[bp][1] };
  const av = ["top", "bottom"].includes(ap),
    bv = ["top", "bottom"].includes(bp);
  if (av && bv)
    return [
      s,
      { x: s.x, y: (s.y + t.y) / 2 },
      { x: t.x, y: (s.y + t.y) / 2 },
      t,
    ];
  if (!av && !bv)
    return [
      s,
      { x: (s.x + t.x) / 2, y: s.y },
      { x: (s.x + t.x) / 2, y: t.y },
      t,
    ];
  return [s, av ? { x: s.x, y: t.y } : { x: t.x, y: s.y }, t];
}
