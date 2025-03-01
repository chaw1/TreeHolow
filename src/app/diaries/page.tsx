'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { format, parseISO } from 'date-fns';
import { zhCN, enUS, ja } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Calendar } from '@/components/ui/calendar';

// 心情表情映射
const moodEmojis: Record<number, string> = {
  1: '😔', // 非常低落
  2: '😟', // 有点低落
  3: '😐', // 平静
  4: '😊', // 开心
  5: '😄', // 非常开心
};

// 心情颜色映射
const moodColors: Record<number, string> = {
  1: 'bg-blue-200 dark:bg-blue-900', // 非常低落 - 蓝色
  2: 'bg-indigo-200 dark:bg-indigo-900', // 有点低落 - 靛蓝
  3: 'bg-purple-200 dark:bg-purple-900', // 平静 - 紫色
  4: 'bg-pink-200 dark:bg-pink-900', // 开心 - 粉色
  5: 'bg-red-200 dark:bg-red-900', // 非常开心 - 红色
};

interface Diary {
  id: string;
  title: string;
  content: string;
  mood: number;
  tags: string[];
  image_url?: string;
  location?: string;
  weather?: string;
  created_at: string;
  updated_at: string;
}

export default function DiariesPage() {
  const { userId, isLoaded } = useAuth();
  const { t, currentLocale } = useLanguage();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [selectedDiaries, setSelectedDiaries] = useState<Diary[]>([]);
  const [totalDiaries, setTotalDiaries] = useState(0);
  
  // 获取日期对应的本地化设置
  const getDateLocale = () => {
    switch (currentLocale) {
      case 'en': return enUS;
      case 'ja': return ja;
      case 'zh': 
      default:
        return zhCN;
    }
  };

  // 加载所有日记
  useEffect(() => {
    async function loadDiaries() {
      if (!userId) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/diaries');
        
        if (!response.ok) {
          throw new Error('获取日记失败');
        }
        
        const data = await response.json();
        setDiaries(data.diaries || []);
        setTotalDiaries(data.totalCount || 0);
        
        // 如果有选中的日期，过滤出该日期的日记
        if (selectedDay) {
          const selectedDate = format(selectedDay, 'yyyy-MM-dd');
          const filtered = data.diaries.filter((diary: Diary) => 
            diary.created_at.startsWith(selectedDate)
          );
          setSelectedDiaries(filtered);
        }
      } catch (error) {
        console.error('加载日记错误:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (isLoaded && userId) {
      loadDiaries();
    }
  }, [isLoaded, userId, selectedDay]);

  // 日历上有日记的日期高亮
  const getDiaryDates = () => {
    const dates: Record<string, number> = {};
    
    diaries.forEach(diary => {
      const date = diary.created_at.split('T')[0];
      if (dates[date]) {
        dates[date] += 1;
      } else {
        dates[date] = 1;
      }
    });
    
    return dates;
  };

  // 处理日期选择
  const handleDaySelect = (day: Date | undefined) => {
    setSelectedDay(day);
    if (day) {
      const selectedDate = format(day, 'yyyy-MM-dd');
      const filtered = diaries.filter(diary => 
        diary.created_at.startsWith(selectedDate)
      );
      setSelectedDiaries(filtered);
    } else {
      setSelectedDiaries([]);
    }
  };

  // 加载中状态
  if (!isLoaded || loading) {
    return <LoadingSpinner />;
  }

  // 每月日记统计
  const diaryDates = getDiaryDates();

  // 自定义渲染日期函数
  const renderDay = (props: any) => {
    const { day } = props;
    if (!day) return <div></div>;
    
    const dateString = format(day.date, 'yyyy-MM-dd');
    const count = diaryDates[dateString] || 0;
    
    let mood = 0;
    // 如果当天有日记，获取第一篇日记的心情值
    if (count > 0) {
      const dayDiaries = diaries.filter(diary => diary.created_at.startsWith(dateString));
      if (dayDiaries.length > 0) {
        mood = dayDiaries[0].mood;
      }
    }
    
    const isSelected = selectedDay && dateString === format(selectedDay, 'yyyy-MM-dd');
    
    return (
      <div className={`relative w-7 h-7 flex items-center justify-center rounded-full 
                      ${isSelected ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}`}>
        {count > 0 && (
          <div className={`absolute inset-0 rounded-full ${moodColors[mood]} opacity-50`}></div>
        )}
        <span className={`relative z-10 ${isSelected ? 'font-bold' : ''}`}>
          {day.date.getDate()}
        </span>
        {count > 0 && (
          <span className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 flex h-2 w-2 items-center justify-center">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
        )}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.diaries.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{t.diaries.subtitle}</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          {/* 视图切换 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-1 flex items-center">
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1 rounded-md ${
                view === 'calendar' 
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {t.diaries.calendar}
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 rounded-md ${
                view === 'list' 
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {t.diaries.list}
            </button>
          </div>
          
          {/* 新建日记按钮 */}
          <Link href="/diaries/new">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg"
            >
              {t.diaries.new}
            </motion.button>
          </Link>
        </div>
      </div>
      
      {/* 日历视图 */}
      {view === 'calendar' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 日历部分 */}
          <div className="col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={handleDaySelect}
              onMonthChange={setCurrentMonth}
              locale={getDateLocale()}
              className="w-full mx-auto"
              showOutsideDays={true}
              fixedWeeks={true}
              components={{
                Day: renderDay
              }}
            />
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
              {totalDiaries > 0 ? (
                <p>{t.diaries.totalEntries.replace('{count}', totalDiaries.toString())}</p>
              ) : (
                <p>{t.diaries.createFirst}</p>
              )}
            </div>
          </div>
          
          {/* 选中日期的日记列表 */}
          <div className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 min-h-[400px]">
            <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-xl font-semibold">
                {selectedDay ? format(selectedDay, 'yyyy年MM月dd日', { locale: getDateLocale() }) : t.diaries.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedDiaries.length > 0 
                  ? t.diaries.entryCount.replace('{count}', selectedDiaries.length.toString())
                  : t.diaries.noEntries}
              </p>
            </div>
            
            {selectedDiaries.length > 0 ? (
              <div className="space-y-4">
                {selectedDiaries.map(diary => (
                  <Link href={`/diaries/${diary.id}`} key={diary.id}>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{moodEmojis[diary.mood]}</span>
                          <h4 className="font-medium">{diary.title}</h4>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {format(parseISO(diary.created_at), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-2">{diary.content}</p>
                      {diary.tags && diary.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {diary.tags.map(tag => (
                            <span 
                              key={tag} 
                              className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {selectedDay ? (
                  <div className="text-center">
                    <p className="mb-2">{t.diaries.selectDate}</p>
                    <Link href="/diaries/new">
                      <button className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        {t.diaries.new}
                      </button>
                    </Link>
                  </div>
                ) : (
                  <p>{t.diaries.selectDate}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 列表视图 */}
      {view === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          {diaries.length > 0 ? (
            <div className="space-y-6">
              {diaries.map(diary => (
                <Link href={`/diaries/${diary.id}`} key={diary.id}>
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold flex items-center">
                        <span className="text-2xl mr-2">{moodEmojis[diary.mood]}</span>
                        {diary.title}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {format(parseISO(diary.created_at), 'yyyy-MM-dd HH:mm', { locale: getDateLocale() })}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">{diary.content}</p>
                    <div className="flex flex-wrap gap-2">
                      {diary.tags && diary.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {diary.location && (
                        <span className="text-xs flex items-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {diary.location}
                        </span>
                      )}
                      {diary.weather && (
                        <span className="text-xs flex items-center bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                          </svg>
                          {diary.weather}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="mb-2">{t.diaries.noEntries}</p>
              <Link href="/diaries/new">
                <button className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  {t.diaries.createFirst}
                </button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}