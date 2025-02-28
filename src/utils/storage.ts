// src/utils/storage.ts
import { Memory } from "@/types/memory";

// 保存记忆到本地存储
export async function saveMemory(
  userId: string,
  audioBlob: Blob | null,
  transcript: string,
  aiResponse: string
): Promise<Memory> {
  try {
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
  } catch (error) {
    console.error("保存记忆错误:", error);
    throw error;
  }
}

// 获取用户所有记忆
export async function getUserMemories(userId: string): Promise<Memory[]> {
  try {
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
  } catch (error) {
    console.error("获取记忆错误:", error);
    return [];
  }
}