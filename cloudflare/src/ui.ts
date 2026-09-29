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

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🍭 ${siteName} · 童趣炫彩情报站</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Noto Serif SC"', '"Source Han Serif SC"', '"Songti SC"', '"STSong"', '"SimSun"', 'serif'],
            display: ['"Noto Serif SC"', '"Source Han Serif SC"', '"Songti SC"', '"STSong"', 'serif']
          },
          colors: {
            candy: {
              pink: '#ff6b9d',
              pinkSoft: '#ffeaf2',
              purple: '#9d74ff',
              purpleSoft: '#f2edff',
              sky: '#38bdf8',
              skySoft: '#e0f6ff',
              yellow: '#ffbf29',
              yellowSoft: '#fff8db',
              mint: '#10b981',
              mintSoft: '#dcfce7',
              orange: '#fb923c',
              orangeSoft: '#ffedd5',
              cream: '#fffdfa',
              card: '#ffffff'
            }
          },
          boxShadow: {
            'pop': '0 8px 0px 0px rgba(0, 0, 0, 0.08), 0 15px 25px -5px rgba(0, 0, 0, 0.05)',
            'pop-hover': '0 14px 0px 0px rgba(0, 0, 0, 0.08), 0 22px 35px -8px rgba(0, 0, 0, 0.08)',
            'btn': '0 4px 0px 0px rgba(0, 0, 0, 0.15)',
            'btn-active': '0 1px 0px 0px rgba(0, 0, 0, 0.15)'
          }
        }
      }
    }
  </script>
  <style>
    body {
      background-color: #faf6f0;
      background-image: 
        radial-gradient(#fed7aa 0.75px, transparent 0.75px),
        radial-gradient(#fbcfe8 0.75px, #faf6f0 0.75px);
      background-size: 30px 30px;
      background-position: 0 0, 15px 15px;
      color: #1e293b;
      font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", "SimSun", serif;
    }
    .bouncy-card {
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .bouncy-card:hover {
      transform: translateY(-4px) scale(1.01);
    }
    .candy-btn {
      transition: all 0.15s ease;
    }
    .candy-btn:active {
      transform: translateY(3px);
    }
    .sticker-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.02em;
    }
    /* Rainbow title */
    .rainbow-text {
      background: linear-gradient(135deg, #ff4b8b 0%, #a855f7 50%, #06b6d4 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col antialiased selection:bg-pink-300 selection:text-pink-900">

  <!-- 顶部超元气糖果导航栏 -->
  <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b-2 border-pink-200/80 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      
      <!-- 品牌区 -->
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-400 via-purple-400 to-amber-300 flex items-center justify-center text-xl shadow-md transform -rotate-3 hover:rotate-6 transition">
          🍭
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-display font-black text-xl tracking-tight rainbow-text">AIHOT</span>
            <span class="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 border border-pink-300 flex items-center gap-1 shadow-sm">
              <span>✨</span> 殿下的情报糖果屋
            </span>
          </div>
          <p class="text-[11px] font-bold text-slate-400 hidden sm:block">把全网无聊的 AI 资讯，变成甜甜的硬核小泡泡 🫧</p>
        </div>
      </div>

      <!-- 中间状态胶囊 -->
      <div class="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-600 bg-amber-50/90 px-4 py-1.5 rounded-full border-2 border-amber-200 shadow-sm">
        <span class="animate-bounce text-sm">🎈</span>
        <span>已捕获 <strong class="text-pink-500 font-black text-sm">${articles.length}</strong> 颗精选情报泡泡</span>
        <span class="text-slate-300">•</span>
        <span class="text-slate-500">${lastUpdated ? "刚刚烘焙出炉 🧁" : "待命中"}</span>
      </div>

      <!-- 右侧元气功能按钮 (MCP外挂已隐藏，防止消耗边缘额度) -->
      <div class="flex items-center space-x-2">
        <button onclick="triggerCrawl()" class="candy-btn text-xs font-black px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 text-white border-2 border-pink-500 hover:brightness-105 shadow-btn flex items-center gap-1.5">
          <span>⚡</span>
          <span>立即摇出新热点</span>
        </button>
      </div>

    </div>
  </header>

  <!-- 主体元气展馆 -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-7">

    <!-- 顶部炫彩 Bento 游乐园仪表盘 -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">

      <!-- 左侧：🔥 全网重大热点事件大喇叭 (8 列) -->
      <div class="lg:col-span-8 bg-white/95 rounded-3xl p-6 border-2 border-pink-200 shadow-pop relative overflow-hidden flex flex-col justify-between">
        <!-- 装饰小彩旗背景 -->
        <div class="absolute -right-6 -bottom-6 text-7xl opacity-10 select-none pointer-events-none">🎡</div>

        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl p-2 rounded-2xl bg-pink-100 border border-pink-200">🔥</span>
              <div>
                <h2 class="font-display font-black text-lg text-slate-800 tracking-tight flex items-center gap-2">
                  <span>全网热点聚类大榜</span>
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 border border-rose-300">多源去重</span>
                </h2>
                <p class="text-xs font-bold text-slate-400">同一件事哪怕 30 家媒体抄袭，在殿下面前也只出现一次！</p>
              </div>
            </div>
            <span class="text-xs font-black font-display text-pink-500 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
              TOP ${events.slice(0, 3).length} 暴走事件 🚀
            </span>
          </div>

          <div class="space-y-3.5">
            ${events.length === 0 ? `
              <div class="py-12 text-center text-slate-400 font-bold">还没有摇出热点，点击右上角【立即摇出新热点】试试叭！🍭</div>
            ` : events.slice(0, 3).map((e, idx) => {
              const bgColors = [
                'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-300',
                'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300',
                'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-300'
              ];
              const badgeColors = [
                'bg-pink-500 text-white',
                'bg-amber-500 text-white',
                'bg-purple-500 text-white'
              ];
              return `
                <div class="p-4 rounded-2xl border-2 ${bgColors[idx] || 'bg-slate-50 border-slate-200'} bouncy-card">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-start gap-3 min-w-0">
                      <span class="font-display font-black text-sm px-2.5 py-1 rounded-xl ${badgeColors[idx] || 'bg-slate-700 text-white'} shadow-sm shrink-0">
                        #0${idx + 1}
                      </span>
                      <div class="min-w-0">
                        <h3 class="text-base font-black text-slate-800 hover:text-pink-600 transition leading-snug">
                          ${e.title}
                        </h3>
                        <p class="text-xs font-semibold text-slate-600 mt-1.5 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-black/5">
                          🍬 <span class="font-black text-slate-800">[核心进展]</span> ${e.summary}
                        </p>
                      </div>
                    </div>
                    <div class="text-right shrink-0">
                      <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black shadow-sm">
                        <span>🔥</span> ${e.heat}
                      </div>
                      <div class="text-[11px] font-bold text-slate-500 mt-1">${e.articleCount} 家独立报道</div>
                    </div>
                  </div>

                  <!-- 关联信源小药丸 -->
                  <div class="mt-3 pt-2.5 border-t border-black/5 flex items-center gap-2 overflow-x-auto text-xs">
                    <span class="text-slate-400 font-bold text-[11px] shrink-0">信源足迹:</span>
                    ${e.articles.slice(0, 3).map(a => `
                      <a href="${a.link}" target="_blank" class="px-2.5 py-0.5 rounded-lg bg-white hover:bg-pink-500 hover:text-white text-slate-700 border border-slate-200 text-[11px] font-bold transition shadow-xs flex items-center gap-1">
                        <span>${a.sourceName}</span>
                        <span class="opacity-60">↗</span>
                      </a>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="mt-3 text-right">
          <span class="text-[11px] font-bold text-slate-400">✨ 算法自动剔除公关废话 · 守护殿下的好心情</span>
        </div>
      </div>

      <!-- 右侧：🗞️ 每日早报小纸条 (4 列) -->
      <div class="lg:col-span-4 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-3xl p-6 border-2 border-amber-200 shadow-pop flex flex-col justify-between relative overflow-hidden">
        <!-- 胶带贴纸样式 -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-amber-200/60 border border-amber-300 rounded-b-md shadow-xs transform -rotate-1"></div>

        <div class="pt-2">
          <div class="flex items-center justify-between mb-3">
            <span class="sticker-tag bg-amber-200 text-amber-900 border border-amber-400 font-display">
              🧁 每日早报甜点
            </span>
            <span class="text-xs font-black font-display text-amber-700">${daily?.date || "2026-09-29"}</span>
          </div>

          <h2 class="font-display font-black text-lg text-slate-800 leading-snug">
            ${daily?.title || "今日 AI 圈新鲜出炉的早报"}
          </h2>

          <!-- 小便签盒 -->
          <div class="mt-3.5 p-3.5 rounded-2xl bg-white/90 border-2 border-amber-200 shadow-sm text-xs font-bold text-slate-700 leading-relaxed">
            <span class="text-amber-600 font-black">【军师的小纸条】💌</span><br>
            ${daily?.summary || "今天全球各大实验室又在疯狂整活！新模型、新工具全速上线，快来看看有什么好玩的！"}
          </div>

          <!-- 早报趣味标签 -->
          <div class="mt-4 space-y-2">
            <div class="text-[11px] font-extrabold text-amber-800 tracking-wider">今日好玩板块</div>
            <div class="grid grid-cols-2 gap-2 text-xs font-bold">
              <div class="p-2.5 rounded-xl bg-white/80 border border-amber-200 text-center">
                <div class="text-amber-800">🤖 大模型突破</div>
                <div class="text-pink-500 font-display text-sm mt-0.5">GPT-6 / LFM</div>
              </div>
              <div class="p-2.5 rounded-xl bg-white/80 border border-amber-200 text-center">
                <div class="text-amber-800">🛠️ 本地量化</div>
                <div class="text-purple-600 font-display text-sm mt-0.5">llama.cpp</div>
              </div>
            </div>
          </div>
        </div>

        <button onclick="switchTab('daily')" class="candy-btn w-full mt-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs border-2 border-amber-500 shadow-btn flex items-center justify-center gap-1.5 transition">
          <span>📖 查看完整排版早报</span>
          <span>→</span>
        </button>
      </div>

    </div>

    <!-- 糖果分类筛选与全局搜索栏 -->
    <div class="bg-white/80 backdrop-blur-md rounded-2xl p-3 border-2 border-pink-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- 炫彩马卡龙分类药丸 -->
      <div class="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
        <button onclick="setCategory('all')" class="cat-pill px-3.5 py-1.5 rounded-xl border-2 font-black transition candy-btn active bg-pink-500 text-white border-pink-600 shadow-sm" data-cat="all">
          🌈 全部泡泡 (${articles.length})
        </button>
        <button onclick="setCategory('model_release')" class="cat-pill px-3.5 py-1.5 rounded-xl border-2 font-black transition candy-btn bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200" data-cat="model_release">
          🤖 大模型突破
        </button>
        <button onclick="setCategory('product_launch')" class="cat-pill px-3.5 py-1.5 rounded-xl border-2 font-black transition candy-btn bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200" data-cat="product_launch">
          🚀 酷炫产品
        </button>
        <button onclick="setCategory('tool_or_prompt')" class="cat-pill px-3.5 py-1.5 rounded-xl border-2 font-black transition candy-btn bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200" data-cat="tool_or_prompt">
          🛠️ 极客法宝
        </button>
        <button onclick="setCategory('research_paper')" class="cat-pill px-3.5 py-1.5 rounded-xl border-2 font-black transition candy-btn bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200" data-cat="research_paper">
          📑 魔法论文
        </button>
        <button onclick="setCategory('industry_event')" class="cat-pill px-3.5 py-1.5 rounded-xl border-2 font-black transition candy-btn bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200" data-cat="industry_event">
          🌐 巨头大风吹
        </button>
      </div>

      <!-- 搜索输入框 -->
      <div class="relative w-full sm:w-72 shrink-0">
        <input id="searchInput" oninput="handleSearch()" type="text" placeholder="🔍 搜搜看你想探索的魔法..." 
          class="w-full bg-slate-50 border-2 border-pink-200 rounded-xl px-4 py-1.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:bg-white transition shadow-inner">
      </div>
    </div>

    <!-- 资讯流视图 (卡片瀑布流) -->
    <div id="view-stream" class="space-y-4">
      <div id="articlesGrid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${articles.map(art => {
          const isT1 = art.sourceTier === 'T1';
          const scoreColor = art.score >= 80 ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white';
          return `
            <div class="bg-white rounded-3xl p-5 border-2 border-pink-100/80 shadow-pop bouncy-card flex flex-col justify-between article-card"
                 data-category="${art.category}"
                 data-score="${art.score}"
                 data-search="${(art.title + ' ' + art.summaryZh + ' ' + art.sourceName + ' ' + art.tags.join(' ')).toLowerCase()}">
              <div>
                <!-- 头部信源标签与分数徽章 -->
                <div class="flex items-center justify-between gap-2 mb-3">
                  <div class="flex items-center gap-1.5">
                    <span class="sticker-tag ${isT1 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600 border border-slate-300'}">
                      <span>${isT1 ? '👑 官方一手' : '📰 观察哨'}</span>
                    </span>
                    <span class="text-xs font-extrabold text-slate-600">${art.sourceName}</span>
                  </div>

                  <!-- 炫彩打分徽章 -->
                  <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full ${scoreColor} font-display text-xs font-black shadow-sm">
                    <span>⭐</span> ${art.score} 分
                  </div>
                </div>

                <!-- 标题 -->
                <a href="${art.link}" target="_blank" class="block text-base font-black text-slate-800 hover:text-pink-600 transition leading-snug">
                  ${art.title} ↗
                </a>

                <!-- 答案先行小黄条 -->
                <div class="mt-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <p class="text-xs font-bold text-slate-700 leading-relaxed">
                    <span class="text-pink-600 font-black">【答案先行】</span> ${art.summaryZh}
                  </p>
                </div>

                <!-- 为什么值得看 (小泡泡) -->
                <div class="mt-2.5 text-[11px] font-bold text-slate-500 flex items-start gap-1">
                  <span>💡</span>
                  <span class="italic text-slate-600 line-clamp-1">${art.reason}</span>
                </div>
              </div>

              <!-- 底部标签流与日期 -->
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div class="flex items-center gap-1 overflow-x-auto py-0.5">
                  ${art.tags.slice(0, 3).map(t => `
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      #${t}
                    </span>
                  `).join('')}
                </div>
                <span class="text-[11px] font-display font-bold text-slate-400 shrink-0">${art.publishedAt.slice(0, 10)}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 每日早报全文视图 -->
    <div id="view-daily" class="hidden bg-white rounded-3xl p-6 sm:p-8 space-y-6 border-2 border-pink-200 shadow-pop">
      ${daily ? `
        <div class="border-b-2 border-pink-100 pb-5">
          <div class="flex items-center gap-2 mb-2">
            <span class="sticker-tag bg-pink-100 text-pink-700 border border-pink-300 font-display">
              🧁 AIHOT DAILY SPECIAL
            </span>
          </div>
          <h2 class="text-2xl font-display font-black text-slate-800 tracking-tight">${daily.title}</h2>
          <div class="mt-3 p-4 rounded-2xl bg-pink-50/60 border-2 border-pink-200 text-xs font-bold text-slate-700 leading-relaxed">
            ${daily.summary}
          </div>
        </div>

        <div class="space-y-6">
          ${daily.sections.map(sec => `
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="text-lg">🍭</span>
                <h3 class="text-sm font-black text-slate-800 tracking-tight font-display">${sec.categoryLabel}</h3>
              </div>
              <div class="space-y-2.5">
                ${sec.items.map(item => `
                  <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4 hover:border-pink-300 transition">
                    <div class="min-w-0">
                      <a href="${item.link}" target="_blank" class="text-xs font-black text-slate-800 hover:text-pink-600 transition">
                        ${item.title} ↗
                      </a>
                      <p class="text-slate-500 font-bold text-[11px] mt-1 leading-relaxed line-clamp-2">${item.summaryZh}</p>
                    </div>
                    <span class="text-xs font-display font-black text-pink-500 shrink-0">⭐ ${item.score}分</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="text-center py-16 text-slate-400 font-bold">今日早报还在烘焙中，请稍后再来～</div>
      `}
    </div>

  </main>

  <!-- 萌萌哒元气页脚 -->
  <footer class="border-t-2 border-pink-200/60 bg-white/70 backdrop-blur-md py-6 text-center text-xs font-bold text-slate-500">
    <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span>🌸</span>
        <span class="text-slate-700 font-black">永恒之花 · 阿宁殿下的炫彩智囊雷达</span>
      </div>
      <div class="flex items-center space-x-3 text-[11px] text-slate-400 font-medium">
        <span>Cloudflare Workers 全球边缘驱动</span>
        <span>•</span>
        <span>DeepSeek 深度双审去噪</span>
        <span>•</span>
        <span>100% 拒绝废话与幻觉</span>
      </div>
    </div>
  </footer>

  <script>
    function switchTab(view) {
      const streamEl = document.getElementById('view-stream');
      const dailyEl = document.getElementById('view-daily');
      if (view === 'daily') {
        streamEl.classList.add('hidden');
        dailyEl.classList.remove('hidden');
      } else {
        dailyEl.classList.add('hidden');
        streamEl.classList.remove('hidden');
      }
    }

    function setCategory(cat) {
      document.querySelectorAll('.cat-pill').forEach(btn => {
        if (btn.dataset.cat === cat) {
          btn.className = 'cat-pill px-3.5 py-1.5 rounded-xl border-2 font-black transition candy-btn active bg-pink-500 text-white border-pink-600 shadow-sm';
        } else {
          btn.className = 'cat-pill px-3.5 py-1.5 rounded-xl border-2 font-black transition candy-btn bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200';
        }
      });

      document.querySelectorAll('.article-card').forEach(card => {
        if (cat === 'all' || card.dataset.category === cat) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    }

    function handleSearch() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      document.querySelectorAll('.article-card').forEach(card => {
        if (!q || card.dataset.search.includes(q)) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    }

    async function triggerCrawl() {
      const pwd = prompt("请输入管理员密码（默认 AningMaster2026!）:");
      if (!pwd) return;
      alert("✨ 正在全网搜罗最新的魔法资讯并由大模型严格打分，约需 10-15 秒，完成后自动更新！");
      try {
        const res = await fetch('/api/admin/crawl', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + pwd }
        });
        const data = await res.json();
        alert(data.message || "🎉 抓取与打分完成！正在刷新糖果展馆...");
        location.reload();
      } catch (err) {
        alert("操作失败: " + err.message);
      }
    }
  </script>
</body>
</html>`;
}
