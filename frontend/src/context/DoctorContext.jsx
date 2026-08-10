"use client";

import { createContext, useContext } from "react";

export const DoctorContext = createContext(null);

export function useDoctor() {
  const context = useContext(DoctorContext);
  return context;
}
