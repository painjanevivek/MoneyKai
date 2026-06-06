-- MoneyKai user backups

CREATE TABLE IF NOT EXISTS user_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  backup_name TEXT NOT NULL DEFAULT 'Manual backup',
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_backups_user_created
  ON user_backups(user_id, created_at DESC);

ALTER TABLE user_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backups" ON user_backups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own backups" ON user_backups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backups" ON user_backups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own backups" ON user_backups
  FOR DELETE USING (auth.uid() = user_id);


