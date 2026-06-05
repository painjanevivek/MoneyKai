export interface Badge {
  id: string;
  user_id: string;
  badge_type: string;
  name: string;
  description: string;
  icon_url?: string;
  is_unlocked: boolean;
  unlocked_at?: string;
  progress?: number; // 0-100
}
