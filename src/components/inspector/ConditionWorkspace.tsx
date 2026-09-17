import { useState } from "react";
import { KeyRound, MousePointer2, Plus, Trash2, X } from "lucide-react";
import type { EditorController } from "../../hooks/useEditorController";
import type { ConditionCard, ConditionGroup } from "../../domain/types";
import { availableKeys } from "../../domain/project";
import { addConditionRules } from "../../domain/conditions";
import { conditionLabel } from "./ConditionEditor";
import Button from "../ui/Button";
import Select from "../ui/Select";

type Props = Pick<EditorController, "project" | "conditionSession" | "changeConditions" | "setConditionField" | "startConditionPick" | "setConditionPicked" | "cancelConditionPick" | "acceptConditionPick" | "closeConditions">;
function Join({value, onChange, label}: {value: "all" | "any"; onChange: (value: "all" | "any") => void; label: string}) {
 return <div className="condition-connector"><span /><Select aria-label={label} value={value} onChange={(e) => onChange(e.target.value as "all" | "any")}><option value="all">并且 · 全部满足</option><option value="any">或者 · 任一满足</option></Select><span /></div>;
}
export default function ConditionWorkspace({project, conditionSession: session, changeConditions, setConditionField, startConditionPick, setConditionPicked, cancelConditionPick, acceptConditionPick, closeConditions}: Props) {
 const [keyCard, setKeyCard] = useState<number | null>(null);
 const [keys, setKeys] = useState<string[]>([]);
 const [query, setQuery] = useState("");
 const [scope, setScope] = useState("all");
 if (!session) return null;
 const value = session.draft[session.field];
 const picking = session.pickCard !== null;
 const busy = picking || keyCard !== null;
 const updateCard = (index: number, card: ConditionCard) => changeConditions({...value, groups: value.groups.map((g, i) => i === index ? card : g)});
 const updateOuter = (op: ConditionGroup["op"]) => changeConditions({...value, op});
 const matchingKeys = availableKeys(project, session.mapId).filter((k) => (scope === "all" || (scope === "global" ? k.mapId === null : k.mapId === session.mapId)) && k.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 return <aside className="condition-workspace canvas-ui" aria-label="条件编辑器">
   <header className="condition-workspace-header"><div><small>条件编辑</small><h2>{session.name}</h2></div><Button title="取消条件编辑" onClick={() => closeConditions(false)}><X size={18} /></Button></header>
   <div className="condition-tabs" role="tablist" aria-label="条件用途">{(["show", "enter"] as const).map((field) => <button key={field} role="tab" aria-selected={session.field === field} onClick={() => {setConditionField(field); setKeyCard(null); setKeys([]);}}>{field === "show" ? "显示条件" : "进入条件"}</button>)}</div>
   <p className="condition-workspace-hint">{session.field === "show" ? "满足后发现节点，已发现状态永久保留。" : "满足后解锁节点，已解锁状态永久保留。"} 同层连接方式统一，修改一处会同步该层。</p>
   <div className="condition-card-list">
   {!value.groups.length && <div className="condition-empty">目前无限制。添加分组后配置钥匙或节点条件。</div>}
   {value.groups.map((card, index) => <div key={index}>
     {index > 0 && <fieldset disabled={busy}><Join value={value.op} onChange={updateOuter} label="分组之间的连接方式" /></fieldset>}
     <section className={"condition-card " + (session.pickCard === index || keyCard === index ? "is-picking" : "")}>
       <header><strong>条件组 {index + 1}</strong><Button title="删除条件组" disabled={busy} onClick={() => changeConditions({...value, groups: value.groups.filter((_, i) => i !== index)})}><Trash2 size={15} /></Button></header>
       {!card.rules.length && <p className="muted small">添加条件；空分组保存时自动移除。</p>}
       {card.rules.map((rule, ruleIndex) => <div key={rule.type + rule.ref}>
         {ruleIndex > 0 && <fieldset disabled={busy}><Join value={card.op} onChange={(op) => updateCard(index, {...card, op})} label={"条件组 " + (index + 1) + " 内的连接方式"} /></fieldset>}
         <div className="condition-item"><span>{conditionLabel(rule, project)}</span><Button title="移除条件" disabled={busy} onClick={() => updateCard(index, {...card, rules: card.rules.filter((_, i) => i !== ruleIndex)})}><X size={14} /></Button></div>
       </div>)}
       <div className="condition-add-actions"><Button title="添加钥匙条件" disabled={busy} onClick={() => {setKeyCard(index); setKeys([]); setQuery(""); setScope("all");}}><KeyRound size={15} />添加钥匙</Button><Button title="从画布批量添加节点" disabled={busy} onClick={() => startConditionPick(index)}><MousePointer2 size={15} />添加节点</Button></div>
       {keyCard === index && <div className="condition-inline-picker">
         <strong>选择钥匙</strong><input aria-label="搜索条件钥匙" placeholder="搜索钥匙名称…" value={query} onChange={(e) => setQuery(e.target.value)} />
         <Select aria-label="条件钥匙范围" value={scope} onChange={(e) => setScope(e.target.value)}><option value="all">全部可用钥匙</option><option value="global">世界钥匙</option><option value="local">当前区域钥匙</option></Select>
         <div className="condition-key-options">{matchingKeys.map((key) => { const exists = card.rules.some((r) => r.type === "key" && r.ref === key.id); return <label className="check-label" key={key.id}><input type="checkbox" disabled={exists} checked={exists || keys.includes(key.id)} onChange={(e) => setKeys(e.target.checked ? [...keys, key.id] : keys.filter((id) => id !== key.id))} /><span>{key.name || "未命名钥匙"} · {key.mapId === null ? "世界" : "局部"}{exists ? "（已添加）" : ""}</span></label>;})}{!matchingKeys.length && <p className="muted small">没有匹配的可用钥匙。</p>}</div>
         <div className="condition-add-actions"><Button title="取消钥匙选择" onClick={() => setKeyCard(null)}>取消</Button><Button title="添加所选钥匙" disabled={!keys.length} onClick={() => {updateCard(index, addConditionRules(card, "key", keys)); setKeyCard(null);}}>添加 {keys.length} 把钥匙</Button></div>
       </div>}
     </section>
   </div>)}
   <Button title="添加条件分组" className="condition-add-group" disabled={busy} onClick={() => changeConditions({...value, groups: [...value.groups, {op: "all", rules: []}]})}><Plus size={16} />添加分组</Button>
   </div>
   {picking && <section className="condition-pick-tray" aria-label="待添加节点">
     <strong>条件组 {session.pickCard! + 1} · 已选 {session.picked.length} 个节点</strong>
     <p className="muted small">点击单选，空白处框选，Ctrl 点击追加；中键拖动画布。切换地图或楼层会保留其他位置的选择。</p>
     <div className="condition-picked-list">{session.picked.map((id) => <div className="condition-item" key={id}><span>{conditionLabel({type: "visited", ref: id}, project)}</span><Button title="移除待选节点" onClick={() => setConditionPicked(session.picked.filter((key) => key !== id))}><X size={14} /></Button></div>)}</div>
     <div className="condition-add-actions"><Button title="取消节点拾取" onClick={cancelConditionPick}>取消拾取</Button><Button title="添加所选节点" className="primary" disabled={!session.picked.length} onClick={acceptConditionPick}>添加这 {session.picked.length} 个节点</Button></div>
   </section>}
   <footer><Button title="取消条件修改" onClick={() => closeConditions(false)}>取消</Button><Button title="保存条件" className="primary" disabled={busy} onClick={() => closeConditions(true)}>保存条件</Button></footer>
 </aside>;
}
