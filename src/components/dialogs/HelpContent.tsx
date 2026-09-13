import type { EditorController } from "../../hooks/useEditorController";
type Props = Pick<EditorController, never>;
export default function HelpContent({}: Props) {
  return (
    <div className="help">
      <p>
        <b>创建与布局</b>
        点击左侧类型添加节点，拖动节点调整位置。悬停后点击吸附点，再点击目标吸附点完成连接。
      </p>
      <p>
        <b>跨层连接</b>
        选中起始吸附点后切换楼层，点击另一节点吸附点。点击路线上的楼层标记可以跳转。
      </p>
      <p>
        <b>键盘</b>V 选择 · H 平移 · Delete 删除 · Ctrl+C / V 复制粘贴 · Ctrl+Z
        撤销 · Ctrl+Shift+Z 重做 · Esc 取消。
      </p>
      <p>
        <b>游玩预览</b>
        从任意开放起点进入，到达即完成。已完成节点可以直接返回。区域出口自动跳转，侧栏可随时返回世界地图。
      </p>
      <p>
        <b>3D 视图</b>
        左键旋转、滚轮缩放、右键平移。编辑模式只读；游玩模式可点击开放节点继续探索。
      </p>
      <p>
        <b>启动与保存</b>
        每次打开为空白项目。编辑后自动保存到当前浏览器，可在项目设置中恢复本机草稿或单独加载示例地图。使用
        JSON 导出备份，导入可撤销。预览进度仅用于当前会话。
      </p>
    </div>
  );
}
