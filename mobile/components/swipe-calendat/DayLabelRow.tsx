import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DAY_SHORT, CELL_W } from "./constants";

export function DayLabelRow() {
  return (
    <View style={styles.row}>
      {DAY_SHORT.map(l => (
        <Text key={l} style={[styles.label, { width: CELL_W }]}>{l}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: {
    color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "600",
    textAlign: "center", textTransform: "uppercase", letterSpacing: 0.5,
  },
});