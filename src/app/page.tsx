'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { locales, Locale } from '@/i18n';

export default function Home() {
  const { isSignedIn } = useAuth();
  const [currentLocale, setCurrentLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);
  const t = locales[currentLocale];

  useEffect(() => {
    setMounted(true);
    // 获取浏览器语言设置
    const browserLang = navigator.language.split('-')[0];
    if (browserLang in locales) {
      setCurrentLocale(browserLang as Locale);
    }
  }, []);

  if (!mounted) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative"></div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 overflow-y-auto relative">
      {/* 背景图案 */}
      <div className="absolute inset-0 z-0 opacity-50 pointer-events-none bg-hero-pattern"></div>
      
      {/* 波浪背景 */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320">
          <path
            fill="#E8F4FF" 
            fillOpacity="0.4"
            className="dark:fill-indigo-900 dark:fill-opacity-30"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,186.7C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>

      {/* 语言切换器 */}
      <div className="absolute top-4 right-4 z-40">
        <LanguageSwitcher
          currentLocale={currentLocale}
          onLocaleChange={setCurrentLocale}
        />
      </div>

      {/* 主内容 */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero区域 */}
          <div className="pt-24 pb-32 md:pt-36 md:pb-48">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="mb-8 mx-auto w-24 h-24 relative"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse-light blur-xl opacity-70"></div>
                <div className="relative z-10 w-24 h-24 flex items-center justify-center text-5xl">
                  🌳
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-7xl font-bold tracking-tight"
              >
                <span className="inline-block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 animate-gradient-x bg-clip-text text-transparent">
                  {t.hero.title}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-8 text-xl md:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto"
              >
                {t.hero.subtitle}
              </motion.p>

              {/* CTA按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-12 flex flex-col sm:flex-row justify-center gap-4"
              >
                {isSignedIn ? (
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/treehole"
                      className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white text-lg font-medium rounded-xl shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-200"
                    >
                      {t.hero.cta.enter}
                      <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </motion.div>
                ) : (
                  <>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        href="/sign-in"
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white text-lg font-medium rounded-xl shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-200"
                      >
                        {t.hero.cta.start}
                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        href="#learn-more"
                        className="inline-flex items-center px-8 py-4 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 text-lg font-medium rounded-xl shadow-md hover:shadow-lg hover:shadow-gray-300/30 dark:hover:shadow-none transition-all duration-200"
                      >
                        {t.hero.cta.learnMore}
                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </Link>
                    </motion.div>
                  </>
                )}
              </motion.div>
            </div>
          </div>

          {/* 特色功能区 */}
          <div id="learn-more" className="py-24 bg-white/80 dark:bg-gray-800/50 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-20">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {t.features.title}
                </h2>
                <div className="mt-4 h-1 w-20 mx-auto bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <p className="mt-6 text-xl text-gray-600 dark:text-gray-300">
                  {t.features.subtitle}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-12">
                <FeatureCard
                  icon="🎭"
                  title={t.features.cards.emotional.title}
                  description={t.features.cards.emotional.description}
                  gradient="from-blue-500 to-indigo-500"
                />
                <FeatureCard
                  icon="🔐"
                  title={t.features.cards.privacy.title}
                  description={t.features.cards.privacy.description}
                  gradient="from-indigo-500 to-purple-500"
                />
                <FeatureCard
                  icon="📈"
                  title={t.features.cards.growth.title}
                  description={t.features.cards.growth.description}
                  gradient="from-purple-500 to-pink-500"
                />
              </div>
            </div>
          </div>

          {/* 使用流程 */}
          <div className="py-24">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
                {t.process.title}
              </h2>
              <div className="mt-4 h-1 w-20 mx-auto bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <ProcessCard
                number="01"
                title={t.process.steps.record.title}
                description={t.process.steps.record.description}
              />
              <ProcessCard
                number="02"
                title={t.process.steps.ai.title}
                description={t.process.steps.ai.description}
              />
              <ProcessCard
                number="03"
                title={t.process.steps.grow.title}
                description={t.process.steps.grow.description}
              />
            </div>
          </div>
          
          {/* 呼吁行动区 */}
          <div className="py-24">
            <div className="rounded-3xl overflow-hidden shadow-xl">
              <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-16 md:py-20 text-center text-white">
                <div className="absolute inset-0 bg-hero-pattern opacity-10"></div>
                <div className="relative z-10 max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">开始你的心灵之旅</h2>
                  <p className="text-xl text-indigo-100 mb-10">每一次树洞倾诉，都是一次心灵的释放与成长。现在就开始体验吧！</p>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href={isSignedIn ? "/treehole" : "/sign-in"}
                      className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200"
                    >
                      {isSignedIn ? "进入我的树洞" : "立即开始"}
                      <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient
}: {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      className="relative p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden group"
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
      <div className="relative z-10">
        <div className="text-4xl mb-6 bg-gray-100 dark:bg-gray-700 h-16 w-16 rounded-xl flex items-center justify-center animate-float">
          <span className="transform group-hover:scale-110 transition-transform duration-300">{icon}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

function ProcessCard({
  number,
  title,
  description
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700"
    >
      <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
        {number}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
    </motion.div>
  );
}