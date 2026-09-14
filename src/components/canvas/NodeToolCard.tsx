import type { CSSProperties } from "react";
import { TYPES } from "../../domain";
import type { NodeType } from "../../domain/types";
import { ICONS, colors } from "../nodeAppearance";
export default function NodeToolCard({
  type,
  number,
  onClick,
  className = "",
  style,
}: {
  type: NodeType;
  number: number;
  onClick: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  const Icon = ICONS[type];
  return (
    <button
      type="button"
      className={`node-tool-card ${className}`}
      style={style}
      onClick={onClick}
      title={`${number} · ${TYPES[type]}`}
      aria-label={`${number} 创建${TYPES[type]}`}
    >
      <kbd>{number}</kbd>
      <Icon size={24} color={colors[type]} />
      <span>{TYPES[type]}</span>
    </button>
  );
}
