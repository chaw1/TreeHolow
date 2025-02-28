import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabaseServer";

/**
 * 获取单个日记详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const supabase = createClient();
    const diaryId = params.id;

    // 查询日记详情
    const { data: diary, error } = await supabase
      .from("user_diaries")
      .select("*")
      .eq("id", diaryId)
      .eq("user_id", userId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "获取日记失败" },
        { status: error.code === "PGRST116" ? 404 : 500 }
      );
    }

    return NextResponse.json({ diary });
  } catch (error: any) {
    console.error("获取日记详情出错:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

/**
 * 删除日记
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const supabase = createClient();
    const diaryId = params.id;

    // 先检查日记是否存在且属于当前用户
    const { data: diary, error: checkError } = await supabase
      .from("user_diaries")
      .select("id")
      .eq("id", diaryId)
      .eq("user_id", userId)
      .single();

    if (checkError) {
      return NextResponse.json(
        { error: "日记不存在或无权限" },
        { status: checkError.code === "PGRST116" ? 404 : 403 }
      );
    }

    // 删除日记
    const { error } = await supabase
      .from("user_diaries")
      .delete()
      .eq("id", diaryId)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json(
        { error: "删除日记失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("删除日记出错:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

/**
 * 更新日记
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, mood, tags, location, weather } = body;
    const diaryId = params.id;

    // 验证必填字段
    if (!title || !content) {
      return NextResponse.json(
        { error: "标题和内容不能为空" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 先检查日记是否存在且属于当前用户
    const { data: diary, error: checkError } = await supabase
      .from("user_diaries")
      .select("id")
      .eq("id", diaryId)
      .eq("user_id", userId)
      .single();

    if (checkError) {
      return NextResponse.json(
        { error: "日记不存在或无权限" },
        { status: checkError.code === "PGRST116" ? 404 : 403 }
      );
    }

    // 更新日记
    const { data, error } = await supabase
      .from("user_diaries")
      .update({
        title,
        content,
        mood,
        tags,
        location,
        weather,
        updated_at: new Date().toISOString(),
      })
      .eq("id", diaryId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "更新日记失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ diary: data });
  } catch (error: any) {
    console.error("更新日记出错:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}