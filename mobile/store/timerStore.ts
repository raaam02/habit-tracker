import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '../types/habit';

interface TimerStoreState {
  habitId: string | null;
  habit: Habit | null;
  targetMinutes: number;
  accumulatedSeconds: number;
  lastStartedAt: number | null; // timestamp (ms) when play was pressed
  isRunning: boolean;
  isFinished: boolean;
  isModalOpen: boolean;
  isFullscreen: boolean;

  // Actions
  startTimer: (habit: Habit, initialMinutes?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  finishTimer: () => { loggedMinutes: number; habitId: string | null };
  stopAndDiscardTimer: () => void;
  markGoalReached: () => void;
  setModalOpen: (open: boolean) => void;
  toggleFullscreen: () => void;
  setFullscreen: (fullscreen: boolean) => void;
  getElapsedSeconds: () => number;
}

export const useTimerStore = create<TimerStoreState>()(
  persist(
    (set, get) => ({
      habitId: null,
      habit: null,
      targetMinutes: 30,
      accumulatedSeconds: 0,
      lastStartedAt: null,
      isRunning: false,
      isFinished: false,
      isModalOpen: false,
      isFullscreen: false,

      startTimer: (habit: Habit, initialMinutes = 0) => {
        const current = get();
        // If already tracking this exact habit, just open the modal
        if (current.habitId === habit.id) {
          set({ isModalOpen: true });
          return;
        }

        const startingSecs = Math.max(0, initialMinutes * 60);
        const targetMin = habit.target || 30;
        const now = Date.now();

        set({
          habitId: habit.id,
          habit,
          targetMinutes: targetMin,
          accumulatedSeconds: startingSecs,
          lastStartedAt: now,
          isRunning: true,
          isFinished: startingSecs >= targetMin * 60,
          isModalOpen: true,
        });
      },

      pauseTimer: () => {
        const { isRunning, lastStartedAt, accumulatedSeconds, targetMinutes } = get();
        if (!isRunning || !lastStartedAt) return;

        const now = Date.now();
        const delta = Math.floor((now - lastStartedAt) / 1000);
        const newAccumulated = accumulatedSeconds + Math.max(0, delta);
        const targetSecs = targetMinutes * 60;

        set({
          isRunning: false,
          lastStartedAt: null,
          accumulatedSeconds: newAccumulated,
          isFinished: newAccumulated >= targetSecs,
        });
      },

      resumeTimer: () => {
        const { isRunning } = get();
        if (isRunning) return;

        set({
          isRunning: true,
          lastStartedAt: Date.now(),
        });
      },

      resetTimer: () => {
        set({
          accumulatedSeconds: 0,
          lastStartedAt: null,
          isRunning: false,
          isFinished: false,
        });
      },

      finishTimer: () => {
        const currentSeconds = get().getElapsedSeconds();
        const habitId = get().habitId;
        const loggedMinutes = Math.max(1, Math.round(currentSeconds / 60));

        set({
          habitId: null,
          habit: null,
          accumulatedSeconds: 0,
          lastStartedAt: null,
          isRunning: false,
          isFinished: false,
          isModalOpen: false,
          isFullscreen: false,
        });

        return { loggedMinutes, habitId };
      },

      markGoalReached: () => {
        const { isRunning, lastStartedAt, accumulatedSeconds, targetMinutes } = get();
        if (!isRunning) return;

        const now = Date.now();
        const delta = lastStartedAt ? Math.floor((now - lastStartedAt) / 1000) : 0;
        const totalSecs = Math.max(targetMinutes * 60, accumulatedSeconds + delta);

        set({
          isRunning: false,
          lastStartedAt: null,
          accumulatedSeconds: totalSecs,
          isFinished: true,
        });
      },

      stopAndDiscardTimer: () => {
        set({
          habitId: null,
          habit: null,
          accumulatedSeconds: 0,
          lastStartedAt: null,
          isRunning: false,
          isFinished: false,
          isModalOpen: false,
          isFullscreen: false,
        });
      },

      setModalOpen: (open: boolean) => set({ isModalOpen: open }),

      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),

      setFullscreen: (fullscreen: boolean) => set({ isFullscreen: fullscreen }),

      getElapsedSeconds: () => {
        const { accumulatedSeconds, lastStartedAt, isRunning } = get();
        if (!isRunning || !lastStartedAt) {
          return accumulatedSeconds;
        }
        const delta = Math.floor((Date.now() - lastStartedAt) / 1000);
        return accumulatedSeconds + Math.max(0, delta);
      },
    }),
    {
      name: 'habit_active_timer_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        habitId: state.habitId,
        habit: state.habit,
        targetMinutes: state.targetMinutes,
        accumulatedSeconds: state.accumulatedSeconds,
        lastStartedAt: state.lastStartedAt,
        isRunning: state.isRunning,
        isFinished: state.isFinished,
        isFullscreen: state.isFullscreen,
      }),
    }
  )
);
