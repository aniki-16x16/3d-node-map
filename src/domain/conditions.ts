import type { ConditionGroup, ConditionCard, ConditionRule, Progress } from "./types";
export function conditionPass(condition: ConditionGroup, state: Progress): boolean {
 const groups = condition.groups.filter((g) => g.rules.length);
 if (!groups.length) return true;
 const values = groups.map((group) => {
   const rules = group.rules.map((r) => (r.type === "key" ? state.keys : state.reached).includes(r.ref));
   return group.op === "all" ? rules.every(Boolean) : rules.some(Boolean);
 });
 return condition.op === "all" ? values.every(Boolean) : values.some(Boolean);
}
export function addConditionRules(card: ConditionCard, type: ConditionRule["type"], ids: string[]): ConditionCard {
 const seen = new Set(card.rules.filter((r) => r.type === type).map((r) => r.ref));
 return { ...card, rules: [...card.rules, ...ids.filter((id) => { if (seen.has(id)) return false; seen.add(id); return true; }).map((ref) => ({type, ref}))] };
}
export function cleanConditions(condition: ConditionGroup): ConditionGroup {
 return { ...condition, groups: condition.groups.filter((g) => g.rules.length) };
}
