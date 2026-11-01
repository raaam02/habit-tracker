import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs } from 'expo-router/native-tabs';
import { useAppTheme } from '../../constants/useAppTheme';

export default function NativeTabLayout() {
  const { theme, isDark } = useAppTheme();

  return (
    <NativeTabs
      backgroundColor={theme.surface}
      tintColor={theme.accent}
      minimizeBehavior="onScrollDown"
      labelVisibilityMode="labeled"
      indicatorColor={isDark ? 'rgba(99, 102, 241, 0.22)' : 'rgba(99, 102, 241, 0.16)'}
      rippleColor={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
      iconColor={{
        default: theme.textMuted,
        selected: theme.accent,
      }}
      labelStyle={{
        default: {
          color: theme.textMuted,
          fontSize: 11,
          fontWeight: '500',
        },
        selected: {
          color: theme.accent,
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="checkmark.circle" md="check_box" />
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Icon sf="chart.bar.xaxis" md="bar_chart" />
        <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="habits">
        <NativeTabs.Trigger.Icon sf="square.stack.3d.up" md="layers" />
        <NativeTabs.Trigger.Label>Habits</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
