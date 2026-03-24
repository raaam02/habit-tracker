import { useRef, useMemo } from "react";
import { PanResponder } from "react-native";
import { V_THRESHOLD, H_THRESHOLD } from "./constants";

interface Options {
  expandedRef:      React.MutableRefObject<boolean>;
  navigateWeekRef:  React.MutableRefObject<(d: number) => void>;
  navigateMonthRef: React.MutableRefObject<(d: number) => void>;
  toggleExpandRef:  React.MutableRefObject<(open: boolean) => void>;
}

export function usePanGesture({
  expandedRef, navigateWeekRef, navigateMonthRef, toggleExpandRef,
}: Options) {
  const axisLock = useRef<"none" | "h" | "v">("none");

  return useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderGrant: () => { axisLock.current = "none"; },
      onPanResponderMove: (_, g) => {
        if (axisLock.current !== "none") return;
        const ax = Math.abs(g.dx), ay = Math.abs(g.dy);
        if (ax > ay * 1.5 && ax > 8) axisLock.current = "h";
        if (ay > ax * 1.5 && ay > 8) axisLock.current = "v";
      },
      onPanResponderRelease: (_, g) => {
        const axis = axisLock.current;
        axisLock.current = "none";
        if (axis === "v") {
          if (g.dy >  V_THRESHOLD) toggleExpandRef.current(true);
          if (g.dy < -V_THRESHOLD) toggleExpandRef.current(false);
        } else if (axis === "h") {
          if (g.dx < -H_THRESHOLD) expandedRef.current ? navigateMonthRef.current(1)  : navigateWeekRef.current(1);
          if (g.dx >  H_THRESHOLD) expandedRef.current ? navigateMonthRef.current(-1) : navigateWeekRef.current(-1);
        }
      },
    }),
    []
  );
}