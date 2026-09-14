import type { CSSProperties } from "react";
import type { MapNode, MapEdge } from "../../domain/types";
import { route } from "../../domain/routing";
import { ICONS, colors } from "../nodeAppearance";
export default function ReferenceLayer({
  layer,
  nodes,
  edges,
}: {
  layer: number;
  nodes: MapNode[];
  edges: MapEdge[];
}) {
  const referenceNodes = nodes.filter((node) => node.z === layer);
  const byId = new Map(referenceNodes.map((node) => [node.id, node]));
  return (
    <g className="reference-layer" aria-hidden="true">
      {edges.map((edge) => {
        const a = byId.get(edge.a),
          b = byId.get(edge.b);
        if (!a || !b) return null;
        return (
          <path
            key={edge.id}
            className="edge"
            d={route(a, b, edge.ap, edge.bp)
              .map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`)
              .join(" ")}
          />
        );
      })}
      {referenceNodes.map((node) => {
        const Icon = ICONS[node.type];
        return (
          <g
            key={node.id}
            className="map-node reference-node"
            transform={`translate(${node.x} ${node.y})`}
            style={{ "--node-color": colors[node.type] } as CSSProperties}
          >
            <rect
              className="diamond"
              x="-24"
              y="-24"
              width="48"
              height="48"
              rx="5"
              transform="rotate(45)"
            />
            <Icon x={-12} y={-12} size={24} />
            <text y="62" textAnchor="middle" className="node-name">
              {node.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}
