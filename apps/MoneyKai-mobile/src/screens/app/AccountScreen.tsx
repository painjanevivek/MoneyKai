import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { createAppScreenStyles } from './screenStyles';

type AccountNavigation = NativeStackNavigationProp<RootStackParamList, 'Account'>;

export function AccountScreen() {
  const navigation = useNavigation<AccountNavigation>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const isOnline = useSyncStore((state) => state.isOnline);
  const pendingCount = useSyncStore((state) => state.pendingCount);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ScreenBackButton />
          <Text style={styles.title}>Account</Text>
          <Text style={styles.subtitle}>Identity and recovery controls for this MoneyKai account.</Text>
        </View>

        <View style={[styles.panel, { alignItems: 'center', paddingVertical: Spacing.xl }]}>
          <UserAvatar name={user?.full_name} email={user?.email} avatarUrl={user?.avatar_url} size={68} />
          <Text style={[styles.value, { marginTop: Spacing.md }]}>{user?.full_name || 'MoneyKai user'}</Text>
          <Text style={styles.muted}>{user?.email || 'No account email available'}</Text>
          <Button title="Edit profile" variant="secondary" onPress={() => navigation.navigate('ProfileEdit')} style={{ marginTop: Spacing.base }} />
        </View>

        <View style={styles.panel}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.value}>{isOnline ? 'Connected' : 'Working offline'}</Text>
              <Text style={styles.muted}>{pendingCount > 0 ? `${pendingCount} changes waiting to sync` : 'No pending changes reported'}</Text>
            </View>
            <View style={{ alignItems: 'center', backgroundColor: isOnline ? colors.primaryBg : colors.surface, borderColor: colors.borderLight, borderRadius: BorderRadius.full, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 }}>
              <AppIcon color={isOnline ? colors.primary : colors.textSecondary} name={isOnline ? 'cloud-check-outline' : 'cloud-off-outline'} size={21} />
            </View>
          </View>
          <Disclosure title="Recovery and security" summary="Password reset, backup, and session controls">
            <Text style={styles.muted}>Review password recovery, backups, and sign-out controls in Settings.</Text>
            <Button title="Open settings" variant="outline" onPress={() => navigation.navigate('Settings')} style={{ marginTop: Spacing.md }} />
          </Disclosure>
        </View>

        <Button title="Review privacy and data" variant="outline" icon="shield-check-outline" onPress={() => navigation.navigate('TrustCenter')} />
      </ScrollView>
    </SafeAreaView>
  );
}
