import Link from 'next/link'
import { Inter } from 'next/font/google'
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className} suppressHydrationWarning>
          {/* 导航栏 */}
          <nav className="fixed w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50">
            <div className="container mx-auto px-4 py-3">
              <div className="flex justify-between items-center">
                <Link href="/" className="text-xl font-semibold">
                  树洞
                </Link>
                <div className="flex items-center space-x-4">
                  <SignedIn>
                    {/* 登录后显示 */}
                    <Link href="/memories" className="hover:text-indigo-600">
                      我的记忆
                    </Link>
                    <UserButton afterSignOutUrl="/"/>
                  </SignedIn>
                  <SignedOut>
                    {/* 未登录时显示 */}
                    <SignInButton mode="modal">
                      <button className="hover:text-indigo-600">
                        登录
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <button className="p-2 rounded-full bg-gray-100 dark:bg-slate-800">
                    {/* 主题切换按钮 */}
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* 主内容区 */}
          <main className="pt-16">
            {children}
          </main>

          {/* 页脚 */}
          <footer className="bg-white dark:bg-slate-900 py-6 mt-20">
            <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>© 2024 AI树洞. All rights reserved.</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  )
}