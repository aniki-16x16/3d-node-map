import { createContext, useContext } from "react";
import type { ConditionField } from "../../hooks/useConditionWorkspace";
export const ConditionEditingContext = createContext<(field: ConditionField) => void>(() => {});
export const useConditionEditing = () => useContext(ConditionEditingContext);
