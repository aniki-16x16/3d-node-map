import { RotateCcw } from "lucide-react";
import { blankProgress } from "../../domain";
import type { EditorController } from "../../hooks/useEditorController";
import Button from "../ui/Button";
type Props = Pick<
  EditorController,
  | "project"
  | "setProgress"
  | "setModal"
  | "world"
  | "activeProgress"
  | "changeMap"
>;
export default function PreviewDebug({
  project,
  setProgress,
  setModal,
  world,
  activeProgress,
  changeMap,
}: Props) {
  return (
    <>
      <p className="muted">
        即时调整当前预览的钥匙。已发现和已解锁状态不会因移除钥匙而撤销。
      </p>
      {project.keys.map((k) => (
        <label className="check-label" key={k.id}>
          <input
            type="checkbox"
            checked={activeProgress.keys.includes(k.id)}
            onChange={(e) =>
              setProgress(() => ({
                ...activeProgress,
                keys: e.target.checked
                  ? [...activeProgress.keys, k.id]
                  : activeProgress.keys.filter((id) => id !== k.id),
              }))
            }
          />
          {k.name}
        </label>
      ))}
      <Button
        title="重置全部探索状态"
        className="wide"
        onClick={() => {
          setProgress(blankProgress());
          changeMap(world.id);
          setModal(null);
        }}
      >
        <RotateCcw size={16} />
        重置全部探索状态
      </Button>
    </>
  );
}
