import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { auth } from "@clerk/nextjs";

// 记忆存储目录
const MEMORY_DIR = join(process.cwd(), "data", "memories");
const AUDIO_DIR = join(process.cwd(), "public", "audio");

// 确保目录存在
async function ensureDirectoryExists(path: string) {
  if (!existsSync(path)) {
    await mkdir(path, { recursive: true });
  }
  return path;
}

// 内存中保存用户记忆
export async function POST(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 解析请求数据
    const data = await request.json();
    const { transcript, aiResponse } = data;
    // 确保audioUrl有值，即使是空字符串
    const audioUrl = data.audioUrl || "";

    if (!transcript) {
      return NextResponse.json({ error: "记忆内容不能为空" }, { status: 400 });
    }

    // 确保用户目录存在
    const userDir = await ensureDirectoryExists(join(MEMORY_DIR, userId));
    
    // 创建新记忆
    const memory = {
      id: Date.now().toString(),
      content: transcript,
      aiResponse: aiResponse || "",
      audioUrl: audioUrl || "",
      timestamp: new Date().toISOString(),
      userId
    };
    
    // 读取现有记忆
    let memories = [];
    const memoriesPath = join(userDir, "memories.json");
    
    if (existsSync(memoriesPath)) {
      const fileData = await readFile(memoriesPath, "utf-8");
      memories = JSON.parse(fileData);
    }
    
    // 添加新记忆
    memories.push(memory);
    
    // 保存记忆
    await writeFile(memoriesPath, JSON.stringify(memories, null, 2));
    
    return NextResponse.json({ success: true, memory });
    
  } catch (error) {
    console.error("保存记忆错误:", error);
    return NextResponse.json({ error: "保存记忆失败" }, { status: 500 });
  }
}

// 获取用户记忆
export async function GET(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    
    // 用户记忆路径
    const userDir = join(MEMORY_DIR, userId);
    const memoriesPath = join(userDir, "memories.json");
    
    // 如果文件不存在，返回空数组
    if (!existsSync(memoriesPath)) {
      return NextResponse.json({ memories: [] });
    }
    
    // 读取记忆
    const fileData = await readFile(memoriesPath, "utf-8");
    const memories = JSON.parse(fileData);
    
    return NextResponse.json({ memories });
    
  } catch (error) {
    console.error("获取记忆错误:", error);
    return NextResponse.json({ error: "获取记忆失败" }, { status: 500 });
  }
}