import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { createAppScreenStyles } from './screenStyles';

type TrustNavigation = NativeStackNavigationProp<RootStackParamList, 'TrustCenter'>;

const TRUST_TOPICS = [
  {
    title: 'What MoneyKai uses',
    summary: 'Identity and financial records you choose to keep',
    body: 'Your account identity connects records to you. Transactions, budgets, groups, and recovery backups support the money features you use.',
  },
  {
    title: 'SMS and notification access',
    summary: 'Capture access is optional and review-led',
    body: 'Captured financial messages become drafts for review. You can keep using manual transactions when capture permissions are off.',
  },
  {
    title: 'Local and cloud copies',
    summary: 'Offline work can wait for an account sync',
    body: 'MoneyKai keeps local app state for offline use and syncs supported account data when connectivity and backend configuration allow it.',
  },
] as const;

export function TrustCenterScreen() {
  const navigation = useNavigation<TrustNavigation>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ScreenBackButton />
          <Text style={styles.title}>Trust Center</Text>
          <Text style={styles.subtitle}>Clear explanations before permissions, syncing, or sensitive account actions.</Text>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.primaryBg }]}> 
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.value}>You stay in control</Text>
              <Text style={[styles.muted, { marginTop: Spacing.xs }]}>Core balances and consequences remain visible. Advanced controls open only when you ask for them.</Text>
            </View>
            <View style={{ alignItems: 'center', backgroundColor: colors.card, borderRadius: BorderRadius.full, height: 48, justifyContent: 'center', width: 48 }}>
              <AppIcon color={colors.primary} name="shield-check-outline" size={24} />
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          {TRUST_TOPICS.map((topic) => (
            <Disclosure key={topic.title} title={topic.title} summary={topic.summary}>
              <Text style={styles.muted}>{topic.body}</Text>
            </Disclosure>
          ))}
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Your controls</Text>
          <Text style={styles.muted}>Review sync status, create or restore a backup, reset your password, or sign out from Settings.</Text>
          <Button title="Open data and security settings" onPress={() => navigation.navigate('Settings')} style={{ marginTop: Spacing.base }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
