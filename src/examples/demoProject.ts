import { newNode } from "../domain/project";
import { SNAP_STEP } from "../domain/layout";
import type {
  MapEdge,
  MapNode,
  NodeType,
  Port,
  Project,
} from "../domain/types";
// Coordinates below are grid units; z remains a floor number.
const node = (
  id: string,
  type: NodeType,
  name: string,
  x: number,
  y: number,
  z = 0,
  extra: Partial<MapNode> = {},
): MapNode => ({
  ...newNode(type, x * SNAP_STEP, y * SNAP_STEP, z),
  id,
  name,
  ...extra,
});
const edge = (
  a: string,
  b: string,
  ap: Port = "right",
  bp: Port = "left",
): MapEdge => ({
  id: `${a}-${b}`,
  a,
  b,
  ap,
  bp,
  directed: false,
});
export function demoProject(): Project {
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
          node("harbor", "town", "晨曦港", 4, 10, 0, { start: true }),
          node("forest", "region", "回声森林", 13, 6, 0, { mapId: "woods" }),
          node("camp", "town", "旅人营地", 13, 14, 0, { start: true }),
          node("ruins", "region", "失落遗迹", 23, 6, 0, {
            mapId: "ruins-map",
          }),
          node("haven", "town", "月光城", 31, 12),
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
          node("entry", "entrance", "林间入口", 4, 10),
          node("fight1", "battle", "林地守卫", 8, 10),
          node("forest-fork", "structure", "林间岔路", 12, 10),
          node("forest-merge", "structure", "封印前庭", 20, 10),
          node("exit-fork", "structure", "出口岔路", 28, 10),
          node("chest1", "chest", "遗落的宝箱", 12, 5, 0, {
            rewards: ["copper"],
          }),
          node("rest1", "rest", "静谧营火", 12, 15),
          node("gate", "checkpoint", "古老封印", 24, 10, 0, {
            enter: {
              op: "all",
              rules: [{ type: "key", ref: "copper", not: false }],
            },
          }),
          node("shop1", "shop", "树梢商人", 8, 10, 1),
          node("secret", "chest", "月之秘藏", 16, 5, -2, {
            show: {
              op: "all",
              rules: [{ type: "visited", ref: "shop1", not: false }],
            },
            rewards: ["moon"],
          }),
          node("out1", "exit", "遗迹之门", 32, 5, 0, {
            target: "ruins",
            targetEntry: "ruin-entry",
          }),
          node("out2", "exit", "归途", 32, 15, 0, { target: "haven" }),
        ],
        edges: [
          edge("entry", "fight1"),
          edge("fight1", "forest-fork"),
          edge("forest-fork", "chest1", "top", "bottom"),
          edge("forest-fork", "rest1", "bottom", "top"),
          edge("chest1", "forest-merge", "right", "top"),
          edge("rest1", "forest-merge", "right", "bottom"),
          edge("forest-merge", "gate"),
          edge("fight1", "shop1", "top", "left"),
          edge("shop1", "secret"),
          edge("gate", "exit-fork"),
          edge("exit-fork", "out1", "top", "left"),
          edge("exit-fork", "out2", "bottom", "left"),
        ],
      },
      {
        id: "ruins-map",
        name: "失落遗迹",
        kind: "area",
        defaultEntry: "ruin-entry",
        nodes: [
          node("ruin-entry", "entrance", "遗迹入口", 4, 10),
          node("ruin-hall", "structure", "遗迹长廊", 10, 10),
          node("ruin-battle", "battle", "石像守卫", 16, 10),
          node("ruin-exit", "exit", "通往月光城", 24, 10, 0, {
            target: "haven",
          }),
        ],
        edges: [
          edge("ruin-entry", "ruin-hall"),
          edge("ruin-hall", "ruin-battle"),
          edge("ruin-battle", "ruin-exit"),
        ],
      },
    ],
  };
}
