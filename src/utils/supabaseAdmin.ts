import { createClient } from '@supabase/supabase-js';
import { Achievement } from '@/types/memory';
// 引入服务器端工具

// 使用服务角色密钥创建Supabase客户端，绕过RLS
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 获取或创建用户成就
export async function getOrInitUserAchievements(userId: string, locale: string = 'zh'): Promise<Achievement[]> {
  try {
    // 先检查用户是否已有成就
    const { data: existingAchievements, error } = await supabaseAdmin
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);
    
    // 如果有错误或没有找到成就，则为用户初始化成就
    if (error || !existingAchievements || existingAchievements.length === 0) {
      // 获取本地化的默认成就
      const defaultAchievements = getLocalizedAchievements(locale);
      
      // 准备插入数据
      const achievementsToInsert = defaultAchievements.map(achievement => ({
        user_id: userId,
        achievement_id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        condition: achievement.condition,
        category: achievement.category,
        points: achievement.points,
        unlocked: false,
        progress: 0
      }));
      
      // 批量插入成就
      const { data: newAchievements, error: insertError } = await supabaseAdmin
        .from('user_achievements')
        .insert(achievementsToInsert)
        .select();
      
      if (insertError) {
        console.error('初始化用户成就失败:', insertError);
        throw insertError;
      }
      
      // 转换格式返回
      return newAchievements.map(ach => ({
        id: ach.achievement_id,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        condition: ach.condition,
        category: ach.category as 'interaction' | 'emotion' | 'streak' | 'special',
        points: ach.points,
        unlocked: ach.unlocked,
        progress: ach.progress
      }));
    }
    
    // 转换现有成就格式返回
    return existingAchievements.map(ach => ({
      id: ach.achievement_id,
      title: ach.title,
      description: ach.description,
      icon: ach.icon,
      condition: ach.condition,
      category: ach.category as 'interaction' | 'emotion' | 'streak' | 'special',
      points: ach.points,
      unlocked: ach.unlocked,
      progress: ach.progress,
      dateUnlocked: ach.date_unlocked
    }));
  } catch (error) {
    console.error('获取用户成就错误:', error);
    throw error;
  }
}

// 更新用户成就语言
export async function updateUserAchievementsLocale(userId: string, locale: string): Promise<Achievement[]> {
  try {
    // 获取现有成就
    const { data: existingAchievements, error } = await supabaseAdmin
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('获取成就失败:', error);
      throw error;
    }
    
    // 获取本地化的成就信息
    const localizedAchievements = getLocalizedAchievements(locale);
    
    // 没有成就时直接初始化
    if (!existingAchievements || existingAchievements.length === 0) {
      return getOrInitUserAchievements(userId, locale);
    }
    
    // 准备更新数据，保留解锁状态和进度
    const updates = existingAchievements.map(achievement => {
      // 找到对应的本地化成就
      const localizedAchievement = localizedAchievements.find(a => a.id === achievement.achievement_id);
      if (!localizedAchievement) return null;
      
      return {
        id: achievement.id,
        title: localizedAchievement.title,
        description: localizedAchievement.description,
        condition: localizedAchievement.condition
      };
    }).filter(Boolean);
    
    // 执行批量更新
    for (const update of updates) {
      if (!update) continue;
      
      const { error: updateError } = await supabaseAdmin
        .from('user_achievements')
        .update({
          title: update.title,
          description: update.description,
          condition: update.condition
        })
        .eq('id', update.id);
      
      if (updateError) {
        console.error('更新成就语言失败:', updateError);
      }
    }
    
    // 重新获取更新后的成就
    return getOrInitUserAchievements(userId, locale);
  } catch (error) {
    console.error('更新成就语言错误:', error);
    throw error;
  }
}

