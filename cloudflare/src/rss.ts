import { RawArticle, Source } from "./types";

function cleanHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(new RegExp("<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>", "g"), "$1")
    .replace(new RegExp("<[^>]+>", "g"), " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">", "i"));
  if (!match) return "";
  return cleanHtml(match[1]);
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const match = xml.match(new RegExp("<" + tag + "[^>]*?" + attr + '=["\']([^"\']+)["\'][^>]*>', "i"));
  return match ? match[1] : "";
}

export async function parseFeed(source: Source): Promise<RawArticle[]> {
  try {
    const res = await fetch(source.feedUrl, {
      headers: {
        "User-Agent": "AIHOT-Radar/2.0 (Cloudflare Edge; +https://github.com/sukikeeling/AIHOT)",
        Accept: "application/rss+xml, application/atom+xml, text/xml, application/xml"
      }
    });

    if (!res.ok) {
      console.warn("[Feed] Fetch failed for " + source.name + ": " + res.status);
      return [];
    }

    const xml = await res.text();
    const articles: RawArticle[] = [];

    // RSS 2.0 (<item>)
    const itemRegex = new RegExp("<item[^>]*>([\\s\\S]*?)</item>", "gi");
    const itemMatches = [...xml.matchAll(itemRegex)];
    if (itemMatches.length > 0) {
      for (const item of itemMatches.slice(0, 10)) {
        const itemXml = item[1];
        const title = extractTag(itemXml, "title");
        let link = extractTag(itemXml, "link");
        if (!link) {
          const rawLink = itemXml.match(/<link[^>]*>([^<]+)/i);
          if (rawLink) link = rawLink[1].trim();
        }
        const pubDate = extractTag(itemXml, "pubDate") || new Date().toISOString();
        const content =
          extractTag(itemXml, "content:encoded") ||
          extractTag(itemXml, "description") ||
          title;

        if (title && link) {
          articles.push({
            id: hashId(link || title),
            sourceId: source.id,
            sourceName: source.name,
            sourceTier: source.tier,
            title,
            link,
            pubDate,
            content: content.slice(0, 1500)
          });
        }
      }
      return articles;
    }

    // Atom (<entry>)
    const entryRegex = new RegExp("<entry[^>]*>([\\s\\S]*?)</entry>", "gi");
    const entryMatches = [...xml.matchAll(entryRegex)];
    if (entryMatches.length > 0) {
      for (const entry of entryMatches.slice(0, 10)) {
        const entryXml = entry[1];
        const title = extractTag(entryXml, "title");
        let link = extractAttr(entryXml, "link", "href") || extractTag(entryXml, "link");
        const pubDate = extractTag(entryXml, "published") || extractTag(entryXml, "updated") || new Date().toISOString();
        const content =
          extractTag(entryXml, "content") ||
          extractTag(entryXml, "summary") ||
          title;

        if (title && link) {
          articles.push({
            id: hashId(link || title),
            sourceId: source.id,
            sourceName: source.name,
            sourceTier: source.tier,
            title,
            link,
            pubDate,
            content: content.slice(0, 1500)
          });
        }
      }
    }

    return articles;
  } catch (err: any) {
    console.error("[Feed Error] " + source.name + ": " + err.message);
    return [];
  }
}

function hashId(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
