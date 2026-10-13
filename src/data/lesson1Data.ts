import { LessonPage } from '../types/lesson';

export const LESSON_1_DATA: LessonPage = {
  id: 'startup-a1-lesson-1-p10',
  lessonTitle: 'УРОК 1 (Lezione 1)',
  pageNumber: '10 - 11',
  bookTitle: 'Стартап А1 — Учебник русского языка',
  subtitleIt: 'Le prime vocali russe (А, О, У, И, Э, Ы) e le combinazioni di lettura',
  overviewIt: 'Questa pagina del manuale "Стартап А1" introduce le prime vocali dell\'alfabeto cirillico, la corrispondenza tra lettera stampata e corsivo russo, e allena l\'ascolto e la combinazione dei suoni primari.',
  exercises: [
    {
      id: 'ex_intro_poster',
      number: 'Poster',
      titleRu: 'МИР МАЙ [1]',
      titleIt: 'Manifesto introduttivo: Pace e Maggio',
      type: 'text',
      interactiveType: 'standard_audio_list',
      descriptionIt: 'In cima alla pagina trovi il celebre manifesto storico con la colomba della pace e lo slogan "МИР МАЙ" (Pace, Maggio), legato alla festa di primavera e dei lavoratori.',
      exerciseNotesIt: 'La parola "Мир" in russo ha un doppio significato bellissimo: significa sia "pace" che "mondo/universo"!',
      audioItems: [
        {
          id: 'poster_mir_mai',
          textRu: 'Мир! Май!',
          label: 'МИР МАЙ',
          ipa: '[mʲir maj]',
          italianPhonetic: '"Mir! Mai!" — la R finale russa è vibrante, la M è dolce seguita da I',
          audioTextToSpeak: 'Мир. Май.',
          cursiveText: 'Мир, Май',
          explanationIt: 'Мир = Pace / Mondo; Май = Maggio.',
          soundType: 'word'
        },
        {
          id: 'poster_word_mir',
          textRu: 'мир',
          label: 'мир',
          ipa: '[mʲir]',
          italianPhonetic: 'mìr',
          audioTextToSpeak: 'мир',
          cursiveText: 'мир',
          explanationIt: 'Sostantivo maschile: pace, mondo.',
          soundType: 'word'
        },
        {
          id: 'poster_word_mai',
          textRu: 'май',
          label: 'май',
          ipa: '[maj]',
          italianPhonetic: 'mài',
          audioTextToSpeak: 'май',
          cursiveText: 'май',
          explanationIt: 'Mese di maggio.',
          soundType: 'word'
        }
      ]
    },
    {
      id: 'ex_1',
      number: '1',
      titleRu: '1. Слушайте, повторяйте, читайте.',
      titleIt: '1. Ascoltate, ripetete, leggete.',
      type: 'vowels_table',
      interactiveType: 'vowels_cards',
      descriptionIt: 'Tabella delle vocali dure primarie: Буква (lettera stampata e corsiva), Название буквы (nome della lettera) e Звук (suono pronunciato).',
      exerciseNotesIt: '💡 Per gli italiani: la "О" russa ha un suono pieno e arrotondato [o] quando è accentata. La "У" russa [u] si pronuncia spingendo le labbra molto più in avanti rispetto all\'italiano.',
      audioItems: [
        {
          id: 'vowel_a',
          textRu: 'А а',
          label: 'А а',
          ipa: '[a]',
          italianPhonetic: 'Nome [a], Suono [a]',
          cursiveText: '𝒜 𝒶',
          audioTextToSpeak: 'А. А. Буква А, звук А.',
          audioSlowTextToSpeak: 'А... А...',
          explanationIt: 'Vocale aperta centrale. È identica alla "A" italiana di "amore". In corsivo si traccia quasi come la nostra a minuscola.',
          soundType: 'vowel'
        },
        {
          id: 'vowel_o',
          textRu: 'О о',
          label: 'О о',
          ipa: '[o]',
          italianPhonetic: 'Nome [o], Suono [o]',
          cursiveText: '𝒪 ℴ',
          audioTextToSpeak: 'О. О. Буква О, звук О.',
          audioSlowTextToSpeak: 'О... О...',
          explanationIt: 'Vocale posteriore arrotondata. Labbra ben a cerchio. Attenzione: solo se accentata mantiene il suono [o] pieno.',
          soundType: 'vowel'
        },
        {
          id: 'vowel_u',
          textRu: 'У у',
          label: 'У у',
          ipa: '[u]',
          italianPhonetic: 'Nome [u], Suono [u]',
          cursiveText: '𝒴 𝓎',
          audioTextToSpeak: 'У. У. Буква У, звук У.',
          audioSlowTextToSpeak: 'У... У...',
          explanationIt: 'Vocale chiusa posteriore. Attenzione alla forma: assomiglia a una "y" latina, ma si pronuncia come la "U" italiana di "uno"!',
          soundType: 'vowel'
        }
      ]
    },
    {
      id: 'ex_2',
      number: '2',
      titleRu: '2. Пишите.',
      titleIt: '2. Scrivete.',
      type: 'cursive',
      interactiveType: 'cursive_pad',
      descriptionIt: 'Esercizio pratico di scrittura corsiva (прописи) delle lettere singole e delle transizioni a due vocali. Ascolta ogni combinazione mentre impari a tracciarla!',
      exerciseNotesIt: '✍️ Il corsivo russo collega sempre fluidamente le lettere tra loro con un piccolo tratto d\'unione alla base.',
      audioItems: [
        {
          id: 'pair_oa',
          textRu: 'оа',
          label: 'оа',
          ipa: '[oa]',
          italianPhonetic: 'o-a (transizione rapida)',
          cursiveText: 'ℴ𝒶',
          audioTextToSpeak: 'оа. оа.',
          explanationIt: 'Passaggio continuo da bocca rotonda [o] a bocca aperta [a].',
          soundType: 'combination'
        },
        {
          id: 'pair_ao',
          textRu: 'ао',
          label: 'ао',
          ipa: '[ao]',
          italianPhonetic: 'a-o',
          cursiveText: '𝒶ℴ',
          audioTextToSpeak: 'ао. ао.',
          explanationIt: 'Passaggio inverso: da bocca aperta a labbra arrotondate.',
          soundType: 'combination'
        },
        {
          id: 'pair_ay',
          textRu: 'ау',
          label: 'ау',
          ipa: '[au]',
          italianPhonetic: 'a-ù (come l\'italiano "ahia" o il richiamo nei boschi)',
          cursiveText: '𝒶𝓎',
          audioTextToSpeak: 'ау! ау!',
          explanationIt: 'Curiosità russa: "Ау!" è il classico grido dei russi per chiamarsi quando si raccolgono funghi o ci si perde nei boschi!',
          soundType: 'combination'
        },
        {
          id: 'pair_ya',
          textRu: 'уа',
          label: 'уа',
          ipa: '[ua]',
          italianPhonetic: 'u-à (il pianto del bebè in russo)',
          cursiveText: '𝓎𝒶',
          audioTextToSpeak: 'уа. уа.',
          explanationIt: 'Suono onomatopeico in russo per il vagito dei neonati.',
          soundType: 'combination'
        },
        {
          id: 'pair_oy',
          textRu: 'оу',
          label: 'оу',
          ipa: '[ou]',
          italianPhonetic: 'o-u',
          cursiveText: 'ℴ𝓎',
          audioTextToSpeak: 'оу. оу.',
          explanationIt: 'Dalla [o] media alla [u] chiusa.',
          soundType: 'combination'
        },
        {
          id: 'pair_yo',
          textRu: 'уо',
          label: 'уо',
          ipa: '[uo]',
          italianPhonetic: 'u-o',
          cursiveText: '𝓎ℴ',
          audioTextToSpeak: 'уо. уо.',
          explanationIt: 'Dalla [u] alla [o].',
          soundType: 'combination'
        }
      ]
    },
    {
      id: 'ex_3',
      number: '3',
      titleRu: '3. Читайте.',
      titleIt: '3. Leggete (Diagramma incrociato delle vocali)',
      type: 'diagram',
      interactiveType: 'diagram_flow',
      descriptionIt: 'Il libro mostra un diagramma a frecce con la lettera "А" al centro e le vocali "О" e "У" ai quattro angoli. Questo esercizio allena l\'articolazione e la lettura fluida.',
      exerciseNotesIt: '🧭 Segui le frecce dal vertice al centro e viceversa. Clicca sulle singole frecce per ascoltare la sequenza sonora.',
      audioItems: [
        {
          id: 'diag_oa',
          textRu: 'о-а',
          label: 'о ➔ а',
          ipa: '[oa]',
          italianPhonetic: 'Dall\'angolo superiore a quello centrale',
          audioTextToSpeak: 'о... а. оа.',
          soundType: 'combination'
        },
        {
          id: 'diag_ya',
          textRu: 'у-а',
          label: 'у ➔ а',
          ipa: '[ua]',
          italianPhonetic: 'Dall\'angolo inferiore a quello centrale',
          audioTextToSpeak: 'у... а. уа.',
          soundType: 'combination'
        },
        {
          id: 'diag_ao',
          textRu: 'а-о',
          label: 'а ➔ о',
          ipa: '[ao]',
          italianPhonetic: 'Dal centro verso l\'angolo in alto a destra',
          audioTextToSpeak: 'а... о. ао.',
          soundType: 'combination'
        },
        {
          id: 'diag_ay',
          textRu: 'а-у',
          label: 'а ➔ у',
          ipa: '[au]',
          italianPhonetic: 'Dal centro verso l\'angolo in basso a destra',
          audioTextToSpeak: 'а... у. ау.',
          soundType: 'combination'
        },
        {
          id: 'diag_oao',
          textRu: 'о-а-о',
          label: 'о ➔ а ➔ о',
          ipa: '[oao]',
          italianPhonetic: 'Sequenza fluida a 3 toni',
          audioTextToSpeak: 'о-а-о',
          soundType: 'combination'
        },
        {
          id: 'diag_yay',
          textRu: 'у-а-у',
          label: 'у ➔ а ➔ у',
          ipa: '[uau]',
          italianPhonetic: 'Sequenza fluida a 3 toni',
          audioTextToSpeak: 'у-а-у',
          soundType: 'combination'
        },
        {
          id: 'diag_oay',
          textRu: 'о-а-у',
          label: 'о ➔ а ➔ у',
          ipa: '[oau]',
          italianPhonetic: 'Sequenza triangolare completa',
          audioTextToSpeak: 'о-а-у',
          soundType: 'combination'
        },
        {
          id: 'diag_yao',
          textRu: 'у-а-о',
          label: 'у ➔ а ➔ о',
          ipa: '[uao]',
          italianPhonetic: 'Sequenza triangolare inversa',
          audioTextToSpeak: 'у-а-о',
          soundType: 'combination'
        }
      ]
    },
    {
      id: 'ex_4',
      number: '4',
      titleRu: '4. Слушайте, повторяйте, читайте.',
      titleIt: '4. Ascoltate, ripetete, leggete (Vocali di completamento: И, Э, Ы)',
      type: 'vowels_table',
      interactiveType: 'vowels_cards',
      descriptionIt: 'Prosieguo della pagina (visibile in basso nella tua foto): le vocali "И" [i], "Э" [e] e la caratteristica "Ы" [ɨ].',
      exerciseNotesIt: '⚠️ ATTENZIONE SPECIALE: la lettera russa Ы [ɨ] non esiste in italiano! Non è una semplice "I". Per pronunciarla: allarga le labbra come per dire "i", ma sposta la lingua indietro verso la gola (come se dicessi "u" con le labbra di "i").',
      audioItems: [
        {
          id: 'vowel_i',
          textRu: 'И и',
          label: 'И и',
          ipa: '[i]',
          italianPhonetic: 'Nome [i], Suono [i]',
          cursiveText: 'ℐ 𝒾',
          audioTextToSpeak: 'И. И. Буква И, звук И.',
          explanationIt: 'Vocale dolce anteriore. Assomiglia alla "N" latina invertita, ma si pronuncia come la "I" italiana.',
          soundType: 'vowel'
        },
        {
          id: 'vowel_e',
          textRu: 'Э э',
          label: 'Э э',
          ipa: '[ɛ]',
          italianPhonetic: 'Nome [e], Suono [e aperta]',
          cursiveText: 'ℰ ℯ',
          audioTextToSpeak: 'Э. Э. Буква Э, звук Э.',
          explanationIt: 'Vocale dura anteriore aperta. Si pronuncia come la "e" aperta di "erba" o "bello".',
          soundType: 'vowel'
        },
        {
          id: 'vowel_y_hard',
          textRu: 'Ы ы',
          label: 'Ы ы',
          ipa: '[ɨ]',
          italianPhonetic: 'Suono [ɨ] — la "I" profonda gutturale',
          cursiveText: 'ы',
          audioTextToSpeak: 'Ы. Ы. Буква Ы, звук Ы.',
          audioSlowTextToSpeak: 'Ы... Ы...',
          explanationIt: 'Vocale centrale chiusa non arrotondata. Il trucco pratico: metti una matita tra i denti e prova a pronunciare "i" senza muovere le labbra in avanti.',
          soundType: 'vowel'
        }
      ]
    }
  ],
  vocabulary: [
    {
      wordRu: 'мир',
      ipa: '[mʲir]',
      translationIt: 'pace / mondo',
      audioTextToSpeak: 'мир',
      notesIt: 'Dal manifesto a inizio pagina.'
    },
    {
      wordRu: 'май',
      ipa: '[maj]',
      translationIt: 'maggio',
      audioTextToSpeak: 'май',
      notesIt: 'Dal manifesto a inizio pagina.'
    },
    {
      wordRu: 'мама',
      ipa: '[ˈmamə]',
      translationIt: 'mamma',
      audioTextToSpeak: 'мама',
      notesIt: 'Accento sulla prima sillaba. La seconda "a" si riduce leggermente.'
    },
    {
      wordRu: 'папа',
      ipa: '[ˈpapə]',
      translationIt: 'papà',
      audioTextToSpeak: 'папа',
      notesIt: 'Accento sulla prima sillaba.'
    },
    {
      wordRu: 'дом',
      ipa: '[dom]',
      translationIt: 'casa',
      audioTextToSpeak: 'дом',
      notesIt: 'Una sola sillaba, vocale O piena.'
    },
    {
      wordRu: 'кот',
      ipa: '[kot]',
      translationIt: 'gatto',
      audioTextToSpeak: 'кот',
      notesIt: 'Sostantivo maschile.'
    },
    {
      wordRu: 'тут',
      ipa: '[tut]',
      translationIt: 'qui',
      audioTextToSpeak: 'тут',
      notesIt: 'Avverbio di luogo.'
    },
    {
      wordRu: 'там',
      ipa: '[tam]',
      translationIt: 'lì / là',
      audioTextToSpeak: 'там',
      notesIt: 'Avverbio di luogo.'
    },
    {
      wordRu: 'это',
      ipa: '[ˈɛtə]',
      translationIt: 'questo / questa è...',
      audioTextToSpeak: 'это',
      notesIt: 'Parola fondamentale: si usa per presentare cose o persone ("Это мама", "Это дом").'
    },
    {
      wordRu: 'он / она',
      ipa: '[on / ɐˈna]',
      translationIt: 'lui / lei',
      audioTextToSpeak: 'он. она.',
      notesIt: 'Nota come in "она" la "o" non accentata si pronuncia quasi "a"!'
    }
  ]
};
