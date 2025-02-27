'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from './ThemeToggle';
import { HomeIcon, MemoryIcon, TreeIcon, UserIcon } from './Icons';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export const Navbar = () => {
  const pathname = usePathname();
  const { currentLocale, setCurrentLocale, t } = useLanguage();
  
  // 判断当前活跃路径
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="fixed w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🌳</span>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t.common.appName}
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className={`flex items-center space-x-1 hover:text-indigo-600 transition-colors ${
                isActive('/') ? 'text-indigo-600 font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <HomeIcon className="w-5 h-5" />
              <span>{t.nav.home}</span>
            </Link>
            
            <SignedIn>
              <Link 
                href="/treehole" 
                className={`flex items-center space-x-1 hover:text-indigo-600 transition-colors ${
                  isActive('/treehole') ? 'text-indigo-600 font-medium' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <TreeIcon className="w-5 h-5" />
                <span>{t.nav.treehole}</span>
              </Link>
              
              <Link 
                href="/memories" 
                className={`flex items-center space-x-1 hover:text-indigo-600 transition-colors ${
                  isActive('/memories') ? 'text-indigo-600 font-medium' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <MemoryIcon className="w-5 h-5" />
                <span>{t.nav.memories}</span>
              </Link>
            </SignedIn>
          </div>
          
          {/* User Menu & Theme Toggle */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block">
              <LanguageSwitcher currentLocale={currentLocale} onLocaleChange={setCurrentLocale} />
            </div>
            
            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-9 h-9"
                  }
                }}
              />
            </SignedIn>
            
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                  {t.nav.login}
                </button>
              </SignInButton>
            </SignedOut>
            
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-4 py-2 z-50">
        <div className="flex justify-around items-center">
          <Link 
            href="/" 
            className={`flex flex-col items-center p-2 ${
              isActive('/') ? 'text-indigo-600' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs mt-1">{t.nav.home}</span>
          </Link>
          
          <SignedIn>
            <Link 
              href="/treehole" 
              className={`flex flex-col items-center p-2 ${
                isActive('/treehole') ? 'text-indigo-600' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <TreeIcon className="w-6 h-6" />
              <span className="text-xs mt-1">{t.nav.treehole}</span>
            </Link>
            
            <Link 
              href="/memories" 
              className={`flex flex-col items-center p-2 ${
                isActive('/memories') ? 'text-indigo-600' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <MemoryIcon className="w-6 h-6" />
              <span className="text-xs mt-1">{t.nav.memories}</span>
            </Link>
          </SignedIn>
          
          <SignedOut>
            <SignInButton mode="modal">
              <button className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400">
                <UserIcon className="w-6 h-6" />
                <span className="text-xs mt-1">{t.nav.login}</span>
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
};