// src/components/VoiceMessage.tsx
export const VoiceMessage = ({ url, duration }: { url: string, duration: string }) => {
  return (
    <div className="bg-indigo-600 text-white rounded-lg p-4 inline-flex items-center gap-3">
      <audio
        src={url}
        controls
        className="h-8 w-[240px] accent-white"
      />
      <span className="text-sm opacity-80">语音消息</span>
    </div>
  );
};