import { Check, KeyRound, RotateCcw, Settings2 } from "lucide-react";
import { blankProgress, settle } from "../../domain";
import type { EditorController } from "../../hooks/useEditorController";
import Button from "../ui/Button";
type Props = Pick<
  EditorController,
  | "project"
  | "setProgress"
  | "setModal"
  | "world"
  | "map"
  | "activeProgress"
  | "notify"
  | "changeMap"
>;
export default function PreviewPanel({
  project,
  setProgress,
  setModal,
  world,
  map,
  activeProgress,
  notify,
  changeMap,
}: Props) {
  return (
    <>
      <div className="progress-stat">
        <strong>
          {
            map.nodes.filter((n) => activeProgress.completed.includes(n.id))
              .length
          }
          <span> / {map.nodes.length}</span>
        </strong>
        <small>当前地图已完成</small>
      </div>
      <div className="key-list">
        {project.keys.map((k) => (
          <div
            key={k.id}
            className={activeProgress.keys.includes(k.id) ? "owned" : ""}
          >
            <KeyRound size={14} />
            {k.name}
            {activeProgress.keys.includes(k.id) && <Check size={13} />}
          </div>
        ))}
      </div>
      <Button
        className="wide"
        title="打开预览调试"
        onClick={() => setModal("debug")}
      >
        <Settings2 size={15} />
        预览调试
      </Button>
      <Button
        className="wide"
        title="重置预览"
        onClick={() => {
          setProgress(settle(project, blankProgress()));
          changeMap(world.id);
          notify("探索状态已重置");
        }}
      >
        <RotateCcw size={15} />
        重置预览
      </Button>
      <div className="event-log">
        {activeProgress.log.slice(0, 5).map((s, i) => (
          <p key={i}>{s}</p>
        ))}
      </div>
    </>
  );
}
