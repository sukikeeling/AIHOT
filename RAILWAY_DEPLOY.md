# 🚂 AIHOT 在 Railway 上的极简一键部署与 MCP 外挂指南

本项目已完成 Railway 一键部署的工业级优化！通过单一容器编排（`scripts/start-all.mjs`），自动完成数据库迁移（Migrations）、种子数据导入（Seed）、Fastify 后端 API、后台 Worker 抓取队列以及 React Router 前端服务端渲染（SSR）。

---

## ⚡ 1. Railway 一键部署流程（5分钟完成）

### 第一步：登录 Railway 并导入仓库
1. 打开 [Railway 控制台](https://railway.app/)；
2. 点击右上角 **「+ New Project」**；
3. 选择 **「Deploy from GitHub repo」**；
4. 选择并授权你的 **`sukikeeling/AIHOT`** 仓库。

### 第二步：添加 PostgreSQL 数据库
1. 在刚创建的项目面板中，点击空白处的 **「+ New」**；
2. 选择 **「Database」** -> **「Add PostgreSQL」**；
3. Railway 会在数秒内自动启动一台 PostgreSQL 17 实例。

### 第三步：配置环境变量（Variables）
点击你的 `AIHOT` 服务卡片，进入 **「Variables」** 选项卡，添加以下变量：

| 变量名 | 必填 | 推荐值 / 说明 |
|---|---|---|
| `DATABASE_URL` | **必填** | 填 `${{Postgres.DATABASE_URL}}`（Railway 会自动引用刚建的数据库） |
| `LLM_API_KEY` | **必填** | 你的大模型 API Key（默认适配 DeepSeek，如 `sk-xxxxxx`） |
| `LLM_BASE_URL` | 选填 | 默认就是 `https://api.deepseek.com/v1` |
| `LLM_MODEL` | 选填 | 默认是 `deepseek-flash` 或 `deepseek-chat` |
| `ADMIN_PASSWORD` | 选填 | 登录 `/admin` 后台的密码（至少12位）。**若不填，启动日志会自动打印随机生成的高强度密码** |
| `SITE_URL` | 选填 | 部署后生成的公网域名，例如 `https://aihot-production.up.railway.app` |

### 第四步：生成公网域名（Networking）
1. 在 `AIHOT` 服务卡片中，点击 **「Settings」**；
2. 找到 **「Networking」** 部分，点击 **「Generate Domain」**；
3. 你会获得一个形如 `https://aihot-production-xxxx.up.railway.app` 的专属公网 HTTPS 域名；
4. 将该域名回填到 Variables 的 `SITE_URL` 即可！

启动完成后，打开该域名就能直接看到热点站！后台地址在 `/admin`。

---

## 🔌 2. 将 AIHOT 作为 MCP 外挂给 Agent 使用

AIHOT 内置了标准 Remote Streamable HTTP MCP 协议，端点为 **`/api/mcp`**！

### 在 DSH Harness / Claude Desktop / Cursor 中挂载：

在你的 MCP 配置文件（例如 `claude_desktop_config.json` 或 DSH MCP 设置）中加入：

```json
{
  "mcpServers": {
    "aihot": {
      "url": "https://你的railway域名.up.railway.app/api/mcp"
    }
  }
}
```

### 挂载后 Agent 获得的 5 大超级感知工具：
1. **`myhot_get_latest`**：获取最新精选 AI 资讯列表（可按类别筛选，如模型、产品、论文）；
2. **`myhot_hot_topics`**：获取全网独立信源热度最高的事件榜单；
3. **`myhot_get_story`**：传入事件 ID，查看该事件从爆发到最新进展的全景综述；
4. **`myhot_search`**：按公司、技术或关键词全文检索历史资料；
5. **`myhot_get_daily`**：获取最新一期已排版成刊的 AI 每日早报。
