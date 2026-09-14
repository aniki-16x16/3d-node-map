import type { EditorController } from "../../hooks/useEditorController";
import ReferenceLayer from "./ReferenceLayer";
import { SNAP_STEP } from "../../domain/layout";
import GraphEdges from "./GraphEdges";
import GraphNodes from "./GraphNodes";
type Props = { referenceLayer: number | null } & Pick<
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
  referenceLayer,
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
          backgroundSize: `${SNAP_STEP * view.k}px ${SNAP_STEP * view.k}px`,
          backgroundPosition: `${view.x}px ${view.y}px`,
        }}
      />
      <svg className="map-svg" aria-label="地图画布">
        <defs>
          {Object.entries({
            normal: "#4e636e",
            selected: "#c1ebd5",
            cross: "#789aac",
            generated: "#897ea5",
          }).map(([kind, color]) => (
            <marker
              key={kind}
              id={`arrow-${kind}`}
              viewBox="0 0 10 10"
              markerWidth="8"
              markerHeight="8"
              refX="9"
              refY="5"
              orient="auto-start-reverse"
              markerUnits="userSpaceOnUse"
            >
              <path d="M1 1 L9 5 L1 9 Z" fill={color} />
            </marker>
          ))}
        </defs>
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {referenceLayer !== null && referenceLayer !== layer && (
            <ReferenceLayer
              layer={referenceLayer}
              nodes={visibleNodes}
              edges={edges}
            />
          )}
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
