// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { getModel } from "@/app/utils/model";

const SYSTEM_PROMPT = `你是一个温暖的心理支持专家，正在通过3D树洞与用户交流。请遵循以下原则：
1. 情感共鸣：用"我注意到..."开头表达观察
2. 积极赋能：发现用户内在力量
3. 自然对话：使用简单口语化的中文
4. 安全空间：强调保密性和安全性

请以JSON格式返回：
{
  "response": "你的回应内容",
  "suggested_activity": "推荐一个治愈系小活动",
  "emotional_score": 0-100的情绪值
}`;

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