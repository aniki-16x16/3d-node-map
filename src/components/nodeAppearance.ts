import type { LucideIcon } from "lucide-react";
import {
  Castle,
  DoorOpen,
  Flag,
  Gem,
  LogIn,
  Mountain,
  Store,
  Swords,
  Tent,
} from "lucide-react";
import type { NodeType } from "../domain/types";
export const ICONS: Record<NodeType, LucideIcon> = {
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
