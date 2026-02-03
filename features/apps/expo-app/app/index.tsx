import React from "react";
import { Text, View, SafeAreaView, TouchableOpacity, StatusBar } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Index() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 px-10 py-20 justify-between items-start">
        {/* Header/Logo */}
        <View className="flex-row items-center space-x-2">
          <View className="p-2 bg-indigo-600 rounded-xl shadow-sm">
            <MaterialCommunityIcons name="sparkles" size={24} color="white" />
          </View>
          <Text className="text-xl font-bold tracking-tighter uppercase italic text-black ml-2">
            Vibe.Native
          </Text>
        </View>

        {/* Hero Section */}
        <View className="space-y-6">
          <Text className="text-5xl font-black leading-[1.1] tracking-tight text-black">
            Build Native {"\n"}
            <Text className="text-zinc-400">Experiences.</Text>
          </Text>
          <Text className="text-xl leading-8 text-zinc-500 font-medium max-w-[300px]">
            Your mobile journey starts here. Edit{" "}
            <Text className="text-black font-bold">app/index.tsx</Text> to begin crafting your app.
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="w-full space-y-4">
          <TouchableOpacity
            activeOpacity={0.8}
            className="h-16 w-full flex-row items-center justify-center space-x-3 rounded-2xl bg-indigo-600 px-8 shadow-xl shadow-indigo-500/20"
          >
            <Text className="text-white font-bold text-lg mr-2">Start Development</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            className="h-16 w-full flex-row items-center justify-center space-x-2 rounded-2xl border border-zinc-200 px-8"
          >
            <MaterialCommunityIcons name="view-dashboard-outline" size={20} color="black" style={{ opacity: 0.4 }} />
            <Text className="text-black font-bold text-lg ml-2">UI Components</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="w-full pt-10 border-t border-zinc-100 flex-row justify-between items-center">
          <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
            Powered by Expo & Vibe
          </Text>
          <View className="flex-row space-x-4">
            <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Docs</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
