import { useEffect, useMemo, useRef, useState } from "react";
import { worldEdges } from "../domain/world";
import { deleteArea } from "../domain/deleteArea";
import type { EditorTool, Modal, PendingConnection } from "./editorTypes";
import { useCanvasInteraction } from "./useCanvasInteraction";
import { useEditorShortcuts } from "./useEditorShortcuts";
import { useNodeActions } from "./useNodeActions";
import { usePreview } from "./usePreview";
import { useProjectFiles } from "./useProjectFiles";
import { useProjectHistory } from "./useProjectHistory";

/** Composes feature hooks. UI components receive only the controller fields they use. */
export function useEditorController() {
  const document = useProjectHistory();
  const { project, commit, setProject, checkpoint, history, saveState } =
    document;
  const [mapId, setMapId] = useState("world"),
    [layer, setLayer] = useState(0);
  const [selected, setSelected] = useState<string | null>(null),
    [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [three, setThree] = useState(false),
    [tool, setTool] = useState<EditorTool>("select");
  const [pending, setPending] = useState<PendingConnection | null>(null),
    [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState("");
  const didDrag = useRef(false);
  const notify = (message: string) => setToast(message);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3600);
    return () => clearTimeout(timeout);
  }, [toast]);
  const world = project.maps.find((m) => m.kind === "world")!;
  const map = project.maps.find((m) => m.id === mapId) || world;
  const node = map.nodes.find((n) => n.id === selected);
  const edges = useMemo(
    () => (map.kind === "world" ? worldEdges(project) : map.edges),
    [project, map],
  );
  const edge = edges.find((e) => e.id === selectedEdge);
  const changeMap = (id: string) => {
    setMapId(id);
    setLayer(0);
    setSelected(null);
    setSelectedEdge(null);
    setPending(null);
  };
  const preview = usePreview({
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
  });
  const { playing, activeProgress, setProgress } = preview,
    readonly = playing || three;
  const visibleNodes = useMemo(
    () =>
      map.nodes.filter(
        (n) => !playing || activeProgress.discovered.includes(n.id),
      ),
    [map, playing, activeProgress],
  );
  const layers = [...new Set([0, layer, ...map.nodes.map((n) => n.z)])].sort(
    (a, b) => b - a,
  );
  const viewport = useCanvasInteraction({
    project,
    map,
    layer,
    visibleNodes,
    readonly,
    three,
    tool,
    setProject,
    checkpoint,
    setSelected,
    setSelectedEdge,
    didDrag,
  });
  const actions = useNodeActions({
    map,
    node,
    edge,
    selected,
    readonly,
    pending,
    canvas: viewport.canvas,
    view: viewport.view,
    layer,
    commit,
    setSelected,
    setSelectedEdge,
    setPending,
    notify,
  });
  const undo = () => {
    if (!readonly) {
      document.undo();
      setSelected(null);
      setSelectedEdge(null);
      setPending(null);
    }
  };
  const deleteMap = (id: string) => {
    if (readonly || !project.maps.some((m) => m.id === id && m.kind === "area"))
      return;
    commit((p) => deleteArea(p, id));
    changeMap(map.id === id ? world.id : map.id);
    notify("二级地图及关联节点已删除，可撤销恢复");
  };
  const redo = () => {
    if (!readonly) {
      document.redo();
      setSelected(null);
      setSelectedEdge(null);
      setPending(null);
    }
  };
  useEditorShortcuts({
    readonly,
    node,
    map,
    layer,
    undo,
    redo,
    deleteSelection: actions.deleteSelection,
    commit,
    notify,
    setPending,
    setSelected,
    setSelectedEdge,
    setModal,
    setTool,
  });
  const files = useProjectFiles({
    project,
    commit,
    changeMap,
    setProgress,
    notify,
  });
  return {
    project,
    map,
    world,
    node,
    edge,
    edges,
    layer,
    setLayer,
    selected,
    setSelected,
    selectedEdge,
    setSelectedEdge,
    three,
    setThree,
    tool,
    setTool,
    pending,
    setPending,
    modal,
    setModal,
    toast,
    notify,
    commit,
    history,
    saveState,
    changeMap,
    readonly,
    deleteMap,
    visibleNodes,
    layers,
    undo,
    redo,
    ...preview,
    ...viewport,
    ...actions,
    ...files,
  };
}
export type EditorController = ReturnType<typeof useEditorController>;
