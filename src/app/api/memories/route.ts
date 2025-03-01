import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { DBMemory, Memory } from "@/types/memory";
import { unlockAchievement, updateAchievementProgress, addUserPoints } from "@/utils/supabaseAdmin";

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 将DB记录格式转换为前端格式
function transformMemory(memory: DBMemory): Memory {
  return {
    id: memory.id,
    content: memory.transcript,
    aiResponse: memory.ai_response,
    timestamp: memory.created_at,
    audioUrl: memory.audio_url,
    emotionScore: memory.emotion_score
  };
}

// 获取用户记忆
export async function GET(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 从Supabase获取记忆列表
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("获取记忆错误:", error);
      return NextResponse.json({ error: "获取记忆失败" }, { status: 500 });
    }

    // 转换格式并返回
    const memories = data.map(transformMemory);

    // 计算统计数据
    let totalWords = 0;
    let totalEmotionScore = 0;
    let emotionScoreCount = 0;

    memories.forEach(memory => {
      // 计算总字数
      totalWords += memory.content.trim().split(/\s+/).length;

      // 计算平均情绪分数
      if (memory.emotionScore !== undefined) {
        totalEmotionScore += memory.emotionScore;
        emotionScoreCount++;
      }
    });

    // 检查记忆相关成就
    if (memories.length > 0) {
      // 第一次对话
      await unlockAchievement(userId, "first_confession");

      // 累计10次对话
      if (memories.length >= 10) {
        await unlockAchievement(userId, "ten_confessions");
      } else {
        await updateAchievementProgress(userId, "ten_confessions", memories.length * 10);
      }

      // 累计1000字
      if (totalWords >= 1000) {
        await unlockAchievement(userId, "thousand_words");
      } else {
        await updateAchievementProgress(userId, "thousand_words", Math.min(totalWords / 10, 100));
      }

      // 情绪相关成就
      const positiveMemories = memories.filter(m => m.emotionScore !== undefined && m.emotionScore > 80);
      
      if (positiveMemories.length >= 5) {
        await unlockAchievement(userId, "positive_emotion");
      } else if (positiveMemories.length > 0) {
        await updateAchievementProgress(userId, "positive_emotion", positiveMemories.length * 20);
      }
    }

    // 返回记忆和统计信息
    return NextResponse.json({
      memories,
      stats: {
        totalInteractions: memories.length,
        totalWords,
        averageEmotionScore: emotionScoreCount > 0 ? totalEmotionScore / emotionScoreCount : 0
      }
    });
  } catch (error) {
    console.error("获取记忆错误:", error);
    return NextResponse.json({ error: "获取记忆失败" }, { status: 500 });
  }
}

// 添加新记忆
export async function POST(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 解析请求数据
    const { transcript, aiResponse, audioUrl, emotionScore } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
    }

    // 添加记忆到Supabase
    const { data, error } = await supabase
      .from("memories")
      .insert([
        {
          user_id: userId,
          transcript: transcript,
          ai_response: aiResponse || "",
          audio_url: audioUrl,
          emotion_score: emotionScore
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("添加记忆错误:", error);
      return NextResponse.json({ error: "添加记忆失败" }, { status: 500 });
    }

    // 为新记忆添加积分
    const basePoints = 5;
    await addUserPoints(userId, basePoints, 'memory', data.id, `分享新记忆: ${transcript.slice(0, 20)}...`);

    // 转换格式返回
    const memory = transformMemory(data as DBMemory);

    // 检查语音记忆成就
    if (audioUrl) {
      // 获取语音记忆总数
      const { count } = await supabase
        .from("memories")
        .select("id", { count: 'exact' })
        .eq("user_id", userId)
        .not("audio_url", "is", null);

      if (count && count >= 20) {
        await unlockAchievement(userId, "voice_diary");
      } else if (count) {
        await updateAchievementProgress(userId, "voice_diary", (count / 20) * 100);
      }
    }

    return NextResponse.json({
      success: true,
      memory,
      points: basePoints
    });
  } catch (error) {
    console.error("添加记忆错误:", error);
    return NextResponse.json({ error: "添加记忆失败" }, { status: 500 });
  }
}