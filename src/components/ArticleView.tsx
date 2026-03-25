import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Bookmark, Play, Sparkles, BookOpen, Loader2, X } from 'lucide-react';
import { useNewsStore } from '../store/useNewsStore';
import { getOneSentenceSummary, expandArticle, generateSpeech, playBase64Pcm } from '../services/gemini';

export const ArticleView: React.FC = () => {
  const { selectedArticle, setSelectedArticle, toggleBookmark, bookmarkedArticles } = useNewsStore();
  
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [loadingExpanded, setLoadingExpanded] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const [selectedContext, setSelectedContext] = useState<{ phrase: string; explanation: string } | null>(null);

  if (!selectedArticle) return null;

  const isBookmarked = bookmarkedArticles.some(a => a.id === selectedArticle.id);

  const handlePlayAudio = async () => {
    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }

    setLoadingAudio(true);
    try {
      const base64Audio = await generateSpeech(selectedArticle.content);
      if (base64Audio) {
        const audio = await playBase64Pcm(base64Audio);
        setAudioElement(audio);
        setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
    } finally {
      setLoadingAudio(false);
    }
  };

  const handleSummarize = async () => {
    setLoadingSummary(true);
    const result = await getOneSentenceSummary(selectedArticle.content);
    setSummary(result);
    setLoadingSummary(false);
  };

  const handleExpand = async () => {
    setLoadingExpanded(true);
    const result = await expandArticle(selectedArticle.content);
    setExpandedContent(result);
    setLoadingExpanded(false);
  };

  // Function to wrap historical phrases with clickable spans
  const renderContentWithContexts = (content: string) => {
    let elements: React.ReactNode[] = [content];

    selectedArticle.historicalContexts.forEach((context, index) => {
      const newElements: React.ReactNode[] = [];
      
      elements.forEach((el, elIndex) => {
        if (typeof el === 'string') {
          const parts = el.split(new RegExp(`(${context.phrase})`, 'gi'));
          parts.forEach((part, i) => {
            if (part.toLowerCase() === context.phrase.toLowerCase()) {
              newElements.push(
                <span
                  key={`${index}-${elIndex}-${i}`}
                  onClick={() => setSelectedContext(context)}
                  className="border-b border-dashed border-blue-500 text-blue-700 cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  {part}
                </span>
              );
            } else {
              newElements.push(part);
            }
          });
        } else {
          newElements.push(el);
        }
      });
      elements = newElements;
    });

    return elements;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-main-bg overflow-y-auto"
    >
      <div className="relative h-72 w-full bg-gray-200">
        <img
          src={`https://picsum.photos/seed/${encodeURIComponent(selectedArticle.imageUrl)}/800/600`}
          alt={selectedArticle.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
          <button
            onClick={() => setSelectedArticle(null)}
            className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => toggleBookmark(selectedArticle)}
            className={`p-3 backdrop-blur-md rounded-full transition-colors ${
              isBookmarked ? 'bg-blue-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Bookmark className="w-6 h-6" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="px-6 py-8 -mt-8 relative bg-main-bg rounded-t-3xl">
        <div className="flex items-center justify-between text-xs font-medium text-text-muted mb-4 uppercase tracking-wider">
          <span>{selectedArticle.source}</span>
          <span>{selectedArticle.readingTime} min læsning</span>
        </div>

        <h1 className="text-3xl font-serif font-bold text-text-primary mb-6 leading-tight">
          {selectedArticle.title}
        </h1>

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={handlePlayAudio}
            disabled={loadingAudio}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-2xl shadow-sm border border-black/5 text-sm font-semibold text-text-primary hover:bg-gray-50 transition-colors active:scale-95"
          >
            {loadingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" fill={isPlaying ? 'currentColor' : 'none'} />}
            {isPlaying ? 'Sæt på pause' : 'Læs op'}
          </button>
          <button
            onClick={handleSummarize}
            disabled={loadingSummary || summary !== null}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 rounded-2xl shadow-sm border border-blue-100 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors active:scale-95"
          >
            {loadingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Skær ind til benet
          </button>
        </div>

        <AnimatePresence>
          {summary && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold text-sm uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Kort fortalt</span>
              </div>
              <p className="text-lg font-serif italic text-blue-900 leading-relaxed">
                "{summary}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="prose prose-lg prose-blue max-w-none text-text-primary leading-relaxed">
          <p className="whitespace-pre-wrap">
            {renderContentWithContexts(selectedArticle.content)}
          </p>
          
          <AnimatePresence>
            {expandedContent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 pt-8 border-t border-black/10"
              >
                <div className="flex items-center gap-2 mb-4 text-text-muted font-semibold text-sm uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  <span>Dybdegående baggrund</span>
                </div>
                <p className="whitespace-pre-wrap text-text-muted">
                  {expandedContent}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!expandedContent && (
          <button
            onClick={handleExpand}
            disabled={loadingExpanded}
            className="w-full mt-10 flex items-center justify-center gap-2 py-4 bg-white rounded-2xl shadow-sm border border-black/5 text-text-primary font-medium hover:bg-gray-50 transition-colors active:scale-95"
          >
            {loadingExpanded ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Dykker ned i emnet...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                Gå i dybden
              </>
            )}
          </button>
        )}
      </div>

      {/* Historical Context Modal / Bottom Sheet */}
      <AnimatePresence>
        {selectedContext && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedContext(null)}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl p-6 pb-12 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-serif font-bold text-text-primary pr-8">
                  {selectedContext.phrase}
                </h3>
                <button
                  onClick={() => setSelectedContext(null)}
                  className="p-2 -mr-2 -mt-2 text-text-muted hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-text-muted leading-relaxed">
                {selectedContext.explanation}
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
