import { blankProject } from "./project";
import type { Project } from "./types";
export interface HistoryState {
  project: Project;
  past: Project[];
  future: Project[];
  dirty: boolean;
}
type Action =
  | { type: "commit"; project: Project }
  | { type: "replace"; project: Project }
  | { type: "checkpoint"; project: Project }
  | { type: "undo" }
  | { type: "redo" };
export function projectHistoryReducer(
  state: HistoryState,
  action: Action,
): HistoryState {
  switch (action.type) {
    case "commit":
      return {
        project: action.project,
        past: [...state.past, state.project].slice(-80),
        future: [],
        dirty: true,
      };
    case "replace":
      return { ...state, project: action.project, dirty: true };
    case "checkpoint":
      return {
        ...state,
        past: [...state.past, action.project].slice(-80),
        future: [],
      };
    case "undo":
      return state.past.length
        ? {
            project: state.past.at(-1)!,
            past: state.past.slice(0, -1),
            future: [state.project, ...state.future],
            dirty: true,
          }
        : state;
    case "redo":
      return state.future.length
        ? {
            project: state.future[0],
            past: [...state.past, state.project],
            future: state.future.slice(1),
            dirty: true,
          }
        : state;
  }
}

export function createHistoryState(): HistoryState {
  return { project: blankProject(), past: [], future: [], dirty: false };
}
