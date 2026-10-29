import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/useAppTheme';
import { SPACING, RADII, TYPOGRAPHY } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

interface CelebrationProps {
  visible: boolean;
  onDismiss?: () => void;
}

export const Celebration: React.FC<CelebrationProps> = ({ visible, onDismiss }) => {
  const { theme } = useAppTheme();
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      triggerHaptic.success();
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          damping: 14,
          stiffness: 160,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onDismiss?.();
        });
      }, 3500);

      return () => clearTimeout(timer);
    } else {
      scale.setValue(0.8);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: theme.elevated,
          borderColor: theme.success,
          opacity,
          transform: [{ scale }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.iconWrap, { backgroundColor: `${theme.success}20` }]}>
        <Ionicons name="sparkles" size={20} color={theme.success} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: theme.text }]}>All Habits Completed!</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          You crushed every scheduled goal for today.
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 60,
    left: SPACING.base,
    right: SPACING.base,
    maxWidth: 480,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderRadius: RADII.card,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
    zIndex: 1000,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.headline,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    marginTop: 2,
  },
});
