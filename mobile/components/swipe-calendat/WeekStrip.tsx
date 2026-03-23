import React from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { DayCell } from "./DayCell";
import { DayLabelRow } from "./DayLabelRow";
import { SlideWrap } from "./SlideWrap";

interface Props {
  weekDates: string[];
  selected: string;
  todayIso: string;
  markedSet: Set<string>;
  accentColor: string;
  weekMonday: string;
  slideDir: "left" | "right" | "none";
  expanded: boolean;
  opacityStyle: object;
  onSelect: (iso: string) => void;
  weekLabels: string[];
}

export function WeekStrip({
  weekDates, selected, todayIso, markedSet, accentColor,
  weekMonday, slideDir, expanded, opacityStyle, onSelect,
  weekLabels,
}: Props) {
  return (
    <Animated.View style={[{ position: "absolute", top: 0, width: "100%" }, opacityStyle]}
      pointerEvents={expanded ? "none" : "auto"}>
      <DayLabelRow labels={weekLabels} />
      <SlideWrap pageKey={weekMonday} direction={slideDir}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {weekDates.map((iso, i) => (
            <DayCell key={i} iso={iso}
              isSelected={iso === selected}
              isToday={iso === todayIso}
              hasMarker={markedSet.has(iso)}
              accent={accentColor}
              onPress={() => onSelect(iso)}
            />
          ))}
        </View>
      </SlideWrap>
    </Animated.View>
  );
}