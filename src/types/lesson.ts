export interface AudioItem {
  id: string;
  textRu: string;
  label: string;
  ipa?: string;
  italianPhonetic?: string;
  audioTextToSpeak: string;
  cursiveText?: string;
  explanationIt?: string;
  audioSlowTextToSpeak?: string;
  soundType?: 'vowel' | 'syllable' | 'word' | 'combination';
}

export interface Exercise {
  id: string;
  number: string;
  titleRu: string;
  titleIt: string;
  type: 'vowels_table' | 'letter_pairs' | 'diagram' | 'word_list' | 'text' | 'cursive' | 'custom';
  descriptionIt: string;
  audioItems: AudioItem[];
  exerciseNotesIt?: string;
  interactiveType?: 'vowels_cards' | 'cursive_pad' | 'diagram_flow' | 'standard_audio_list';
}

export interface VocabularyItem {
  wordRu: string;
  ipa: string;
  translationIt: string;
  audioTextToSpeak: string;
  notesIt?: string;
}

export interface LessonPage {
  id: string;
  lessonTitle: string;
  pageNumber?: string;
  subtitleIt?: string;
  overviewIt: string;
  exercises: Exercise[];
  vocabulary?: VocabularyItem[];
  bookTitle?: string;
  imageUrl?: string;
  isCustomUploaded?: boolean;
}

export interface AudioPlaybackSettings {
  rate: number; // 0.5, 0.75, 1.0, 1.25
  pitch: number; // 0.8 - 1.2
  repeatCount: number; // 1, 2, 3
  repeatPauseMs: number; // pausa in millisecondi per ripetere a voce alta
  useServerTTS: boolean; // se usare Gemini TTS o Web Speech API
  selectedVoiceName?: string;
}
