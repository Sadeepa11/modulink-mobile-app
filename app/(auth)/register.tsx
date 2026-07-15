// ============================================================
// Register Screen — 2-step flow — iOS Liquid Glass edition
//
// Step 1: Account details (Name / Username / Email / Password / Confirm)
// Step 2: Profile photo + bio
//
// Design: matches Login's dark gradient + GlassCard system
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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
import api from '@/services/api';

const { width: W } = Dimensions.get('window');

const BG: [string, string, string] = ['#050d1a', '#071e38', '#083a7a'];

// ── Password strength ─────────────────────────────────────────
function pwStrength(pw: string) {
  let s = 0;
  if (pw.length >= 6)            s++;
  if (pw.length >= 10)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9!@#$%^&*]/.test(pw)) s++;
  return s;
}
const S_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const S_COLOR = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

export default function RegisterScreen() {
  const { register }  = useAuth();
  const router        = useRouter();
  const { showAlert } = useCustomAlert();
  const { colors }    = useAppTheme();

  const [name,      setName]      = useState('');
  const [username,  setUsername]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [bio,       setBio]       = useState('');

  const [step,      setStep]      = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const usernameRef = useRef<TextInput>(null);
  const emailRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef  = useRef<TextInput>(null);

  const strength  = password.length > 0 ? pwStrength(password) : 0;
  const pwMatch   = confirmPw.length > 0 && confirmPw === password;
  const pwBad     = confirmPw.length > 0 && confirmPw !== password;

  const slideToStep = (t: 1 | 2) => {
    setStep(t);
    Animated.spring(slideAnim, { toValue: t === 2 ? 1 : 0, useNativeDriver: true, tension: 160, friction: 20 }).start();
  };

  const handleNext = () => {
    const t = {
      name:      name.trim(),
      email:     email.trim().toLowerCase(),
      username:  username.trim().toLowerCase(),
      password:  password.trim(),
      confirmPw: confirmPw.trim(),
    };
    if (!t.email || !t.username || !t.password || !t.confirmPw)
      return showAlert({ type: 'warning', title: 'Missing Fields', message: 'Please fill in all required fields.' });
    if (t.password.length < 6)
      return showAlert({ type: 'warning', title: 'Weak Password', message: 'Password must be at least 6 characters.' });
    if (t.password !== t.confirmPw)
      return showAlert({ type: 'error', title: 'Passwords Do Not Match', message: 'Both password fields must be identical.' });
    if (!/^[a-z0-9_]+$/.test(t.username))
      return showAlert({ type: 'warning', title: 'Invalid Username', message: 'Only lowercase letters, numbers, and underscores.' });
    slideToStep(2);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!result.canceled && result.assets[0]) setAvatarUri(result.assets[0].uri);
  };

  const handleRegister = async (skip = false) => {
    setIsLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim().toLowerCase(), username: username.trim().toLowerCase(), password: password.trim() });
      const hasPhoto = !skip && avatarUri;
      const hasBio   = !skip && bio.trim().length > 0;
      if (hasPhoto || hasBio) {
        const form = new FormData();
        if (hasBio)   form.append('bio', bio.trim());
        if (hasPhoto) form.append('avatar', { uri: avatarUri!, type: 'image/jpeg', name: 'avatar.jpg' } as any);
        await api.put('/users/profile', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
    } catch (err: any) {
      showAlert({ type: 'error', title: 'Registration Failed', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const step1X = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0,  -W] });
  const step2X = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [W,   0] });

  return (
    <View style={s.root}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
      <View style={s.glowBlob} pointerEvents="none" />

      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.kav}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>

          {/* ── Header: back + step pills ─────────────────── */}
          <GlassCard isDark style={s.topBar} borderRadius={0}>
            <View style={s.topBarInner}>
              <Pressable
                onPress={() => step === 2 ? slideToStep(1) : router.back()}
                hitSlop={20}
                style={({ pressed }) => ({ opacity: pressed ? 0.45 : 1 })}>
                <Ionicons name="chevron-back" size={32} color="rgba(121,218,223,0.95)" />
              </Pressable>

              <View style={s.pillRow}>
                {([1, 2] as const).map(n => (
                  <View key={n} style={[
                    s.pill,
                    step === n
                      ? { backgroundColor: '#79dadf', width: 28 }
                      : n < step
                        ? { backgroundColor: 'rgba(121,218,223,0.5)', width: 14 }
                        : { backgroundColor: 'rgba(255,255,255,0.18)', width: 14 },
                  ]} />
                ))}
              </View>

              <Text style={s.stepLabel}>{step} / 2</Text>
            </View>
          </GlassCard>

          {/* ── Sliding panels ────────────────────────────── */}
          <View style={s.slideBox}>

            {/* ═══════════════════════════════════════════
                STEP 1 — Account details
                ═══════════════════════════════════════════ */}
            <Animated.View style={[s.panel, { transform: [{ translateX: step1X }] }]}>
              <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">

                <View style={s.headBlock}>
                  <Text style={s.heading}>Create Account</Text>
                  <Text style={s.sub}>Set up your credentials to get started</Text>
                  <View style={[s.accentBar, { backgroundColor: colors.primary }]} />
                </View>

                {/* Fields glass card */}
                <GlassCard isDark style={s.card} borderRadius={22}>

                  {/* Full Name */}
                  <View style={[s.row, s.rowBorder]}>
                    <View style={s.iBox}><Ionicons name="person-outline" size={17} color="rgba(121,218,223,0.9)" /></View>
                    <View style={s.cell}>
                      <Text style={s.lbl}>FULL NAME</Text>
                      <TextInput style={s.input} placeholder="e.g. John Smith" placeholderTextColor="rgba(255,255,255,0.3)" value={name} onChangeText={setName} autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => usernameRef.current?.focus()} keyboardAppearance="dark" />
                    </View>
                  </View>

                  {/* Username */}
                  <View style={[s.row, s.rowBorder]}>
                    <View style={s.iBox}><Ionicons name="at-outline" size={17} color="rgba(121,218,223,0.9)" /></View>
                    <View style={s.cell}>
                      <Text style={s.lbl}>USERNAME</Text>
                      <TextInput ref={usernameRef} style={s.input} placeholder="e.g. johnsmith" placeholderTextColor="rgba(255,255,255,0.3)" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} keyboardAppearance="dark" />
                    </View>
                  </View>

                  {/* Email */}
                  <View style={[s.row, s.rowBorder]}>
                    <View style={s.iBox}><Ionicons name="mail-outline" size={17} color="rgba(121,218,223,0.9)" /></View>
                    <View style={s.cell}>
                      <Text style={s.lbl}>EMAIL ADDRESS</Text>
                      <TextInput ref={emailRef} style={s.input} placeholder="you@example.com" placeholderTextColor="rgba(255,255,255,0.3)" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} keyboardAppearance="dark" />
                    </View>
                  </View>

                  {/* Password */}
                  <View style={[s.row, s.rowBorder]}>
                    <View style={s.iBox}><Ionicons name="lock-closed-outline" size={17} color="rgba(121,218,223,0.9)" /></View>
                    <View style={s.cell}>
                      <Text style={s.lbl}>PASSWORD</Text>
                      <TextInput ref={passwordRef} style={s.input} placeholder="Minimum 6 characters" placeholderTextColor="rgba(255,255,255,0.3)" value={password} onChangeText={setPassword} secureTextEntry={!showPw} returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()} keyboardAppearance="dark" />
                    </View>
                    <Pressable onPress={() => setShowPw(v => !v)} hitSlop={10}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={19} color="rgba(255,255,255,0.45)" /></Pressable>
                  </View>

                  {/* Confirm password */}
                  <View style={s.row}>
                    <View style={[s.iBox, {
                      backgroundColor: pwMatch ? 'rgba(34,197,94,0.18)' : pwBad ? 'rgba(239,68,68,0.18)' : 'rgba(121,218,223,0.12)',
                    }]}>
                      <Ionicons name={pwMatch ? 'checkmark-circle-outline' : 'lock-open-outline'} size={17} color={pwMatch ? '#22c55e' : pwBad ? '#ef4444' : 'rgba(121,218,223,0.9)'} />
                    </View>
                    <View style={s.cell}>
                      <Text style={s.lbl}>CONFIRM PASSWORD</Text>
                      <TextInput ref={confirmRef} style={s.input} placeholder="Re-enter password" placeholderTextColor="rgba(255,255,255,0.3)" value={confirmPw} onChangeText={setConfirmPw} secureTextEntry={!showConfirm} returnKeyType="done" onSubmitEditing={handleNext} keyboardAppearance="dark" />
                    </View>
                    <Pressable onPress={() => setShowConfirm(v => !v)} hitSlop={10}><Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={19} color="rgba(255,255,255,0.45)" /></Pressable>
                  </View>

                </GlassCard>

                {/* Strength bar */}
                {password.length > 0 && (
                  <View style={s.strengthRow}>
                    <View style={s.segments}>
                      {[1,2,3,4].map(i => (
                        <View key={i} style={[s.seg, { backgroundColor: i <= strength ? S_COLOR[strength] : 'rgba(255,255,255,0.15)' }]} />
                      ))}
                    </View>
                    <Text style={[s.sLabel, { color: S_COLOR[strength] || 'rgba(255,255,255,0.4)' }]}>{S_LABEL[strength]}</Text>
                  </View>
                )}

                {/* Mismatch warning */}
                {pwBad && (
                  <View style={s.warnRow}>
                    <Ionicons name="alert-circle-outline" size={13} color="#ef4444" />
                    <Text style={s.warnText}>Passwords do not match</Text>
                  </View>
                )}

                {/* Next button */}
                <Pressable onPress={handleNext} style={s.btnWrap}>
                  {({ pressed }) => (
                    <View style={[s.btn, { backgroundColor: pressed ? colors.primaryDark : colors.primary }]}>
                      <Text style={[s.btnText, { color: colors.textOnPrimary }]}>Next — Profile Setup</Text>
                      <Ionicons name="arrow-forward-circle" size={22} color={colors.textOnPrimary} />
                    </View>
                  )}
                </Pressable>

                <View style={s.signinRow}>
                  <Text style={s.signinTxt}>Already have an account?  </Text>
                  <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={8}>
                    <Text style={s.signinLink}>Sign in</Text>
                  </Pressable>
                </View>

              </ScrollView>
            </Animated.View>

            {/* ═══════════════════════════════════════════
                STEP 2 — Profile photo & bio
                ═══════════════════════════════════════════ */}
            <Animated.View style={[s.panel, { transform: [{ translateX: step2X }] }]}>
              <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">

                <View style={s.headBlock}>
                  <Text style={s.heading}>Your Profile</Text>
                  <Text style={s.sub}>Add a photo and bio. You can skip this and do it later.</Text>
                  <View style={[s.accentBar, { backgroundColor: colors.primary }]} />
                </View>

                {/* Avatar picker */}
                <View style={s.avatarSection}>
                  <Pressable onPress={pickPhoto} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
                    {avatarUri ? (
                      <View style={s.avatarRing}>
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />
                        <Image source={{ uri: avatarUri }} style={s.avatarImg} />
                      </View>
                    ) : (
                      <View style={s.avatarPlaceholder}>
                        <Ionicons name="person-outline" size={50} color="rgba(121,218,223,0.5)" />
                        <View style={s.cameraBadge}>
                          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />
                          <Ionicons name="camera" size={15} color={colors.textOnPrimary} style={{ zIndex: 1 }} />
                        </View>
                      </View>
                    )}
                  </Pressable>
                  <Text style={s.avatarHint}>Tap to upload a profile photo</Text>
                  {avatarUri && (
                    <Pressable onPress={() => setAvatarUri(null)} style={s.removeBtn}>
                      <Ionicons name="close-circle" size={15} color="#ef4444" />
                      <Text style={{ color: '#ef4444', fontSize: FontSize.xs, fontWeight: '600' }}>Remove</Text>
                    </Pressable>
                  )}
                </View>

                {/* Bio glass card */}
                <GlassCard isDark style={s.card} borderRadius={22}>
                  <View style={s.bioHeader}>
                    <View style={s.iBox}><Ionicons name="pencil-outline" size={17} color="rgba(121,218,223,0.9)" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.lbl}>BIO</Text>
                      <Text style={s.bioHint}>A short sentence about yourself</Text>
                    </View>
                    <Text style={[s.charCount, bio.length > 130 && { color: '#ef4444' }]}>{bio.length}/150</Text>
                  </View>
                  <TextInput
                    style={s.bioInput}
                    placeholder="e.g. Developer · coffee lover · based in London"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={bio}
                    onChangeText={t => t.length <= 150 && setBio(t)}
                    multiline
                    numberOfLines={3}
                    returnKeyType="done"
                    blurOnSubmit
                    keyboardAppearance="dark"
                  />
                </GlassCard>

                {/* Create button */}
                <Pressable onPress={() => handleRegister(false)} disabled={isLoading} style={s.btnWrap}>
                  {({ pressed }) => (
                    <View style={[s.btn, { backgroundColor: pressed ? colors.primaryDark : colors.primary }]}>
                      {isLoading ? <ActivityIndicator color={colors.textOnPrimary} /> : (
                        <>
                          <Text style={[s.btnText, { color: colors.textOnPrimary }]}>Create Account</Text>
                          <Ionicons name="checkmark-circle" size={22} color={colors.textOnPrimary} />
                        </>
                      )}
                    </View>
                  )}
                </Pressable>

                {/* Skip */}
                <Pressable
                  onPress={() => handleRegister(true)}
                  disabled={isLoading}
                  style={({ pressed }) => [s.skipBtn, pressed && { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                  <Text style={s.skipText}>Skip for now</Text>
                </Pressable>

                <Text style={s.terms}>
                  By creating an account you agree to our{' '}
                  <Text style={{ color: '#79dadf', fontWeight: '700' }}>Terms</Text>
                  {' & '}
                  <Text style={{ color: '#79dadf', fontWeight: '700' }}>Privacy Policy</Text>.
                </Text>

              </ScrollView>
            </Animated.View>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  kav:  { flex: 1 },

  glowBlob: {
    position: 'absolute', top: -60, left: '50%', marginLeft: -150,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(55,155,187,0.15)',
  },

  // ── Top bar ──────────────────────────────────────────────
  topBar: { borderRadius: 0 },
  topBarInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 10 },
  pillRow:  { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  pill:     { height: 6, borderRadius: Radius.full },
  stepLabel: { fontSize: FontSize.sm, fontWeight: '700', color: 'rgba(255,255,255,0.5)', width: 36, textAlign: 'right' },

  // ── Panels ───────────────────────────────────────────────
  slideBox: { flex: 1, overflow: 'hidden' },
  panel:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  scroll:   { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 80 },

  // ── Heading ──────────────────────────────────────────────
  headBlock: { marginBottom: Spacing.lg },
  heading:   { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 6 },
  sub:       { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', lineHeight: 20, marginBottom: 8 },
  accentBar: { width: 44, height: 4, borderRadius: Radius.full },

  // ── Glass card ───────────────────────────────────────────
  card: { marginBottom: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  row:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12, gap: 12 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  iBox: { width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(121,218,223,0.12)', justifyContent: 'center', alignItems: 'center' },
  cell: { flex: 1 },
  lbl:  { fontSize: 9, fontWeight: '800', letterSpacing: 1.0, color: 'rgba(121,218,223,0.7)', marginBottom: 4 },
  input: { fontSize: FontSize.md, color: '#fff', padding: 0 },

  // ── Password strength ─────────────────────────────────────
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  segments:    { flex: 1, flexDirection: 'row', gap: 4 },
  seg:         { flex: 1, height: 4, borderRadius: Radius.full },
  sLabel:      { fontSize: FontSize.xs, fontWeight: '700', width: 46, textAlign: 'right' },

  warnRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: Spacing.sm },
  warnText: { fontSize: FontSize.xs, color: '#ef4444', fontWeight: '600' },

  // ── Gradient button ───────────────────────────────────────
  btnWrap: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.md, shadowColor: '#135792', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  btn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 17, gap: Spacing.sm },
  btnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800', letterSpacing: 0.4 },

  skipBtn: { borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginBottom: Spacing.md },
  skipText: { color: 'rgba(255,255,255,0.55)', fontSize: FontSize.sm, fontWeight: '600' },

  signinRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xs },
  signinTxt:  { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.45)' },
  signinLink: { fontSize: FontSize.sm, fontWeight: '800', color: '#79dadf' },

  terms: { fontSize: FontSize.xs, textAlign: 'center', color: 'rgba(255,255,255,0.35)', lineHeight: 18, paddingHorizontal: Spacing.sm },

  // ── Step 2: avatar ────────────────────────────────────────
  avatarSection:  { alignItems: 'center', marginBottom: Spacing.xl },
  avatarRing:     { width: 124, height: 124, borderRadius: 62, padding: 3, overflow: 'hidden', shadowColor: '#79dadf', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  avatarImg:      { width: 118, height: 118, borderRadius: 59 },
  avatarPlaceholder: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
  cameraBadge: { position: 'absolute', bottom: 2, right: 2, width: 32, height: 32, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  avatarHint:  { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.45)', marginTop: 10 },
  removeBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },

  // Bio
  bioHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 12, paddingBottom: 10, gap: 12 },
  bioHint:   { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 },
  charCount: { fontSize: FontSize.xs, fontWeight: '700', color: 'rgba(255,255,255,0.4)', alignSelf: 'flex-start', paddingTop: 2 },
  bioInput:  {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: FontSize.md, color: '#fff', minHeight: 90, textAlignVertical: 'top',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)',
  },
});
