import { SecurityGuideTemplate } from '@/components/marketing/SecurityGuideTemplate';
import { getSecurityGuide } from '@/content/securityGuides';

export default function BrowserProtectionsSecurityScreen() {
  return <SecurityGuideTemplate guide={getSecurityGuide('browser-protections')!} />;
}
