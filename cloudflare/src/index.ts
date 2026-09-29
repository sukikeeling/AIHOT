import { clusterArticles } from "./clustering";
import { generateDailyReport } from "./daily";
import { handleMcpRequest } from "./mcp";
import { parseFeed } from "./rss";
import { scoreArticle } from "./scoring";
import { DEFAULT_SOURCES } from "./sources";
import { DailyReport, Env, EventCluster, RawArticle, ScoredArticle } from "./types";
import { renderHtml } from "./ui";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }

    // 1. MCP Endpoint (/api/mcp) - 私有授权保护，防止外部刷量耗尽 Cloudflare 额度
    if (path === "/api/mcp") {
      const authHeader = request.headers.get("Authorization");
      const urlToken = url.searchParams.get("token");
      const expectedToken = env.ADMIN_SECRET || "AningMaster2026!";
      const authorized = 
        (authHeader && authHeader === `Bearer ${expectedToken}`) ||
        (urlToken && urlToken === expectedToken);

      if (!authorized) {
        return new Response(JSON.stringify({ error: "403 Forbidden: MCP endpoint is private and token-protected." }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }
      return handleMcpRequest(request, env);
    }

    // 2. REST API: /api/v1/items
    if (path === "/api/v1/items") {
      const raw = await env.AIHOT_KV.get("aihot:articles");
      const articles: ScoredArticle[] = raw ? JSON.parse(raw) : [];
      return new Response(JSON.stringify({ code: 0, data: articles }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 3. REST API: /api/v1/hot-topics
    if (path === "/api/v1/hot-topics") {
      const raw = await env.AIHOT_KV.get("aihot:events");
      const events: EventCluster[] = raw ? JSON.parse(raw) : [];
      return new Response(JSON.stringify({ code: 0, data: events }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 4. REST API: /api/v1/reports/daily
    if (path === "/api/v1/reports/daily") {
      const raw = await env.AIHOT_KV.get("aihot:daily:latest");
      const daily: DailyReport = raw ? JSON.parse(raw) : null;
      return new Response(JSON.stringify({ code: 0, data: daily }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 5. Admin Trigger: /api/admin/crawl
    if (path === "/api/admin/crawl" && request.method === "POST") {
      const auth = request.headers.get("Authorization") || "";
      const token = auth.replace(/^Bearer\s+/i, "");
      const adminPwd = env.ADMIN_PASSWORD || "AningMaster2026!";

      if (token !== adminPwd) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      ctx.waitUntil(runCrawlPipeline(env));
      return new Response(
        JSON.stringify({
          code: 0,
          message: "抓取与五轴打分管线已在边缘后台启动，数据将在 15-30 秒内陆续同步！"
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. Web UI: Root (/)
    const [rawArticles, rawEvents, rawDaily, rawTime] = await Promise.all([
      env.AIHOT_KV.get("aihot:articles"),
      env.AIHOT_KV.get("aihot:events"),
      env.AIHOT_KV.get("aihot:daily:latest"),
      env.AIHOT_KV.get("aihot:last_updated")
    ]);

    const articles: ScoredArticle[] = rawArticles ? JSON.parse(rawArticles) : [];
    const events: EventCluster[] = rawEvents ? JSON.parse(rawEvents) : [];
    const daily: DailyReport | null = rawDaily ? JSON.parse(rawDaily) : null;
    const lastUpdated = rawTime || "未同步";

    const siteName = env.SITE_NAME || "🌸 AIHOT · 阿宁殿下的智能雷达";
    const html = renderHtml(siteName, articles, events, daily, lastUpdated);

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  },

  // Cloudflare Cron Trigger (Runs periodically)
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[Cron] Triggered scheduled crawl at ${new Date().toISOString()}`);
    ctx.waitUntil(runCrawlPipeline(env));
  }
};

export async function runCrawlPipeline(env: Env): Promise<void> {
  console.log("[Pipeline] Starting full feed collection & scoring...");

  // 1. Fetch raw articles from all sources
  const feedPromises = DEFAULT_SOURCES.map((s) => parseFeed(s));
  const feedResults = await Promise.allSettled(feedPromises);
  const rawArticles: RawArticle[] = [];

  for (const res of feedResults) {
    if (res.status === "fulfilled") {
      rawArticles.push(...res.value);
    }
  }

  console.log(`[Pipeline] Collected ${rawArticles.length} raw articles from ${DEFAULT_SOURCES.length} sources.`);

  // Load existing articles from KV
  const existingJson = await env.AIHOT_KV.get("aihot:articles");
  const existingArticles: ScoredArticle[] = existingJson ? JSON.parse(existingJson) : [];
  const existingIds = new Set(existingArticles.map((a) => a.id));

  // Filter for new items to score
  const newArticles = rawArticles.filter((a) => !existingIds.has(a.id)).slice(0, 15);
  console.log(`[Pipeline] Found ${newArticles.length} new items to evaluate.`);

  const newlyScored: ScoredArticle[] = [];
  for (const raw of newArticles) {
    const scored = await scoreArticle(raw, env);
    if (scored) {
      newlyScored.push(scored);
    }
  }

  // Merge and sort
  const allArticles = [...newlyScored, ...existingArticles]
    .sort((a, b) => b.score - a.score)
    .slice(0, 60);

  // Cluster articles into events
  const events = clusterArticles(allArticles);

  // Generate daily report
  const todayStr = new Date().toISOString().slice(0, 10);
  const daily = generateDailyReport(allArticles, todayStr);

  // Save to Cloudflare KV
  await Promise.all([
    env.AIHOT_KV.put("aihot:articles", JSON.stringify(allArticles)),
    env.AIHOT_KV.put("aihot:events", JSON.stringify(events)),
    env.AIHOT_KV.put("aihot:daily:latest", JSON.stringify(daily)),
    env.AIHOT_KV.put(`aihot:daily:${todayStr}`, JSON.stringify(daily)),
    env.AIHOT_KV.put("aihot:last_updated", new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }))
  ]);

  console.log(`[Pipeline] Successfully updated KV: ${allArticles.length} articles, ${events.length} events clustered.`);
}
