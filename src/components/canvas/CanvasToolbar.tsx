import { Hand, MousePointer2, Redo2, Undo2 } from "lucide-react";
import type { EditorController } from "../../hooks/useEditorController";
import Button from "../ui/Button";
type Props = Pick<
  EditorController,
  "tool" | "setTool" | "history" | "readonly" | "undo" | "redo"
>;
export default function CanvasToolbar({
  tool,
  setTool,
  history,
  readonly,
  undo,
  redo,
}: Props) {
  return (
    <div className="toolbar">
      <Button
        active={tool === "select"}
        title="选择工具 (V)"
        onClick={() => setTool("select")}
      >
        <MousePointer2 size={18} />
      </Button>
      <Button
        active={tool === "hand"}
        title="拖拽画布 (H)"
        onClick={() => setTool("hand")}
      >
        <Hand size={18} />
      </Button>
      <span />
      <Button
        title="撤销 (Ctrl+Z)"
        disabled={readonly || !history.past.length}
        onClick={undo}
      >
        <Undo2 size={17} />
      </Button>
      <Button
        title="重做 (Ctrl+Shift+Z)"
        disabled={readonly || !history.future.length}
        onClick={redo}
      >
        <Redo2 size={17} />
      </Button>
    </div>
  );
}
