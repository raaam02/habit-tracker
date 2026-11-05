import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  withTiming,
  runOnJS,
  LinearTransition,
  SharedValue,
  Easing,
} from 'react-native-reanimated';
import { Habit } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import { SPACING, RADII, TYPOGRAPHY } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

export const ROW_HEIGHT = 68;
export const ROW_GAP = SPACING.sm;
export const SLOT_HEIGHT = ROW_HEIGHT + ROW_GAP;

export interface DraggableHabitItemProps {
  habit: Habit;
  index: number;
  total: number;
  activeDragIndex: SharedValue<number>;
  currentHoverIndex: SharedValue<number>;
  dragTranslationY: SharedValue<number>;
  isPressing: SharedValue<boolean>;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onPress: () => void;
  onEdit: () => void;
  onArchive: () => void;
}

export const DraggableHabitItem: React.FC<DraggableHabitItemProps> = ({
  habit,
  index,
  total,
  activeDragIndex,
  currentHoverIndex,
  dragTranslationY,
  isPressing,
  onReorder,
  onPress,
  onEdit,
  onArchive,
}) => {
  const { theme } = useAppTheme();

  const dragGesture = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      activeDragIndex.value = index;
      currentHoverIndex.value = index;
      dragTranslationY.value = 0;
      isPressing.value = true;
      runOnJS(triggerHaptic.selection)();
    })
    .onUpdate((event) => {
      'worklet';
      dragTranslationY.value = event.translationY;
      const moveSlots = Math.round(event.translationY / SLOT_HEIGHT);
      const target = Math.max(0, Math.min(total - 1, index + moveSlots));
      if (target !== currentHoverIndex.value) {
        currentHoverIndex.value = target;
        runOnJS(triggerHaptic.selection)();
      }
    })
    .onEnd(() => {
      'worklet';
      const finalTarget = currentHoverIndex.value;
      const finalOffset = (finalTarget - index) * SLOT_HEIGHT;
      isPressing.value = false;

      dragTranslationY.value = withTiming(finalOffset, { duration: 160 }, (finished) => {
        if (finished) {
          if (finalTarget !== index) {
            runOnJS(onReorder)(index, finalTarget);
          }
          activeDragIndex.value = -1;
          currentHoverIndex.value = -1;
          dragTranslationY.value = 0;
        }
      });
      runOnJS(triggerHaptic.light)();
    })
    .onFinalize(() => {
      'worklet';
      if (isPressing.value) {
        isPressing.value = false;
        activeDragIndex.value = -1;
        currentHoverIndex.value = -1;
        dragTranslationY.value = 0;
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const isSelf = activeDragIndex.value === index;
    const isAnyActive = activeDragIndex.value !== -1;

    if (isSelf) {
      return {
        transform: [
          { translateY: dragTranslationY.value },
          {
            scale: isPressing.value
              ? withTiming(1.02, { duration: 120 })
              : withTiming(1, { duration: 120 }),
          },
        ],
        zIndex: 100,
        elevation: 12,
        shadowColor: '#000000',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      };
    }

    let shiftY = 0;
    if (isAnyActive) {
      const from = activeDragIndex.value;
      const to = currentHoverIndex.value;

      if (from < to) {
        if (index > from && index <= to) {
          shiftY = -SLOT_HEIGHT;
        }
      } else if (from > to) {
        if (index < from && index >= to) {
          shiftY = SLOT_HEIGHT;
        }
      }
    }

    return {
      transform: [
        {
          translateY: withTiming(shiftY, {
            duration: 160,
            easing: Easing.out(Easing.cubic),
          }),
        },
        { scale: 1 },
      ],
      zIndex: 1,
      elevation: 0,
      shadowOpacity: 0,
    };
  });

  return (
    <Animated.View
      layout={LinearTransition.duration(180)}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        animatedStyle,
      ]}
    >
      <GestureDetector gesture={dragGesture}>
        <View style={styles.dragHandle} hitSlop={12} accessibilityRole="button" accessibilityLabel="Drag to reorder">
          <Ionicons name="reorder-two" size={24} color={theme.textSubtle} />
        </View>
      </GestureDetector>

      <Pressable onPress={onPress} style={styles.mainPressable} accessibilityRole="button">
        <View style={[styles.iconWrap, { backgroundColor: `${habit.color}18` }]}>
          <Ionicons name={habit.icon as any} size={20} color={habit.color} />
        </View>

        <View style={styles.infoCol}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <Text style={[styles.scheduleText, { color: theme.textMuted }]}>
            {habit.scheduledDays.length === 7
              ? 'Every day'
              : `${habit.scheduledDays.length} days / week`}{' '}
            • {habit.type === 'check' ? 'Yes / No' : `${habit.target} target`}
          </Text>
        </View>
      </Pressable>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Edit habit"
        >
          <Ionicons name="pencil" size={17} color={theme.accent} />
        </Pressable>

        <Pressable
          onPress={onArchive}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Archive habit"
        >
          <Ionicons name="archive-outline" size={17} color={theme.textMuted} />
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.card,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    marginBottom: ROW_GAP,
  },
  dragHandle: {
    paddingHorizontal: 6,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    ...TYPOGRAPHY.headline,
    fontSize: 15,
    fontWeight: '600',
  },
  scheduleText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
