import { useEffect, useState } from "react";
import { duplicateNode } from "../domain/project";
import type { AtlasMap, MapNode } from "../domain/types";
import type {
  Commit,
  EditorTool,
  Modal,
  Notify,
  PendingConnection,
  Setter,
} from "./editorTypes";
interface Options {
  readonly: boolean;
  node: MapNode | undefined;
  map: AtlasMap;
  layer: number;
  undo: () => void;
  redo: () => void;
  deleteSelection: () => void;
  commit: Commit;
  notify: Notify;
  setPending: Setter<PendingConnection | null>;
  setSelected: Setter<string | null>;
  setSelectedEdge: Setter<string | null>;
  setModal: Setter<Modal>;
  setTool: Setter<EditorTool>;
}
export function useEditorShortcuts({
  readonly,
  node,
  map,
  layer,
  undo,
  redo,
  deleteSelection,
  commit,
  notify,
  setPending,
  setSelected,
  setSelectedEdge,
  setModal,
  setTool,
}: Options) {
  const [clipboard, setClipboard] = useState<MapNode | null>(null);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (
        e.defaultPrevented ||
        (e.target as HTMLElement).closest(
          '[contenteditable="true"], .canvas-ui, [role="dialog"]',
        )
      )
        return;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      )
        return;
      if (e.key === "Escape") {
        setPending(null);
        setSelected(null);
        setSelectedEdge(null);
        setModal(null);
      }
      if (readonly) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelection();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && node) {
        setClipboard(structuredClone(node));
        notify("节点已复制");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && clipboard) {
        e.preventDefault();
        if (
          !(
            map.kind === "world"
              ? ["town", "region"]
              : [
                  "battle",
                  "shop",
                  "rest",
                  "checkpoint",
                  "chest",
                  "entrance",
                  "exit",
                  "structure",
                ]
          ).includes(clipboard.type)
        ) {
          notify("该节点类型不适用于当前地图");
          return;
        }
        let copied: MapNode | undefined;
        commit((p) => {
          copied = duplicateNode(
            p,
            map.id,
            clipboard,
            clipboard.x + 80,
            clipboard.y + 80,
            layer,
          );
          return p;
        });
        if (copied) setSelected(copied.id);
      }
      if (e.key === "v") setTool("select");
      if (e.key === "h") setTool("hand");
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });
}
