import { KeyRound, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { allNodes, uid } from "../../domain";
import type { EditorController } from "../../hooks/useEditorController";
import Button from "../ui/Button";

type Props = Pick<EditorController, "project" | "map" | "readonly" | "commit">;
export default function KeyManager({ project, map, readonly, commit }: Props) {
  const [names, setNames] = useState({ global: "", local: "" });
  return (
    <>
      <p className="muted small">
        全局钥匙可供所有地图使用；局部钥匙仅供所属二级地图的节点使用。
      </p>
      {(["global", "local"] as const).map((scope) => {
        const local = scope === "local";
        const mapId = local ? map.id : null;
        const enabled = !local || map.kind === "area";
        const keys = project.keys.filter((k) => k.mapId === mapId);
        return (
          <section key={scope}>
            <h3>
              {local
                ? `局部钥匙${enabled ? ` · ${map.name}` : ""}`
                : "全局钥匙"}
            </h3>
            {!enabled ? (
              <p className="muted small">
                请先进入一个二级地图，再创建和管理它的局部钥匙。
              </p>
            ) : (
              <>
                {!keys.length && (
                  <p className="muted small">
                    暂无{local ? "局部" : "全局"}钥匙
                  </p>
                )}
                {keys.map((k) => (
                  <div className="key-resource" key={k.id}>
                    <KeyRound size={16} />
                    <input
                      aria-label={`${local ? "局部" : "全局"}钥匙名称`}
                      disabled={readonly}
                      value={k.name}
                      onChange={(e) =>
                        commit((p) => {
                          p.keys.find((x) => x.id === k.id)!.name =
                            e.target.value;
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
                <div className="field-row">
                  <input
                    disabled={readonly}
                    placeholder={`新${local ? "局部" : "全局"}钥匙名称`}
                    value={names[scope]}
                    onChange={(e) =>
                      setNames({ ...names, [scope]: e.target.value })
                    }
                  />
                  <Button
                    title={`添加${local ? "局部" : "全局"}钥匙`}
                    disabled={readonly || !names[scope].trim()}
                    onClick={() => {
                      commit((p) => {
                        p.keys.push({
                          id: uid(),
                          name: names[scope].trim(),
                          mapId,
                        });
                        return p;
                      });
                      setNames({ ...names, [scope]: "" });
                    }}
                  >
                    <Plus size={16} />
                    添加
                  </Button>
                </div>
              </>
            )}
          </section>
        );
      })}
      <p className="muted small">
        删除被条件引用的钥匙后，可通过地图校验定位需要修复的条件。
      </p>
    </>
  );
}
