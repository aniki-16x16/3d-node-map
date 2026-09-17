export type NodeType =
  | "town"
  | "region"
  | "battle"
  | "shop"
  | "rest"
  | "checkpoint"
  | "chest"
  | "entrance"
  | "exit"
  | "structure";
export type Port = "top" | "right" | "bottom" | "left";
export interface Point {
  x: number;
  y: number;
}
export interface Position extends Point {
  z: number;
}
export interface ConditionRule {
  type: "key" | "visited";
  ref: string;
  not: boolean;
  rules?: never;
}
export interface ConditionGroup {
  op: "all" | "any";
  rules: Condition[];
}
export type Condition = ConditionRule | ConditionGroup;
export interface MapNode extends Position {
  id: string;
  type: NodeType;
  name: string;
  start: boolean;
  show: ConditionGroup;
  enter: ConditionGroup;
  rewards: string[];
  boss?: boolean;
  mapId?: string;
  target?: string;
  targetEntry?: string;
}
export interface MapEdge {
  id: string;
  a: string;
  b: string;
  ap: Port;
  bp: Port;
  directed: boolean;
  exitId?: string;
  generated?: boolean;
}
export interface AtlasMap {
  id: string;
  name: string;
  kind: "world" | "area";
  nodes: MapNode[];
  edges: MapEdge[];
  defaultEntry?: string;
}
export interface KeyResource {
  mapId: string | null;
  id: string;
  name: string;
}
export interface Project {
  version: 1;
  name: string;
  keys: KeyResource[];
  maps: AtlasMap[];
}
export interface Progress {
  discovered: string[];
  unlocked: string[];
  reached: string[];
  completed: string[];
  keys: string[];
  routes: string[];
  current: string | null;
  log: string[];
}
export interface VisitResult {
  state: Progress;
  mapId: string;
  error?: string;
}
