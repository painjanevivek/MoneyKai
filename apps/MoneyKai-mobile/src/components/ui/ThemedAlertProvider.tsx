import React from 'react';
import {
  Alert,
  Modal,
  Pressable,
  Text,
  View,
  type AlertButton,
  type AlertOptions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';

type AlertState = {
  title: string;
  message?: string;
  buttons: AlertButton[];
  options?: AlertOptions;
};

const normalizeButtons = (buttons?: AlertButton[]) =>
  buttons && buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' as const }];

export function ThemedAlertProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [alertState, setAlertState] = React.useState<AlertState | null>(null);

  React.useEffect(() => {
    const originalAlert = Alert.alert;
    Alert.alert = (title, message, buttons, options) => {
      setAlertState({
        title: String(title ?? ''),
        message: typeof message === 'string' ? message : undefined,
        buttons: normalizeButtons(buttons),
        options,
      });
    };

    return () => {
      Alert.alert = originalAlert;
    };
  }, []);

  const close = React.useCallback(
    (button?: AlertButton) => {
      setAlertState(null);
      requestAnimationFrame(() => {
        button?.onPress?.();
      });
    },
    []
  );

  return (
    <>
      {children}
      <Modal
        transparent
        visible={Boolean(alertState)}
        animationType="fade"
        onRequestClose={() => {
          if (alertState?.options?.cancelable !== false) {
            close();
          }
        }}
        statusBarTranslucent
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: Spacing.xl,
            paddingBottom: Math.max(insets.bottom, Spacing.md),
            paddingTop: Math.max(insets.top, Spacing.md),
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close alert"
            onPress={() => {
              if (alertState?.options?.cancelable !== false) {
                close();
              }
            }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: 'rgba(10, 18, 16, 0.52)',
            }}
          />
          {alertState && (
            <View
              accessibilityViewIsModal
              style={{
                backgroundColor: colors.card,
                borderColor: colors.borderLight,
                borderRadius: BorderRadius.md,
                borderWidth: 1,
                padding: Spacing.lg,
                ...Shadows.lg,
                shadowColor: colors.shadowColor,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: colors.primaryBg,
                    borderRadius: 20,
                    height: 40,
                    justifyContent: 'center',
                    marginRight: Spacing.sm,
                    width: 40,
                  }}
                >
                  <MaterialCommunityIcons name="information-outline" size={22} color={colors.primary} />
                </View>
                <Text
                  style={{
                    color: colors.textPrimary,
                    flex: 1,
                    fontFamily: Typography.fontFamily.semiBold,
                    fontSize: Typography.fontSize.lg,
                    lineHeight: 26,
                  }}
                >
                  {alertState.title}
                </Text>
              </View>
              {!!alertState.message && (
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontFamily: Typography.fontFamily.regular,
                    fontSize: Typography.fontSize.base,
                    lineHeight: Typography.lineHeight.base,
                    marginBottom: Spacing.lg,
                  }}
                >
                  {alertState.message}
                </Text>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm }}>
                {alertState.buttons.map((button, index) => {
                  const destructive = button.style === 'destructive';
                  const cancel = button.style === 'cancel';
                  return (
                    <Pressable
                      key={`${button.text ?? 'OK'}-${index}`}
                      accessibilityRole="button"
                      onPress={() => close(button)}
                      style={{
                        alignItems: 'center',
                        backgroundColor: destructive ? colors.emergencyBg : cancel ? colors.surface : colors.primaryBg,
                        borderColor: destructive ? colors.emergency : colors.borderLight,
                        borderRadius: BorderRadius.sm,
                        borderWidth: 1,
                        justifyContent: 'center',
                        minHeight: 44,
                        minWidth: 88,
                        paddingHorizontal: Spacing.md,
                      }}
                    >
                      <Text
                        style={{
                          color: destructive ? colors.emergency : colors.primary,
                          fontFamily: Typography.fontFamily.semiBold,
                          fontSize: Typography.fontSize.sm,
                        }}
                      >
                        {button.text ?? 'OK'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
