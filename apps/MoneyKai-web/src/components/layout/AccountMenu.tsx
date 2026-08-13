import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { withAlpha } from '@/utils/glassStyle';
import { UserAvatar } from '@/components/ui/UserAvatar';

type AccountIdentity = {
  full_name?: string;
  email?: string;
  avatar_url?: string;
} | null | undefined;

type AccountMenuProps = {
  user: AccountIdentity;
  placement: 'above' | 'below';
  compact?: boolean;
  onProfile: () => void;
  onSettings: () => void;
  onSignOut: () => void;
};

type MenuAction = {
  label: string;
  detail: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
};

export function AccountMenu({ user, placement, compact = false, onProfile, onSettings, onSignOut }: AccountMenuProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const userName = user?.full_name || 'Signed in user';
  const userEmail = user?.email || 'No email available';

  const actions: MenuAction[] = [
    {
      label: 'Profile',
      detail: 'Edit your name and photo',
      icon: 'account-outline',
      onPress: onProfile,
    },
    {
      label: 'Settings',
      detail: 'Preferences, privacy, and backups',
      icon: 'cog-outline',
      onPress: onSettings,
    },
    {
      label: 'Sign out',
      detail: 'End this session on this device',
      icon: 'logout',
      destructive: true,
      onPress: onSignOut,
    },
  ];

  const closeAndRun = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <View style={{ position: 'relative', zIndex: 100 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open account menu"
        accessibilityHint="Long press also opens account actions"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((current) => !current)}
        onLongPress={() => setIsOpen(true)}
        delayLongPress={350}
        style={({ hovered, pressed }: any) => ({
          minHeight: compact ? 40 : 54,
          flexDirection: 'row',
          alignItems: 'center',
          gap: compact ? 0 : 12,
          paddingHorizontal: compact ? 2 : 12,
          paddingVertical: compact ? 2 : 10,
          borderRadius: compact ? BorderRadius.full : BorderRadius.md,
          backgroundColor: isOpen || hovered ? colors.surfaceElevated : 'transparent',
          borderWidth: compact ? 1 : 0,
          borderColor: compact ? colors.borderLight : 'transparent',
          transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
        })}
      >
        <UserAvatar
          name={user?.full_name}
          email={user?.email}
          avatarUrl={user?.avatar_url}
          size={compact ? 34 : 34}
        />
        {!compact ? (
          <>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                {userName}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                {userEmail}
              </Text>
            </View>
            <MaterialCommunityIcons name={isOpen ? 'chevron-down' : 'chevron-right'} size={18} color={colors.textTertiary} />
          </>
        ) : null}
      </Pressable>

      {isOpen ? (
        <View
          accessibilityRole="menu"
          style={{
            position: 'absolute',
            left: compact ? undefined : 0,
            right: 0,
            ...(placement === 'above' ? { bottom: compact ? 48 : 62 } : { top: compact ? 48 : 62 }),
            width: compact ? 300 : undefined,
            borderRadius: BorderRadius.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderLight,
            overflow: 'hidden',
            ...Shadows.lg,
            shadowColor: colors.shadowColor,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, backgroundColor: withAlpha(colors.surfaceElevated, 0.8), borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
            <UserAvatar name={user?.full_name} email={user?.email} avatarUrl={user?.avatar_url} size={38} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>
                {userName}
              </Text>
              <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs }}>
                {userEmail}
              </Text>
            </View>
          </View>

          <View style={{ padding: Spacing.xs, gap: 2 }}>
            {actions.map((action) => {
              const actionColor = action.destructive ? colors.error : colors.textPrimary;
              return (
                <Pressable
                  key={action.label}
                  accessibilityRole="menuitem"
                  accessibilityLabel={action.label}
                  onPress={() => closeAndRun(action.onPress)}
                  style={({ hovered, pressed }: any) => ({
                    minHeight: 52,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.sm,
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: Spacing.sm,
                    borderRadius: BorderRadius.md,
                    backgroundColor: hovered ? withAlpha(action.destructive ? colors.error : colors.primary, 0.1) : 'transparent',
                    transform: pressed ? [{ scale: 0.99 }] : [{ scale: 1 }],
                  })}
                >
                  <MaterialCommunityIcons name={action.icon} size={19} color={actionColor} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: actionColor, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>
                      {action.label}
                    </Text>
                    <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs }}>
                      {action.detail}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default AccountMenu;
