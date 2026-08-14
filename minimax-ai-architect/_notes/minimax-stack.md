# MiniMax stack cheat sheet

Use this in client workshops and in the interview when they ask “why MiniMax, not just OpenAI?”

## Endpoints

| Region | API base |
|--------|----------|
| International | `https://api.minimax.io` (OpenAI SDK: `https://api.minimax.io/v1`) |
| China | `https://api.minimaxi.com` |

SDKs: **Anthropic (recommended in MiniMax docs)**, OpenAI, or HTTP. Same models.

```javascript
const OpenAI = require("openai");
const client = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: "https://api.minimax.io/v1",
});
```

## Models (text)

| Model | Context | Use in an enterprise demo |
|-------|---------|---------------------------|
| MiniMax-M3 | 1,000,000 | Orchestrator: tools, long KB, screenshots/video frames, hard tickets |
| MiniMax-M2.7 | 204,800 | Strong default agent/coding model |
| MiniMax-M2.7-highspeed | 204,800 | ~100 tps — FAQ, routing, extraction under a latency SLA |
| MiniMax-M2.5 / 2.1 / 2 | 204,800 | Fallback / region / existing client code |

**M3-only knobs (OpenAI-compatible `extra_body`):**

- `thinking: { type: "adaptive" }` — default; reasoning on
- `thinking: { type: "disabled" }` — skip thinking (FAQ, classification)
- `reasoning_split: true` — thinking in `reasoning_content` / `reasoning_details` (easier UI/logs)
- `service_tier: "priority"` — 1.5× price, better admission

M2.x: thinking **cannot** be turned off. If the client’s pain is “thinking makes FAQ slow,” route FAQ to **M3 + thinking disabled**, not to M2.

**Multi-turn + tools:** append the **full** assistant message (thinking blocks + `tool_calls`) back into `messages`. Dropping thinking breaks the chain.

## Agents

[Mini-Agent](https://platform.minimax.io/docs/solutions/mini-agent): Perception → Thinking → Action → Feedback. Session notes, auto-summarize when context is full, MCP tools.

For a **client POC**, do not start with LangChain. Show:

1. One `tools` array (`lookup_order`, `search_kb`, `create_ticket`).
2. A 15-line loop: model → if `tool_calls` then execute → append `role: "tool"` → call again.
3. A stop condition (max 4 hops, or `escalate`).

That is the same loop as coding problem **05**.

## Knowledge (RAG)

MiniMax does not replace your vector DB. Typical POC:

- Chunk policy/FAQ (800–1200 tokens, 10–15% overlap).
- Retrieve top-k (keyword first for the demo; vectors in production).
- Stuff chunks into a **cached** system prefix so prompt cache hits every turn.
- Require citations (`[S1]`) and refuse if retrieval score is 0.

M3’s 1M window is for **long policies / ticket history**, not an excuse to dump the whole Confluence every request. Cache + retrieve still wins on cost.

## Speech

| API | Limit | Demo |
|-----|-------|------|
| T2A HTTP / WebSocket | 10k chars, streaming | Voice bot reply after the LLM |
| Async T2A | 1M chars | Help-center article → audio |
| Voice clone / design | 7-day persist unless used in T2A | Brand voice for IVR |

Models: `speech-2.8-turbo` (latency), `speech-2.8-hd` (quality). 40 languages.

## Multimodal (M3)

Image (`image_url`) + video (`video_url` / `mm_file://file_id`). Support use: “user sent a photo of a damaged package.”

## MCP

Official MiniMax MCP (Python + JS): TTS, clone, video, music. Token Plan MCP: `web_search`, `understand_image`. Useful when the client already lives in an IDE/agent host.

## What “MiniMax stack” means in one sentence

**M3 as the agent brain + highspeed/thinking-off for the 80% cheap path + prompt cache + optional TTS/clone + OpenAI/Anthropic-compatible APIs so the client’s existing glue still works.**
