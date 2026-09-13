import { Box, ChevronRight, Globe2, Layers3 } from "lucide-react";
import type { EditorController } from "../../hooks/useEditorController";
import Button from "../ui/Button";
type Props = Pick<
  EditorController,
  | "three"
  | "setThree"
  | "playing"
  | "setPending"
  | "world"
  | "map"
  | "changeMap"
>;
export default function ViewSwitcher({
  three,
  setThree,
  playing,
  setPending,
  world,
  map,
  changeMap,
}: Props) {
  return (
    <div className="canvas-header">
      <div className="breadcrumb">
        <Globe2 size={15} />
        <button onClick={() => changeMap(world.id)}>世界地图</button>
        {map.kind === "area" && (
          <>
            <ChevronRight size={13} />
            <strong>{map.name}</strong>
          </>
        )}
        <span className="mode-tag">{playing ? "游玩预览" : "编辑模式"}</span>
      </div>
      <div className="view-toggle">
        <Button
          active={!three}
          title="平面视图"
          onClick={() => setThree(false)}
        >
          <Layers3 size={15} />
          2D 平面
        </Button>
        <Button
          active={three}
          title="3D 预览"
          onClick={() => {
            setThree(true);
            setPending(null);
          }}
        >
          <Box size={15} />
          3D 预览
        </Button>
      </div>
    </div>
  );
}
