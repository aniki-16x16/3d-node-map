import type { EditorController } from "../../hooks/useEditorController";
import Select from "../ui/Select";
type Props = Pick<EditorController, "layer" | "setLayer" | "layers"> & {
  referenceLayer: number | null;
  setReferenceLayer: (layer: number | null) => void;
};
const floorName = (z: number) => `Z ${z > 0 ? "+" : ""}${z}`;
export default function LayerControl({
  layer,
  setLayer,
  layers,
  referenceLayer,
  setReferenceLayer,
}: Props) {
  return (
    <div
      className="floor-controls canvas-ui"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Select
        aria-label="当前楼层"
        size="lg"
        textOnly
        align="right"
        className="floor-current"
        value={layer}
        displayValue={floorName(layer)}
        onChange={(e) => setLayer(Number(e.target.value))}
      >
        {layers.map((z) => (
          <option key={z} value={z}>
            {floorName(z)}
          </option>
        ))}
      </Select>
      <Select
        aria-label="参考层"
        size="lg"
        textOnly
        align="right"
        className={`floor-reference ${referenceLayer === null ? "off" : ""}`}
        value={referenceLayer ?? "off"}
        displayValue={
          referenceLayer === null
            ? "参考层"
            : referenceLayer === layer
              ? "当前层"
              : `参考 ${floorName(referenceLayer)}`
        }
        onChange={(e) =>
          setReferenceLayer(
            e.target.value === "off" ? null : Number(e.target.value),
          )
        }
      >
        <option value="off">关闭参考层</option>
        {layers.map((z) => (
          <option key={z} value={z}>
            {floorName(z)}
            {z === layer ? " · 当前层" : ""}
          </option>
        ))}
      </Select>
    </div>
  );
}
