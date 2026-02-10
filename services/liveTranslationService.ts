
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

const API_KEY = process.env.API_KEY;

// 오디오 유틸리티 함수들 (시스템 가이드라인 준수)
export function encodeAudio(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeAudio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export interface TranslationCallback {
  onTranscription: (text: string, isUser: boolean) => void;
  onStatusChange: (active: boolean) => void;
  onError: (error: string) => void;
}

export class LiveTranslator {
  private ai: GoogleGenAI | null = null;
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private inputCtx: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private mediaStream: MediaStream | null = null;

  async start(callbacks: TranslationCallback) {
    if (!API_KEY) {
      callbacks.onError('API key is not configured.');
      return;
    }
    this.ai = new GoogleGenAI({ apiKey: API_KEY });

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.inputCtx = inputCtx;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaStream = stream;

      this.session = await this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: 'You are a professional bidirectional translator. If you hear Korean, translate to English. If you hear English, translate to Korean. Speak only the translation. Be fast and natural.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            callbacks.onStatusChange(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            this.scriptProcessor = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encodeAudio(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              this.session.sendRealtimeInput({ media: pcmBlob });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // 오디오 출력 처리
            const parts = message.serverContent?.modelTurn?.parts;
            const audioData = parts?.[0]?.inlineData?.data;
            if (audioData && this.audioContext) {
              this.nextStartTime = Math.max(this.nextStartTime, this.audioContext.currentTime);
              const buffer = await decodeAudioData(decodeAudio(audioData), this.audioContext, 24000, 1);
              const source = this.audioContext.createBufferSource();
              source.buffer = buffer;
              source.connect(this.audioContext.destination);
              source.start(this.nextStartTime);
              this.nextStartTime += buffer.duration;
              this.sources.add(source);
            }

            // 텍스트 전사 처리
            if (message.serverContent?.inputTranscription) {
              callbacks.onTranscription(message.serverContent.inputTranscription.text, true);
            }
            if (message.serverContent?.outputTranscription) {
              callbacks.onTranscription(message.serverContent.outputTranscription.text, false);
            }

            if (message.serverContent?.interrupted) {
              this.sources.forEach(s => s.stop());
              this.sources.clear();
              this.nextStartTime = 0;
            }
          },
          onerror: (e) => callbacks.onError(e.toString()),
          onclose: () => callbacks.onStatusChange(false),
        }
      });
    } catch (err) {
      callbacks.onError(err instanceof Error ? err.message : "Access Denied");
    }
  }

  stop() {
    if (this.session) {
      try { this.session.close(); } catch (e) { console.warn('Session close error:', e); }
      this.session = null;
    }
    this.sources.forEach(s => { try { s.stop(); } catch {} });
    this.sources.clear();
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.inputCtx) {
      this.inputCtx.close();
      this.inputCtx = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.nextStartTime = 0;
  }
}
