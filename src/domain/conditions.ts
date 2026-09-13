import type { ConditionGroup, Progress } from "./types";
export function conditionPass(
  condition: ConditionGroup,
  state: Progress,
): boolean {
  if (!condition?.rules?.length) return true;
  const values = condition.rules.map((r) =>
    r.rules
      ? conditionPass(r, state)
      : r.not
        ? !(r.type === "key" ? state.keys : state.reached).includes(r.ref)
        : (r.type === "key" ? state.keys : state.reached).includes(r.ref),
  );
  return condition.op === "any" ? values.some(Boolean) : values.every(Boolean);
}
