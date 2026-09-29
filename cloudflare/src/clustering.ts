import { EventCluster, ScoredArticle } from "./types";

export function clusterArticles(articles: ScoredArticle[]): EventCluster[] {
  const clusters: Map<string, EventCluster> = new Map();

  for (const art of articles) {
    // Determine cluster key: extract core entity or keywords from tags and title
    const mainTag = art.tags?.[0] || art.sourceName;
    const clusterKey = `${art.category}_${mainTag.toLowerCase().replace(/\s+/g, "_")}`;

    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, {
        id: clusterKey,
        title: art.title,
        summary: art.summaryZh,
        category: art.category,
        heat: 10 + (art.score > 80 ? 15 : 5),
        articleCount: 1,
        articles: [
          {
            id: art.id,
            title: art.title,
            sourceName: art.sourceName,
            link: art.link,
            score: art.score,
            publishedAt: art.publishedAt
          }
        ],
        firstSeenAt: art.publishedAt,
        lastUpdatedAt: art.publishedAt
      });
    } else {
      const c = clusters.get(clusterKey)!;
      c.articleCount += 1;
      c.heat += 15 + (art.score > 80 ? 10 : 5);
      // Select the highest scoring article title/summary as the representative
      if (art.score > (c.articles[0]?.score || 0)) {
        c.title = art.title;
        c.summary = art.summaryZh;
      }
      c.articles.push({
        id: art.id,
        title: art.title,
        sourceName: art.sourceName,
        link: art.link,
        score: art.score,
        publishedAt: art.publishedAt
      });
      c.lastUpdatedAt = art.publishedAt;
    }
  }

  // Sort clusters by heat descending
  return Array.from(clusters.values()).sort((a, b) => b.heat - a.heat);
}
