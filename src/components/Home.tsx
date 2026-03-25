import React, { useState } from 'react';
import { Search, MapPin, TrendingUp, Globe, LineChart, FileCode2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useNewsStore } from '../store/useNewsStore';
import { Category } from '../types';

const categories: { id: Category; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'Danmark', label: 'Danmark', icon: <MapPin className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
  { id: 'Finansmarkederne', label: 'Finansmarkederne', icon: <TrendingUp className="w-6 h-6" />, color: 'bg-green-50 text-green-600' },
  { id: 'Aktiemarkedet', label: 'Aktiemarkedet', icon: <LineChart className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600' },
  { id: 'Geopolitik', label: 'Geopolitik', icon: <Globe className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600' },
];

export const Home: React.FC = () => {
  const [localSearch, setLocalSearch] = useState('');
  const { setCurrentCategory, setSearchQuery, setShowPromptPage } = useNewsStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchQuery(localSearch.trim());
      setCurrentCategory(null);
    }
  };

  const today = new Intl.DateTimeFormat('da-DK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 pb-24 min-h-screen bg-main-bg"
    >
      <header className="mb-8 pt-8">
        <p className="text-text-muted text-sm font-medium uppercase tracking-wider mb-1">
          {today}
        </p>
        <h1 className="text-4xl font-serif font-bold text-text-primary">
          Din Briefing
        </h1>
      </header>

      <form onSubmit={handleSearch} className="relative mb-8">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-text-muted" />
        </div>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Søg efter nyheder..."
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border border-black/5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-lg"
        />
      </form>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setCurrentCategory(cat.id);
              setSearchQuery('');
            }}
            className="flex flex-col items-start p-6 bg-white rounded-2xl shadow-sm border border-black/5 hover:shadow-md transition-all active:scale-95"
          >
            <div className={`p-3 rounded-xl mb-4 ${cat.color}`}>
              {cat.icon}
            </div>
            <span className="font-semibold text-text-primary text-left leading-tight">
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowPromptPage(true)}
        className="w-full flex items-center justify-center gap-2 py-4 bg-white rounded-2xl shadow-sm border border-black/5 text-text-muted hover:text-text-primary transition-colors"
      >
        <FileCode2 className="w-5 h-5" />
        <span className="font-medium">Se Specifikation</span>
      </button>
    </motion.div>
  );
};
