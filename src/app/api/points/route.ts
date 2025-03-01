import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getUserPoints, addUserPoints, userCheckin } from "@/utils/supabaseAdmin";

// 获取用户积分
export async function GET(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    
    // 使用Supabase获取用户积分
    const pointsInfo = await getUserPoints(userId);
    
    return NextResponse.json({
      totalPoints: pointsInfo.totalPoints,
      lastCheckin: pointsInfo.lastCheckin,
      checkinStreak: pointsInfo.checkinStreak
    });
  } catch (error: any) {
    console.error("获取积分错误:", error);
    return NextResponse.json({ error: "获取积分失败", details: error?.message || "未知错误" }, { status: 500 });
  }
}

// 添加积分
export async function POST(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 解析请求数据
    const { amount, source, sourceId, reason } = await request.json();
    
    if (typeof amount !== 'number') {
      return NextResponse.json({ error: "积分数量必须是数字" }, { status: 400 });
    }
    
    // 使用Supabase添加积分
    const result = await addUserPoints(userId, amount, source || 'manual', sourceId, reason);
    
    return NextResponse.json({ 
      success: result.success, 
      totalPoints: result.totalPoints
    });
    
  } catch (error) {
    console.error("添加积分错误:", error);
    return NextResponse.json({ error: "添加积分失败" }, { status: 500 });
  }
}

// 签到
export async function PUT(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    
    // 使用Supabase进行签到
    const result = await userCheckin(userId);
    
    if (!result.success) {
      return NextResponse.json({ 
        success: false,
        message: "今日已签到",
        points: 0,
        streak: result.streak
      });
    }
    
    return NextResponse.json({ 
      success: true,
      points: result.points,
      streak: result.streak,
      message: `连续签到${result.streak}天，获得${result.points}积分！`
    });
    
  } catch (error: any) {
    console.error("签到错误:", error);
    return NextResponse.json({ error: "签到失败", details: error?.message || "未知错误" }, { status: 500 });
  }
}