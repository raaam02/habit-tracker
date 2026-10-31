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

  const topInset = Platform.OS === 'ios' ? insets.top : 0;
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

  // Top blurred glass bar opacity when scrolled
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

  // Large title fades and translates slightly up as it scrolls under the nav bar
  const largeTitleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [1, 0],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.15, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <>
      {/* Sticky Top Navigation Bar */}
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
        {/* Background Blur */}
        <Animated.View style={[StyleSheet.absoluteFill, navBarBgStyle]}>
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
        <View style={styles.navContent}>
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

          {/* Right Action button if any */}
          {rightAction ? (
            <View style={styles.navRightWrap}>{rightAction}</View>
          ) : null}
        </View>
      </View>

      {/* Large Collapsible Title rendered at top of content */}
      <Animated.View style={[styles.largeTitleContainer, largeTitleAnimatedStyle]}>
        <View style={styles.largeTitleRow}>
          <View style={styles.titleCol}>
            {subtitle ? (
              <Text style={[styles.subtitleText, { color: theme.textMuted }]}>
                {subtitle}
              </Text>
            ) : null}
            <Text style={[styles.largeTitleText, { color: theme.text }]}>
              {title}
            </Text>
          </View>
          {rightAction ? <View style={styles.inlineRightAction}>{rightAction}</View> : null}
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.base,
    position: 'relative',
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
  navRightWrap: {
    position: 'absolute',
    right: SPACING.base,
    bottom: 6,
  },
  largeTitleContainer: {
    paddingHorizontal: SPACING.base,
    paddingTop: Platform.OS === 'ios' ? 52 : SPACING.sm,
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
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.35,
  },
  inlineRightAction: {
    marginLeft: SPACING.sm,
    marginBottom: 4,
  },
});
