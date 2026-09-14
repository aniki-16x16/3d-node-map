import { createContext, useContext } from "react";
export interface TargetRequest {
  type: "key" | "visited";
  ref: string;
  mapId: string;
  onSelect: (id: string) => void;
}
export const TargetSelectionContext = createContext<
  (request: TargetRequest) => void
>(() => {});
export const useTargetSelection = () => useContext(TargetSelectionContext);
