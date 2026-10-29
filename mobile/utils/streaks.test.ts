import { computeStreakStats, isDayCompleted } from './streaks';
import { Habit, HabitLog } from '../types/habit';

describe('Streak Calculation & Never-Miss-Twice Logic', () => {
  const baseHabit: Habit = {
    id: 'habit-1',
    name: 'Morning Workout',
    icon: 'barbell',
    color: '#10B981',
    type: 'check',
    target: 1,
    scheduledDays: [0, 1, 2, 3, 4, 5, 6], // Daily
    createdAt: '2026-10-01T00:00:00.000Z',
    sortOrder: 0,
  };

  test('isDayCompleted correctly verifies target completion', () => {
    expect(isDayCompleted(baseHabit, undefined)).toBe(false);
    expect(isDayCompleted(baseHabit, { id: '1', habitId: 'habit-1', date: '2026-10-20', value: 0 })).toBe(false);
    expect(isDayCompleted(baseHabit, { id: '1', habitId: 'habit-1', date: '2026-10-20', value: 1 })).toBe(true);
    expect(isDayCompleted(baseHabit, { id: '1', habitId: 'habit-1', date: '2026-10-20', value: 1, skipped: true })).toBe(false);

    const countHabit: Habit = { ...baseHabit, type: 'count', target: 5 };
    expect(isDayCompleted(countHabit, { id: '2', habitId: 'habit-1', date: '2026-10-20', value: 4 })).toBe(false);
    expect(isDayCompleted(countHabit, { id: '2', habitId: 'habit-1', date: '2026-10-20', value: 5 })).toBe(true);
    expect(isDayCompleted(countHabit, { id: '2', habitId: 'habit-1', date: '2026-10-20', value: 10 })).toBe(true);
  });

  test('consecutive completed days increment streak', () => {
    const today = '2026-10-20';
    const logs: HabitLog[] = [
      { id: '1', habitId: 'habit-1', date: '2026-10-18', value: 1 },
      { id: '2', habitId: 'habit-1', date: '2026-10-19', value: 1 },
      { id: '3', habitId: 'habit-1', date: '2026-10-20', value: 1 },
    ];

    const stats = computeStreakStats(baseHabit, logs, today);
    expect(stats.currentStreak).toBe(3);
    expect(stats.bestStreak).toBe(3);
    expect(stats.isAtRisk).toBe(false);
    expect(stats.totalCompletions).toBe(3);
    expect(stats.lastCompletedDate).toBe('2026-10-20');
  });

  test('never-miss-twice: one missed day does NOT break streak', () => {
    const today = '2026-10-20';
    // Days: 17 (done), 18 (missed), 19 (done), 20 (done)
    const logs: HabitLog[] = [
      { id: '1', habitId: 'habit-1', date: '2026-10-17', value: 1 },
      // 2026-10-18 missed!
      { id: '2', habitId: 'habit-1', date: '2026-10-19', value: 1 },
      { id: '3', habitId: 'habit-1', date: '2026-10-20', value: 1 },
    ];

    const stats = computeStreakStats(baseHabit, logs, today);
    // 3 completions preserved because 2026-10-18 was only 1 miss
    expect(stats.currentStreak).toBe(3);
    expect(stats.bestStreak).toBe(3);
    expect(stats.isAtRisk).toBe(false);
  });

  test('two consecutive missed days DO break streak', () => {
    const today = '2026-10-20';
    // Days: 16 (done), 17 (missed), 18 (missed), 19 (done), 20 (done)
    const logs: HabitLog[] = [
      { id: '1', habitId: 'habit-1', date: '2026-10-16', value: 1 },
      // 17 and 18 missed
      { id: '2', habitId: 'habit-1', date: '2026-10-19', value: 1 },
      { id: '3', habitId: 'habit-1', date: '2026-10-20', value: 1 },
    ];

    const stats = computeStreakStats(baseHabit, logs, today);
    // Streak resets after 17 and 18, so current streak is 2 (19 and 20)
    expect(stats.currentStreak).toBe(2);
    expect(stats.bestStreak).toBe(2);
  });

  test('skipping a day does not count as a miss', () => {
    const today = '2026-10-20';
    // Days: 17 (done), 18 (missed), 19 (skipped), 20 (done)
    const logs: HabitLog[] = [
      { id: '1', habitId: 'habit-1', date: '2026-10-17', value: 1 },
      // 18 missed (1 miss)
      { id: '2', habitId: 'habit-1', date: '2026-10-19', value: 0, skipped: true }, // skipped, not a second miss!
      { id: '3', habitId: 'habit-1', date: '2026-10-20', value: 1 },
    ];

    const stats = computeStreakStats(baseHabit, logs, today);
    // 17 and 20 completed = 2 completions in streak
    expect(stats.currentStreak).toBe(2);
    expect(stats.isAtRisk).toBe(false);
  });

  test('streak at risk indicator when yesterday missed and today is pending', () => {
    const today = '2026-10-20';
    // Days: 18 (done), 19 (missed), 20 (not done yet)
    const logs: HabitLog[] = [
      { id: '1', habitId: 'habit-1', date: '2026-10-18', value: 1 },
      // 19 missed
      // 20 not completed yet
    ];

    const stats = computeStreakStats(baseHabit, logs, today);
    expect(stats.isAtRisk).toBe(true);
    // Active streak is still 1 (protected by never-miss-twice rule pending today)
    expect(stats.currentStreak).toBe(1);
  });

  test('unscheduled days are ignored', () => {
    // Weekday-only habit (Mon to Fri = 1, 2, 3, 4, 5)
    const weekdayHabit: Habit = {
      ...baseHabit,
      scheduledDays: [1, 2, 3, 4, 5],
    };
    // 2026-10-16 (Fri), 2026-10-17 (Sat - unscheduled), 2026-10-18 (Sun - unscheduled), 2026-10-19 (Mon)
    const logs: HabitLog[] = [
      { id: '1', habitId: 'habit-1', date: '2026-10-16', value: 1 },
      // Sat & Sun no logs, unscheduled
      { id: '2', habitId: 'habit-1', date: '2026-10-19', value: 1 },
    ];

    const stats = computeStreakStats(weekdayHabit, logs, '2026-10-19');
    expect(stats.currentStreak).toBe(2);
    expect(stats.isAtRisk).toBe(false);
  });

  test('completion rates 7d and 30d calculate correctly', () => {
    const today = '2026-10-07';
    // 7 days: Oct 1 to Oct 7. Suppose completed 5 days out of 7.
    const logs: HabitLog[] = [
      { id: '1', habitId: 'habit-1', date: '2026-10-01', value: 1 },
      { id: '2', habitId: 'habit-1', date: '2026-10-02', value: 1 },
      { id: '3', habitId: 'habit-1', date: '2026-10-03', value: 1 },
      { id: '4', habitId: 'habit-1', date: '2026-10-04', value: 1 },
      { id: '5', habitId: 'habit-1', date: '2026-10-05', value: 1 },
    ];

    const stats = computeStreakStats(baseHabit, logs, today);
    // 5 out of 7 = 71%
    expect(stats.completionRate7d).toBe(71);
  });
});
