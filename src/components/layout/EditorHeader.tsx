import {
  ChevronDown,
  KeyRound,
  Compass,
  Download,
  Play,
  Square,
  Upload,
} from "lucide-react";
import type { EditorController } from "../../hooks/useEditorController";
import Button from "../ui/Button";
type Props = Pick<
  EditorController,
  | "project"
  | "playing"
  | "setModal"
  | "saveState"
  | "importer"
  | "exportFile"
  | "togglePlay"
>;
export default function EditorHeader({
  project,
  playing,
  setModal,
  saveState,
  importer,
  exportFile,
  togglePlay,
}: Props) {
  return (
    <header>
      <div className="brand">
        <span className="brand-icon">
          <Compass size={24} />
        </span>
        <strong>
          NODE<span>ATLAS</span>
        </strong>
        <span className="beta">BETA</span>
      </div>
      <div className="project-title">
        <span className="divider" />
        {project.name}
        <button title="项目设置" onClick={() => setModal("settings")}>
          <ChevronDown size={14} />
        </button>
        <span className="saved">
          <span /> {saveState}
        </span>
      </div>
      <div className="header-actions">
        <Button
          className="key-manager-trigger"
          title="管理钥匙"
          onClick={() => setModal("keys")}
        >
          <KeyRound size={16} />
          钥匙管理
        </Button>
        <Button
          title="导入地图 JSON"
          disabled={playing}
          onClick={() => importer.current?.click()}
        >
          <Upload size={16} />
          导入
        </Button>
        <Button title="导出地图 JSON" onClick={exportFile}>
          <Download size={16} />
          导出
        </Button>
        <Button
          className={playing ? "stop-button" : "primary"}
          title={playing ? "结束预览" : "开始游玩预览"}
          onClick={togglePlay}
        >
          {playing ? <Square size={15} /> : <Play size={15} />}{" "}
          {playing ? "结束预览" : "游玩预览"}
        </Button>
      </div>
    </header>
  );
}
