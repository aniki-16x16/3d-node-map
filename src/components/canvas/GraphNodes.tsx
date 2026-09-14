import { Check, EyeOff, LockKeyhole } from "lucide-react";
import type { CSSProperties } from "react";
import { TYPES, ports } from "../../domain";
import type { Port } from "../../domain/types";
import type { EditorController } from "../../hooks/useEditorController";
import { ICONS, colors } from "../nodeAppearance";
type Props = Pick<
  EditorController,
  | "layer"
  | "selected"
  | "playing"
  | "pending"
  | "readonly"
  | "activeProgress"
  | "visibleNodes"
  | "onNode"
  | "connect"
  | "pointerDown"
>;
export default function GraphNodes({
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
}: Props) {
  return (
    <>
      {visibleNodes
        .filter((n) => n.z === layer)
        .map((n) => {
          const Icon = ICONS[n.type],
            locked = playing && !activeProgress.unlocked.includes(n.id),
            done = playing && activeProgress.completed.includes(n.id);
          return (
            <g
              key={n.id}
              data-node-id={n.id}
              transform={`translate(${n.x} ${n.y})`}
              role="button"
              tabIndex={0}
              aria-label={`${n.name} · ${TYPES[n.type]}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onNode(n.id);
                }
              }}
              className={`map-node ${n.id === selected ? "selected" : ""} ${locked ? "locked" : ""} ${done ? "done" : ""}`}
              style={{ "--node-color": colors[n.type] } as CSSProperties}
              onPointerDown={(e) => pointerDown(e, n.id)}
              onClick={(e) => {
                e.stopPropagation();
                onNode(n.id);
              }}
            >
              <rect
                className={`diamond ${n.type === "structure" ? "structure-shape" : ""}`}
                x="-24"
                y="-24"
                width="48"
                height="48"
                rx="5"
                transform={`rotate(45) scale(${n.type === "structure" ? 0.75 : 1})`}
              />
              {n.type !== "structure" &&
                (locked ? (
                  <LockKeyhole x={-11} y={-11} size={22} />
                ) : (
                  <Icon x={-12} y={-12} size={24} />
                ))}
              <text y="62" textAnchor="middle" className="node-name">
                {n.name}
              </text>
              {n.show.rules.length > 0 && !playing && (
                <EyeOff x="24" y="-35" size={13} />
              )}
              {n.enter.rules.length > 0 && !playing && (
                <LockKeyhole x="-36" y="-35" size={13} />
              )}
              {done && (
                <g transform="translate(25 -27)">
                  <circle r="8" fill="#a8dfc5" />
                  <Check x="-6" y="-6" size={12} color="#183b2c" />
                </g>
              )}
              {!readonly &&
                Object.entries(ports).map(([port, [x, y]]) => (
                  <circle
                    key={port}
                    cx={x * (n.type === "structure" ? 0.75 : 1)}
                    cy={y * (n.type === "structure" ? 0.75 : 1)}
                    r="6"
                    className={`port ${pending?.id === n.id && pending.port === port ? "pending" : ""}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      connect(n.id, port as Port);
                    }}
                  >
                    <title>{port} 吸附点</title>
                  </circle>
                ))}
            </g>
          );
        })}
    </>
  );
}
