import { Plus } from "lucide-react";
import { blankProgress, blankProject } from "../../domain";
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
    </>
  );
}