// 解锁成就
export async function unlockAchievement(userId: string, achievementId: string): Promise<{success: boolean, points: number}> {
  try {
    // 查找对应的成就
    const { data: achievements, error } = await supabaseAdmin
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .limit(1);
    
    if (error || !achievements || achievements.length === 0) {
      console.error('未找到成就:', error);
      throw new Error('成就不存在');
    }
    
    const achievement = achievements[0];
    
    // 如果已经解锁，直接返回
    if (achievement.unlocked) {
      return { success: true, points: 0 };
    }
    
    // 更新成就状态
    const { error: updateError } = await supabaseAdmin
      .from('user_achievements')
      .update({
        unlocked: true,
        progress: 100,
        date_unlocked: new Date().toISOString()
      })
      .eq('id', achievement.id);
    
    if (updateError) {
      console.error('解锁成就失败:', updateError);
      throw updateError;
    }
    
    // 添加积分记录
    await addUserPoints(userId, achievement.points, 'achievement', achievement.achievement_id, `解锁成就: ${achievement.title}`);
    
    return { success: true, points: achievement.points };
  } catch (error) {
    console.error('解锁成就错误:', error);
    throw error;
  }
}

// 更新成就进度
export async function updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<{success: boolean, unlocked: boolean, points: number}> {
  try {
    // 查找对应的成就
    const { data: achievements, error } = await supabaseAdmin
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .limit(1);
    
    if (error || !achievements || achievements.length === 0) {
      console.error('未找到成就:', error);
      throw new Error('成就不存在');
    }
    
    const achievement = achievements[0];
    
    // 如果已经解锁，只更新进度不增加积分
    if (achievement.unlocked) {
      const { error: updateError } = await supabaseAdmin
        .from('user_achievements')
        .update({ progress })
        .eq('id', achievement.id);
      
      if (updateError) {
        console.error('更新成就进度失败:', updateError);
        throw updateError;
      }
      
      return { success: true, unlocked: true, points: 0 };
    }
    
    // 更新进度，如果达到100则解锁
    const unlocked = progress >= 100;
    const updateData: any = { progress };
    
    if (unlocked) {
      updateData.unlocked = true;
      updateData.date_unlocked = new Date().toISOString();
    }
    
    const { error: updateError } = await supabaseAdmin
      .from('user_achievements')
      .update(updateData)
      .eq('id', achievement.id);
    
    if (updateError) {
      console.error('更新成就进度失败:', updateError);
      throw updateError;
    }
    
    // 如果解锁，添加积分
    if (unlocked) {
      await addUserPoints(userId, achievement.points, 'achievement', achievement.achievement_id, `解锁成就: ${achievement.title}`);
      return { success: true, unlocked: true, points: achievement.points };
    }
    
    return { success: true, unlocked: false, points: 0 };
  } catch (error) {
    console.error('更新成就进度错误:', error);
    throw error;
  }
}

// 获取用户积分
export async function getUserPoints(userId: string): Promise<{totalPoints: number, lastCheckin: string | null, checkinStreak: number}> {
  try {
    // 查询用户积分
    const { data: points, error } = await supabaseAdmin
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .limit(1);
    
    // 如果没有记录，创建新的
    if (error || !points || points.length === 0) {
      const { data: newPoints, error: insertError } = await supabaseAdmin
        .from('user_points')
        .upsert([{ 
          user_id: userId, 
          total_points: 0, 
          checkin_streak: 0,
          // 确保创建时不会有null值导致的问题
          last_checkin: null
        }], { onConflict: 'user_id' })
        .select()
        .single();
      
      if (insertError) {
        console.error('创建用户积分记录失败:', insertError);
        throw insertError;
      }
      
      return {
        totalPoints: 0,
        lastCheckin: null,
        checkinStreak: 0
      };
    }
    
    // 返回现有积分信息
    return {
      totalPoints: points[0].total_points,
      lastCheckin: points[0].last_checkin,
      checkinStreak: points[0].checkin_streak
    };
  } catch (error) {
    console.error('获取用户积分错误:', error);
    throw error;
  }
}

