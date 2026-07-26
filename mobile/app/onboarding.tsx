import React, { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { saveUserProfile } from "@/db/user.repository";
import { haptic } from "@/utils/haptic";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleNext = () => {
    haptic.light();
    if (step < 2) {
      setStep(step + 1);
    } else {
      if (!name.trim()) {
        setError("Please enter your name");
        haptic.notificationError();
        return;
      }
      // Save profile and redirect to home
      saveUserProfile(name.trim());
      haptic.notificationSuccess();
      router.replace("/");
    }
  };

  const handleBack = () => {
    if (step > 0) {
      haptic.light();
      setStep(step - 1);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-between p-8">
            
            {/* Top Navigation */}
            <View className="flex-row justify-between items-center h-10">
              {step > 0 ? (
                <Pressable
                  onPress={handleBack}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="p-2 -ml-2"
                >
                  <Ionicons name="arrow-back" size={24} color="hsl(var(--foreground))" />
                </Pressable>
              ) : (
                <View />
              )}
              
              {/* Progress Dots */}
              <View className="flex-row gap-2">
                {[0, 1, 2].map((s) => (
                  <View
                    key={s}
                    className={`h-2 w-2 rounded-full ${
                      s === step ? "bg-primary w-4" : "bg-muted"
                    }`}
                  />
                ))}
              </View>
            </View>

            {/* Step Contents */}
            <View className="flex-1 justify-center my-8">
              {step === 0 && (
                <Animated.View
                  entering={FadeInRight}
                  exiting={FadeOutLeft}
                  className="items-center"
                >
                  <View className="bg-primary/10 p-6 rounded-full mb-6">
                    <Ionicons name="sparkles" size={64} color="hsl(var(--primary))" />
                  </View>
                  <Text className="text-3xl font-extrabold text-foreground text-center mb-4">
                    Transform Your Life
                  </Text>
                  <Text className="text-muted-foreground text-center text-base leading-6 px-4">
                    Track daily goals, maintain consistency streaks, and build productive habits that compound over time.
                  </Text>
                </Animated.View>
              )}

              {step === 1 && (
                <Animated.View
                  entering={FadeInRight}
                  exiting={FadeOutLeft}
                  className="items-center"
                >
                  <View className="bg-emerald-500/10 p-6 rounded-full mb-6">
                    <Ionicons name="phone-portrait-outline" size={64} color="#10B981" />
                  </View>
                  <Text className="text-3xl font-extrabold text-foreground text-center mb-4">
                    Tactile Experience
                  </Text>
                  <Text className="text-muted-foreground text-center text-base leading-6 px-4">
                    Slide left-to-right to mark complete instantly. Slide right-to-left to skip with a customized reason notes. Responsive physics are at your fingertips.
                  </Text>
                </Animated.View>
              )}

              {step === 2 && (
                <Animated.View
                  entering={FadeInRight}
                  exiting={FadeOutLeft}
                  className="w-full px-4"
                >
                  <Text className="text-3xl font-extrabold text-foreground text-center mb-4">
                    What should we call you?
                  </Text>
                  <Text className="text-muted-foreground text-center text-sm mb-8">
                    Let's personalize your daily dashboard.
                  </Text>
                  
                  <TextInput
                    autoFocus
                    placeholder="Enter your name"
                    className="border border-border rounded-2xl px-5 py-4 text-lg text-foreground placeholder:text-muted-foreground bg-card"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (error) setError("");
                    }}
                  />
                  {error && (
                    <Text className="text-destructive text-sm mt-2 ml-1">{error}</Text>
                  )}
                </Animated.View>
              )}
            </View>

            {/* Bottom Actions */}
            <View>
              <Pressable
                onPress={handleNext}
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
                className="bg-primary py-4 rounded-2xl items-center justify-center shadow-lg shadow-primary/20"
              >
                <Text className="text-primary-foreground font-bold text-lg">
                  {step === 2 ? "Get Started" : "Continue"}
                </Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
