import * as Haptics from "expo-haptics";

export const haptic = {
    light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    rigid: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),
    soft: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),
    notificationSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    notificationWarning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    notificationError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    selection: () => Haptics.selectionAsync(),
    longPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
}