// 添加用户积分
export async function addUserPoints(userId: string, points: number, source: string, sourceId?: string, description?: string): Promise<{success: boolean, totalPoints: number}> {
  try {
    // 获取当前积分
    const currentPoints = await getUserPoints(userId);
    const newTotal = currentPoints.totalPoints + points;
    
    // 更新总积分 - 确保保留其他字段原有值
    const { error: updateError } = await supabaseAdmin
      .from('user_points')
      .upsert([
        {
          user_id: userId,
          total_points: newTotal,
          // 保留原有的最后签到日期和连续签到天数
          last_checkin: currentPoints.lastCheckin,
          checkin_streak: currentPoints.checkinStreak
        }
      ], { onConflict: 'user_id' });
    
    if (updateError) {
      console.error('更新用户积分失败:', updateError);
      throw updateError;
    }
    
    // 添加积分历史记录
    const { error: historyError } = await supabaseAdmin
      .from('points_history')
      .insert([
        {
          user_id: userId,
          points,
          source,
          source_id: sourceId,
          description
        }
      ]);
    
    if (historyError) {
      console.error('添加积分历史记录失败:', historyError);
      // 不抛出错误，继续执行
    }
    
    return { success: true, totalPoints: newTotal };
  } catch (error) {
    console.error('添加积分错误:', error);
    throw error;
  }
}

// 用户签到
export async function userCheckin(userId: string): Promise<{success: boolean, points: number, streak: number}> {
  try {
    // 获取当前积分和上次签到信息
    const { totalPoints, lastCheckin, checkinStreak } = await getUserPoints(userId);
    
    // 检查是否已经今天签到过
    const now = new Date();
    // 获取当前日期的年月日（不含时间）字符串格式 YYYY-MM-DD
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    if (lastCheckin) {
      const lastCheckinDate = new Date(lastCheckin);
      // 同样格式化上次签到的日期为 YYYY-MM-DD
      const lastCheckinDay = `${lastCheckinDate.getFullYear()}-${String(lastCheckinDate.getMonth() + 1).padStart(2, '0')}-${String(lastCheckinDate.getDate()).padStart(2, '0')}`;
      
      if (lastCheckinDay === today) {
        return { success: false, points: 0, streak: checkinStreak };
      }
    }
    
    // 检查连续签到
    let newStreak = checkinStreak;
    
    if (lastCheckin) {
      const lastCheckinDate = new Date(lastCheckin);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      
      const lastCheckinDay = new Date(lastCheckinDate.getFullYear(), lastCheckinDate.getMonth(), lastCheckinDate.getDate());
      
      // 使用相同的格式化函数来比较日期
      const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
      const lastCheckinStr = `${lastCheckinDay.getFullYear()}-${String(lastCheckinDay.getMonth() + 1).padStart(2, '0')}-${String(lastCheckinDay.getDate()).padStart(2, '0')}`;
      
      // 如果上次签到是昨天，连续签到天数+1，否则重置为1
      if (lastCheckinStr === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    } else {
      // 首次签到
      newStreak = 1;
    }
    
    // 计算积分奖励 (基础分5分，连续签到每天+1，最多15分)
    const basePoints = 5;
    const streakBonus = Math.min(newStreak - 1, 10); // 最多+10分
    const pointsEarned = basePoints + streakBonus;
    
    // 更新签到信息，明确指定冲突键以防止创建多条记录
    const { error: updateError } = await supabaseAdmin
      .from('user_points')
      .upsert([
        {
          user_id: userId,
          total_points: totalPoints + pointsEarned,
          last_checkin: now.toISOString(),
          checkin_streak: newStreak
        }
      ], { onConflict: 'user_id' });
    
    if (updateError) {
      console.error('更新签到信息失败:', updateError);
      throw updateError;
    }
    
    // 添加积分历史
    await addUserPoints(
      userId, 
      pointsEarned, 
      'checkin', 
      undefined, 
      `第${newStreak}天连续签到 (+${basePoints}基础分,+${streakBonus}连续签到奖励)`
    );
    
    return { success: true, points: pointsEarned, streak: newStreak };
  } catch (error) {
    console.error('签到错误:', error);
    throw error;
  }
}

// 本地化成就列表 (从原有的route.ts复制)
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