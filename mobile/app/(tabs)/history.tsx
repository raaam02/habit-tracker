import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Mock Data
const CALENDAR_GRID = [
    { d: "", id: 0 }, { d: "", id: 1 }, { d: "", id: 2 }, { d: "", id: 3 }, { d: "1", id: 4 }, { d: "2", id: 5 }, { d: "3", id: 6 },
    { d: "4", id: 7, circle: true }, { d: "5", id: 8, fill: true, selected: true }, { d: "6", id: 9 }, { d: "7", id: 10 }, { d: "8", id: 11, fill: true }, { d: "9", id: 12 }, { d: "10", id: 13, fill: true },
    { d: "11", id: 14 }, { d: "12", id: 15, circle: true }, { d: "13", id: 16 }, { d: "14", id: 17 }, { d: "15", id: 18, fill: true }, { d: "16", id: 19, fill: true }, { d: "17", id: 20, fill: true },
    { d: "18", id: 21 }, { d: "19", id: 22 }, { d: "20", id: 23 }, { d: "21", id: 24 }, { d: "22", id: 25 }, { d: "23", id: 26 }, { d: "24", id: 27 },
    { d: "25", id: 28, today: true }, { d: "26", id: 29 }, { d: "27", id: 30 }, { d: "28", id: 31 }, { d: "29", id: 32 }, { d: "30", id: 33 }, { d: "31", id: 34 }
];

const COMPLETED_HABITS = [
    { id: 1, name: "Morning Run", time: "7:30 AM", completed: true },
    { id: 2, name: "Read 20 mins", time: "8:15 AM", completed: true },
    { id: 3, name: "Drink 2L Water", time: "All day", completed: true },
    { id: 4, name: "Meditation", time: "9:00 PM", completed: true },
];

export default function HistoryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FA]">
      <ScrollView className="flex-1 px-6 pb-20" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="flex-row justify-between items-center mt-6 mb-8">
            <Text className="text-3xl font-extrabold text-gray-900">History</Text>
            <TouchableOpacity className="bg-white p-2 rounded-full shadow-sm">
                <Ionicons name="options-outline" size={24} color="#374151" />
            </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View className="flex-row gap-4 mb-10">
            <View className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex-row items-center gap-4">
                <View className="h-10 w-10 rounded-full bg-orange-100 items-center justify-center">
                    <Ionicons name="flame" size={20} color="#EA580C" />
                </View>
                <View>
                    <Text className="text-xl font-bold text-gray-900">15 Days</Text>
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Current Streak</Text>
                </View>
            </View>
            <View className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex-row items-center gap-4">
                <View className="h-10 w-10 rounded-full bg-emerald-100 items-center justify-center">
                    <Ionicons name="pie-chart-outline" size={20} color="#059669" />
                </View>
                <View>
                    <Text className="text-xl font-bold text-gray-900">85%</Text>
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Monthly Goal</Text>
                </View>
            </View>
        </View>

        {/* Calendar View */}
        <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity className="p-2"><Ionicons name="chevron-back" size={20} color="#6B7280" /></TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">October 2023</Text>
            <TouchableOpacity className="p-2"><Ionicons name="chevron-forward" size={20} color="#6B7280" /></TouchableOpacity>
        </View>

        <View className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 mb-8">
            <View className="flex-row justify-between mb-4">
                {["S","M","T","W","T","F","S"].map((d,i) => (
                    <Text key={i} className="w-8 text-center text-xs font-bold text-gray-400">{d}</Text>
                ))}
            </View>
            <View className="flex-row flex-wrap justify-between gap-y-4">
                {CALENDAR_GRID.map((day) => (
                    <View key={day.id} className="w-[13%] items-center justify-center aspect-square">
                        {day.d ? (
                            <View className={`h-10 w-10 rounded-full items-center justify-center 
                                ${day.selected ? 'bg-emerald-500 shadow-md shadow-emerald-200 border-4 border-emerald-100' : ''}
                                ${day.fill && !day.selected ? 'bg-emerald-500' : ''}
                                ${day.circle ? 'border-2 border-emerald-300' : ''}
                                ${day.today && !day.selected ? 'bg-emerald-50' : ''}
                            `}>
                                <Text className={`text-sm font-medium ${day.fill || day.selected ? 'text-white' : day.today ? 'text-emerald-600 font-bold' : 'text-gray-900'}`}>
                                    {day.d}
                                </Text>
                                {/* Green dot for Today */}
                                {day.today && <View className="absolute -bottom-1 h-1 w-1 rounded-full bg-emerald-500" />}
                            </View>
                        ) : <View className="h-10 w-10" />}
                    </View>
                ))}
            </View>
        </View>

        {/* Selected Day List */}
        <View className="mb-20">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-900">Thu, Oct 5</Text>
                <View className="bg-white px-3 py-1.5 rounded-full border border-gray-200 flex-row items-center gap-1.5">
                    <View className="h-2 w-2 rounded-full bg-emerald-500" />
                    <Text className="text-xs font-bold text-gray-900">5/5 Done</Text>
                </View>
            </View>
            
            <View className="space-y-6">
                {COMPLETED_HABITS.map((habit) => (
                    <View key={habit.id} className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-4">
                            <View className="h-8 w-8 rounded-full bg-emerald-500 items-center justify-center">
                                <Ionicons name="checkmark" size={18} color="white" />
                            </View>
                            <Text className={`text-base font-bold text-gray-500 line-through decoration-gray-400 decoration-2`}>{habit.name}</Text>
                        </View>
                        <Text className="text-gray-400 text-xs">{habit.time}</Text>
                    </View>
                ))}
            </View>
        </View>

      </ScrollView>
       {/* Floating Action Button */}
      <View className="absolute bottom-6 w-full items-center">
         <TouchableOpacity 
            className="bg-emerald-600 h-16 w-16 rounded-full shadow-lg shadow-emerald-300 items-center justify-center"
            activeOpacity={0.8}
         >
            <Ionicons name="add" size={32} color="white" />
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
