import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { validate } from "../../domain";
import type { EditorController } from "../../hooks/useEditorController";
type Props = Pick<EditorController, "project">;
export default function ValidationResults({ project }: Props) {
  return (
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
  );
}
