import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTheme } from '@/hooks/useTheme';
import {
  clearNativeCaptureQueue,
  getNativeCaptureStatus,
  openNativeCaptureSettings,
  setNativeCaptureSourcesEnabled,
} from '@/services/nativeCaptureBridge';
import { ingestSmsCapture } from '@/services/autoCaptureService';
import { Spacing } from '@/constants/theme';
import { createAppScreenStyles } from './screenStyles';

export function AutoCaptureScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const settings = useCaptureStore((state) => state.settings);
  const drafts = useCaptureStore((state) => state.drafts);
  const setAutoCaptureEnabled = useCaptureStore((state) => state.setAutoCaptureEnabled);
  const setNotificationCaptureEnabled = useCaptureStore((state) => state.setNotificationCaptureEnabled);
  const setSmsResearchModeEnabled = useCaptureStore((state) => state.setSmsResearchModeEnabled);
  const setNotificationAccessStatus = useCaptureStore((state) => state.setNotificationAccessStatus);
  const confirmDraft = useCaptureStore((state) => state.confirmDraft);
  const ignoreDraft = useCaptureStore((state) => state.ignoreDraft);
  const clearCaptureInbox = useCaptureStore((state) => state.clearCaptureInbox);
  const [nativeReady, setNativeReady] = useState(false);
  const [smsText, setSmsText] = useState('');

  useEffect(() => {
    void getNativeCaptureStatus().then((status) => {
      setNativeReady(status.nativeModuleAvailable);
      setNotificationAccessStatus(status.notificationAccess);
    });
  }, [setNotificationAccessStatus]);

  const toggleAutoCapture = async (enabled: boolean) => {
    setAutoCaptureEnabled(enabled);
    await setNativeCaptureSourcesEnabled({
      notificationEnabled: enabled && settings.notificationCaptureEnabled,
      smsEnabled: enabled && settings.smsResearchModeEnabled,
    });
  };

  const pasteSms = () => {
    if (!smsText.trim()) {
      Alert.alert('Paste SMS text', 'Add a bank or payment SMS to parse.');
      return;
    }
    const result = ingestSmsCapture({ body: smsText });
    setSmsText('');
    Alert.alert('SMS processed', result.reason ?? result.status);
  };

  const formatMoney = (value: number) => `${currencySymbol}${value.toLocaleString('en-IN')}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Auto Capture</Text>
          <Text style={styles.title}>Review captured drafts</Text>
          <Text style={styles.subtitle}>Notification capture uses the native Android listener; SMS paste remains research-only.</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.row}>
            <Text style={styles.muted}>Native module</Text>
            <Text style={{ ...styles.value, color: nativeReady ? colors.primary : colors.error }}>
              {nativeReady ? 'Ready' : 'Unavailable'}
            </Text>
          </View>
          <View style={[styles.row, { marginTop: Spacing.md }]}>
            <Text style={styles.muted}>Auto capture</Text>
            <Switch value={settings.autoCaptureEnabled} onValueChange={toggleAutoCapture} />
          </View>
          <View style={[styles.row, { marginTop: Spacing.md }]}>
            <Text style={styles.muted}>Notifications</Text>
            <Switch value={settings.notificationCaptureEnabled} onValueChange={setNotificationCaptureEnabled} />
          </View>
          <View style={[styles.row, { marginTop: Spacing.md }]}>
            <Text style={styles.muted}>SMS research mode</Text>
            <Switch value={settings.smsResearchModeEnabled} onValueChange={setSmsResearchModeEnabled} />
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
            <Button title="Android Access" onPress={() => void openNativeCaptureSettings()} size="sm" style={{ flex: 1 }} />
            <Button title="Clear Queue" onPress={() => void clearNativeCaptureQueue()} variant="outline" size="sm" style={{ flex: 1 }} />
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Paste SMS research</Text>
          <Input
            value={smsText}
            onChangeText={setSmsText}
            placeholder="Paste a bank/payment SMS for manual parsing"
            icon="message-text-outline"
            multiline
            numberOfLines={4}
          />
          <Button title="Parse SMS" onPress={pasteSms} icon="text-search" />
        </View>

        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Drafts</Text>
          <TouchableOpacity onPress={clearCaptureInbox}>
            <Text style={{ ...styles.muted, color: colors.primary }}>Clear reviewed</Text>
          </TouchableOpacity>
        </View>

        {drafts.filter((draft) => draft.status === 'pending').length === 0 ? (
          <View style={styles.panel}>
            <Text style={styles.emptyText}>No pending captured drafts.</Text>
          </View>
        ) : (
          drafts
            .filter((draft) => draft.status === 'pending')
            .map((draft) => (
              <View key={draft.id} style={styles.panel}>
                <View style={styles.row}>
                  <View style={{ flex: 1, paddingRight: Spacing.md }}>
                    <Text style={styles.value}>{draft.description}</Text>
                    <Text style={styles.muted}>
                      {formatMoney(draft.amount)} · {draft.category || 'category needed'} · {draft.captureSource}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="file-document-edit-outline" size={24} color={colors.primary} />
                </View>
                <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
                  <Button
                    title="Confirm"
                    onPress={() => confirmDraft(draft.id, draft.category || 'others')}
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <Button title="Ignore" onPress={() => ignoreDraft(draft.id)} variant="outline" size="sm" style={{ flex: 1 }} />
                </View>
              </View>
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
