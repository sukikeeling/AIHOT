import { Source } from "./types";

export const DEFAULT_SOURCES: Source[] = [
  {
    id: "openai",
    name: "OpenAI News",
    url: "https://openai.com/news/",
    feedUrl: "https://openai.com/news/rss.xml",
    tier: "T1",
    enabled: true
  },
  {
    id: "anthropic",
    name: "Anthropic News",
    url: "https://www.anthropic.com/news",
    feedUrl: "https://www.anthropic.com/news/feed",
    tier: "T1",
    enabled: true
  },
  {
    id: "huggingface",
    name: "Hugging Face Blog",
    url: "https://huggingface.co/blog",
    feedUrl: "https://huggingface.co/blog/feed.xml",
    tier: "T1",
    enabled: true
  },
  {
    id: "google-deepmind",
    name: "Google DeepMind",
    url: "https://deepmind.google/blog/",
    feedUrl: "https://deepmind.google/blog/rss.xml",
    tier: "T1",
    enabled: true
  },
  {
    id: "simon-willison",
    name: "Simon Willison (AI Analyst)",
    url: "https://simonwillison.net/",
    feedUrl: "https://simonwillison.net/atom/everything/",
    tier: "T2",
    enabled: true
  },
  {
    id: "mit-tech-ai",
    name: "MIT Technology Review AI",
    url: "https://www.technologyreview.com/topic/artificial-intelligence/",
    feedUrl: "https://www.technologyreview.com/topic/artificial-intelligence/feed",
    tier: "T2",
    enabled: true
  },
  {
    id: "venturebeat-ai",
    name: "VentureBeat AI",
    url: "https://venturebeat.com/category/ai/",
    feedUrl: "https://venturebeat.com/category/ai/feed/",
    tier: "T2",
    enabled: true
  },
  {
    id: "vllm-releases",
    name: "vLLM Project",
    url: "https://github.com/vllm-project/vllm",
    feedUrl: "https://github.com/vllm-project/vllm/releases.atom",
    tier: "T1",
    enabled: true
  },
  {
    id: "ollama-releases",
    name: "Ollama Project",
    url: "https://github.com/ollama/ollama",
    feedUrl: "https://github.com/ollama/ollama/releases.atom",
    tier: "T1",
    enabled: true
  }
];
