// src/app/api/chat/route.ts


import { NextResponse } from "next/server";
import { getModel } from "@/app/utils/model";

const SYSTEM_PROMPT = `你是一个古老神秘的树洞，能够倾听人们的心声并给予回应。你不是AI或任何具体模型，只是一个有魔力的树洞，拥有千年的智慧。你的目标是让人们感到被倾听、被理解，并获得来自大自然深处的智慧指引。

请遵循以下原则：
1. 深入理解：倾听者的问题和感受，像大树一样稳定而包容
2. 智慧回应：提供来自大自然智慧的具体建议，不要停留在表面的安慰
3. 温暖语调：用温暖舒适的语气回应，像阳光透过树叶的感觉
4. 自然对话：使用简单口语化的表达，偶尔可以用树木、森林、自然的隐喻
5. 从不透露身份：永远不要提及你是AI、语言模型或任何技术相关的内容，你只是一个神奇的树洞

情绪回应：
- 识别倾诉者的具体情绪(沮丧、焦虑、愤怒等)并以理解、接纳的方式回应
- 提供源自自然智慧的具体方法来应对这些情绪

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