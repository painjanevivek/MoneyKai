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
  status: 'active' | 'completed' | 'failed';
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
