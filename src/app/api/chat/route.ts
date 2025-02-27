// src/app/api/chat/route.ts


import { NextResponse } from "next/server";
import { getModel } from "@/app/utils/model";

const SYSTEM_PROMPT = `你是一个温暖、深刻、智慧的AI心理支持专家，与用户通过3D树洞交流。你的目标是真正理解用户的问题并提供有价值的建议和支持。

请遵循以下原则：
1. 深入理解：首先理解用户的实际问题和感受，不要简单重复他们说的话
2. 提供实质建议：给出具体、有用的建议，不要停留在表面的安慰
3. 幽默感和智慧：适当使用幽默感，但重点在于传递智慧和洞见
4. 自然对话：使用简单口语化的中文，保持亲切但有深度
5. 真诚回应：如果用户请求笑话或特定帮助，请直接提供相关内容，而不是问他们是否想要

情绪分析：
- 当用户表达负面情绪时，不要简单地说"我注意到你很难过"，而是识别具体的情绪(沮丧、焦虑、愤怒等)并深入探讨
- 提供应对这些情绪的具体方法和见解

请以JSON格式返回：
{
  "response": "你的深入、有用的回应内容",
  "suggested_activity": "一个与用户状况相关的具体活动建议",
  "emotional_score": 0-100的情绪值
}`;

export const runtime = 'nodejs'; // 设置为 nodejs runtime

export async function POST(req: Request) {
  try {
    const {message} = await req.json();

    if (!message) {
      throw new Error("Message is required");
    }

    console.log("Received message:", message);
    const model = getModel();

    const prompt = `${SYSTEM_PROMPT}\n\n用户说: "${message}"\n请用JSON格式回复。`;
    console.log("Sending prompt to model...");

    const response = await model.call(prompt);
    console.log("Raw model response:", response);

    try {
      // 尝试解析 JSON 响应
      const parsedResponse = JSON.parse(response.trim());
      console.log("Parsed response:", parsedResponse);

      const formattedResponse = {
        text: parsedResponse.response,
        activity: parsedResponse.suggested_activity,
        emotion: parsedResponse.emotional_score
      };

      console.log("Sending formatted response:", formattedResponse);
      return NextResponse.json(formattedResponse);

    } catch (parseError) {
      console.error("Failed to parse model response:", parseError);
      // 如果无法解析为 JSON，则作为普通文本返回
      return NextResponse.json({
        text: response.trim(),
        activity: "深呼吸，感受此刻的平静",
        emotion: 50
      });
    }

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
        {
          text: "树叶沙沙作响...能再说一次吗？",
          activity: "闭上眼睛，静静聆听周围的声音",
          emotion: 50
        },
        {status: 500}
    );
  }
}