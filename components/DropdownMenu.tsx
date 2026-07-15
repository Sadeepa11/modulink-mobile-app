// ============================================================
// DropdownMenu — WhatsApp-style three-dots dropdown
//
// Shows a floating card menu below the ⋮ button.
// Backdrop press dismisses it.
//
// Usage:
//   <DropdownMenu
//     visible={open}
//     onClose={() => setOpen(false)}
//     items={[
//       { label: 'New Group', icon: 'people-outline', onPress: ... },
//       { label: 'Settings',  icon: 'settings-outline', onPress: ... },
//     ]}
//   />
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface MenuItem {
  label: string;
  icon?: string;
  destructive?: boolean;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  items: MenuItem[];
  // Position offsets from the top-right corner
  anchorTop?: number;
  anchorRight?: number;
}

export function DropdownMenu({
  visible,
  onClose,
  items,
  anchorTop  = 54,
  anchorRight = 8,
}: Props) {
  const { colors } = useAppTheme();
  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1,    useNativeDriver: true, tension: 220, friction: 16 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim,   { toValue: 0.85, duration: 100, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0,    duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      {/* Invisible backdrop — tap to close */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Menu card */}
      <Animated.View
        style={[
          styles.menu,
          {
            top:              anchorTop,
            right:            anchorRight,
            backgroundColor:  colors.surface,
            transform:        [{ scale: scaleAnim }],
            opacity:          opacityAnim,
            // Shadow
            shadowColor:      '#000',
            shadowOffset:     { width: 0, height: 4 },
            shadowOpacity:    0.22,
            shadowRadius:     12,
            elevation:        12,
          },
        ]}>
        {items.map((item, idx) => (
          <React.Fragment key={item.label}>
            {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            <Pressable
              style={({ pressed }) => [
                styles.item,
                { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
              ]}
              onPress={() => { onClose(); item.onPress(); }}>
              {item.icon && (
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={item.destructive ? colors.error : colors.text}
                  style={styles.itemIcon}
                />
              )}
              <Text style={[
                styles.itemLabel,
                { color: item.destructive ? colors.error : colors.text },
              ]}>
                {item.label}
              </Text>
            </Pressable>
          </React.Fragment>
        ))}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menu: {
    position:     'absolute',
    minWidth:     200,
    borderRadius: Radius.md,
    overflow:     'hidden',
  },
  item: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    gap:            Spacing.md,
  },
  itemIcon: {
    width: 20,
  },
  itemLabel: {
    fontSize:   FontSize.md,
    fontWeight: '500',
  },
  divider: {
    height: 0.7,
    marginHorizontal: Spacing.md,
  },
});
