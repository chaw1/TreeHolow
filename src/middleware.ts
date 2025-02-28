// src/middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/api/(.*)"],
  debug: process.env.NODE_ENV === 'development'
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
  // 强制使用 Node.js 运行时，不使用 Edge Runtime
  runtime: 'nodejs',
  unstable_allowDynamic: [
    '**/node_modules/react-dom/node_modules/scheduler/cjs/scheduler.production.min.js',
    '**/node_modules/scheduler/**/*'
  ]
};