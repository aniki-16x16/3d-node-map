import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Copy, Trash2 } from "lucide-react";
import type { EditorController } from "../../hooks/useEditorController";
type Props = Pick<
  EditorController,
  "map" | "readonly" | "deleteMap" | "renameMap" | "duplicateMap"
>;
export default function MapActions({
  map,
  readonly,
  deleteMap,
  renameMap,
  duplicateMap,
}: Props) {
  const [open, setOpen] = useState(false),
    [editing, setEditing] = useState(false),
    [name, setName] = useState(map.name);
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!host.current?.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setEditing(false);
      }
    };
    window.addEventListener("pointerdown", close, true);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", close, true);
      window.removeEventListener("keydown", key);
    };
  }, []);
  if (readonly) return null;
  return (
    <div
      className="canvas-ui map-actions"
      ref={host}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        className="map-actions-toggle"
        aria-label="地图操作"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setEditing(false);
          setName(map.name);
        }}
      >
        <MoreHorizontal size={20} />
      </button>
      {open && (
        <div className="map-actions-menu">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) {
                  renameMap(name);
                  setOpen(false);
                  setEditing(false);
                }
              }}
            >
              <label htmlFor="map-name">地图名称</label>
              <input
                id="map-name"
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button type="submit">保存名称</button>
            </form>
          ) : (
            <>
              <button onClick={() => setEditing(true)}>
                <Pencil size={15} />
                重命名
              </button>
              {map.kind === "area" && (
                <>
                  <button
                    onClick={() => {
                      duplicateMap();
                      setOpen(false);
                    }}
                  >
                    <Copy size={15} />
                    复制地图
                  </button>
                  <button
                    className="danger"
                    onClick={() => {
                      deleteMap(map.id);
                      setOpen(false);
                    }}
                  >
                    <Trash2 size={15} />
                    删除地图<small>可撤销</small>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
