export interface HistoricalContext {
  phrase: string;
  explanation: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  timeAgo: string;
  source: string;
  sourceUrl: string;
  imageUrl: string;
  historicalContexts: HistoricalContext[];
  readingTime: number;
}

export type Category = 'Danmark' | 'Finansmarkederne' | 'Aktiemarkedet' | 'Geopolitik';
