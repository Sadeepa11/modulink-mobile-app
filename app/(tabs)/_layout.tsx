// ============================================================
// Tab Bar — glass blur background + gradient header
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function TabLayout() {
  const { colors, isDark } = useAppTheme();
  const HDR_BG = isDark ? '#071a30' : '#083a7a';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarButton:            HapticTab,

        // ── Glass tab bar ──────────────────────────────────
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={isDark ? 32 : 50}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            // Android: tinted surface (no native blur)
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]}
            />
          ),

        tabBarStyle: {
          backgroundColor:  Platform.OS === 'ios' ? 'transparent' : undefined,
          borderTopColor:   isDark ? 'rgba(255,255,255,0.08)' : 'rgba(8,58,122,0.12)',
          borderTopWidth:   StyleSheet.hairlineWidth,
          height:           64,
          paddingBottom:    10,
          elevation:        0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },

        // Solid header — same colour as the Chats tab SafeAreaView
        headerStyle: { backgroundColor: HDR_BG },
        headerTintColor:  '#ffffff',
        headerTitleStyle: { fontWeight: '800', fontSize: 19, color: '#ffffff', letterSpacing: 0.2 },
      }}>

      {/* ── Chats ──────────────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarLabel: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* ── Groups ─────────────────────────────────────── */}
      <Tabs.Screen
        name="groups"
        options={{
          headerShown: false,
          tabBarLabel: 'Groups',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* ── Feed ───────────────────────────────────────── */}
      <Tabs.Screen
        name="feed"
        options={{
          tabBarLabel: 'Feed',
          headerTitle: () => (
            <View style={hdrTitle}>
              <Ionicons name="grid" size={20} color="#fff" />
              <Text style={hdrText}>Feed</Text>
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* ── Profile ────────────────────────────────────── */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          headerTitle: () => (
            <View style={hdrTitle}>
              <Ionicons name="person-circle" size={22} color="#fff" />
              <Text style={hdrText}>Profile</Text>
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}

// Shared header title style (icon + label side-by-side)
const hdrTitle: import('react-native').ViewStyle = {
  flexDirection: 'row',
  alignItems:    'center',
  gap:           8,
};
const hdrText: import('react-native').TextStyle = {
  color:       '#ffffff',
  fontSize:    19,
  fontWeight:  '800',
  letterSpacing: 0.2,
};
