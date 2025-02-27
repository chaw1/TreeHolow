'use client';

import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@/components/ui/Icons';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // 当组件加载时检查系统偏好和本地存储
  useEffect(() => {
    // 检查本地存储的主题偏好
    const storedTheme = localStorage.getItem('theme');
    
    if (storedTheme === 'dark' || 
        (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // 更新DOM和本地存储
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('theme', newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <MoonIcon className="w-5 h-5 text-slate-700" /> : <SunIcon className="w-5 h-5 text-yellow-300" />}
    </button>
  );
};