import { Plus } from "lucide-react";
import { TYPES } from "../../domain";
import type { NodeType } from "../../domain/types";
import type { EditorController } from "../../hooks/useEditorController";
import { ICONS, colors } from "../nodeAppearance";
type Props = Pick<EditorController, "three" | "map" | "addNode">;
export default function NodePalette({ three, map, addNode }: Props) {
  return (
    <>
      <div className="palette">
        {(
          (map.kind === "world"
            ? ["town", "region"]
            : [
                "battle",
                "shop",
                "rest",
                "checkpoint",
                "chest",
                "entrance",
                "exit",
              ]) as NodeType[]
        ).map((type) => {
          const Icon = ICONS[type];
          return (
            <button key={type} disabled={three} onClick={() => addNode(type)}>
              <Icon size={19} style={{ color: colors[type] }} />
              <span>{TYPES[type]}</span>
              <Plus size={12} />
            </button>
          );
        })}
      </div>
      <p className="sidebar-hint">
        悬停节点显示吸附点
        <br />
        点击两个吸附点创建连线
      </p>
    </>
  );
}
