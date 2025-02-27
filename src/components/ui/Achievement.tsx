'use client';

import React from 'react';
import { Achievement as AchievementType } from '@/types/memory';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface AchievementProps {
  achievement: AchievementType;
  onClick?: (achievement: AchievementType) => void;
  showProgress?: boolean;
}

const Achievement: React.FC<AchievementProps> = ({ 
  achievement, 
  onClick,
  showProgress = true 
}) => {
  const { title, description, icon, unlocked, progress, points } = achievement;
  const { t, currentLocale } = useLanguage();
  
  // 处理点击事件
  const handleClick = () => {
    if (onClick) {
      onClick(achievement);
    }
  };
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`p-4 rounded-lg border ${
        unlocked 
          ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/30' 
          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
      } cursor-pointer transition-all duration-200`}
    >
      <div className="flex items-start space-x-3">
        <div className={`text-2xl ${!unlocked && 'opacity-50'}`}>
          {icon || '🏆'}
        </div>
        <div className="flex-1">
          <h4 className={`font-medium ${
            unlocked ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {title}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          
          {points > 0 && (
            <div className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              {unlocked 
                ? (currentLocale === 'en' ? 'Earned ' : currentLocale === 'ja' ? '獲得した ' : '已获得')
                : (currentLocale === 'en' ? 'Can earn ' : currentLocale === 'ja' ? '獲得可能 ' : '可获得')
              }
              {points}
              {currentLocale === 'en' ? ' points' : currentLocale === 'ja' ? ' ポイント' : ' 积分'}
            </div>
          )}
          
          {showProgress && typeof progress === 'number' && !unlocked && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {progress}%
              </div>
            </div>
          )}
        </div>
        
        {/* 成就状态标识 */}
        {unlocked && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900">
              <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Achievement;