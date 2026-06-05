export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  glowColor: string;
  requirement: string;
  xpReward: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'smart_starter',
    name: 'Smart Starter',
    description: 'Complete your first week of tracking expenses',
    icon: 'rocket-launch-outline',
    color: '#22C55E',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    requirement: 'Track expenses for 7 consecutive days',
    xpReward: 100,
    tier: 'bronze',
  },
  {
    id: 'saver_streak',
    name: 'Saver Streak',
    description: 'Stay under budget for 2 consecutive weeks',
    icon: 'fire',
    color: '#F4A261',
    glowColor: 'rgba(244, 162, 97, 0.4)',
    requirement: '14 days under daily budget limit',
    xpReward: 250,
    tier: 'silver',
  },
  {
    id: 'budget_master',
    name: 'Budget Master',
    description: 'Complete a full month under budget',
    icon: 'shield-check-outline',
    color: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    requirement: 'End the month with savings > 20%',
    xpReward: 500,
    tier: 'gold',
  },
  {
    id: 'no_spend_warrior',
    name: 'No Spend Warrior',
    description: 'Complete 3 No-Spend Challenges',
    icon: 'sword-cross',
    color: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    requirement: 'Finish 3 challenges without breaking streak',
    xpReward: 400,
    tier: 'silver',
  },
  {
    id: 'emergency_survivor',
    name: 'Emergency Survivor',
    description: 'Successfully navigate emergency mode',
    icon: 'lifebuoy',
    color: '#FF5A5A',
    glowColor: 'rgba(255, 90, 90, 0.4)',
    requirement: 'Activate and complete emergency mode within budget',
    xpReward: 350,
    tier: 'silver',
  },
  {
    id: 'smart_investor',
    name: 'Smart Investor',
    description: 'Save more than 40% of your allowance',
    icon: 'trending-up',
    color: '#14B8A6',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    requirement: 'Savings rate > 40% for one full cycle',
    xpReward: 600,
    tier: 'gold',
  },
  {
    id: 'financial_ninja',
    name: 'Financial Ninja',
    description: 'Unlock all other badges',
    icon: 'ninja',
    color: '#1E293B',
    glowColor: 'rgba(30, 41, 59, 0.6)',
    requirement: 'Earn every other badge',
    xpReward: 1000,
    tier: 'platinum',
  },
  {
    id: 'group_settler',
    name: 'Group Settler',
    description: 'Settle all debts in a group',
    icon: 'handshake-outline',
    color: '#6366F1',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    requirement: 'Clear all pending settlements in any group',
    xpReward: 200,
    tier: 'bronze',
  },
];

export const TIER_COLORS = {
  bronze: { bg: '#CD7F32', text: '#FFFFFF' },
  silver: { bg: '#C0C0C0', text: '#1E293B' },
  gold: { bg: '#FFD700', text: '#1E293B' },
  platinum: { bg: '#E5E4E2', text: '#1E293B' },
} as const;

export const getBadgeById = (id: string): BadgeDefinition | undefined => {
  return BADGE_DEFINITIONS.find(b => b.id === id);
};
