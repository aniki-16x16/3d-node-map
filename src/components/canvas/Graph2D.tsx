import type { EditorController } from "../../hooks/useEditorController";
import GraphEdges from "./GraphEdges";
import GraphNodes from "./GraphNodes";
type Props = Pick<
  EditorController,
  | "layer"
  | "setLayer"
  | "selected"
  | "setSelected"
  | "selectedEdge"
  | "setSelectedEdge"
  | "playing"
  | "pending"
  | "view"
  | "setView"
  | "canvas"
  | "edges"
  | "readonly"
  | "activeProgress"
  | "visibleNodes"
  | "onNode"
  | "connect"
  | "pointerDown"
>;
export default function Graph2D({
  layer,
  setLayer,
  selected,
  setSelected,
  selectedEdge,
  setSelectedEdge,
  playing,
  pending,
  view,
  setView,
  canvas,
  edges,
  readonly,
  activeProgress,
  visibleNodes,
  onNode,
  connect,
  pointerDown,
}: Props) {
  return (
    <>
      <div
        className="grid"
        style={{
          backgroundSize: `${28 * view.k}px ${28 * view.k}px`,
          backgroundPosition: `${view.x}px ${view.y}px`,
        }}
      />
      <svg className="map-svg" aria-label="地图画布">
        <defs>
          <marker
            id="arrow"
            markerWidth="7"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <path d="M0 0 L7 3.5 L0 7" fill="#7a9199" />
          </marker>
        </defs>
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          <GraphEdges
            {...{
              layer,
              setLayer,
              setSelected,
              selectedEdge,
              setSelectedEdge,
              setView,
              canvas,
              edges,
              visibleNodes,
            }}
          />
          <GraphNodes
            {...{
              layer,
              selected,
              playing,
              pending,
              readonly,
              activeProgress,
              visibleNodes,
              onNode,
              connect,
              pointerDown,
            }}
          />
        </g>
      </svg>
    </>
  );
}
