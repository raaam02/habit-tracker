import React, { useState, useMemo, useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useColorScheme } from "nativewind";
import { HabitLog } from "@/types/habit";
import { getAllHabitLogs } from "@/db/habit-log.repository";
import { haptic } from "@/utils/haptic";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

interface Props {
  logs?: HabitLog[];
  selectedDate?: string | null;
  onSelectDate?: (dateString: string) => void;
  onRefresh?: () => void;
}

// Inner component for cell to handle tap animation independently
function HeatmapCell({ day, getCellColor, isDark, selectedDate, onSelectDate, formatDateLabel, setSelectedDateInfo }: any) {
  const scale = useSharedValue(1);
  const isSelected = day.dateString === selectedDate;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.8, { damping: 12, stiffness: 250 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 250 });
  };

  return (
    <Pressable
      disabled={day.isFuture}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        haptic.light();
        setSelectedDateInfo(
          `${formatDateLabel(day.dateString)}: ${day.count} habit${
            day.count === 1 ? "" : "s"
          } completed`
        );
        if (onSelectDate) onSelectDate(day.dateString);
      }}
    >
      <Animated.View
        style={animatedStyle}
        className={`h-[14px] w-[14px] rounded-[3px] ${getCellColor(
          day.count,
          day.isFuture
        )} ${isSelected ? (isDark ? "border-2 border-indigo-400" : "border-2 border-indigo-600") : ""}`}
      />
    </Pressable>
  );
}

export default function HabitHeatmap({ logs: propLogs, selectedDate, onSelectDate }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [selectedDateInfo, setSelectedDateInfo] = useState<string | null>(null);

  // Fetch all logs if not passed as prop
  const logs = useMemo(() => {
    if (propLogs) return propLogs;
    try {
      return getAllHabitLogs();
    } catch (e) {
      console.warn("Failed to load habit logs for heatmap:", e);
      return [];
    }
  }, [propLogs]);

  // Aggregate logs by date
  const completionsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((log) => {
      if (log.status === "done" || (log.completedTime && log.targetTime && log.completedTime >= log.targetTime)) {
        const dateStr = log.date; // YYYY-MM-DD
        map[dateStr] = (map[dateStr] || 0) + 1;
      }
    });
    return map;
  }, [logs]);

  // Generate 16 weeks of calendar grid (112 days) ending today
  const gridData = useMemo(() => {
    const columns: { date: Date; dateString: string; count: number; isFuture: boolean }[][] = [];
    const today = new Date();
    
    const startDate = new Date();
    startDate.setDate(today.getDate() - 111);

    const startDayOfWeek = startDate.getDay();
    const gridStart = new Date(startDate);
    gridStart.setDate(startDate.getDate() - startDayOfWeek);

    for (let w = 0; w < 16; w++) {
      const week: { date: Date; dateString: string; count: number; isFuture: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const currentDate = new Date(gridStart);
        currentDate.setDate(gridStart.getDate() + (w * 7 + d));
        
        const dateString = currentDate.toISOString().split("T")[0];
        const isFuture = currentDate > today;
        const count = completionsByDate[dateString] || 0;
        
        week.push({
          date: currentDate,
          dateString,
          count: isFuture ? 0 : count,
          isFuture,
        });
      }
      columns.push(week);
    }
    
    return columns;
  }, [completionsByDate]);

  // Map completion counts to colors
  const getCellColor = (count: number, isFuture: boolean) => {
    if (isFuture) {
      return isDark ? "bg-zinc-900/40" : "bg-zinc-100/40";
    }
    if (count === 0) {
      return isDark ? "bg-zinc-800" : "bg-zinc-200";
    }
    if (count === 1) {
      return isDark ? "bg-emerald-950/80 border border-emerald-800/30" : "bg-emerald-100 border border-emerald-200/50";
    }
    if (count === 2) {
      return isDark ? "bg-emerald-800" : "bg-emerald-300";
    }
    if (count === 3) {
      return isDark ? "bg-emerald-600" : "bg-emerald-500";
    }
    return isDark ? "bg-emerald-400" : "bg-emerald-700"; // 4+ completions
  };

  // Helper to format date for display (e.g., Oct 12)
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Find month header positions (e.g. show "Oct" above the column where the month changes)
  const monthLabels = useMemo(() => {
    const labels: { text: string; colIndex: number }[] = [];
    let lastMonth = -1;

    gridData.forEach((week, colIndex) => {
      const midDay = week[3].date;
      const month = midDay.getMonth();
      if (month !== lastMonth) {
        labels.push({
          text: midDay.toLocaleDateString("en-US", { month: "short" }),
          colIndex,
        });
        lastMonth = month;
      }
    });

    return labels;
  }, [gridData]);

  // Update initial selected Date Info
  useEffect(() => {
    if (selectedDate) {
      const count = completionsByDate[selectedDate] || 0;
      setSelectedDateInfo(`${formatDateLabel(selectedDate)}: ${count} habit${count === 1 ? "" : "s"} completed`);
    }
  }, [selectedDate, completionsByDate]);

  return (
    <View className="bg-card rounded-3xl p-5 border border-border mt-6">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-bold text-card-foreground">Activity Grid</Text>
        </View>
        <Text className="text-xs text-muted-foreground">Last 16 weeks</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
        <View className="flex-col">
          {/* Month headers row */}
          <View className="flex-row h-5 relative mb-1">
            <View className="w-8" />
            {monthLabels.map((lbl, idx) => (
              <Text
                key={idx}
                style={{
                  position: "absolute",
                  left: lbl.colIndex * 18,
                  fontSize: 10,
                }}
                className="font-semibold text-muted-foreground"
              >
                {lbl.text}
              </Text>
            ))}
          </View>

          {/* Grid with sidebar labels */}
          <View className="flex-row">
            {/* Left sidebar: Days of week */}
            <View className="w-8 justify-between pr-2 py-0.5 h-[122px]">
              <Text className="text-[9px] font-bold text-muted-foreground">Sun</Text>
              <Text className="text-[9px] font-bold text-muted-foreground">Tue</Text>
              <Text className="text-[9px] font-bold text-muted-foreground">Thu</Text>
              <Text className="text-[9px] font-bold text-muted-foreground">Sat</Text>
            </View>

            {/* Weeks Columns */}
            <View className="flex-row gap-1">
              {gridData.map((week, wIdx) => (
                <View key={wIdx} className="flex-col gap-1">
                  {week.map((day, dIdx) => (
                    <HeatmapCell
                      key={dIdx}
                      day={day}
                      getCellColor={getCellColor}
                      isDark={isDark}
                      selectedDate={selectedDate}
                      onSelectDate={onSelectDate}
                      formatDateLabel={formatDateLabel}
                      setSelectedDateInfo={setSelectedDateInfo}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Legend & Details */}
      <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-border/40">
        <Text className="text-xs font-semibold text-muted-foreground flex-1 pr-4">
          {selectedDateInfo || "Tap a square to view details"}
        </Text>
        
        {/* Legend */}
        <View className="flex-row items-center gap-1">
          <Text className="text-[10px] text-muted-foreground">Less</Text>
          <View className={`h-2.5 w-2.5 rounded-[2px] ${getCellColor(0, false)}`} />
          <View className={`h-2.5 w-2.5 rounded-[2px] ${getCellColor(1, false)}`} />
          <View className={`h-2.5 w-2.5 rounded-[2px] ${getCellColor(2, false)}`} />
          <View className={`h-2.5 w-2.5 rounded-[2px] ${getCellColor(3, false)}`} />
          <Text className="text-[10px] text-muted-foreground">More</Text>
        </View>
      </View>
    </View>
  );
}
