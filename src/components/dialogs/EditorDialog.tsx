import { X } from "lucide-react";
import type { EditorController } from "../../hooks/useEditorController";
import Button from "../ui/Button";
import HelpContent from "./HelpContent";
import PreviewDebug from "./PreviewDebug";
import KeyManager from "./KeyManager";
import ProjectSettings from "./ProjectSettings";
import ValidationResults from "./ValidationResults";
type Props = Pick<
  EditorController,
  | "project"
  | "setProgress"
  | "modal"
  | "setModal"
  | "world"
  | "map"
  | "readonly"
  | "activeProgress"
  | "notify"
  | "loadDemo"
  | "restoreSavedProject"
  | "commit"
  | "changeMap"
>;
export default function EditorDialog({
  project,
  setProgress,
  modal,
  setModal,
  world,
  map,
  readonly,
  activeProgress,
  notify,
  commit,
  changeMap,
  loadDemo,
  restoreSavedProject,
}: Props) {
  return (
    <div className="modal-backdrop" onClick={() => setModal(null)}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={
          modal === "help"
            ? "操作指南"
            : modal === "validation"
              ? "地图校验"
              : modal === "debug"
                ? "预览调试"
                : modal === "keys"
                  ? "钥匙管理"
                  : "项目设置"
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title">
          <h2>
            {modal === "help"
              ? "操作指南"
              : modal === "validation"
                ? "地图校验"
                : modal === "debug"
                  ? "预览调试"
                  : modal === "keys"
                    ? "钥匙管理"
                    : "项目设置"}
          </h2>
          <Button title="关闭" onClick={() => setModal(null)}>
            <X size={19} />
          </Button>
        </div>
        {modal === "keys" ? (
          <KeyManager {...{ project, map, readonly, commit }} />
        ) : modal === "settings" ? (
          <ProjectSettings
            {...{
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
            }}
          />
        ) : modal === "debug" ? (
          <PreviewDebug
            {...{
              project,
              setProgress,
              setModal,
              world,
              activeProgress,
              changeMap,
            }}
          />
        ) : modal === "validation" ? (
          <ValidationResults {...{ project }} />
        ) : (
          <HelpContent {...{}} />
        )}
      </section>
    </div>
  );
}
