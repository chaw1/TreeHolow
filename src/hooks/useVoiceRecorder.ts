import { useState, useRef, useEffect } from 'react';

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPressRecording, setIsPressRecording] = useState(false); // 新增：按住录音状态
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [recordingMode, setRecordingMode] = useState<'toggle' | 'press'>('toggle'); // 新增：录音模式
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // 清理函数
  const cleanup = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      mediaRecorderRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setIsRecording(false);
    setIsPressRecording(false);
  };

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, []);

  // 初始化录音
  const initRecording = async () => {
    try {
      // 清理之前的实例
      cleanup();
      
      // 1. 获取音频流
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. 设置音量分析器
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const audioSource = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      audioSource.connect(analyser);
      analyser.fftSize = 256;

      // 3. 设置语音识别
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = navigator.language || 'en-US'; // 使用浏览器语言
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        try {
          const current = event.resultIndex;
          if (event.results[current] && event.results[current][0]) {
            const transcript = event.results[current][0].transcript;
            setTranscript(transcript);
          }
        } catch (err) {
          console.error('Error processing speech recognition result:', err);
        }
      };

      // 4. 初始化录音器
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recognitionRef.current = recognition;

      return { mediaRecorder, recognition, analyser };
    } catch (error) {
      console.error('Error initializing recording:', error);
      throw error;
    }
  };

  // 监测音量
  const startVolumeMonitoring = (analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const checkVolume = () => {
      if (isRecording || isPressRecording) {
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(volume);
        requestAnimationFrame(checkVolume);
      }
    };
    checkVolume();
  };

  // 点击式录音（开始/停止）
  const startRecording = async () => {
    try {
      const { mediaRecorder, recognition, analyser } = await initRecording();
      
      // 开始录音和识别
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      recognition.start();
      mediaRecorder.start();
      setIsRecording(true);
      startVolumeMonitoring(analyser);
      
      // 保存chunks用于后续处理
      mediaRecorderRef.current.chunks = chunks;
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // 停止录音
  const stopRecording = () => {
    return new Promise<{audioBlob: Blob, text: string}>((resolve) => {
      if (mediaRecorderRef.current && (isRecording || isPressRecording)) {
        const chunks = mediaRecorderRef.current.chunks || [];
        
        mediaRecorderRef.current.ondataavailable = (e) => {
          chunks.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          resolve({ audioBlob, text: transcript });
          setTranscript('');
          setVolume(0);
        };

        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsPressRecording(false);
      } else {
        resolve({ audioBlob: new Blob(), text: '' });
      }
    });
  };

  // 按住开始、松开结束的录音
  const startPressRecording = async () => {
    try {
      const { mediaRecorder, recognition, analyser } = await initRecording();
      
      // 开始录音和识别
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      recognition.start();
      mediaRecorder.start();
      setIsPressRecording(true);
      startVolumeMonitoring(analyser);
      
      // 保存chunks用于后续处理
      mediaRecorderRef.current.chunks = chunks;
    } catch (error) {
      console.error('Error starting press recording:', error);
    }
  };

  // 切换录音模式
  const toggleRecordingMode = () => {
    setRecordingMode(prev => prev === 'toggle' ? 'press' : 'toggle');
  };

  return {
    isRecording,
    isPressRecording,
    transcript,
    volume,
    recordingMode,
    startRecording,
    stopRecording,
    startPressRecording,
    toggleRecordingMode
  };
};