import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { pickAvatarImage } from '@/services/profileMediaPicker';
import { createAppScreenStyles } from './screenStyles';

export function ProfileEditScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [name, setName] = useState(user?.full_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [isPickingAvatar, setIsPickingAvatar] = useState(false);

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter a display name.');
      return;
    }

    updateProfile({ full_name: name.trim(), avatar_url: avatarUrl.trim() || undefined });
    Alert.alert('Profile updated', 'Your profile was updated and queued for backup.');
  };

  const uploadAvatar = async () => {
    setIsPickingAvatar(true);
    try {
      const pickedImage = await pickAvatarImage();
      if (pickedImage?.uri) {
        setAvatarUrl(pickedImage.uri);
      }
    } catch (error) {
      Alert.alert('Avatar upload unavailable', error instanceof Error ? error.message : 'Choose another image source.');
    } finally {
      setIsPickingAvatar(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Profile</Text>
          <Text style={styles.title}>Edit profile</Text>
          <Text style={styles.subtitle}>{user?.email ?? 'Signed-in account'}</Text>
        </View>
        <View style={styles.panel}>
          <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
            <UserAvatar name={name} email={user?.email} avatarUrl={avatarUrl.trim()} size={88} />
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: Typography.fontFamily.medium,
                fontSize: Typography.fontSize.sm,
                marginTop: Spacing.sm,
              }}
            >
              Avatar preview
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.base }}>
            <Button
              title={isPickingAvatar ? 'Opening...' : 'Upload'}
              onPress={uploadAvatar}
              icon="image-plus"
              disabled={isPickingAvatar}
              style={{ flex: 1 }}
            />
            <Button
              title="Remove"
              onPress={() => setAvatarUrl('')}
              icon="close-circle-outline"
              variant="outline"
              style={{ flex: 1 }}
            />
          </View>
          <Input label="Display name" value={name} onChangeText={setName} icon="account-outline" />
          <Input
            label="Avatar image URL"
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            icon="image-outline"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="https://..."
          />
          <View
            style={{
              backgroundColor: colors.primaryBg,
              borderRadius: BorderRadius.md,
              marginBottom: Spacing.base,
              padding: Spacing.md,
            }}
          >
            <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm }}>
              Pick from device files, gallery, or Drive. A secure URL also works if you paste one below.
            </Text>
          </View>
          <Button title="Save Profile" onPress={save} icon="content-save-outline" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
