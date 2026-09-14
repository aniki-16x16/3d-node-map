import { useState } from "react";
import type { EditorController } from "../../hooks/useEditorController";
import Modal from "../ui/Modal";
import { KeyRound } from "lucide-react";
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
  const [lastModal, setLastModal] = useState(modal);
  if (modal && modal !== lastModal) setLastModal(modal);
  const shown = modal ?? lastModal;
  const title =
    shown === "help"
      ? "操作指南"
      : shown === "validation"
        ? "地图校验"
        : shown === "debug"
          ? "预览调试"
          : shown === "keys"
            ? "钥匙管理"
            : "项目设置";
  return (
    <Modal
      open={modal !== null}
      onClose={() => setModal(null)}
      className={shown === "keys" ? "key-modal" : ""}
      title={
        <>
          {shown === "keys" && <KeyRound size={22} />}
          {title}
        </>
      }
    >
      {shown === "keys" ? (
        <KeyManager key={map.id} {...{ project, map, readonly, commit }} />
      ) : shown === "settings" ? (
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
      ) : shown === "debug" ? (
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
      ) : shown === "validation" ? (
        <ValidationResults {...{ project }} />
      ) : (
        <HelpContent {...{}} />
      )}
    </Modal>
  );
}
