import { Inter } from 'next/font/google'
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from '@/components/ui/Navbar';
import './globals.css'
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="zh-CN" suppressHydrationWarning className="scroll-smooth">
        <head>
          <link rel="stylesheet" href="/css/custom.css" />
        </head>
        <body className={`${inter.className} text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300`} suppressHydrationWarning>
          {/* 导航栏 */}
          <Navbar />

          {/* 主内容区 */}
          <main className="pt-16">
            {children}
          </main>

          {/* 页脚 */}
          <footer className="bg-white dark:bg-slate-900 py-8 mt-20 border-t border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <Link href="/" className="flex items-center space-x-2">
                    <span className="text-2xl">🌳</span>
                    <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      心灵树洞
                    </span>
                  </Link>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    一个安全、私密的心灵空间
                  </p>
                </div>
                
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
                  <div>
                    <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">探索</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                          首页
                        </Link>
                      </li>
                      <li>
                        <Link href="/treehole" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                          树洞空间
                        </Link>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">关于</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                          隐私政策
                        </Link>
                      </li>
                      <li>
                        <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                          使用条款
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                <p>© {new Date().getFullYear()} 心灵树洞. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  )
}