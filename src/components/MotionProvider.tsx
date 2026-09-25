"use client";

import React from "react";
import { LazyMotion, domAnimation } from "framer-motion";

/**
 * LazyMotion Provider using lightweight domAnimation.
 * Drops Framer Motion bundle size by ~65% by excluding heavy layout projection,
 * drag-and-drop physics, and pan/pinch gesture engines.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict={false}>
      {children}
    </LazyMotion>
  );
}

export default MotionProvider;
