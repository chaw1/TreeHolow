// src/app/memories/page.tsx 顶部导入部分
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserMemories } from '@/utils/storage';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS, ja } from 'date-fns/locale';
import { Memory, Stats, DBMemory } from '@/types/memory';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MemoriesPage() {
  const { user } = useUser();
  const { t, currentLocale } = useLanguage();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState('memories'); // 'memories' | 'stats'
  const [isLoading, setIsLoading] = useState(true);
  
  // 获取适当的日期-时间本地化设置
  const getDateLocale = () => {
    switch (currentLocale) {
      case 'en': return enUS;
      case 'ja': return ja;
      case 'zh': 
      default:
        return zhCN;
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const data = await getUserMemories(user.id);

        // 数据已经格式化，直接使用
        const formattedMemories = data;

        setMemories(formattedMemories);

        // 计算统计数据
        const stats: Stats = {
          totalInteractions: data.length,
          averageEmotionScore: 0,
          streakDays: calculateStreakDays(data),
          totalWords: data.reduce((sum, m) => sum + (m.content?.split(/\s+/).length || 0), 0),
          points: 0,
          checkInStreak: 0
        };

        setStats(stats);
      } catch (error) {
        console.error('Error loading memories:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user]);

  function calculateStreakDays(memories: Memory[]): number {
    if (memories.length === 0) return 0;

    // 将原来的展开运算符改为使用 Array.from
    const dates = Array.from(new Set(memories.map(m =>
      new Date(m.timestamp).toDateString()
    )));

    let streak = 1;
    const today = new Date().toDateString();
    const lastInteraction = new Date(dates[dates.length - 1]).toDateString();

    if (lastInteraction !== today) return 0;

    for (let i = dates.length - 2; i >= 0; i--) {
      const current = new Date(dates[i]);
      const next = new Date(dates[i + 1]);
      const diffDays = (next.getTime() - current.getTime()) / (1000 * 3600 * 24);

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.memories.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{t.memories.subtitle}</p>
      </div>

      {/* 标签切换 */}
      <div className="flex space-x-4 mb-8 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`pb-2 px-4 ${
            activeTab === 'memories'
              ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('memories')}
        >
          {t.memories.tabs.memories}
        </button>
        <button
          className={`pb-2 px-4 ${
            activeTab === 'stats'
              ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          {t.memories.tabs.stats}
        </button>
      </div>

      {activeTab === 'memories' ? (
        // 记忆列表
        <div className="space-y-6">
          {memories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">{t.memories.empty}</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">{t.memories.emptyAction}</p>
            </div>
          ) : (
            memories.map((memory) => (
              <div
                key={memory.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(memory.timestamp), {
                      addSuffix: true,
                      locale: getDateLocale()
                    })}
                  </div>
                  {memory.emotionScore && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t.memories.stats.emotions}: {memory.emotionScore}
                    </div>
                  )}
                </div>

                {memory.audioUrl && (
                  <div>
                    <audio 
                      controls 
                      src={memory.audioUrl} 
                      className="w-full mb-4" 
                      onError={(e) => {
                        // 捕获错误时尝试不同路径格式
                        console.error("音频加载失败:", e);
                        const audioElem = e.currentTarget as HTMLAudioElement;
                        
                        // 尝试直接构建Supabase URL
                        if (!audioElem.src.includes('?') && memory.audioUrl) {
                          // 解析音频文件名
                          const audioUrl = memory.audioUrl || '';
                          const urlParts = audioUrl.split('/');
                          const fileName = urlParts.length > 0 ? urlParts[urlParts.length - 1] : 'audio.webm';
                          const userId = urlParts.length > 1 ? urlParts[urlParts.length - 2] : 'user_id';
                          
                          // 获取Supabase URL (从环境变量或回退到固定地址)
                          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yrxaptqcmatxtabjctfw.supabase.co';
                          
                          // 直接构建公共URL作为备用 - 使用Supabase公共存储URL
                          audioElem.src = `${supabaseUrl}/storage/v1/object/public/audio-memories/${userId}/${fileName}?download=true`;
                          
                          console.log("尝试使用备用URL:", audioElem.src);
                        }
                      }}
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{memory.content}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <p className="text-indigo-700">{memory.aiResponse}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // 统计信息
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 总体概况 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">{t.memories.stats.overview}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">{t.memories.stats.confessions}</span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stats?.totalInteractions || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">{t.memories.stats.words}</span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stats?.totalWords || 0} {currentLocale === 'zh' ? '字' : ''}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">{t.memories.stats.emotions}</span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.round(stats?.averageEmotionScore || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* 成就展示 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">{t.memories.stats.achievements}</h3>
            <div className="grid grid-cols-2 gap-4">
              <Achievement
                title="初次相遇"
                description="第一次与树洞对话"
                achieved={stats?.totalInteractions! > 0}
              />
              <Achievement
                title="持续倾诉"
                description="连续3天分享心情"
                achieved={stats?.streakDays! >= 3}
              />
              <Achievement
                title="知心好友"
                description="累计对话10次"
                achieved={stats?.totalInteractions! >= 10}
              />
              <Achievement
                title="心灵默契"
                description="累计分享1000字"
                achieved={stats?.totalWords! >= 1000}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Achievement({
  title,
  description,
  achieved
}: {
  title: string;
  description: string;
  achieved: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg border ${
      achieved 
        ? 'border-indigo-200 bg-indigo-50' 
        : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center space-x-2">
        {achieved ? (
          <span className="text-2xl">🌟</span>
        ) : (
          <span className="text-2xl opacity-50">⭐</span>
        )}
        <div>
          <h4 className={`font-medium ${
            achieved ? 'text-indigo-900' : 'text-gray-500'
          }`}>{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}