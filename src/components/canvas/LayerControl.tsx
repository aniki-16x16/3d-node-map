import { Layers3, Minus, Plus } from "lucide-react";
import type { EditorController } from "../../hooks/useEditorController";
import Button from "../ui/Button";
type Props = Pick<EditorController, "layer" | "setLayer" | "layers">;
export default function LayerControl({ layer, setLayer, layers }: Props) {
  return (
    <div className="layer-control">
      <div>
        <Layers3 size={15} />
        <span>楼层</span>
      </div>
      <Button
        title="进入上一层（PageUp / Alt + 滚轮向上）"
        onClick={() => setLayer(layer + 1)}
      >
        <Plus size={15} />
      </Button>
      <select
        aria-label="当前楼层"
        value={layer}
        onChange={(e) => setLayer(Number(e.target.value))}
      >
        {layers.map((z) => (
          <option key={z} value={z}>
            Z {z > 0 ? "+" : ""}
            {z}
          </option>
        ))}
      </select>
      <Button
        title="进入下一层（PageDown / Alt + 滚轮向下）"
        onClick={() => setLayer(layer - 1)}
      >
        <Minus size={15} />
      </Button>
      <input
        aria-label="跳转楼层"
        title="输入任意整数层"
        type="number"
        value={layer}
        onChange={(e) => {
          const z = Number(e.target.value);
          if (Number.isInteger(z)) setLayer(z);
        }}
      />
    </div>
  );
}
