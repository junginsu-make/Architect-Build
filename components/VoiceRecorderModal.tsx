
import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadAudio: (base64: string, mimeType: string) => void;
  lang: Language;
}

const MIN_DURATION = 5;   // seconds
const MAX_DURATION = 1800; // 30 minutes

const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({ isOpen, onClose, onUploadAudio, lang }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isWaitingPermission, setIsWaitingPermission] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations[lang];

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen]);

  const cleanup = () => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setIsWaitingPermission(false);
    setDuration(0);
    setError(null);
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = window.setInterval(() => {
      setDuration(prev => {
        const next = prev + 1;
        if (next >= MAX_DURATION) {
          // Auto-stop at max duration
          stopRecording();
        }
        return next;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const getSupportedMimeType = () => {
    const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startRecording = async () => {
    setIsWaitingPermission(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      const mimeType = getSupportedMimeType();
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (chunksRef.current.length === 0) {
          setError(t.noRecordingData);
          return;
        }
        setIsProcessing(true);
        const finalMimeType = chunksRef.current[0]?.type || mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: finalMimeType });
        const reader = new FileReader();

        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          onUploadAudio(base64, finalMimeType);
          setIsProcessing(false);
          onClose();
        };

        reader.onerror = () => {
          setError(t.conversionFailed);
          setIsProcessing(false);
        };

        reader.readAsDataURL(audioBlob);
      };

      // 순서가 중요합니다: 상태 변경 후 타이머 시작
      mediaRecorder.start();
      setIsRecording(true);
      setIsWaitingPermission(false);
      startTimer();
      console.log("Recording started with mimeType:", mimeType);
    } catch (err) {
      console.error("Recording start error:", err);
      setIsWaitingPermission(false);
      const msg = err instanceof Error ? err.name : "Unknown Error";
      if (msg === 'NotAllowedError' || msg === 'PermissionDeniedError') {
        alert(t.micDenied);
      } else {
        alert(t.micError);
      }
      onClose();
    }
  };

  const stopRecording = () => {
    stopTimer();
    if (mediaRecorderRef.current && isRecording) {
      if (duration < MIN_DURATION) {
        setError(`${MIN_DURATION}${t.minDuration}`);
        // Stop recording but discard
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setDuration(0);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        return;
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
        <div className="p-12 flex flex-col items-center text-center">
          <div className="mb-10 relative">
            {(isRecording || isWaitingPermission) && (
               <div className="absolute -inset-8">
                 <div className="w-40 h-40 bg-blue-500/20 rounded-full animate-ping"></div>
               </div>
            )}
            <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${isRecording ? 'bg-red-500 scale-110' : (isWaitingPermission ? 'bg-amber-500 animate-pulse' : 'bg-blue-600')}`}>
               {isRecording ? (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-10 h-10 text-white" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-10 h-10 text-white" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
               )}
            </div>
          </div>

          <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
            {isProcessing ? t.voiceTitleAnalyzing : (isRecording ? t.voiceTitleRecording : (isWaitingPermission ? t.voiceTitleRequesting : t.voiceTitle))}
          </h3>
          <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed px-6">
            {isRecording
              ? (duration < MIN_DURATION
                ? `${MIN_DURATION}${t.minDuration}`
                : t.listeningStatus)
              : (isWaitingPermission
                ? t.micWaiting
                : t.micReady)}
          </p>

          {error && (
            <div className="w-full px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <div className="text-4xl font-black text-slate-900 font-mono mb-12 tracking-tighter">
            {formatTime(duration)}
          </div>

          <div className="flex gap-4 w-full">
            {!isRecording && !isWaitingPermission ? (
              <>
                <button onClick={onClose} className="flex-1 py-5 rounded-2xl border border-slate-100 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">{t.voiceCancel}</button>
                <button onClick={startRecording} className="flex-[2] py-5 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10">{t.voiceStartRecording}</button>
              </>
            ) : isRecording ? (
              <button onClick={stopRecording} className="w-full py-6 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-500/20">{t.voiceFinishAnalyze}</button>
            ) : (
              <button disabled className="w-full py-6 rounded-2xl bg-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest cursor-not-allowed">{t.voiceWaitingPermission}</button>
            )}
          </div>
          
          {isProcessing && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
               <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
               <p className="text-slate-900 font-black text-sm uppercase tracking-widest">{t.voiceExtracting}</p>
               <p className="text-slate-400 text-xs mt-2 font-medium">{t.voiceProcessing}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorderModal;
