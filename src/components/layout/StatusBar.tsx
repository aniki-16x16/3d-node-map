import type { EditorController } from "../../hooks/useEditorController";
type Props = Pick<EditorController, "three" | "playing" | "map" | "edges">;
export default function StatusBar({ three, playing, map, edges }: Props) {
  return (
    <footer>
      <span>
        <span className="online-dot" />
        {playing ? "预览会话" : "本地工作区"}
      </span>
      <span className="status-shortcuts">
        {three
          ? "拖动旋转 · 滚轮缩放 · 右键平移"
          : playing
            ? "点击节点探索 · PgUp / PgDn 换层"
            : map.kind === "world"
              ? "右键创建 · 拖动布局 · 滚轮缩放"
              : "右键创建 · PgUp / PgDn 换层 · Alt + 滚轮"}
      </span>
      <span className="status-info">
        {map.nodes.length} 个节点 <i /> {edges.length} 条连线 <i />{" "}
        {map.kind === "world"
          ? "单层世界地图"
          : `${new Set(map.nodes.map((n) => n.z)).size} 个使用中的楼层`}
      </span>
    </footer>
  );
}
