-- 设置扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 创建心灵日记表
CREATE TABLE IF NOT EXISTS user_diaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    mood INTEGER CHECK (mood BETWEEN 1 AND 5), -- 1-5的心情评分
    tags TEXT[], -- 标签数组
    image_url TEXT, -- 可选图片
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    location TEXT, -- 可选位置信息
    weather TEXT -- 可选天气信息
);

-- 创建日记标签表
CREATE TABLE IF NOT EXISTS diary_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 将默认标签添加到标签表
INSERT INTO diary_tags (name) VALUES 
    ('开心'), ('悲伤'), ('焦虑'), ('平静'), ('感恩'),
    ('工作'), ('家庭'), ('旅行'), ('学习'), ('健康'),
    ('生活'), ('梦想'), ('回忆'), ('期待'), ('思考')
ON CONFLICT (name) DO NOTHING;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS user_diaries_user_id_idx ON user_diaries(user_id);
CREATE INDEX IF NOT EXISTS user_diaries_created_at_idx ON user_diaries(created_at);
CREATE INDEX IF NOT EXISTS user_diaries_mood_idx ON user_diaries(mood);
CREATE INDEX IF NOT EXISTS user_diaries_tags_gin_idx ON user_diaries USING GIN(tags);
CREATE INDEX IF NOT EXISTS user_diaries_content_idx ON user_diaries USING GIN(content gin_trgm_ops);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_diaries_updated_at
BEFORE UPDATE ON user_diaries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 允许通过RLS访问权限
ALTER TABLE user_diaries ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view own diaries"
ON user_diaries FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own diaries"
ON user_diaries FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own diaries"
ON user_diaries FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own diaries"
ON user_diaries FOR DELETE
USING (auth.uid()::text = user_id);

-- 安全策略：公开日记可以被其他用户浏览
CREATE POLICY "Users can view public diaries"
ON user_diaries FOR SELECT
USING (is_private = false);

-- 创建心情分布统计函数
CREATE OR REPLACE FUNCTION get_mood_distribution(
  user_id_param TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
) RETURNS TABLE (
  mood INTEGER,
  count BIGINT
) LANGUAGE SQL AS $$
  SELECT 
    mood, 
    COUNT(*) as count
  FROM 
    user_diaries
  WHERE 
    user_id = user_id_param
    AND created_at >= start_date
    AND created_at <= end_date
  GROUP BY 
    mood
  ORDER BY 
    mood;
$$;

-- 创建标签统计函数
CREATE OR REPLACE FUNCTION get_tag_counts(
  user_id_param TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
) RETURNS TABLE (
  tag TEXT,
  count BIGINT
) LANGUAGE SQL AS $$
  SELECT 
    UNNEST(tags) as tag, 
    COUNT(*) as count
  FROM 
    user_diaries
  WHERE 
    user_id = user_id_param
    AND created_at >= start_date
    AND created_at <= end_date
    AND tags IS NOT NULL
  GROUP BY 
    tag
  ORDER BY 
    count DESC;
$$;