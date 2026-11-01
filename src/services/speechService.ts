import { GLOBAL_LANGUAGES } from './languageService';

export type RecorderState =
  | 'idle'
  | 'recording'
  | 'stopping'
  | 'processing'
  | 'transcript'
  | 'error'
  | 'manual_fallback';

export interface SpeechRecognitionResultState {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export function getBCP47(langCode: string): string {
  const lang = GLOBAL_LANGUAGES.find((l) => l.code === langCode);
  return lang?.bcp47 || 'en-US';
}

// Preset realistic voice samples for instant evaluator demo testing across languages
export const DEMO_VOICE_SAMPLES: Record<
  string,
  { label: string; transcript: string; durationSec: number }[]
> = {
  en: [
    {
      label: '4th Ave Deep Pothole',
      transcript:
        'There is a massive deep pothole on the northbound lane of 4th Avenue right near the bank. Cars are swerving abruptly and one tire has already blown out.',
      durationSec: 6,
    },
    {
      label: 'Main St Water Rupture',
      transcript:
        'A high pressure water pipe just ruptured on the sidewalk near Fulton Street. Murky water is flooding the whole walkway and reaching store basements.',
      durationSec: 5,
    },
    {
      label: 'Damaged Electric Lamp Pole',
      transcript:
        'A utility pole on Avenue St Martin was hit by a truck and is leaning dangerously. Live wires are dangling near the bus stop.',
      durationSec: 7,
    },
    {
      label: 'Unsafe Construction Scaffolding',
      transcript:
        'Temporary construction scaffolding over the school footpath has loose metal clamps that swing in high wind, posing a falling object hazard.',
      durationSec: 6,
    },
  ],
  es: [
    {
      label: 'Ruptura de Tubería de Agua',
      transcript:
        'Ruptura de tubería principal de agua inundando la acera peatonal e ingresando a locales comerciales subterráneos.',
      durationSec: 6,
    },
    {
      label: 'Bache Peligroso en la Vía',
      transcript:
        'Enorme bache profundo en el carril hacia el norte que causa daños graves en las ruedas y desvíos peligrosos.',
      durationSec: 5,
    },
  ],
  hi: [
    {
      label: 'झुका हुआ बिजली का खंभा',
      transcript:
        'टक्कर के बाद बिजली का खंभा खतरनाक रूप से झुक गया है और खुले बिजली के तार लटक रहे हैं।',
      durationSec: 6,
    },
    {
      label: 'पानी की पाइपलाइन लीकेज',
      transcript:
        'मुख्य पानी की पाइपलाइन फटने से पैदल मार्ग पर पानी भर गया है और दुकानों के बेसमेंट में घुस रहा है।',
      durationSec: 5,
    },
  ],
  fr: [
    {
      label: 'Passerelle piétonne fissurée',
      transcript:
        'Nid-de-poule profond et fissure visible sur la passerelle piétonne du canal nord.',
      durationSec: 5,
    },
  ],
  ar: [
    {
      label: 'انفجار أنبوب مياه رئيسي',
      transcript:
        'انفجار أنبوب مياه رئيسي يغمر رصيف المشاة ويتدفق إلى أقبية المتاجر المجاورة.',
      durationSec: 6,
    },
  ],
  bn: [
    {
      label: 'রাস্তার বড় গর্ত ও ভাঙা ড্রেন',
      transcript:
        'প্রধান সড়কের ওপর একটি বড় গর্ত তৈরি হয়েছে এবং ড্রেনের পানি উপচে পড়ে সাধারণ মানুষের চলাচলে চরম বিঘ্ন ঘটছে।',
      durationSec: 6,
    },
  ],
  zh: [
    {
      label: '路灯电线垂落事故',
      transcript: '路灯杆发生碰撞后严重倾斜，裸露的带电电线垂落悬挂。',
      durationSec: 5,
    },
  ],
};

export class CivicSpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private isStopping = false;
  private shouldKeepListening = false;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionFinal = '';
  private accumulatedFinal = '';
  private onResultCallback?: (result: SpeechRecognitionResultState) => void;
  private onErrorCallback?: (errorMsg: string) => void;
  private onEndCallback?: () => void;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            this.sessionFinal = `${this.sessionFinal} ${finalTranscript}`.trim();
          }
          if (this.onResultCallback) {
            this.onResultCallback({
              transcript: `${this.accumulatedFinal} ${this.sessionFinal} ${interimTranscript}`.trim(),
              isFinal: !!finalTranscript,
              confidence: event.results[0]?.[0]?.confidence || 0.9,
            });
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('Speech recognition error event:', event.error);
          let userMessage = 'Microphone error or permission denied.';
          if (event.error === 'not-allowed') {
            userMessage =
              'Microphone access was denied. Please allow microphone permission in your browser settings, or enter your description by typing below.';
          } else if (event.error === 'no-speech') {
            userMessage = 'No speech was detected. Please speak closer to the microphone and try again.';
          } else if (event.error === 'network') {
            userMessage =
              'Network connection issue during live speech recognition. You can use the quick speech sample or type text directly.';
          } else if (event.error === 'language-not-supported') {
            userMessage =
              'Speech recognition is currently unavailable for this specific dialect on your browser engine. Please use manual entry or another dialect.';
          }
          if (event.error === 'no-speech' && this.shouldKeepListening) return;
          if (this.onErrorCallback) this.onErrorCallback(userMessage);
          if (event.error !== 'aborted' && event.error !== 'no-speech') {
            this.shouldKeepListening = false;
            this.isListening = false;
          }
        };

        this.recognition.onend = () => {
          this.accumulatedFinal = `${this.accumulatedFinal} ${this.sessionFinal}`.trim();
          this.sessionFinal = '';
          this.isListening = false;
          if (this.shouldKeepListening) {
            this.restartTimer = setTimeout(() => {
              this.restartTimer = null;
              if (!this.shouldKeepListening) return;
              try { this.recognition.start(); this.isListening = true; }
              catch { this.restartTimer = setTimeout(() => {
                this.restartTimer = null;
                if (!this.shouldKeepListening) return;
                try { this.recognition.start(); this.isListening = true; } catch { this.shouldKeepListening = false; this.isListening = false; this.isStopping = false; this.onEndCallback?.(); }
              }, 350); }
            }, 250);
          } else {
            this.isStopping = false;
            this.onEndCallback?.();
          }
        };
      }
    }
  }

  public start(
    lang: string,
    onResult: (result: SpeechRecognitionResultState) => void,
    onError: (errorMsg: string) => void,
    onEnd: () => void,
    initialTranscript = ''
  ) {
    if (this.isStopping) {
      onError('The microphone is still closing. Please wait a moment, then try again.');
      return;
    }
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;
    this.shouldKeepListening = true;
    this.accumulatedFinal = initialTranscript.trim();
    this.sessionFinal = '';

    if (!this.recognition) {
      onError(
        'Your browser does not have a native SpeechRecognition engine. You can click any test voice sample or type text directly.'
      );
      onEnd();
      return;
    }

    try {
      this.recognition.lang = getBCP47(lang);
      this.recognition.start();
      this.isListening = true;
    } catch (e: any) {
      console.warn('Speech start error:', e);
      onError('The microphone is still starting or closing. Wait a moment and try again.');
      this.shouldKeepListening = false;
      this.isListening = false;
      onEnd();
    }
  }

  public stop() {
    this.shouldKeepListening = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
      this.isListening = false;
      this.isStopping = false;
      this.onEndCallback?.();
      return;
    }
    if (this.recognition && this.isListening) {
      this.isStopping = true;
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Speech stop error:', e);
        this.isStopping = false;
        this.isListening = false;
        this.onEndCallback?.();
      }
      return;
    }
    this.isListening = false;
    this.isStopping = false;
  }

  public isActive(): boolean {
    return this.isListening || this.isStopping || this.restartTimer !== null;
  }
}
