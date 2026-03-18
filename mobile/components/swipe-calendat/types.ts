export interface SwipeCalendarProps {
  accentColor?: string;
  markedDates?: string[];
  selectedDate?: string;
  todayLabel?: string;
  onDayPress?: (iso: string) => void;
}

export interface MonthView {
  year: number;
  month: number;
}