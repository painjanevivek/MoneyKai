import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

export default function ProfileEditScreen() {
  const { colors } = useTheme();
  const { user, updateProfile } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email] = useState(user?.email ?? ''); // email is read-only (managed by Supabase auth)
  const [errors, setErrors] = useState<{ fullName?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const newErrors: typeof errors = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSaving(true);
    try {
      // Update Supabase user metadata when configured.
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({
          data: { full_name: fullName.trim() },
        });
        if (error) throw new Error(error.message);
      }

      // Always update local store.
      updateProfile({ full_name: fullName.trim() });
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(
        'Save Failed',
        err instanceof Error ? err.message : 'Could not save your profile. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (fullName || email || 'U').trim()[0]?.toUpperCase() ?? 'U';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
          paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
          borderBottomWidth: 1, borderBottomColor: colors.borderLight,
        }}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Edit Profile
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <View style={{ alignItems: 'center', marginVertical: Spacing['2xl'] }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: colors.primary,
              alignItems: 'center', justifyContent: 'center',
              ...Shadows.md, shadowColor: colors.primary,
            }}>
              <Text style={{ fontSize: 32, fontFamily: Typography.fontFamily.bold, color: colors.textInverse }}>
                {initials}
              </Text>
            </View>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: Spacing.sm }}>
              Avatar editing coming soon
            </Text>
          </View>

          {/* Form */}
          <View style={{
            backgroundColor: colors.card,
            borderRadius: BorderRadius.xl,
            padding: Spacing.xl,
            ...Shadows.md,
            shadowColor: colors.shadowColor,
          }}>
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={fullName}
              onChangeText={(t) => { setFullName(t); if (errors.fullName) setErrors({}); }}
              error={errors.fullName}
              icon="account-outline"
            />

            <Input
              label="Email"
              placeholder="Email address"
              value={email}
              onChangeText={() => {}}
              icon="email-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary, marginTop: -Spacing.md, marginBottom: Spacing.lg }}>
              Email address cannot be changed here. Contact support if needed.
            </Text>

            {/* Auth provider badge */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: colors.surface, borderRadius: BorderRadius.md,
              padding: Spacing.md, marginBottom: Spacing.lg,
            }}>
              <MaterialCommunityIcons
                name={user?.auth_provider === 'google' ? 'google' : 'email-outline'}
                size={18}
                color={user?.auth_provider === 'google' ? '#DB4437' : colors.primary}
              />
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
                Signed in with {user?.auth_provider === 'google' ? 'Google' : 'Email'}
              </Text>
            </View>

            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={isSaving}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
