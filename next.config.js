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
  // 禁用特定页面的 Edge Runtime
  runtime: 'nodejs',
  // 设置为只使用Node.js运行时，不使用Edge运行时
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  },
  // webpack 配置
  webpack: (config) => {
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
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      timers: require.resolve('timers-browserify')
    };

    return config
  }
}