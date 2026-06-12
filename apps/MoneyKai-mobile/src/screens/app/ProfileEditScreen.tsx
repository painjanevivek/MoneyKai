import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { createAppScreenStyles } from './screenStyles';

export function ProfileEditScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [name, setName] = useState(user?.full_name ?? '');

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter a display name.');
      return;
    }

    updateProfile({ full_name: name.trim() });
    Alert.alert('Profile updated', 'Your local profile name was updated and queued for backup.');
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
          <Input label="Display name" value={name} onChangeText={setName} icon="account-outline" />
          <Button title="Save Profile" onPress={save} icon="content-save-outline" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
