-- SmartPaisa Database Schema
-- PostgreSQL (Supabase)
-- Run this in the Supabase SQL Editor to create all tables

-- ══════════════════════════════════════════════════════════════════════════════
-- PROFILES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  monthly_allowance NUMERIC DEFAULT 15000,
  reset_day INTEGER DEFAULT 1 CHECK (reset_day >= 1 AND reset_day <= 31),
  auto_reset BOOLEAN DEFAULT true,
  carry_forward BOOLEAN DEFAULT false,
  currency TEXT DEFAULT 'INR',
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ══════════════════════════════════════════════════════════════════════════════
-- TRANSACTIONS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  payment_method TEXT DEFAULT 'upi',
  receipt_url TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(user_id, category);

-- ══════════════════════════════════════════════════════════════════════════════
-- BUDGETS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  allowance NUMERIC NOT NULL,
  total_spent NUMERIC DEFAULT 0,
  total_income NUMERIC DEFAULT 0,
  cycle_start DATE NOT NULL,
  cycle_end DATE NOT NULL,
  adjustment_reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budgets_active ON budgets(user_id, is_active);

-- ══════════════════════════════════════════════════════════════════════════════
-- GROUPS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'friends' CHECK (type IN ('flatmates', 'friends', 'trip', 'event')),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES profiles(id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL DEFAULT '',
  split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'percentage', 'custom')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_expense_id UUID NOT NULL REFERENCES group_expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount NUMERIC NOT NULL,
  is_settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMPTZ
);

-- ══════════════════════════════════════════════════════════════════════════════
-- CHALLENGES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  duration_days INTEGER NOT NULL,
  current_streak INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  savings_earned NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- BADGES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon_url TEXT, -- Fallback: allow user/admin to upload custom badge images
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  UNIQUE(user_id, badge_type)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- NOTES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  is_pinned BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'note' CHECK (type IN ('note', 'ledger', 'checklist')),
  checklist_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_user ON notes(user_id, is_pinned DESC, updated_at DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own challenges" ON challenges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own badges" ON badges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notes" ON notes FOR ALL USING (auth.uid() = user_id);

-- Groups: users can see groups they belong to
CREATE POLICY "Users can view their groups" ON groups FOR SELECT 
  USING (id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can view group data" ON group_members FOR SELECT
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can view group expenses" ON group_expenses FOR SELECT
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can view expense splits" ON expense_splits FOR SELECT
  USING (group_expense_id IN (
    SELECT id FROM group_expenses WHERE group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  ));
