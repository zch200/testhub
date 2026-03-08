import { useContext } from "react";
import { ProjectContext } from "../contexts/project-context";
import type { ProjectContextValue } from "../contexts/project-context";

export function useCurrentProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (ctx === null) {
    throw new Error("useCurrentProject must be used within a ProjectProvider");
  }
  return ctx;
}
