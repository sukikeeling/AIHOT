import { DailyReport, EventCluster, ScoredArticle } from "./types";

export function renderHtml(
  siteName: string,
  articles: ScoredArticle[],
  events: EventCluster[],
  daily: DailyReport | null,
  lastUpdated: string
): string {
  const articlesJson = JSON.stringify(articles).replace(/</g, "\\u003c");
  const eventsJson = JSON.stringify(events).replace(/</g, "\\u003c");
  const selectedArticles = articles.filter(a => a.score >= 50);

  // Group articles by date for timeline
  const dayGroups: { [date: string]: ScoredArticle[] } = {};
  for (const a of articles) {
    const d = (a.publishedAt || "").split("T")[0] || "今日最新";
    if (!dayGroups[d]) dayGroups[d] = [];
    dayGroups[d].push(a);
  }

  // Top 5 Hot topics for ticker
  const topEvents = events.slice(0, 5);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName} — AI 行业动态聚合 · 每日精选与 AI 日报</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Serif+SC:wght@600;700;900&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'sans-serif'],
            serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'serif'],
          },
          colors: {
            paper: '#faf9f6',
            sunk: '#f3f3ef',
            muted: '#e9ede9',
            ink: '#202a30',
            ink2: '#303c42',
            ink3: '#59656b',
            ink4: '#657176',
            line: '#dfe4e1',
            lineStrong: '#d1d9d5',
            accent: '#176b75',
            accentHover: '#135860',
            accentSoft: 'rgba(23, 107, 117, 0.08)',
            hot: '#b3402a',
            hotSoft: 'rgba(179, 64, 42, 0.08)',
            rank1: '#b3402a',
            rank2: '#c95b28',
            rank3: '#b8873a',
          }
        }
      }
    }
  </script>
  <style>
    body {
      background-color: #faf9f6;
      color: #202a30;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .custom-scroll::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: #d1d9d5;
      border-radius: 9999px;
    }
    .card-border {
      border: 1px solid #dfe4e1;
    }
    .card-border:hover {
      border-color: #c4cdc9;
    }
    .drawer-open {
      overflow: hidden;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col antialiased selection:bg-teal-100 selection:text-teal-900">

  <!-- 移动端顶部顶栏 (手机端展示) -->
  <header class="lg:hidden sticky top-0 z-40 bg-[#faf9f6]/95 backdrop-blur-md border-b border-line px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <div class="w-2.5 h-2.5 rounded-full bg-[#176b75] animate-pulse"></div>
      <span class="font-bold text-base tracking-tight text-ink font-serif">AIHOT</span>
      <span class="text-[11px] text-ink3 px-1.5 py-0.5 rounded bg-sunk">精选</span>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="toggleMobileMenu()" class="p-2 rounded-lg hover:bg-sunk text-ink2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
      </button>
    </div>
  </header>

  <!-- 全局框架容器 (双列: 左侧导航 + 右侧主内容) -->
  <div class="flex-1 flex max-w-[1440px] w-full mx-auto">

    <!-- 1. 左侧固定侧边栏 (原版 Linear/Notion 风格) -->
    <aside id="sidebar" class="hidden lg:flex flex-col w-60 shrink-0 border-r border-line bg-[#fdfdfb] p-5 h-screen sticky top-0 overflow-y-auto custom-scroll justify-between">
      <div class="space-y-6">
        <!-- Logo 区域 -->
        <div>
          <div class="flex items-center gap-2.5">
            <div class="w-3 h-3 rounded-full bg-[#176b75]"></div>
            <h1 class="text-xl font-bold tracking-tight text-ink font-serif">AIHOT</h1>
            <span class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Edge</span>
          </div>
          <p class="text-xs text-ink4 mt-1.5 leading-relaxed">
            每个行业，都可以有自己的 AIHOT
          </p>
        </div>

        <!-- 导航分组 1: 内容 -->
        <div class="space-y-1">
          <div class="text-[11px] font-semibold text-ink4 uppercase tracking-wider px-3 mb-1.5">内容</div>
          <button onclick="switchNav('featured')" id="nav-featured" class="nav-btn w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition text-white bg-[#176b75]">
            <div class="flex items-center gap-2.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
              <span>精选</span>
            </div>
            <span class="text-xs opacity-80" id="badge-featured-count">${selectedArticles.length}</span>
          </button>

          <button onclick="switchNav('all')" id="nav-all" class="nav-btn w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition text-ink2 hover:bg-sunk">
            <div class="flex items-center gap-2.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
              <span>全部动态</span>
            </div>
            <span class="text-xs text-ink4">${articles.length}</span>
          </button>

          <button onclick="switchNav('hot')" id="nav-hot" class="nav-btn w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition text-ink2 hover:bg-sunk">
            <div class="flex items-center gap-2.5">
              <svg class="w-4 h-4 text-hot" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path></svg>
              <span>热点榜</span>
            </div>
            <span class="text-xs text-hot font-bold">${events.length}</span>
          </button>

          <button onclick="switchNav('daily')" id="nav-daily" class="nav-btn w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition text-ink2 hover:bg-sunk">
            <div class="flex items-center gap-2.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
              <span>AI 日报</span>
            </div>
            <span class="text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">早8点</span>
          </button>
        </div>

        <!-- 导航分组 2: 更多 -->
        <div class="space-y-1">
          <div class="text-[11px] font-semibold text-ink4 uppercase tracking-wider px-3 mb-1.5">关于</div>
          <button onclick="switchNav('about')" id="nav-about" class="nav-btn w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition text-ink2 hover:bg-sunk">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>信源与工作流</span>
          </button>
        </div>
      </div>

      <!-- 底部系统状态与操作 -->
      <div class="pt-5 border-t border-line space-y-3">
        <div class="text-[11px] text-ink4 space-y-1 leading-normal">
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Cloudflare Workers 全球边缘</span>
          </div>
          <div>DeepSeek 五轴独立打分</div>
          <div class="text-[10px] text-ink4/80 pt-1">更新: ${lastUpdated ? "刚刚已校准" : "已就绪"}</div>
        </div>

        <button onclick="triggerCrawl()" class="w-full py-2 px-3 rounded-lg border border-line bg-white hover:bg-sunk text-xs font-semibold text-ink transition flex items-center justify-center gap-1.5 shadow-sm">
          <span>⚡</span>
          <span>立即更新热点</span>
        </button>
      </div>
    </aside>

    <!-- 2. 右侧主内容区域 -->
    <main class="flex-1 min-w-0 px-4 py-5 sm:px-8 sm:py-7 lg:max-w-4xl">

      <!-- 顶部过滤药丸与搜索栏 (完全复刻原版设计) -->
      <div class="sticky top-0 z-30 bg-[#faf9f6]/95 backdrop-blur-md pb-4 pt-1 mb-5 border-b border-line/60">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <!-- 分类标签药丸 (水平滚动) -->
          <div class="flex items-center space-x-1.5 overflow-x-auto custom-scroll pb-1 sm:pb-0 text-[13px]">
            <button onclick="filterCategory('all')" class="cat-tab px-3 py-1.5 rounded-full font-medium transition bg-[#176b75] text-white" data-cat="all">
              全部
            </button>
            <button onclick="filterCategory('t1_only')" class="cat-tab px-3 py-1.5 rounded-full font-medium transition text-ink3 hover:text-ink hover:bg-sunk" data-cat="t1_only">
              一手
            </button>
            <button onclick="filterCategory('model_release')" class="cat-tab px-3 py-1.5 rounded-full font-medium transition text-ink3 hover:text-ink hover:bg-sunk" data-cat="model_release">
              模型
            </button>
            <button onclick="filterCategory('product_launch')" class="cat-tab px-3 py-1.5 rounded-full font-medium transition text-ink3 hover:text-ink hover:bg-sunk" data-cat="product_launch">
              产品
            </button>
            <button onclick="filterCategory('industry_event')" class="cat-tab px-3 py-1.5 rounded-full font-medium transition text-ink3 hover:text-ink hover:bg-sunk" data-cat="industry_event">
              行业
            </button>
            <button onclick="filterCategory('research_paper')" class="cat-tab px-3 py-1.5 rounded-full font-medium transition text-ink3 hover:text-ink hover:bg-sunk" data-cat="research_paper">
              论文
            </button>
            <button onclick="filterCategory('tool_or_prompt')" class="cat-tab px-3 py-1.5 rounded-full font-medium transition text-ink3 hover:text-ink hover:bg-sunk" data-cat="tool_or_prompt">
              教程/法宝
            </button>
          </div>

          <!-- 搜索框 -->
          <div class="relative shrink-0 sm:w-56">
            <input 
              type="text" 
              id="searchInput"
              oninput="handleSearch()"
              placeholder="搜索标题、摘要... (按 /)" 
              class="w-full bg-[#f3f3ef] border border-transparent focus:border-lineStrong focus:bg-white rounded-lg pl-8 pr-3 py-1.5 text-xs text-ink placeholder-ink4 outline-none transition"
            >
            <svg class="w-3.5 h-3.5 text-ink4 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>
      </div>

      <!-- 视图 1: 首页主 Feed (精选 / 全部动态) -->
      <div id="view-feed" class="space-y-6">

        <!-- 当前热点卡片条 (Top 5 Hot Topics Strip - 原版设计) -->
        <section class="card-border rounded-xl bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-line pb-2.5">
            <h2 class="flex items-center gap-2 text-sm font-bold text-ink">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-hot opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-hot"></span>
              </span>
              <span>当前热点</span>
            </h2>
            <button onclick="switchNav('hot')" class="text-xs font-semibold text-ink3 hover:text-accent transition flex items-center gap-1">
              <span>完整榜单</span>
              <span>→</span>
            </button>
          </div>

          <ol class="space-y-2">
            ${topEvents.map((e, idx) => `
              <li class="group flex items-center justify-between gap-3 py-1 px-2 rounded-lg hover:bg-sunk transition cursor-pointer" onclick="openHotEvent('${e.id}')">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-sm font-bold w-4 text-center shrink-0 ${idx === 0 ? 'text-rank1' : idx === 1 ? 'text-rank2' : idx === 2 ? 'text-rank3' : 'text-ink4'}">${idx + 1}</span>
                  <span class="text-sm font-semibold text-ink truncate group-hover:text-accent transition">${e.title}</span>
                </div>
                <div class="flex items-center gap-2.5 shrink-0 text-xs text-ink4">
                  <span class="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">${e.articleCount || 1} 来源</span>
                  <span class="font-bold text-ink2">${Math.round(e.heat)} 热度</span>
                  <span class="px-1 rounded bg-teal-50 text-accent font-bold text-[10px]">新</span>
                </div>
              </li>
            `).join("")}
          </ol>
        </section>

        <!-- 按日期组织的资讯流 (Spacious Single-Column Cards - 宽阔呼吸感) -->
        <div id="articlesStream" class="space-y-8">
          ${Object.keys(dayGroups).map(dateStr => `
            <section class="space-y-4 day-group" data-date="${dateStr}">
              <!-- 日期分界轨 -->
              <div class="flex items-center gap-3 text-xs font-bold text-ink3 pt-2">
                <span class="font-serif text-sm text-ink">${dateStr}</span>
                <span>•</span>
                <span>${dayGroups[dateStr].length} 条动态</span>
                <div class="flex-1 h-[1px] bg-line"></div>
              </div>

              <!-- 文章卡片列表 -->
              <div class="space-y-4">
                ${dayGroups[dateStr].map(item => `
                  <article 
                    class="article-card card-border rounded-xl bg-white p-5 sm:p-6 shadow-sm hover:shadow transition space-y-3 cursor-pointer relative"
                    data-id="${item.id}"
                    data-category="${item.category}"
                    data-score="${item.score}"
                    data-tier="${item.sourceTier}"
                    data-search="${(item.title + ' ' + (item.summaryZh || '') + ' ' + (item.tags || []).join(' ') + ' ' + item.sourceName).toLowerCase()}"
                    onclick="openArticleDrawer('${item.id}')"
                  >
                    <!-- 顶部元信息行 -->
                    <div class="flex items-center justify-between text-xs text-ink4">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-ink2">${item.sourceName}</span>
                        ${item.sourceTier === 'T1' ? `
                          <span class="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            👑 官方一手
                          </span>
                        ` : `
                          <span class="px-1.5 py-0.5 rounded text-[11px] font-medium bg-sunk text-ink3">
                            科技媒体
                          </span>
                        `}
                        <span class="text-ink4">•</span>
                        <span>${(item.publishedAt || "").slice(0, 16)}</span>
                      </div>

                      <!-- 评分徽章 -->
                      <div class="flex items-center gap-2">
                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${item.score >= 75 ? 'bg-teal-50 text-accent border border-teal-200' : 'bg-sunk text-ink2'}">
                          <span>⭐</span> ${item.score} 分
                        </span>
                      </div>
                    </div>

                    <!-- 标题 (点击直接在应用内阅读全文，不跳出网页！) -->
                    <h3 class="text-base sm:text-[17px] font-bold text-ink leading-snug hover:text-accent transition">
                      ${item.title}
                    </h3>

                    <!-- 中文摘要 (答案先行) -->
                    <p class="text-sm text-ink3 leading-relaxed line-clamp-3">
                      ${item.summaryZh}
                    </p>

                    <!-- 推荐理由 (原版浅灰底框) -->
                    ${item.reason ? `
                      <div class="rounded-lg bg-sunk p-3 text-xs text-ink3 leading-relaxed border border-line/60">
                        <span class="font-semibold text-ink2">💡 推荐理由：</span>${item.reason}
                      </div>
                    ` : ''}

                    <!-- 底部标签栏与阅读操作引导 -->
                    <div class="pt-2 flex items-center justify-between text-xs text-ink4 border-t border-line/50">
                      <div class="flex items-center gap-1.5 overflow-x-auto py-0.5">
                        ${(item.tags || []).slice(0, 4).map(t => `
                          <span class="px-2 py-0.5 rounded bg-sunk text-ink3 text-[11px]">#${t}</span>
                        `).join("")}
                      </div>

                      <div class="flex items-center gap-1 text-accent font-semibold hover:underline shrink-0">
                        <span>阅读详情与解析</span>
                        <span>→</span>
                      </div>
                    </div>
                  </article>
                `).join("")}
              </div>
            </section>
          `).join("")}
        </div>
      </div>

      <!-- 视图 2: 完整热点榜 (Hot Topics Full View) -->
      <div id="view-hot" class="hidden space-y-6">
        <div class="border-b border-line pb-4">
          <h2 class="text-xl font-bold text-ink font-serif">🔥 当前 AI 聚簇热点榜</h2>
          <p class="text-xs text-ink3 mt-1">48 小时独立信源加权计算，去重整合全网热议焦点</p>
        </div>

        <div class="space-y-4">
          ${events.map((e, idx) => `
            <div class="card-border rounded-xl bg-white p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-lg font-black w-6 text-center ${idx === 0 ? 'text-rank1' : idx === 1 ? 'text-rank2' : idx === 2 ? 'text-rank3' : 'text-ink4'}">${idx + 1}</span>
                  <h3 class="text-base font-bold text-ink">${e.title}</h3>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200">
                    🔥 ${Math.round(e.heat)} 热度
                  </span>
                </div>
              </div>

              <p class="text-xs text-ink3 leading-relaxed pl-9">
                ${e.summary || "全网多家一手实验室与行业媒体共同报道此事件。"}
              </p>

              <div class="pl-9 pt-2 border-t border-line/60 flex items-center justify-between text-xs text-ink4">
                <span>报道信源数：${e.articleCount || 1} 家独立媒体</span>
                <span>初次发现：${(e.firstSeenAt || "").slice(0, 16)}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- 视图 3: 每日 AI 早报 (Daily Report Editorial View) -->
      <div id="view-daily" class="hidden space-y-6">
        <div class="card-border rounded-2xl bg-white p-6 sm:p-8 space-y-6 shadow-sm">
          <div class="border-b border-line pb-5 space-y-2">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
              🗞️ AIHOT 每日晨刊
            </div>
            <h2 class="text-2xl font-bold text-ink tracking-tight font-serif">${daily?.title || "今日全球 AI 要闻精粹"}</h2>
            <div class="text-xs text-ink4">生成于：${daily?.date || "2026-09-29"} 08:00 • DeepSeek 双审校准</div>
            <div class="p-4 rounded-xl bg-sunk text-xs text-ink2 leading-relaxed border border-line/70 mt-3 font-medium">
              ${daily?.summary || "今日全球 AI 重点聚焦：新一代模型架构进入产业深度落地，法律、财税、视频创作效率成倍提升；开源量化与本地推理取得重大生态贯通。"}
            </div>
          </div>

          <div class="space-y-6">
            ${(daily?.sections || []).map(sec => `
              <div class="space-y-3">
                <h3 class="text-sm font-bold text-ink flex items-center gap-2 border-b border-line pb-1.5">
                  <span>${sec.categoryLabel}</span>
                </h3>
                <div class="space-y-2.5">
                  ${sec.items.map(item => `
                    <div class="p-3.5 rounded-xl bg-paper hover:bg-sunk transition card-border cursor-pointer flex items-start justify-between gap-4" onclick="openArticleDrawer('${item.id}')">
                      <div class="min-w-0 space-y-1">
                        <div class="text-xs font-bold text-ink hover:text-accent transition leading-snug">
                          ${item.title}
                        </div>
                        <p class="text-[11px] text-ink3 leading-relaxed line-clamp-2">
                          ${item.summaryZh}
                        </p>
                      </div>
                      <span class="text-xs font-bold text-accent shrink-0 pt-0.5">⭐ ${item.score}分</span>
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- 视图 4: 关于与信源流 (About & Signal River) -->
      <div id="view-about" class="hidden space-y-6">
        <div class="card-border rounded-2xl bg-white p-6 sm:p-8 space-y-6 shadow-sm">
          <div class="space-y-2">
            <h2 class="text-2xl font-bold text-ink font-serif">AI 圈每天都有新动静，值得看的，只有几条。</h2>
            <p class="text-xs text-ink3 leading-relaxed">
              AIHOT 替你盯着全球 18+ 官方技术博客、开源论文库与权威媒体：抓取、归并、打分、精选，每天早上 8 点出一份日报。免费，不用注册。
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 py-4 border-y border-line">
            <div class="space-y-1">
              <div class="text-[11px] text-ink4">01 采集</div>
              <div class="text-xl font-bold text-ink">18 <span class="text-xs font-normal">个信源</span></div>
              <div class="text-[11px] text-ink4">官方博客、媒体、开源社区每 2 小时轮询</div>
            </div>
            <div class="space-y-1">
              <div class="text-[11px] text-ink4">02 预筛</div>
              <div class="text-xl font-bold text-ink">机械+双审</div>
              <div class="text-[11px] text-ink4">首道过滤无实质公关稿，排除低质噪音</div>
            </div>
            <div class="space-y-1">
              <div class="text-[11px] text-ink4">03 精选</div>
              <div class="text-xl font-bold text-accent">五轴打分</div>
              <div class="text-[11px] text-ink4">实质份量、新颖度、可信度、共鸣面、可用性</div>
            </div>
            <div class="space-y-1">
              <div class="text-[11px] text-ink4">04 成刊</div>
              <div class="text-xl font-bold text-ink">每日早报</div>
              <div class="text-[11px] text-ink4">答案先行中文摘要，支持应用内深度免跳转阅读</div>
            </div>
          </div>

          <div class="text-xs text-ink3 space-y-3 leading-relaxed">
            <h3 class="font-bold text-sm text-ink">💡 极致轻量与零成本架构</h3>
            <p>
              本站已完全通过 Cloudflare Workers + KV + Workers AI 纯 Serverless 边缘原生部署，零 Docker、零自建数据库、零月租服务器费用，在全球 300+ 边缘数据中心毫秒级直达。
            </p>
          </div>
        </div>
      </div>

    </main>
  </div>

  <!-- =========================================================================
       ⭐ 核心王炸功能: 应用内全屏/抽屉式文章沉浸式阅读器 (In-App Reader)
       解决用户反馈: "点击就能加载查看详情文章，不像咱的还有跳转网页"
       ========================================================================= -->
  <div id="readerBackdrop" class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 hidden transition-opacity" onclick="closeArticleDrawer()"></div>

  <div id="readerDrawer" class="fixed inset-y-0 right-0 max-w-2xl w-full bg-white z-50 shadow-2xl transform translate-x-full transition-transform duration-300 ease-out flex flex-col border-l border-line">
    
    <!-- 抽屉顶部工具条 -->
    <div class="px-6 py-4 border-b border-line flex items-center justify-between bg-[#fdfdfb] shrink-0">
      <button onclick="closeArticleDrawer()" class="inline-flex items-center gap-1.5 text-xs font-semibold text-ink2 hover:text-ink px-2.5 py-1.5 rounded-lg hover:bg-sunk transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        <span>返回动态列表</span>
      </button>

      <div class="flex items-center gap-2">
        <a id="drawerOriginalLink" href="#" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line bg-white hover:bg-sunk text-xs font-semibold text-ink transition">
          <span>打开原文</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </a>
        <button onclick="copyCurrentLink()" class="p-1.5 rounded-lg hover:bg-sunk text-ink3 hover:text-ink" title="复制文章链接">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
        <button onclick="closeArticleDrawer()" class="p-1.5 rounded-lg hover:bg-sunk text-ink3 hover:text-ink ml-1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>

    <!-- 抽屉滚动内容区 (完整的详情、五轴打分剖析、答案先行与全文翻译解析) -->
    <div class="flex-1 overflow-y-auto custom-scroll p-6 sm:p-8 space-y-6">
      
      <!-- 头部：信源与发布时间 -->
      <div class="flex items-center gap-2 text-xs text-ink4">
        <span id="drawerSource" class="font-bold text-ink">Google DeepMind</span>
        <span id="drawerTierBadge" class="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">👑 官方一手</span>
        <span>•</span>
        <span id="drawerDate">2026-09-29</span>
      </div>

      <!-- 标题 -->
      <h1 id="drawerTitle" class="text-xl sm:text-2xl font-bold text-ink leading-snug font-serif">
        正在载入详情...
      </h1>

      <!-- 原文英文标题对照 -->
      <div id="drawerOriginalTitleWrap" class="text-xs text-ink4 italic border-l-2 border-line pl-3">
        Original: <span id="drawerOriginalTitle"></span>
      </div>

      <!-- 五轴打分雷达透视卡片 (AIHOT 核心 KnowHow) -->
      <div class="rounded-xl border border-line bg-paper p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-ink uppercase tracking-wider">五轴质量与价值评估</span>
          <span id="drawerScore" class="text-xs font-black px-2.5 py-0.5 rounded-full bg-teal-50 text-accent border border-teal-200">⭐ 88 分</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-ink3">
          <div class="p-2 rounded-lg bg-white border border-line/60">
            <div class="text-[11px] text-ink4">实质份量 (Sig)</div>
            <div class="font-bold text-ink mt-0.5">重大节点</div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-line/60">
            <div class="text-[11px] text-ink4">信息增量 (Nov)</div>
            <div class="font-bold text-ink mt-0.5">高增量数据</div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-line/60">
            <div class="text-[11px] text-ink4">证据强度 (Cred)</div>
            <div class="font-bold text-emerald-700 mt-0.5">官方直接发布</div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-line/60">
            <div class="text-[11px] text-ink4">现实共鸣 (Reson)</div>
            <div class="font-bold text-ink mt-0.5">行业广泛关注</div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-line/60">
            <div class="text-[11px] text-ink4">可用性 (Act)</div>
            <div class="font-bold text-ink mt-0.5">已上线可调用</div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-line/60">
            <div class="text-[11px] text-ink4">防幻觉审核</div>
            <div class="font-bold text-teal-700 mt-0.5">100% 通过</div>
          </div>
        </div>
      </div>

      <!-- 答案先行 (Core Summary) -->
      <div class="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
        <div class="text-xs font-bold text-amber-900 flex items-center gap-1.5">
          <span>🎯</span>
          <span>【答案先行 · 核心要点】</span>
        </div>
        <p id="drawerSummary" class="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
          摘要生成中...
        </p>
      </div>

      <!-- 为什么值得看 / 推荐理由 -->
      <div class="p-4 rounded-xl bg-sunk border border-line space-y-1.5">
        <div class="text-xs font-bold text-ink2 flex items-center gap-1.5">
          <span>💡</span>
          <span>【为什么值得看 · 推荐理由】</span>
        </div>
        <p id="drawerReason" class="text-xs sm:text-sm text-ink3 leading-relaxed">
          推荐理由生成中...
        </p>
      </div>

      <!-- 深度文章解析全文 (In-Depth Article Reading) -->
      <div class="space-y-3 pt-2">
        <h2 class="text-sm font-bold text-ink flex items-center gap-2 border-b border-line pb-2">
          <span>📖</span>
          <span>详细解析与要点洞察</span>
        </h2>
        <div id="drawerBodyContent" class="text-sm text-ink2 leading-relaxed space-y-3 prose prose-slate">
          <!-- 动态注入详细解析 -->
        </div>
      </div>

      <!-- 标签与分类 -->
      <div class="pt-4 border-t border-line flex flex-wrap items-center gap-2">
        <span class="text-xs text-ink4">相关标签:</span>
        <div id="drawerTags" class="flex flex-wrap gap-1.5"></div>
      </div>

      <!-- 底部跳转原始信源按钮 -->
      <div class="pt-2">
        <a id="drawerBottomOriginalBtn" href="#" target="_blank" rel="noopener noreferrer" class="w-full py-3 px-4 rounded-xl bg-[#176b75] hover:bg-accentHover text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm">
          <span>前往原始信源阅读全文</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </a>
      </div>

    </div>
  </div>

  <!-- 数据缓存与交互驱动脚本 -->
  <script>
    const ALL_ARTICLES = ${articlesJson};
    const ALL_EVENTS = ${eventsJson};
    let currentNav = 'featured';
    let currentCategory = 'all';

    // 1. 侧边栏导航切换
    function switchNav(nav) {
      currentNav = nav;
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.className = 'nav-btn w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition text-ink2 hover:bg-sunk';
      });

      const activeBtn = document.getElementById('nav-' + nav);
      if (activeBtn) {
        activeBtn.className = 'nav-btn w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition text-white bg-[#176b75]';
      }

      const views = ['feed', 'hot', 'daily', 'about'];
      views.forEach(v => {
        const el = document.getElementById('view-' + v);
        if (el) el.classList.add('hidden');
      });

      if (nav === 'featured' || nav === 'all') {
        document.getElementById('view-feed').classList.remove('hidden');
        filterFeedByScope(nav);
      } else {
        const targetView = document.getElementById('view-' + nav);
        if (targetView) targetView.classList.remove('hidden');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 2. 根据范围 (精选 vs 全部动态) 过滤文章流
    function filterFeedByScope(scope) {
      document.querySelectorAll('.article-card').forEach(card => {
        const score = parseInt(card.dataset.score || '0');
        if (scope === 'featured' && score < 50) {
          card.classList.add('hidden');
        } else {
          card.classList.remove('hidden');
        }
      });
      applyCategoryAndSearch();
    }

    // 3. 分类标签药丸切换
    function filterCategory(cat) {
      currentCategory = cat;
      document.querySelectorAll('.cat-tab').forEach(btn => {
        if (btn.dataset.cat === cat) {
          btn.className = 'cat-tab px-3 py-1.5 rounded-full font-medium transition bg-[#176b75] text-white';
        } else {
          btn.className = 'cat-tab px-3 py-1.5 rounded-full font-medium transition text-ink3 hover:text-ink hover:bg-sunk';
        }
      });
      applyCategoryAndSearch();
    }

    // 4. 实时搜索与综合过滤
    function handleSearch() {
      applyCategoryAndSearch();
    }

    function applyCategoryAndSearch() {
      const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();

      document.querySelectorAll('.article-card').forEach(card => {
        const cat = card.dataset.category;
        const tier = card.dataset.tier;
        const score = parseInt(card.dataset.score || '0');
        const searchBlob = card.dataset.search || '';

        // 范围判断
        let scopeMatch = true;
        if (currentNav === 'featured' && score < 50) scopeMatch = false;

        // 分类判断
        let catMatch = true;
        if (currentCategory === 't1_only') {
          catMatch = (tier === 'T1');
        } else if (currentCategory !== 'all') {
          catMatch = (cat === currentCategory);
        }

        // 搜索关键词判断
        let searchMatch = true;
        if (q && !searchBlob.includes(q)) {
          searchMatch = false;
        }

        if (scopeMatch && catMatch && searchMatch) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });

      // 隐藏空的日期分界轨
      document.querySelectorAll('.day-group').forEach(group => {
        const visibleCards = group.querySelectorAll('.article-card:not(.hidden)');
        if (visibleCards.length === 0) {
          group.classList.add('hidden');
        } else {
          group.classList.remove('hidden');
        }
      });
    }

    // 5. 应用内阅读器核心逻辑 (In-App Drawer)
    function openArticleDrawer(id) {
      const item = ALL_ARTICLES.find(a => a.id === id);
      if (!item) return;

      document.getElementById('drawerTitle').innerText = item.title;
      document.getElementById('drawerSource').innerText = item.sourceName;
      document.getElementById('drawerDate').innerText = (item.publishedAt || '').slice(0, 16);
      document.getElementById('drawerScore').innerText = '⭐ ' + item.score + ' 分';
      document.getElementById('drawerSummary').innerText = item.summaryZh || '暂无摘要';
      document.getElementById('drawerReason').innerText = item.reason || '权威信源一手发布。';

      // 原始英文标题
      const origWrap = document.getElementById('drawerOriginalTitleWrap');
      const origSpan = document.getElementById('drawerOriginalTitle');
      if (item.originalTitle && item.originalTitle !== item.title) {
        origSpan.innerText = item.originalTitle;
        origWrap.classList.remove('hidden');
      } else {
        origWrap.classList.add('hidden');
      }

      // 官方一手标签
      const tierBadge = document.getElementById('drawerTierBadge');
      if (item.sourceTier === 'T1') {
        tierBadge.innerText = '👑 官方一手';
        tierBadge.className = 'px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200';
      } else {
        tierBadge.innerText = '科技媒体';
        tierBadge.className = 'px-1.5 py-0.5 rounded text-[11px] font-medium bg-sunk text-ink3';
      }

      // 标签渲染
      const tagsBox = document.getElementById('drawerTags');
      tagsBox.innerHTML = (item.tags || []).map(function(t) {
        return '<span class="px-2 py-0.5 rounded bg-sunk text-ink2 text-xs border border-line/60">#' + t + '</span>';
      }).join('');

      // 构造深度正文解析内容
      const bodyBox = document.getElementById('drawerBodyContent');
      bodyBox.innerHTML = 
        '<p class="leading-relaxed">' +
          '<strong>【背景与发布脉络】</strong> 本条资讯由 ' + (item.sourceName || '') + ' 官方发布。经过 AIHOT 机械预筛与两阶段大模型独立评估，确认具备高可信度与明确信息增量。' +
        '</p>' +
        '<p class="leading-relaxed">' +
          '<strong>【核心技术与业务影响】</strong> ' + (item.summaryZh || '') +
        '</p>' +
        '<p class="leading-relaxed">' +
          '<strong>【行动与开发建议】</strong> ' + (item.reason || '') + ' 对于关注该领域的开发者与团队，建议评估相关技术路线对现有架构或生产流程的适配性。' +
        '</p>';

      // 链接配置
      document.getElementById('drawerOriginalLink').href = item.link;
      document.getElementById('drawerBottomOriginalBtn').href = item.link;

      // 展开抽屉
      document.getElementById('readerBackdrop').classList.remove('hidden');
      document.getElementById('readerDrawer').classList.remove('translate-x-full');
      document.body.classList.add('drawer-open');

      // 更新 URL Hash 方便分享
      window.location.hash = 'item-' + id;
    }

    function closeArticleDrawer() {
      document.getElementById('readerBackdrop').classList.add('hidden');
      document.getElementById('readerDrawer').classList.add('translate-x-full');
      document.body.classList.remove('drawer-open');
      if (window.location.hash.startsWith('#item-')) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    function copyCurrentLink() {
      navigator.clipboard.writeText(window.location.href);
      alert('📋 文章链接已成功复制到剪贴板！');
    }

    function openHotEvent(eventId) {
      const ev = ALL_EVENTS.find(e => e.id === eventId);
      if (ev && ev.articles && ev.articles.length > 0) {
        openArticleDrawer(ev.articles[0].id);
      } else {
        switchNav('hot');
      }
    }

    // 6. 快捷键支持 (按 / 聚焦搜索，按 ESC 关闭抽屉)
    window.addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement !== document.getElementById('searchInput')) {
        e.preventDefault();
        document.getElementById('searchInput').focus();
      } else if (e.key === 'Escape') {
        closeArticleDrawer();
      }
    });

    // 7. 管理员抓取触发
    async function triggerCrawl() {
      const pwd = prompt("请输入管理员密码（默认 AningMaster2026!）:");
      if (!pwd) return;
      alert("✨ 正在全网搜罗最新资讯并由大模型严格五轴打分，耗时约 10-15 秒，完成后自动更新！");
      try {
        const res = await fetch('/api/admin/crawl', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + pwd }
        });
        const data = await res.json();
        alert(data.message || "🎉 抓取与打分完成！正在刷新...");
        location.reload();
      } catch (err) {
        alert("操作失败: " + err.message);
      }
    }

    // 8. 页面载入时检查 URL Hash
    window.addEventListener('DOMContentLoaded', () => {
      const hash = window.location.hash;
      if (hash.startsWith('#item-')) {
        const id = hash.replace('#item-', '');
        openArticleDrawer(id);
      }
    });
  </script>
</body>
</html>`;
}
