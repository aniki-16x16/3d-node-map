import { useState, type RefObject } from "react";
import { snapCoordinate } from "../domain/layout";
import { duplicateNode, newNode, uid } from "../domain/project";
import type {
  AtlasMap,
  MapEdge,
  MapNode,
  NodeType,
  Port,
  Point,
} from "../domain/types";
import type {
  Commit,
  Notify,
  PendingConnection,
  Setter,
  ViewTransform,
} from "./editorTypes";
interface Options {
  map: AtlasMap;
  node: MapNode | undefined;
  edge: MapEdge | undefined;
  selected: string | null;
  readonly: boolean;
  pending: PendingConnection | null;
  canvas: RefObject<HTMLDivElement | null>;
  view: ViewTransform;
  layer: number;
  commit: Commit;
  setSelected: Setter<string | null>;
  setSelectedEdge: Setter<string | null>;
  setPending: Setter<PendingConnection | null>;
  notify: Notify;
}
export function useNodeActions({
  map,
  node,
  edge,
  selected,
  readonly,
  pending,
  canvas,
  view,
  layer,
  commit,
  setSelected,
  setSelectedEdge,
  setPending,
  notify,
}: Options) {
  const [creationCount, setCreationCount] = useState(0);
  const updateMap = (fn: (map: AtlasMap) => void) =>
    commit((p) => {
      fn(p.maps.find((m) => m.id === map.id)!);
      return p;
    });
  const updateNode = (patch: Partial<MapNode>) =>
    commit((p) => {
      const n = p.maps
        .find((m) => m.id === map.id)!
        .nodes.find((n) => n.id === selected)!;
      Object.assign(n, patch);
      if (n.type === "region" && patch.name !== undefined) {
        const area = p.maps.find((m) => m.id === n.mapId);
        if (area) area.name = patch.name;
      }
      return p;
    });
  const deleteSelection = () => {
    if (readonly) return;
    if (selected) {
      commit((p) => {
        const m = p.maps.find((m) => m.id === map.id)!,
          removed = m.nodes.find((n) => n.id === selected);
        m.nodes = m.nodes.filter((n) => n.id !== selected);
        m.edges = m.edges.filter((e) => e.a !== selected && e.b !== selected);
        if (
          removed?.type === "region" &&
          !m.nodes.some((n) => n.mapId === removed.mapId)
        )
          p.maps = p.maps.filter((a) => a.id !== removed.mapId);
        return p;
      });
      setSelected(null);
    } else if (edge && !edge.generated) {
      updateMap((m) => {
        m.edges = m.edges.filter((e) => e.id !== edge.id);
      });
      setSelectedEdge(null);
    }
  };
  const duplicate = () => {
    if (!node || readonly) return;
    let copied: MapNode | undefined;
    commit((p) => {
      copied = duplicateNode(p, map.id, node, node.x + 80, node.y + 80, node.z);
      return p;
    });
    if (copied) {
      setSelected(copied.id);
      setCreationCount((count) => count + 1);
    }
  };
  const addNode = (type: NodeType, position?: Point) => {
    if (readonly) return;
    const r = canvas.current!.getBoundingClientRect();
    const n = newNode(
      type,
      snapCoordinate(position?.x ?? (r.width * 0.45 - view.x) / view.k),
      snapCoordinate(position?.y ?? (r.height * 0.45 - view.y) / view.k),
      map.kind === "world" ? 0 : layer,
    );
    commit((p) => {
      const m = p.maps.find((m) => m.id === map.id)!;
      m.nodes.push(n);
      if (type === "region") {
        const area: AtlasMap = {
          id: uid(),
          name: `新区域 ${p.maps.length}`,
          kind: "area",
          nodes: [],
          edges: [],
        };
        const entry = newNode("entrance", 200, 300);
        area.nodes.push(entry);
        area.defaultEntry = entry.id;
        p.maps.push(area);
        n.mapId = area.id;
        n.name = area.name;
      }
      if (type === "entrance" && !m.defaultEntry) m.defaultEntry = n.id;
      return p;
    });
    setCreationCount((count) => count + 1);
    setSelected(n.id);
    setSelectedEdge(null);
  };
  const connect = (id: string, port: Port) => {
    if (readonly) return;
    if (!pending) {
      setPending({ id, port });
      notify("选择另一个节点的吸附点，可先切换楼层");
      return;
    }
    if (pending.id === id) {
      setPending(null);
      return;
    }
    if (
      map.edges.some(
        (e) =>
          e.a === pending.id &&
          e.b === id &&
          e.ap === pending.port &&
          e.bp === port,
      )
    ) {
      notify("这条连线已存在");
      setPending(null);
      return;
    }
    updateMap((m) =>
      m.edges.push({
        id: uid(),
        a: pending.id,
        b: id,
        ap: pending.port,
        bp: port,
        directed: false,
      }),
    );
    setPending(null);
  };
  return {
    creationCount,
    updateMap,
    updateNode,
    deleteSelection,
    duplicate,
    addNode,
    connect,
  };
}
