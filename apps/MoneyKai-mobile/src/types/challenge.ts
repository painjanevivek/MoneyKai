export interface Challenge {
  id: string;
  user_id: string;
  name: string;
  category: string;
  description: string;
  duration_days: number;
  current_streak: number;
  xp_earned: number;
  savings_earned: number;
  status: 'active' | 'completed' | 'failed' | 'deactivated';
  start_date: string;
  end_date: string;
  created_at: string;
  daily_log?: DailyLog[];
}

export interface DailyLog {
  date: string;
  completed: boolean;
  note?: string;
}

export interface ChallengeTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  defaultDuration: number;
  estimatedSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'no_food_delivery',
    name: 'No Food Delivery',
    category: 'food',
    description: 'Avoid ordering food delivery for the duration',
    icon: 'food-off',
    color: '#0D8C4C',
    defaultDuration: 7,
    estimatedSavings: 1500,
    difficulty: 'medium',
  },
  {
    id: 'no_shopping',
    name: 'No Shopping',
    category: 'shopping',
    description: 'No shopping for non-essential items',
    icon: 'cart-off',
    color: '#8B5CF6',
    defaultDuration: 14,
    estimatedSavings: 2000,
    difficulty: 'hard',
  },
  {
    id: 'no_cab',
    name: 'No Cab Challenge',
    category: 'transport',
    description: 'Use only public transport or walk',
    icon: 'car-off',
    color: '#3B82F6',
    defaultDuration: 7,
    estimatedSavings: 800,
    difficulty: 'easy',
  },
  {
    id: 'weekend_no_spend',
    name: 'Weekend No-Spend',
    category: 'others',
    description: 'Spend nothing on weekends for 4 weeks',
    icon: 'calendar-weekend',
    color: '#F4A261',
    defaultDuration: 28,
    estimatedSavings: 3000,
    difficulty: 'hard',
  },
  {
    id: 'coffee_free',
    name: 'Coffee Free Week',
    category: 'food',
    description: 'No cafe coffee - make it at home',
    icon: 'coffee-off',
    color: '#14B8A6',
    defaultDuration: 7,
    estimatedSavings: 500,
    difficulty: 'easy',
  },
  {
    id: 'entertainment_fast',
    name: 'Entertainment Fast',
    category: 'entertainment',
    description: 'No paid entertainment subscriptions or outings',
    icon: 'movie-off',
    color: '#EC4899',
    defaultDuration: 14,
    estimatedSavings: 1000,
    difficulty: 'medium',
  },
  {
    id: 'home_cooked_week',
    name: 'Home-Cooked Week',
    category: 'food',
    description: 'Plan simple meals and avoid outside food for one week',
    icon: 'pot-steam-outline',
    color: '#4B5563',
    defaultDuration: 7,
    estimatedSavings: 1200,
    difficulty: 'medium',
  },
  {
    id: 'pantry_first',
    name: 'Pantry First',
    category: 'food',
    description: 'Use groceries already at home before buying more',
    icon: 'fridge-outline',
    color: '#64748B',
    defaultDuration: 5,
    estimatedSavings: 700,
    difficulty: 'easy',
  },
  {
    id: 'public_transport_week',
    name: 'Public Transport Week',
    category: 'transport',
    description: 'Use metro, bus, walk, or shared rides before booking cabs',
    icon: 'train-car',
    color: '#2563EB',
    defaultDuration: 7,
    estimatedSavings: 900,
    difficulty: 'medium',
  },
  {
    id: 'short_walk_rule',
    name: 'Short Walk Rule',
    category: 'transport',
    description: 'Walk for trips under 1.5 km when it is practical and safe',
    icon: 'walk',
    color: '#0F766E',
    defaultDuration: 10,
    estimatedSavings: 500,
    difficulty: 'easy',
  },
  {
    id: 'subscription_audit',
    name: 'Subscription Audit',
    category: 'bills',
    description: 'Cancel, pause, or downgrade unused subscriptions',
    icon: 'playlist-remove',
    color: '#525252',
    defaultDuration: 3,
    estimatedSavings: 800,
    difficulty: 'easy',
  },
  {
    id: 'utility_saver',
    name: 'Utility Saver',
    category: 'bills',
    description: 'Reduce electricity, data, and utility waste for two weeks',
    icon: 'lightning-bolt-outline',
    color: '#71717A',
    defaultDuration: 14,
    estimatedSavings: 600,
    difficulty: 'easy',
  },
  {
    id: 'cash_only_week',
    name: 'Cash-Only Week',
    category: 'others',
    description: 'Set a weekly cash limit for daily spending and avoid extra swipes',
    icon: 'cash-clock',
    color: '#111827',
    defaultDuration: 7,
    estimatedSavings: 1000,
    difficulty: 'medium',
  },
  {
    id: 'wish_list_delay',
    name: 'Wishlist Delay',
    category: 'shopping',
    description: 'Wait 72 hours before buying anything non-essential',
    icon: 'clock-check-outline',
    color: '#7C3AED',
    defaultDuration: 14,
    estimatedSavings: 1800,
    difficulty: 'medium',
  },
  {
    id: 'closet_reuse',
    name: 'Closet Reuse',
    category: 'shopping',
    description: 'Style what you already own instead of buying clothes',
    icon: 'hanger',
    color: '#6D28D9',
    defaultDuration: 21,
    estimatedSavings: 2200,
    difficulty: 'medium',
  },
  {
    id: 'rent_buffer',
    name: 'Rent Buffer',
    category: 'rent',
    description: 'Move a small amount aside every day toward rent or housing',
    icon: 'home-clock-outline',
    color: '#374151',
    defaultDuration: 14,
    estimatedSavings: 1500,
    difficulty: 'medium',
  },
  {
    id: 'medicine_planner',
    name: 'Medicine Planner',
    category: 'healthcare',
    description: 'Plan routine medicines and appointments to avoid last-minute costs',
    icon: 'pill',
    color: '#737373',
    defaultDuration: 10,
    estimatedSavings: 400,
    difficulty: 'easy',
  },
  {
    id: 'learning_budget_lock',
    name: 'Learning Budget Lock',
    category: 'education',
    description: 'Use free resources first and avoid impulse course purchases',
    icon: 'school-outline',
    color: '#57534E',
    defaultDuration: 14,
    estimatedSavings: 1200,
    difficulty: 'medium',
  },
  {
    id: 'daily_expense_log',
    name: 'Daily Expense Log',
    category: 'others',
    description: 'Log every spend on the same day, even small cash payments',
    icon: 'clipboard-list-outline',
    color: '#334155',
    defaultDuration: 21,
    estimatedSavings: 700,
    difficulty: 'easy',
  },
  {
    id: 'micro_savings_streak',
    name: 'Micro Savings Streak',
    category: 'others',
    description: 'Save a small fixed amount daily before spending on wants',
    icon: 'piggy-bank-outline',
    color: '#0F172A',
    defaultDuration: 30,
    estimatedSavings: 3000,
    difficulty: 'medium',
  },
];

export const MOTIVATIONAL_MESSAGES = [
  'Every rupee saved is a rupee earned.',
  'You are building a habit that will last a lifetime.',
  'Small wins lead to big victories.',
  'Your future self will thank you for this.',
  'Discipline is the bridge between goals and results.',
  'You are stronger than your cravings.',
  'Financial freedom starts with one decision at a time.',
  'Stay focused - the streak is building.',
  'You are one day closer to your goal.',
  'Champions are made when no one is watching.',
];
