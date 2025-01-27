-- 启用必要的扩展
create extension if not exists "uuid-ossp";

-- 创建用户记忆表
create table if not exists user_memories (
    id uuid default uuid_generate_v4() primary key,
    user_id text not null,
    audio_url text,
    transcript text,
    ai_response text,
    created_at timestamptz default now(),
    is_private boolean default true,
    encryption_key text
);

-- 创建索引
create index user_memories_user_id_idx on user_memories(user_id);
create index user_memories_created_at_idx on user_memories(created_at);