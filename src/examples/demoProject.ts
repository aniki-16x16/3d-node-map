import { newNode } from "../domain/project";
import type {
  MapEdge,
  MapNode,
  NodeType,
  Port,
  Project,
} from "../domain/types";
const node = (
  id: string,
  type: NodeType,
  name: string,
  x: number,
  y: number,
  z = 0,
  extra: Partial<MapNode> = {},
): MapNode => ({
  ...newNode(type, x, y, z),
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
