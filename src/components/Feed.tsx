import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useNewsStore } from '../store/useNewsStore';
import { fetchNews } from '../services/gemini';

export const Feed: React.FC = () => {
  const {
    currentCategory,
    searchQuery,
    articles,
    setArticles,
    appendArticles,
    loading,
    setLoading,
    loadingMore,
    setLoadingMore,
    error,
    setError,
    setSelectedArticle,
    setCurrentCategory,
    setSearchQuery,
  } = useNewsStore();

  const query = currentCategory || searchQuery;

  useEffect(() => {
    const loadInitialNews = async () => {
      if (!query) return;
      
      setArticles([]); // Clear old articles immediately to show loading state
      setLoading(true);
      setError(null);
      try {
        const newArticles = await fetchNews(query);
        setArticles(newArticles);
      } catch (err: any) {
        setError(err.message || 'Der opstod en fejl.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialNews();
  }, [query, setArticles, setError, setLoading]);

  const handleLoadMore = async () => {
    if (!query || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const existingTitles = articles.map(a => a.title);
      const newArticles = await fetchNews(query, existingTitles);
      appendArticles(newArticles);
    } catch (err: any) {
      setError(err.message || 'Kunne ikke indlæse flere nyheder.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleBack = () => {
    setCurrentCategory(null);
    setSearchQuery('');
  };

  if (!query) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-main-bg pb-24"
    >
      <header className="sticky top-0 z-10 bg-main-bg/80 backdrop-blur-md border-b border-black/5 px-4 py-4 flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-text-primary" />
        </button>
        <h2 className="text-xl font-serif font-bold text-text-primary truncate">
          {query}
        </h2>
      </header>

      <div className="p-4 space-y-6">
        {loading && articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Henter de seneste nyheder...</p>
          </div>
        ) : error && articles.length === 0 ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center">
            {error}
          </div>
        ) : (
          <>
            {articles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedArticle(article)}
                className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="h-48 w-full bg-gray-200 relative">
                  <img
                    src={`https://picsum.photos/seed/${encodeURIComponent(article.imageUrl)}/800/600`}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between text-xs font-medium text-text-muted mb-3 uppercase tracking-wider">
                    <span>{article.source}</span>
                    <span>{article.timeAgo}</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-text-primary mb-2 line-clamp-2 leading-tight">
                    {article.title}
                  </h3>
                  <p className="text-text-muted line-clamp-3 text-sm leading-relaxed mb-4">
                    {article.summary}
                  </p>
                  <div className="flex items-center text-blue-600 font-medium text-sm">
                    Læs mere <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </motion.article>
            ))}

            {articles.length > 0 && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-4 bg-white rounded-2xl shadow-sm border border-black/5 text-text-primary font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Indlæser...
                  </>
                ) : (
                  'Indlæs flere'
                )}
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
