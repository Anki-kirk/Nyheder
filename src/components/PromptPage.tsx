import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useNewsStore } from '../store/useNewsStore';

const promptText = `Byg en AI-drevet nyhedsapplikation til mobile enheder (vises i en max-w-md container) med React 18, TypeScript, Vite og Tailwind CSS. Appen skal fungere som en intelligent "Briefing" og bruge Google Gemini API (@google/genai) til at hente, opsummere og læse nyheder op.

**1. Visuelt Design & UI (Apple Human Interface Guidelines inspireret):**
- Baggrundsfarve: #E5E5EA (app container) og #F5F5F7 (main view).
- Tekstfarver: #1D1D1F (primær), #86868B (sekundær/muted).
- Typografi: Inter (sans-serif) til UI, Playfair Display eller lignende serif til overskrifter.
- Komponenter skal have store border-radius (rounded-2xl), subtile borders (border-black/5) og bløde skygger (shadow-sm til shadow-2xl).
- Ikoner: Brug 'lucide-react' (MapPin, TrendingUp, Globe, Search, LineChart, ChevronRight, Bookmark, Play, ArrowLeft, FileCode2, Sparkles, BookOpen).
- Animationer: Brug 'motion/react' (Framer Motion) til bløde overgange (fade og slide) mellem sider (Home, Feed, ArticleView).

**2. State Management (Zustand eller Custom Hook):**
- Opret en 'useNewsStore' hook der holder styr på:
  - currentCategory (Danmark, Finansmarkederne, Aktiemarkedet, Geopolitik)
  - searchQuery (fritekst)
  - articles (array af Article objekter)
  - bookmarkedArticles (gemmes i localStorage)
  - loading (boolean), loadingMore (boolean), error (string | null)
  - selectedArticle (Article | null)
  - showPromptPage (boolean)

**3. Datamodeller:**
- Article: { id, title, summary, content, timeAgo, source, sourceUrl, imageUrl, historicalContexts: [{ phrase, explanation }], readingTime }

**4. AI Integrationer (Gemini API):**
- **Nyhedshentning (gemini-3.1-pro-preview eller gemini-3-flash-preview):**
  - Brug 'googleSearch' tool til at finde de 3-5 vigtigste nyheder inden for de seneste 24 timer baseret på kategori eller søgeord.
  - Tving outputtet til at være et strengt JSON-format via prompten.
  - Håndter JSON-parsing robust (fjern evt. markdown \`\`\`json blokke).
  - Generer et engelsk søgeord til 'imageUrl' for at hente et billede fra Unsplash (https://source.unsplash.com/random/800x600/?{imageUrl}).
  - Udregn 'readingTime' baseret på antal ord i 'content' (ca. 200 ord pr. minut).
- **Historisk Kontekst:**
  - Bed AI'en om at identificere komplekse begreber eller historiske referencer i teksten.
  - Returner den nøjagtige sætning ('phrase') og en dybdegående forklaring ('explanation').
  - I UI'en skal disse 'phrases' fremhæves i brødteksten med en stiplet understregning. Ved klik åbnes en modal/bottom-sheet med forklaringen.
- **Tekst-til-Tale (gemini-2.5-flash-preview-tts):**
  - Implementer en "Læs op" knap.
  - Send artiklens tekst til TTS-modellen med stemmen 'Zephyr'.
  - Modellen returnerer base64 PCM lyddata. Konverter dette manuelt til en WAV-fil i browseren (tilføj RIFF/WAVE header) og afspil via HTML5 Audio API.
- **Skær ind til benet (1-sætnings resume):**
  - En knap der beder AI'en destillere hele artiklen ned til én skarp sætning på dansk. Vises i en fremhævet boks i toppen af artiklen.
- **Gå i dybden (Udvid artikel):**
  - En knap der beder AI'en skrive 2-3 ekstra afsnit med mere baggrundsviden. Den nye tekst tilføjes gnidningsløst i bunden af den eksisterende artikel.

**5. Sider & Komponenter:**
- **Home:** Viser dags dato, en søgebar, og 4 hovedkategorier som store klikbare knapper. Inkluderer også en knap til at vise denne specifikation.
- **Feed:** Viser en liste af nyhedskort. Hvert kort viser billede, kilde, tidspunkt, overskrift og resume. Har en "Indlæs flere" knap i bunden, som sender de allerede indlæste titler med i prompten for at undgå duplikater.
- **ArticleView:** Viser det fulde billede i toppen, tilbage-knap, bogmærke-knap. Under billedet: kilde, læsetid, overskrift, AI-handlingsknapper (Læs op, Skær ind til benet, Gå i dybden) og selve brødteksten med interaktive historiske kontekster.
- **PromptPage:** En dedikeret side der viser denne fulde specifikation.

**6. Fejlhåndtering:**
- Vis brugervenlige fejlmeddelelser hvis API-kald fejler.
- Sørg for at appen ikke crasher hvis AI'en returnerer ugyldigt JSON.`;

export const PromptPage: React.FC = () => {
  const { setShowPromptPage } = useNewsStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-main-bg overflow-y-auto"
    >
      <header className="sticky top-0 z-10 bg-main-bg/80 backdrop-blur-md border-b border-black/5 px-4 py-4 flex items-center gap-4">
        <button
          onClick={() => setShowPromptPage(false)}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-text-primary" />
        </button>
        <h2 className="text-xl font-serif font-bold text-text-primary">
          Specifikation
        </h2>
      </header>

      <div className="p-6 pb-24">
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
          <pre className="whitespace-pre-wrap font-mono text-xs text-text-muted leading-relaxed">
            {promptText}
          </pre>
        </div>
      </div>
    </motion.div>
  );
};
