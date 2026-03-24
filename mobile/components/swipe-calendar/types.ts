export interface SwipeCalendarProps {
  accentColor?: string;
  backgroundColor?: string;
  markedDates?: string[];
  selectedDate?: string;
  todayLabel?: string;
  onDayPress?: (iso: string) => void;
  weekLabelConfig?: WeekLabelConfig;
}

export interface MonthView {
  year: number;
  month: number;
}

export type WeekLabelFormat = "narrow" | "short" | "long";
// "narrow" → M T W T F S S
// "short"  → Mon Tue Wed ...
// "long"   → Monday Tuesday ...

export interface WeekLabelConfig {
  format?: WeekLabelFormat;   // default: "short"
  uppercase?: boolean;         // default: true
}