import type { Vector3 } from "three";
import type { MapEdge, MapNode, Progress } from "../../../domain/types";
export interface SceneData {
  nodes: MapNode[];
  edges: MapEdge[];
  selected: string | null;
  selectedEdge: string | null;
  progress: Progress;
  playing: boolean;
}
export interface CameraPose {
  position: Vector3;
  target: Vector3;
}
