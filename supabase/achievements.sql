-- 设置扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户成就表
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    condition TEXT NOT NULL,
    category TEXT NOT NULL,
    points INTEGER NOT NULL,
    unlocked BOOLEAN DEFAULT FALSE,
    progress INTEGER DEFAULT 0,
    date_unlocked TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建积分记录表
CREATE TABLE IF NOT EXISTS user_points (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    total_points INTEGER DEFAULT 0,
    last_checkin TIMESTAMPTZ,
    checkin_streak INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建积分历史表（记录所有积分变动）
CREATE TABLE IF NOT EXISTS points_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    points INTEGER NOT NULL,
    source TEXT NOT NULL, -- 'achievement', 'checkin', 'bonus', etc.
    source_id TEXT, -- 关联的成就ID等
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS user_achievements_user_id_idx ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS user_achievements_achievement_id_idx ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS user_points_user_id_idx ON user_points(user_id);
CREATE INDEX IF NOT EXISTS points_history_user_id_idx ON points_history(user_id);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为用户成就表添加更新时间触发器
CREATE TRIGGER update_user_achievements_updated_at
BEFORE UPDATE ON user_achievements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 为用户积分表添加更新时间触发器
CREATE TRIGGER update_user_points_updated_at
BEFORE UPDATE ON user_points
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 设置行级安全策略
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的成就
CREATE POLICY "Users can view own achievements"
ON user_achievements FOR SELECT
USING (user_id = auth.uid()::text);

-- 用户只能查看自己的积分
CREATE POLICY "Users can view own points"
ON user_points FOR SELECT
USING (user_id = auth.uid()::text);

-- 用户只能查看自己的积分历史
CREATE POLICY "Users can view own points history"
ON points_history FOR SELECT
USING (user_id = auth.uid()::text);

-- 只有服务器可以插入和更新数据（通过服务角色权限）
-- 这些表将使用服务端API进行更新，而不是直接从客户端