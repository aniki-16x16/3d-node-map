import type { ChangeEvent } from "react";
import { useRef } from "react";
import { blankProgress } from "../domain/exploration";
import { parseProject } from "../domain/serialization";
import type { Progress, Project } from "../domain/types";
import { restoreDraft } from "../services/projectStorage";
import type { Commit, Notify, Setter } from "./editorTypes";
interface Options {
  project: Project;
  commit: Commit;
  changeMap: (id: string) => void;
  setProgress: Setter<Progress>;
  notify: Notify;
}
export function useProjectFiles({
  project,
  commit,
  changeMap,
  setProgress,
  notify,
}: Options) {
  const importer = useRef<HTMLInputElement>(null);
  const replaceProject = (p: Project) => {
    commit(p);
    changeMap(p.maps.find((m) => m.kind === "world")!.id);
    setProgress(blankProgress());
  };
  const exportFile = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `${project.name}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("地图已导出");
  };
  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget,
      f = input.files?.[0];
    if (!f) return;
    try {
      if (f.size > 10 * 1024 * 1024) throw Error("文件不能超过 10 MB");
      let migrated = false;
      replaceProject(parseProject(await f.text(), () => { migrated = true; }));
      notify(migrated ? "旧版项目已升级到 v2，所有旧显示条件和进入条件已清空，请重新配置；可撤销恢复原地图" : "导入成功，可撤销恢复原地图");
    } catch (error) {
      notify(
        `导入失败：${error instanceof Error ? error.message : String(error)}`,
      );
    }
    input.value = "";
  };
  const loadDemo = async () => {
    const { demoProject } = await import("../examples/demoProject");
    replaceProject(demoProject());
    notify("已加载示例地图，可撤销恢复原项目");
  };
  const restoreSavedProject = () => {
    try {
      let migrated = false;
      const draft = restoreDraft(localStorage, () => { migrated = true; });
      if (!draft) {
        notify("没有可恢复的本机草稿");
        return;
      }
      replaceProject(draft);
      notify(migrated ? "旧版草稿已升级到 v2，所有旧条件已清空，请重新配置" : "已恢复本机草稿");
    } catch (error) {
      notify(
        `恢复失败：${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
  return { importer, exportFile, importFile, loadDemo, restoreSavedProject };
}
