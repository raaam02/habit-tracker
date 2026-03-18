import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import Animated, {
  useAnimatedStyle, interpolate, Extrapolation,
} from "react-native-reanimated";
import { TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCalendarState } from "./useCalendarState";
import { usePanGesture }    from "./usePanGesture";
import { TopBar }           from "./TopBar";
import { WeekStrip }        from "./WeekStrip";
import { MonthGrid }        from "./MonthGrid";

import { weekDatesFrom, buildMonthGrid, fromIso } from "./dateUtils";
import { MONTH_SHORT, DAY_FULL, H_PAD, WEEK_H, EXPANDED_TOTAL } from "./constants";
import type { SwipeCalendarProps } from "./types";

export default function SwipeCalendar({
  accentColor = "#000000",
  markedDates = [],
  selectedDate,
  todayLabel = "Today",
  onDayPress,
}: SwipeCalendarProps) {
  const insets = useSafeAreaInsets();

  const state = useCalendarState(selectedDate, onDayPress);
  const {
    todayIso, selected, weekMonday, monthView,
    expanded, expandedRef, slideDir,
    expandProgress, arrowProgress,
    selDate,
    toggleExpand, navigateWeek, navigateMonth, selectDay, goToToday,
  } = state;

  // Stable refs for PanResponder
  const navigateWeekRef  = useRef(navigateWeek);
  const navigateMonthRef = useRef(navigateMonth);
  const toggleExpandRef  = useRef(toggleExpand);
  useEffect(() => { navigateWeekRef.current  = navigateWeek;  }, [navigateWeek]);
  useEffect(() => { navigateMonthRef.current = navigateMonth; }, [navigateMonth]);
  useEffect(() => { toggleExpandRef.current  = toggleExpand;  }, [toggleExpand]);

  const pan = usePanGesture({ expandedRef, navigateWeekRef, navigateMonthRef, toggleExpandRef });

  // Animated styles
  const calHeightStyle = useAnimatedStyle(() => ({
    height: interpolate(expandProgress.value, [0, 1], [WEEK_H, EXPANDED_TOTAL], Extrapolation.CLAMP),
    overflow: "hidden",
  }));
  const weekOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0, 0.25, 1], [1, 0, 0], Extrapolation.CLAMP),
  }));
  const monthOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0, 0.5, 1], [0, 0, 1], Extrapolation.CLAMP),
  }));
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(arrowProgress.value, [0, 1], [0, 180], Extrapolation.CLAMP)}deg` }],
  }));

  // Derived
  const markedSet    = new Set(markedDates);
  const weekDates    = weekDatesFrom(weekMonday);
  const monthCells   = buildMonthGrid(monthView.year, monthView.month);
  const weekSlideKey = weekMonday;
  const monthSlideKey= `${monthView.year}-${String(monthView.month).padStart(2, "0")}`;
  const headerLabel  = `${DAY_FULL[selDate.getDay()]}, ${MONTH_SHORT[selDate.getMonth()]} ${selDate.getDate()}`;

  return (
    <Animated.View
      style={[styles.header, { backgroundColor: "#000000", paddingTop: insets.top + 10, paddingHorizontal: H_PAD }]}
      {...pan.panHandlers}
    >
      <TopBar
        headerLabel={headerLabel}
        todayLabel={todayLabel}
        expanded={expanded}
        arrowStyle={arrowStyle}
        onTodayPress={goToToday}
        onTitlePress={() => toggleExpand(!expanded)}
      />

      <Animated.View style={calHeightStyle}>
        <WeekStrip
          weekDates={weekDates} selected={selected} todayIso={todayIso}
          markedSet={markedSet} accentColor={accentColor}
          weekMonday={weekSlideKey} slideDir={slideDir.current}
          expanded={expanded} opacityStyle={weekOpacityStyle}
          onSelect={selectDay}
        />
        <MonthGrid
          monthView={monthView} monthCells={monthCells}
          selected={selected} todayIso={todayIso}
          markedSet={markedSet} accentColor={accentColor}
          monthSlideKey={monthSlideKey} slideDir={slideDir.current}
          expanded={expanded} opacityStyle={monthOpacityStyle}
          onSelect={(iso) => { selectDay(iso); toggleExpand(false); }}
          onNavigate={navigateMonth}
        />
      </Animated.View>

      <TouchableOpacity
        style={styles.handleWrap}
        onPress={() => toggleExpand(!expanded)}
        activeOpacity={0.6}
        hitSlop={{ top: 8, bottom: 8, left: 40, right: 40 }}
      >
        <View style={styles.handle} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 18 },
      android: { elevation: 10 },
    }),
    zIndex: 10,
  },
  handleWrap: { alignItems: "center", paddingVertical: 10 },
  handle:     { width: 38, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.38)" },
});