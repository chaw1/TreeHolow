-- 创建记忆表
CREATE TABLE IF NOT EXISTS memories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    transcript TEXT NOT NULL,
    ai_response TEXT,
    audio_url TEXT,
    emotion_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS memories_user_id_idx ON memories(user_id);
CREATE INDEX IF NOT EXISTS memories_created_at_idx ON memories(created_at);

-- 更新时间触发器 (如果尚未创建)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为记忆表添加更新时间触发器
CREATE TRIGGER update_memories_updated_at
BEFORE UPDATE ON memories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 设置行级安全策略
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的记忆
CREATE POLICY "Users can view own memories"
ON memories FOR SELECT
USING (user_id = auth.uid()::text);

-- 用户只能插入自己的记忆
CREATE POLICY "Users can insert own memories"
ON memories FOR INSERT
WITH CHECK (user_id = auth.uid()::text);

-- 用户只能更新自己的记忆
CREATE POLICY "Users can update own memories"
ON memories FOR UPDATE
USING (user_id = auth.uid()::text);

-- 用户只能删除自己的记忆
CREATE POLICY "Users can delete own memories"
ON memories FOR DELETE
USING (user_id = auth.uid()::text);