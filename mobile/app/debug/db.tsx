import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "@/db/database";

export default function DatabaseExplorerScreen() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [jsonInput, setJsonInput] = useState("");

  const loadTables = () => {
    try {
      const result = db.getAllSync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'expo_metadata'"
      );
      const names = result.map((r) => r.name);
      setTables(names);
      if (names.length > 0 && !selectedTable) {
        setSelectedTable(names[0]);
      }
    } catch (error) {
      console.error("Failed to load tables:", error);
    }
  };

  const loadData = (tableName: string) => {
    try {
      const result = db.getAllSync<any>(`SELECT * FROM ${tableName} LIMIT 100`);
      setData(result);
      if (result.length > 0) {
        setColumns(Object.keys(result[0]));
      } else {
        // If no data, try to get columns from pragma
        const info = db.getAllSync<{ name: string }>(`PRAGMA table_info(${tableName})`);
        setColumns(info.map((i) => i.name));
      }
    } catch (error) {
      console.error(`Failed to load data for ${tableName}:`, error);
      Alert.alert("Error", `Failed to load data for ${tableName}`);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadData(selectedTable);
    }
  }, [selectedTable]);

  const handleDeleteRow = (id: any) => {
    if (!selectedTable) return;
    
    Alert.alert(
      "Delete Row",
      "Are you sure you want to delete this row?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              // Assume 'id' column exists for simplicity in this explorer
              db.runSync(`DELETE FROM ${selectedTable} WHERE id = ?`, [id]);
              loadData(selectedTable);
            } catch (error) {
              Alert.alert("Error", "Could not delete row. Does it have an 'id' column?");
            }
          },
        },
      ]
    );
  };

  const handleClearTable = () => {
    if (!selectedTable) return;

    Alert.alert(
      "Clear Table",
      `Are you sure you want to delete ALL rows from ${selectedTable}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            try {
              db.runSync(`DELETE FROM ${selectedTable}`);
              loadData(selectedTable);
            } catch (error) {
              Alert.alert("Error", "Failed to clear table");
            }
          },
        },
      ]
    );
  };

  const handleSaveRow = () => {
    if (!selectedTable) return;
    try {
      const rowData = JSON.parse(jsonInput);
      const keys = Object.keys(rowData);
      const values = Object.values(rowData) as any[];

      if (editingRow) {
        // UPDATE
        const setClause = keys.map((k) => `${k} = ?`).join(", ");
        db.runSync(
          `UPDATE ${selectedTable} SET ${setClause} WHERE id = ?`,
          [...values, editingRow.id] as any[]
        );
      } else {
        // INSERT
        const placeholders = keys.map(() => "?").join(", ");
        db.runSync(
          `INSERT INTO ${selectedTable} (${keys.join(", ")}) VALUES (${placeholders})`,
          values
        );
      }
      setIsModalVisible(false);
      loadData(selectedTable);
    } catch (error) {
      Alert.alert("Error", "Invalid JSON or database error: " + (error as Error).message);
    }
  };

  const openAddModal = () => {
    if (!selectedTable) return;
    setEditingRow(null);
    // Create a template object with empty strings for each column
    const template: any = {};
    columns.forEach(col => {
      if (col !== 'id') template[col] = "";
    });
    setJsonInput(JSON.stringify(template, null, 2));
    setIsModalVisible(true);
  };

  const openEditModal = (row: any) => {
    setEditingRow(row);
    setJsonInput(JSON.stringify(row, null, 2));
    setIsModalVisible(true);
  };

  if (!__DEV__) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">Access Denied</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: "DB Explorer", headerShadowVisible: false }} />
      
      {/* Table Selector */}
      <View className="px-4 py-2 border-b border-border">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tables.map((table) => (
            <TouchableOpacity
              key={table}
              onPress={() => setSelectedTable(table)}
              className={`mr-2 px-4 py-2 rounded-full border ${
                selectedTable === table ? "bg-primary border-primary" : "bg-card border-border"
              }`}
            >
              <Text className={selectedTable === table ? "text-primary-foreground font-bold" : "text-foreground"}>
                {table}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Table Actions */}
      <View className="px-4 py-3 flex-row justify-between items-center bg-muted/30">
        <Text className="text-sm font-bold text-muted-foreground uppercase">
          {selectedTable} ({data.length} rows)
        </Text>
        {/* <TouchableOpacity onPress={handleClearTable} className="flex-row items-center gap-1 py-2">
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
          <Text className="text-destructive text-sm font-medium">Clear All</Text>
        </TouchableOpacity> */}
        <TouchableOpacity onPress={openAddModal} className="flex-row items-center gap-1 bg-primary px-3 py-2 rounded-full">
          <Ionicons name="add" size={16} color="#fff" />
          <Text className="text-primary-foreground text-sm font-medium">Add Row</Text>
        </TouchableOpacity>
      </View>

      {/* Data Grid */}
      <ScrollView horizontal>
        <ScrollView>
          <View className="bg-card pb-48">
            {/* Header */}
            <View className="flex-row border-b border-border bg-muted/50">
              <View className="w-12 p-2 border-r border-border items-center justify-center">
                <Text className="text-[10px] font-bold text-muted-foreground">#</Text>
              </View>
              {columns.map((col) => (
                <View key={col} className="w-32 p-2 border-r border-border">
                  <Text className="text-[10px] font-bold text-muted-foreground uppercase">{col}</Text>
                </View>
              ))}
              <View className="w-24 p-2 items-center justify-center">
                <Text className="text-[10px] font-bold text-muted-foreground uppercase">Actions</Text>
              </View>
            </View>

            {/* Rows */}
            {data.length === 0 ? (
              <View className="p-10 items-center justify-center w-[500px]">
                <Text className="text-muted-foreground italic">No data in this table</Text>
              </View>
            ) : (
              data.map((row, index) => (
                <View key={index} className="flex-row border-b border-border">
                  <View className="w-12 p-2 border-r border-border items-center justify-center">
                    <Text className="text-[10px] text-muted-foreground">{index + 1}</Text>
                  </View>
                  {columns.map((col) => (
                    <View key={col} className="w-32 p-3 border-r border-border">
                      <Text className="text-[11px] text-foreground" numberOfLines={2}>
                        {row[col]?.toString() ?? "NULL"}
                      </Text>
                    </View>
                  ))}
                  <View className="w-24 flex-row items-center justify-center gap-2">
                    <TouchableOpacity className="p-2" onPress={() => openEditModal(row)}>
                      <Ionicons name="pencil" size={18} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2" onPress={() => handleDeleteRow(row.id)}>
                      <Ionicons name="close-circle" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </ScrollView>

      {/* FAB to reload */}
      <TouchableOpacity
        onPress={() => selectedTable && loadData(selectedTable)}
        className="absolute bottom-6 right-6 w-12 h-12 bg-primary rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="refresh" size={24} color="white" />
      </TouchableOpacity>

      {/* JSON Editor Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-card rounded-t-3xl p-6 h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-foreground">
                {editingRow ? "Edit Row" : "Add New Row"}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-muted-foreground mb-2">
              Edit row data in JSON format:
            </Text>
            
            <View className="flex-1 bg-muted/20 rounded-xl p-2 border border-border">
              <TextInput
                multiline
                className="flex-1 text-foreground text-sm font-mono"
                value={jsonInput}
                onChangeText={setJsonInput}
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveRow}
              className="bg-primary py-4 rounded-2xl mt-4 items-center"
            >
              <Text className="text-primary-foreground font-bold">Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
