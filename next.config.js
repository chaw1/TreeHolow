/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
    // 避免使用 Edge Runtime
    runtime: 'nodejs'
  },
  // 添加 Clerk 配置
  clerk: {
    // 禁用 Edge Runtime
    edge: false
  },
  // 禁用特定页面的 Edge Runtime
  runtime: 'nodejs',
  // webpack 配置
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    // 添加 fallback 以解决 scheduler.production.min.js 中使用 setImmediate 的问题
    config.resolve.fallback = {
      ...config.resolve.fallback,
      scheduler: false
    }
    return config
  }
}