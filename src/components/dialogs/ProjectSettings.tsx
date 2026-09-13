import { KeyRound, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { allNodes, blankProgress, blankProject, uid } from "../../domain";
import type { EditorController } from "../../hooks/useEditorController";
import Button from "../ui/Button";
type Props = Pick<
  EditorController,
  | "project"
  | "setProgress"
  | "setModal"
  | "map"
  | "readonly"
  | "notify"
  | "loadDemo"
  | "restoreSavedProject"
  | "commit"
  | "changeMap"
>;
export default function ProjectSettings({
  project,
  setProgress,
  setModal,
  map,
  readonly,
  notify,
  commit,
  changeMap,
  loadDemo,
  restoreSavedProject,
}: Props) {
  const [keyName, setKeyName] = useState("");
  return (
    <>
      <Button
        disabled={readonly}
        className="wide"
        title="新建空白项目"
        onClick={() => {
          commit(blankProject());
          changeMap("world");
          setProgress(blankProgress());
          setModal(null);
          notify("已新建空白项目，可撤销恢复上一项目");
        }}
      >
        <Plus size={15} />
        新建空白项目
      </Button>
      <p className="muted small">
        新建会替换当前工作区，可通过撤销恢复。建议先导出备份。
      </p>
      <div className="field-row">
        <Button title="加载示例地图" disabled={readonly} onClick={loadDemo}>
          加载示例地图
        </Button>
        <Button
          title="恢复本机草稿"
          disabled={readonly}
          onClick={restoreSavedProject}
        >
          恢复本机草稿
        </Button>
      </div>
      <label>项目名称</label>
      <input
        disabled={readonly}
        value={project.name}
        onChange={(e) => commit((p) => ({ ...p, name: e.target.value }))}
      />
      {map.kind === "area" && (
        <>
          <label>当前区域名称</label>
          <input
            disabled={readonly}
            value={map.name}
            onChange={(e) =>
              commit((p) => {
                p.maps.find((m) => m.id === map.id)!.name = e.target.value;
                const parent = p.maps
                  .find((m) => m.kind === "world")!
                  .nodes.find((n) => n.mapId === map.id);
                if (parent) parent.name = e.target.value;
                return p;
              })
            }
          />
        </>
      )}
      <h3>钥匙资源</h3>
      {project.keys.map((k) => (
        <div className="key-resource" key={k.id}>
          <KeyRound size={16} />
          <input
            aria-label="钥匙名称"
            disabled={readonly}
            value={k.name}
            onChange={(e) =>
              commit((p) => {
                p.keys.find((x) => x.id === k.id)!.name = e.target.value;
                return p;
              })
            }
          />
          <Button
            disabled={readonly}
            title="删除钥匙"
            onClick={() =>
              commit((p) => {
                p.keys = p.keys.filter((x) => x.id !== k.id);
                for (const n of allNodes(p))
                  n.rewards = n.rewards.filter((id) => id !== k.id);
                return p;
              })
            }
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ))}
      <div className="field-row">
        <input
          disabled={readonly}
          placeholder="新钥匙名称"
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
        />
        <Button
          disabled={readonly || !keyName.trim()}
          title="添加钥匙"
          onClick={() => {
            commit((p) => ({
              ...p,
              keys: [...p.keys, { id: uid(), name: keyName.trim() }],
            }));
            setKeyName("");
          }}
        >
          <Plus size={16} />
          添加
        </Button>
      </div>
      <p className="muted small">
        删除被条件引用的资源后，可通过地图校验定位需要修复的条件。
      </p>
    </>
  );
}
