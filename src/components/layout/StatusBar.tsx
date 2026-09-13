import type { EditorController } from "../../hooks/useEditorController";
type Props = Pick<EditorController, "three" | "playing" | "map" | "edges">;
export default function StatusBar({ three, playing, map, edges }: Props) {
  return (
    <footer>
      <span>
        <span className="online-dot" />
        {playing ? "预览会话" : "本地工作区"}
      </span>
      <span>
        {map.nodes.length} 个节点 <i /> {edges.length} 条连线 <i />{" "}
        {map.kind === "world"
          ? "单层世界地图"
          : `${new Set(map.nodes.map((n) => n.z)).size} 个使用中的楼层`}
      </span>
      <span>{three ? "3D · 只读" : playing ? "PREVIEW" : "2D · EDITOR"}</span>
    </footer>
  );
}
