import type { ConditionGroup, ConditionRule, Project } from "../../domain/types";
import Button from "../ui/Button";
import { useConditionEditing } from "./ConditionEditingContext";
import type { ConditionField } from "../../hooks/useConditionWorkspace";
export function conditionLabel(rule: ConditionRule, project: Project): string {
 if (rule.type === "key") { const key = project.keys.find((k) => k.id === rule.ref); return "拥有钥匙：" + (key ? (key.name || "未命名钥匙") : "已失效的钥匙"); }
 const map = project.maps.find((m) => m.nodes.some((n) => n.id === rule.ref));
 const node = map?.nodes.find((n) => n.id === rule.ref);
 return node ? "已到达：" + node.name + " · " + map!.name + " / Z " + node.z : "已失效的节点";
}
export function ConditionSummary({value, project}: {value: ConditionGroup; project: Project}) {
 const groups = value.groups.filter((g) => g.rules.length);
 return <div className="condition-summary">{!groups.length ? <p className="muted small">无限制</p> : groups.map((group, i) => <div key={i}>{i > 0 && <div className="condition-join-label">{value.op === "all" ? "并且" : "或者"}</div>}<div className="condition-summary-card">{group.rules.map((rule, j) => <div key={rule.type + rule.ref}>{j > 0 && <small className="condition-join-label">{group.op === "all" ? "并且" : "或者"}</small>}<span>{conditionLabel(rule, project)}</span></div>)}</div></div>)}</div>;
}
export default function ConditionEditor({value, project, field}: {value: ConditionGroup; project: Project; field: ConditionField}) {
 const edit = useConditionEditing();
 return <><ConditionSummary value={value} project={project} /><Button title="编辑条件" onClick={() => edit(field)}>编辑条件</Button></>;
}
