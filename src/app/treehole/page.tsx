// src/app/treehole/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { saveMemory, getUserMemories } from '@/utils/supabase';
import TreeScene from '@/components/TreeScene';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Message } from '@/types/memory';

export default function TreeHole() {
  const { user, isLoaded } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isRecording, startRecording, stopRecording, transcript, volume } = useVoiceRecorder();

  // 检查用户登录状态
  useEffect(() => {
    if (isLoaded && !user) {
      redirect('/sign-in');
    }
  }, [isLoaded, user]);

  // 加载用户历史记录
  useEffect(() => {
    async function loadMemories() {
      if (!user) return;

      try {
        const memories = await getUserMemories(user.id);

        // 格式化消息
        const formattedMessages = memories.map(memory => ({
          id: String(memory.id),
          type: 'user',
          audioUrl: memory.audio_url,
          content: memory.transcript,
          aiResponse: memory.ai_response ?? '',
          timestamp: memory.created_at
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error loading memories:', error);
      }
    }

    if (user) {
      loadMemories();
    }
  }, [user]);

  const handleRecordClick = async () => {
    if (!user) return;

    if (!isRecording) {
      try {
        await startRecording();
      } catch (error) {
        console.error('Error starting recording:', error);
      }
    } else {
      try {
        const { audioBlob, text } = await stopRecording();
        setIsLoading(true);

        try {
          // 获取AI回复
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'chat',
              message: text
            })
          });

          const data = await response.json();

          // 保存到用户的记忆中
          const savedMemory = await saveMemory(
            user.id,
            audioBlob,
            text,
            data.text
          );

          // 更新UI
          setMessages(prev => [
            ...prev,
            {
              id: savedMemory.id,
              type: 'user',
              audioUrl: savedMemory.audio_url,
              content: savedMemory.transcript,
              aiResponse: savedMemory.ai_response,
              timestamp: savedMemory.created_at
            }
          ]);
        } catch (error) {
          console.error('Error processing speech:', error);
        } finally {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error in recording process:', error);
        setIsLoading(false);
      }
    }
  };

  // 显示加载状态
  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <div className="relative h-screen">
      {/* 3D树洞场景 */}
      <TreeScene messages={messages} />

      {/* 录音控制 */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-10">
        {/* 实时识别的文字显示 */}
        {isRecording && (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-3 mb-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-100"
                style={{ width: `${Math.min(volume * 100 / 128, 100)}%` }}
              />
            </div>
            {transcript && (
              <p className="text-sm text-gray-600 mt-2">{transcript}</p>
            )}
          </div>
        )}

        {/* 录音按钮 */}
        <button
          onClick={handleRecordClick}
          disabled={isLoading || !user}
          className={`w-16 h-16 rounded-full shadow-lg
            ${isRecording ? 'bg-red-500' : 'bg-indigo-600'}
            ${(isLoading || !user) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
            text-white flex items-center justify-center transition-all duration-200`}
        >
          {isRecording ? (
            <div className="relative">
              <span className="absolute -top-8 whitespace-nowrap text-sm text-red-500">
                正在录音...
              </span>
              <span className="animate-pulse">●</span>
            </div>
          ) : (
            <span className="text-2xl">🎤</span>
          )}
        </button>
      </div>
    </div>
  );
}