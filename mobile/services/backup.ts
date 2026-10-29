import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Habit, HabitLog, AppSettings } from '../types/habit';

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  habits: Habit[];
  logs: HabitLog[];
  settings?: Partial<AppSettings>;
}

/**
 * Export habits and logs as JSON.
 * - On Web: triggers browser file download.
 * - On Native (Android/iOS): saves to local cache and opens system share sheet.
 */
export async function exportHabitData(payload: {
  habits: Habit[];
  logs: HabitLog[];
  settings: AppSettings;
}): Promise<boolean> {
  const exportData: ExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    habits: payload.habits,
    logs: payload.logs,
    settings: payload.settings,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const fileName = `habit-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;

  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error('Web export failed:', err);
      return false;
    }
  }

  try {
    const file = new File(Paths.cache, fileName);
    await file.write(jsonString);

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Habit Tracker Backup',
        UTI: 'public.json',
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error('Native export failed:', err);
    return false;
  }
}

/**
 * Pick and import backup JSON file.
 * - On Web: opens HTML file picker.
 * - On Native: opens DocumentPicker.
 */
export async function pickAndImportData(): Promise<{
  habits: Habit[];
  logs: HabitLog[];
  settings?: Partial<AppSettings>;
} | null> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = async (event: any) => {
        const file = event.target?.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.habits) && Array.isArray(parsed.logs)) {
            resolve({
              habits: parsed.habits,
              logs: parsed.logs,
              settings: parsed.settings,
            });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      input.click();
    });
  }

  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (res.canceled || !res.assets || res.assets.length === 0) {
      return null;
    }

    const file = new File(res.assets[0].uri);
    const content = await file.text();
    const parsed = JSON.parse(content);

    if (Array.isArray(parsed.habits) && Array.isArray(parsed.logs)) {
      return {
        habits: parsed.habits,
        logs: parsed.logs,
        settings: parsed.settings,
      };
    }
    return null;
  } catch (err) {
    console.error('Import failed:', err);
    return null;
  }
}
