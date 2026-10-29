import { useColorScheme } from 'react-native';
import { useHabitStore } from '../store/habitStore';
import { darkTheme, lightTheme, ColorTheme } from './theme';
import { ThemePreference } from '../types/habit';

export function useAppTheme(): {
  theme: ColorTheme;
  isDark: boolean;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
} {
  const systemScheme = useColorScheme();
  const themePreference = useHabitStore((state) => state.settings.theme);
  const updateSettings = useHabitStore((state) => state.updateSettings);

  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'system' && systemScheme !== 'light');

  const theme = isDark ? darkTheme : lightTheme;

  const setThemePreference = (pref: ThemePreference) => {
    updateSettings({ theme: pref });
  };

  return {
    theme,
    isDark,
    themePreference,
    setThemePreference,
  };
}
