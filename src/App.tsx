import React from 'react';
import { AnimatePresence } from 'motion/react';
import { Home } from './components/Home';
import { Feed } from './components/Feed';
import { ArticleView } from './components/ArticleView';
import { PromptPage } from './components/PromptPage';
import { useNewsStore } from './store/useNewsStore';

export default function App() {
  const { currentCategory, searchQuery, selectedArticle, showPromptPage } = useNewsStore();

  const showFeed = currentCategory || searchQuery;

  return (
    <div className="min-h-screen bg-app-bg flex justify-center">
      {/* Mobile container constraint */}
      <div className="w-full max-w-md bg-main-bg min-h-screen relative overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          {!showFeed ? <Home key="home" /> : <Feed key="feed" />}
        </AnimatePresence>

        <AnimatePresence>
          {selectedArticle && <ArticleView key="article" />}
        </AnimatePresence>

        <AnimatePresence>
          {showPromptPage && <PromptPage key="prompt" />}
        </AnimatePresence>
      </div>
    </div>
  );
}
