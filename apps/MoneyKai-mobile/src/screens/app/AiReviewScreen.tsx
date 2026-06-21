import React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AiModelConsole } from '@/components/ai/AiModelConsole';
import { Button } from '@/components/ui/Button';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { useAiProviderStatus } from '@/features/ai/hooks';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { createAppScreenStyles } from './screenStyles';

export function AiReviewScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydratingSession = useAuthStore((state) => state.isHydratingSession);
  const { data: providerStatus, error: providerError, loading: loadingProviderStatus, refresh } = useAiProviderStatus(isAuthenticated);
  const requiresSignIn = !isHydratingSession && !isAuthenticated;
  const attachmentsReady = Boolean(providerStatus?.enabled && providerStatus.attachmentsEnabled && providerStatus.defaultVisionModelConfigured);
  const aiReady = Boolean(providerStatus?.configured);
  const statusMessage = providerError
    ? 'Text review is available. Image analysis needs backend attachment support.'
    : 'Model checks and text review are available here.';

  const explainAttachmentPicker = () => {
    Alert.alert(
      'Attachment review on mobile',
      'AI model tests are available here now. Image upload uses the backend attachment API, but the active React Native mobile shell still needs a native image picker wired in before receipts can be selected from this screen.',
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ScreenBackButton />
          <Text style={styles.title}>AI review</Text>
          <Text style={styles.subtitle}>
            Ask MoneyKai AI for practical help, then review receipt and image analysis before using it.
          </Text>
        </View>

        <View style={styles.panel}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <View
              style={{
                alignItems: 'center',
                backgroundColor: colors.primaryBg,
                borderRadius: BorderRadius.md,
                height: 48,
                justifyContent: 'center',
                width: 48,
              }}
            >
              <MaterialCommunityIcons name="brain" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.value}>
                {loadingProviderStatus ? 'Checking AI status' : aiReady ? 'MoneyKai AI ready' : 'AI review'}
              </Text>
              <Text style={styles.muted}>
                {attachmentsReady
                  ? 'Image analysis is ready for review.'
                  : statusMessage}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md }}>
            <StatusChip label={aiReady ? 'AI ready' : 'AI review'} tone={aiReady ? 'success' : 'neutral'} />
            <StatusChip label={attachmentsReady ? 'Image analysis ready' : 'Image review'} tone={attachmentsReady ? 'success' : 'neutral'} />
          </View>

          <Button
            title="Refresh"
            icon="refresh"
            variant="secondary"
            loading={loadingProviderStatus}
            onPress={() => void refresh()}
            style={{ marginTop: Spacing.md }}
          />
        </View>

        {requiresSignIn ? (
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Sign in required</Text>
            <Text style={{ ...styles.muted, marginBottom: Spacing.md }}>
              AI calls use your signed-in session so MoneyKai can protect access and keep requests accountable.
            </Text>
          </View>
        ) : null}

        <AiModelConsole providerStatus={providerStatus} requiresSignIn={requiresSignIn} />

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Receipt/image attachment review</Text>
          <Text style={{ ...styles.muted, marginBottom: Spacing.md }}>
            The active AI review tab supports image selection, upload, analysis, and review before saving anything.
          </Text>
          <Button
            title={attachmentsReady ? 'Image picker pending' : 'Image review'}
            icon="image-search-outline"
            variant="outline"
            onPress={explainAttachmentPicker}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusChip({ label, tone }: { label: string; tone: 'success' | 'warning' | 'neutral' }) {
  const { colors } = useTheme();
  const color = tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : colors.textSecondary;
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: colors.primaryBg,
        borderRadius: BorderRadius.full,
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 6,
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ color, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs }}>
        {label}
      </Text>
    </View>
  );
}
