import { CheckCircle2, ChevronRight, CircleHelp, Globe2 } from "lucide-react";
import type { EditorController } from "../../hooks/useEditorController";
import PreviewPanel from "./PreviewPanel";
type Props = Pick<
  EditorController,
  | "pickingNode"
  | "project"
  | "setLayer"
  | "playing"
  | "setProgress"
  | "setModal"
  | "world"
  | "map"
  | "activeProgress"
  | "notify"
  | "changeMap"
>;
export default function MapSidebar({
  pickingNode,
  project,
  setLayer,
  playing,
  setProgress,
  setModal,
  world,
  map,
  activeProgress,
  notify,
  changeMap,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <span className="eyebrow">WORKSPACE</span>
        <h2>
          地图资源 <span>{project.maps.length}</span>
        </h2>
      </div>
      <nav>
        <button
          className={`map-item ${map.id === world.id ? "chosen" : ""}`}
          onClick={() => changeMap(world.id)}
        >
          <Globe2 size={18} />
          <span>
            世界地图<small>WORLD MAP</small>
          </span>
          <ChevronRight size={14} />
        </button>
        <div className="section-label">
          二级地图 <span>{project.maps.length - 1}</span>
        </div>
        {project.maps
          .filter((m) => m.kind === "area")
          .map((m, i) => {
            const accessible =
              !playing ||
              world.nodes.some(
                (n) =>
                  n.mapId === m.id && activeProgress.completed.includes(n.id),
              );
            return (
              <div className="area-row" key={m.id}>
                <button
                  disabled={!accessible}
                  key={m.id}
                  className={`map-item area ${map.id === m.id ? "chosen" : ""}`}
                  onClick={() => {
                    changeMap(m.id);
                    if (playing) {
                      const target = m.nodes.find(
                        (n) => n.id === activeProgress.current,
                      );
                      setLayer(target?.z || 0);
                    }
                  }}
                >
                  <span className="map-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    {m.name}
                    <small>
                      {m.nodes.length} 个节点 ·{" "}
                      {new Set(m.nodes.map((n) => n.z)).size} 层
                    </small>
                  </span>
                  <ChevronRight size={14} />
                </button>
              </div>
            );
          })}
      </nav>
      {playing && (
        <div className="sidebar-section">
          <div className="section-label">探索状态</div>
          <PreviewPanel
            {...{
              project,
              setProgress,
              setModal,
              world,
              map,
              activeProgress,
              notify,
              changeMap,
            }}
          />
        </div>
      )}
      <div className="sidebar-bottom">
        <button disabled={pickingNode} onClick={() => setModal("validation")}>
          <CheckCircle2 size={16} />
          地图校验
          <ChevronRight size={14} />
        </button>
        <button disabled={pickingNode} onClick={() => setModal("help")}>
          <CircleHelp size={16} />
          操作指南<span>?</span>
        </button>
        <div className="version">
          NODE ATLAS <span>v1.0</span>
        </div>
      </div>
    </aside>
  );
}
