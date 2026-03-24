import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { DayCell } from "./DayCell";
import { DayLabelRow } from "./DayLabelRow";
import { SlideWrap } from "./SlideWrap";
import { MONTH_NAMES, CELL_W, CELL_H } from "./constants";
import type { MonthView } from "./types";
import { useColorScheme } from "nativewind";

interface Props {
  monthView: MonthView;
  monthCells: (string | null)[];
  selected: string;
  todayIso: string;
  markedSet: Set<string>;
  accentColor: string;
  monthSlideKey: string;
  slideDir: "left" | "right" | "none";
  expanded: boolean;
  opacityStyle: object;
  onSelect: (iso: string) => void;
  onNavigate: (delta: number) => void;
  weekLabels: string[];
}

export function MonthGrid({
  monthView, monthCells, selected, todayIso, markedSet, accentColor,
  monthSlideKey, slideDir, expanded, opacityStyle, onSelect, onNavigate,
  weekLabels,
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  return (
    <Animated.View style={[{ position: "absolute", top: 0, width: "100%" }, opacityStyle]}
      pointerEvents={expanded ? "auto" : "none"}>

      <View style={styles.nav}>
        <TouchableOpacity onPress={() => onNavigate(-1)} hitSlop={{ top:10,bottom:10,left:16,right:16 }} activeOpacity={0.7}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{MONTH_NAMES[monthView.month]} {monthView.year}</Text>
        <TouchableOpacity onPress={() => onNavigate(1)} hitSlop={{ top:10,bottom:10,left:16,right:16 }} activeOpacity={0.7}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <DayLabelRow isDark={isDark} labels={weekLabels} />

      <SlideWrap pageKey={monthSlideKey} direction={slideDir}>
        <View style={styles.grid}>
          {monthCells.map((iso, i) =>
            iso ? (
              <DayCell key={i} iso={iso}
                isSelected={iso === selected}
                isToday={iso === todayIso}
                hasMarker={markedSet.has(iso)}
                accent={accentColor}
                onPress={() => onSelect(iso)}
              />
            ) : (
              <View key={i} style={{ width: CELL_W, height: CELL_H + 4 }} />
            )
          )}
        </View>
      </SlideWrap>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 20, marginBottom: 10, height: 36,
  },
  navArrow: { color: "#fff", fontSize: 28, fontWeight: "300", lineHeight: 34 },
  navTitle: { color: "#fff", fontSize: 15, fontWeight: "700", minWidth: 160, textAlign: "center", letterSpacing: 0.3 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
});