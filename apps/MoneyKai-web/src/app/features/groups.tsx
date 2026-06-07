import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const BENEFITS = [
  'Create shared money groups',
  'Track group-related spending',
  'Keep shared expenses organized',
  'Archive old groups',
  'Delete unnecessary groups',
  'Reduce confusion around who spent what',
];

const USE_CASES = [
  'Roommates sharing rent or groceries',
  'Friends managing trip expenses',
  'Couples managing shared spending',
  'Families tracking household expenses',
  'Small informal groups tracking common costs',
];

const FAQS = [
  {
    question: 'What are MoneyKai Groups used for?',
    answer:
      'MoneyKai Groups help users organize shared spending in one place so group-related expenses do not get mixed into personal tracking without context.',
  },
  {
    question: 'Can I use groups for roommates or couples?',
    answer:
      'Yes. Groups are useful for roommates, couples, families, friends, and other shared-cost situations where people need a clearer view of common expenses.',
  },
  {
    question: 'Why is group expense tracking helpful?',
    answer:
      'It reduces confusion by keeping shared costs organized, making it easier to see what belongs to the group and who spent what.',
  },
  {
    question: 'Can old groups be cleaned up later?',
    answer:
      'Yes. MoneyKai supports actions like archiving old groups and deleting unnecessary ones so the shared-finance workspace can stay cleaner over time.',
  },
];

export default function GroupsFeaturePage() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title="Manage Shared Expenses with MoneyKai Groups | Shared finance made clearer"
        description="Create groups to manage shared spending with friends, family, couples, roommates, or small teams using MoneyKai Groups."
        path="/features/groups"
        keywords={['shared expenses app', 'group expense tracker', 'roommate expense app', 'couples shared spending']}
      />
      <PublicShell
        eyebrow="Groups"
        title="Manage Shared Expenses with MoneyKai Groups"
        description="Create groups to manage shared spending with friends, family, couples, roommates, or small teams."
      >
        <View style={{ gap: Spacing.xl }}>
          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Key benefits
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
              {BENEFITS.map((benefit) => (
                <SectionCard key={benefit} style={{ flexBasis: 240, flexGrow: 1 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      backgroundColor: colors.primaryBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: Spacing.md,
                    }}
                  >
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={{ fontSize: Typography.fontSize.md, lineHeight: 22, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                    {benefit}
                  </Text>
                </SectionCard>
              ))}
            </View>
          </View>

          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Use cases
            </Text>
            <View style={{ gap: Spacing.md }}>
              {USE_CASES.map((useCase, index) => (
                <SectionCard key={useCase}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: Typography.fontSize.md, lineHeight: 22, color: colors.textPrimary }}>
                      {useCase}
                    </Text>
                  </View>
                </SectionCard>
              ))}
            </View>
          </View>

          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Frequently asked questions
            </Text>
            <View style={{ gap: Spacing.md }}>
              {FAQS.map((faq) => (
                <SectionCard key={faq.question}>
                  <Text style={{ fontSize: Typography.fontSize.lg, lineHeight: 24, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {faq.question}
                  </Text>
                  <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                    {faq.answer}
                  </Text>
                </SectionCard>
              ))}
            </View>
          </View>
        </View>
      </PublicShell>
    </>
  );
}
