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

// 使用服务角色密钥创建Supabase管理客户端，绕过RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 将DB记录格式转换为前端格式，并生成签名URL
async function transformMemory(memory: DBMemory): Promise<Memory> {
  // 处理音频URL，生成带签名的临时URL
  let audioUrl = memory.audio_url;
  console.log("原始音频URL:", audioUrl);
  
  if (audioUrl && !audioUrl.includes('://')) {
    // 检查audio_url格式，根据格式修正
    // 情况1：完整路径（user_id/filename.webm）
    // 情况2：仅文件名（filename.webm）
    // 情况3：public/audio/路径（需要修正为格式1）
    
    let filePath = audioUrl;
    
    // 处理public/audio路径
    if (audioUrl.includes('public/audio/')) {
      filePath = audioUrl.replace('public/audio/', '');
    }
    
    // 确保包含用户ID路径
    if (!filePath.includes('/')) {
      filePath = `${memory.user_id}/${filePath}`;
    }
    
    console.log("处理后的音频文件路径:", filePath);
    
    try {
      // 尝试使用服务角色密钥创建的客户端，绕过RLS
      const adminClient = supabaseAdmin || supabase;
      
      // 生成有时间限制的签名URL（3600秒 = 1小时）
      const { data, error } = await adminClient.storage
        .from('audio-memories')
        .createSignedUrl(filePath, 3600);
        
      console.log("签名URL生成结果:", { data, error });

      // 确保类型兼容性，如果没有signedUrl则保持原有URL
      if (data?.signedUrl) {
        audioUrl = data.signedUrl;
        console.log("成功生成签名URL:", audioUrl);
      } else if (error) {
        console.error("签名URL生成错误:", error);
        // 尝试直接使用公共URL
        audioUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio-memories/${filePath}?download=true`;
        console.log("生成失败，尝试公共URL:", audioUrl);
      }
    } catch(err) {
      console.error("获取签名URL失败:", err);
      // 如果无法获取签名URL，回退到公共URL
      const fallbackUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio-memories/${filePath}?download=true`;
      console.log("回退到公共URL:", fallbackUrl);
      audioUrl = fallbackUrl;
    }
  }

  return {
    id: memory.id,
    content: memory.transcript,
    aiResponse: memory.ai_response,
    timestamp: memory.created_at,
    audioUrl: audioUrl,
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

    // 转换格式并返回 - 注意这里需要等待Promise完成
    const memoriesPromises = data.map(memory => transformMemory(memory));
    const memories = await Promise.all(memoriesPromises);

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

    // 转换格式返回 - 注意这里需要等待Promise完成
    const memory = await transformMemory(data as DBMemory);

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