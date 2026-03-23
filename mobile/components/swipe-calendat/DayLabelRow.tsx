import { View, Text, StyleSheet } from "react-native";
import { CELL_W } from "./constants";

export function DayLabelRow({ labels }: { labels: string[] }) {
  return (
    <View style={styles.row}>
      {labels.map((l, i) => (
        <Text key={i} style={[styles.label, { width: CELL_W }]}>{l}</Text>
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