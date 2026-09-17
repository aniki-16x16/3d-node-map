import { Check, KeyRound, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { allNodes, uid } from "../../domain";
import type { EditorController } from "../../hooks/useEditorController";
import Button from "../ui/Button";
import RadioGroup from "../ui/RadioGroup";

type Props = Pick<
  EditorController,
  "project" | "map" | "readonly" | "commit"
> & { selectedKeyId?: string; onSelect?: (id: string) => void };
export default function KeyManager({
  project,
  map,
  readonly,
  commit,
  selectedKeyId,
  onSelect,
}: Props) {
  const [scope, setScope] = useState(() => {
    const key = project.keys.find((k) => k.id === selectedKeyId);
    return key
      ? (key.mapId ?? project.maps.find((m) => m.kind === "world")!.id)
      : map.id;
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const selected = project.maps.find((m) => m.id === scope);
  const mapId = selected?.kind === "area" ? selected.id : null;
  const keys = project.keys.filter((k) => k.mapId === mapId);
  return (
    <>
      <RadioGroup
        label="钥匙所属地图"
        value={selected?.id ?? "world"}
        options={project.maps
          .filter(
            (m) =>
              m.kind === "world" || (map.kind === "area" && m.id === map.id),
          )
          .map((m) => ({
            value: m.id,
            label: m.kind === "world" ? "世界" : m.name,
          }))}
        onChange={(value) => {
          setScope(value);
          setEditingId(null);
        }}
      />
      <p className="muted small key-scope-description">
        {mapId === null
          ? "世界钥匙可供所有地图的节点使用。"
          : `这些钥匙仅供「${selected!.name}」内的节点使用。`}
      </p>
      <div className="key-grid">
        {keys.map((k) => (
          <div className="key-cell" key={k.id}>
            {onSelect ? (
              <Button
                title={selectedKeyId === k.id ? "已选为奖励" : "选为奖励"}
                disabled={readonly}
                active={selectedKeyId === k.id}
                onClick={() => onSelect(k.id)}
              >
                {selectedKeyId === k.id ? (
                  <Check size={18} />
                ) : (
                  <KeyRound size={18} />
                )}
                {selectedKeyId === k.id ? "已选" : "选用"}
              </Button>
            ) : (
              <KeyRound size={18} />
            )}
            <input
              aria-label="钥匙名称"
              placeholder="输入钥匙名称"
              disabled={readonly}
              value={k.name}
              ref={(input) => {
                if (input && editingId === k.id) input.focus();
              }}
              onBlur={() => {
                if (editingId === k.id) setEditingId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              onChange={(e) =>
                commit((p) => {
                  p.keys.find((x) => x.id === k.id)!.name = e.target.value;
                  return p;
                })
              }
            />
            <Button
              title="删除钥匙"
              disabled={readonly}
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
        <Button
          className="key-add"
          title="添加钥匙"
          disabled={readonly || keys.some((k) => !k.name.trim())}
          onClick={() => {
            const id = uid();
            commit((p) => {
              p.keys.push({ id, name: "", mapId });
              return p;
            });
            setEditingId(id);
          }}
        >
          <Plus size={18} />
          添加钥匙
        </Button>
      </div>
      <p className="muted small">
        删除被条件引用的钥匙后，可通过地图校验定位需要修复的条件。
      </p>
    </>
  );
}
