// Avatar component — profile picture or coloured initials fallback (themed)

import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { API_BASE_URL } from '@/services/api';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  showOnline?: boolean;
  isOnline?: boolean;
}

export function Avatar({ uri, name, size = 44, showOnline = false, isOnline = false }: AvatarProps) {
  const { colors } = useAppTheme();

  const imageUri = uri
    ? uri.startsWith('http') ? uri : `${API_BASE_URL}${uri}`
    : null;

  const initials = name
    ? name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('')
    : '?';

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceAlt }}
        />
      ) : (
        <View style={[
          styles.placeholder,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary },
        ]}>
          <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '700' }}>{initials}</Text>
        </View>
      )}

      {showOnline && (
        <View style={[
          styles.dot,
          {
            width: size * 0.28, height: size * 0.28,
            borderRadius: (size * 0.28) / 2,
            backgroundColor: isOnline ? colors.online : colors.border,
            borderColor: colors.surface,
          },
        ]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  dot: {
    position: 'absolute', bottom: 0, right: 0,
    borderWidth: 2,
  },
});
