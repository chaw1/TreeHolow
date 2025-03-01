'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import LoadingSpinner from '@/components/LoadingSpinner';

// 默认可用标签
const defaultTags = [
  '开心', '悲伤', '焦虑', '平静', '感恩',
  '工作', '家庭', '旅行', '学习', '健康',
  '生活', '梦想', '回忆', '期待', '思考'
];

// 心情表情映射
const moodEmojis: Record<number, string> = {
  1: '😔', // 非常低落
  2: '😟', // 有点低落
  3: '😐', // 平静
  4: '😊', // 开心
  5: '😄', // 非常开心
};

export default function NewDiaryPage() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<number>(3); // 默认平静
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // 根据浏览器定位获取位置信息
  useEffect(() => {
    if (navigator.geolocation && !location) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            if (data && data.address) {
              // 获取城市或地区名称
              const locationName = data.address.city || 
                                   data.address.town || 
                                   data.address.village || 
                                   data.address.suburb || 
                                   '';
              setLocation(locationName);
            }
          } catch (error) {
            console.error('无法获取位置信息:', error);
          }
        },
        (error) => {
          console.error('位置服务错误:', error);
        }
      );
    }
  }, [location]);
  
  // 获取当前天气
  useEffect(() => {
    if (location && !weather) {
      // 这里可以接入天气API
      // 为了简化，我们使用一些模拟的天气状态
      const mockWeathers = ['晴朗', '多云', '小雨', '大雨', '雾', '雪'];
      const randomWeather = mockWeathers[Math.floor(Math.random() * mockWeathers.length)];
      setWeather(randomWeather);
    }
  }, [location, weather]);
  
  // 处理标签选择
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // 添加自定义标签
  const addCustomTag = () => {
    if (customTag && !selectedTags.includes(customTag)) {
      setSelectedTags([...selectedTags, customTag]);
      setCustomTag('');
    }
  };
  
  // 提交日记
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('标题和内容不能为空');
      return;
    }
    
    if (!userId) {
      setError('请先登录');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      const response = await fetch('/api/diaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          mood,
          tags: selectedTags,
          location,
          weather
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存日记失败');
      }
      
      // 成功后跳转到日记列表页
      router.push('/diaries');
      
    } catch (err: any) {
      setError(err.message || '保存日记时出错');
      setIsSubmitting(false);
    }
  };
  
  // 获取当前心情的描述
  const getMoodDescription = (moodValue: number): string => {
    switch (moodValue) {
      case 1: return '非常低落';
      case 2: return '有点低落';
      case 3: return '平静';
      case 4: return '开心';
      case 5: return '非常开心';
      default: return '平静';
    }
  };
  
  // 加载中状态
  if (!isLoaded) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.diaries.new}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{t.diaries.subtitle}</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 日记标题 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.diaries.form.title}
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.diaries.form.titlePlaceholder}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800"
              required
            />
          </div>
          
          {/* 心情选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.diaries.form.mood}
            </label>
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-300 dark:border-gray-700">
              <input
                type="range"
                min="1"
                max="5"
                value={mood}
                onChange={(e) => setMood(parseInt(e.target.value))}
                className="w-full mr-4"
              />
              <div className="flex items-center">
                <span className="text-3xl mr-2">{moodEmojis[mood]}</span>
                <span className="text-gray-600 dark:text-gray-400">{getMoodDescription(mood)}</span>
              </div>
            </div>
          </div>
          
          {/* 日记内容 */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              内容
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你的想法..."
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800"
              required
            />
          </div>
          
          {/* 标签选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              添加标签
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {defaultTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-sm px-3 py-1 rounded-full ${
                    selectedTags.includes(tag)
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex mt-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="自定义标签"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800"
              />
              <button
                type="button"
                onClick={addCustomTag}
                disabled={!customTag.trim()}
                className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-r-lg disabled:opacity-50"
              >
                添加
              </button>
            </div>
            {selectedTags.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">已选标签:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 focus:outline-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 位置和天气 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                位置
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="你的位置"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label htmlFor="weather" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                天气
              </label>
              <input
                type="text"
                id="weather"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                placeholder="今天的天气"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          
          {/* 提交按钮 */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/diaries')}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {isSubmitting ? '保存中...' : '保存日记'}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}