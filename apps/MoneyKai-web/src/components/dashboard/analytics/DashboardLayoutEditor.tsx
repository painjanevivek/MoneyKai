import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { DASHBOARD_SECTION_META, type DashboardSectionId } from './dashboardLayout';

interface Props {
  visible: boolean;
  order: readonly DashboardSectionId[];
  customized: boolean;
  onMove: (section: DashboardSectionId, direction: -1 | 1) => void;
  onReset: () => void;
  onClose: () => void;
}

export function DashboardLayoutEditor({ visible, order, customized, onMove, onReset, onClose }: Props) {
  const { colors } = useTheme();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityRole="none" onPress={onClose} style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }}>
        <Pressable accessibilityRole="none" onPress={() => undefined} style={{ width: '100%', maxWidth: 560, maxHeight: '90%', borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text accessibilityRole="header" style={{ fontSize: Typography.fontSize.xl, lineHeight: Typography.lineHeight.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>Customize dashboard</Text>
              <Text style={{ marginTop: 5, fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, color: colors.textSecondary }}>Move the containers into the order that matches how you review your money. Changes save automatically.</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close dashboard customization" onPress={onClose} hitSlop={8} style={{ width: 38, height: 38, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated }}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: Spacing.lg, gap: Spacing.sm }}>
            {order.map((section, index) => {
              const meta = DASHBOARD_SECTION_META[section];
              return (
                <View key={section} style={{ minHeight: 72, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <View style={{ width: 34, alignItems: 'center', gap: 2 }}>
                    <MaterialCommunityIcons name="drag-vertical" size={22} color={colors.textTertiary} />
                    <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{meta.label}</Text>
                    <Text style={{ marginTop: 3, fontSize: Typography.fontSize.xs, lineHeight: 17, color: colors.textSecondary }} numberOfLines={2}>{meta.description}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                    <MoveButton direction="up" disabled={index === 0} label={`Move ${meta.label} up`} onPress={() => onMove(section, -1)} />
                    <MoveButton direction="down" disabled={index === order.length - 1} label={`Move ${meta.label} down`} onPress={() => onMove(section, 1)} />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={{ marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}>
            <TouchableOpacity accessibilityRole="button" disabled={!customized} onPress={onReset} style={{ minHeight: 42, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, opacity: customized ? 1 : 0.45 }}>
              <MaterialCommunityIcons name="restore" size={18} color={colors.textSecondary} />
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>Restore default</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={onClose} style={{ minHeight: 42, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MoveButton({ direction, disabled, label, onPress }: { direction: 'up' | 'down'; disabled: boolean; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={{ width: 38, height: 38, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : 1 }}>
      <MaterialCommunityIcons name={direction === 'up' ? 'arrow-up' : 'arrow-down'} size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}
