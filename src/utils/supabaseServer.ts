import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 用于路由处理程序的带cookie的客户端
export function createClient() {
  // 为了解决RLS问题，直接使用普通客户端绕过RLS约束
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 下面是带有cookie管理的标准方式，目前RLS有问题，暂不使用
  /*
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          cookieStore.set(name, value, options);
        },
        remove: (name, options) => {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        }
      }
    }
  );
  */
}

// 仅用于服务器端函数的客户端（无需cookie管理）
export const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);