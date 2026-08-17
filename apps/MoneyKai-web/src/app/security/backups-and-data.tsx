import { SecurityGuideTemplate } from '@/components/marketing/SecurityGuideTemplate';
import { getSecurityGuide } from '@/content/securityGuides';

export default function BackupsAndDataSecurityScreen() {
  return <SecurityGuideTemplate guide={getSecurityGuide('backups-and-data')!} />;
}
