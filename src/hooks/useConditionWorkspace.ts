import { useState } from "react";
import { addConditionRules, cleanConditions } from "../domain/conditions";
import type { ConditionGroup, MapNode } from "../domain/types";
import type { Commit } from "./editorTypes";
export type ConditionField = "show" | "enter";
export interface ConditionSession {
 mapId: string; nodeId: string; name: string; field: ConditionField;
 draft: { show: ConditionGroup; enter: ConditionGroup };
 pickCard: number | null; picked: string[];
}
export function useConditionWorkspace(commit: Commit, restore: () => void) {
 const [conditionSession, setConditionSession] = useState<ConditionSession | null>(null);
 const openConditions = (mapId: string, node: MapNode, field: ConditionField) => setConditionSession({mapId, nodeId: node.id, name: node.name, field, draft: structuredClone({show: node.show, enter: node.enter}), pickCard: null, picked: []});
 const changeConditions = (value: ConditionGroup) => setConditionSession((s) => s && ({...s, draft: {...s.draft, [s.field]: value}}));
 const setConditionField = (field: ConditionField) => setConditionSession((s) => s && ({...s, field, pickCard: null, picked: []}));
 const startConditionPick = (pickCard: number) => setConditionSession((s) => s && ({...s, pickCard, picked: []}));
 const setConditionPicked = (picked: string[]) => setConditionSession((s) => s && ({...s, picked}));
 const cancelConditionPick = () => setConditionSession((s) => s && ({...s, pickCard: null, picked: []}));
 const acceptConditionPick = () => setConditionSession((s) => {
   if (!s || s.pickCard === null) return s;
   const value = s.draft[s.field];
   return {...s, pickCard: null, picked: [], draft: {...s.draft, [s.field]: {...value, groups: value.groups.map((g, i) => i === s.pickCard ? addConditionRules(g, "visited", s.picked) : g)}}};
 });
 const closeConditions = (save: boolean) => {
   if (save && conditionSession) {
     const session = conditionSession;
     commit((p) => {
       const node = p.maps.find((m) => m.id === session.mapId)?.nodes.find((n) => n.id === session.nodeId);
       if (node) { node.show = cleanConditions(session.draft.show); node.enter = cleanConditions(session.draft.enter); }
       return p;
     });
   }
   setConditionSession(null); restore();
 };
 return { conditionSession, openConditions, changeConditions, setConditionField, startConditionPick, setConditionPicked, cancelConditionPick, acceptConditionPick, closeConditions };
}
