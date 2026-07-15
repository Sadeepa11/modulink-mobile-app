import { Stack } from 'expo-router';
import { useAppColorScheme } from '@/context/ThemeContext';

export default function SettingsLayout() {
  const { colorScheme } = useAppColorScheme();
  const hdrBg = colorScheme === 'dark' ? '#071a30' : '#083a7a';

  return (
    <Stack
      screenOptions={{
        headerStyle:      { backgroundColor: hdrBg },
        headerTintColor:  '#ffffff',
        headerTitleStyle: { fontWeight: '800', color: '#ffffff', fontSize: 18 },
        headerBackTitle:  'Back',
      }}>
      <Stack.Screen name="index"                  options={{ title: 'Settings' }} />
      <Stack.Screen name="account"                options={{ title: 'Account' }} />
      <Stack.Screen name="privacy"                options={{ title: 'Privacy' }} />
      <Stack.Screen name="chats-settings"         options={{ title: 'Chats' }} />
      <Stack.Screen name="notifications-settings" options={{ title: 'Notifications' }} />
      <Stack.Screen name="storage"                options={{ title: 'Storage & Data' }} />
      <Stack.Screen name="help"                   options={{ title: 'Help' }} />
    </Stack>
  );
}
