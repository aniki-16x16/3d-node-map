import { Plus, X } from "lucide-react";
import { emptyCondition } from "../../domain";
import type {
  Condition,
  ConditionGroup,
  ConditionRule,
  Project,
} from "../../domain/types";
import Button from "../ui/Button";
export default function ConditionEditor({
  value,
  onChange,
  project,
  depth = 0,
}: {
  value: ConditionGroup;
  onChange: (value: ConditionGroup) => void;
  project: Project;
  depth?: number;
}) {
  const update = (i: number, r: Condition) =>
    onChange({ ...value, rules: value.rules.map((x, j) => (i === j ? r : x)) });
  return (
    <div className="condition">
      <div className="condition-head">
        <select
          aria-label="条件组合"
          value={value.op}
          onChange={(e) =>
            onChange({ ...value, op: e.target.value as ConditionGroup["op"] })
          }
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
                  update(i, {
                    ...r,
                    type: e.target.value as ConditionRule["type"],
                    ref: "",
                  })
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
