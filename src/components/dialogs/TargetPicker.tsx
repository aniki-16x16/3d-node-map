import { useState } from "react";
import { Check, KeyRound, MousePointer2 } from "lucide-react";
import { availableKeys, TYPES } from "../../domain";
import type { Project } from "../../domain";
import type { EditorController } from "../../hooks/useEditorController";
import type { TargetRequest } from "../inspector/TargetSelectionContext";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import RadioGroup from "../ui/RadioGroup";

type Props = Pick<
  EditorController,
  | "targetSession"
  | "project"
  | "targetRequest"
  | "pickingNode"
  | "closeTarget"
  | "startNodePick"
>;
export default function TargetPicker({
  targetSession,
  project,
  targetRequest,
  pickingNode,
  closeTarget,
  startNodePick,
}: Props) {
  const [last, setLast] = useState(targetRequest);
  if (targetRequest && targetRequest !== last) setLast(targetRequest);
  const request = targetRequest ?? last;
  return (
    <Modal
      open={!!targetRequest && !pickingNode}
      title={request?.type === "key" ? "选择钥匙" : "选择条件节点"}
      onClose={closeTarget}
      className="target-picker"
    >
      {request?.type === "key" ? (
        <KeyChoices
          key={targetSession}
          project={project}
          request={request}
          onClose={closeTarget}
        />
      ) : (
        request && (
          <>
            <p className="muted small">
              在现有画布中选择节点，点击节点旁的勾确认。可以切换地图和楼层。
            </p>
            {(() => {
              const m = project.maps.find((m) =>
                m.nodes.some((n) => n.id === request.ref),
              );
              const n = m?.nodes.find((n) => n.id === request.ref);
              return (
                n && (
                  <div className="target-summary">
                    <strong>{n.name}</strong>
                    <span>
                      {m!.name} · Z {n.z} · {TYPES[n.type]}
                    </span>
                  </div>
                )
              );
            })()}
            <div className="field-row">
              <Button
                title="在画布中选择节点"
                className="primary"
                onClick={startNodePick}
              >
                <MousePointer2 size={16} />
                {request.ref ? "重新选择节点" : "在画布中选择节点"}
              </Button>
              <Button title="完成选择" onClick={closeTarget}>
                完成
              </Button>
            </div>
          </>
        )
      )}
    </Modal>
  );
}
function KeyChoices({
  project,
  request,
  onClose,
}: {
  project: Project;
  request: TargetRequest;
  onClose: () => void;
}) {
  const world = project.maps.find((m) => m.kind === "world")!;
  const current = project.maps.find((m) => m.id === request.mapId) ?? world;
  const selected = project.keys.find((k) => k.id === request.ref);
  const [scope, setScope] = useState(
    selected ? (selected.mapId ?? world.id) : current.id,
  );
  const [query, setQuery] = useState("");
  const keys = availableKeys(project, current.id).filter(
    (k) =>
      (k.mapId ?? world.id) === scope &&
      k.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <>
      <RadioGroup
        label="钥匙所属地图"
        value={scope}
        options={[world, ...(current.kind === "area" ? [current] : [])].map(
          (m) => ({ value: m.id, label: m.kind === "world" ? "世界" : m.name }),
        )}
        onChange={setScope}
      />
      <input
        className="target-search"
        aria-label="过滤钥匙名称"
        placeholder="过滤钥匙名称…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="target-key-list">
        {keys.map((k) => (
          <button
            type="button"
            className={`target-key-option ${request.ref === k.id ? "chosen" : ""}`}
            key={k.id}
            onClick={() => {
              request.onSelect(k.id);
              onClose();
            }}
          >
            <KeyRound size={18} />
            <span>
              <strong>{k.name || "未命名钥匙"}</strong>
              {project.maps.flatMap((m) =>
                m.nodes
                  .filter((n) => n.rewards.includes(k.id))
                  .map((n) => (
                    <small key={n.id}>
                      {m.name} · {TYPES[n.type]} · {n.name}
                    </small>
                  )),
              )}
            </span>
            {request.ref === k.id && <Check size={16} />}
          </button>
        ))}
        {!keys.length && (
          <p className="muted small">
            {query.trim() ? "没有匹配的钥匙" : "暂无可选钥匙"}
          </p>
        )}
      </div>
    </>
  );
}
