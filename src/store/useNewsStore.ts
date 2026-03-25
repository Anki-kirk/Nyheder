import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Article, Category } from '../types';

interface NewsState {
  currentCategory: Category | null;
  searchQuery: string;
  articles: Article[];
  bookmarkedArticles: Article[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  selectedArticle: Article | null;
  showPromptPage: boolean;
  
  // Actions
  setCurrentCategory: (category: Category | null) => void;
  setSearchQuery: (query: string) => void;
  setArticles: (articles: Article[]) => void;
  appendArticles: (articles: Article[]) => void;
  toggleBookmark: (article: Article) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loadingMore: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedArticle: (article: Article | null) => void;
  setShowPromptPage: (show: boolean) => void;
}

export const useNewsStore = create<NewsState>()(
  persist(
    (set) => ({
      currentCategory: null,
      searchQuery: '',
      articles: [],
      bookmarkedArticles: [],
      loading: false,
      loadingMore: false,
      error: null,
      selectedArticle: null,
      showPromptPage: false,

      setCurrentCategory: (category) => set({ currentCategory: category }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setArticles: (articles) => set({ articles }),
      appendArticles: (newArticles) => set((state) => ({ articles: [...state.articles, ...newArticles] })),
      toggleBookmark: (article) => set((state) => {
        const isBookmarked = state.bookmarkedArticles.some(a => a.id === article.id);
        if (isBookmarked) {
          return { bookmarkedArticles: state.bookmarkedArticles.filter(a => a.id !== article.id) };
        } else {
          return { bookmarkedArticles: [...state.bookmarkedArticles, article] };
        }
      }),
      setLoading: (loading) => set({ loading }),
      setLoadingMore: (loadingMore) => set({ loadingMore }),
      setError: (error) => set({ error }),
      setSelectedArticle: (article) => set({ selectedArticle: article }),
      setShowPromptPage: (show) => set({ showPromptPage: show }),
    }),
    {
      name: 'news-storage',
      partialize: (state) => ({ bookmarkedArticles: state.bookmarkedArticles }),
    }
  )
);
