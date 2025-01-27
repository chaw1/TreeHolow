// src/types/memory.ts

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
}

// 数据库返回的原始数据类型
export interface DBMemory {
  id: string;
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