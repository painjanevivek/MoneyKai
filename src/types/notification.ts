export type NotificationType = 'budget' | 'transaction' | 'challenge' | 'backup' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  icon: string;
  iconColor: string;
  iconBg: string;
  createdAt: string;
  read: boolean;
  actionRoute?: string;
}
