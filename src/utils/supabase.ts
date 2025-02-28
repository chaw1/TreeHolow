import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Memory {
  id: string;
  user_id: string;
  audio_url: string;
  transcript: string;
  ai_response: string;
  created_at: string;
}

export async function saveMemory(
  userId: string,
  audioBlob: Blob | null,
  transcript: string,
  aiResponse: string
): Promise<Memory> {
  try {
    // 音频URL (可能是null或base64数据URL或存储路径)
    let audioUrl = null;
    
    // 如果有音频文件，则上传到Supabase存储
    if (audioBlob) {
      // 检查是否为dataURL (即以data:开头的base64编码)
      if (typeof audioBlob === 'string' && audioBlob.startsWith('data:')) {
        // 已经是data URL，直接使用
        audioUrl = audioBlob;
      } else {
        // 正常的Blob对象，上传到Supabase Storage
        const audioFileName = `${userId}/${Date.now()}.webm`;
        const { data: audioData, error: audioError } = await supabase.storage
          .from('audio-memories')
          .upload(audioFileName, audioBlob);
  
        if (audioError) {
          console.error('Error uploading audio:', audioError);
          // 不抛出异常，继续处理记忆保存
        } else {
          audioUrl = audioData?.path || null;
        }
      }
    }

    // 插入记忆数据
    const { data, error } = await supabase
      .from('user_memories')
      .insert([
        {
          user_id: userId,
          audio_url: audioUrl,
          transcript,
          ai_response: aiResponse
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving memory:', error);
    throw error;
  }
}

// 获取音频文件的公共URL
export function getAudioPublicUrl(path: string): string {
  // 确保路径正确格式化
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // 获取公共URL
  const { data } = supabase.storage
    .from('audio-memories')
    .getPublicUrl(cleanPath);
    
  // 添加下载参数以避免CORS/内容类型问题
  return `${data.publicUrl}?download=true`;
}

export async function getUserMemories(userId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('user_memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}