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
    color: '#111111',
    glowColor: 'rgba(17, 17, 17, 0.25)',
    requirement: 'Track expenses for 7 consecutive days',
    xpReward: 100,
    tier: 'bronze',
  },
  {
    id: 'saver_streak',
    name: 'Saver Streak',
    description: 'Stay under budget for 2 consecutive weeks',
    icon: 'fire',
    color: '#2B2B2B',
    glowColor: 'rgba(43, 43, 43, 0.22)',
    requirement: '14 days under daily budget limit',
    xpReward: 250,
    tier: 'silver',
  },
  {
    id: 'budget_master',
    name: 'Budget Master',
    description: 'Complete a full month under budget',
    icon: 'shield-check-outline',
    color: '#444444',
    glowColor: 'rgba(68, 68, 68, 0.22)',
    requirement: 'End the month with savings > 20%',
    xpReward: 500,
    tier: 'gold',
  },
  {
    id: 'no_spend_warrior',
    name: 'No Spend Warrior',
    description: 'Complete 3 No-Spend Challenges',
    icon: 'sword-cross',
    color: '#5A5A5A',
    glowColor: 'rgba(90, 90, 90, 0.22)',
    requirement: 'Finish 3 challenges without breaking streak',
    xpReward: 400,
    tier: 'silver',
  },
  {
    id: 'emergency_survivor',
    name: 'Emergency Survivor',
    description: 'Successfully navigate emergency mode',
    icon: 'lifebuoy',
    color: '#111111',
    glowColor: 'rgba(17, 17, 17, 0.25)',
    requirement: 'Activate and complete emergency mode within budget',
    xpReward: 350,
    tier: 'silver',
  },
  {
    id: 'smart_investor',
    name: 'Smart Investor',
    description: 'Save more than 40% of your allowance',
    icon: 'trending-up',
    color: '#707070',
    glowColor: 'rgba(112, 112, 112, 0.22)',
    requirement: 'Savings rate > 40% for one full cycle',
    xpReward: 600,
    tier: 'gold',
  },
  {
    id: 'financial_ninja',
    name: 'Financial Ninja',
    description: 'Unlock all other badges',
    icon: 'ninja',
    color: '#000000',
    glowColor: 'rgba(0, 0, 0, 0.35)',
    requirement: 'Earn every other badge',
    xpReward: 1000,
    tier: 'platinum',
  },
  {
    id: 'group_settler',
    name: 'Group Settler',
    description: 'Settle all debts in a group',
    icon: 'handshake-outline',
    color: '#8A8A8A',
    glowColor: 'rgba(138, 138, 138, 0.22)',
    requirement: 'Clear all pending settlements in any group',
    xpReward: 200,
    tier: 'bronze',
  },
];

export const TIER_COLORS = {
  bronze: { bg: '#5A5A5A', text: '#FFFFFF' },
  silver: { bg: '#C0C0C0', text: '#111111' },
  gold: { bg: '#E6E6E6', text: '#111111' },
  platinum: { bg: '#F4F4F4', text: '#111111' },
} as const;

export const getBadgeById = (id: string): BadgeDefinition | undefined => {
  return BADGE_DEFINITIONS.find(b => b.id === id);
};
