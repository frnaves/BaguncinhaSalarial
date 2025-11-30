import React, { useState, useRef } from 'react';
import { Mic, Send, Loader2, StopCircle } from 'lucide-react';

interface InputAreaProps {
  onSend: (text?: string, audioBlob?: Blob) => Promise<void>;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSend = () => {
    // Only allow sending text if there is text and not currently loading.
    // Recording is handled separately by the Stop button.
    if (!text.trim() || isLoading) return;
    onSend(text);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        // Only send if we actually have audio data
        if (blob.size > 0) {
            onSend(undefined, blob);
        } else {
            console.warn("Audio recording was empty");
        }
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-6 md:pb-4 shadow-lg z-40">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Gravando..." : "Digite: 'Uber 25 reais' ou 'Mercado 300'..."}
            disabled={isLoading || isRecording}
            className={`w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none ${isRecording ? 'animate-pulse placeholder-red-500' : ''}`}
          />
        </div>

        {isRecording ? (
             <button
             onClick={stopRecording}
             className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-md animate-pulse"
           >
             <StopCircle className="w-6 h-6" />
           </button>
        ) : (
            <button
            onClick={startRecording}
            disabled={isLoading || text.length > 0}
            className={`p-3 rounded-full transition-colors shadow-md ${
                text.length > 0 ? 'hidden' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
            >
            <Mic className="w-6 h-6" />
            </button>
        )}

        <button
          onClick={handleSend}
          disabled={isLoading || !text.trim()} 
          className={`p-3 rounded-full transition-all shadow-md flex items-center justify-center ${
            isLoading || !text.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
        </button>
      </div>
      <div className="max-w-4xl mx-auto mt-2 text-center text-xs text-slate-400">
        Powered by Gemini • Toque no microfone para falar
      </div>
    </div>
  );
};

export default InputArea;