import { useEffect, useRef, useState } from "react";
import { Copy, Trash2, X } from "lucide-react";
import { TYPES } from "../../domain";
import type { NodeType, Point } from "../../domain/types";
import type { EditorController } from "../../hooks/useEditorController";
import { ICONS, colors } from "../nodeAppearance";

type Props = Pick<
  EditorController,
  | "canvas"
  | "map"
  | "view"
  | "readonly"
  | "three"
  | "modal"
  | "layer"
  | "setLayer"
  | "node"
  | "setSelected"
  | "setSelectedEdge"
  | "addNode"
  | "duplicate"
  | "deleteSelection"
  | "updateNode"
  | "notify"
>;
type Menu = { x: number; y: number; position: Point; nodeId?: string };
export default function CanvasActions({
  canvas,
  map,
  view,
  readonly,
  three,
  modal,
  layer,
  setLayer,
  node,
  setSelected,
  setSelectedEdge,
  addNode,
  duplicate,
  deleteSelection,
  updateNode,
  notify,
}: Props) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [targetLayer, setTargetLayer] = useState(String(layer));
  useEffect(() => {
    setMenu(null);
  }, [layer]);
  const pointer = useRef<Point | null>(null);
  const wheelTime = useRef(0);
  const usedAltWheel = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const types: NodeType[] =
    map.kind === "world"
      ? ["town", "region"]
      : ["battle", "shop", "rest", "checkpoint", "chest", "entrance", "exit"];
  const moveNode = (z: number) => {
    if (readonly || !node || map.kind !== "area" || !Number.isSafeInteger(z))
      return;
    if (node.z !== z) updateNode({ z });
    setLayer(z);
    setMenu(null);
    notify(`节点已移动到 Z ${z}，可撤销`);
  };
  const create = (type: NodeType) => {
    const p =
      menu?.position ??
      (pointer.current && {
        x: (pointer.current.x - view.x) / view.k,
        y: (pointer.current.y - view.y) / view.k,
      });
    if (!p) return;
    addNode(type, p);
    setMenu(null);
  };
  useEffect(() => {
    if (menu)
      menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [menu]);
  useEffect(() => {
    const el = canvas.current!;
    const blocked = (target: EventTarget | null) =>
      (target as Element)?.closest(
        ".canvas-ui, .drawer, button, input, select, textarea",
      );
    const track = (e: PointerEvent) => {
      if (blocked(e.target)) {
        pointer.current = null;
        return;
      }
      const r = el.getBoundingClientRect();
      pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const leave = () => {
      pointer.current = null;
    };
    const context = (e: MouseEvent) => {
      if (readonly || modal || blocked(e.target)) return;
      e.preventDefault();
      const id =
        (e.target as Element)
          .closest("[data-node-id]")
          ?.getAttribute("data-node-id") ?? undefined;
      const r = el.getBoundingClientRect();
      setSelected(id ?? null);
      setSelectedEdge(null);
      setTargetLayer(String(layer));
      const width = id ? 240 : 330,
        height = id ? 230 : 330;
      setMenu({
        x: Math.max(
          8,
          Math.min(
            e.clientX - (id ? 0 : width / 2),
            window.innerWidth - width - 8,
          ),
        ),
        y: Math.max(
          8,
          Math.min(
            e.clientY - (id ? 0 : height / 2),
            window.innerHeight - height - 8,
          ),
        ),
        position: {
          x: (e.clientX - r.left - view.x) / view.k,
          y: (e.clientY - r.top - view.y) / view.k,
        },
        nodeId: id,
      });
    };
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(null);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Alt" && pointer.current && !three && !modal) {
        e.preventDefault();
      }
      if (e.key === "Escape" && menu) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setMenu(null);
        return;
      }
      if (
        modal ||
        e.isComposing ||
        (e.target as HTMLElement).closest(
          'input, textarea, select, [contenteditable="true"], [role="dialog"]',
        )
      )
        return;
      if (e.ctrlKey || e.metaKey || three) return;
      if (e.key === "PageUp" || e.key === "PageDown") {
        if (map.kind !== "area") return;
        e.preventDefault();
        const delta = e.key === "PageUp" ? 1 : -1;
        if (e.shiftKey) moveNode((node?.z ?? layer) + delta);
        else {
          setLayer(layer + delta);
          setMenu(null);
        }
        return;
      }
      if (
        e.altKey ||
        readonly ||
        e.shiftKey ||
        e.repeat ||
        menu?.nodeId ||
        (!menu && !pointer.current)
      )
        return;
      const type = types[Number(e.key) - 1];
      if (/^[1-9]$/.test(e.key) && type) {
        e.preventDefault();
        create(type);
      }
    };
    const wheel = (e: WheelEvent) => {
      if (!e.altKey || three || modal || blocked(e.target)) return;
      e.preventDefault();
      if (map.kind !== "area" || !e.deltaY) return;
      usedAltWheel.current = true;
      el.focus({ preventScroll: true });
      const now = performance.now();
      if (now - wheelTime.current < 160) return;
      wheelTime.current = now;
      setLayer(layer + (e.deltaY < 0 ? 1 : -1));
      setMenu(null);
    };
    const keyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt" && usedAltWheel.current) {
        e.preventDefault();
        usedAltWheel.current = false;
        el.focus({ preventScroll: true });
      }
    };
    el.addEventListener("pointermove", track);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("contextmenu", context);
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("pointerdown", close, true);
    window.addEventListener("keydown", key, true);
    window.addEventListener("keyup", keyUp, true);
    return () => {
      el.removeEventListener("pointermove", track);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("contextmenu", context);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("pointerdown", close, true);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("keyup", keyUp, true);
    };
  });
  if (!menu || readonly || modal) return null;
  return (
    <div
      ref={menuRef}
      className={`canvas-ui canvas-context ${menu.nodeId ? "node-context" : "node-wheel"}`}
      style={{ left: menu.x, top: menu.y }}
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      onWheel={(e) => e.stopPropagation()}
      aria-label={menu.nodeId ? "节点操作" : "创建节点"}
    >
      {menu.nodeId ? (
        <>
          <div className="context-heading">
            {node?.name}
            <button aria-label="关闭节点菜单" onClick={() => setMenu(null)}>
              <X size={14} />
            </button>
          </div>
          <button
            onClick={() => {
              duplicate();
              setMenu(null);
            }}
          >
            <Copy size={15} />
            复制节点
          </button>
          {map.kind === "area" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (targetLayer.trim()) moveNode(Number(targetLayer));
              }}
            >
              <label htmlFor="move-node-layer">移动到楼层</label>
              <div>
                <span>Z</span>
                <input
                  id="move-node-layer"
                  type="number"
                  step="1"
                  required
                  value={targetLayer}
                  onChange={(e) => setTargetLayer(e.target.value)}
                />
                <button type="submit">移动</button>
              </div>
              <small>Shift + PageUp / PageDown 快速移层</small>
            </form>
          )}
          <button
            className="danger"
            onClick={() => {
              deleteSelection();
              setMenu(null);
            }}
          >
            <Trash2 size={15} />
            删除节点
          </button>
        </>
      ) : (
        <>
          <div className="wheel-center">
            <strong>创建节点</strong>
            <small>数字键快速创建</small>
            <button onClick={() => setMenu(null)} aria-label="关闭创建轮盘">
              <X size={16} />
            </button>
          </div>
          {types.map((type, i) => {
            const angle = (i / types.length) * Math.PI * 2 - Math.PI / 2;
            const Icon = ICONS[type];
            return (
              <button
                key={type}
                className="wheel-item"
                style={{
                  left: 165 + Math.cos(angle) * 112,
                  top: 165 + Math.sin(angle) * 112,
                }}
                onClick={() => create(type)}
                title={`${i + 1} · ${TYPES[type]}`}
              >
                <Icon size={21} color={colors[type]} />
                <span>{TYPES[type]}</span>
                <kbd>{i + 1}</kbd>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
