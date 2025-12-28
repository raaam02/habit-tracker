import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock Data
const HISTORY = [
  { id: 1, date: "Today, Oct 15", status: "COMPLETED", note: "Felt distracted but finished 10 minutes. Breathing was steady...", color: "bg-emerald-100 text-emerald-700" },
  { id: 2, date: "Oct 14", status: "COMPLETED", note: "Great session. Really needed this after a stressful meeting.", color: "bg-emerald-100 text-emerald-700" },
  { id: 3, date: "Oct 03", status: "SKIPPED", note: "No notes recorded.", color: "bg-gray-100 text-gray-600" },
];

const CALENDAR_DAYS = [
  // Static representation of a week or so
  { date: 15, day: "S", status: "none" },
  { date: 16, day: "M", status: "none" },
  { date: 17, day: "T", status: "none" },
  { date: 18, day: "W", status: "none" },
  { date: 4, day: "T", status: "done" },
  { date: 5, day: "F", status: "done" },
  { date: 6, day: "S", status: "done" },
];

export default function HabitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1">
        <View className="px-6 flex-row justify-between items-center py-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="h-10 w-10 bg-gray-50 rounded-full items-center justify-center border border-gray-200"
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity className="h-10 w-10 bg-gray-50 rounded-full items-center justify-center border border-gray-200">
            <Ionicons name="ellipsis-horizontal" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="items-center px-6 mb-8">
            <View className="bg-emerald-100 px-4 py-1.5 rounded-full mb-4">
               <Text className="text-emerald-700 font-bold text-xs uppercase tracking-wide">Daily Goal</Text>
            </View>
            <Text className="text-3xl font-extrabold text-gray-900 text-center mb-8">
              Morning{"\n"}Meditation
            </Text>

             {/* Circular Progress Ring Placeholder */}
             {/* Note: In a real app we'd use SVG. Using a View Hack for now to simulate the look */}
            <View className="h-64 w-64 items-center justify-center relative">
               {/* Outer Circle (Background) */}
               <View className="absolute h-64 w-64 rounded-full border-[12px] border-emerald-50" />
               {/* Partial Circle (Progress - simulate with border colors or just static for now since no SVG lib requested) */}
               {/* Simulating 75% progress with a simple border style is tricky without SVG. 
                   We will make a full circle with a visually distinct border. */}
               <View className="absolute h-64 w-64 rounded-full border-[12px] border-emerald-500 border-l-transparent border-b-transparent rotate-45" />

               <View className="items-center justify-center bg-white h-56 w-56 rounded-full shadow-sm">
                  <Ionicons name="flame" size={32} color="#10B981" className="mb-2" />
                  <Text className="text-6xl font-extrabold text-gray-900">12</Text>
                  <Text className="text-gray-400 font-bold text-xs tracking-widest uppercase mt-1">Day Streak</Text>
               </View>
            </View>
          </View>

          {/* Check In Button */}
          <View className="px-6 mb-10">
            <TouchableOpacity className="bg-gray-900 w-full py-4 rounded-full flex-row items-center justify-center shadow-lg shadow-gray-400">
               <View className="bg-white rounded-full p-0.5 mr-2">
                 <Ionicons name="checkmark-circle" size={20} color="#111827" />
               </View>
              <Text className="text-white font-bold text-lg">Check In Today</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View className="px-6 mb-10">
            <Text className="text-lg font-bold text-gray-900 mb-4">Progress</Text>
            <View className="flex-row justify-between gap-4">
               <View className="flex-1 bg-white p-4 rounded-3xl items-center border border-gray-100 shadow-sm">
                 <Text className="text-2xl font-bold text-gray-900">45</Text>
                 <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Best</Text>
               </View>
               <View className="flex-1 bg-white p-4 rounded-3xl items-center border border-gray-100 shadow-sm">
                 <Text className="text-2xl font-bold text-gray-900">128</Text>
                 <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Total</Text>
               </View>
               <View className="flex-1 bg-white p-4 rounded-3xl items-center border border-b-4 border-indigo-500 shadow-sm">
                 <View className="flex-row items-baseline">
                    <Text className="text-2xl font-bold text-gray-900">85</Text>
                    <Text className="text-sm font-bold text-gray-500">%</Text>
                 </View>
                 <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Rate</Text>
               </View>
            </View>
          </View>

          {/* Calendar View (Static) */}
          <View className="mx-6 p-6 bg-white rounded-3xl shadow-sm border border-gray-100 mb-10">
            <View className="flex-row justify-between items-center mb-6">
               <Text className="text-gray-400 font-bold text-xs uppercase tracking-wider">Overview</Text>
               <View className="flex-row gap-2">
                 <TouchableOpacity className="bg-gray-100 p-1 rounded-full"><Ionicons name="chevron-back" size={16} color="gray"/></TouchableOpacity>
                 <TouchableOpacity className="bg-gray-100 p-1 rounded-full"><Ionicons name="chevron-forward" size={16} color="gray"/></TouchableOpacity>
               </View>
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-6">October 2023</Text>
            
            {/* Simple Grid Placeholder */}
             <View className="flex-row justify-between mb-4">
               {["S","M","T","W","T","F","S"].map((d,i) => (
                 <Text key={i} className="text-gray-300 font-bold text-xs w-8 text-center">{d}</Text>
               ))}
             </View>
             {/* Rows */}
             <View className="flex-row justify-between mb-2">
                 {[4,5,6,7,8,9,10].map((d, i) => (
                    <View key={i} className={`w-8 h-8 rounded-full items-center justify-center ${d >= 4 ? 'bg-emerald-500' : ''}`}>
                       <Text className={`text-xs font-medium ${d>=4 ? 'text-white':'text-gray-400'}`}>{d}</Text>
                    </View>
                 ))}
             </View>
              <View className="flex-row justify-between">
                 {[11,12,13,14,15,16,17].map((d, i) => (
                    <View key={i} className={`w-8 h-8 rounded-full items-center justify-center ${d <= 15 ? 'bg-emerald-500' : ''} ${d === 15 ? 'border-2 border-gray-800' : ''}`}>
                       <Text className={`text-xs font-medium ${d<=15? 'text-white':'text-gray-300'}`}>{d}</Text>
                    </View>
                 ))}
             </View>
          </View>

          {/* History */}
          <View className="bg-gray-50 rounded-t-[40px] px-6 pt-10 pb-20">
             <View className="flex-row justify-between items-center mb-6">
               <Text className="text-lg font-bold text-gray-900">History & Notes</Text>
               <Text className="text-indigo-600 font-bold text-xs uppercase">View All</Text>
             </View>

             <View className="relative border-l-2 border-gray-200 ml-3 space-y-8 pl-8">
               {HISTORY.map((item, index) => (
                 <View key={item.id} className="relative mb-6">
                    {/* Timeline Dot */}
                    <View className={`absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-gray-50 ${item.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    
                    <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                       <View className="flex-row justify-between items-center mb-3">
                          <Text className="font-bold text-gray-900">{item.date}</Text>
                          <View className={`px-2 py-1 rounded-md ${item.status === 'COMPLETED' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                             <Text className={`text-[10px] font-bold ${item.status === 'COMPLETED' ? 'text-emerald-700' : 'text-gray-500'}`}>{item.status}</Text>
                          </View>
                       </View>
                       <Text className="text-gray-500 text-sm leading-5">{item.note}</Text>
                    </View>
                 </View>
               ))}
             </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
