// src/types/memory.ts

// 成就类型定义
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string;  // 达成条件描述
  unlocked: boolean;  // 是否已解锁
  progress?: number;  // 进度百分比 (0-100)
  category: 'interaction' | 'emotion' | 'streak' | 'special'; // 成就类别
  points: number;     // 达成后获得的积分
  dateUnlocked?: string; // 解锁日期
}

export interface Memory {
  id: string | number;
  content: string;
  aiResponse: string;
  timestamp: string;
  audioUrl?: string;
  emotionScore?: number;
}

export interface Stats {
  totalInteractions: number;
  averageEmotionScore: number;
  streakDays: number;
  totalWords: number;
  points: number;            // 用户积分
  lastCheckIn?: string;      // 上次签到日期
  checkInStreak: number;     // 连续签到天数
}

// 数据库返回的原始数据类型
export interface DBMemory {
  id: string;
  user_id: string;  // 添加用户ID字段
  transcript: string;
  ai_response: string;
  created_at: string;
  audio_url?: string;
  emotion_score?: number;
}

export interface Message {
  id: string | number;
  type: string;
  audioUrl?: string;
  content: string;
  aiResponse: string; // 修改为必需属性
  timestamp: string;
}