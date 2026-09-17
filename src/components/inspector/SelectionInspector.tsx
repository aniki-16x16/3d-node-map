import Select from "../ui/Select";
import { Check, MapPin, Settings2, Trash2 } from "lucide-react";
import React from "react";
import { TYPES } from "../../domain";
import type { EditorController } from "../../hooks/useEditorController";
import { nodeIcon, nodeColor } from "../nodeAppearance";
import Button from "../ui/Button";
import Drawer from "../ui/Drawer";
import NodeSettings from "./NodeSettings";
type Props = Pick<
  EditorController,
  | "commit"
  | "project"
  | "setLayer"
  | "setSelected"
  | "setSelectedEdge"
  | "playing"
  | "setModal"
  | "world"
  | "map"
  | "node"
  | "edge"
  | "readonly"
  | "activeProgress"
  | "changeMap"
  | "updateMap"
  | "updateNode"
  | "deleteSelection"
  | "duplicate"
  | "onNode"
  | "status"
>;
export default function SelectionInspector({
  commit,
  project,
  setLayer,
  setSelected,
  setSelectedEdge,
  playing,
  setModal,
  world,
  map,
  node,
  edge,
  readonly,
  activeProgress,
  changeMap,
  updateMap,
  updateNode,
  deleteSelection,
  duplicate,
  onNode,
  status,
}: Props) {
  return (
    <Drawer
      open={!!(node || edge)}
      title={
        <>
          <Settings2 size={16} />
          {readonly ? "节点详情" : "参数配置"}
        </>
      }
      closeLabel="关闭参数"
      onClose={() => {
        setSelected(null);
        setSelectedEdge(null);
      }}
    >
      {node ? (
        <>
          <div className="node-heading">
            <span style={{ color: nodeColor(node) }}>
              {React.createElement(nodeIcon(node), { size: 26 })}
            </span>
            <div>
              <h3>{node.name}</h3>
              <small>
                {TYPES[node.type]} ·{" "}
                {map.kind === "world" ? "世界节点" : `Z ${node.z}`}
              </small>
            </div>
          </div>
          {playing ? (
            <div className="drawer-section">
              <label>探索状态</label>
              <div className="status-grid">
                {(
                  [
                    ["发现", "discovered"],
                    ["解锁", "unlocked"],
                    ["到达", "reached"],
                    ["完成", "completed"],
                  ] as const
                ).map(([title, key]) => (
                  <span
                    key={key}
                    className={
                      activeProgress[key].includes(node.id) ? "yes" : ""
                    }
                  >
                    <Check size={13} />
                    {title}
                  </span>
                ))}
              </div>
              <p className="muted small">{status(node)}</p>
              <Button
                className="primary wide"
                disabled={!activeProgress.unlocked.includes(node.id)}
                title="到达此节点"
                onClick={() => onNode(node.id)}
              >
                <MapPin size={15} />
                到达此节点
              </Button>
            </div>
          ) : (
            <NodeSettings
              {...{
                commit,
                project,
                setLayer,
                setModal,
                world,
                map,
                node,
                readonly,
                changeMap,
                updateMap,
                updateNode,
                deleteSelection,
                duplicate,
              }}
            />
          )}
        </>
      ) : (
        edge && (
          <div className="drawer-section">
            <h3>连线设置</h3>
            <p>
              {map.nodes.find((n) => n.id === edge.a)?.name} →{" "}
              {map.nodes.find((n) => n.id === edge.b)?.name}
            </p>
            {edge.generated ? (
              <p className="muted">
                由二级地图出口自动生成，请到对应出口修改目标。
              </p>
            ) : (
              <>
                <label>通行方向</label>
                <Select
                  aria-label="通行方向"
                  disabled={readonly}
                  value={String(edge.directed)}
                  onChange={(e) =>
                    updateMap(
                      (m) =>
                        (m.edges.find((x) => x.id === edge.id)!.directed =
                          e.target.value === "true"),
                    )
                  }
                >
                  <option value="false">双向通行</option>
                  <option value="true">单向：起点 → 终点</option>
                </Select>
                <Button
                  disabled={readonly}
                  className="danger wide"
                  title="删除连线"
                  onClick={deleteSelection}
                >
                  <Trash2 size={15} />
                  删除连线
                </Button>
              </>
            )}
          </div>
        )
      )}
    </Drawer>
  );
}
