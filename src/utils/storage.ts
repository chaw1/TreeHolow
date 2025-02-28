// src/utils/storage.ts
import { Memory } from "@/types/memory";
import { saveMemory as supabaseSaveMemory, getUserMemories as supabaseGetUserMemories } from "./supabase";

// 保存记忆到云存储
export async function saveMemory(
  userId: string,
  audioBlob: Blob | null,
  transcript: string,
  aiResponse: string
): Promise<Memory> {
  try {
    // 尝试使用Supabase保存
    try {
      const memory = await supabaseSaveMemory(userId, audioBlob, transcript, aiResponse);
      
      // 转换为前端格式
      return {
        id: memory.id,
        content: memory.transcript,
        aiResponse: memory.ai_response,
        timestamp: memory.created_at,
        audioUrl: memory.audio_url,
        emotionScore: 0,
      };
    } catch (supabaseError) {
      console.error("Supabase保存失败，回退到API:", supabaseError);
      
      // 如果Supabase保存失败，回退到API方式
      let audioUrl = null;
      
      // 1. 如果有音频，上传音频文件
      if (audioBlob) {
        const formData = new FormData();
        formData.append("audio", audioBlob);

        const audioResponse = await fetch("/api/audio", {
          method: "POST",
          body: formData,
        });

        if (!audioResponse.ok) {
          throw new Error("上传音频失败");
        }

        const audioData = await audioResponse.json();
        audioUrl = audioData.audioUrl;
      }

      // 2. 保存记忆
      const memoryResponse = await fetch("/api/memories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          aiResponse,
          audioUrl: audioUrl || "", // 确保audioUrl为空字符串而不是null
        }),
      });

      if (!memoryResponse.ok) {
        throw new Error("保存记忆失败");
      }

      const { memory } = await memoryResponse.json();

      return {
        id: memory.id,
        content: memory.content,
        aiResponse: memory.aiResponse,
        timestamp: memory.timestamp,
        audioUrl: memory.audioUrl,
        emotionScore: 0,
      };
    }
  } catch (error) {
    console.error("保存记忆错误:", error);
    throw error;
  }
}

// 获取用户所有记忆
export async function getUserMemories(userId: string): Promise<Memory[]> {
  try {
    // 尝试使用Supabase获取
    try {
      const supabaseMemories = await supabaseGetUserMemories(userId);
      
      // 转换为前端格式
      return supabaseMemories.map(memory => ({
        id: memory.id,
        content: memory.transcript,
        aiResponse: memory.ai_response,
        timestamp: memory.created_at,
        audioUrl: memory.audio_url,
        emotionScore: 0,
      }));
    } catch (supabaseError) {
      console.error("Supabase获取失败，回退到API:", supabaseError);
      
      // 如果Supabase获取失败，回退到API方式
      const response = await fetch("/api/memories");
      
      if (!response.ok) {
        throw new Error("获取记忆失败");
      }
      
      const { memories } = await response.json();
      
      return memories.map((memory: any) => ({
        id: memory.id,
        content: memory.content,
        aiResponse: memory.aiResponse,
        timestamp: memory.timestamp,
        audioUrl: memory.audioUrl,
        emotionScore: 0,
      }));
    }
  } catch (error) {
    console.error("获取记忆错误:", error);
    return [];
  }
}