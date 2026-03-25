import { GoogleGenAI, Type, Modality } from '@google/genai';
import { Article } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const fetchNews = async (
  query: string,
  existingTitles: string[] = []
): Promise<Article[]> => {
  const prompt = `
    Du er en nyhedsredaktør. Søg på nettet og find de 3-5 vigtigste og mest aktuelle nyhedsartikler, der specifikt handler om emnet: "${query}".
    ${existingTitles.length > 0 ? `Inkludér IKKE artikler med disse titler: ${existingTitles.join(', ')}` : ''}
    
    For hver artikel skal du levere:
    - id: En unik streng ID.
    - title: Overskriften på dansk.
    - summary: Et kort resume på 2-3 sætninger på dansk.
    - content: Den fulde artikeltekst på dansk (mindst 3 afsnit).
    - timeAgo: Hvor længe siden den blev publiceret (f.eks. "2 timer siden").
    - source: Nyhedskildens navn.
    - sourceUrl: URL'en til den originale artikel.
    - imageUrl: Et enkelt engelsk søgeord eller en kort sætning, der beskriver artiklen visuelt, til brug for en Unsplash billedsøgning (f.eks. "stock market", "danish parliament", "wind turbines").
    - historicalContexts: Identificer 1-3 komplekse begreber, historiske referencer eller fagudtryk i 'content'. For hver, angiv den nøjagtige 'phrase' fra teksten og en dybdegående, pædagogisk 'explanation' på dansk.
    
    Returnér resultatet strengt som et JSON-array af objekter, der matcher denne struktur.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              content: { type: Type.STRING },
              timeAgo: { type: Type.STRING },
              source: { type: Type.STRING },
              sourceUrl: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              historicalContexts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phrase: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ['phrase', 'explanation'],
                },
              },
            },
            required: ['id', 'title', 'summary', 'content', 'timeAgo', 'source', 'sourceUrl', 'imageUrl', 'historicalContexts'],
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('No response from AI');
    
    // Robust JSON parsing to handle potential markdown blocks
    let jsonString = text;
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    let rawArticles = [];
    try {
      rawArticles = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError, 'Raw text:', text);
      throw new Error('Kunne ikke læse nyhedsdata. Prøv igen.');
    }
    
    return rawArticles.map((article: any) => {
      // Calculate reading time (approx 200 words per minute)
      const wordCount = article.content.split(/\s+/).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));
      
      return {
        ...article,
        readingTime,
      };
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    throw new Error('Failed to fetch news. Please try again later.');
  }
};

export const getOneSentenceSummary = async (content: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Destillér følgende artikel ned til én skarp sætning på dansk:\n\n${content}`,
    });
    return response.text || '';
  } catch (error) {
    console.error('Error getting summary:', error);
    return 'Kunne ikke generere resume.';
  }
};

export const expandArticle = async (content: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Skriv 2-3 ekstra afsnit med mere baggrundsviden og dybde til følgende artikel. Skriv på dansk og sørg for, at det flyder naturligt som en forlængelse af teksten:\n\n${content}`,
    });
    return response.text || '';
  } catch (error) {
    console.error('Error expanding article:', error);
    return '';
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;
    
    return base64Audio;
  } catch (error) {
    console.error('Error generating speech:', error);
    return null;
  }
};

// Helper to convert base64 PCM to WAV
export const playBase64Pcm = async (base64Data: string) => {
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Gemini TTS returns 24kHz PCM by default
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  
  const buffer = new ArrayBuffer(44 + bytes.length);
  const view = new DataView(buffer);
  
  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bytes.length, true);
  writeString(view, 8, 'WAVE');
  
  // FMT sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
  view.setUint16(34, bitsPerSample, true);
  
  // Data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, bytes.length, true);
  
  // Write PCM data
  const pcmData = new Uint8Array(buffer, 44);
  pcmData.set(bytes);
  
  const blob = new Blob([buffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  await audio.play();
  return audio;
};

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
