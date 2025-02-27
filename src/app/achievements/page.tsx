'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Achievement from '@/components/ui/Achievement';
import { Achievement as AchievementType } from '@/types/memory';

export default function AchievementsPage() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [achievements, setAchievements] = useState<AchievementType[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [checkInStreak, setCheckInStreak] = useState<number>(0);
  const [lastCheckIn, setLastCheckIn] = useState<string | undefined>(undefined);
  const [isCheckedInToday, setIsCheckedInToday] = useState<boolean>(false);
  const [checkInMessage, setCheckInMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showMessage, setShowMessage] = useState<boolean>(false);

  // 加载成就和积分
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      setLoading(true);
      try {
        // 获取成就（带上语言参数）
        const achievementsRes = await fetch(`/api/achievements?locale=${currentLocale}&updateLocale=true`);
        const achievementsData = await achievementsRes.json();
        
        if (achievementsData.achievements) {
          setAchievements(achievementsData.achievements);
        }
        
        // 获取积分
        const pointsRes = await fetch('/api/points');
        const pointsData = await pointsRes.json();
        
        setPoints(pointsData.total || 0);
        setCheckInStreak(pointsData.checkInStreak || 0);
        setLastCheckIn(pointsData.lastCheckIn);
        
        // 检查今日是否已签到
        if (pointsData.lastCheckIn) {
          const today = new Date().toISOString().split('T')[0];
          const lastCheckInDate = new Date(pointsData.lastCheckIn).toISOString().split('T')[0];
          setIsCheckedInToday(today === lastCheckInDate);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [user, currentLocale]);
  
  // 处理签到
  const handleCheckIn = async () => {
    if (isCheckedInToday || !user) return;
    
    try {
      const response = await fetch('/api/points', {
        method: 'PUT'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPoints(data.points);
        setCheckInStreak(data.checkInStreak);
        setLastCheckIn(new Date().toISOString());
        setIsCheckedInToday(true);
        setCheckInMessage(data.message);
        setShowMessage(true);
        
        // 3秒后隐藏消息
        setTimeout(() => {
          setShowMessage(false);
        }, 3000);
      }
    } catch (error) {
      console.error('签到失败:', error);
    }
  };
  
  // 按类别分组成就
  const achievementsByCategory = achievements.reduce<Record<string, AchievementType[]>>(
    (acc, achievement) => {
      const category = achievement.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(achievement);
      return acc;
    },
    {}
  );
  
  // 获取解锁的成就数量
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const unlockedPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  
  // 类别标题映射
  const categoryTitles: Record<string, string> = {
    interaction: t.achievements.categories.interaction,
    emotion: t.achievements.categories.emotion,
    streak: t.achievements.categories.streak,
    special: t.achievements.categories.special
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.achievements.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{t.achievements.subtitle}</p>
      </div>
      
      {/* 进度概览与签到 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 成就进度 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">{t.achievements.progress}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">{t.achievements.unlocked}</span>
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {unlockedCount}/{totalCount}
              </span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-500"
                style={{ width: `${unlockedPercentage}%` }}
              />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
              {t.achievements.completion} {unlockedPercentage}%
            </div>
          </div>
        </div>
        
        {/* 积分系统 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">{t.achievements.points.title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t.achievements.points.current}</span>
            <div className="text-3xl font-bold text-amber-500 dark:text-amber-400 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              {points}
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>{t.achievements.points.description}</p>
            <p className="mt-1">{t.achievements.points.future}</p>
          </div>
        </div>
        
        {/* 每日签到 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">{t.achievements.checkIn.title}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">{t.achievements.checkIn.streak}</span>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {checkInStreak} {currentLocale === 'zh' ? '天' : currentLocale === 'ja' ? '日' : 'days'}
              </span>
            </div>
            
            {showMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 p-2 rounded text-sm"
              >
                {checkInMessage}
              </motion.div>
            )}
            
            <button
              onClick={handleCheckIn}
              disabled={isCheckedInToday || loading}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                isCheckedInToday
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {isCheckedInToday ? t.achievements.checkIn.done : t.achievements.checkIn.button}
            </button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {isCheckedInToday
                ? t.achievements.checkIn.tomorrow
                : t.achievements.checkIn.consecutive}
            </p>
          </div>
        </div>
      </div>
      
      {/* 成就列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              {categoryTitles[category] || category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAchievements.map((achievement) => (
                <Achievement
                  key={achievement.id}
                  achievement={achievement}
                  showProgress={true}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}