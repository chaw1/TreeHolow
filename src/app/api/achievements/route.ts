import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { auth } from "@clerk/nextjs";
import { Achievement } from "@/types/memory";

// 成就存储目录
const ACHIEVEMENT_DIR = join(process.cwd(), "data", "achievements");

// 确保目录存在
async function ensureDirectoryExists(path: string) {
  if (!existsSync(path)) {
    await mkdir(path, { recursive: true });
  }
  return path;
}

// 默认成就列表
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_confession",
    title: "初次相遇",
    description: "第一次与树洞对话",
    icon: "🌱",
    condition: "进行第一次树洞对话",
    unlocked: false,
    category: "interaction",
    points: 10
  },
  {
    id: "three_day_streak",
    title: "持续倾诉",
    description: "连续3天分享心情",
    icon: "🌿",
    condition: "连续3天使用树洞",
    unlocked: false,
    progress: 0,
    category: "streak",
    points: 30
  },
  {
    id: "ten_confessions",
    title: "知心好友",
    description: "累计对话10次",
    icon: "🌳",
    condition: "与树洞累计对话10次",
    unlocked: false,
    progress: 0,
    category: "interaction",
    points: 50
  },
  {
    id: "thousand_words",
    title: "心灵默契",
    description: "累计分享1000字",
    icon: "📚",
    condition: "累计分享1000字的心情",
    unlocked: false,
    progress: 0,
    category: "interaction",
    points: 50
  },
  {
    id: "seven_day_checkin",
    title: "坚持不懈",
    description: "连续签到7天",
    icon: "📅",
    condition: "连续7天登录并签到",
    unlocked: false,
    progress: 0,
    category: "streak",
    points: 70
  },
  {
    id: "positive_emotion",
    title: "阳光心态",
    description: "5次积极情绪分享",
    icon: "☀️",
    condition: "分享5次情绪值>80的内容",
    unlocked: false,
    progress: 0,
    category: "emotion",
    points: 40
  },
  {
    id: "emotional_growth",
    title: "情绪成长",
    description: "从低情绪值到高情绪值",
    icon: "📈",
    condition: "从情绪值<30提升到>70",
    unlocked: false,
    category: "emotion",
    points: 60
  },
  {
    id: "voice_diary",
    title: "声音日记",
    description: "记录20条语音记忆",
    icon: "🎤",
    condition: "录制20条语音记忆",
    unlocked: false,
    progress: 0,
    category: "interaction",
    points: 80
  }
];

// 获取用户成就
export async function GET(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    
    // 用户成就路径
    const userDir = await ensureDirectoryExists(join(ACHIEVEMENT_DIR, userId));
    const achievementsPath = join(userDir, "achievements.json");
    
    // 如果文件不存在，创建默认成就列表
    if (!existsSync(achievementsPath)) {
      await writeFile(achievementsPath, JSON.stringify(DEFAULT_ACHIEVEMENTS, null, 2));
      return NextResponse.json({ achievements: DEFAULT_ACHIEVEMENTS });
    }
    
    // 读取成就
    const fileData = await readFile(achievementsPath, "utf-8");
    const achievements = JSON.parse(fileData);
    
    return NextResponse.json({ achievements });
    
  } catch (error) {
    console.error("获取成就错误:", error);
    return NextResponse.json({ error: "获取成就失败" }, { status: 500 });
  }
}

// 更新成就状态
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
    
    // 确保用户目录存在
    const userDir = await ensureDirectoryExists(join(ACHIEVEMENT_DIR, userId));
    const achievementsPath = join(userDir, "achievements.json");
    
    // 读取现有成就
    let achievements: Achievement[] = [];
    
    if (existsSync(achievementsPath)) {
      const fileData = await readFile(achievementsPath, "utf-8");
      achievements = JSON.parse(fileData);
    } else {
      achievements = [...DEFAULT_ACHIEVEMENTS];
    }
    
    // 更新指定成就的状态
    const achievementIndex = achievements.findIndex(a => a.id === achievementId);
    
    if (achievementIndex === -1) {
      return NextResponse.json({ error: "成就不存在" }, { status: 400 });
    }
    
    // 解锁成就
    achievements[achievementIndex].unlocked = true;
    achievements[achievementIndex].dateUnlocked = new Date().toISOString();
    achievements[achievementIndex].progress = 100;
    
    // 保存更新后的成就
    await writeFile(achievementsPath, JSON.stringify(achievements, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      achievement: achievements[achievementIndex],
      points: achievements[achievementIndex].points
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
    
    // 确保用户目录存在
    const userDir = await ensureDirectoryExists(join(ACHIEVEMENT_DIR, userId));
    const achievementsPath = join(userDir, "achievements.json");
    
    // 读取现有成就
    let achievements: Achievement[] = [];
    
    if (existsSync(achievementsPath)) {
      const fileData = await readFile(achievementsPath, "utf-8");
      achievements = JSON.parse(fileData);
    } else {
      achievements = [...DEFAULT_ACHIEVEMENTS];
    }
    
    // 更新指定成就的进度
    const achievementIndex = achievements.findIndex(a => a.id === achievementId);
    
    if (achievementIndex === -1) {
      return NextResponse.json({ error: "成就不存在" }, { status: 400 });
    }
    
    // 更新进度
    achievements[achievementIndex].progress = progress;
    
    // 如果进度达到100%，解锁成就
    if (progress >= 100 && !achievements[achievementIndex].unlocked) {
      achievements[achievementIndex].unlocked = true;
      achievements[achievementIndex].dateUnlocked = new Date().toISOString();
    }
    
    // 保存更新后的成就
    await writeFile(achievementsPath, JSON.stringify(achievements, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      achievement: achievements[achievementIndex]
    });
    
  } catch (error) {
    console.error("更新成就进度错误:", error);
    return NextResponse.json({ error: "更新成就进度失败" }, { status: 500 });
  }
}