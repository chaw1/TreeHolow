-- 为user_points表添加唯一约束
ALTER TABLE user_points ADD CONSTRAINT user_points_user_id_key UNIQUE (user_id);

-- 为user_achievements表添加复合唯一约束
ALTER TABLE user_achievements ADD CONSTRAINT user_achievements_user_id_achievement_id_key UNIQUE (user_id, achievement_id);

-- 删除可能存在的重复项（保留最新的一条记录）
WITH ranked_points AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
  FROM 
    user_points
)
DELETE FROM user_points
WHERE id IN (
  SELECT id FROM ranked_points WHERE rn > 1
);