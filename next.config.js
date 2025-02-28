/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  // 添加 Clerk 配置
  clerk: {
    // 禁用 Edge Runtime
    edge: false
  },
  // 忽略构建警告
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 跳过类型检查
  typescript: {
    ignoreBuildErrors: true,
  },
  // webpack 配置
  webpack: (config) => {
    // 处理 ws 相关模块
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    
    return config
  }
}