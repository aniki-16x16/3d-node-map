import { Box, Layers3, Link2, MousePointer2, X } from "lucide-react";
import type { ReactNode } from "react";
import type { EditorController } from "../../hooks/useEditorController";
import Button from "../ui/Button";
import CanvasToolbar from "./CanvasToolbar";
import Graph2D from "./Graph2D";
import LayerControl from "./LayerControl";
import Scene3D from "./Scene3D";
import ZoomControl from "./ZoomControl";
type Props = { children?: ReactNode } & Pick<
  EditorController,
  | "layer"
  | "setLayer"
  | "selected"
  | "setSelected"
  | "selectedEdge"
  | "setSelectedEdge"
  | "three"
  | "playing"
  | "tool"
  | "setTool"
  | "pending"
  | "setPending"
  | "view"
  | "setView"
  | "history"
  | "drag"
  | "canvas"
  | "map"
  | "edges"
  | "readonly"
  | "activeProgress"
  | "visibleNodes"
  | "layers"
  | "undo"
  | "redo"
  | "fit"
  | "onNode"
  | "connect"
  | "pointerDown"
  | "pointerMove"
  | "pointerUp"
  | "zoom"
>;
export default function MapViewport({
  layer,
  setLayer,
  selected,
  setSelected,
  selectedEdge,
  setSelectedEdge,
  three,
  playing,
  tool,
  setTool,
  pending,
  setPending,
  view,
  setView,
  history,
  drag,
  canvas,
  map,
  edges,
  readonly,
  activeProgress,
  visibleNodes,
  layers,
  undo,
  redo,
  fit,
  onNode,
  connect,
  pointerDown,
  pointerMove,
  pointerUp,
  zoom,
  children,
}: Props) {
  return (
    <div
      className={`canvas ${tool === "hand" ? "hand-tool" : ""} ${drag ? "dragging" : ""}`}
      ref={canvas}
      onPointerDown={(e) => !three && pointerDown(e)}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
    >
      {three ? (
        <Scene3D
          nodes={visibleNodes}
          edges={edges}
          selected={selected}
          selectedEdge={selectedEdge}
          progress={activeProgress}
          playing={playing}
          onSelect={onNode}
        />
      ) : (
        <Graph2D
          {...{
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
          }}
        />
      )}
      <div className="canvas-caption">
        <span className="eyebrow">
          {map.kind === "world" ? "WORLD MAP" : "REGION MAP"}
        </span>
        <h1>{map.name}</h1>
        <p>
          {three
            ? "空间视图 / 只读预览"
            : map.kind === "world"
              ? "世界路线与区域连接"
              : `Z ${layer > 0 ? "+" : ""}${layer} / ${layer === 0 ? "地面层" : layer > 0 ? "上层空间" : "地下空间"}`}
        </p>
      </div>
      {!three && (
        <CanvasToolbar {...{ tool, setTool, history, readonly, undo, redo }} />
      )}
      {pending && (
        <div className="connect-banner">
          <Link2 size={15} />
          正在连接 · 可切换到任意层
          <Button title="取消连线" onClick={() => setPending(null)}>
            <X size={14} />
          </Button>
        </div>
      )}
      {map.kind === "area" && !three && (
        <LayerControl {...{ layer, setLayer, layers }} />
      )}
      <div className="bottom-hint">
        {three ? (
          <>
            <Box size={14} />
            拖动旋转 · 滚轮缩放 · 右键平移
            {playing ? " · 点击节点探索" : ""}
          </>
        ) : (
          <>
            <MousePointer2 size={14} />
            {playing
              ? "点击开放节点探索，已完成节点可随时返回"
              : "拖动节点布局 · 空白处拖拽平移 · 滚轮缩放"}
          </>
        )}
      </div>
      {!three && <ZoomControl {...{ view, fit, zoom }} />}
      {!visibleNodes.filter((n) => three || n.z === layer).length && (
        <div className="empty-canvas">
          <Layers3 size={32} />
          <h3>{playing ? "尚未发现节点" : "这一层还是空白"}</h3>
          <p>
            {playing
              ? "从世界地图起点开始探索"
              : "从左侧添加节点，开始绘制路线"}
          </p>
        </div>
      )}
      {children}
    </div>
  );
}
