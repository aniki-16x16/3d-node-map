import { ports, route } from "../../domain";
import type { EditorController } from "../../hooks/useEditorController";
type Props = Pick<
  EditorController,
  | "layer"
  | "setLayer"
  | "setSelected"
  | "selectedEdge"
  | "setSelectedEdge"
  | "setView"
  | "canvas"
  | "edges"
  | "visibleNodes"
>;
export default function GraphEdges({
  layer,
  setLayer,
  setSelected,
  selectedEdge,
  setSelectedEdge,
  setView,
  canvas,
  edges,
  visibleNodes,
}: Props) {
  return (
    <>
      {edges.map((e) => {
        const a = visibleNodes.find((n) => n.id === e.a),
          b = visibleNodes.find((n) => n.id === e.b);
        if (!a || !b || (a.z !== layer && b.z !== layer)) return null;
        if (a.z !== b.z) {
          const local = a.z === layer ? a : b,
            remote = a.z === layer ? b : a,
            port = a.z === layer ? e.ap : e.bp,
            offset = ports[port],
            tx = local.x + offset[0] * 4,
            ty = local.y + offset[1] * 4;
          return (
            <g
              key={e.id}
              className="cross-layer"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <path
                d={`M${local.x + offset[0]},${local.y + offset[1]} L${tx},${ty}`}
                className={
                  selectedEdge === e.id ? "edge selected" : "edge cross"
                }
                onClick={() => {
                  setSelectedEdge(e.id);
                  setSelected(null);
                }}
              />
              <g
                onClick={() => {
                  setLayer(remote.z);
                  setView((v) => ({
                    ...v,
                    x: canvas.current!.clientWidth / 2 - remote.x * v.k,
                    y: canvas.current!.clientHeight / 2 - remote.y * v.k,
                  }));
                }}
              >
                <rect x={tx - 66} y={ty - 13} width="132" height="27" rx="13" />
                <text x={tx} y={ty + 5} textAnchor="middle">
                  ↗ Z{remote.z > 0 ? "+" : ""}
                  {remote.z} · {remote.name.slice(0, 7)}
                </text>
              </g>
            </g>
          );
        }
        const pts = route(a, b, e.ap, e.bp),
          d = pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
        return (
          <g
            key={e.id}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              setSelectedEdge(e.id);
              setSelected(null);
            }}
          >
            <path
              d={d}
              className={`edge ${selectedEdge === e.id ? "selected" : ""} ${e.generated ? "generated" : ""}`}
              markerEnd={e.directed ? "url(#arrow)" : undefined}
            />
            <path d={d} className="edge-hit" />
          </g>
        );
      })}
    </>
  );
}
