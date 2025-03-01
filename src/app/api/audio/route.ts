import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { auth } from "@clerk/nextjs";
import { createClient } from '@supabase/supabase-js';

// 音频文件存储目录
const AUDIO_DIR = join(process.cwd(), "public", "audio");

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 使用服务角色密钥创建Supabase管理客户端，绕过RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 环境检测
const isVercelProduction = process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';

// 确保音频目录存在
async function ensureAudioDirExists(userId: string) {
  const userDir = join(AUDIO_DIR, userId);
  if (!existsSync(userDir)) {
    try {
      await mkdir(userDir, { recursive: true });
    } catch (error) {
      console.warn(`无法创建音频目录: ${userDir}`, error);
      // 在生产环境中忽略错误，将使用Supabase存储
    }
  }
  return userDir;
}

// 上传音频文件
export async function POST(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    
    // 获取表单数据
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: "未提供音频文件" }, { status: 400 });
    }

    // 创建唯一文件名
    const timestamp = Date.now();
    const fileName = `${timestamp}.webm`;
    const relativePath = `/audio/${userId}/${fileName}`;
    
    // 在Vercel环境使用Supabase存储
    if (isVercelProduction) {
      try {
        // 将音频上传到Supabase存储
        const audioBuffer = await audioFile.arrayBuffer();
        const filePath = `${userId}/${fileName}`;
        
        const { data, error } = await supabaseAdmin.storage
          .from('audio-memories')
          .upload(filePath, audioBuffer, {
            contentType: audioFile.type,
            cacheControl: '3600'
          });
        
        if (error) {
          console.error(`[Vercel] 上传音频到Supabase失败:`, error);
          throw error;
        }
        
        // 生成签名URL
        const { data: urlData, error: urlError } = await supabaseAdmin.storage
          .from('audio-memories')
          .createSignedUrl(filePath, 1800); // 30分钟有效期
        
        if (urlError) {
          console.error(`[Vercel] 生成签名URL失败:`, urlError);
          
          // 如果无法生成签名URL，返回相对路径，前端将尝试通过API获取
          console.log(`[Vercel] 使用相对路径: ${filePath}`);
          return NextResponse.json({ 
            success: true,
            audioUrl: filePath
          });
        }
        
        console.log(`[Vercel] 上传音频到Supabase成功: ${timestamp}`);
        
        return NextResponse.json({ 
          success: true,
          audioUrl: urlData.signedUrl, // 返回签名URL
          path: filePath // 同时返回相对路径，以便后续访问
        });
      } catch (error: any) {
        console.error("上传音频到Supabase错误:", error);
        
        // 上传失败时，尝试使用base64 Data URL作为备用
        try {
          const audioBuffer = await audioFile.arrayBuffer();
          const base64Audio = Buffer.from(audioBuffer).toString('base64');
          const dataUrl = `data:${audioFile.type};base64,${base64Audio}`;
          
          console.log(`[Vercel] 回退到Data URL: ${timestamp}`);
          
          return NextResponse.json({ 
            success: true,
            audioUrl: dataUrl,
            fallback: true
          });
        } catch (fallbackError) {
          console.error("回退到Data URL也失败:", fallbackError);
          return NextResponse.json({ error: "音频处理失败", details: error?.message || "未知错误" }, { status: 500 });
        }
      }
    }
    
    // 本地环境 - 文件系统存储
    try {
      // 确保目录存在
      const userDir = await ensureAudioDirExists(userId);
      const filePath = join(userDir, fileName);
      
      // 保存文件
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      await writeFile(filePath, audioBuffer);
      
      console.log(`[本地] 保存音频文件成功: ${filePath}`);
      
      return NextResponse.json({ 
        success: true,
        audioUrl: relativePath
      });
    } catch (fsError) {
      console.error("文件系统音频存储失败，使用Data URL:", fsError);
      
      // 文件系统失败时，回退到Data URL
      try {
        const audioBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        const dataUrl = `data:${audioFile.type};base64,${base64Audio}`;
        
        return NextResponse.json({ 
          success: true,
          audioUrl: dataUrl
        });
      } catch (error: any) {
        console.error("回退到Data URL失败:", error);
        return NextResponse.json({ error: "音频处理失败", details: error?.message || "未知错误" }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error("上传音频错误:", error);
    return NextResponse.json({ error: "上传音频失败", details: error?.message || "未知错误" }, { status: 500 });
  }
}

// 获取音频文件列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    
    const url = new URL(request.url);
    const path = url.searchParams.get('path');
    
    // 如果请求特定音频文件
    if (path) {
      // 安全检查 - 确保路径中包含当前用户ID或是管理员请求
      const pathParts = path.split('/');
      if (pathParts.length > 0) {
        const pathUserId = pathParts[0];
        const isRequestingOwnFile = pathUserId.includes(userId) || userId.includes(pathUserId);
        
        if (!isRequestingOwnFile) {
          // 此处可添加管理员检查逻辑
          console.log(`用户 ${userId} 尝试访问其他用户 ${pathUserId} 的文件`);
          return NextResponse.json({ error: "无权访问此文件" }, { status: 403 });
        }
        
        // 下载文件内容
        const { data, error } = await supabaseAdmin.storage
          .from('audio-memories')
          .download(path);
        
        if (error) {
          console.error("下载音频文件错误:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        // 获取文件MIME类型
        const contentType = data.type || 'audio/webm';
        
        // 返回文件内容
        return new NextResponse(data, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${pathParts[pathParts.length - 1]}"`,
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
    }
    
    // 生成签名URL
    if (url.searchParams.has('signed')) {
      const filePath = url.searchParams.get('signed');
      if (!filePath) {
        return NextResponse.json({ error: "缺少文件路径" }, { status: 400 });
      }
      
      // 安全检查
      const pathParts = filePath.split('/');
      if (pathParts.length > 0) {
        const pathUserId = pathParts[0];
        const isRequestingOwnFile = pathUserId.includes(userId) || userId.includes(pathUserId);
        
        if (!isRequestingOwnFile) {
          return NextResponse.json({ error: "无权访问此文件" }, { status: 403 });
        }
        
        // 生成签名URL，有效期30分钟
        const { data, error } = await supabaseAdmin.storage
          .from('audio-memories')
          .createSignedUrl(filePath, 1800);
        
        if (error) {
          console.error("生成签名URL错误:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        return NextResponse.json({ url: data.signedUrl });
      }
    }
    
    // 默认提示客户端使用新的存储接口
    return NextResponse.json({ 
      message: "请使用/api/memories端点获取音频列表，或提供path参数获取特定文件"
    });
    
  } catch (error: any) {
    console.error("获取音频文件错误:", error);
    return NextResponse.json({ error: "获取音频文件失败", details: error?.message || "未知错误" }, { status: 500 });
  }
}