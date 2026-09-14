import Select from "../ui/Select";
import { Plus, X } from "lucide-react";
import { emptyCondition, TYPES } from "../../domain";
import type {
  Condition,
  ConditionGroup,
  ConditionRule,
  Project,
} from "../../domain/types";
import { useTargetSelection } from "./TargetSelectionContext";
import Button from "../ui/Button";
export default function ConditionEditor({
  value,
  onChange,
  project,
  depth = 0,
  mapId,
}: {
  value: ConditionGroup;
  onChange: (value: ConditionGroup) => void;
  project: Project;
  mapId: string;
  depth?: number;
}) {
  const requestTarget = useTargetSelection();
  const update = (i: number, r: Condition) =>
    onChange({ ...value, rules: value.rules.map((x, j) => (i === j ? r : x)) });
  return (
    <div className="condition">
      <div className="condition-head">
        <Select
          aria-label="条件组合"
          value={value.op}
          onChange={(e) =>
            onChange({ ...value, op: e.target.value as ConditionGroup["op"] })
          }
        >
          <option value="all">满足全部条件 · AND</option>
          <option value="any">满足任一条件 · OR</option>
        </Select>
        <Button
          title="添加条件"
          onClick={() =>
            onChange({
              ...value,
              rules: [
                ...value.rules,
                {
                  type: "key",
                  ref: "",
                  not: false,
                },
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
              mapId={mapId}
              depth={depth + 1}
              onChange={(x) => update(i, x)}
            />
          ) : (
            <div className="rule-fields">
              <Select
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
              </Select>
              <Select
                aria-label="条件判断"
                value={String(r.not)}
                onChange={(e) =>
                  update(i, { ...r, not: e.target.value === "true" })
                }
              >
                <option value="false">有 / 是</option>
                <option value="true">无 / 否</option>
              </Select>
              <Button
                className="condition-target"
                title="选择条件目标"
                onClick={() =>
                  requestTarget({
                    type: r.type,
                    ref: r.ref,
                    mapId,
                    onSelect: (ref) => update(i, { ...r, ref }),
                  })
                }
              >
                {r.type === "key"
                  ? (() => {
                      const k = project.keys.find((k) => k.id === r.ref);
                      return k
                        ? `${k.name || "未命名钥匙"} · ${k.mapId === null ? "世界" : project.maps.find((m) => m.id === k.mapId)?.name}`
                        : "选择钥匙…";
                    })()
                  : (() => {
                      const m = project.maps.find((m) =>
                        m.nodes.some((n) => n.id === r.ref),
                      );
                      const n = m?.nodes.find((n) => n.id === r.ref);
                      return n
                        ? `${n.name} · ${m!.name} / Z ${n.z} · ${TYPES[n.type]}`
                        : "选择节点…";
                    })()}
              </Button>
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
