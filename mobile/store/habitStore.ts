import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitLog, AppSettings } from '../types/habit';
import { getTodayDateString } from '../utils/date';
import { STARTER_TEMPLATES } from '../constants/templates';

interface UndoRecord {
  habitId: string;
  date: string;
  previousLog: HabitLog | null;
  timestamp: number;
}

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  selectedDate: string;
  settings: AppSettings;
  undoRecord: UndoRecord | null;

  // Navigation / Date Actions
  setSelectedDate: (date: string) => void;
  jumpToToday: () => void;

  // Habit CRUD Actions
  addHabit: (data: Omit<Habit, 'id' | 'createdAt' | 'sortOrder'>) => Habit;
  editHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  archiveHabit: (id: string) => void;
  restoreHabit: (id: string) => void;
  reorderHabits: (reorderedHabits: Habit[]) => void;

  // Logging & Interactivity
  logHabit: (habitId: string, date: string, value: number, note?: string | null) => void;
  incrementHabit: (habitId: string, date: string, delta?: number) => void;
  skipHabit: (habitId: string, date: string) => void;
  undoLastAction: () => void;
  clearUndo: () => void;

  // Settings & Templates
  updateSettings: (updates: Partial<AppSettings>) => void;
  preloadTemplates: (selectedTemplateIds: string[]) => void;
  importData: (data: { habits: Habit[]; logs: HabitLog[]; settings?: Partial<AppSettings> }) => boolean;
  resetAllData: () => void;
}

const defaultSettings: AppSettings = {
  userName: '',
  theme: 'system',
  weekStartDay: 0, // Sunday
  remindersEnabled: true,
  hasCompletedOnboarding: false,
  hasSeenSwipeHint: false,
  reduceMotion: false,
};

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      selectedDate: getTodayDateString(),
      settings: defaultSettings,
      undoRecord: null,

      setSelectedDate: (date: string) => set({ selectedDate: date }),

      jumpToToday: () => set({ selectedDate: getTodayDateString() }),

      addHabit: (data) => {
        const id = `habit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const sortOrder = get().habits.length;
        const newHabit: Habit = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
          sortOrder,
        };
        set((state) => ({
          habits: [...state.habits, newHabit],
        }));
        return newHabit;
      },

      editHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        }));
      },

      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          logs: state.logs.filter((l) => l.habitId !== id),
        }));
      },

      archiveHabit: (id) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, archivedAt: new Date().toISOString() } : h
          ),
        }));
      },

      restoreHabit: (id) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, archivedAt: null } : h
          ),
        }));
      },

      reorderHabits: (reorderedHabits) => {
        const updated = reorderedHabits.map((h, index) => ({
          ...h,
          sortOrder: index,
        }));
        set({ habits: updated });
      },

      logHabit: (habitId, date, value, note) => {
        const { logs } = get();
        const existing = logs.find((l) => l.habitId === habitId && l.date === date);

        // Store undo state
        set({
          undoRecord: {
            habitId,
            date,
            previousLog: existing ? { ...existing } : null,
            timestamp: Date.now(),
          },
        });

        if (existing) {
          set({
            logs: logs.map((l) =>
              l.habitId === habitId && l.date === date
                ? { ...l, value, note: note !== undefined ? note : l.note, skipped: false }
                : l
            ),
          });
        } else {
          const newLog: HabitLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            habitId,
            date,
            value,
            note: note || null,
            skipped: false,
          };
          set({ logs: [...logs, newLog] });
        }
      },

      incrementHabit: (habitId, date, delta = 1) => {
        const { habits, logs } = get();
        const habit = habits.find((h) => h.id === habitId);
        if (!habit) return;

        const existing = logs.find((l) => l.habitId === habitId && l.date === date);
        const currentValue = existing ? existing.value : 0;
        const newValue = Math.max(0, currentValue + delta);

        get().logHabit(habitId, date, newValue, existing?.note);
      },

      skipHabit: (habitId, date) => {
        const { logs } = get();
        const existing = logs.find((l) => l.habitId === habitId && l.date === date);

        set({
          undoRecord: {
            habitId,
            date,
            previousLog: existing ? { ...existing } : null,
            timestamp: Date.now(),
          },
        });

        if (existing) {
          set({
            logs: logs.map((l) =>
              l.habitId === habitId && l.date === date ? { ...l, skipped: true } : l
            ),
          });
        } else {
          const newLog: HabitLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            habitId,
            date,
            value: 0,
            skipped: true,
          };
          set({ logs: [...logs, newLog] });
        }
      },

      undoLastAction: () => {
        const { undoRecord, logs } = get();
        if (!undoRecord) return;

        const { habitId, date, previousLog } = undoRecord;

        if (previousLog) {
          // Restore previous log
          const exists = logs.some((l) => l.habitId === habitId && l.date === date);
          if (exists) {
            set({
              logs: logs.map((l) =>
                l.habitId === habitId && l.date === date ? { ...previousLog } : l
              ),
              undoRecord: null,
            });
          } else {
            set({
              logs: [...logs, previousLog],
              undoRecord: null,
            });
          }
        } else {
          // Previously had no log for this habit and date, so remove current log
          set({
            logs: logs.filter((l) => !(l.habitId === habitId && l.date === date)),
            undoRecord: null,
          });
        }
      },

      clearUndo: () => set({ undoRecord: null }),

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      preloadTemplates: (selectedTemplateIds) => {
        const toAdd = STARTER_TEMPLATES.filter((t) =>
          selectedTemplateIds.includes(t.templateId)
        );

        const currentCount = get().habits.length;
        const newHabits: Habit[] = toAdd.map((t, idx) => ({
          id: `habit_tpl_${Date.now()}_${idx}`,
          name: t.name,
          icon: t.icon,
          color: t.color,
          type: t.type,
          target: t.target,
          scheduledDays: t.scheduledDays,
          reminderTime: t.reminderTime,
          createdAt: new Date().toISOString(),
          sortOrder: currentCount + idx,
        }));

        set((state) => ({
          habits: [...state.habits, ...newHabits],
          settings: { ...state.settings, hasCompletedOnboarding: true },
        }));
      },

      importData: (imported) => {
        try {
          if (!Array.isArray(imported.habits) || !Array.isArray(imported.logs)) {
            return false;
          }
          set((state) => ({
            habits: imported.habits,
            logs: imported.logs,
            settings: imported.settings
              ? { ...state.settings, ...imported.settings }
              : state.settings,
          }));
          return true;
        } catch {
          return false;
        }
      },

      resetAllData: () => {
        set({
          habits: [],
          logs: [],
          selectedDate: getTodayDateString(),
          settings: {
            ...defaultSettings,
            hasCompletedOnboarding: true,
          },
          undoRecord: null,
        });
      },
    }),
    {
      name: 'habit-tracker-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        habits: state.habits,
        logs: state.logs,
        settings: state.settings,
      }),
    }
  )
);
