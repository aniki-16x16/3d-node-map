import { useEffect, useRef } from "react";
import { createMapScene } from "./three/createMapScene";
import type { CameraPose, SceneData } from "./three/types";
interface Props extends SceneData {
  onSelect: (id: string) => void;
}
export default function Scene3D({ onSelect, ...data }: Props) {
  const host = useRef<HTMLDivElement>(null),
    pose = useRef<CameraPose | undefined>(undefined),
    action = useRef(onSelect);
  action.current = onSelect;
  const { nodes, edges, selected, progress, playing } = data;
  useEffect(() => {
    if (!host.current) return;
    return createMapScene(
      host.current,
      { nodes, edges, selected, progress, playing },
      pose,
      (id) => action.current(id),
    );
  }, [nodes, edges, selected, progress, playing]);
  return <div className="scene3d" ref={host} />;
}
