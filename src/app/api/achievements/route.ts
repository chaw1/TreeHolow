import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { auth } from "@clerk/nextjs";
import { Achievement } from "@/types/memory";

// 内存存储，用于Vercel环境
const inMemoryAchievements: Record<string, Achievement[]> = {};

// 成就存储目录
const ACHIEVEMENT_DIR = join(process.cwd(), "data", "achievements");

// 确保目录存在
async function ensureDirectoryExists(path: string) {
  if (!existsSync(path)) {
    await mkdir(path, { recursive: true });
  }
  return path;
}

// 根据用户语言获取成就标题和描述
function getLocalizedAchievements(locale: string = 'zh'): Achievement[] {
  if (locale === 'en') {
    return [
      {
        id: "first_confession",
        title: "First Encounter",
        description: "First conversation with the tree hollow",
        icon: "🌱",
        condition: "Have your first tree hollow conversation",
        unlocked: false,
        category: "interaction",
        points: 10
      },
      {
        id: "three_day_streak",
        title: "Continuous Sharing",
        description: "Share your feelings for 3 consecutive days",
        icon: "🌿",
        condition: "Use the tree hollow for 3 consecutive days",
        unlocked: false,
        progress: 0,
        category: "streak",
        points: 30
      },
      {
        id: "ten_confessions",
        title: "Close Friend",
        description: "Cumulative 10 conversations",
        icon: "🌳",
        condition: "Have 10 cumulative conversations with the tree hollow",
        unlocked: false,
        progress: 0,
        category: "interaction",
        points: 50
      },
      {
        id: "thousand_words",
        title: "Soul Connection",
        description: "Share 1000 words cumulatively",
        icon: "📚",
        condition: "Share 1000 words of feelings cumulatively",
        unlocked: false,
        progress: 0,
        category: "interaction",
        points: 50
      },
      {
        id: "seven_day_checkin",
        title: "Persistence",
        description: "Check in for 7 consecutive days",
        icon: "📅",
        condition: "Log in and check in for 7 consecutive days",
        unlocked: false,
        progress: 0,
        category: "streak",
        points: 70
      },
      {
        id: "positive_emotion",
        title: "Positive Attitude",
        description: "5 positive emotional shares",
        icon: "☀️",
        condition: "Share 5 contents with emotion value >80",
        unlocked: false,
        progress: 0,
        category: "emotion",
        points: 40
      },
      {
        id: "emotional_growth",
        title: "Emotional Growth",
        description: "From low to high emotion value",
        icon: "📈",
        condition: "From emotion value <30 to >70",
        unlocked: false,
        category: "emotion",
        points: 60
      },
      {
        id: "voice_diary",
        title: "Voice Diary",
        description: "Record 20 voice memories",
        icon: "🎤",
        condition: "Record 20 voice memories",
        unlocked: false,
        progress: 0,
        category: "interaction",
        points: 80
      }
    ];
  } else if (locale === 'ja') {
    return [
      {
        id: "first_confession",
        title: "初めての出会い",
        description: "木のくぼみとの最初の会話",
        icon: "🌱",
        condition: "木のくぼみとの最初の会話を完了する",
        unlocked: false,
        category: "interaction",
        points: 10
      },
      {
        id: "three_day_streak",
        title: "継続的な共有",
        description: "3日間連続で気持ちを共有",
        icon: "🌿",
        condition: "3日間連続で木のくぼみを使用",
        unlocked: false,
        progress: 0,
        category: "streak",
        points: 30
      },
      {
        id: "ten_confessions",
        title: "親しい友達",
        description: "累計10回の会話",
        icon: "🌳",
        condition: "木のくぼみと累計10回会話する",
        unlocked: false,
        progress: 0,
        category: "interaction",
        points: 50
      },
      {
        id: "thousand_words",
        title: "心の繋がり",
        description: "累計1000文字を共有",
        icon: "📚",
        condition: "累計1000文字の気持ちを共有",
        unlocked: false,
        progress: 0,
        category: "interaction",
        points: 50
      },
      {
        id: "seven_day_checkin",
        title: "継続は力なり",
        description: "7日間連続でチェックイン",
        icon: "📅",
        condition: "7日間連続でログインしチェックインする",
        unlocked: false,
        progress: 0,
        category: "streak",
        points: 70
      },
      {
        id: "positive_emotion",
        title: "ポジティブな姿勢",
        description: "5回のポジティブな感情の共有",
        icon: "☀️",
        condition: "感情値>80のコンテンツを5回共有",
        unlocked: false,
        progress: 0,
        category: "emotion",
        points: 40
      },
      {
        id: "emotional_growth",
        title: "感情的成長",
        description: "低い感情値から高い感情値へ",
        icon: "📈",
        condition: "感情値<30から>70へ",
        unlocked: false,
        category: "emotion",
        points: 60
      },
      {
        id: "voice_diary",
        title: "音声日記",
        description: "20の音声記憶を記録",
        icon: "🎤",
        condition: "20の音声記憶を記録する",
        unlocked: false,
        progress: 0,
        category: "interaction",
        points: 80
      }
    ];
  } else {
    // 默认中文
    return [
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
  }
}

// 默认成就列表
const DEFAULT_ACHIEVEMENTS: Achievement[] = getLocalizedAchievements('zh');

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
    
    // 用户成就路径
    const userDir = await ensureDirectoryExists(join(ACHIEVEMENT_DIR, userId));
    const achievementsPath = join(userDir, "achievements.json");
    
    // 如果文件不存在，创建默认成就列表（根据用户语言）或使用内存中的数据
    if (!existsSync(achievementsPath)) {
      // 如果内存中有，使用内存中的数据
      if (inMemoryAchievements[userId]) {
        return NextResponse.json({ achievements: inMemoryAchievements[userId] });
      }
      
      // 否则创建新的成就列表
      const localizedAchievements = getLocalizedAchievements(locale);
      try {
        await writeFile(achievementsPath, JSON.stringify(localizedAchievements, null, 2));
      } catch (error) {
        console.log("写入新文件失败，使用内存:", error);
      }
      // 更新内存中的副本
      inMemoryAchievements[userId] = localizedAchievements;
      return NextResponse.json({ achievements: localizedAchievements });
    }
    
    // 读取成就（尝试从文件读取，失败则从内存读取或使用默认值）
    let achievements: Achievement[];
    try {
      const fileData = await readFile(achievementsPath, "utf-8");
      achievements = JSON.parse(fileData);
      // 同步更新内存缓存
      inMemoryAchievements[userId] = achievements;
    } catch (error) {
      console.log("从文件读取失败，尝试从内存获取:", error);
      // 从内存获取或使用默认值
      achievements = inMemoryAchievements[userId] || getLocalizedAchievements(locale);
    }
    
    // 检查是否需要更新成就的语言
    if (url.searchParams.has('updateLocale')) {
      const localizedAchievements = getLocalizedAchievements(locale);
      
      // 保留原有的解锁状态和进度，仅更新文本
      const updatedAchievements = achievements.map((achievement: Achievement, index: number) => {
        if (index < localizedAchievements.length) {
          return {
            ...localizedAchievements[index],
            unlocked: achievement.unlocked,
            progress: achievement.progress,
            dateUnlocked: achievement.dateUnlocked
          };
        }
        return achievement;
      });
      
      try {
        await writeFile(achievementsPath, JSON.stringify(updatedAchievements, null, 2));
      } catch (error) {
        console.log("写入文件失败，仅更新内存:", error);
      }
      // 无论文件写入是否成功，都更新内存
      inMemoryAchievements[userId] = updatedAchievements;
      return NextResponse.json({ achievements: updatedAchievements });
    }
    
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