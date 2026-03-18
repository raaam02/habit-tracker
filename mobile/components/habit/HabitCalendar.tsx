/**
 * SwipeCalendar.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable React Native / Expo calendar header.
 *
 * Gestures
 *   Swipe ↓ / ↑   → expand to month / collapse to week
 *   Swipe ← / →   → next / prev week  (collapsed)
 *                 → next / prev month (expanded)
 *
 * Props
 *   accentColor   – header bg & selection colour  (default "#4CAF50")
 *   markedDates   – ISO strings with a dot        (default [])
 *   selectedDate  – controlled selection          (optional)
 *   todayLabel    – Today-pill text               (default "Today")
 *   onDayPress    – (iso: string) => void
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  memo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SwipeCalendarProps {
  accentColor?: string;
  markedDates?: string[];
  selectedDate?: string;
  todayLabel?: string;
  onDayPress?: (iso: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MONTH_SHORT = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];
const DAY_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DAY_FULL  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const { width: SW } = Dimensions.get("window");
const H_PAD  = 20;
const CELL_W = Math.floor((SW - H_PAD * 2) / 7);
const CELL_H = CELL_W;

const WEEK_H         = 20 + CELL_H + 8;
const MONTH_BODY_H   = 20 + CELL_H * 6 + 8;
const EXPANDED_TOTAL = MONTH_BODY_H + 48;

const V_THRESHOLD = 36;
const H_THRESHOLD = 40;

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function toIso(d: Date): string {
  return d.toISOString().split("T")[0];
}

function fromIso(iso: string): Date {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function mondayOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  const dow = r.getDay();
  r.setDate(r.getDate() - (dow === 0 ? 6 : dow - 1));
  return r;
}

/** ISO string for the Monday of the week containing `iso` */
function weekAnchor(iso: string): string {
  return toIso(mondayOfWeek(fromIso(iso)));
}

function weekDatesFrom(mondayIso: string): string[] {
  const mon = fromIso(mondayIso);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return toIso(d);
  });
}

