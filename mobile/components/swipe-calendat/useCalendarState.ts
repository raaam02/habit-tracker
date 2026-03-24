import { useState, useRef, useCallback, useEffect } from "react";
import {
  useSharedValue, withSpring, withTiming,
} from "react-native-reanimated";
import { toIso, weekAnchor, weekDatesFrom, addWeeks, fromIso } from "./dateUtils";
import type { MonthView } from "./types";

export function useCalendarState(selectedDate?: string, onDayPress?: (iso: string) => void) {
  const nowFlat = new Date();
  nowFlat.setHours(0, 0, 0, 0);
  const todayIso = toIso(nowFlat);

  const [selected, setSelected]    = useState(selectedDate ?? todayIso);
  const [weekMonday, setWeekMonday] = useState(() => weekAnchor(selectedDate ?? todayIso));
  const [monthView, setMonthView]   = useState<MonthView>({
    year: nowFlat.getFullYear(), month: nowFlat.getMonth(),
  });
  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef(false);
  const [slideDir, setSlideDir] = useState<"left" | "right" | "none">("none");

  const expandProgress = useSharedValue(0);
  const arrowProgress  = useSharedValue(0);

  useEffect(() => {
    if (selectedDate === undefined) return;
    const d = fromIso(selectedDate);
    setSelected(selectedDate);
    setWeekMonday(weekAnchor(selectedDate));
    setMonthView({ year: d.getFullYear(), month: d.getMonth() });
  }, [selectedDate]);

  const toggleExpand = useCallback((open: boolean) => {
    expandedRef.current = open;
    setExpanded(open);
    expandProgress.value = withSpring(open ? 1 : 0, { damping: 20, stiffness: 200, mass: 0.8 });
    arrowProgress.value  = withTiming(open ? 1 : 0, { duration: 180 });
  }, []);

  const navigateWeek = useCallback((delta: number) => {
  setSlideDir(delta > 0 ? "left" : "right");
  setWeekMonday(prev => {
    const next = addWeeks(prev, delta);
    setSelected(sel => {
      const newWeekDates = weekDatesFrom(next);
      // If selected date is already in new week, keep it
      if (newWeekDates.includes(sel)) return sel;
      // Otherwise preserve the same weekday position (Mon=0 ... Sun=6)
      const selDow = fromIso(sel).getDay();               // 0=Sun...6=Sat
      const selMondayIndex = selDow === 0 ? 6 : selDow - 1; // convert to Mon=0...Sun=6
      return newWeekDates[selMondayIndex];
    });
    return next;
  });
}, []);

  const navigateMonth = useCallback((delta: number) => {
    setSlideDir(delta > 0 ? "left" : "right");
    setMonthView(prev => {
      let m = prev.month + delta;
      let y = prev.year;
      if (m > 11) { m = 0; y += 1; }
      else if (m < 0) { m = 11; y -= 1; }
      return { year: y, month: m };
    });
  }, []);

  const selectDay = useCallback((iso: string) => {
    setSlideDir("none");
    const d = fromIso(iso);
    setSelected(iso);
    setWeekMonday(weekAnchor(iso));
    setMonthView({ year: d.getFullYear(), month: d.getMonth() });
    onDayPress?.(iso);
  }, [onDayPress]);

  const goToToday = useCallback(() => {
    setSlideDir("none");
    setSelected(todayIso);
    setWeekMonday(weekAnchor(todayIso));
    setMonthView({ year: nowFlat.getFullYear(), month: nowFlat.getMonth() });
    toggleExpand(false);
    onDayPress?.(todayIso);
  }, [todayIso, toggleExpand, onDayPress]);

  // Derived
  const selDate     = fromIso(selected);

  return {
    todayIso, selected, weekMonday, monthView,
    expanded, expandedRef, slideDir,
    expandProgress, arrowProgress,
    selDate,
    toggleExpand, navigateWeek, navigateMonth, selectDay, goToToday,
  };
}