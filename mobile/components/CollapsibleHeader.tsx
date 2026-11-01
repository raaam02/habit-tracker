import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../constants/useAppTheme';
import { TYPOGRAPHY, SPACING } from '../constants/theme';

interface CollapsibleHeaderProps {
  title: string;
  subtitle?: string;
  scrollY: SharedValue<number>;
  rightAction?: React.ReactNode;
}

export const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({
  title,
  subtitle,
  scrollY,
  rightAction,
}) => {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  // On Android, provide an immersive, clean, static header:
  // - Matches status bar background seamlessly
  // - No scroll-to-center animation
  // - No duplicate action buttons
  // - Zero dead space/padding after header
  if (Platform.OS === 'android') {
    return (
      <View style={[styles.androidHeader, { backgroundColor: theme.background }]}>
        <View style={styles.titleCol}>
          {subtitle ? (
            <Text style={[styles.subtitleText, { color: theme.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          <Text style={[styles.largeTitleText, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {rightAction ? (
          <View style={styles.androidRightAction}>{rightAction}</View>
        ) : null}
      </View>
    );
  }

  // iOS / Web Native Collapsible Header
  const topInset = Platform.OS === 'ios' ? (insets.top > 0 ? insets.top : 47) : insets.top;
  const navBarHeight = 44;

  // Mini navigation bar title appears smoothly as user scrolls past large title
  const navTitleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [35, 65],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [35, 65],
            [8, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  // Top blurred glass bar opacity only when scrolled (transparent at rest)
  const navBarBgStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [15, 55],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
    };
  });

  // Large title fades cleanly without overscroll ballooning
  const largeTitleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
    };
  });

  return (
    <>
      {/* Sticky Top Navigation Bar (iOS only) */}
      <View
        pointerEvents="box-none"
        style={[
          styles.stickyNavBar,
          {
            top: 0,
            paddingTop: topInset,
            height: navBarHeight + topInset,
          },
        ]}
      >
        {/* Background Blur only visible on scroll */}
        <Animated.View style={[StyleSheet.absoluteFill, navBarBgStyle]} pointerEvents="none">
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint={isDark ? 'systemMaterialDark' : 'systemMaterialLight'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: theme.surface, opacity: 0.96 },
              ]}
            />
          )}
          <View
            style={[
              styles.navBorder,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
            ]}
          />
        </Animated.View>

        {/* Small Center Title (Native iOS standard) */}
        <View style={styles.navContent} pointerEvents="none">
          <Animated.View style={[styles.navCenter, navTitleAnimatedStyle]}>
            <Text
              style={[
                styles.navTitleText,
                { color: theme.text },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* Large Title Header rendered once inline at top of content */}
      <Animated.View
        style={[
          styles.largeTitleContainer,
          {
            paddingTop: Platform.OS === 'ios' ? topInset + 8 : SPACING.xs,
          },
          largeTitleAnimatedStyle,
        ]}
      >
        <View style={styles.largeTitleRow}>
          <View style={styles.titleCol}>
            {subtitle ? (
              <Text style={[styles.subtitleText, { color: theme.textMuted }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            <Text style={[styles.largeTitleText, { color: theme.text }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
          {/* Exactly ONE instance of rightAction rendered */}
          {rightAction ? <View style={styles.inlineRightAction}>{rightAction}</View> : null}
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  androidHeader: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  androidRightAction: {
    marginLeft: SPACING.sm,
  },
  stickyNavBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  navBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  navContent: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.base,
  },
  navCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleText: {
    ...TYPOGRAPHY.headline,
    fontSize: 17,
    fontWeight: '600',
  },
  largeTitleContainer: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.xs,
  },
  largeTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  titleCol: {
    flex: 1,
  },
  subtitleText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    marginBottom: 2,
    fontWeight: '500',
  },
  largeTitleText: {
    ...TYPOGRAPHY.title1,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.35,
  },
  inlineRightAction: {
    marginLeft: SPACING.sm,
    marginBottom: 2,
  },
});
