import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { auth } from "@clerk/nextjs";

// 积分存储目录
const POINTS_DIR = join(process.cwd(), "data", "points");

// 确保目录存在
async function ensureDirectoryExists(path: string) {
  if (!existsSync(path)) {
    await mkdir(path, { recursive: true });
  }
  return path;
}

// 积分数据结构
interface PointsData {
  total: number;             // 总积分
  lastCheckIn?: string;      // 上次签到日期
  checkInStreak: number;     // 连续签到天数
  history: {                 // 积分历史记录
    date: string;
    amount: number;
    reason: string;
  }[];
}

// 默认积分数据
const DEFAULT_POINTS_DATA: PointsData = {
  total: 0,
  checkInStreak: 0,
  history: []
};

// 获取用户积分
export async function GET(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    
    // 用户积分路径
    const userDir = await ensureDirectoryExists(join(POINTS_DIR, userId));
    const pointsPath = join(userDir, "points.json");
    
    // 如果文件不存在，创建默认积分数据
    if (!existsSync(pointsPath)) {
      await writeFile(pointsPath, JSON.stringify(DEFAULT_POINTS_DATA, null, 2));
      return NextResponse.json(DEFAULT_POINTS_DATA);
    }
    
    // 读取积分数据
    const fileData = await readFile(pointsPath, "utf-8");
    const pointsData = JSON.parse(fileData);
    
    return NextResponse.json(pointsData);
    
  } catch (error) {
    console.error("获取积分错误:", error);
    return NextResponse.json({ error: "获取积分失败" }, { status: 500 });
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
    const { amount, reason } = await request.json();
    
    if (typeof amount !== 'number') {
      return NextResponse.json({ error: "积分数量必须是数字" }, { status: 400 });
    }
    
    // 确保用户目录存在
    const userDir = await ensureDirectoryExists(join(POINTS_DIR, userId));
    const pointsPath = join(userDir, "points.json");
    
    // 读取现有积分数据
    let pointsData: PointsData;
    
    if (existsSync(pointsPath)) {
      const fileData = await readFile(pointsPath, "utf-8");
      pointsData = JSON.parse(fileData);
    } else {
      pointsData = { ...DEFAULT_POINTS_DATA };
    }
    
    // 更新积分
    pointsData.total += amount;
    
    // 添加历史记录
    pointsData.history.push({
      date: new Date().toISOString(),
      amount,
      reason: reason || "未指定原因"
    });
    
    // 保存更新后的积分数据
    await writeFile(pointsPath, JSON.stringify(pointsData, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      points: pointsData.total,
      added: amount
    });
    
  } catch (error) {
    console.error("添加积分错误:", error);
    return NextResponse.json({ error: "添加积分失败" }, { status: 500 });
  }
}

// 生成本地化消息
function getLocalizedMessage(locale: string, checkInStreak: number, bonusPoints: number): string {
  if (locale === 'en') {
    return `Checked in for ${checkInStreak} consecutive days, earned ${bonusPoints} points!`;
  } else if (locale === 'ja') {
    return `${checkInStreak}日連続でチェックインしました、${bonusPoints}ポイント獲得しました！`;
  } else {
    return `连续签到${checkInStreak}天，获得${bonusPoints}积分！`;
  }
}

// 生成本地化签到记录原因
function getLocalizedCheckInReason(locale: string, checkInStreak: number): string {
  if (locale === 'en') {
    return `Day ${checkInStreak} check-in`;
  } else if (locale === 'ja') {
    return `${checkInStreak}日目のチェックイン`;
  } else {
    return `第${checkInStreak}天签到`;
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
    
    // 获取语言偏好
    const url = new URL(request.url);
    const locale = url.searchParams.get('locale') || 'zh';
    
    // 确保用户目录存在
    const userDir = await ensureDirectoryExists(join(POINTS_DIR, userId));
    const pointsPath = join(userDir, "points.json");
    
    // 读取现有积分数据
    let pointsData: PointsData;
    
    if (existsSync(pointsPath)) {
      const fileData = await readFile(pointsPath, "utf-8");
      pointsData = JSON.parse(fileData);
    } else {
      pointsData = { ...DEFAULT_POINTS_DATA };
    }
    
    // 获取当前日期（不含时间）
    const today = new Date().toISOString().split('T')[0];
    
    // 检查是否已经签到
    if (pointsData.lastCheckIn && pointsData.lastCheckIn.split('T')[0] === today) {
      const message = locale === 'en' ? 'Already checked in today' 
                    : locale === 'ja' ? '今日はすでにチェックイン済みです' 
                    : '今日已签到';
      
      return NextResponse.json({ 
        success: false, 
        message,
        points: pointsData.total,
        checkInStreak: pointsData.checkInStreak
      });
    }
    
    // 检查是否连续签到
    let isConsecutive = false;
    if (pointsData.lastCheckIn) {
      const lastDate = new Date(pointsData.lastCheckIn);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      isConsecutive = lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];
    }
    
    // 更新连续签到天数
    if (isConsecutive) {
      pointsData.checkInStreak += 1;
    } else {
      pointsData.checkInStreak = 1;
    }
    
    // 计算签到奖励积分（基础5分 + 连续签到额外奖励）
    let bonusPoints = 5;
    
    // 连续签到额外奖励
    if (pointsData.checkInStreak >= 30) {
      bonusPoints += 15;  // 连续30天以上
    } else if (pointsData.checkInStreak >= 15) {
      bonusPoints += 10;  // 连续15-29天
    } else if (pointsData.checkInStreak >= 7) {
      bonusPoints += 5;   // 连续7-14天
    } else if (pointsData.checkInStreak >= 3) {
      bonusPoints += 2;   // 连续3-6天
    }
    
    // 更新积分
    pointsData.total += bonusPoints;
    pointsData.lastCheckIn = new Date().toISOString();
    
    // 添加历史记录
    pointsData.history.push({
      date: new Date().toISOString(),
      amount: bonusPoints,
      reason: getLocalizedCheckInReason(locale, pointsData.checkInStreak)
    });
    
    // 保存更新后的积分数据
    await writeFile(pointsPath, JSON.stringify(pointsData, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      points: pointsData.total,
      added: bonusPoints,
      checkInStreak: pointsData.checkInStreak,
      message: getLocalizedMessage(locale, pointsData.checkInStreak, bonusPoints)
    });
    
  } catch (error) {
    console.error("签到错误:", error);
    return NextResponse.json({ error: "签到失败" }, { status: 500 });
  }
}