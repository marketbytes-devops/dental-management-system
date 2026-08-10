"use client";

import { createContext, useContext } from "react";

export const ReceptionistContext = createContext(null);

export function useReceptionist() {
  return useContext(ReceptionistContext);
}
