export interface Source {
  id: string;
  name: string;
  url: string;
  feedUrl: string;
  tier: "T1" | "T2"; // T1: official first-party, T2: media/curated
  categoryDefault?: string;
  enabled: boolean;
}

export interface RawArticle {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceTier: "T1" | "T2";
  title: string;
  link: string;
  pubDate: string;
  content: string;
}

export interface ScoredArticle {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceTier: "T1" | "T2";
  title: string;
  originalTitle: string;
  link: string;
  publishedAt: string;
  category: "model_release" | "product_launch" | "tool_or_prompt" | "research_paper" | "industry_event" | "tutorial_explainer";
  score: number; // 0-100
  reason: string;
  summaryZh: string;
  tags: string[];
  eventId?: string;
  firstParty: boolean;
}

export interface EventCluster {
  id: string;
  title: string;
  summary: string;
  category: string;
  heat: number;
  articleCount: number;
  articles: Array<{
    id: string;
    title: string;
    sourceName: string;
    link: string;
    score: number;
    publishedAt: string;
  }>;
  firstSeenAt: string;
  lastUpdatedAt: string;
}

export interface DailyReport {
  date: string;
  title: string;
  summary: string;
  sections: Array<{
    category: string;
    categoryLabel: string;
    items: ScoredArticle[];
  }>;
  generatedAt: string;
}

export interface Env {
  AIHOT_KV: KVNamespace;
  AI?: any;
  DEEPSEEK_API_KEY?: string;
  ADMIN_PASSWORD?: string;
  SITE_NAME?: string;
  SITE_URL?: string;
}
