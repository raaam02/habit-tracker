import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Switch, Image, Alert, Platform, Share, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { db } from "@/db/database";
import { haptic } from "@/utils/haptic";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { getUserProfile, UserProfile } from "@/db/user.repository";
import { useIsFocused } from "expo-router";
import { router } from "expo-router";
import { exportBackupData, importBackupData } from "@/services/backup.service";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const isFocused = useIsFocused();

  const [confirmClearDb, setConfirmClearDb] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Backup Import States
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [backupPreview, setBackupPreview] = useState<{
    userName: string;
    habitsCount: number;
    logsCount: number;
    rawJson: string;
  } | null>(null);
  const [importError, setImportError] = useState("");

  const loadProfile = () => {
    const data = getUserProfile();
    setProfile(data);
  };

  useEffect(() => {
    if (isFocused) {
      loadProfile();
    }
  }, [isFocused]);

  const toggleTheme = () => {
    haptic.light();
    setColorScheme(isDark ? "light" : "dark");
  };

  const handleClearDatabase = () => {
    try {
      db.execSync("DELETE FROM habit_logs;");
      db.execSync("DELETE FROM habits;");
      db.execSync("DELETE FROM user_profile;");
      haptic.notificationSuccess();
      setConfirmClearDb(false);
      loadProfile();
      Alert.alert("Success", "All habit data and logs have been cleared.");
      router.replace("/onboarding");
    } catch (error) {
      console.error(error);
      haptic.notificationError();
      Alert.alert("Error", "Failed to clear the database.");
    }
  };

  // Directly download backup JSON file via direct Downloads write or Share Sheet fallback
  const handleExportData = async () => {
    try {
      haptic.light();
      const backupStr = exportBackupData();
      const filename = "habit_tracker_backup.json";
      
      if (Platform.OS === "android") {
        // Attempt direct write to a separate App folder inside public Downloads
        const appDownloadDir = "file:///storage/emulated/0/Download/HabitTracker/";
        const directDownloadPath = appDownloadDir + filename;
        try {
          const dirInfo = await FileSystem.getInfoAsync(appDownloadDir);
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(appDownloadDir, { intermediates: true });
          }

          await FileSystem.writeAsStringAsync(directDownloadPath, backupStr, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          haptic.notificationSuccess();
          Alert.alert("Success", `Backup downloaded directly to your Downloads/HabitTracker folder!`);
          return;
        } catch (directWriteError) {
          console.warn("Direct write to App Downloads folder failed, falling back to SAF:", directWriteError);
        }

        // Fallback: Use Storage Access Framework to let user select/confirm Downloads folder
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          Alert.alert("Permission Denied", "We need storage access to save the backup file.");
          return;
        }
        
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          "habit_tracker_backup",
          "application/json"
        );
        
        await FileSystem.writeAsStringAsync(fileUri, backupStr, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        
        haptic.notificationSuccess();
        Alert.alert("Success", "Backup file saved successfully!");
      } else {
        // iOS: write to documents directory and share/save
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, backupStr, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "application/json",
            dialogTitle: "Download Habit Tracker Backup",
            UTI: "public.json",
          });
          haptic.notificationSuccess();
        } else {
          Alert.alert("Error", "Sharing files is not supported on this device.");
          haptic.notificationError();
        }
      }
    } catch (e) {
      console.error(e);
      haptic.notificationError();
      Alert.alert("Error", "Failed to download json backup file.");
    }
  };

  // Select backup file via expo-document-picker
  const handlePickBackupFile = async () => {
    try {
      haptic.light();
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      
      const data = JSON.parse(content);
      if (!data.habits || !data.habit_logs) {
        setImportError("Invalid backup file: missing habits or logs.");
        setBackupPreview(null);
        haptic.notificationError();
        return;
      }

      const userName = data.user_profile?.[0]?.name || "User";
      const habitsCount = Array.isArray(data.habits) ? data.habits.length : 0;
      const logsCount = Array.isArray(data.habit_logs) ? data.habit_logs.length : 0;

      setBackupPreview({
        userName,
        habitsCount,
        logsCount,
        rawJson: content,
      });
      setImportError("");
      haptic.notificationSuccess();
    } catch (e: any) {
      console.error(e);
      setImportError("Failed to parse JSON file: " + (e.message || "Invalid syntax"));
      setBackupPreview(null);
      haptic.notificationError();
    }
  };

  const handleImportData = () => {
    if (!backupPreview) {
      setImportError("Please pick a backup file first.");
      haptic.notificationError();
      return;
    }

    haptic.light();
    const result = importBackupData(backupPreview.rawJson);
    if (result.success) {
      haptic.notificationSuccess();
      setIsImportModalVisible(false);
      setBackupPreview(null);
      setImportError("");
      loadProfile();
      Alert.alert("Success", "Backup restored successfully!", [
        { text: "OK", onPress: () => router.replace("/") }
      ]);
    } else {
      setImportError(result.error || "Failed to restore backup.");
      haptic.notificationError();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background text-foreground">
      <ScrollView className="flex-1 px-6 pb-24" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="mt-6 mb-8">
          <Text className="text-3xl font-extrabold text-foreground">Settings</Text>
        </View>

        {/* Profile Section */}
        <View className="bg-card p-6 rounded-3xl border border-border flex-row items-center gap-4 mb-6 shadow-sm">
          <View className="h-16 w-16 bg-primary/20 rounded-full items-center justify-center overflow-hidden border border-border">
            <Image 
              source={{ uri: profile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }} 
              className="h-full w-full"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">{profile?.name || "User"}</Text>
            <Text className="text-muted-foreground text-xs font-medium">{profile?.email || "alex.mitchell@example.com"}</Text>
          </View>
          <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <Text className="text-primary font-bold text-xs">Level 4</Text>
          </View>
        </View>

        {/* Preferences Section */}
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">
          Preferences
        </Text>
        <View className="bg-card rounded-3xl border border-border overflow-hidden mb-6 shadow-sm">
          
          {/* Theme Row */}
          <View className="flex-row items-center justify-between p-4 border-b border-border/40">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name={isDark ? "moon" : "sunny"} size={18} color="#6366f1" />
              </View>
              <Text className="text-base font-bold text-card-foreground">Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#767577", true: "#6366f1" }}
              thumbColor={Platform.OS === "android" ? (isDark ? "#6366f1" : "#f4f3f4") : undefined}
            />
          </View>

          {/* Haptics Row */}
          <View className="flex-row items-center justify-between p-4 border-b border-border/40">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="finger-print" size={18} color="#6366f1" />
              </View>
              <Text className="text-base font-bold text-card-foreground">Haptic Feedback</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={(val) => {
                haptic.light();
                setHapticsEnabled(val);
              }}
              trackColor={{ false: "#767577", true: "#6366f1" }}
            />
          </View>

          {/* Reminders Row */}
          <View className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="notifications" size={18} color="#6366f1" />
              </View>
              <Text className="text-base font-bold text-card-foreground">Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(val) => {
                haptic.light();
                setNotificationsEnabled(val);
              }}
              trackColor={{ false: "#767577", true: "#6366f1" }}
            />
          </View>

        </View>

        {/* Backup & Recovery */}
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">
          Backup & Recovery
        </Text>
        <View className="bg-card rounded-3xl border border-border overflow-hidden mb-6 shadow-sm">
          
          <Pressable 
            onPress={handleExportData}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="flex-row items-center justify-between p-4 border-b border-border/40"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="cloud-upload" size={18} color="#6366f1" />
              </View>
              <Text className="text-base font-bold text-card-foreground">Export Data Backup</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? "#a1a1aa" : "#71717a"} />
          </Pressable>

          <Pressable 
            onPress={() => {
              haptic.light();
              setBackupPreview(null);
              setImportError("");
              setIsImportModalVisible(true);
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="cloud-download" size={18} color="#6366f1" />
              </View>
              <Text className="text-base font-bold text-card-foreground">Import Data Backup</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? "#a1a1aa" : "#71717a"} />
          </Pressable>

        </View>

        {/* Development Settings */}
        {__DEV__ && (
          <>
            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">
              Developer Settings
            </Text>
            <View className="bg-card rounded-3xl border border-border overflow-hidden mb-6 shadow-sm">
              <Pressable
                onPress={() => {
                  haptic.light();
                  router.push("/onboarding");
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="flex-row items-center justify-between p-4"
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-9 w-9 rounded-full bg-amber-500/10 items-center justify-center">
                    <Ionicons name="sparkles" size={18} color="#D97706" />
                  </View>
                  <Text className="text-base font-bold text-card-foreground">View Onboarding Screens</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isDark ? "#a1a1aa" : "#71717a"} />
              </Pressable>
            </View>
          </>
        )}

        {/* Support Section */}
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">
          Support
        </Text>
        <View className="bg-card rounded-3xl border border-border overflow-hidden mb-6 shadow-sm">
          
          <Pressable 
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="flex-row items-center justify-between p-4 border-b border-border/40"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="help-circle" size={20} color="#6366f1" />
              </View>
              <Text className="text-base font-bold text-card-foreground">Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? "#a1a1aa" : "#71717a"} />
          </Pressable>

          <Pressable 
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="shield-checkmark" size={18} color="#6366f1" />
              </View>
              <Text className="text-base font-bold text-card-foreground">Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? "#a1a1aa" : "#71717a"} />
          </Pressable>

        </View>

        {/* Danger Zone */}
        <Text className="text-xs font-bold text-destructive uppercase tracking-widest mb-3 ml-1">
          Danger Zone
        </Text>
        <View className="bg-card rounded-3xl border border-destructive/20 overflow-hidden mb-12 shadow-sm">
          
          <Pressable 
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              haptic.notificationWarning();
              setConfirmClearDb(true);
            }} 
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 rounded-full bg-destructive/10 items-center justify-center">
                <Ionicons name="trash" size={18} color="#ef4444" />
              </View>
              <View>
                <Text className="text-base font-bold text-destructive">Clear All Data</Text>
                <Text className="text-muted-foreground text-[10px]">Delete all habits and execution logs</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ef4444" />
          </Pressable>

        </View>

        {/* Footer info */}
        <View className="items-center pb-24">
          <Text className="text-xs font-semibold text-muted-foreground/60">Habit Tracker MVP v1.0.0</Text>
          <Text className="text-[10px] text-muted-foreground/40 mt-1">Made with ❤️ for high craft performance</Text>
        </View>

      </ScrollView>

      {/* Confirm database clear */}
      <ConfirmModal
        visible={confirmClearDb}
        title="Clear All Data?"
        description="This action is permanent. All your habits, streaks, and execution logs will be deleted forever."
        confirmText="Clear Everything"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleClearDatabase}
        onCancel={() => setConfirmClearDb(false)}
      />

      {/* Import Backup Modal */}
      <Modal
        visible={isImportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsImportModalVisible(false)}
      >
        <Pressable 
          onPress={() => setIsImportModalVisible(false)} 
          className="flex-1 bg-black/40 justify-end"
        >
          <Pressable 
            onPress={(e) => e.stopPropagation()} 
            className="bg-card border-t border-border rounded-t-[32px] p-6 pb-12 w-full max-h-[85%]"
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-foreground">Import Backup</Text>
              <Pressable onPress={() => setIsImportModalVisible(false)} className="p-2">
                <Ionicons name="close" size={24} color="hsl(var(--foreground))" />
              </Pressable>
            </View>

            <Text className="text-muted-foreground text-sm mb-6 leading-5">
              Choose an exported backup file (.json) to restore your profile, habits, and logging history. Note: This will overwrite all your current local data.
            </Text>

            {backupPreview ? (
              <View className="bg-muted/30 border border-border p-5 rounded-2xl mb-6">
                <Text className="text-foreground font-bold text-base mb-3 flex-row items-center gap-1">
                  📦 Backup Found
                </Text>
                <View className="gap-2">
                  <Text className="text-muted-foreground text-sm">
                    👤 Profile Name: <Text className="text-foreground font-semibold">{backupPreview.userName}</Text>
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    ✨ Habits to restore: <Text className="text-foreground font-semibold">{backupPreview.habitsCount}</Text>
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    📊 Logs to restore: <Text className="text-foreground font-semibold">{backupPreview.logsCount}</Text>
                  </Text>
                </View>
                
                <Pressable
                  onPress={handlePickBackupFile}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="mt-4 border border-border bg-background py-2.5 rounded-xl items-center"
                >
                  <Text className="text-primary font-bold text-xs">Choose Different File</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handlePickBackupFile}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                className="border border-dashed border-border/80 bg-muted/10 p-8 rounded-2xl justify-center items-center mb-6"
              >
                <Ionicons name="document-text" size={32} color="#6366f1" />
                <Text className="text-foreground font-bold text-sm mt-3">Select Backup File</Text>
                <Text className="text-muted-foreground text-xs mt-1">Accepts only valid .json files</Text>
              </Pressable>
            )}

            {importError ? (
              <View className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl mb-4">
                <Text className="text-destructive text-xs font-semibold text-center">{importError}</Text>
              </View>
            ) : null}

            <View className="flex-row gap-4 mt-6">
              <Pressable
                onPress={() => setIsImportModalVisible(false)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="flex-1 bg-muted p-4 rounded-xl items-center justify-center"
              >
                <Text className="text-muted-foreground font-bold">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleImportData}
                disabled={!backupPreview}
                style={({ pressed }) => [{ opacity: (!backupPreview || pressed) ? 0.6 : 1 }]}
                className={`flex-1 p-4 rounded-xl items-center justify-center ${backupPreview ? 'bg-primary' : 'bg-primary/40'}`}
              >
                <Text className="text-primary-foreground font-bold">Restore Backup</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}
