import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";

interface Props {
  headerLabel: string;
  todayLabel: string;
  expanded: boolean;
  arrowStyle: object;
  onTodayPress: () => void;
  onTitlePress: () => void;
}

export function TopBar({ headerLabel, todayLabel, expanded, arrowStyle, onTodayPress, onTitlePress }: Props) {
  return (
    <View style={styles.bar}>
      <TouchableOpacity style={styles.pill} onPress={onTodayPress} activeOpacity={0.75}>
        <Text style={styles.pillText}>{todayLabel}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.titleRow} onPress={onTitlePress} activeOpacity={0.8}>
        <Text style={styles.titleText}>{headerLabel}</Text>
        <Animated.Text style={[styles.chevron, arrowStyle]}>▾</Animated.Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  pill:     { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.15)", minWidth: 68, alignItems: "center" },
  pillText: { color: "#fff", fontWeight: "700", fontSize: 13, letterSpacing: 0.2 },
  spacer:   { minWidth: 68, paddingHorizontal: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  titleText:{ color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  chevron:  { color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 20 },
});