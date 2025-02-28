// src/app/treehole/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { saveMemory, getUserMemories } from '@/utils/storage';
import TreeScene from '@/components/TreeScene';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Memory, Message } from '@/types/memory';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TreeHole() {
  const { user, isLoaded } = useUser();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isTextMode, setIsTextMode] = useState(false);
  
  const { 
    isRecording, 
    isPressRecording,
    startRecording, 
    stopRecording, 
    startPressRecording,
    transcript, 
    volume,
    recordingMode,
    toggleRecordingMode
  } = useVoiceRecorder();
  
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const treeSceneRef = useRef<{ setSelectedMemory: (memory: Memory | null) => void } | null>(null);

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

        // 消息已经格式化，直接使用
        const formattedMessages = memories.map(memory => ({
          id: String(memory.id),
          type: 'user',
          audioUrl: memory.audioUrl,
          content: memory.content,
          aiResponse: memory.aiResponse ?? '',
          timestamp: memory.timestamp
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

  // 处理文本输入变化
  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  };

  // 处理文本提交
  const handleTextSubmit = async () => {
    if (!user || !textInput.trim() || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // 获取AI回复
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          message: textInput
        })
      });

      const data = await response.json();

      // 保存到用户的记忆中
      const savedMemory = await saveMemory(
        user.id,
        null, // 没有音频
        textInput,
        data.text
      );

      // 创建新记忆对象
      const newMemory = {
        id: savedMemory.id,
        type: 'user',
        content: savedMemory.content,
        aiResponse: savedMemory.aiResponse,
        timestamp: savedMemory.timestamp
      };
      
      // 更新UI
      setMessages(prev => [...prev, newMemory]);
      
      // 显示AI回应对话框
      setSelectedMemory(newMemory);
      
      // 清空输入框
      setTextInput('');
    } catch (error) {
      console.error('Error processing text input:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理录音按钮点击
  const handleRecordClick = async () => {
    if (!user || isLoading) return;

    if (recordingMode === 'toggle') {
      // 点击式录音（开始/停止）
      if (!isRecording) {
        try {
          await startRecording();
        } catch (error) {
          console.error('Error starting recording:', error);
        }
      } else {
        processRecording();
      }
    } else {
      // 按住式录音已经在处理按下/释放事件
    }
  };

  // 处理按住开始录音
  const handleRecordPress = async () => {
    if (!user || isLoading || recordingMode !== 'press') return;
    
    try {
      await startPressRecording();
    } catch (error) {
      console.error('Error on press recording:', error);
    }
  };

  // 处理释放结束录音
  const handleRecordRelease = async () => {
    if (!user || isLoading || recordingMode !== 'press' || !isPressRecording) return;
    
    processRecording();
  };

  // 处理录音处理和AI响应
  const processRecording = async () => {
    try {
      const { audioBlob, text } = await stopRecording();
      
      // 如果文本为空，不进行处理
      if (!text.trim()) {
        console.log('Empty transcription, ignoring...');
        return;
      }
      
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

        // 创建新记忆对象
        const newMemory = {
          id: savedMemory.id,
          type: 'user',
          audioUrl: savedMemory.audioUrl,
          content: savedMemory.content,
          aiResponse: savedMemory.aiResponse,
          timestamp: savedMemory.timestamp
        };
        
        // 更新UI
        setMessages(prev => [...prev, newMemory]);
        
        // 显示AI回应对话框
        setSelectedMemory(newMemory);
      } catch (error) {
        console.error('Error processing speech:', error);
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error in recording process:', error);
      setIsLoading(false);
    }
  };

  // 切换输入模式
  const toggleInputMode = () => {
    setIsTextMode(!isTextMode);
    if (!isTextMode) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  };

  // 显示加载状态
  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <div className="relative h-screen">
      {/* 3D树洞场景 */}
      <TreeScene 
        messages={messages}
        selectedMemory={selectedMemory}
        onSelectMemory={setSelectedMemory}
      />

      {/* 输入控制区域 */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-10 w-full max-w-md px-4">
        {/* 实时识别的文字显示 */}
        {(isRecording || isPressRecording) && (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-3 mb-2 w-full">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-100"
                style={{ width: `${Math.min(volume * 100 / 128, 100)}%` }}
              />
            </div>
            {transcript && (
              <p className="text-sm text-gray-600 mt-2 max-h-24 overflow-y-auto">{transcript}</p>
            )}
          </div>
        )}

        {/* 文本输入区域 */}
        {isTextMode && (
          <div className="w-full bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-3 mb-0">
            <textarea
              ref={textInputRef}
              value={textInput}
              onChange={handleTextInputChange}
              placeholder="在此输入你的心声..."
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleTextSubmit}
                disabled={isLoading || !textInput.trim()}
                className={`px-4 py-2 bg-indigo-600 text-white rounded-md ${
                  isLoading || !textInput.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
                }`}
              >
                {isLoading ? '发送中...' : '发送'}
              </button>
            </div>
          </div>
        )}

        {/* 底部控制栏 */}
        <div className="flex items-center gap-4 w-full justify-center">
          {/* 切换输入模式按钮 */}
          <button
            onClick={toggleInputMode}
            className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-100"
          >
            <span className="text-xl">{isTextMode ? '🎤' : '📝'}</span>
          </button>

          {/* 录音按钮 - 仅在语音模式显示 */}
          {!isTextMode && (
            <>
              {/* 按住录音模式切换按钮 */}
              <button
                onClick={toggleRecordingMode}
                className="w-10 h-10 rounded-full bg-gray-100 shadow-md flex items-center justify-center hover:bg-gray-200 text-xs"
              >
                {recordingMode === 'toggle' ? '点击' : '按住'}
              </button>
              
              {/* 录音按钮 */}
              <button
                onClick={handleRecordClick}
                onMouseDown={handleRecordPress}
                onMouseUp={handleRecordRelease}
                onTouchStart={handleRecordPress}
                onTouchEnd={handleRecordRelease}
                disabled={isLoading || !user}
                className={`w-16 h-16 rounded-full shadow-lg
                  ${(isRecording || isPressRecording) ? 'bg-red-500' : 'bg-indigo-600'}
                  ${(isLoading || !user) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
                  text-white flex items-center justify-center transition-all duration-200`}
              >
                {(isRecording || isPressRecording) ? (
                  <div className="relative">
                    <span className="absolute -top-8 whitespace-nowrap text-sm text-red-500">
                      {recordingMode === 'toggle' ? '点击停止' : '松开结束'}
                    </span>
                    <span className="animate-pulse">●</span>
                  </div>
                ) : (
                  <span className="text-2xl">🎤</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}