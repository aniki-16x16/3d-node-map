import { canPickNode } from "../../domain/nodePicking";
import { Check, MousePointer2, X } from "lucide-react";
import type { EditorController } from "../../hooks/useEditorController";
import Button from "../ui/Button";
type Props = Pick<
  EditorController,
  | "project"
  | "targetRequest"
  | "pickingNode"
  | "node"
  | "layer"
  | "view"
  | "finishNodePick"
>;
export default function NodePickOverlay({
  project,
  targetRequest,
  pickingNode,
  node,
  layer,
  view,
  finishNodePick,
}: Props) {
  if (!pickingNode) return null;
  return (
    <>
      <div className="node-pick-banner canvas-ui" role="status">
        <MousePointer2 size={17} />
        <span>
          {targetRequest?.type === "exit-target"
            ? "请选择区域入口或世界城镇 · 点击勾确认"
            : "请选择条件目标节点 · 点击勾确认"}
        </span>
        <Button title="取消拾取节点" onClick={() => finishNodePick()}>
          <X size={15} />
          取消
        </Button>
      </div>
      {node &&
        node.z === layer &&
        canPickNode(project, targetRequest, node.id) && (
          <div
            className="node-pick-confirm canvas-ui"
            style={{
              left: view.x + node.x * view.k,
              top: view.y + node.y * view.k - 34 * view.k - 10,
            }}
          >
            <Button
              title={`确认选择节点：${node.name}`}
              className="node-pick-confirm-button"
              onClick={() => finishNodePick(node.id)}
            >
              <Check size={24} strokeWidth={3} />
            </Button>
          </div>
        )}
    </>
  );
}
