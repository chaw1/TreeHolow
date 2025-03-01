'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { format, parseISO } from 'date-fns';
import { zhCN, enUS, ja } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import LoadingSpinner from '@/components/LoadingSpinner';

// 心情表情映射
const moodEmojis: Record<number, string> = {
  1: '😔', // 非常低落
  2: '😟', // 有点低落
  3: '😐', // 平静
  4: '😊', // 开心
  5: '😄', // 非常开心
};

// 心情背景颜色
const moodBackgrounds: Record<number, string> = {
  1: 'bg-gradient-to-r from-blue-400 to-blue-600', // 非常低落
  2: 'bg-gradient-to-r from-indigo-400 to-indigo-600', // 有点低落
  3: 'bg-gradient-to-r from-purple-400 to-purple-600', // 平静
  4: 'bg-gradient-to-r from-pink-400 to-pink-600', // 开心
  5: 'bg-gradient-to-r from-red-400 to-red-600', // 非常开心
};

// 心情文字描述
const moodDescriptions: Record<number, string> = {
  1: '非常低落',
  2: '有点低落',
  3: '平静',
  4: '开心',
  5: '非常开心',
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

export default function DiaryDetailPage({ params }: { params: { id: string } }) {
  // 获取心情关键词
  const getMoodKey = (mood: number): 'veryLow' | 'low' | 'neutral' | 'happy' | 'veryHappy' => {
    switch (mood) {
      case 1: return 'veryLow';
      case 2: return 'low';
      case 3: return 'neutral';
      case 4: return 'happy';
      case 5: return 'veryHappy';
      default: return 'neutral';
    }
  };
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const { currentLocale, t } = useLanguage();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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
  
  // 加载日记详情
  useEffect(() => {
    async function loadDiary() {
      if (!userId || !params.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/diaries/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('日记不存在');
          } else {
            throw new Error('获取日记失败');
          }
        }
        
        const data = await response.json();
        setDiary(data.diary);
      } catch (error: any) {
        setError(error.message || '加载日记出错');
      } finally {
        setLoading(false);
      }
    }
    
    if (isLoaded && userId) {
      loadDiary();
    }
  }, [isLoaded, userId, params.id]);
  
  // 删除日记
  const handleDelete = async () => {
    if (!diary || !userId) return;
    
    try {
      const response = await fetch(`/api/diaries/${diary.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('删除日记失败');
      }
      
      // 删除成功后返回日记列表页
      router.push('/diaries');
    } catch (error: any) {
      setError(error.message || '删除日记出错');
      setShowDeleteConfirm(false);
    }
  };
  
  // 加载中状态
  if (!isLoaded || loading) {
    return <LoadingSpinner />;
  }
  
  // 错误状态
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
          <Link href="/diaries">
            <button className="text-indigo-600 dark:text-indigo-400 hover:underline">
              返回日记列表
            </button>
          </Link>
        </div>
      </div>
    );
  }
  
  // 没有数据
  if (!diary) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">未找到日记</p>
          <Link href="/diaries">
            <button className="text-indigo-600 dark:text-indigo-400 hover:underline">
              返回日记列表
            </button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="max-w-3xl mx-auto">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/diaries">
            <button className="flex items-center text-indigo-600 dark:text-indigo-400 hover:underline">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t.common.back}
            </button>
          </Link>
        </div>
        
        {/* 日记标题和日期 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            {diary.title}
          </h1>
          <div className="text-gray-500 dark:text-gray-400 mt-2 flex items-center">
            <span className="mr-4">
              {format(parseISO(diary.created_at), 'yyyy年MM月dd日 HH:mm', { locale: getDateLocale() })}
            </span>
            {diary.updated_at !== diary.created_at && (
              <span className="text-sm">
                (已编辑于 {format(parseISO(diary.updated_at), 'MM月dd日 HH:mm')})
              </span>
            )}
          </div>
        </div>
        
        {/* 心情、位置和天气 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`${moodBackgrounds[diary.mood]} text-white p-4 rounded-lg shadow-md flex items-center`}>
            <span className="text-4xl mr-3">{moodEmojis[diary.mood]}</span>
            <div>
              <h3 className="font-medium">{t.diaries.form.mood}</h3>
              <p>{t.diaries.moods[getMoodKey(diary.mood)]}</p>
            </div>
          </div>
          
          {diary.location && (
            <div className="bg-gradient-to-r from-green-400 to-teal-500 text-white p-4 rounded-lg shadow-md flex items-center">
              <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <h3 className="font-medium">{t.diaries.form.location}</h3>
                <p>{diary.location}</p>
              </div>
            </div>
          )}
          
          {diary.weather && (
            <div className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white p-4 rounded-lg shadow-md flex items-center">
              <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <div>
                <h3 className="font-medium">{t.diaries.form.weather}</h3>
                <p>{diary.weather}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* 日记内容 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 whitespace-pre-wrap">
          {diary.content.split('\n').map((paragraph, index) => (
            <p key={index} className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
        
        {/* 标签 */}
        {diary.tags && diary.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">{t.diaries.form.tags}</h3>
            <div className="flex flex-wrap gap-2">
              {diary.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* 操作按钮 */}
        <div className="flex justify-end space-x-4">
          <Link href={`/diaries/edit/${diary.id}`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700"
            >
              {t.diaries.edit}
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700"
          >
            {t.diaries.delete}
          </motion.button>
        </div>
        
        {/* 删除确认对话框 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t.diaries.deleteConfirm}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t.diaries.deleteWarning}
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  {t.diaries.cancel}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {t.diaries.confirmDelete}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}