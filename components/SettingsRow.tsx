// ============================================================
// SettingsRow — reusable WhatsApp-style settings list row
//
// Layout:
//   [colored icon bg]  Label          sublabel  [›]
//                      description
//
// Usage:
//   <SettingsRow
//     icon="lock-closed-outline"
//     iconColor="#fff"
//     iconBg="#25D366"
//     label="Privacy"
//     description="Last seen, profile photo, about"
//     onPress={() => router.push('/settings/privacy')}
//   />
//
//   // With a toggle switch instead of chevron:
//   <SettingsRow
//     icon="moon-outline"
//     iconBg="#8134AF"
//     label="Dark Mode"
//     rightElement={<Switch value={isDark} onValueChange={toggleTheme} />}
//   />
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface Props {
  icon:          string;
  iconColor?:    string;         // Icon tint  (default white)
  iconBg:        string;         // Icon background colour
  label:         string;
  description?:  string;         // Grey subtitle below the label
  sublabel?:     string;         // Value shown on the right before the chevron
  onPress?:      () => void;
  rightElement?: React.ReactNode; // Custom right-side widget (e.g. Switch)
  showChevron?:  boolean;        // Show › arrow (default true when onPress given)
  destructive?:  boolean;        // Makes label text red
  disabled?:     boolean;
}

export function SettingsRow({
  icon,
  iconColor  = '#fff',
  iconBg,
  label,
  description,
  sublabel,
  onPress,
  rightElement,
  showChevron,
  destructive = false,
  disabled    = false,
}: Props) {
  const { colors } = useAppTheme();
  const hasChevron = showChevron ?? (!!onPress && !rightElement);

  const inner = (
    <View style={[styles.row, disabled && styles.disabled]}>
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>

      {/* Text block */}
      <View style={styles.textBlock}>
        <Text style={[
          styles.label,
          { color: destructive ? colors.error : colors.text },
        ]}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>

      {/* Right side */}
      {sublabel && (
        <Text style={[styles.sublabel, { color: colors.textSecondary }]}>{sublabel}</Text>
      )}
      {rightElement}
      {hasChevron && (
        <Ionicons name="chevron-forward" size={18} color={colors.border} style={styles.chevron} />
      )}
    </View>
  );

  if (!onPress) return inner;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        pressed && !disabled ? { backgroundColor: colors.surfaceAlt } : {},
      ]}>
      {inner}
    </Pressable>
  );
}

// ── Section header label ─────────────────────────────────────
export function SettingsSection({ title }: { title: string }) {
  const { colors } = useAppTheme();
  return (
    <Text style={[styles.sectionTitle, { color: colors.primary }]}>
      {title.toUpperCase()}
    </Text>
  );
}

// ── Divider ──────────────────────────────────────────────────
export function SettingsDivider() {
  const { colors } = useAppTheme();
  return <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:  13,
    gap:              Spacing.md,
    minHeight:        60,
  },
  disabled: { opacity: 0.45 },
  iconWrap: {
    width:        38,
    height:       38,
    borderRadius: Radius.sm + 2,
    justifyContent: 'center',
    alignItems:   'center',
  },
  textBlock: { flex: 1, gap: 2 },
  label:       { fontSize: FontSize.md, fontWeight: '500' },
  description: { fontSize: FontSize.sm, lineHeight: 17 },
  sublabel:    { fontSize: FontSize.sm },
  chevron:     { marginLeft: 2 },
  sectionTitle: {
    fontSize:        FontSize.xs,
    fontWeight:      '700',
    letterSpacing:   0.8,
    paddingHorizontal: Spacing.md,
    paddingTop:      Spacing.md,
    paddingBottom:   6,
  },
  sectionDivider: {
    height:           8,
    marginVertical:   4,
  },
});
