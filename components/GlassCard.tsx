// ============================================================
// GlassCard — iOS-style liquid glass surface
//
// Layers (bottom → top):
//   1. BlurView         — blurs whatever is behind the card
//   2. Tint overlay     — semi-transparent fill (dark/light)
//   3. Rim highlight    — 1 px white line at top edge (simulates
//                         light hitting a glass surface)
//   4. Border           — subtle perimeter glow
//   5. children         — rendered content
//
// Android fallback: no native blur, but the tint + border still
// read as glass due to the translucent fill and rim highlight.
// ============================================================

import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  isDark?: boolean;
  /** 0-100; controls blur strength (iOS) and overlay opacity (Android) */
  intensity?: number;
  style?: ViewStyle;
  borderRadius?: number;
}

export function GlassCard({
  children,
  isDark = true,
  intensity = 28,
  style,
  borderRadius = 20,
}: GlassCardProps) {
  // Tint overlay opacity — strong enough to read as glass
  const tintBg = isDark
    ? `rgba(8, 24, 48, ${0.45 + (1 - intensity / 100) * 0.2})`
    : `rgba(255, 255, 255, ${0.55 + (intensity / 100) * 0.15})`;

  const borderColor = isDark
    ? 'rgba(255, 255, 255, 0.14)'
    : 'rgba(255, 255, 255, 0.92)';

  const rimColor = isDark
    ? 'rgba(255, 255, 255, 0.22)'
    : 'rgba(255, 255, 255, 1)';

  return (
    <View style={[{ borderRadius, overflow: 'hidden', borderWidth: 1, borderColor }, style]}>

      {/* ① Blur layer */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        // Android: solid tinted surface (blur not needed for glass feel)
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#0a1e35' : '#e8f2f8' }]} />
      )}

      {/* ② Tint overlay */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tintBg }]} />

      {/* ③ Rim highlight — thin white line at very top */}
      <View
        style={[StyleSheet.absoluteFill, {
          borderTopWidth: 1.5,
          borderTopColor: rimColor,
          borderRadius,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
        }]}
        pointerEvents="none"
      />

      {/* ④ Content */}
      <View style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </View>
    </View>
  );
}

const _ = StyleSheet.create({});
