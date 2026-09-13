import type { RefObject } from "react";
import { useMemo, useState } from "react";
import { blankProgress, settle, visit } from "../domain/exploration";
import type { AtlasMap, MapNode, Project } from "../domain/types";
import type { Notify, PendingConnection, Setter } from "./editorTypes";
interface Options {
  project: Project;
  map: AtlasMap;
  world: AtlasMap;
  didDrag: RefObject<boolean>;
  changeMap: (id: string) => void;
  setSelected: Setter<string | null>;
  setSelectedEdge: Setter<string | null>;
  setPending: Setter<PendingConnection | null>;
  setLayer: Setter<number>;
  notify: Notify;
}
export function usePreview({
  project,
  map,
  world,
  didDrag,
  changeMap,
  setSelected,
  setSelectedEdge,
  setPending,
  setLayer,
  notify,
}: Options) {
  const [playing, setPlaying] = useState(false),
    [progress, setProgress] = useState(blankProgress);
  const activeProgress = useMemo(
    () => settle(project, progress),
    [project, progress],
  );
  const onNode = (id: string) => {
    if (didDrag.current) return;
    if (!playing) {
      setSelected(id);
      setSelectedEdge(null);
      return;
    }
    const result = visit(project, map.id, id, activeProgress);
    setProgress(result.state);
    if (result.error) notify(result.error);
    if (result.mapId !== map.id) {
      changeMap(result.mapId);
      const dest = project.maps
        .find((m) => m.id === result.mapId)
        ?.nodes.find((n) => n.id === result.state.current);
      setLayer(dest?.z || 0);
    } else setSelected(id);
  };
  const togglePlay = () => {
    setPlaying(!playing);
    setSelected(null);
    setSelectedEdge(null);
    setPending(null);
    if (!playing) {
      setProgress(settle(project, blankProgress()));
      changeMap(world.id);
      notify("预览已开始：点击起点开始探索");
    }
  };
  const status = (n: MapNode) =>
    activeProgress.completed.includes(n.id)
      ? "已完成"
      : !activeProgress.discovered.includes(n.id)
        ? "未发现"
        : activeProgress.unlocked.includes(n.id)
          ? "可进入"
          : "已锁定";
  return {
    playing,
    progress,
    setProgress,
    activeProgress,
    onNode,
    togglePlay,
    status,
  };
}
