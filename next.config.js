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
  // 禁用 Edge Runtime，强制使用 Node.js
  runtime: 'nodejs',
  // 设置为只使用Node.js运行时，不使用Edge运行时
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  },
  // 禁用构建时的警告转错误功能
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 跳过类型检查以加速构建
  typescript: {
    ignoreBuildErrors: true,
  },
  // 忽略对构建的一些警告
  onDemandEntries: {
    // 扩大缓存时间防止频繁重新生成
    maxInactiveAge: 25 * 1000,
    // 增加同时缓存的页面数
    pagesBufferLength: 5,
  },
  // webpack 配置
  webpack: (config, { isServer }) => {
    // 排除外部包
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    
    // 添加polyfill以解决setImmediate问题
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.fallback) {
      config.resolve.fallback = {};
    }
    
    // 提供 polyfill
    config.resolve.fallback = {
      ...config.resolve.fallback,
      timers: require.resolve('timers-browserify'),
      punycode: false,
    };

    // 对于客户端构建，创建一个特殊的处理方式
    if (!isServer) {
      // 替换 scheduler 路径解析
      config.resolve.alias = {
        ...config.resolve.alias,
        'scheduler': require.resolve('scheduler'),
      };
    }

    return config
  }
}