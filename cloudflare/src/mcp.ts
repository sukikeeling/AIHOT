import { DailyReport, Env, EventCluster, ScoredArticle } from "./types";

const TOOLS = [
  {
    name: "myhot_get_latest",
    description: "获取最新精选 AI 科技资讯速报，按权威五轴打分排序，支持按类别筛选。",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["all", "model_release", "product_launch", "tool_or_prompt", "research_paper", "industry_event"],
          description: "筛选类别：all（全部）、model_release（大模型）、product_launch（产品）、research_paper（论文）、tool_or_prompt（工具技巧）"
        },
        limit: { type: "number", description: "返回数量，默认 10 条" }
      }
    }
  },
  {
    name: "myhot_hot_topics",
    description: "获取当前全网独立信源热度最高的重大 AI 事件聚类榜单（防重复刷屏）。",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "返回热度榜前 N 条，默认 5" }
      }
    }
  },
  {
    name: "myhot_get_daily",
    description: "获取今日或指定日期的全量 AI 每日早报（分节精读与核心摘要）。",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "日期格式 YYYY-MM-DD，省略则获取最新一期早报" }
      }
    }
  },
  {
    name: "myhot_search",
    description: "按关键词、公司或技术术语全文检索 AIHOT 沉淀的资讯情报库。",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "搜索关键词，例如 'DeepSeek', 'Sora', 'Claude'" },
        limit: { type: "number", description: "返回数量，默认 10" }
      },
      required: ["query"]
    }
  }
];

export async function handleMcpRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // If GET, return basic server info or SSE handshake
  if (request.method === "GET") {
    return new Response(
      JSON.stringify({
        name: "aihot-mcp",
        version: "2.0.0",
        protocol: "mcp/1.0",
        endpoint: url.origin + "/api/mcp",
        toolsCount: TOOLS.length
      }, null, 2),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  // Handle POST JSON-RPC
  try {
    const body: any = await request.json();
    const { id, method, params } = body;

    if (method === "initialize") {
      return jsonRpc(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "aihot-radar", version: "2.0.0" }
      });
    }

    if (method === "notifications/initialized") {
      return new Response(null, { status: 204 });
    }

    if (method === "tools/list") {
      return jsonRpc(id, { tools: TOOLS });
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const args = params?.arguments || {};

      // 1. myhot_get_latest
      if (toolName === "myhot_get_latest") {
        const raw = await env.AIHOT_KV.get("aihot:articles");
        let articles: ScoredArticle[] = raw ? JSON.parse(raw) : [];
        if (args.category && args.category !== "all") {
          articles = articles.filter((a) => a.category === args.category);
        }
        const limit = args.limit || 10;
        const result = articles.slice(0, limit).map((a) => ({
          title: a.title,
          score: a.score,
          category: a.category,
          source: a.sourceName,
          summary: a.summaryZh,
          link: a.link,
          time: a.publishedAt
        }));

        return jsonRpc(id, {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        });
      }

      // 2. myhot_hot_topics
      if (toolName === "myhot_hot_topics") {
        const raw = await env.AIHOT_KV.get("aihot:events");
        const events: EventCluster[] = raw ? JSON.parse(raw) : [];
        const limit = args.limit || 5;
        const result = events.slice(0, limit).map((e) => ({
          title: e.title,
          heatScore: e.heat,
          sourceCount: e.articleCount,
          summary: e.summary,
          sources: e.articles.map((a) => `${a.sourceName} (${a.link})`)
        }));

        return jsonRpc(id, {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        });
      }

      // 3. myhot_get_daily
      if (toolName === "myhot_get_daily") {
        const date = args.date || new Date().toISOString().slice(0, 10);
        let raw = await env.AIHOT_KV.get(`aihot:daily:${date}`);
        if (!raw) {
          raw = await env.AIHOT_KV.get("aihot:daily:latest");
        }
        const daily: DailyReport = raw ? JSON.parse(raw) : null;
        return jsonRpc(id, {
          content: [
            {
              type: "text",
              text: daily ? JSON.stringify(daily, null, 2) : "暂未生成该日期的早报，请稍后重试。"
            }
          ]
        });
      }

      // 4. myhot_search
      if (toolName === "myhot_search") {
        const raw = await env.AIHOT_KV.get("aihot:articles");
        const articles: ScoredArticle[] = raw ? JSON.parse(raw) : [];
        const q = (args.query || "").toLowerCase();
        const matches = articles
          .filter(
            (a) =>
              a.title.toLowerCase().includes(q) ||
              a.summaryZh.toLowerCase().includes(q) ||
              a.tags.some((t) => t.toLowerCase().includes(q))
          )
          .slice(0, args.limit || 10);

        return jsonRpc(id, {
          content: [
            {
              type: "text",
              text: JSON.stringify(matches, null, 2)
            }
          ]
        });
      }

      return jsonRpcError(id, -32601, `Method not found: ${toolName}`);
    }

    return jsonRpcError(id, -32601, `Unknown method: ${method}`);
  } catch (err: any) {
    return jsonRpcError(null, -32700, `Parse error: ${err.message}`);
  }
}

function jsonRpc(id: any, result: any): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

function jsonRpcError(id: any, code: number, message: string): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
