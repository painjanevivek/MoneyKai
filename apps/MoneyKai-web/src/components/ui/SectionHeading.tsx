import React from 'react';
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Spacing, Typography } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

export type SectionHeadingLevel = 'section' | 'subsection';

export type SectionHeadingProps = Readonly<{
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  level?: SectionHeadingLevel;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  testID?: string;
}>;

export function SectionHeading({
  title,
  description,
  eyebrow,
  action,
  level = 'section',
  style,
  titleStyle,
  testID,
}: SectionHeadingProps) {
  const { colors } = useTheme();
  const isSection = level === 'section';

  return (
    <View
      testID={testID}
      style={[
        {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: Spacing.md,
          justifyContent: 'space-between',
        },
        style,
      ]}
    >
      <View style={{ flex: 1, gap: eyebrow || description ? Spacing.xs : 0, minWidth: 0 }}>
        {eyebrow ? (
          <Text
            style={{
              color: colors.textTertiary,
              fontFamily: Typography.fontFamily.semiBold,
              fontSize: Typography.fontSize.xs,
              letterSpacing: 0.7,
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text
          accessibilityRole="header"
          style={[
            {
              color: colors.textPrimary,
              fontFamily: Typography.fontFamily.semiBold,
              fontSize: isSection ? Typography.fontSize['2xl'] : Typography.fontSize.lg,
              lineHeight: isSection ? Typography.lineHeight['2xl'] : Typography.lineHeight.lg,
            },
            titleStyle,
          ]}
        >
          {title}
        </Text>
        {description ? (
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: Typography.fontFamily.regular,
              fontSize: Typography.fontSize.base,
              lineHeight: Typography.lineHeight.base,
            }}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {action ? <View style={{ flexShrink: 0 }}>{action}</View> : null}
    </View>
  );
}

export default SectionHeading;
