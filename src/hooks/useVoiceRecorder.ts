// src/hooks/useVoiceRecorder.ts
// Hook para gravação de áudio para voice input

import { useState, useRef, useCallback } from 'react';

interface UseVoiceRecorderOptions {
  onRecordingComplete: (audioBlob: Blob) => void;
  onError?: (error: Error) => void;
}

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

/**
 * Hook para gravar áudio do microfone
 * Usado para voice input na calculadora
 */
export function useVoiceRecorder({
  onRecordingComplete,
  onError,
}: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        
        // Limpa as faixas de áudio para desligar o microfone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to access microphone');
      console.error('[VoiceRecorder] Error:', error);
      onError?.(error);
    }
  }, [onRecordingComplete, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  }, []);

  return { isRecording, startRecording, stopRecording };
}
