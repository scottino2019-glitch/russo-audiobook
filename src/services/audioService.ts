import { AudioPlaybackSettings } from '../types/lesson';

type AudioStateListener = (state: {
  isPlaying: boolean;
  activeId: string | null;
  currentRepeat: number;
  totalRepeats: number;
  source: 'browser' | 'gemini' | 'idle';
  error?: string | null;
}) => void;

class AudioService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private repeatTimeoutId: any = null;
  private isCancelled = false;

  private listeners: Set<AudioStateListener> = new Set();
  private state: {
    isPlaying: boolean;
    activeId: string | null;
    currentRepeat: number;
    totalRepeats: number;
    source: 'browser' | 'gemini' | 'idle';
    error?: string | null;
  } = {
    isPlaying: false,
    activeId: null,
    currentRepeat: 0,
    totalRepeats: 1,
    source: 'idle',
    error: null,
  };

  public settings: AudioPlaybackSettings = {
    rate: 0.9,
    pitch: 1.0,
    repeatCount: 1,
    repeatPauseMs: 1400,
    useServerTTS: false,
  };

  public availableRussianVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoices();
      };
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const allVoices = window.speechSynthesis.getVoices();
    this.availableRussianVoices = allVoices.filter(
      (v) => v.lang.startsWith('ru') || v.lang.includes('RU')
    );
  }

  public subscribe(listener: AudioStateListener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public stop() {
    this.isCancelled = true;
    if (this.repeatTimeoutId) {
      clearTimeout(this.repeatTimeoutId);
      this.repeatTimeoutId = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
    this.state = {
      isPlaying: false,
      activeId: null,
      currentRepeat: 0,
      totalRepeats: 1,
      source: 'idle',
      error: null,
    };
    this.notify();
  }

  public async playText(
    text: string,
    id: string,
    overrideSettings?: Partial<AudioPlaybackSettings>
  ): Promise<void> {
    this.stop();
    this.isCancelled = false;

    const currentSettings = { ...this.settings, ...overrideSettings };
    const totalRepeats = Math.max(1, currentSettings.repeatCount);

    if (currentSettings.useServerTTS) {
      try {
        await this.playWithServerTTS(text, id, currentSettings, totalRepeats);
        return;
      } catch (err: any) {
        console.warn('Server TTS failed, falling back to browser speech synthesis:', err);
      }
    }

    // Fallback or default: Web Speech API
    await this.playWithBrowserTTS(text, id, currentSettings, totalRepeats);
  }

  private async playWithServerTTS(
    text: string,
    id: string,
    settings: AudioPlaybackSettings,
    totalRepeats: number
  ): Promise<void> {
    this.state = {
      isPlaying: true,
      activeId: id,
      currentRepeat: 1,
      totalRepeats,
      source: 'gemini',
      error: null,
    };
    this.notify();

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        speed: settings.rate,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS server error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.audioUrl) {
      throw new Error('Nessun URL audio restituito');
    }

    await this.playAudioElementLoop(data.audioUrl, id, 1, totalRepeats, settings.repeatPauseMs);
  }

  private playAudioElementLoop(
    audioUrl: string,
    id: string,
    currentRep: number,
    totalReps: number,
    pauseMs: number
  ): Promise<void> {
    return new Promise((resolve) => {
      if (this.isCancelled) return resolve();

      const audio = new Audio(audioUrl);
      this.currentAudioElement = audio;

      this.state = {
        isPlaying: true,
        activeId: id,
        currentRepeat: currentRep,
        totalRepeats: totalReps,
        source: 'gemini',
        error: null,
      };
      this.notify();

      audio.onended = () => {
        if (this.isCancelled) return resolve();
        if (currentRep < totalReps) {
          this.repeatTimeoutId = setTimeout(() => {
            if (this.isCancelled) return resolve();
            this.playAudioElementLoop(audioUrl, id, currentRep + 1, totalReps, pauseMs).then(resolve);
          }, pauseMs);
        } else {
          this.stop();
          resolve();
        }
      };

      audio.onerror = () => {
        this.stop();
        resolve();
      };

      audio.play().catch(() => {
        this.stop();
        resolve();
      });
    });
  }

  private playWithBrowserTTS(
    text: string,
    id: string,
    settings: AudioPlaybackSettings,
    totalRepeats: number
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        this.state = {
          ...this.state,
          isPlaying: false,
          error: 'Sintesi vocale non supportata in questo browser.',
        };
        this.notify();
        return resolve();
      }

      const speakIteration = (rep: number) => {
        if (this.isCancelled) return resolve();

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;

        utterance.lang = 'ru-RU';
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;

        // Try to select a Russian voice
        if (this.availableRussianVoices.length > 0) {
          const selectedVoice = settings.selectedVoiceName
            ? this.availableRussianVoices.find((v) => v.name === settings.selectedVoiceName)
            : this.availableRussianVoices[0];
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }

        this.state = {
          isPlaying: true,
          activeId: id,
          currentRepeat: rep,
          totalRepeats,
          source: 'browser',
          error: null,
        };
        this.notify();

        utterance.onend = () => {
          if (this.isCancelled) return resolve();
          if (rep < totalRepeats) {
            this.repeatTimeoutId = setTimeout(() => {
              if (this.isCancelled) return resolve();
              speakIteration(rep + 1);
            }, settings.repeatPauseMs);
          } else {
            this.stop();
            resolve();
          }
        };

        utterance.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            this.state.error = `Errore audio: ${e.error}`;
          }
          this.stop();
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      };

      speakIteration(1);
    });
  }
}

export const audioService = new AudioService();
