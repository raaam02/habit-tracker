import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../constants/useAppTheme';
import { triggerHaptic } from '../services/haptics';
import { TYPOGRAPHY, RADII } from '../constants/theme';

export interface FloatingTabBarProps {
  state: any;
  descriptors: Record<string, { options: any }>;
  navigation?: any;
  navigateToTab?: (routeKey: string) => void;
  emitter?: any;
  insets?: any;
}

export const FloatingGlassTabBar: React.FC<FloatingTabBarProps> = ({
  state,
  descriptors,
  navigation,
  navigateToTab,
  emitter,
}) => {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const getIconName = (routeName: string, focused: boolean): any => {
    switch (routeName) {
      case 'index':
        return focused ? 'checkbox' : 'checkbox-outline';
      case 'stats':
        return focused ? 'bar-chart' : 'bar-chart-outline';
      case 'habits':
        return focused ? 'layers' : 'layers-outline';
      case 'settings':
        return focused ? 'settings' : 'settings-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getLabel = (routeName: string): string => {
    switch (routeName) {
      case 'index':
        return 'Today';
      case 'stats':
        return 'Stats';
      case 'habits':
        return 'Habits';
      case 'settings':
        return 'Settings';
      default:
        return routeName;
    }
  };

  // Filter out any hidden routes (e.g. href: null)
  const visibleRoutes = state.routes.filter((route: { key: string; name: string }) => {
    const { options } = descriptors[route.key];
    return (options as any)?.href !== null;
  });

  const bottomOffset = Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 16;

  return (
    <View pointerEvents="box-none" style={[styles.floatingWrapper, { bottom: bottomOffset }]}>
      <View
        style={[
          styles.pillContainer,
          {
            backgroundColor: isDark ? 'rgba(20, 23, 28, 0.72)' : 'rgba(255, 255, 255, 0.82)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        {/* Native Liquid Glass Blur on iOS */}
        {Platform.OS === 'ios' && (
          <BlurView
            tint={isDark ? 'systemMaterialDark' : 'systemMaterialLight'}
            intensity={85}
            style={StyleSheet.absoluteFill}
          />
        )}

        <View style={styles.tabsRow}>
          {visibleRoutes.map((route: { key: string; name: string }) => {
            const isFocused = state.routes[state.index].key === route.key;

            const onPress = () => {
              triggerHaptic.selection();
              if (navigation) {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              } else if (navigateToTab) {
                if (emitter) {
                  emitter.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                }
                if (!isFocused) {
                  navigateToTab(route.key);
                }
              }
            };

            const iconName = getIconName(route.name, isFocused);
            const label = getLabel(route.name);

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.tabItem,
                  isFocused && [
                    styles.activeBubble,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.06)',
                    },
                  ],
                  pressed && { opacity: 0.8 },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={label}
              >
                <Ionicons
                  name={iconName}
                  size={20}
                  color={isFocused ? theme.accent : theme.textSubtle}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? theme.accent : theme.textSubtle,
                      fontWeight: isFocused ? '600' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 900,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    maxWidth: 380,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: RADII.pill,
    minHeight: 46,
  },
  activeBubble: {
    borderRadius: RADII.pill,
  },
  tabLabel: {
    ...TYPOGRAPHY.tiny,
    fontSize: 10,
    marginTop: 2,
  },
});
