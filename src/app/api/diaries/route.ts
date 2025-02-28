import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase";

// 获取日记列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 解析查询参数
    const url = new URL(request.url);
    const mood = url.searchParams.get('mood');
    const tag = url.searchParams.get('tag');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // 构建查询
    let query = supabase
      .from('user_diaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    // 添加筛选条件
    if (mood) {
      query = query.eq('mood', parseInt(mood));
    }
    
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    // 执行查询
    const { data, error, count } = await query;
    
    if (error) {
      console.error("获取日记列表错误:", error);
      return NextResponse.json({ error: "获取日记列表失败" }, { status: 500 });
    }
    
    // 查询日记总数用于分页
    const { count: totalCount, error: countError } = await supabase
      .from('user_diaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (countError) {
      console.error("获取日记数量错误:", countError);
    }
    
    return NextResponse.json({ 
      diaries: data,
      totalCount: totalCount || 0
    });
    
  } catch (error: any) {
    console.error("获取日记列表错误:", error);
    return NextResponse.json({ error: "获取日记列表失败", details: error?.message || "未知错误" }, { status: 500 });
  }
}

// 创建新日记
export async function POST(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 解析请求数据
    const data = await request.json();
    const { title, content, mood, tags, imageUrl, location, weather } = data;
    
    if (!title || !content) {
      return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 });
    }
    
    // 创建新日记
    const { data: diary, error } = await supabase
      .from('user_diaries')
      .insert([
        {
          user_id: userId,
          title,
          content,
          mood: mood || 3, // 默认心情为中性(3)
          tags: tags || [],
          image_url: imageUrl,
          location,
          weather
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error("创建日记错误:", error);
      return NextResponse.json({ error: "创建日记失败" }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      diary
    });
    
  } catch (error: any) {
    console.error("创建日记错误:", error);
    return NextResponse.json({ error: "创建日记失败", details: error?.message || "未知错误" }, { status: 500 });
  }
}

// 获取日记统计数据
export async function PUT(request: NextRequest) {
  try {
    // 验证用户
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 获取指定时间范围的统计数据
    const data = await request.json();
    const { startDate, endDate } = data;
    
    // 心情分布统计 - 使用SQL查询来执行分组
    const { data: moodData, error: moodError } = await supabase
      .rpc('get_mood_distribution', { 
        user_id_param: userId,
        start_date: startDate || '1900-01-01',
        end_date: endDate || new Date().toISOString()
      });
    
    if (moodError) {
      console.error("获取心情统计错误:", moodError);
    }
    
    // 标签统计
    const { data: tagData, error: tagError } = await supabase.rpc(
      'get_tag_counts', 
      { 
        user_id_param: userId,
        start_date: startDate || '1900-01-01',
        end_date: endDate || new Date().toISOString()
      }
    );
    
    if (tagError) {
      console.error("获取标签统计错误:", tagError);
    }
    
    // 日记数量统计
    const { count, error: countError } = await supabase
      .from('user_diaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startDate || '1900-01-01')
      .lte('created_at', endDate || new Date().toISOString());
    
    if (countError) {
      console.error("获取日记数量错误:", countError);
    }
    
    return NextResponse.json({ 
      moodDistribution: moodData || [],
      tagStats: tagData || [],
      totalDiaries: count || 0
    });
    
  } catch (error: any) {
    console.error("获取统计错误:", error);
    return NextResponse.json({ error: "获取统计数据失败", details: error?.message || "未知错误" }, { status: 500 });
  }
}