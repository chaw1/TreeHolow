// src/app/api/interact/route.ts
import { NextResponse } from "next/server";
import { getModel } from "@/app/utils/model";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const model = getModel();
    
    const response = await model.call(message);

    return NextResponse.json({
      text: response
    });

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "处理消息时出错了" },
      { status: 500 }
    );
  }
}