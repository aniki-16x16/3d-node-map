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
  three: boolean;
  tool: EditorTool;
  setProject: Setter<Project>;
  checkpoint: (original: Project) => void;
  setSelected: Setter<string | null>;
  setSelectedEdge: Setter<string | null>;
  didDrag: RefObject<boolean>;
}
type Gesture = { sx: number; sy: number; x: number; y: number } & (
  { kind: "pan" } | { kind: "node"; id: string; original: Project }
);
export function useCanvasInteraction({
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
}: Options) {
  const canvas = useRef<HTMLDivElement>(null),
    gesture = useRef<Gesture | null>(null);
  const [view, setView] = useState<ViewTransform>({ x: 70, y: 40, k: 0.85 }),
    [drag, setDrag] = useState(false);
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
    if (e.button !== 0 && e.button !== 1) return;
    if ((e.target as Element).closest("button")) return;
    if (id && readonly) {
      e.stopPropagation();
      return;
    }
    if (id && tool !== "hand" && !readonly) {
      e.stopPropagation();
      gesture.current = {
        kind: "node",
        id,
        sx: e.clientX,
        sy: e.clientY,
        x: map.nodes.find((n) => n.id === id)!.x,
        y: map.nodes.find((n) => n.id === id)!.y,
        original: structuredClone(project),
      };
    } else if (!id || tool === "hand" || e.button === 1) {
      if (!id) {
        setSelected(null);
        setSelectedEdge(null);
      }
      gesture.current = {
        kind: "pan",
        sx: e.clientX,
        sy: e.clientY,
        x: view.x,
        y: view.y,
      };
    } else return;
    didDrag.current = false;
    canvas.current!.setPointerCapture(e.pointerId);
    setDrag(true);
  };
  const pointerMove = (e: ReactPointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.sx,
      dy = e.clientY - g.sy;
    if (Math.hypot(dx, dy) > 3) didDrag.current = true;
    if (g.kind === "pan") setView((v) => ({ ...v, x: g.x + dx, y: g.y + dy }));
    else
      setProject((p) => ({
        ...p,
        maps: p.maps.map((m) =>
          m.id !== map.id
            ? m
            : {
                ...m,
                nodes: m.nodes.map((n) =>
                  n.id !== g.id
                    ? n
                    : {
                        ...n,
                        x: Math.round((g.x + dx / view.k) / 10) * 10,
                        y: Math.round((g.y + dy / view.k) / 10) * 10,
                      },
                ),
              },
        ),
      }));
  };
  const pointerUp = () => {
    const g = gesture.current;
    if (g?.kind === "node") {
      if (didDrag.current) checkpoint(g.original);
      else {
        setSelected(g.id);
        setSelectedEdge(null);
      }
    }
    gesture.current = null;
    setDrag(false);
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
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoom(Math.exp(-e.deltaY * 0.001), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", fn, { passive: false });
    return () => el.removeEventListener("wheel", fn);
  }, [three]);
  return {
    canvas,
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
