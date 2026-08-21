import { SecurityGuideTemplate } from '@/components/marketing/SecurityGuideTemplate';
import { getSecurityGuide } from '@/content/securityGuides';

export default function AccountAccessSecurityScreen() {
  return <SecurityGuideTemplate guide={getSecurityGuide('account-access')!} />;
}
