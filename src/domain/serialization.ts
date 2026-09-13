import type {
  AtlasMap,
  ConditionGroup,
  MapEdge,
  MapNode,
  Project,
} from "./types";
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const optionalString = (v: unknown) => v === undefined || typeof v === "string";
const ports = ["top", "bottom", "left", "right"];
function condition(v: unknown, depth = 0): v is ConditionGroup {
  return (
    record(v) &&
    depth < 12 &&
    ["all", "any"].includes(String(v.op)) &&
    Array.isArray(v.rules) &&
    v.rules.every(
      (r) =>
        record(r) &&
        (r.rules !== undefined
          ? condition(r, depth + 1)
          : ["key", "visited"].includes(String(r.type)) &&
            typeof r.ref === "string" &&
            typeof r.not === "boolean"),
    )
  );
}
function node(v: unknown, kind: AtlasMap["kind"]): v is MapNode {
  return (
    record(v) &&
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    (kind === "world"
      ? ["town", "region"]
      : ["battle", "shop", "rest", "checkpoint", "chest", "entrance", "exit"]
    ).includes(String(v.type)) &&
    typeof v.x === "number" &&
    Number.isFinite(v.x) &&
    typeof v.y === "number" &&
    Number.isFinite(v.y) &&
    typeof v.z === "number" &&
    Number.isInteger(v.z) &&
    (kind !== "world" || v.z === 0) &&
    typeof v.start === "boolean" &&
    condition(v.show) &&
    condition(v.enter) &&
    strings(v.rewards) &&
    optionalString(v.mapId) &&
    optionalString(v.target) &&
    optionalString(v.targetEntry)
  );
}
function edge(v: unknown): v is MapEdge {
  return (
    record(v) &&
    typeof v.id === "string" &&
    typeof v.a === "string" &&
    typeof v.b === "string" &&
    ports.includes(String(v.ap)) &&
    ports.includes(String(v.bp)) &&
    typeof v.directed === "boolean"
  );
}
function map(v: unknown): v is AtlasMap {
  return (
    record(v) &&
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    (v.kind === "world" || v.kind === "area") &&
    Array.isArray(v.nodes) &&
    v.nodes.every((n) => node(n, v.kind as AtlasMap["kind"])) &&
    Array.isArray(v.edges) &&
    v.edges.every(edge) &&
    optionalString(v.defaultEntry)
  );
}
function project(v: unknown): v is Project {
  return (
    record(v) &&
    v.version === 1 &&
    typeof v.name === "string" &&
    Array.isArray(v.keys) &&
    v.keys.every(
      (k) =>
        record(k) && typeof k.id === "string" && typeof k.name === "string",
    ) &&
    Array.isArray(v.maps) &&
    v.maps.every(map) &&
    v.maps.filter((m) => m.kind === "world").length === 1
  );
}
export function parseProject(text: string): Project {
  const value: unknown = JSON.parse(text);
  if (!project(value))
    throw new Error(
      "不是有效的 Node Atlas v1 地图文件，或节点、连线、条件格式错误",
    );
  const ids = [
    ...value.maps.map((m) => m.id),
    ...value.maps.flatMap((m) => m.nodes.map((n) => n.id)),
  ];
  if (new Set(ids).size !== ids.length) throw new Error("地图或节点 ID 重复");
  return value;
}
