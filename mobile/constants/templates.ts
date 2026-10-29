import { Habit } from '../types/habit';

export interface HabitTemplate extends Omit<Habit, 'id' | 'createdAt' | 'sortOrder'> {
  templateId: string;
}

export const STARTER_TEMPLATES: HabitTemplate[] = [
  {
    templateId: 'dsa',
    name: 'Solve 2 DSA problems',
    icon: 'code-slash',
    color: '#3B82F6', // Blue
    type: 'count',
    target: 2,
    scheduledDays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: '19:00',
  },
  {
    templateId: 'study',
    name: 'CS or AWS study',
    icon: 'book',
    color: '#8B5CF6', // Violet
    type: 'minutes',
    target: 45,
    scheduledDays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: '17:00',
  },
  {
    templateId: 'gym',
    name: 'Gym',
    icon: 'barbell',
    color: '#10B981', // Emerald
    type: 'check',
    target: 1,
    scheduledDays: [1, 2, 3, 4, 5, 6], // Mon - Sat
    reminderTime: '07:30',
  },
  {
    templateId: 'commit',
    name: 'GitHub commit',
    icon: 'git-commit',
    color: '#14B8A6', // Teal
    type: 'check',
    target: 1,
    scheduledDays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: '21:00',
  },
  {
    templateId: 'sleep',
    name: 'Sleep by 10:30 PM',
    icon: 'moon',
    color: '#6366F1', // Indigo
    type: 'check',
    target: 1,
    scheduledDays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: '22:15',
  },
  {
    templateId: 'review',
    name: 'Weekly review',
    icon: 'calendar',
    color: '#F59E0B', // Amber
    type: 'check',
    target: 1,
    scheduledDays: [0], // Sundays only
    reminderTime: '18:00',
  },
];
