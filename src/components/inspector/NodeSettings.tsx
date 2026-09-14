import Select from "../ui/Select";
import {
  ArrowUpRight,
  Copy,
  EyeOff,
  KeyRound,
  Layers3,
  LockKeyhole,
  Trash2,
} from "lucide-react";
import { TYPES } from "../../domain";
import type { EditorController } from "../../hooks/useEditorController";
import Button from "../ui/Button";
import ConditionEditor from "./ConditionEditor";
type Props = Pick<
  EditorController,
  | "project"
  | "setLayer"
  | "setModal"
  | "world"
  | "map"
  | "node"
  | "readonly"
  | "changeMap"
  | "updateMap"
  | "updateNode"
  | "deleteSelection"
  | "duplicate"
>;
export default function NodeSettings({
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
}: Props) {
  if (!node) return null;
  return (
    <>
      <fieldset disabled={readonly}>
        <div className="drawer-section">
          <label>节点名称</label>
          <input
            value={node.name}
            onChange={(e) => updateNode({ name: e.target.value })}
          />
          <div className="field-row">
            <div>
              <label>节点类型</label>
              <div className="static-field">{TYPES[node.type]}</div>
            </div>
            <div>
              <label>所在楼层</label>
              <input
                type="number"
                disabled={map.kind === "world"}
                value={node.z}
                onChange={(e) => {
                  const z = Number(e.target.value);
                  if (Number.isInteger(z)) {
                    updateNode({ z });
                    setLayer(z);
                  }
                }}
              />
            </div>
          </div>
          {map.kind === "world" && (
            <label className="check-label">
              <input
                type="checkbox"
                checked={node.start}
                onChange={(e) => updateNode({ start: e.target.checked })}
              />
              设为起始节点
            </label>
          )}
          {node.type === "entrance" && (
            <label className="check-label">
              <input
                type="checkbox"
                checked={map.defaultEntry === node.id}
                onChange={(e) =>
                  updateMap(
                    (m) =>
                      (m.defaultEntry = e.target.checked ? node.id : undefined),
                  )
                }
              />
              作为区域默认入口
            </label>
          )}
        </div>
      </fieldset>
      {node.type === "region" && (
        <div className="drawer-section">
          <label>关联的二级地图</label>
          <div className="linked-map">
            <Layers3 size={16} />
            <span>
              {project.maps.find((m) => m.id === node.mapId)?.name || "未关联"}
            </span>
            <Button
              title="进入二级地图"
              onClick={() => {
                if (node.mapId) changeMap(node.mapId);
              }}
            >
              <ArrowUpRight size={16} />
            </Button>
          </div>
        </div>
      )}
      <fieldset disabled={readonly}>
        {node.type === "exit" && (
          <div className="drawer-section">
            <label>出口目标 · 世界节点</label>
            <Select
              aria-label="出口目标"
              value={node.target || ""}
              onChange={(e) =>
                updateNode({
                  target: e.target.value,
                  targetEntry: "",
                })
              }
            >
              <option value="">选择目标…</option>
              {world.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} · {TYPES[n.type]}
                </option>
              ))}
            </Select>
            {world.nodes.find((n) => n.id === node.target)?.type ===
              "region" && (
              <>
                <label>目标入口</label>
                <Select
                  aria-label="目标入口"
                  value={node.targetEntry || ""}
                  onChange={(e) =>
                    updateNode({
                      targetEntry: e.target.value,
                    })
                  }
                >
                  <option value="">选择入口…</option>
                  {project.maps
                    .find(
                      (m) =>
                        m.id ===
                        world.nodes.find((n) => n.id === node.target)?.mapId,
                    )
                    ?.nodes.filter((n) => n.type === "entrance")
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                </Select>
              </>
            )}
            <p className="muted small">对应世界路线自动生成。</p>
          </div>
        )}
        {["battle", "chest"].includes(node.type) && (
          <div className="drawer-section">
            <label>
              <KeyRound size={14} />
              完成奖励
            </label>
            {project.keys.map((k) => (
              <label key={k.id} className="check-label">
                <input
                  type="checkbox"
                  checked={node.rewards.includes(k.id)}
                  onChange={(e) =>
                    updateNode({
                      rewards: e.target.checked
                        ? [...node.rewards, k.id]
                        : node.rewards.filter((id) => id !== k.id),
                    })
                  }
                />
                {k.name}
              </label>
            ))}
            <Button
              className="text-button"
              title="管理钥匙"
              onClick={() => setModal("settings")}
            >
              管理钥匙 <ArrowUpRight size={13} />
            </Button>
          </div>
        )}
        <div className="drawer-section">
          <label>
            <EyeOff size={14} />
            显示条件
          </label>
          <p className="muted small">满足后发现节点，已发现状态永久保留。</p>
          <ConditionEditor
            value={node.show}
            project={project}
            onChange={(show) => updateNode({ show })}
          />
        </div>
        <div className="drawer-section">
          <label>
            <LockKeyhole size={14} />
            进入条件
          </label>
          <p className="muted small">可见但未解锁时显示锁定图标。</p>
          <ConditionEditor
            value={node.enter}
            project={project}
            onChange={(enter) => updateNode({ enter })}
          />
        </div>
      </fieldset>
      {!readonly && (
        <div className="drawer-footer">
          <Button title="复制节点" onClick={duplicate}>
            <Copy size={15} />
            复制
          </Button>
          <Button className="danger" title="删除节点" onClick={deleteSelection}>
            <Trash2 size={15} />
            删除节点
          </Button>
        </div>
      )}
    </>
  );
}
