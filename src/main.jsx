import React, { useState, useEffect, useRef, useMemo } from "react";
import { createRoot } from "react-dom/client";
import {
  Compass,
  Globe2,
  Layers3,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Swords,
  Store,
  Tent,
  Flag,
  Gem,
  DoorOpen,
  LogIn,
  MapPin,
  Castle,
  Mountain,
  MousePointer2,
  Hand,
  Undo2,
  Redo2,
  Download,
  Upload,
  Play,
  Square,
  Box,
  Scan,
  Minus,
  LockKeyhole,
  EyeOff,
  Trash2,
  Copy,
  Check,
  KeyRound,
  RotateCcw,
  Settings2,
  Link2,
  ArrowUpRight,
  CircleHelp,
  AlertTriangle,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import {
  TYPES,
  uid,
  newNode,
  demoProject,
  blankProgress,
  allNodes,
  settle,
  visit,
  worldEdges,
  validate,
  parseProject,
  ports,
  route,
  emptyCondition,
  blankProject,
  duplicateNode,
} from "./model";
import Scene3D, { colors } from "./Scene3D";
import "./style.css";
const ICONS = {
  town: Castle,
  region: Mountain,
  battle: Swords,
  shop: Store,
  rest: Tent,
  checkpoint: Flag,
  chest: Gem,
  entrance: LogIn,
  exit: DoorOpen,
};
const STORAGE = "node-atlas-project-v1";
function load() {
  try {
    const value = localStorage.getItem(STORAGE);
    if (value) return parseProject(value);
  } catch {}
  return demoProject();
}
function Button({
  children,
  title,
  onClick,
  active,
  disabled,
  className = "",
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`${className} ${active ? "active" : ""}`}
    >
      {children}
    </button>
  );
}
function ConditionEditor({ value, onChange, project, depth = 0 }) {
  const update = (i, r) =>
    onChange({ ...value, rules: value.rules.map((x, j) => (i === j ? r : x)) });
  return (
    <div className="condition">
      <div className="condition-head">
        <select
          aria-label="条件组合"
          value={value.op}
          onChange={(e) => onChange({ ...value, op: e.target.value })}
        >
          <option value="all">满足全部条件 · AND</option>
          <option value="any">满足任一条件 · OR</option>
        </select>
        <Button
          title="添加条件"
          onClick={() =>
            onChange({
              ...value,
              rules: [
                ...value.rules,
                { type: "key", ref: project.keys[0]?.id || "", not: false },
              ],
            })
          }
        >
          <Plus size={14} />
        </Button>
        {depth < 4 && (
          <Button
            title="添加条件组"
            onClick={() =>
              onChange({ ...value, rules: [...value.rules, emptyCondition()] })
            }
          >
            组
          </Button>
        )}
      </div>
      {!value.rules.length && <p className="muted small">无条件限制</p>}
      {value.rules.map((r, i) => (
        <div className="rule" key={i}>
          {r.rules ? (
            <ConditionEditor
              value={r}
              project={project}
              depth={depth + 1}
              onChange={(x) => update(i, x)}
            />
          ) : (
            <div className="rule-fields">
              <select
                aria-label="条件类型"
                value={r.type}
                onChange={(e) =>
                  update(i, { ...r, type: e.target.value, ref: "" })
                }
              >
                <option value="key">钥匙</option>
                <option value="visited">已到达节点</option>
              </select>
              <select
                aria-label="条件判断"
                value={String(r.not)}
                onChange={(e) =>
                  update(i, { ...r, not: e.target.value === "true" })
                }
              >
                <option value="false">有 / 是</option>
                <option value="true">无 / 否</option>
              </select>
              <select
                aria-label="条件目标"
                value={r.ref}
                onChange={(e) => update(i, { ...r, ref: e.target.value })}
              >
                <option value="">选择目标…</option>
                {r.type === "key"
                  ? project.keys.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                      </option>
                    ))
                  : project.maps.map((m) => (
                      <optgroup key={m.id} label={m.name}>
                        {m.nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
              </select>
            </div>
          )}
          <Button
            title="移除条件"
            onClick={() =>
              onChange({
                ...value,
                rules: value.rules.filter((_, j) => i !== j),
              })
            }
          >
            <X size={13} />
          </Button>
        </div>
      ))}
    </div>
  );
}
function App() {
  const [project, setProject] = useState(load),
    [mapId, setMapId] = useState("world"),
    [layer, setLayer] = useState(0),
    [selected, setSelected] = useState(null),
    [selectedEdge, setSelectedEdge] = useState(null),
    [three, setThree] = useState(false),
    [playing, setPlaying] = useState(false),
    [progress, setProgress] = useState(blankProgress),
    [tool, setTool] = useState("select"),
    [pending, setPending] = useState(null),
    [view, setView] = useState({ x: 70, y: 40, k: 0.85 }),
    [toast, setToast] = useState(""),
    [modal, setModal] = useState(null),
    [keyName, setKeyName] = useState(""),
    [history, setHistory] = useState({ past: [], future: [] }),
    [clipboard, setClipboard] = useState(null),
    [drag, setDrag] = useState(null),
    [saveState, setSaveState] = useState("已保存至本机");
  const canvas = useRef(),
    importer = useRef(),
    current = useRef(project),
    gesture = useRef(),
    didDrag = useRef(false);
  current.current = project;
  const world = project.maps.find((m) => m.kind === "world"),
    map = project.maps.find((m) => m.id === mapId) || world,
    node = map.nodes.find((n) => n.id === selected);
  const edges = useMemo(
    () => (map.kind === "world" ? worldEdges(project) : map.edges),
    [project, map],
  );
  const edge = edges.find((e) => e.id === selectedEdge),
    readonly = playing || three;
  const activeProgress = useMemo(
    () => settle(project, progress),
    [project, progress],
  );
  const visibleNodes = useMemo(
    () =>
      map.nodes.filter(
        (n) => !playing || activeProgress.discovered.includes(n.id),
      ),
    [map, playing, activeProgress],
  );
  const layers = [...new Set([0, layer, ...map.nodes.map((n) => n.z)])].sort(
    (a, b) => b - a,
  );
  const notify = (t) => setToast(t);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3600);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(project));
      setSaveState("已保存至本机");
    } catch {
      setSaveState("本机保存失败，请导出备份");
    }
  }, [project]);
  const commit = (next) => {
    const old = current.current;
    const result =
      typeof next === "function" ? next(structuredClone(old)) : next;
    setHistory((h) => ({ past: [...h.past, old].slice(-80), future: [] }));
    setProject(result);
  };
  const changeMap = (id) => {
    setMapId(id);
    setLayer(0);
    setSelected(null);
    setSelectedEdge(null);
    setPending(null);
  };
  const updateMap = (fn) =>
    commit((p) => {
      fn(p.maps.find((m) => m.id === map.id));
      return p;
    });
  const updateNode = (patch) =>
    commit((p) => {
      const n = p.maps
        .find((m) => m.id === map.id)
        .nodes.find((n) => n.id === selected);
      Object.assign(n, patch);
      if (n.type === "region" && patch.name !== undefined) {
        const area = p.maps.find((m) => m.id === n.mapId);
        if (area) area.name = patch.name;
      }
      return p;
    });
  const undo = () => {
    if (readonly) return;
    setHistory((h) => {
      if (!h.past.length) return h;
      setProject(h.past.at(-1));
      return {
        past: h.past.slice(0, -1),
        future: [current.current, ...h.future],
      };
    });
    setSelected(null);
  };
  const redo = () => {
    if (readonly) return;
    setHistory((h) => {
      if (!h.future.length) return h;
      setProject(h.future[0]);
      return { past: [...h.past, current.current], future: h.future.slice(1) };
    });
  };
  const deleteSelection = () => {
    if (readonly) return;
    if (selected) {
      commit((p) => {
        const m = p.maps.find((m) => m.id === map.id),
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
    let copied;
    commit((p) => {
      copied = duplicateNode(p, map.id, node, node.x + 80, node.y + 80, node.z);
      return p;
    });
    setSelected(copied.id);
  };
  useEffect(() => {
    const listener = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.key === "Escape") {
        setPending(null);
        setSelected(null);
        setSelectedEdge(null);
        setModal(null);
      }
      if (readonly) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelection();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && node) {
        setClipboard(structuredClone(node));
        notify("节点已复制");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && clipboard) {
        e.preventDefault();
        if (
          !(
            map.kind === "world"
              ? ["town", "region"]
              : [
                  "battle",
                  "shop",
                  "rest",
                  "checkpoint",
                  "chest",
                  "entrance",
                  "exit",
                ]
          ).includes(clipboard.type)
        ) {
          notify("该节点类型不适用于当前地图");
          return;
        }
        let copied;
        commit((p) => {
          copied = duplicateNode(
            p,
            map.id,
            clipboard,
            clipboard.x + 80,
            clipboard.y + 80,
            layer,
          );
          return p;
        });
        setSelected(copied.id);
      }
      if (e.key === "v") setTool("select");
      if (e.key === "h") setTool("hand");
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });
  const addNode = (type) => {
    if (readonly) return;
    const r = canvas.current.getBoundingClientRect();
    const n = newNode(
      type,
      Math.round((r.width * 0.45 - view.x) / view.k / 20) * 20,
      Math.round((r.height * 0.45 - view.y) / view.k / 20) * 20,
      map.kind === "world" ? 0 : layer,
    );
    commit((p) => {
      const m = p.maps.find((m) => m.id === map.id);
      m.nodes.push(n);
      if (type === "region") {
        const area = {
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
    setSelected(n.id);
    setSelectedEdge(null);
  };
  const fit = () => {
    const nodes = visibleNodes.filter((n) => n.z === layer);
    if (!nodes.length) {
      setView({ x: 80, y: 60, k: 1 });
      return;
    }
    const r = canvas.current.getBoundingClientRect(),
      minX = Math.min(...nodes.map((n) => n.x)) - 100,
      maxX = Math.max(...nodes.map((n) => n.x)) + 100,
      minY = Math.min(...nodes.map((n) => n.y)) - 110,
      maxY = Math.max(...nodes.map((n) => n.y)) + 110,
      k = Math.min(
        1.4,
        (r.width - 100) / (maxX - minX),
        (r.height - 130) / (maxY - minY),
      );
    setView({
      k,
      x: (r.width - (maxX - minX) * k) / 2 - minX * k,
      y: (r.height - (maxY - minY) * k) / 2 - minY * k,
    });
  };
  const onNode = (id) => {
    if (didDrag.current) return;
    if (!playing) {
      setSelected(id);
      setSelectedEdge(null);
      return;
    }
    const result = visit(project, map.id, id, activeProgress);
    setProgress(result.state);
    if (result.error) notify(result.error);
    if (result.mapId !== map.id) {
      changeMap(result.mapId);
      const dest = project.maps
        .find((m) => m.id === result.mapId)
        ?.nodes.find((n) => n.id === result.state.current);
      setLayer(dest?.z || 0);
    } else setSelected(id);
  };
  const connect = (id, port) => {
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
  const pointerDown = (e, id) => {
    if (e.button !== 0 && e.button !== 1) return;
    if (e.target.closest("button")) return;
    if (id && readonly) {
      e.stopPropagation();
      return;
    }
    if (id && tool !== "hand" && !readonly) {
      e.stopPropagation();
      gesture.current = {
        kind: "node",
        id,
        sx: e.clientX,
        sy: e.clientY,
        x: map.nodes.find((n) => n.id === id).x,
        y: map.nodes.find((n) => n.id === id).y,
        original: structuredClone(project),
      };
    } else if (!id || tool === "hand" || e.button === 1) {
      if (!id) {
        setSelected(null);
        setSelectedEdge(null);
      }
      gesture.current = {
        kind: "pan",
        sx: e.clientX,
        sy: e.clientY,
        x: view.x,
        y: view.y,
      };
    } else return;
    didDrag.current = false;
    canvas.current.setPointerCapture(e.pointerId);
    setDrag(true);
  };
  const pointerMove = (e) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.sx,
      dy = e.clientY - g.sy;
    if (Math.hypot(dx, dy) > 3) didDrag.current = true;
    if (g.kind === "pan") setView((v) => ({ ...v, x: g.x + dx, y: g.y + dy }));
    else
      setProject((p) => ({
        ...p,
        maps: p.maps.map((m) =>
          m.id !== map.id
            ? m
            : {
                ...m,
                nodes: m.nodes.map((n) =>
                  n.id !== g.id
                    ? n
                    : {
                        ...n,
                        x: Math.round((g.x + dx / view.k) / 10) * 10,
                        y: Math.round((g.y + dy / view.k) / 10) * 10,
                      },
                ),
              },
        ),
      }));
  };
  const pointerUp = (e) => {
    const g = gesture.current;
    if (g?.kind === "node") {
      if (didDrag.current)
        setHistory((h) => ({
          past: [...h.past, g.original].slice(-80),
          future: [],
        }));
      else {
        setSelected(g.id);
        setSelectedEdge(null);
      }
    }
    gesture.current = null;
    setDrag(false);
    setTimeout(() => {
      didDrag.current = false;
    }, 0);
  };
  const zoom = (factor, x, y) =>
    setView((v) => {
      const r = canvas.current.getBoundingClientRect(),
        px = x ?? r.width / 2,
        py = y ?? r.height / 2,
        k = Math.max(0.2, Math.min(2.5, v.k * factor));
      return {
        x: px - ((px - v.x) * k) / v.k,
        y: py - ((py - v.y) * k) / v.k,
        k,
      };
    });
  useEffect(() => {
    const el = canvas.current;
    const fn = (e) => {
      if (three) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoom(Math.exp(-e.deltaY * 0.001), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", fn, { passive: false });
    return () => el.removeEventListener("wheel", fn);
  }, [three]);
  const exportFile = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `${project.name}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("地图已导出");
  };
  const importFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      if (f.size > 10 * 1024 * 1024) throw Error("文件不能超过 10 MB");
      const p = parseProject(await f.text());
      commit(p);
      changeMap(p.maps.find((m) => m.kind === "world").id);
      setProgress(blankProgress());
      notify("导入成功，可撤销恢复原地图");
    } catch (err) {
      notify(`导入失败：${err.message}`);
    }
    e.target.value = "";
  };
  const togglePlay = () => {
    setPlaying(!playing);
    setSelected(null);
    setSelectedEdge(null);
    setPending(null);
    if (!playing) {
      setProgress(settle(project, blankProgress()));
      changeMap(world.id);
      notify("预览已开始：点击起点开始探索");
    }
  };
  const status = (n) =>
    activeProgress.completed.includes(n.id)
      ? "已完成"
      : !activeProgress.discovered.includes(n.id)
        ? "未发现"
        : activeProgress.unlocked.includes(n.id)
          ? "可进入"
          : "已锁定";
  return (
    <div className="app">
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
            title="导入地图 JSON"
            disabled={playing}
            onClick={() => importer.current.click()}
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
      <div className="workspace">
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
                      n.mapId === m.id &&
                      activeProgress.completed.includes(n.id),
                  );
                return (
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
                );
              })}
          </nav>
          <div className="sidebar-section">
            <div className="section-label">
              {playing ? "探索状态" : "添加节点"}
              {!playing && <span>点击创建</span>}
            </div>
            {playing ? (
              <>
                <div className="progress-stat">
                  <strong>
                    {
                      map.nodes.filter((n) =>
                        activeProgress.completed.includes(n.id),
                      ).length
                    }
                    <span> / {map.nodes.length}</span>
                  </strong>
                  <small>当前地图已完成</small>
                </div>
                <div className="key-list">
                  {project.keys.map((k) => (
                    <div
                      key={k.id}
                      className={
                        activeProgress.keys.includes(k.id) ? "owned" : ""
                      }
                    >
                      <KeyRound size={14} />
                      {k.name}
                      {activeProgress.keys.includes(k.id) && (
                        <Check size={13} />
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  className="wide"
                  title="打开预览调试"
                  onClick={() => setModal("debug")}
                >
                  <Settings2 size={15} />
                  预览调试
                </Button>
                <Button
                  className="wide"
                  title="重置预览"
                  onClick={() => {
                    setProgress(settle(project, blankProgress()));
                    changeMap(world.id);
                    notify("探索状态已重置");
                  }}
                >
                  <RotateCcw size={15} />
                  重置预览
                </Button>
                <div className="event-log">
                  {activeProgress.log.slice(0, 5).map((s, i) => (
                    <p key={i}>{s}</p>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="palette">
                  {(map.kind === "world"
                    ? ["town", "region"]
                    : [
                        "battle",
                        "shop",
                        "rest",
                        "checkpoint",
                        "chest",
                        "entrance",
                        "exit",
                      ]
                  ).map((type) => {
                    const Icon = ICONS[type];
                    return (
                      <button
                        key={type}
                        disabled={three}
                        onClick={() => addNode(type)}
                      >
                        <Icon size={19} style={{ color: colors[type] }} />
                        <span>{TYPES[type]}</span>
                        <Plus size={12} />
                      </button>
                    );
                  })}
                </div>
                <p className="sidebar-hint">
                  悬停节点显示吸附点
                  <br />
                  点击两个吸附点创建连线
                </p>
              </>
            )}
          </div>
          <div className="sidebar-bottom">
            <button onClick={() => setModal("validation")}>
              <CheckCircle2 size={16} />
              地图校验
              <ChevronRight size={14} />
            </button>
            <button onClick={() => setModal("help")}>
              <CircleHelp size={16} />
              操作指南<span>?</span>
            </button>
            <div className="version">
              NODE ATLAS <span>v1.0</span>
            </div>
          </div>
        </aside>
        <main>
          <div className="canvas-header">
            <div className="breadcrumb">
              <Globe2 size={15} />
              <button onClick={() => changeMap(world.id)}>世界地图</button>
              {map.kind === "area" && (
                <>
                  <ChevronRight size={13} />
                  <strong>{map.name}</strong>
                </>
              )}
              <span className="mode-tag">
                {playing ? "游玩预览" : "编辑模式"}
              </span>
            </div>
            <div className="view-toggle">
              <Button
                active={!three}
                title="平面视图"
                onClick={() => setThree(false)}
              >
                <Layers3 size={15} />
                2D 平面
              </Button>
              <Button
                active={three}
                title="3D 预览"
                onClick={() => {
                  setThree(true);
                  setPending(null);
                }}
              >
                <Box size={15} />
                3D 预览
              </Button>
            </div>
          </div>
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
                progress={activeProgress}
                playing={playing}
                onSelect={onNode}
              />
            ) : (
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
                  <g
                    transform={`translate(${view.x} ${view.y}) scale(${view.k})`}
                  >
                    {edges.map((e) => {
                      const a = visibleNodes.find((n) => n.id === e.a),
                        b = visibleNodes.find((n) => n.id === e.b);
                      if (!a || !b || (a.z !== layer && b.z !== layer))
                        return null;
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
                                selectedEdge === e.id
                                  ? "edge selected"
                                  : "edge cross"
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
                                  x:
                                    canvas.current.clientWidth / 2 -
                                    remote.x * v.k,
                                  y:
                                    canvas.current.clientHeight / 2 -
                                    remote.y * v.k,
                                }));
                              }}
                            >
                              <rect
                                x={tx - 66}
                                y={ty - 13}
                                width="132"
                                height="27"
                                rx="13"
                              />
                              <text x={tx} y={ty + 5} textAnchor="middle">
                                ↗ Z{remote.z > 0 ? "+" : ""}
                                {remote.z} · {remote.name.slice(0, 7)}
                              </text>
                            </g>
                          </g>
                        );
                      }
                      const pts = route(a, b, e.ap, e.bp),
                        d = pts
                          .map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`)
                          .join(" ");
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
                    {visibleNodes
                      .filter((n) => n.z === layer)
                      .map((n) => {
                        const Icon = ICONS[n.type],
                          locked =
                            playing && !activeProgress.unlocked.includes(n.id),
                          done =
                            playing && activeProgress.completed.includes(n.id);
                        return (
                          <g
                            key={n.id}
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
                            style={{ "--node-color": colors[n.type] }}
                            onPointerDown={(e) => pointerDown(e, n.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onNode(n.id);
                            }}
                          >
                            <rect
                              className="selection-halo"
                              x="-30"
                              y="-30"
                              width="60"
                              height="60"
                              rx="7"
                              transform="rotate(45)"
                            />
                            <rect
                              className="diamond"
                              x="-24"
                              y="-24"
                              width="48"
                              height="48"
                              rx="5"
                              transform="rotate(45)"
                            />
                            {locked ? (
                              <LockKeyhole x={-11} y={-11} size={22} />
                            ) : (
                              <Icon x={-12} y={-12} size={24} />
                            )}
                            <text
                              y="62"
                              textAnchor="middle"
                              className="node-name"
                            >
                              {n.name}
                            </text>
                            <text
                              y="79"
                              textAnchor="middle"
                              className="node-type"
                            >
                              {n.start ? "起始节点" : TYPES[n.type]}
                              {done ? " · 已完成" : ""}
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
                                <Check
                                  x="-6"
                                  y="-6"
                                  size={12}
                                  color="#183b2c"
                                />
                              </g>
                            )}
                            {!readonly &&
                              Object.entries(ports).map(([port, [x, y]]) => (
                                <circle
                                  key={port}
                                  cx={x}
                                  cy={y}
                                  r="6"
                                  className={`port ${pending?.id === n.id && pending.port === port ? "pending" : ""} ${pending ? "show" : ""}`}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    connect(n.id, port);
                                  }}
                                >
                                  <title>{port} 吸附点</title>
                                </circle>
                              ))}
                          </g>
                        );
                      })}
                  </g>
                </svg>
              </>
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
              <div className="toolbar">
                <Button
                  active={tool === "select"}
                  title="选择工具 (V)"
                  onClick={() => setTool("select")}
                >
                  <MousePointer2 size={18} />
                </Button>
                <Button
                  active={tool === "hand"}
                  title="拖拽画布 (H)"
                  onClick={() => setTool("hand")}
                >
                  <Hand size={18} />
                </Button>
                <span />
                <Button
                  title="撤销 (Ctrl+Z)"
                  disabled={readonly || !history.past.length}
                  onClick={undo}
                >
                  <Undo2 size={17} />
                </Button>
                <Button
                  title="重做 (Ctrl+Shift+Z)"
                  disabled={readonly || !history.future.length}
                  onClick={redo}
                >
                  <Redo2 size={17} />
                </Button>
              </div>
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
              <div className="layer-control">
                <div>
                  <Layers3 size={15} />
                  <span>楼层</span>
                </div>
                <Button title="进入上一层" onClick={() => setLayer(layer + 1)}>
                  <Plus size={15} />
                </Button>
                <select
                  aria-label="当前楼层"
                  value={layer}
                  onChange={(e) => setLayer(Number(e.target.value))}
                >
                  {layers.map((z) => (
                    <option key={z} value={z}>
                      Z {z > 0 ? "+" : ""}
                      {z}
                    </option>
                  ))}
                </select>
                <Button title="进入下一层" onClick={() => setLayer(layer - 1)}>
                  <Minus size={15} />
                </Button>
                <input
                  aria-label="跳转楼层"
                  title="输入任意整数层"
                  type="number"
                  value={layer}
                  onChange={(e) => {
                    const z = Number(e.target.value);
                    if (Number.isInteger(z)) setLayer(z);
                  }}
                />
              </div>
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
            {!three && (
              <div className="zoom-control">
                <Button title="缩小" onClick={() => zoom(0.85)}>
                  <Minus size={16} />
                </Button>
                <span>{Math.round(view.k * 100)}%</span>
                <Button title="放大" onClick={() => zoom(1.18)}>
                  <Plus size={16} />
                </Button>
                <i />
                <Button title="适应画布" onClick={fit}>
                  <Scan size={17} />
                </Button>
              </div>
            )}
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
            {(node || edge) && (
              <aside
                className="drawer"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="drawer-header">
                  <span>
                    <Settings2 size={16} />
                    {readonly ? "节点详情" : "参数配置"}
                  </span>
                  <Button
                    title="关闭参数"
                    onClick={() => {
                      setSelected(null);
                      setSelectedEdge(null);
                    }}
                  >
                    <X size={17} />
                  </Button>
                </div>
                {node ? (
                  <>
                    <div className="node-heading">
                      <span style={{ color: colors[node.type] }}>
                        {React.createElement(ICONS[node.type], { size: 26 })}
                      </span>
                      <div>
                        <h3>{node.name}</h3>
                        <small>
                          {TYPES[node.type]} ·{" "}
                          {map.kind === "world" ? "世界节点" : `Z ${node.z}`}
                        </small>
                      </div>
                    </div>
                    {playing ? (
                      <div className="drawer-section">
                        <label>探索状态</label>
                        <div className="status-grid">
                          {[
                            ["发现", "discovered"],
                            ["解锁", "unlocked"],
                            ["到达", "reached"],
                            ["完成", "completed"],
                          ].map(([title, key]) => (
                            <span
                              key={key}
                              className={
                                activeProgress[key].includes(node.id)
                                  ? "yes"
                                  : ""
                              }
                            >
                              <Check size={13} />
                              {title}
                            </span>
                          ))}
                        </div>
                        <p className="muted small">{status(node)}</p>
                        <Button
                          className="primary wide"
                          disabled={!activeProgress.unlocked.includes(node.id)}
                          title="到达此节点"
                          onClick={() => onNode(node.id)}
                        >
                          <MapPin size={15} />
                          到达此节点
                        </Button>
                      </div>
                    ) : (
                      <>
                        <fieldset disabled={readonly}>
                          <div className="drawer-section">
                            <label>节点名称</label>
                            <input
                              value={node.name}
                              onChange={(e) =>
                                updateNode({ name: e.target.value })
                              }
                            />
                            <div className="field-row">
                              <div>
                                <label>节点类型</label>
                                <div className="static-field">
                                  {TYPES[node.type]}
                                </div>
                              </div>
                              <div>
                                <label>所在楼层</label>
                                <input
                                  type="number"
                                  disabled={map.kind === "world"}
                                  value={node.z}
                                  onChange={(e) => {
                                    const z = Number(e.target.value);
                                    if (Number.isInteger(z)) {
                                      updateNode({ z });
                                      setLayer(z);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            {map.kind === "world" && (
                              <label className="check-label">
                                <input
                                  type="checkbox"
                                  checked={node.start}
                                  onChange={(e) =>
                                    updateNode({ start: e.target.checked })
                                  }
                                />
                                设为起始节点
                              </label>
                            )}
                            {node.type === "entrance" && (
                              <label className="check-label">
                                <input
                                  type="checkbox"
                                  checked={map.defaultEntry === node.id}
                                  onChange={(e) =>
                                    updateMap(
                                      (m) =>
                                        (m.defaultEntry = e.target.checked
                                          ? node.id
                                          : undefined),
                                    )
                                  }
                                />
                                作为区域默认入口
                              </label>
                            )}
                          </div>
                        </fieldset>
                        {node.type === "region" && (
                          <div className="drawer-section">
                            <label>关联的二级地图</label>
                            <div className="linked-map">
                              <Layers3 size={16} />
                              <span>
                                {project.maps.find((m) => m.id === node.mapId)
                                  ?.name || "未关联"}
                              </span>
                              <Button
                                title="进入二级地图"
                                onClick={() => {
                                  if (node.mapId) changeMap(node.mapId);
                                }}
                              >
                                <ArrowUpRight size={16} />
                              </Button>
                            </div>
                          </div>
                        )}
                        <fieldset disabled={readonly}>
                          {node.type === "exit" && (
                            <div className="drawer-section">
                              <label>出口目标 · 世界节点</label>
                              <select
                                value={node.target || ""}
                                onChange={(e) =>
                                  updateNode({
                                    target: e.target.value,
                                    targetEntry: "",
                                  })
                                }
                              >
                                <option value="">选择目标…</option>
                                {world.nodes.map((n) => (
                                  <option key={n.id} value={n.id}>
                                    {n.name} · {TYPES[n.type]}
                                  </option>
                                ))}
                              </select>
                              {world.nodes.find((n) => n.id === node.target)
                                ?.type === "region" && (
                                <>
                                  <label>目标入口</label>
                                  <select
                                    value={node.targetEntry || ""}
                                    onChange={(e) =>
                                      updateNode({
                                        targetEntry: e.target.value,
                                      })
                                    }
                                  >
                                    <option value="">选择入口…</option>
                                    {project.maps
                                      .find(
                                        (m) =>
                                          m.id ===
                                          world.nodes.find(
                                            (n) => n.id === node.target,
                                          )?.mapId,
                                      )
                                      ?.nodes.filter(
                                        (n) => n.type === "entrance",
                                      )
                                      .map((n) => (
                                        <option key={n.id} value={n.id}>
                                          {n.name}
                                        </option>
                                      ))}
                                  </select>
                                </>
                              )}
                              <p className="muted small">
                                对应世界路线自动生成。
                              </p>
                            </div>
                          )}
                          {["battle", "chest"].includes(node.type) && (
                            <div className="drawer-section">
                              <label>
                                <KeyRound size={14} />
                                完成奖励
                              </label>
                              {project.keys.map((k) => (
                                <label key={k.id} className="check-label">
                                  <input
                                    type="checkbox"
                                    checked={node.rewards.includes(k.id)}
                                    onChange={(e) =>
                                      updateNode({
                                        rewards: e.target.checked
                                          ? [...node.rewards, k.id]
                                          : node.rewards.filter(
                                              (id) => id !== k.id,
                                            ),
                                      })
                                    }
                                  />
                                  {k.name}
                                </label>
                              ))}
                              <Button
                                className="text-button"
                                title="管理钥匙"
                                onClick={() => setModal("settings")}
                              >
                                管理钥匙 <ArrowUpRight size={13} />
                              </Button>
                            </div>
                          )}
                          <div className="drawer-section">
                            <label>
                              <EyeOff size={14} />
                              显示条件
                            </label>
                            <p className="muted small">
                              满足后发现节点，已发现状态永久保留。
                            </p>
                            <ConditionEditor
                              value={node.show}
                              project={project}
                              onChange={(show) => updateNode({ show })}
                            />
                          </div>
                          <div className="drawer-section">
                            <label>
                              <LockKeyhole size={14} />
                              进入条件
                            </label>
                            <p className="muted small">
                              可见但未解锁时显示锁定图标。
                            </p>
                            <ConditionEditor
                              value={node.enter}
                              project={project}
                              onChange={(enter) => updateNode({ enter })}
                            />
                          </div>
                        </fieldset>
                        {!readonly && (
                          <div className="drawer-footer">
                            <Button title="复制节点" onClick={duplicate}>
                              <Copy size={15} />
                              复制
                            </Button>
                            <Button
                              className="danger"
                              title="删除节点"
                              onClick={deleteSelection}
                            >
                              <Trash2 size={15} />
                              删除节点
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  edge && (
                    <div className="drawer-section">
                      <h3>连线设置</h3>
                      <p>
                        {map.nodes.find((n) => n.id === edge.a)?.name} →{" "}
                        {map.nodes.find((n) => n.id === edge.b)?.name}
                      </p>
                      {edge.generated ? (
                        <p className="muted">
                          由二级地图出口自动生成，请到对应出口修改目标。
                        </p>
                      ) : (
                        <>
                          <label>通行方向</label>
                          <select
                            disabled={readonly}
                            value={String(edge.directed)}
                            onChange={(e) =>
                              updateMap(
                                (m) =>
                                  (m.edges.find(
                                    (x) => x.id === edge.id,
                                  ).directed = e.target.value === "true"),
                              )
                            }
                          >
                            <option value="false">双向通行</option>
                            <option value="true">单向：起点 → 终点</option>
                          </select>
                          <Button
                            disabled={readonly}
                            className="danger wide"
                            title="删除连线"
                            onClick={deleteSelection}
                          >
                            <Trash2 size={15} />
                            删除连线
                          </Button>
                        </>
                      )}
                    </div>
                  )
                )}
              </aside>
            )}
          </div>
          <footer>
            <span>
              <span className="online-dot" />
              {playing ? "预览会话" : "本地工作区"}
            </span>
            <span>
              {map.nodes.length} 个节点 <i /> {edges.length} 条连线 <i />{" "}
              {map.kind === "world"
                ? "单层世界地图"
                : `${new Set(map.nodes.map((n) => n.z)).size} 个使用中的楼层`}
            </span>
            <span>
              {three ? "3D · 只读" : playing ? "PREVIEW" : "2D · EDITOR"}
            </span>
          </footer>
        </main>
      </div>
      <input
        hidden
        type="file"
        accept=".json,application/json"
        ref={importer}
        onChange={importFile}
      />
      {toast && (
        <div role="status" className="toast">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "help"
                ? "操作指南"
                : modal === "validation"
                  ? "地图校验"
                  : modal === "debug"
                    ? "预览调试"
                    : "项目设置"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-title">
              <h2>
                {modal === "help"
                  ? "操作指南"
                  : modal === "validation"
                    ? "地图校验"
                    : modal === "debug"
                      ? "预览调试"
                      : "项目设置"}
              </h2>
              <Button title="关闭" onClick={() => setModal(null)}>
                <X size={19} />
              </Button>
            </div>
            {modal === "settings" ? (
              <>
                <Button
                  disabled={readonly}
                  className="wide"
                  title="新建空白项目"
                  onClick={() => {
                    commit(blankProject());
                    changeMap("world");
                    setProgress(blankProgress());
                    setModal(null);
                    notify("已新建空白项目，可撤销恢复上一项目");
                  }}
                >
                  <Plus size={15} />
                  新建空白项目
                </Button>
                <p className="muted small">
                  新建会替换当前工作区，可通过撤销恢复。建议先导出备份。
                </p>
                <label>项目名称</label>
                <input
                  disabled={readonly}
                  value={project.name}
                  onChange={(e) =>
                    commit((p) => ({ ...p, name: e.target.value }))
                  }
                />
                {map.kind === "area" && (
                  <>
                    <label>当前区域名称</label>
                    <input
                      disabled={readonly}
                      value={map.name}
                      onChange={(e) =>
                        commit((p) => {
                          p.maps.find((m) => m.id === map.id).name =
                            e.target.value;
                          const parent = p.maps
                            .find((m) => m.kind === "world")
                            .nodes.find((n) => n.mapId === map.id);
                          if (parent) parent.name = e.target.value;
                          return p;
                        })
                      }
                    />
                  </>
                )}
                <h3>钥匙资源</h3>
                {project.keys.map((k) => (
                  <div className="key-resource" key={k.id}>
                    <KeyRound size={16} />
                    <input
                      aria-label="钥匙名称"
                      disabled={readonly}
                      value={k.name}
                      onChange={(e) =>
                        commit((p) => {
                          p.keys.find((x) => x.id === k.id).name =
                            e.target.value;
                          return p;
                        })
                      }
                    />
                    <Button
                      disabled={readonly}
                      title="删除钥匙"
                      onClick={() =>
                        commit((p) => {
                          p.keys = p.keys.filter((x) => x.id !== k.id);
                          for (const n of allNodes(p))
                            n.rewards = n.rewards.filter((id) => id !== k.id);
                          return p;
                        })
                      }
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                ))}
                <div className="field-row">
                  <input
                    disabled={readonly}
                    placeholder="新钥匙名称"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                  />
                  <Button
                    disabled={readonly || !keyName.trim()}
                    title="添加钥匙"
                    onClick={() => {
                      commit((p) => ({
                        ...p,
                        keys: [...p.keys, { id: uid(), name: keyName.trim() }],
                      }));
                      setKeyName("");
                    }}
                  >
                    <Plus size={16} />
                    添加
                  </Button>
                </div>
                <p className="muted small">
                  删除被条件引用的资源后，可通过地图校验定位需要修复的条件。
                </p>
              </>
            ) : modal === "debug" ? (
              <>
                <p className="muted">
                  即时调整当前预览的钥匙。已发现和已解锁状态不会因移除钥匙而撤销。
                </p>
                {project.keys.map((k) => (
                  <label className="check-label" key={k.id}>
                    <input
                      type="checkbox"
                      checked={activeProgress.keys.includes(k.id)}
                      onChange={(e) =>
                        setProgress((s) => ({
                          ...activeProgress,
                          keys: e.target.checked
                            ? [...activeProgress.keys, k.id]
                            : activeProgress.keys.filter((id) => id !== k.id),
                        }))
                      }
                    />
                    {k.name}
                  </label>
                ))}
                <Button
                  title="重置全部探索状态"
                  className="wide"
                  onClick={() => {
                    setProgress(blankProgress());
                    changeMap(world.id);
                    setModal(null);
                  }}
                >
                  <RotateCcw size={16} />
                  重置全部探索状态
                </Button>
              </>
            ) : modal === "validation" ? (
              <>
                {validate(project).length ? (
                  <>
                    <p className="muted">
                      发现 {validate(project).length} 项需要检查的配置
                    </p>
                    <div className="validation-list">
                      {validate(project).map((s, i) => (
                        <p key={i}>
                          <AlertTriangle size={16} />
                          {s}
                        </p>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="validation-ok">
                    <CheckCircle2 size={42} />
                    <h3>基础校验通过</h3>
                    <p>入口、出口、引用和结构可达性正常。</p>
                  </div>
                )}
                <p className="muted small">
                  结构校验不推断任意条件组合是否可解，请结合游玩预览检查路线。
                </p>
              </>
            ) : (
              <div className="help">
                <p>
                  <b>创建与布局</b>
                  点击左侧类型添加节点，拖动节点调整位置。悬停后点击吸附点，再点击目标吸附点完成连接。
                </p>
                <p>
                  <b>跨层连接</b>
                  选中起始吸附点后切换楼层，点击另一节点吸附点。点击路线上的楼层标记可以跳转。
                </p>
                <p>
                  <b>键盘</b>V 选择 · H 平移 · Delete 删除 · Ctrl+C / V 复制粘贴
                  · Ctrl+Z 撤销 · Ctrl+Shift+Z 重做 · Esc 取消。
                </p>
                <p>
                  <b>游玩预览</b>
                  从任意开放起点进入，到达即完成。已完成节点可以直接返回。区域出口自动跳转，侧栏可随时返回世界地图。
                </p>
                <p>
                  <b>3D 视图</b>
                  左键旋转、滚轮缩放、右键平移。编辑模式只读；游玩模式可点击开放节点继续探索。
                </p>
                <p>
                  <b>保存</b>地图自动保存在当前浏览器。使用 JSON
                  导出备份，导入可撤销。预览进度仅用于当前会话。
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
