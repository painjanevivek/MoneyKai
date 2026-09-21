import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import { FeedbackBanner } from '@/components/ui/FeedbackBanner';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { createAppScreenStyles } from './screenStyles';

type SettingsNavigation = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export function SettingsOverviewScreen() {
  const navigation = useNavigation<SettingsNavigation>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const isOnline = useSyncStore((state) => state.isOnline);
  const status = useSyncStore((state) => state.status);
  const pendingCount = useSyncStore((state) => state.pendingCount);
  const error = useSyncStore((state) => state.error);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ScreenBackButton />
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>The status you need first, deeper controls only when requested.</Text>
        </View>

        {error ? <FeedbackBanner title="Sync needs attention" message={error} tone="danger" /> : null}

        <View style={styles.panel}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.value}>{!isOnline ? 'Offline' : status === 'syncing' ? 'Syncing' : pendingCount > 0 ? 'Waiting to sync' : 'Account connected'}</Text>
              <Text style={styles.muted}>{pendingCount > 0 ? `${pendingCount} pending change${pendingCount === 1 ? '' : 's'}` : user?.email || 'No pending changes reported'}</Text>
            </View>
            <View style={{ alignItems: 'center', backgroundColor: colors.primaryBg, borderRadius: BorderRadius.full, height: 48, justifyContent: 'center', width: 48 }}>
              <AppIcon color={colors.primary} name={!isOnline ? 'cloud-off-outline' : 'cloud-check-outline'} size={23} />
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Account and trust</Text>
          <Button title="Account" variant="outline" icon="account-outline" onPress={() => navigation.navigate('Account')} />
          <Button title="Trust Center" variant="outline" icon="shield-check-outline" onPress={() => navigation.navigate('TrustCenter')} style={{ marginTop: Spacing.sm }} />
        </View>

        <View style={styles.panel}>
          <Disclosure title="Backup, recovery, and advanced controls" summary="Sync now, restore, password reset, reports, and sign out">
            <Text style={styles.muted}>These controls can change account state or replace local data, so MoneyKai presents their context and confirmations on a dedicated screen.</Text>
            <Button title="Open advanced settings" onPress={() => navigation.navigate('AdvancedSettings')} style={{ marginTop: Spacing.md }} />
          </Disclosure>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
