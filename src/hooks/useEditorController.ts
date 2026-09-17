import { canPickNode } from "../domain/nodePicking";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TargetRequest } from "../components/inspector/TargetSelectionContext";
import type { ViewTransform } from "./editorTypes";
import { worldEdges } from "../domain/world";
import { duplicateNode, newNode } from "../domain/project";
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
  const [selected, setSelectedValue] = useState<string | null>(null),
    [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const setSelected: import("./editorTypes").Setter<string | null> = (
    value,
  ) => {
    setSelectedIds([]);
    setSelectedValue(value);
  };
  const selectNodes = (ids: string[]) => {
    setSelectedIds(ids);
    setSelectedValue(ids.length === 1 ? ids[0] : null);
    setSelectedEdge(null);
  };
  const [three, setThree] = useState(false),
    [tool, setTool] = useState<EditorTool>("select");
  const [pending, setPending] = useState<PendingConnection | null>(null),
    [modal, setModal] = useState<Modal>(null);
  const [targetRequest, setTargetRequest] = useState<TargetRequest | null>(
    null,
  );
  const [targetSession, setTargetSession] = useState(0);
  const [pickingNode, setPickingNode] = useState(false);
  const pickOrigin = useRef<{
    mapId: string;
    layer: number;
    selected: string | null;
    selectedEdge: string | null;
    view: ViewTransform;
    three: boolean;
    tool: EditorTool;
    pending: PendingConnection | null;
  } | null>(null);
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
    readonly = playing || three || pickingNode;
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
    selectedIds: selectedIds.length ? selectedIds : selected ? [selected] : [],
    selectNodes,
  });
  const restoringPick = useRef(false);
  useEffect(() => {
    if (restoringPick.current) {
      restoringPick.current = false;
      return;
    }
    setSelected(null);
    setSelectedEdge(null);
  }, [layer, three]);
  const startNodePick = () => {
    pickOrigin.current = {
      mapId,
      layer,
      selected,
      selectedEdge,
      view: { ...viewport.view },
      three,
      tool,
      pending,
    };
    if (targetRequest?.type === "exit-target") {
      const destination = project.maps.find(
        (m) => m.id === targetRequest.mapId,
      );
      const entry =
        destination?.nodes.find(
          (n) =>
            n.id === targetRequest.ref &&
            canPickNode(project, targetRequest, n.id),
        ) ??
        destination?.nodes.find((n) =>
          canPickNode(project, targetRequest, n.id),
        );
      if (destination) {
        setMapId(destination.id);
        setLayer(entry?.z ?? 0);
        if (entry)
          viewport.setView((v) => ({
            ...v,
            x:
              (viewport.canvas.current?.clientWidth ?? 800) / 2 - entry.x * v.k,
            y:
              (viewport.canvas.current?.clientHeight ?? 600) / 2 -
              entry.y * v.k,
          }));
      }
    }
    setPickingNode(true);
    setSelected(null);
    setSelectedEdge(null);
    setPending(null);
    setThree(false);
    setTool("select");
  };
  const finishNodePick = (id?: string) => {
    const origin = pickOrigin.current;
    if (!origin) return;
    if (id && !canPickNode(project, targetRequest, id)) return;
    if (id && targetRequest) {
      targetRequest.onSelect(id);
      setTargetRequest({ ...targetRequest, ref: id });
    }
    restoringPick.current = layer !== origin.layer || three !== origin.three;
    setMapId(origin.mapId);
    setLayer(origin.layer);
    setSelected(origin.selected);
    setSelectedEdge(origin.selectedEdge);
    viewport.setView(origin.view);
    setThree(origin.three);
    setTool(origin.tool);
    setPending(origin.pending);
    setPickingNode(false);
    pickOrigin.current = null;
  };
  useEffect(() => {
    if (!pickingNode) return;
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        finishNodePick();
      } else if (
        !(e.target as HTMLElement).closest("input, select, textarea, button")
      ) {
        if (e.key === "PageUp" || e.key === "PageDown") {
          e.preventDefault();
          setLayer((z) =>
            map.kind === "world" ? 0 : z + (e.key === "PageUp" ? 1 : -1),
          );
        }
        if (e.key === "v") setTool("select");
        if (e.key === "h") setTool("hand");
      }
    };
    window.addEventListener("keydown", keydown, true);
    return () => window.removeEventListener("keydown", keydown, true);
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
  const renameMap = (name: string) => {
    if (readonly || !name.trim()) return;
    commit((p) => {
      p.maps.find((m) => m.id === map.id)!.name = name.trim();
      for (const m of p.maps)
        for (const n of m.nodes) if (n.mapId === map.id) n.name = name.trim();
      return p;
    });
  };
  const duplicateMap = () => {
    if (readonly || map.kind !== "area") return;
    let copiedId: string | undefined;
    commit((p) => {
      const source = p.maps
        .find((m) => m.id === world.id)!
        .nodes.find((n) => n.mapId === map.id) ?? {
        ...newNode("region", 200, 300),
        mapId: map.id,
        name: map.name,
      };
      copiedId = duplicateNode(
        p,
        world.id,
        source,
        source.x + 80,
        source.y + 80,
        0,
      ).mapId;
      return p;
    });
    if (copiedId) changeMap(copiedId);
    notify("二级地图已复制，可撤销恢复");
  };
  useEditorShortcuts({
    readonly,
    pickingNode,
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
    selectedIds,
    setSelected,
    selectedEdge,
    setSelectedEdge,
    three,
    tool,
    setTool,
    pending,
    setPending,
    modal,
    toast,
    notify,
    commit,
    history,
    saveState,
    changeMap,
    readonly,
    deleteMap,
    renameMap,
    duplicateMap,
    visibleNodes,
    layers,
    undo,
    redo,
    ...preview,
    ...viewport,
    ...actions,
    ...files,
    pickingNode,
    targetRequest,
    targetSession,
    requestTarget: (request: TargetRequest) => {
      setTargetSession((session) => session + 1);
      setTargetRequest(request);
    },
    closeTarget: () => setTargetRequest(null),
    startNodePick,
    finishNodePick,
    onNode: (id: string) => {
      if (didDrag.current || tool === "hand") return;
      if (pickingNode) {
        if (canPickNode(project, targetRequest, id)) {
          setSelected(id);
          setSelectedEdge(null);
        }
      } else preview.onNode(id);
    },
    setModal: (value: Modal) => {
      if (!pickingNode) setModal(value);
    },
    setThree: (value: boolean) => {
      if (!pickingNode) setThree(value);
    },
    togglePlay: () => {
      if (!pickingNode) preview.togglePlay();
    },
  };
}
export type EditorController = ReturnType<typeof useEditorController>;
