import { parseProject } from "../domain/serialization";
import type { Project } from "../domain/types";
export const STORAGE_KEY = "node-atlas-project-v1";
export function restoreDraft(
  storage: Pick<Storage, "getItem">,
): Project | null {
  const text = storage.getItem(STORAGE_KEY);
  return text ? parseProject(text) : null;
}
export function saveDraft(project: Project, storage: Pick<Storage, "setItem">) {
  storage.setItem(STORAGE_KEY, JSON.stringify(project));
}
