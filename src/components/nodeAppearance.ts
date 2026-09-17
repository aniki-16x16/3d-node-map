import type { LucideIcon } from "lucide-react";
import {
  createLucideIcon,
  Castle,
  DoorOpen,
  Flag,
  Gem,
  LogIn,
  Mountain,
  Store,
  Swords,
  Skull,
  Tent,
} from "lucide-react";
import type { MapNode, NodeType } from "../domain/types";
export const ICONS: Record<NodeType, LucideIcon> = {
  structure: createLucideIcon("Structure", [
    [
      "rect",
      {
        x: "5",
        y: "5",
        width: "14",
        height: "14",
        rx: "2",
        transform: "rotate(45 12 12)",
        fill: "currentColor",
        strokeWidth: "1",
        key: "diamond",
      },
    ],
  ]),
  town: Castle,
  region: Mountain,
  battle: Swords,
  shop: Store,
  rest: Tent,
  checkpoint: Flag,
  chest: Gem,
  entrance: LogIn,
  exit: DoorOpen,
};
export const colors: Record<NodeType, string> = {
  structure: "#e3e8ec",
  town: "#a6d8cb",
  region: "#c1abec",
  battle: "#e5a98b",
  shop: "#e0c284",
  rest: "#a1cdb8",
  checkpoint: "#b5bed4",
  chest: "#e1cb83",
  entrance: "#97c8e1",
  exit: "#b6a2de",
};

export const nodeIcon = (node: MapNode): LucideIcon =>
  node.type === "battle" && node.boss ? Skull : ICONS[node.type];
export const nodeColor = (node: MapNode): string =>
  node.type === "battle" && node.boss ? "#ef7078" : colors[node.type];
