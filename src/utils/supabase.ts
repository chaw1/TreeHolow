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
  audioBlob: Blob,
  transcript: string,
  aiResponse: string
): Promise<Memory> {
  try {
    const audioFileName = `${userId}/${Date.now()}.webm`;
    const { data: audioData, error: audioError } = await supabase.storage
      .from('audio-memories')
      .upload(audioFileName, audioBlob);

    if (audioError) throw audioError;

    const { data, error } = await supabase
      .from('user_memories')
      .insert([
        {
          user_id: userId,
          audio_url: audioData?.path,
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

export async function getUserMemories(userId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('user_memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}