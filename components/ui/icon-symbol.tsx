// Cross-platform icon component using MaterialIcons (works on Android, iOS, Web)
// We do NOT use expo-symbols here because it is iOS-only (SF Symbols)

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

// All icon names used in the app mapped to Material Icons names
// Add more mappings here as you add new icons
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'message.fill': 'chat',
  'person.fill': 'person',
  'photo.fill': 'photo',
  'magnifyingglass': 'search',
  'bell.fill': 'notifications',
  'gear': 'settings',
  'plus': 'add',
  'xmark': 'close',
  'arrow.left': 'arrow-back',
  'camera.fill': 'camera-alt',
  'heart.fill': 'favorite',
  'heart': 'favorite-border',
  'bubble.left.fill': 'chat-bubble',
  'person.2.fill': 'group',
  'ellipsis': 'more-horiz',
  'checkmark': 'check',
  'checkmark.circle.fill': 'check-circle',
  'info.circle': 'info',
  'pencil': 'edit',
} as const;

// IconSymbolName is any key in our MAPPING object
export type IconSymbolName = keyof typeof MAPPING;

/**
 * IconSymbol - A unified icon component for all platforms.
 * Uses Material Icons everywhere for consistency.
 *
 * How to use:
 *   <IconSymbol name="house.fill" size={24} color="#000" />
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: string; // accepted but not used (iOS-only concept)
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name] as ComponentProps<typeof MaterialIcons>['name']}
      style={style}
    />
  );
}
