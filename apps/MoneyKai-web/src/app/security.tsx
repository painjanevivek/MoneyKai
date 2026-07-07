import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View, useWindowDimensions } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { SITE } from '@/constants/site';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type SecurityItem = {
  title: string;
  body: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

type DetailSection = {
  title: string;
  body: string;
  points: string[];
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const SECURITY_SUMMARY: SecurityItem[] = [
  {
    title: 'Protected web surface',
    body: 'MoneyKai deploys security headers that limit framing, MIME sniffing, referrer leakage, and unnecessary browser capabilities.',
    icon: 'shield-lock-outline',
  },
  {
    title: 'Controlled sign-in flow',
    body: 'Authentication requests go through a gateway flow with bounded request timeouts and clear failure handling.',
    icon: 'account-lock-outline',
  },
  {
    title: 'User-controlled backups',
    body: 'Backup and restore flows are explicit user actions, with encrypted backup files available where supported.',
    icon: 'file-lock-outline',
  },
];

const SECURITY_DETAILS: DetailSection[] = [
  {
    title: 'Transport and browser protections',
    body: 'The website is configured with defensive browser policies so the public surface is harder to embed, spoof, or misuse from another origin.',
    icon: 'web',
    points: [
      'HTTPS hardening with HSTS on production responses.',
      'Content Security Policy boundaries for scripts, frames, images, and network connections.',
      'Clickjacking and content-type protections with frame and MIME sniffing controls.',
    ],
  },
  {
    title: 'Account access safeguards',
    body: 'MoneyKai keeps account access flows narrow and predictable, with explicit authentication requests and user-facing error handling.',
    icon: 'account-key-outline',
    points: [
      'Email and Google sign-in are routed through the web authentication gateway.',
      'Client-side attempt throttling helps reduce repeated sign-in and password reset abuse.',
      'Authentication responses are validated before a session is accepted by the app.',
    ],
  },
  {
    title: 'Data and backup boundaries',
    body: 'MoneyKai avoids vague security claims. The product explains where financial records live and which actions the user controls.',
    icon: 'database-lock-outline',
    points: [
      'Finance records are handled inside authenticated app flows.',
      'Backup files are created or restored only when the user starts that action.',
      'Encrypted backup files are positioned as user-controlled continuity, not a hidden cloud sync promise.',
    ],
  },
  {
    title: 'Operational care',
    body: 'Security is also about reducing accidental exposure and keeping sensitive workflows conservative by default.',
    icon: 'clipboard-check-outline',
    points: [
      'API helpers apply response security headers and request body limits.',
      'Sensitive capabilities such as camera, microphone, geolocation, payment, USB, and Bluetooth are restricted by policy on the public site.',
      'Security and privacy questions can be sent to the published support channel.',
    ],
  },
];

const DISCLOSURE_POINTS = [
  'MoneyKai is a personal finance workspace, not a bank or regulated financial custodian.',
  'No software can promise absolute security, so the product avoids blanket guarantees.',
  'Do not send passwords, full card numbers, or sensitive document contents by email.',
];

export default function SecurityScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 920;

  return (
    <>
      <SeoHead
        title="MoneyKai Security | Account, browser, and backup protections"
        description="Learn how MoneyKai approaches website security, account access, browser protections, backup boundaries, and responsible disclosure."
        path="/security"
        keywords={['MoneyKai security', 'budget app security', 'finance app privacy', 'encrypted backup files']}
      />
      <PublicShell
        eyebrow="Security"
        title="Security built around clear boundaries and careful defaults."
        description="MoneyKai keeps security communication specific: protect the website surface, keep sign-in flows controlled, and explain data and backup boundaries without inflated claims."
      >
        <View style={{ gap: Spacing['2xl'] }}>
          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.lg }}>
            {SECURITY_SUMMARY.map((item, index) => (
              <View
                key={item.title}
                style={{
                  flex: 1,
                  minWidth: 0,
                  paddingLeft: isWide && index > 0 ? Spacing.lg : 0,
                  borderLeftWidth: isWide && index > 0 ? 1 : 0,
                  borderLeftColor: colors.borderLight,
                  gap: Spacing.sm,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: BorderRadius.md,
                    backgroundColor: colors.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name={item.icon} size={22} color={colors.primary} />
                </View>
                <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {item.title}
                </Text>
                <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  {item.body}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ gap: Spacing.lg }}>
            <View style={{ gap: Spacing.xs }}>
              <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                What MoneyKai protects
              </Text>
              <Text style={{ maxWidth: 760, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                These are the practical controls worth surfacing publicly. The page intentionally avoids listing every internal setting.
              </Text>
            </View>

            <View style={{ gap: Spacing.md }}>
              {SECURITY_DETAILS.map((section) => (
                <SectionCard key={section.title}>
                  <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.lg }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: BorderRadius.md,
                        backgroundColor: colors.primaryBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons name={section.icon} size={23} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        {section.title}
                      </Text>
                      <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                        {section.body}
                      </Text>
                      <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
                        {section.points.map((point) => (
                          <View key={point} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                            <MaterialCommunityIcons name="check-circle-outline" size={17} color={colors.primary} style={{ marginTop: 2 }} />
                            <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                              {point}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </SectionCard>
              ))}
            </View>
          </View>

          <SectionCard variant="outlined">
            <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.lg, alignItems: isWide ? 'flex-start' : 'stretch' }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Responsible security expectations
                </Text>
                <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  Security communication should help users understand risk without turning into a checklist of internal controls.
                </Text>
              </View>
              <View style={{ flex: 1.2, minWidth: 0, gap: Spacing.sm }}>
                {DISCLOSURE_POINTS.map((point) => (
                  <View key={point} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                    <MaterialCommunityIcons name="information-outline" size={17} color={colors.textSecondary} style={{ marginTop: 2 }} />
                    <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                      {point}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </SectionCard>

          <View style={{ paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
              For security, privacy, or data-related questions, contact{' '}
              <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                {SITE.supportEmail}
              </Text>
              .
            </Text>
          </View>
        </View>
      </PublicShell>
    </>
  );
}
