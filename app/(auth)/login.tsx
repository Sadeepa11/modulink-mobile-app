// ============================================================
// Login Screen — iOS Liquid Glass edition
//
// Visual design:
//   • Deep navy → blue gradient fills the full screen
//   • Glowing app icon with teal ring
//   • GlassCard holds the input fields
//   • LinearGradient "Sign In" button with glow shadow
//   • Ghost outline "Create account" button
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { useCustomAlert } from '@/context/AlertContext';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

// Auth screens always use a rich dark gradient regardless of system theme —
// it's a deliberate premium design choice (Telegram / Signal style).
const BG_DARK:  [string, string, string] = ['#050d1a', '#071e38', '#083a7a'];
const BG_LIGHT: [string, string, string] = ['#083a7a', '#135792', '#20749f'];

export default function LoginScreen() {
  const { login }       = useAuth();
  const router          = useRouter();
  const { isDark }      = useAppTheme();
  const { showAlert }   = useCustomAlert();

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    const e = email.trim().toLowerCase();
    const p = password.trim();
    if (!e || !p) {
      showAlert({ type: 'warning', title: 'Missing Fields', message: 'Please enter your email and password.' });
      return;
    }
    setIsLoading(true);
    try {
      await login(e, p);
    } catch (err: any) {
      showAlert({ type: 'error', title: 'Sign In Failed', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const bgColors = isDark ? BG_DARK : BG_LIGHT;

  return (
    <View style={s.root}>
      {/* ── Full-screen solid background ──────────────────── */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />

      {/* ── Decorative radial glow behind the icon ────────── */}
      <View style={s.glowBlob} pointerEvents="none" />

      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.kav}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never">

            {/* ── Brand block ─────────────────────────────── */}
            <View style={s.brand}>
              {/* Icon with ring glow */}
              <View style={s.iconRing}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />
                <View style={s.iconInner}>
                  <Image
                    source={require('@/assets/images/icon.png')}
                    style={s.icon}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <Text style={s.appName}>ModuLink</Text>
              <Text style={s.tagline}>Connect · Share · Belong</Text>
            </View>

            {/* ── Heading ─────────────────────────────────── */}
            <Text style={s.heading}>Welcome back</Text>
            <Text style={s.subheading}>Sign in to continue</Text>

            {/* ── Glass input card ────────────────────────── */}
            <GlassCard isDark style={s.card} borderRadius={22}>

              {/* Email row */}
              <View style={[s.inputRow, s.inputBorder]}>
                <View style={s.inputIconWrap}>
                  <Ionicons name="mail-outline" size={19} color="rgba(121,218,223,0.9)" />
                </View>
                <View style={s.inputBody}>
                  <Text style={s.inputLabel}>EMAIL</Text>
                  <TextInput
                    style={s.inputText}
                    placeholder="you@example.com"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    keyboardAppearance="dark"
                  />
                </View>
              </View>

              {/* Password row */}
              <View style={s.inputRow}>
                <View style={s.inputIconWrap}>
                  <Ionicons name="lock-closed-outline" size={19} color="rgba(121,218,223,0.9)" />
                </View>
                <View style={s.inputBody}>
                  <Text style={s.inputLabel}>PASSWORD</Text>
                  <TextInput
                    ref={passwordRef}
                    style={s.inputText}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    keyboardAppearance="dark"
                  />
                </View>
                <Pressable onPress={() => setShowPass(v => !v)} style={s.eye} hitSlop={10}>
                  <Ionicons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="rgba(255,255,255,0.5)"
                  />
                </Pressable>
              </View>

            </GlassCard>

            {/* ── Sign In button (gradient) ────────────────── */}
            <Pressable onPress={handleLogin} disabled={isLoading} style={s.btnWrap}>
              {({ pressed }) => (
                <View style={[s.btn, { backgroundColor: pressed ? colors.primaryDark : colors.primary }]}>
                  {isLoading ? (
                    <ActivityIndicator color={colors.textOnPrimary} />
                  ) : (
                    <>
                      <Text style={[s.btnText, { color: colors.textOnPrimary }]}>Sign In</Text>
                      <Ionicons name="arrow-forward-circle" size={22} color={colors.textOnPrimary} />
                    </>
                  )}
                </View>
              )}
            </Pressable>

            {/* ── Divider ─────────────────────────────────── */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            {/* ── Create account (glass outline) ──────────── */}
            <Pressable
              onPress={() => router.push('/(auth)/register')}
              style={({ pressed }) => [s.outline, pressed && { backgroundColor: 'rgba(255,255,255,0.07)' }]}>
              <Ionicons name="person-add-outline" size={18} color="rgba(255,255,255,0.85)" />
              <Text style={s.outlineText}>Create a new account</Text>
            </Pressable>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  kav:  { flex: 1 },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },

  // ── Decorative glow blob ─────────────────────────────────
  glowBlob: {
    position:  'absolute',
    top:       -80,
    left:      '50%',
    marginLeft: -160,
    width:     320,
    height:    320,
    borderRadius: 160,
    backgroundColor: 'rgba(55, 155, 187, 0.18)',
  },

  // ── Brand block ─────────────────────────────────────────
  brand: { alignItems: 'center', marginBottom: Spacing.xl },

  iconRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    padding: 3,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: '#79dadf',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  iconInner: {
    flex: 1,
    borderRadius: 55,
    overflow: 'hidden',
    backgroundColor: '#071e38',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { width: 100, height: 100 },

  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(121,218,223,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 5,
    letterSpacing: 1.2,
  },

  // ── Headings ─────────────────────────────────────────────
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subheading: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: Spacing.lg,
  },

  // ── Glass card ───────────────────────────────────────────
  card: {
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: 12,
  },
  inputBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  inputIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(121,218,223,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputBody:  { flex: 1 },
  inputLabel: {
    fontSize:      9,
    fontWeight:    '800',
    letterSpacing: 1.0,
    color:         'rgba(121,218,223,0.7)',
    marginBottom:  4,
  },
  inputText: {
    fontSize:  FontSize.md,
    color:     '#ffffff',
    padding:   0,
  },
  eye: { paddingLeft: Spacing.sm },

  // ── Gradient button ──────────────────────────────────────
  btnWrap: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    shadowColor: '#135792',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  btn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: Spacing.sm,
  },
  btnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800', letterSpacing: 0.4 },

  // ── Divider ──────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  Spacing.lg,
    gap:           Spacing.sm,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.18)' },
  dividerText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },

  // ── Ghost outline button ─────────────────────────────────
  outline: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   Radius.lg,
    paddingVertical: 16,
    gap:            Spacing.sm,
    borderWidth:    1,
    borderColor:    'rgba(255,255,255,0.22)',
  },
  outlineText: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.md, fontWeight: '700' },
});
