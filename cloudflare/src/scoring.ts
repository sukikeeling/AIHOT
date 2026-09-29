import { Env, RawArticle, ScoredArticle } from "./types";

const SYSTEM_PROMPT = `你是 AIHOT 的高级 AI 情报评分与摘要专家。你的任务是对输入的科技/AI 资讯进行五轴价值打分并生成精炼的中文答案先行摘要。

【防幻觉铁律】
1. 严禁添加原文未明确提到的参数、性能数字、版本号或特定产品名。
2. 不确定的细节宁可省略，不要主观臆想扩写。
3. 原文用相对时间（如近日/上周/今年），摘要中保持相对说法，严禁脑补推演为具体年份。
4. 摘要必须“结论/答案先行”：首句直接概括核心发布、重大变化或核心突破，再提供关键事实支撑。

【五轴打分维度（各0-10分）】
- sig（实质份量）：在 AI 演进时间线上是里程碑节点，还是微小脚注；
- nov（信息增量）：带来多少明确的新能力、新数据、新方法或新认知；
- cred（证据强度）：核心事实的可靠程度（官方直接发布 > 媒体二级转述）；
- reson（共振面）：对关注 AI 技术的开发者、产品经理与普通从业者的吸引力；
- act（可用性）：是否能立刻上手体验、复现、调用或迁移。

【综合注意力分（0-100）计算公式】
score = (sig * 3.0 + nov * 2.5 + cred * 2.0 + reson * 1.5 + act * 1.0);

请严格以 JSON 格式输出，不要包含任何 markdown 代码块外部标记：
{
  "titleZh": "准确专业的中文标题",
  "category": "model_release" | "product_launch" | "tool_or_prompt" | "research_paper" | "industry_event" | "tutorial_explainer",
  "score": 0到100之间的整数,
  "reason": "1-2句话推荐理由（说明为何值得看或为何分高）",
  "summaryZh": "答案先行的精炼中文摘要（100-200字，重点突出核心事实与影响）",
  "tags": ["标签1", "标签2", "标签3"]
}`;

export async function scoreArticle(article: RawArticle, env: Env): Promise<ScoredArticle | null> {
  const userContent = `来源: ${article.sourceName} (分级: ${article.sourceTier})
原文标题: ${article.title}
原文链接: ${article.link}
正文或摘要内容:
${article.content}`;

  try {
    let rawJson = "";

    // 1. Try DeepSeek API first if key exists
    if (env.DEEPSEEK_API_KEY) {
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2
        })
      });

      if (res.ok) {
        const data: any = await res.json();
        rawJson = data.choices?.[0]?.message?.content || "";
      } else {
        console.warn(`[DeepSeek API] Error ${res.status}, falling back to Workers AI...`);
      }
    }

    // 2. Fallback to Cloudflare Workers AI if DeepSeek is unavailable or not set
    if (!rawJson && env.AI) {
      try {
        const aiRes = await env.AI.run("@cf/meta/llama-3.3-70b-instruct", {
          messages: [
            { role: "system", content: SYSTEM_PROMPT + "\n请严格直接返回纯 JSON 格式。" },
            { role: "user", content: userContent }
          ],
          temperature: 0.2
        });
        rawJson = aiRes?.response || "";
      } catch (cfErr: any) {
        console.warn(`[Workers AI] Error: ${cfErr.message}`);
      }
    }

    if (!rawJson) {
      // Fallback mechanical scoring if no LLM answered
      return {
        id: article.id,
        sourceId: article.sourceId,
        sourceName: article.sourceName,
        sourceTier: article.sourceTier,
        title: article.title,
        originalTitle: article.title,
        link: article.link,
        publishedAt: article.pubDate,
        category: "product_launch",
        score: article.sourceTier === "T1" ? 75 : 60,
        reason: "来自权威官方一手发布。",
        summaryZh: article.content.slice(0, 150) + "...",
        tags: [article.sourceName, "AI动态"],
        firstParty: article.sourceTier === "T1"
      };
    }

    // Parse output JSON
    const parsedMatch = rawJson.match(/\{[\s\S]*\}/);
    if (!parsedMatch) return null;
    const parsed = JSON.parse(parsedMatch[0]);

    const finalScore = Math.min(100, Math.max(0, Math.round(Number(parsed.score) || 60)));

    return {
      id: article.id,
      sourceId: article.sourceId,
      sourceName: article.sourceName,
      sourceTier: article.sourceTier,
      title: parsed.titleZh || article.title,
      originalTitle: article.title,
      link: article.link,
      publishedAt: article.pubDate,
      category: parsed.category || "product_launch",
      score: finalScore,
      reason: parsed.reason || "精选高质量资讯",
      summaryZh: parsed.summaryZh || article.content.slice(0, 150),
      tags: Array.isArray(parsed.tags) ? parsed.tags : ["AI"],
      firstParty: article.sourceTier === "T1"
    };
  } catch (err: any) {
    console.error(`[Scoring Error] ${article.title}: ${err.message}`);
    return null;
  }
}
