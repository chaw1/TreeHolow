'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Achievement from '@/components/ui/Achievement';
import { Achievement as AchievementType } from '@/types/memory';

export default function AchievementsPage() {
  const { user } = useUser();
  const { t, currentLocale } = useLanguage();
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
        // 首先检查localStorage中是否有今日签到记录
        try {
          const today = new Date().toISOString().split('T')[0];
          const storedDate = localStorage.getItem('lastCheckinDate');
          if (storedDate && storedDate === today) {
            // 如果本地存储表明今天已签到，先设置状态
            setIsCheckedInToday(true);
            console.log('从localStorage检测到今日已签到');
          }
        } catch (e) {
          console.error('读取localStorage失败', e);
        }
        
        // 获取成就（带上语言参数）
        const achievementsRes = await fetch(`/api/achievements?locale=${currentLocale}&updateLocale=true`);
        const achievementsData = await achievementsRes.json();
        
        if (achievementsData.achievements) {
          setAchievements(achievementsData.achievements);
        }
        
        // 获取积分 - 使用时间戳参数避免缓存
        const timestamp = new Date().getTime();
        const pointsRes = await fetch(`/api/points?t=${timestamp}`, {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
          cache: 'no-store'
        });
        const pointsData = await pointsRes.json();
        
        console.log('加载积分数据:', pointsData);
        
        // 确保使用正确的字段名
        setPoints(pointsData.totalPoints || 0);
        setCheckInStreak(pointsData.checkinStreak || 0);
        setLastCheckIn(pointsData.lastCheckin);
        
        // 检查今日是否已签到
        if (pointsData.lastCheckin) {
          const today = new Date().toISOString().split('T')[0];
          const lastCheckInDate = new Date(pointsData.lastCheckin).toISOString().split('T')[0];
          const isCheckedIn = today === lastCheckInDate;
          setIsCheckedInToday(isCheckedIn);
          console.log(`检查签到状态: ${isCheckedIn ? '今日已签到' : '今日未签到'}`);
          
          // 更新localStorage
          if (isCheckedIn) {
            try {
              localStorage.setItem('lastCheckinDate', today);
            } catch (e) {
              console.error('无法保存到localStorage', e);
            }
          }
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
    if (isCheckedInToday || !user || loading) return;
    
    // 立即设置本地状态为处理中，防止重复点击
    setLoading(true);
    
    try {
      // 在开始签到前，再次检查是否已签到，避免刷新页面导致状态重置
      const checkStatusRes = await fetch('/api/points', {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
        next: { revalidate: 0 } // 确保每次都获取最新数据
      });
      const pointsData = await checkStatusRes.json();
      
      console.log('签到前检查当前积分状态:', pointsData);
      
      // 检查今日是否已签到
      const today = new Date().toISOString().split('T')[0];
      let alreadyCheckedIn = false;
      
      if (pointsData.lastCheckin) {
        const lastCheckInDate = new Date(pointsData.lastCheckin).toISOString().split('T')[0];
        alreadyCheckedIn = today === lastCheckInDate;
        console.log(`再次检查签到状态: 今天=${today}, 上次签到=${lastCheckInDate}, 结果=${alreadyCheckedIn ? '已签到' : '未签到'}`);
      }
      
      // 如果已经签到过，更新本地状态并退出
      if (alreadyCheckedIn) {
        setIsCheckedInToday(true);
        setCheckInMessage(t.achievements.checkIn.alreadyDone);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
        setLoading(false);
        return;
      }
      
      // 继续签到流程
      const response = await fetch(`/api/points?locale=${currentLocale}`, {
        method: 'PUT',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const data = await response.json();
      
      console.log('签到响应:', data);
      
      if (data.success) {
        // 成功签到，更新本地状态
        setPoints(prev => prev + data.points);
        setCheckInStreak(data.streak);
        setLastCheckIn(new Date().toISOString());
        setIsCheckedInToday(true);
        setCheckInMessage(data.message);
        setShowMessage(true);
        
        // 保存签到状态到localStorage作为额外防护
        try {
          localStorage.setItem('lastCheckinDate', new Date().toISOString().split('T')[0]);
        } catch (e) {
          console.error('无法保存到localStorage', e);
        }
        
        // 3秒后隐藏消息
        setTimeout(() => {
          setShowMessage(false);
        }, 3000);
      } else {
        // 签到失败（可能是已经签到过）
        if (data.streak) {
          // 如果返回了streak，说明用户已有记录，更新本地状态
          setCheckInStreak(data.streak);
        }
        setIsCheckedInToday(true); // 设置为已签到状态，防止重复尝试
        setCheckInMessage(data.message || t.achievements.checkIn.failed);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      }
    } catch (error) {
      console.error('签到失败:', error);
      setCheckInMessage(t.achievements.checkIn.error);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    } finally {
      setLoading(false);
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