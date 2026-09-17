import { moveSelectedNodes, nodesInSelection } from "../domain/selection";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";

import type { AtlasMap, MapNode, Project } from "../domain/types";
import type { EditorTool, Setter, ViewTransform } from "./editorTypes";
interface Options {
  project: Project;
  map: AtlasMap;
  layer: number;
  visibleNodes: MapNode[];
  readonly: boolean;
  selectionOnly?: boolean;
  three: boolean;
  tool: EditorTool;
  setProject: Setter<Project>;
  checkpoint: (original: Project) => void;
  setSelected: Setter<string | null>;
  setSelectedEdge: Setter<string | null>;
  didDrag: RefObject<boolean>;
  selectedIds: string[];
  selectNodes: (ids: string[]) => void;
}
type Gesture = {
  sx: number;
  sy: number;
  x: number;
  y: number;
  pointerId: number;
} & (
  | { kind: "pan" }
  | {
      kind: "node";
      id: string;
      base: string[];
      original: Project;
      origins: Pick<MapNode, "id" | "x" | "y">[];
    }
  | {
      kind: "select";
      id?: string;
      edgeId?: string;
      base: string[];
      additive: boolean;
    }
);
export function useCanvasInteraction({
  project,
  map,
  setProject,
  checkpoint,
  layer,
  visibleNodes,
  readonly,
  selectionOnly = false,
  three,
  tool,
  setSelected,
  setSelectedEdge,
  didDrag,
  selectedIds,
  selectNodes,
}: Options) {
  const canvas = useRef<HTMLDivElement>(null),
    gesture = useRef<Gesture | null>(null);
  const [view, setView] = useState<ViewTransform>({ x: 70, y: 40, k: 0.85 }),
    [drag, setDrag] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [temporaryHand, setTemporaryHand] = useState(false);
  const fit = () => {
    const nodes = visibleNodes.filter((n) => n.z === layer);
    if (!nodes.length) {
      setView({ x: 80, y: 60, k: 1 });
      return;
    }
    const r = canvas.current!.getBoundingClientRect(),
      minX = Math.min(...nodes.map((n) => n.x)) - 100,
      maxX = Math.max(...nodes.map((n) => n.x)) + 100,
      minY = Math.min(...nodes.map((n) => n.y)) - 110,
      maxY = Math.max(...nodes.map((n) => n.y)) + 110,
      k = Math.min(
        1.4,
        (r.width - 100) / (maxX - minX),
        (r.height - 130) / (maxY - minY),
      );
    setView({
      k,
      x: (r.width - (maxX - minX) * k) / 2 - minX * k,
      y: (r.height - (maxY - minY) * k) / 2 - minY * k,
    });
  };
  const pointerDown = (e: ReactPointerEvent, id?: string) => {
    if (gesture.current || (e.button !== 0 && e.button !== 1)) return;
    if (
      (e.target as Element).closest(
        "button, input, select, textarea, .canvas-ui, .drawer, .inspector-host",
      )
    )
      return;
    const pan = tool === "hand" || e.button === 1;
    if (!pan && readonly && !selectionOnly) return;
    if (
      !pan &&
      !selectionOnly &&
      !e.ctrlKey &&
      selectedIds.length < 2 &&
      (e.target as Element).closest(".port")
    )
      return;
    if (
      !pan &&
      !selectionOnly &&
      !e.ctrlKey &&
      selectedIds.length < 2 &&
      (e.target as Element).closest(".cross-layer > g")
    )
      return;
    e.preventDefault();
    e.stopPropagation();
    const r = canvas.current!.getBoundingClientRect();
    const start = { sx: e.clientX, sy: e.clientY, pointerId: e.pointerId };
    const node = id ? map.nodes.find((node) => node.id === id) : undefined;
    gesture.current = pan
      ? { ...start, kind: "pan", x: view.x, y: view.y }
      : node && !selectionOnly
        ? {
            ...start,
            kind: "node",
            id: node.id,
            x: node.x,
            y: node.y,
            base: e.ctrlKey ? selectedIds : selectionOnly ? selectedIds.filter((id) => !visibleNodes.some((n) => n.id === id && n.z === layer)) : [],
            original: structuredClone(project),
            origins: map.nodes
              .filter((n) =>
                selectedIds.includes(node.id)
                  ? selectedIds.includes(n.id)
                  : n.id === node.id,
              )
              .map(({ id, x, y }) => ({ id, x, y })),
          }
        : {
            ...start,
            kind: "select",
            id,
            edgeId:
              (e.target as Element)
                .closest("[data-edge-id]")
                ?.getAttribute("data-edge-id") ?? undefined,
            additive: e.ctrlKey,
            base: e.ctrlKey ? selectedIds : selectionOnly ? selectedIds.filter((id) => !visibleNodes.some((n) => n.id === id && n.z === layer)) : [],
            x: e.clientX - r.left,
            y: e.clientY - r.top,
          };
    didDrag.current = false;
    canvas.current!.setPointerCapture(e.pointerId);
    setTemporaryHand(e.button === 1);
    setDrag(pan);
  };
  const pointerMove = (e: ReactPointerEvent) => {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    const dx = e.clientX - g.sx,
      dy = e.clientY - g.sy;
    if (Math.hypot(dx, dy) > 3) didDrag.current = true;
    if (g.kind === "pan") setView((v) => ({ ...v, x: g.x + dx, y: g.y + dy }));
    else if (g.kind === "node") {
      if (!didDrag.current) return;
      setDrag(true);
      setProject((p) => ({
        ...p,
        maps: p.maps.map((m) =>
          m.id !== map.id
            ? m
            : {
                ...m,
                nodes: moveSelectedNodes(
                  m.nodes,
                  g.origins,
                  g,
                  dx / view.k,
                  dy / view.k,
                ),
              },
        ),
      }));
    } else if (didDrag.current) {
      const box = {
        x: Math.min(g.x, g.x + dx),
        y: Math.min(g.y, g.y + dy),
        width: Math.abs(dx),
        height: Math.abs(dy),
      };
      setSelectionBox(box);
      const ids = nodesInSelection(visibleNodes, layer, view, box);
      selectNodes([...new Set([...g.base, ...ids])]);
    }
  };
  const pointerUp = (e: ReactPointerEvent) => {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    if (g.kind === "node") {
      if (didDrag.current) checkpoint(g.original);
      else if (e.type === "pointerup")
        selectNodes([...new Set([...g.base, g.id])]);
    }
    if (g.kind === "select" && !didDrag.current && e.type === "pointerup") {
      if (g.id) selectNodes([...new Set([...g.base, g.id])]);
      else if (g.edgeId) {
        if (!selectionOnly && !g.additive && selectedIds.length < 2) {
          setSelected(null);
          setSelectedEdge(g.edgeId);
        }
      } else if (selectionOnly) {
        selectNodes(g.base);
      } else if (!g.base.length) {
        setSelected(null);
        setSelectedEdge(null);
      }
    }
    didDrag.current = true;
    gesture.current = null;
    if (canvas.current?.hasPointerCapture(g.pointerId))
      canvas.current.releasePointerCapture(g.pointerId);
    setDrag(false);
    setTemporaryHand(false);
    setSelectionBox(null);
    setTimeout(() => {
      didDrag.current = false;
    }, 0);
  };
  const zoom = (factor: number, x?: number, y?: number) =>
    setView((v) => {
      const r = canvas.current!.getBoundingClientRect(),
        px = x ?? r.width / 2,
        py = y ?? r.height / 2,
        k = Math.max(0.2, Math.min(2.5, v.k * factor));
      return {
        x: px - ((px - v.x) * k) / v.k,
        y: py - ((py - v.y) * k) / v.k,
        k,
      };
    });
  useEffect(() => {
    const el = canvas.current!;
    const fn = (e: WheelEvent) => {
      if (three) return;
      if (
        e.altKey ||
        (e.target as Element).closest(
          ".canvas-ui, .drawer, input, select, button",
        )
      )
        return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoom(Math.exp(-e.deltaY * 0.001), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", fn, { passive: false });
    return () => el.removeEventListener("wheel", fn);
  }, [three]);
  return {
    canvas,
    selectionBox,
    temporaryHand,
    view,
    setView,
    drag,
    fit,
    pointerDown,
    pointerMove,
    pointerUp,
    zoom,
  };
}
