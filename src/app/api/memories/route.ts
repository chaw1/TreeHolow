import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { auth } from "@clerk/nextjs";

// 记忆存储目录
const MEMORY_DIR = join(process.cwd(), "data", "memories");
const AUDIO_DIR = join(process.cwd(), "public", "audio");

// 内存中临时存储记忆 - 用于Vercel环境
const memoryStore = new Map<string, any[]>();

// 环境检测
const isVercelProduction = process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';

// 确保目录存在
async function ensureDirectoryExists(path: string) {
  if (!existsSync(path)) {
    try {
      await mkdir(path, { recursive: true });
    } catch (error) {
      console.warn(`无法创建目录: ${path}`, error);
      // 在生产环境中忽略错误，使用内存存储
    }
  }
  return path;
}

// 保存用户记忆
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

    // 创建新记忆
    const memory = {
      id: Date.now().toString(),
      content: transcript,
      aiResponse: aiResponse || "",
      audioUrl: audioUrl || "",
      timestamp: new Date().toISOString(),
      userId
    };

    // 在Vercel环境使用内存存储
    if (isVercelProduction) {
      // 获取或创建用户记忆数组
      if (!memoryStore.has(userId)) {
        memoryStore.set(userId, []);
      }
      
      // 添加新记忆
      const userMemories = memoryStore.get(userId) || [];
      userMemories.push(memory);
      memoryStore.set(userId, userMemories);
      
      console.log(`[Vercel] 内存中保存记忆成功: ${memory.id}`);
      
      return NextResponse.json({ success: true, memory });
    }
    
    // 本地环境 - 文件系统存储
    try {
      // 确保用户目录存在
      const userDir = await ensureDirectoryExists(join(MEMORY_DIR, userId));
      
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
      
      console.log(`[本地] 文件中保存记忆成功: ${memory.id}`);
      
      return NextResponse.json({ success: true, memory });
    } catch (fsError) {
      console.error("文件系统存储失败，使用内存存储:", fsError);
      
      // 文件系统失败时，回退到内存存储
      if (!memoryStore.has(userId)) {
        memoryStore.set(userId, []);
      }
      
      // 添加新记忆
      const userMemories = memoryStore.get(userId) || [];
      userMemories.push(memory);
      memoryStore.set(userId, userMemories);
      
      return NextResponse.json({ success: true, memory });
    }
  } catch (error) {
    console.error("保存记忆错误:", error);
    return NextResponse.json({ error: "保存记忆失败", details: error.message }, { status: 500 });
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
    
    // 在Vercel环境使用内存存储
    if (isVercelProduction) {
      const userMemories = memoryStore.get(userId) || [];
      console.log(`[Vercel] 内存中读取记忆: ${userMemories.length}条`);
      return NextResponse.json({ memories: userMemories });
    }
    
    // 本地环境 - 尝试文件系统存储，如果失败回退到内存
    try {
      // 用户记忆路径
      const userDir = join(MEMORY_DIR, userId);
      const memoriesPath = join(userDir, "memories.json");
      
      // 如果文件不存在，返回空数组或内存中存储的内容
      if (!existsSync(memoriesPath)) {
        const memoryBackup = memoryStore.get(userId) || [];
        console.log(`[本地] 记忆文件不存在，使用内存备份: ${memoryBackup.length}条`);
        return NextResponse.json({ memories: memoryBackup });
      }
      
      // 读取记忆
      const fileData = await readFile(memoriesPath, "utf-8");
      const memories = JSON.parse(fileData);
      console.log(`[本地] 文件中读取记忆: ${memories.length}条`);
      
      return NextResponse.json({ memories });
    } catch (fsError) {
      console.error("文件系统读取失败，使用内存备份:", fsError);
      const memoryBackup = memoryStore.get(userId) || [];
      return NextResponse.json({ memories: memoryBackup });
    }
  } catch (error) {
    console.error("获取记忆错误:", error);
    return NextResponse.json({ error: "获取记忆失败", details: error.message }, { status: 500 });
  }
}