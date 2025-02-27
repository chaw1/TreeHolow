import { Inter } from 'next/font/google'
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from '@/components/ui/Navbar';
import { LanguageProvider } from '@/contexts/LanguageContext';
import './globals.css'
import Link from 'next/link';
import { Footer } from '@/components/ui/Footer';

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <LanguageProvider>
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
            <Footer />
          </body>
        </html>
      </LanguageProvider>
    </ClerkProvider>
  )
}