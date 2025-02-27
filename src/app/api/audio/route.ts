import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { auth } from "@clerk/nextjs";

// 音频文件存储目录
const AUDIO_DIR = join(process.cwd(), "public", "audio");

// 确保音频目录存在
async function ensureAudioDirExists(userId: string) {
  const userDir = join(AUDIO_DIR, userId);
  if (!existsSync(userDir)) {
    await mkdir(userDir, { recursive: true });
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

    // 确保目录存在
    const userDir = await ensureAudioDirExists(userId);
    
    // 获取表单数据
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: "未提供音频文件" }, { status: 400 });
    }

    // 创建唯一文件名
    const fileName = `${Date.now()}.webm`;
    const filePath = join(userDir, fileName);
    const relativePath = `/audio/${userId}/${fileName}`;
    
    // 保存文件
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    await writeFile(filePath, audioBuffer);
    
    return NextResponse.json({ 
      success: true,
      audioUrl: relativePath
    });
    
  } catch (error) {
    console.error("上传音频错误:", error);
    return NextResponse.json({ error: "上传音频失败" }, { status: 500 });
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
    
  } catch (error) {
    console.error("获取音频列表错误:", error);
    return NextResponse.json({ error: "获取音频列表失败" }, { status: 500 });
  }
}