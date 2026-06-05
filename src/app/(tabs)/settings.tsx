import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { Card } from '@/components/ui/Card';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

interface SettingItemProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, iconColor, iconBg, title, subtitle, right, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      style={{
        flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.borderLight,
      }}
    >
      <View style={{
        width: 40, height: 40, borderRadius: BorderRadius.sm,
        backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
      }}>
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>{title}</Text>
        {subtitle && <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {right || (onPress && <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />)}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuthStore();
  const { notificationsEnabled, hapticEnabled, toggleNotifications, toggleHaptic, currency } = useSettingsStore();
  const { settings, updateSettings } = useBudgetStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: () => {
          signOut();
          router.replace('/(auth)/login');
        }
      },
    ]);
  };

  const handleExport = () => {
    Alert.alert('Export Data', 'Your transaction data will be exported as CSV.\n\n(This feature requires a development build)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.base, paddingVertical: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>Settings</Text>
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary }}>Manage your account and preferences</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={{ marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: '#FFF' }}>
                {user?.full_name?.[0] || 'A'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{user?.full_name || 'Aditya Sharma'}</Text>
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>{user?.email || 'aditya@example.com'}</Text>
            </View>
            <TouchableOpacity>
              <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Budget Settings */}
        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Budget</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem
            icon="wallet-outline" iconColor="#0D8C4C" iconBg="#E8F5EE"
            title="Monthly Allowance" subtitle={`₹ ${settings.monthly_allowance.toLocaleString('en-IN')}`}
          />
          <SettingItem
            icon="calendar-sync" iconColor="#3B82F6" iconBg="#EBF4FF"
            title="Auto Reset" subtitle={`Resets on day ${settings.reset_day} of each month`}
            right={<Switch value={settings.auto_reset} onValueChange={(v) => updateSettings({ auto_reset: v })} trackColor={{ true: colors.primary }} />}
          />
          <SettingItem
            icon="transfer" iconColor="#8B5CF6" iconBg="#F3EFFE"
            title="Carry Forward" subtitle="Move unused balance to next month"
            right={<Switch value={settings.carry_forward} onValueChange={(v) => updateSettings({ carry_forward: v })} trackColor={{ true: colors.primary }} />}
          />
        </Card>

        {/* Appearance */}
        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Appearance</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem
            icon={isDark ? 'weather-night' : 'weather-sunny'} iconColor="#F59E0B" iconBg="#FEF9E7"
            title="Dark Mode" subtitle={isDark ? 'Currently enabled' : 'Currently disabled'}
            right={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: colors.primary }} />}
          />
          <SettingItem
            icon="currency-inr" iconColor="#14B8A6" iconBg="#E8FAF6"
            title="Currency" subtitle={`${currency} (₹)`}
          />
        </Card>

        {/* Notifications */}
        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Notifications</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem
            icon="bell-outline" iconColor="#EC4899" iconBg="#FEF0F7"
            title="Push Notifications"
            right={<Switch value={notificationsEnabled} onValueChange={toggleNotifications} trackColor={{ true: colors.primary }} />}
          />
          <SettingItem
            icon="vibrate" iconColor="#6366F1" iconBg="#EEEFFD"
            title="Haptic Feedback"
            right={<Switch value={hapticEnabled} onValueChange={toggleHaptic} trackColor={{ true: colors.primary }} />}
          />
        </Card>

        {/* Data */}
        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Data & Privacy</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem icon="download-outline" iconColor="#0D8C4C" iconBg="#E8F5EE" title="Export Data (CSV)" subtitle="Download your transactions" onPress={handleExport} />
          <SettingItem icon="cloud-upload-outline" iconColor="#3B82F6" iconBg="#EBF4FF" title="Backup & Restore" subtitle="Sync with cloud" onPress={() => Alert.alert('Backup', 'Data is auto-synced when connected to Supabase.')} />
          <SettingItem icon="shield-lock-outline" iconColor="#8B5CF6" iconBg="#F3EFFE" title="Privacy" subtitle="Manage data privacy settings" onPress={() => {}} />
        </Card>

        {/* About */}
        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>About</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem icon="information-outline" iconColor="#6B7280" iconBg="#F3F4F6" title="Version" subtitle="SmartPaisa v1.0.0" />
          <SettingItem icon="star-outline" iconColor="#F59E0B" iconBg="#FEF9E7" title="Rate the App" onPress={() => {}} />
          <SettingItem icon="help-circle-outline" iconColor="#14B8A6" iconBg="#E8FAF6" title="Help & Support" onPress={() => {}} />
        </Card>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: Spacing.base, borderRadius: BorderRadius.md,
            backgroundColor: colors.emergencyBg, borderWidth: 1, borderColor: `${colors.emergency}30`,
          }}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.emergency} />
          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.emergency }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
