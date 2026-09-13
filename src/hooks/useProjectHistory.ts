import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createHistoryState, projectHistoryReducer } from "../domain/history";
import type { Project } from "../domain/types";
import { saveDraft } from "../services/projectStorage";
import type { Commit, Setter } from "./editorTypes";
export function useProjectHistory() {
  const [state, dispatch] = useReducer(
    projectHistoryReducer,
    undefined,
    createHistoryState,
  );
  const current = useRef(state.project);
  current.current = state.project;
  const [saveState, setSaveState] = useState("空白项目");
  useEffect(() => {
    if (!state.dirty) return;
    try {
      saveDraft(state.project, localStorage);
      setSaveState("已保存至本机");
    } catch {
      setSaveState("本机保存失败，请导出备份");
    }
  }, [state.project, state.dirty]);
  const commit: Commit = useCallback((update) => {
    const project =
      typeof update === "function"
        ? update(structuredClone(current.current))
        : update;
    current.current = project;
    dispatch({ type: "commit", project });
  }, []);
  const setProject: Setter<Project> = useCallback((update) => {
    const project =
      typeof update === "function" ? update(current.current) : update;
    current.current = project;
    dispatch({ type: "replace", project });
  }, []);
  const checkpoint = useCallback(
    (project: Project) => dispatch({ type: "checkpoint", project }),
    [],
  );
  const undo = useCallback(() => dispatch({ type: "undo" }), []),
    redo = useCallback(() => dispatch({ type: "redo" }), []);
  return {
    project: state.project,
    history: { past: state.past, future: state.future },
    commit,
    setProject,
    checkpoint,
    undo,
    redo,
    saveState,
  };
}
