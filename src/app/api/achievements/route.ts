import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { Achievement } from "@/types/memory";
import { 
  getOrInitUserAchievements, 
  updateUserAchievementsLocale,
  unlockAchievement,
  updateAchievementProgress,
  getUserPoints,
  userCheckin
} from "@/utils/supabaseAdmin";

// 获取用户成就
export async function GET(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    
    // 获取用户首选语言
    const url = new URL(request.url);
    const locale = url.searchParams.get('locale') || 'zh';
    
    // 检查是否需要更新成就的语言
    if (url.searchParams.has('updateLocale')) {
      // 更新用户成就语言
      const achievements = await updateUserAchievementsLocale(userId, locale);
      return NextResponse.json({ achievements });
    }
    
    // 获取或初始化用户成就
    const achievements = await getOrInitUserAchievements(userId, locale);
    
    // 获取用户积分信息
    const pointsInfo = await getUserPoints(userId);
    
    return NextResponse.json({ 
      achievements,
      points: pointsInfo.totalPoints,
      checkinStreak: pointsInfo.checkinStreak,
      lastCheckin: pointsInfo.lastCheckin
    });
    
  } catch (error) {
    console.error("获取成就错误:", error);
    // 提供更详细的错误信息，帮助调试
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: "获取成就失败", 
      details: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// 解锁成就
export async function POST(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 解析请求数据
    const { achievementId } = await request.json();
    
    if (!achievementId) {
      return NextResponse.json({ error: "成就ID不能为空" }, { status: 400 });
    }
    
    // 使用Supabase解锁成就
    const result = await unlockAchievement(userId, achievementId);
    
    return NextResponse.json({ 
      success: result.success, 
      points: result.points
    });
    
  } catch (error) {
    console.error("更新成就错误:", error);
    return NextResponse.json({ error: "更新成就失败" }, { status: 500 });
  }
}

// 更新成就进度
export async function PUT(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 解析请求数据
    const { achievementId, progress } = await request.json();
    
    if (!achievementId) {
      return NextResponse.json({ error: "成就ID不能为空" }, { status: 400 });
    }
    
    // 使用Supabase更新成就进度
    const result = await updateAchievementProgress(userId, achievementId, progress);
    
    return NextResponse.json({ 
      success: result.success,
      unlocked: result.unlocked,
      points: result.points
    });
    
  } catch (error) {
    console.error("更新成就进度错误:", error);
    return NextResponse.json({ error: "更新成就进度失败" }, { status: 500 });
  }
}