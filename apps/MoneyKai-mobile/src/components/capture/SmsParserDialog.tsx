import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { SmsAutomationControls } from './SmsAutomationControls';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';

export function SmsParserDialog({ visible, onClose, onOpenParser }: { visible: boolean; onClose: () => void; onOpenParser: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={[styles.backdrop, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close SMS parser" style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={onClose} />
      <View accessibilityViewIsModal style={[styles.dialog, { backgroundColor: colors.background }]}>
        <View style={styles.header}><Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>SMS parser</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close SMS parser dialog" onPress={onClose} style={styles.close}><AppIcon name="close" size={24} color={colors.textPrimary} /></Pressable></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: Spacing.md }}>
          {visible ? <SmsAutomationControls onNavigate={(screen) => { onClose(); navigation.navigate(screen); }} /> : null}
          <Button title="Manual parser & all settings" variant="ghost" style={{ marginTop: Spacing.md }} onPress={() => { onClose(); onOpenParser(); }} />
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
  dialog: { width: '100%', maxWidth: 420, maxHeight: '90%', padding: Spacing.lg, borderRadius: BorderRadius.lg },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  title: { flex: 1, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl },
  close: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
});