function buildMonthGrid(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1);
  let offset = firstDay.getDay() - 1;
  if (offset < 0) offset = 6;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= days; d++) cells.push(toIso(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function addWeeks(iso: string, n: number): string {
  const d = fromIso(iso);
  d.setDate(d.getDate() + n * 7);
  return toIso(d);
}

// ─── SlideWrap ────────────────────────────────────────────────────────────────

interface SlideWrapProps {
  pageKey: string;
  direction: "left" | "right" | "none";
  children: React.ReactNode;
}

function SlideWrap({ pageKey, direction, children }: SlideWrapProps) {
  const tx      = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const prevKey = useRef(pageKey);

  useEffect(() => {
    if (prevKey.current === pageKey) return;
    prevKey.current = pageKey;
    if (direction === "none") return;

    const from = direction === "left" ? SW * 0.55 : -SW * 0.55;
    tx.setValue(from);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(tx, {
        toValue: 0,
        friction: 14,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start();
  }, [pageKey]); // ← direction intentionally excluded; always set before pageKey

  return (
    <Animated.View style={{ transform: [{ translateX: tx }], opacity }}>
      {children}
    </Animated.View>
  );
}

// ─── DayCell ──────────────────────────────────────────────────────────────────

interface DayCellProps {
  iso: string;
  isSelected: boolean;
  isToday: boolean;
  hasMarker: boolean;
  accent: string;
  onPress: () => void;
}

const DayCell = memo(function DayCell({
  iso, isSelected, isToday, hasMarker, accent, onPress,
}: DayCellProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const day   = fromIso(iso).getDate();

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.78, duration: 65, useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1,   friction: 5,  useNativeDriver: true }),
    ]).start();
    onPress();
  };

  let bg: string   = "transparent";
  let fg: string   = "rgba(255,255,255,0.75)";
  let fw: "500" | "700" | "800" = "500";

  if (isSelected)   { bg = "#fff"; fg = accent; fw = "800"; }
  else if (isToday) { bg = "rgba(255,255,255,0.22)"; fg = "#fff"; fw = "700"; }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.cellTouch, { width: CELL_W }]}
    >
      <Animated.View style={[styles.cellCircle, { backgroundColor: bg, transform: [{ scale }] }]}>
        <Text style={[styles.cellText, { color: fg, fontWeight: fw }]}>{day}</Text>
        {hasMarker && (
          <View style={[styles.dot, { backgroundColor: isSelected ? accent : "rgba(255,255,255,0.6)" }]} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
});

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SwipeCalendar({
  accentColor = "#000000",
  markedDates = [],
  selectedDate,
  todayLabel  = "Today",
  onDayPress,
}: SwipeCalendarProps) {
  const insets = useSafeAreaInsets();

  const nowFlat = new Date();
  nowFlat.setHours(0, 0, 0, 0);
  const todayIso = toIso(nowFlat);

  // ── Core state ──────────────────────────────────────────────────────────

  const [selected, setSelected]    = useState(selectedDate ?? todayIso);
  const [weekMonday, setWeekMonday] = useState(() => weekAnchor(selectedDate ?? todayIso));
  const [monthView, setMonthView]   = useState({
    year:  nowFlat.getFullYear(),
    month: nowFlat.getMonth(),
  });

  // Slide direction — set BEFORE mutating page data so SlideWrap reads it correctly
  const slideDir = useRef<"left" | "right" | "none">("none");

  useEffect(() => {
    if (selectedDate === undefined) return;
    setSelected(selectedDate);
    setWeekMonday(weekAnchor(selectedDate));
  }, [selectedDate]);

  // ── Expand / collapse ────────────────────────────────────────────────────

  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const arrowAnim  = useRef(new Animated.Value(0)).current;

  // FIX ① — Mirror `expanded` into a ref so the PanResponder closure
  // (which is created once and never re-runs) always reads the current value.
  const expandedRef = useRef(false);

  const toggleExpand = useCallback((open: boolean) => {
    expandedRef.current = open; // sync ref immediately, before async setState re-render
    setExpanded(open);
    Animated.parallel([
      Animated.spring(expandAnim, { toValue: open ? 1 : 0, friction: 12, tension: 55, useNativeDriver: false }),
      Animated.timing(arrowAnim,  { toValue: open ? 1 : 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────

  const navigateWeek = useCallback((delta: number) => {
    slideDir.current = delta > 0 ? "left" : "right";
    setWeekMonday(prev => {
      const next = addWeeks(prev, delta);
      setSelected(sel => {
        const selInNewWeek = weekDatesFrom(next);
        return selInNewWeek.includes(sel) ? sel : next;
      });
      return next;
    });
  }, []);

  const navigateMonth = useCallback((delta: number) => {
    slideDir.current = delta > 0 ? "left" : "right";
    setMonthView(prev => {
      let m = prev.month + delta;
      let y = prev.year;
      if (m > 11) { m = 0;  y += 1; }
      else if (m < 0) { m = 11; y -= 1; }
      return { year: y, month: m };
    });
  }, []);

  // FIX ② — Keep callback refs up-to-date so PanResponder always invokes
  // the latest function identity without being recreated itself.
  const navigateWeekRef  = useRef(navigateWeek);
  const navigateMonthRef = useRef(navigateMonth);
  const toggleExpandRef  = useRef(toggleExpand);
  useEffect(() => { navigateWeekRef.current  = navigateWeek;  }, [navigateWeek]);
  useEffect(() => { navigateMonthRef.current = navigateMonth; }, [navigateMonth]);
  useEffect(() => { toggleExpandRef.current  = toggleExpand;  }, [toggleExpand]);

  const selectDay = useCallback((iso: string) => {
    slideDir.current = "none";
    setSelected(iso);
    setWeekMonday(weekAnchor(iso));
    onDayPress?.(iso);
  }, [onDayPress]);

  const goToToday = useCallback(() => {
    slideDir.current = "none";
    setSelected(todayIso);
    setWeekMonday(weekAnchor(todayIso));
    setMonthView({ year: nowFlat.getFullYear(), month: nowFlat.getMonth() });
    toggleExpand(false);
    onDayPress?.(todayIso);
  }, [todayIso, toggleExpand, onDayPress]);

  // ── PanResponder ──────────────────────────────────────────────────────────

  const axisLock = useRef<"none" | "h" | "v">("none");

  // FIX ③ — All reads of `expanded` use expandedRef.current; all calls go
  // through the *Ref.current indirection so nothing here is ever stale.
  const pan = useRef(
    PanResponder.create({
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
    })
  ).current;

  // ── Interpolations ────────────────────────────────────────────────────────

  const calHeight    = expandAnim.interpolate({ inputRange:[0,1], outputRange:[WEEK_H, EXPANDED_TOTAL] });
  const weekOpacity  = expandAnim.interpolate({ inputRange:[0,0.25,1], outputRange:[1,0,0] });
  const monthOpacity = expandAnim.interpolate({ inputRange:[0,0.5,1],  outputRange:[0,0,1] });
  const arrowRotate  = arrowAnim.interpolate({ inputRange:[0,1], outputRange:["0deg","180deg"] });

  // ── Derived data ──────────────────────────────────────────────────────────

  const markedSet  = new Set(markedDates);
  const weekDates  = weekDatesFrom(weekMonday);
  const monthCells = buildMonthGrid(monthView.year, monthView.month);

  const weekSlideKey  = weekMonday;
  const monthSlideKey = `${monthView.year}-${String(monthView.month).padStart(2,"0")}`;

  const selDate     = fromIso(selected);
  const headerLabel = `${DAY_FULL[selDate.getDay()]}, ${MONTH_SHORT[selDate.getMonth()]} ${selDate.getDate()}`;

  const DayLabelRow = () => (
    <View style={styles.dayLabelRow}>
      {DAY_SHORT.map(l => <Text key={l} style={[styles.dayLabel, { width: CELL_W }]}>{l}</Text>)}
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Animated.View
      style={[styles.header, { backgroundColor: "#000000", paddingTop: insets.top + 10, paddingHorizontal: H_PAD }]}
      {...pan.panHandlers}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.todayPill} onPress={goToToday} activeOpacity={0.75}>
          <Text style={styles.todayPillText}>{todayLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.titleRow} onPress={() => toggleExpand(!expanded)} activeOpacity={0.8}>
          <Text style={styles.titleText}>{headerLabel}</Text>
          <Animated.Text style={[styles.chevron, { transform: [{ rotate: arrowRotate }] }]}>▾</Animated.Text>
        </TouchableOpacity>

        <View style={styles.pillSpacer} />
      </View>

      {/* Calendar */}
      <Animated.View style={{ height: calHeight, overflow: "hidden" }}>

        {/* Week strip */}
        <Animated.View style={[styles.calLayer, { opacity: weekOpacity }]} pointerEvents={expanded ? "none" : "auto"}>
          <DayLabelRow />
          <SlideWrap pageKey={weekSlideKey} direction={slideDir.current}>
            <View style={styles.cellRow}>
              {weekDates.map((iso, i) => (
                <DayCell key={i} iso={iso}
                  isSelected={iso === selected}
                  isToday={iso === todayIso}
                  hasMarker={markedSet.has(iso)}
                  accent={accentColor}
                  onPress={() => selectDay(iso)}
                />
              ))}
            </View>
          </SlideWrap>
        </Animated.View>

        {/* Full month */}
        <Animated.View style={[styles.calLayer, { opacity: monthOpacity }]} pointerEvents={expanded ? "auto" : "none"}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => navigateMonth(-1)} hitSlop={{ top:10,bottom:10,left:16,right:16 }} activeOpacity={0.7}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.navTitle}>{MONTH_NAMES[monthView.month]} {monthView.year}</Text>
            <TouchableOpacity onPress={() => navigateMonth(1)} hitSlop={{ top:10,bottom:10,left:16,right:16 }} activeOpacity={0.7}>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <DayLabelRow />

          <SlideWrap pageKey={monthSlideKey} direction={slideDir.current}>
            <View style={styles.monthGrid}>
              {monthCells.map((iso, i) =>
                iso ? (
                  <DayCell key={i} iso={iso}
                    isSelected={iso === selected}
                    isToday={iso === todayIso}
                    hasMarker={markedSet.has(iso)}
                    accent={accentColor}
                    onPress={() => { selectDay(iso); toggleExpand(false); }}
                  />
                ) : (
                  <View key={i} style={{ width: CELL_W, height: CELL_H + 4 }} />
                )
              )}
            </View>
          </SlideWrap>
        </Animated.View>
      </Animated.View>

      {/* Drag handle */}
      <TouchableOpacity
        style={styles.handleWrap}
        onPress={() => toggleExpand(!expanded)}
        activeOpacity={0.6}
        hitSlop={{ top:8, bottom:8, left:40, right:40 }}
      >
        <View style={styles.handle} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 0,
    ...Platform.select({
      ios:     { shadowColor:"#000", shadowOffset:{width:0,height:8}, shadowOpacity:0.18, shadowRadius:18 },
      android: { elevation: 10 },
    }),
    zIndex: 10,
  },
  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 14,
  },
  todayPill: {
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.15)", minWidth: 68, alignItems: "center",
  },
  pillSpacer: { minWidth: 68, paddingHorizontal: 14 },
  todayPillText: { color: "#fff", fontWeight: "700", fontSize: 13, letterSpacing: 0.2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  titleText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  chevron:   { color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 20 },

  calLayer: { position: "absolute", top: 0, width: "100%" },
  dayLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  dayLabel: {
    color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "600",
    textAlign: "center", textTransform: "uppercase", letterSpacing: 0.5,
  },
  cellRow: { flexDirection: "row", justifyContent: "space-between" },

  monthNav: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 20, marginBottom: 10, height: 36,
  },
  navArrow: { color: "#fff", fontSize: 28, fontWeight: "300", lineHeight: 34 },
  navTitle: { color: "#fff", fontSize: 15, fontWeight: "700", minWidth: 160, textAlign: "center", letterSpacing: 0.3 },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },

  cellTouch:  { alignItems: "center", paddingVertical: 2 },
  cellCircle: {
    width: CELL_W - 4, height: CELL_H - 4,
    borderRadius: (CELL_W - 4) / 2,
    alignItems: "center", justifyContent: "center",
  },
  cellText: { fontSize: 14 },
  dot: { position: "absolute", bottom: 3, width: 4, height: 4, borderRadius: 2 },

  handleWrap: { alignItems: "center", paddingVertical: 10 },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.38)" },
});