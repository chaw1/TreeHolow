import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { createClient } from '@supabase/supabase-js';

// 使用服务角色密钥创建Supabase客户端，绕过RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 允许跨域请求以支持开发环境和生产环境之间的调用
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    // 为响应设置CORS头
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 验证用户 - 只有登录用户可以获取签名URL
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { 
        status: 401,
        headers
      });
    }

    // 获取文件路径
    const url = new URL(request.url);
    const path = url.searchParams.get('path');
    
    if (!path) {
      return NextResponse.json({ error: "缺少文件路径" }, { 
        status: 400,
        headers
      });
    }

    // 安全检查 - 确保路径中包含当前用户ID或是合法的管理员请求
    // 如果不是请求自己的文件，进行权限检查
    const pathUserId = path.split('/')[0];
    const isRequestingOwnFile = pathUserId.includes(userId) || userId.includes(pathUserId);
    
    if (!isRequestingOwnFile) {
      // 此处可添加管理员检查逻辑
      // 如果不是管理员且不是请求自己的文件，拒绝请求
      console.log(`用户 ${userId} 尝试访问其他用户 ${pathUserId} 的文件`);
      return NextResponse.json({ error: "无权访问此文件" }, { 
        status: 403,
        headers
      });
    }

    // 生成签名URL，有效期30分钟
    const { data, error } = await supabaseAdmin.storage
      .from('audio-memories')
      .createSignedUrl(path, 1800);

    if (error) {
      console.error("生成签名URL错误:", error);
      return NextResponse.json({ error: error.message }, { 
        status: 500,
        headers
      });
    }

    return NextResponse.json({ url: data.signedUrl }, { headers });
  } catch (error: any) {
    console.error("生成签名URL失败:", error);
    return NextResponse.json(
      { error: error?.message || "未知错误" }, 
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        } 
      }
    );
  }
}