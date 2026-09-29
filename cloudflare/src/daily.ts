import { DailyReport, EventCluster, ScoredArticle } from "./types";

const CATEGORY_MAP: Record<string, string> = {
  model_release: "🔥 核心模型重大发布",
  product_launch: "🚀 AI 爆款产品与重大更新",
  tool_or_prompt: "🛠️ 开发者工具与实战技巧",
  research_paper: "📑 前沿重磅论文解读",
  industry_event: "🌐 商业巨头与行业动向",
  tutorial_explainer: "💡 技术深度复盘与教程"
};

export function generateDailyReport(articles: ScoredArticle[], dateStr?: string): DailyReport {
  const date = dateStr || new Date().toISOString().slice(0, 10);

  // Group by category
  const groups: Record<string, ScoredArticle[]> = {};
  for (const art of articles) {
    if (!groups[art.category]) groups[art.category] = [];
    groups[art.category].push(art);
  }

  const sections = Object.entries(groups).map(([cat, items]) => ({
    category: cat,
    categoryLabel: CATEGORY_MAP[cat] || "🌟 综合资讯",
    items: items.sort((a, b) => b.score - a.score).slice(0, 5)
  }));

  const topPick = articles.slice(0, 3).map((a) => a.title).join("；");

  return {
    date,
    title: `【AIHOT 每日早报】${date} 全球 AI 要闻精粹`,
    summary: `今日全球 AI 重点聚焦：${topPick || "大模型前沿迭代与产业应用持续演进"}。五轴打分精选，直击第一手硬核进展。`,
    sections,
    generatedAt: new Date().toISOString()
  };
}
