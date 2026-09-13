import type { Dispatch, SetStateAction } from "react";
import type { Port, Project } from "../domain/types";
export type Setter<T> = Dispatch<SetStateAction<T>>;
export type Modal = "settings" | "help" | "validation" | "debug" | null;
export type EditorTool = "select" | "hand";
export interface PendingConnection {
  id: string;
  port: Port;
}
export interface ViewTransform {
  x: number;
  y: number;
  k: number;
}
export type Commit = (update: Project | ((draft: Project) => Project)) => void;
export type Notify = (message: string) => void;
