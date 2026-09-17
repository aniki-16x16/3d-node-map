import { resolveExitTarget } from "../../domain/nodePicking";
import { useTargetSelection } from "./TargetSelectionContext";
import { useState } from "react";
import Modal from "../ui/Modal";
import KeyManager from "../dialogs/KeyManager";
import {
  ArrowUpRight,
  Copy,
  EyeOff,
  KeyRound,
  Layers3,
  LockKeyhole,
  Trash2,
} from "lucide-react";
import { TYPES, availableKeys } from "../../domain";
import type { EditorController } from "../../hooks/useEditorController";
import Button from "../ui/Button";
import ConditionEditor from "./ConditionEditor";
type Props = Pick<
  EditorController,
  | "commit"
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
  commit,
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
  const requestTarget = useTargetSelection();
  const [choosingReward, setChoosingReward] = useState(false);
  if (!node) return null;
  const reward = availableKeys(project, map.id).find(
    (key) => key.id === node.rewards[0],
  );
  const targetMap = project.maps.find(
    (m) => m.id === world.nodes.find((n) => n.id === node.target)?.mapId,
  );
  const targetEntry = targetMap?.nodes.find(
    (n) => n.id === node.targetEntry && n.type === "entrance",
  );
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
          {node.type === "battle" && (
            <label className="check-label">
              <input
                type="checkbox"
                checked={node.boss ?? false}
                onChange={(e) => updateNode({ boss: e.target.checked })}
              />
              Boss 战斗
            </label>
          )}
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
            <label>出口目标</label>
            <Button
              title="从画布选择出口目标"
              onClick={() =>
                requestTarget({
                  type: "exit-target",
                  ref: targetEntry?.id || node.target || "",
                  mapId: targetMap?.id || world.id,
                  onSelect: (id) => {
                    const target = resolveExitTarget(project, id);
                    if (target) updateNode(target);
                  },
                })
              }
            >
              <ArrowUpRight size={16} />
              {targetEntry
                ? targetMap!.name + " · " + targetEntry.name
                : world.nodes.find(
                    (n) => n.id === node.target && n.type === "town",
                  )?.name || "从画布选择入口或城镇…"}
            </Button>
            <p className="muted small">对应世界路线自动生成。</p>
          </div>
        )}
        {["battle", "chest"].includes(node.type) && (
          <div className="drawer-section">
            <label>
              <KeyRound size={14} />
              完成奖励
            </label>
            <p className="muted small">最多奖励一把钥匙。</p>
            {reward && (
              <div className="linked-map">
                <KeyRound size={16} />
                <span>
                  {reward.name || "未命名钥匙"} ·{" "}
                  {reward.mapId === null ? "全局" : "局部"}
                </span>
                <Button
                  title="清除奖励钥匙"
                  onClick={() => updateNode({ rewards: [] })}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            )}
            <Button
              className="text-button"
              title="管理并选择奖励钥匙"
              onClick={() => setChoosingReward(true)}
            >
              {reward ? "更换奖励钥匙" : "管理钥匙并选择奖励"}{" "}
              <ArrowUpRight size={13} />
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
            field="show"
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
            field="enter"
          />
        </div>
      </fieldset>
      <Modal
        open={choosingReward}
        title="选择完成奖励 · 钥匙管理"
        className="key-modal"
        onClose={() => setChoosingReward(false)}
      >
        <KeyManager
          key={node.id}
          {...{ project, map, readonly, commit }}
          selectedKeyId={node.rewards[0]}
          onSelect={(id) => {
            updateNode({ rewards: [id] });
            setChoosingReward(false);
          }}
        />
      </Modal>
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
