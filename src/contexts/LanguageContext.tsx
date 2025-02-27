'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Locale, locales } from '@/i18n';

type LanguageContextType = {
  currentLocale: Locale;
  setCurrentLocale: (locale: Locale) => void;
  t: typeof locales.en;
};

// 创建默认上下文
const defaultContext: LanguageContextType = {
  currentLocale: 'en',
  setCurrentLocale: () => {},
  t: locales.en
};

// 创建上下文
export const LanguageContext = createContext<LanguageContextType>(defaultContext);

// 自定义Hook，用于在组件中使用语言上下文
export const useLanguage = () => useContext(LanguageContext);

// 语言提供者组件
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLocale, setCurrentLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  // 当前翻译文本
  const t = locales[currentLocale];

  // 设置语言并存储到localStorage
  const handleSetCurrentLocale = (locale: Locale) => {
    setCurrentLocale(locale);
    localStorage.setItem('preferredLanguage', locale);
  };

  // 当组件挂载时，从localStorage获取语言偏好
  useEffect(() => {
    setMounted(true);
    
    // 先检查localStorage中是否有保存的语言偏好
    const savedLocale = localStorage.getItem('preferredLanguage') as Locale | null;
    
    if (savedLocale && Object.keys(locales).includes(savedLocale)) {
      setCurrentLocale(savedLocale);
    } else {
      // 如果没有保存的偏好，则使用浏览器语言设置
      const browserLang = navigator.language.split('-')[0] as Locale;
      if (Object.keys(locales).includes(browserLang)) {
        setCurrentLocale(browserLang);
        localStorage.setItem('preferredLanguage', browserLang);
      }
    }
  }, []);

  // 未挂载时返回null以避免hydration不匹配错误
  if (!mounted) return <>{children}</>;

  return (
    <LanguageContext.Provider
      value={{
        currentLocale,
        setCurrentLocale: handleSetCurrentLocale,
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};