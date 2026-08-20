import type { MaterialCommunityIcons } from '@expo/vector-icons';

type SecurityIcon = keyof typeof MaterialCommunityIcons.glyphMap;

export type SecurityGuide = {
  slug: 'browser-protections' | 'account-access' | 'backups-and-data';
  label: string;
  title: string;
  description: string;
  icon: SecurityIcon;
  summary: string;
  sections: {
    title: string;
    body: string;
    points: string[];
  }[];
};

export const SECURITY_GUIDES: SecurityGuide[] = [
  {
    slug: 'browser-protections',
    label: 'Browser protections',
    title: 'How MoneyKai protects the public web surface',
    description: 'A clear overview of the browser controls used to reduce common web risks on moneykai.com.',
    icon: 'web',
    summary: 'The public site uses layered browser policies to make embedding, unsafe content execution, and unnecessary browser permissions harder to misuse.',
    sections: [
      {
        title: 'Safer browser boundaries',
        body: 'Production responses are configured to narrow the contexts in which the site can run and be embedded.',
        points: [
          'HTTPS responses use HSTS to prefer secure connections on supported browsers.',
          'Frame protections limit clickjacking and unintended embedding by other sites.',
          'MIME sniffing protections reduce the chance that browsers reinterpret response types.',
        ],
      },
      {
        title: 'Controlled loading of content',
        body: 'Content Security Policy rules constrain the kinds of scripts, frames, images, and network connections the public site may load.',
        points: [
          'The policy is designed to restrict executable content to approved sources.',
          'Third-party checkout, authentication, and telemetry connections are explicitly scoped.',
          'High-risk browser capabilities are disabled unless the product has a specific need for them.',
        ],
      },
    ],
  },
  {
    slug: 'account-access',
    label: 'Account access',
    title: 'How MoneyKai keeps account access deliberate',
    description: 'Understand the boundaries around sign-in, password reset, and session acceptance in the MoneyKai web app.',
    icon: 'account-key-outline',
    summary: 'Account access is designed as a constrained workflow: sign-in requests are validated, repeated attempts are limited, and failures are explained without exposing account details.',
    sections: [
      {
        title: 'Sign-in and reset requests',
        body: 'Email, password, and Google sign-in flows pass through the authentication gateway before a MoneyKai session is accepted.',
        points: [
          'Authentication requests have server-side safeguards and client-side attempt throttling.',
          'Password reset responses avoid disclosing whether a specific account exists.',
          'Google authentication is handled through the backend-owned flow before Firebase session completion.',
        ],
      },
      {
        title: 'Clear, conservative failure handling',
        body: 'MoneyKai uses bounded requests and user-facing errors so access issues can be resolved without revealing sensitive implementation details.',
        points: [
          'Authentication requests use timeouts instead of waiting indefinitely.',
          'The app validates authentication responses before accepting a session.',
          'Users should never send passwords or verification codes to support.',
        ],
      },
    ],
  },
  {
    slug: 'backups-and-data',
    label: 'Backups and data',
    title: 'How MoneyKai frames data and backup boundaries',
    description: 'Learn what is user-controlled in backup and restore flows, and what MoneyKai does not imply about financial data handling.',
    icon: 'database-lock-outline',
    summary: 'MoneyKai treats backup and restore as explicit, user-started continuity tools—not as an invisible cloud sync promise.',
    sections: [
      {
        title: 'User-controlled backup actions',
        body: 'Creating or restoring a backup is an intentional action initiated from the authenticated app experience.',
        points: [
          'Backups are created only when the user starts the process.',
          'Restore flows require the user to choose a backup file and confirm the action.',
          'Encrypted backup files are available where the applicable product flow supports them.',
        ],
      },
      {
        title: 'Clear data expectations',
        body: 'Security information should explain boundaries instead of making broad claims about financial data.',
        points: [
          'MoneyKai is a personal finance workspace, not a bank or regulated financial custodian.',
          'Financial records are handled in authenticated app workflows.',
          'Do not send full card numbers, passwords, or sensitive document contents by email.',
        ],
      },
    ],
  },
];

export function getSecurityGuide(slug: string) {
  return SECURITY_GUIDES.find((guide) => guide.slug === slug);
}
