# MiniMax AI Architect — Interview + Client Demo Prep

Prep for the **MiniMax AI Architect** role: design MiniMax-stack POCs with clients (customer support, agents, RAG, voice), partner with Forward Deploy Engineers, and pass a **basic JS coding screen**.

Live coding in that interview is a **basic-skills check**. Practice these until you can write them from memory. **Do not use AI during the exam** — MiniMax treats that as cheating.

## How to use

1. Read `coding/<n>/problem.md` only.
2. Fill `attempt.js`, run `node attempt.js`.
3. Compare with `solution.js` and `explanation.md`.
4. Say the **architect talking points** out loud (ROI, model choice, production risks).
5. Run the composed demo: `node demos/customer-support-poc/run.js`.

## Map to the job

| JD bullet | Practice here |
|-----------|----------------|
| Translate LLM + agent frameworks into a commercial solution | [Customer support architecture](./_notes/customer-support-architecture.md) + [POC demo](./demos/customer-support-poc/) |
| Own feasibility, ROI, competitiveness | [03 token cost](./coding/03-estimate-token-cost/) · [07 model router](./coding/07-route-model-by-workload/) |
| POC → production, fix architecture bottlenecks | [05 tool-call loop](./coding/05-run-tool-call-loop/) · [06 escalate](./coding/06-escalate-or-resolve/) |
| Prompt engineering, API integration, agents | [01 intent](./coding/01-classify-support-intent/) · [02 RAG top-k](./coding/02-top-k-knowledge-chunks/) |
| Hands-on prototype demos | [demos/customer-support-poc](./demos/customer-support-poc/) |
| Partner with Forward Deploy Eng | [_notes/interview-prep.md](./_notes/interview-prep.md) |

## Coding drills (no API key, CoderPad-style)

Each folder: `problem.md` · `attempt.js` · `solution.js` · `explanation.md`.

| # | Problem | JS muscle | Architect angle |
|---|---------|-----------|-----------------|
| 01 | Classify support intent | `Set`, keyword score, ties | Cheap first hop before calling M3 |
| 02 | Top-k knowledge chunks | tokenize, score, sort, `slice` | RAG retrieval before generation |
| 03 | Estimate token cost | integer money math | ROI vs human ticket cost; prompt cache |
| 04 | Redact PII in transcripts | regex replace order | What you must strip before the LLM |
| 05 | Run one tool-call loop | JSON parse, dispatch | MiniMax-M3 agent turn |
| 06 | Escalate or resolve | rule table | When the bot must hand off |
| 07 | Route model by workload | if/else policy | M3 vs highspeed vs thinking off |

Suggested order: **01 → 02 → 04 → 05 → 06 → 03 → 07**. Cost and routing are the “business acumen” pair — do them after the pipeline clicks.

## MiniMax stack (what you sell)

Official docs: [platform.minimax.io](https://platform.minimax.io/docs/api-reference/api-overview).

| Layer | What to use | Client demo hook |
|-------|-------------|------------------|
| Orchestrator LLM | **MiniMax-M3** (1M context, tools, multimodal) | Agent + long policy docs + screenshots |
| Fast workhorse | **M2.7-highspeed** (~100 tps) | FAQ, classification, low-latency chat |
| Thinking control | M3 `thinking: { type: "disabled" \| "adaptive" }` | Turn thinking **off** for FAQ to cut latency/cost |
| Agents | [Mini-Agent](https://platform.minimax.io/docs/solutions/mini-agent) (Perception → Thinking → Action → Feedback) | Show a 20-line tool loop, not LangChain |
| Cache | Prompt cache (~80% off cached input on M3) | System prompt + KB prefix reused every turn |
| Voice | `speech-2.8-turbo` / `speech-2.8-hd`, clone, 40 languages | Voice support / IVR after the text reply |
| Video / image | MiniMax-H3, image-01 | Training clips, product explainers |
| Integration | OpenAI SDK or Anthropic SDK → `https://api.minimax.io/v1` | Drop-in for clients already on OpenAI |

M3 standard list price (≤512k input, confirm on [pricing](https://platform.minimax.io/docs/guides/pricing-paygo)): **$0.30 / $1.20 / $0.06** per 1M input / output / cache-read. Priority is 1.5×. M2.x **cannot** disable thinking — only M3 can.

## Client demo story (5 minutes)

A retailer wants AI customer support. You and the FDE walk this path:

1. Redact PII from the ticket (**04**).
2. Classify intent cheaply (**01**).
3. FAQ → retrieve top chunks (**02**) → M3 with **thinking disabled**.
4. Order / refund → M3 **tools** (**05**): `lookup_order`, `get_refund_policy`.
5. Low confidence / angry VIP / SLA risk → human (**06**).
6. Optional: TTS the reply (`speech-2.8-turbo`).
7. Show monthly cost vs deflected tickets (**03** + **07**).

Runnable version: `node demos/customer-support-poc/run.js`.

## Notes

- [_notes/minimax-stack.md](./_notes/minimax-stack.md) — models, APIs, when to pick what
- [_notes/customer-support-architecture.md](./_notes/customer-support-architecture.md) — POC → production, ROI
- [_notes/interview-prep.md](./_notes/interview-prep.md) — values, FDE split, STAR, coding-day rules
