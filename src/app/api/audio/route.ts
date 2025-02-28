import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { auth } from "@clerk/nextjs";

// 音频文件存储目录
const AUDIO_DIR = join(process.cwd(), "public", "audio");

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
      // 在生产环境中忽略错误，将使用base64存储
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
    
    // 在Vercel环境使用Base64 URL
    if (isVercelProduction) {
      try {
        // 将音频转换为base64编码的Data URL
        const audioBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        const dataUrl = `data:${audioFile.type};base64,${base64Audio}`;
        
        console.log(`[Vercel] 创建音频Data URL成功: ${timestamp}`);
        
        return NextResponse.json({ 
          success: true,
          audioUrl: dataUrl
        });
      } catch (error: any) {
        console.error("生成音频Data URL错误:", error);
        return NextResponse.json({ error: "音频处理失败", details: error?.message || "未知错误" }, { status: 500 });
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
    
    // 提示客户端使用新的存储接口
    return NextResponse.json({ 
      message: "请使用/api/memories端点获取音频列表"
    });
    
  } catch (error: any) {
    console.error("获取音频列表错误:", error);
    return NextResponse.json({ error: "获取音频列表失败", details: error?.message || "未知错误" }, { status: 500 });
  }
}