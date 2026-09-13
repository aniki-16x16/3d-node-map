import { Minus, Plus, Scan } from "lucide-react";
import type { EditorController } from "../../hooks/useEditorController";
import Button from "../ui/Button";
type Props = Pick<EditorController, "view" | "fit" | "zoom">;
export default function ZoomControl({ view, fit, zoom }: Props) {
  return (
    <div className="zoom-control">
      <Button title="缩小" onClick={() => zoom(0.85)}>
        <Minus size={16} />
      </Button>
      <span>{Math.round(view.k * 100)}%</span>
      <Button title="放大" onClick={() => zoom(1.18)}>
        <Plus size={16} />
      </Button>
      <i />
      <Button title="适应画布" onClick={fit}>
        <Scan size={17} />
      </Button>
    </div>
  );
}
