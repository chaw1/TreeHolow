import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { auth } from "@clerk/nextjs";

// 积分存储目录
const POINTS_DIR = join(process.cwd(), "data", "points");

// 内存中临时存储积分 - 用于Vercel环境
const pointsStore = new Map<string, any>();

// 环境检测
const isVercelProduction = process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';

// 确保目录存在
async function ensureDirectoryExists(path: string) {
  if (!existsSync(path)) {
    try {
      await mkdir(path, { recursive: true });
    } catch (error) {
      console.warn(`无法创建目录: ${path}`, error);
      // 在生产环境中忽略错误，使用内存存储
    }
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
    
    // 在Vercel环境使用内存存储
    if (isVercelProduction) {
      // 获取或创建用户积分数据
      if (!pointsStore.has(userId)) {
        pointsStore.set(userId, { ...DEFAULT_POINTS_DATA });
      }
      
      const pointsData = pointsStore.get(userId);
      console.log(`[Vercel] 内存中读取积分: ${userId}`);
      
      return NextResponse.json(pointsData);
    }
    
    // 本地环境 - 文件系统存储
    try {
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
      
      console.log(`[本地] 文件中读取积分: ${userId}`);
      return NextResponse.json(pointsData);
    } catch (fsError) {
      console.error("文件系统读取失败，使用内存备份:", fsError);
      
      // 文件系统失败时，回退到内存存储
      if (!pointsStore.has(userId)) {
        pointsStore.set(userId, { ...DEFAULT_POINTS_DATA });
      }
      
      const pointsData = pointsStore.get(userId);
      return NextResponse.json(pointsData);
    }
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
    
    // 获取当前日期（不含时间）
    const today = new Date().toISOString().split('T')[0];
    
    // 在Vercel环境使用内存存储
    if (isVercelProduction) {
      // 获取或创建用户积分数据
      if (!pointsStore.has(userId)) {
        pointsStore.set(userId, { ...DEFAULT_POINTS_DATA });
      }
      
      let pointsData = pointsStore.get(userId);
      
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
      
      // 更新内存存储
      pointsStore.set(userId, pointsData);
      console.log(`[Vercel] 内存中更新积分: ${userId}, 签到成功, 连续${pointsData.checkInStreak}天`);
      
      return NextResponse.json({ 
        success: true, 
        points: pointsData.total,
        added: bonusPoints,
        checkInStreak: pointsData.checkInStreak,
        message: getLocalizedMessage(locale, pointsData.checkInStreak, bonusPoints)
      });
    }
    
    // 本地环境 - 文件系统存储
    try {
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
      
      // 同时更新内存备份，以便回退
      pointsStore.set(userId, pointsData);
      
      console.log(`[本地] 文件中更新积分: ${userId}, 签到成功, 连续${pointsData.checkInStreak}天`);
      
      return NextResponse.json({ 
        success: true, 
        points: pointsData.total,
        added: bonusPoints,
        checkInStreak: pointsData.checkInStreak,
        message: getLocalizedMessage(locale, pointsData.checkInStreak, bonusPoints)
      });
    } catch (fsError) {
      console.error("文件系统更新失败，使用内存备份:", fsError);
      
      // 文件系统失败时，回退到内存存储
      if (!pointsStore.has(userId)) {
        pointsStore.set(userId, { ...DEFAULT_POINTS_DATA });
      }
      
      let pointsData = pointsStore.get(userId);
      
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
      
      // 处理与上面相同的逻辑...
      let isConsecutive = false;
      if (pointsData.lastCheckIn) {
        const lastDate = new Date(pointsData.lastCheckIn);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        isConsecutive = lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];
      }
      
      if (isConsecutive) {
        pointsData.checkInStreak += 1;
      } else {
        pointsData.checkInStreak = 1;
      }
      
      let bonusPoints = 5;
      if (pointsData.checkInStreak >= 30) {
        bonusPoints += 15;
      } else if (pointsData.checkInStreak >= 15) {
        bonusPoints += 10;
      } else if (pointsData.checkInStreak >= 7) {
        bonusPoints += 5;
      } else if (pointsData.checkInStreak >= 3) {
        bonusPoints += 2;
      }
      
      pointsData.total += bonusPoints;
      pointsData.lastCheckIn = new Date().toISOString();
      
      pointsData.history.push({
        date: new Date().toISOString(),
        amount: bonusPoints,
        reason: getLocalizedCheckInReason(locale, pointsData.checkInStreak)
      });
      
      // 更新内存存储
      pointsStore.set(userId, pointsData);
      
      return NextResponse.json({ 
        success: true, 
        points: pointsData.total,
        added: bonusPoints,
        checkInStreak: pointsData.checkInStreak,
        message: getLocalizedMessage(locale, pointsData.checkInStreak, bonusPoints)
      });
    }
  } catch (error: any) {
    console.error("签到错误:", error);
    return NextResponse.json({ error: "签到失败", details: error?.message || "未知错误" }, { status: 500 });
  }
}