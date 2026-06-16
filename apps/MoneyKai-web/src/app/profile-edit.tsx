import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { firebaseAuth, isFirebaseConfigured } from '@/services/firebase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { UserAvatar } from '@/components/ui/UserAvatar';

export default function ProfileEditScreen() {
  const { colors } = useTheme();
  const { user, updateProfile, isAuthenticated, isHydratingSession } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email] = useState(user?.email ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [errors, setErrors] = useState<{ fullName?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingAvatar, setIsPickingAvatar] = useState(false);

  if (isHydratingSession) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/login" />;
  }

  const handlePickAvatar = async () => {
    setIsPickingAvatar(true);
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission required', 'Allow photo library access to choose a profile picture.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const nextAvatarUrl = asset.base64
        ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
        : asset.uri;

      setAvatarUrl(nextAvatarUrl);
    } catch (err) {
      Alert.alert(
        'Avatar Update Failed',
        err instanceof Error ? err.message : 'Could not open your photo library.'
      );
    } finally {
      setIsPickingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
  };

  const handleSave = async () => {
    const newErrors: typeof errors = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSaving(true);
    try {
      if (isFirebaseConfigured() && firebaseAuth.currentUser) {
        await updateFirebaseProfile(firebaseAuth.currentUser, {
          displayName: fullName.trim(),
          photoURL: avatarUrl || null,
        });
      }

      updateProfile({ full_name: fullName.trim(), avatar_url: avatarUrl || undefined });
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
            <View style={{ position: 'relative' }}>
              <UserAvatar
                name={fullName}
                email={email}
                avatarUrl={avatarUrl || undefined}
                size={88}
                containerStyle={{
                  borderWidth: 2,
                  borderColor: colors.border,
                  ...Shadows.md,
                  shadowColor: colors.shadowColor,
                }}
                imageStyle={{
                  borderWidth: 2,
                  borderColor: colors.border,
                }}
              />
              <TouchableOpacity
                onPress={handlePickAvatar}
                disabled={isPickingAvatar}
                style={{
                  position: 'absolute',
                  right: -2,
                  bottom: -2,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.background,
                }}
              >
                {isPickingAvatar ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <MaterialCommunityIcons name="camera-outline" size={16} color={colors.textInverse} />
                )}
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
              <Button
                title={avatarUrl ? 'Change Photo' : 'Add Photo'}
                onPress={handlePickAvatar}
                variant="secondary"
                size="sm"
                icon="image-outline"
                disabled={isPickingAvatar}
              />
              {avatarUrl ? (
                <Button
                  title="Remove"
                  onPress={handleRemoveAvatar}
                  variant="outline"
                  size="sm"
                  icon="trash-can-outline"
                />
              ) : null}
            </View>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: Spacing.sm }}>
              Pick a square profile photo and it will update across the app.
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
              Email address is managed by your account provider and cannot be changed here.
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
