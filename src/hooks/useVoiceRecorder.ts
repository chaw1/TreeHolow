import { useState, useRef } from 'react';

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);  // 添加 volume state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const [transcript, setTranscript] = useState('');

  const startRecording = async () => {
    try {
      // 1. 获取音频流
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. 设置音量分析器
      const audioContext = new AudioContext();
      const audioSource = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      audioSource.connect(analyser);
      analyser.fftSize = 256;

      // 3. 设置音量监测
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkVolume = () => {
        if (isRecording) {
          analyser.getByteFrequencyData(dataArray);
          const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVolume(volume);
          requestAnimationFrame(checkVolume);
        }
      };

      // 4. 设置语音识别
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      // recognition.lang = 'zh-CN';
      recognition.lang = 'en-US';
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

      // 5. 初始化录音器
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recognitionRef.current = recognition;

      // 6. 开始录音和识别
      recognition.start();
      mediaRecorder.start();
      setIsRecording(true);
      checkVolume();  // 开始音量监测

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    return new Promise<{audioBlob: Blob, text: string}>((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        const chunks: BlobPart[] = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
          chunks.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          resolve({ audioBlob, text: transcript });
        };

        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    });
  };

  return {
    isRecording,
    transcript,
    volume,     // 添加 volume 到返回值
    startRecording,
    stopRecording,
  };
};