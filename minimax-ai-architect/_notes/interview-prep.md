# Interview prep — MiniMax AI Architect

They said they score **hands-on delivery**, **generic business problems**, **past projects**, plus **values / soft skills**. R&D-style roles include a **code exam of basics**. Using any AI helper in that exam is treated as **cheating**.

## Coding day

- Quiet room, power plugged in, mic/cam 10 minutes early.
- If the interviewer is >5 minutes late, message HR 芝士 (+86 181 8645 2676). Change time ≥1 day ahead.
- Close extra apps. They may read your resume on a second screen and jot notes.
- Write **plain JS**: `const`/`let`, `Map`/`Set`, `filter`/`map`/`sort`/`slice`, simple classes. No frameworks.
- Talk while typing: complexity, edge cases, then “in production I would …”
- If stuck: brute force first, then the `Map` / score-and-sort version.

Practice the seven `coding/` problems until `node attempt.js` is muscle memory.

## You vs Forward Deploy Engineer

Say this clearly if they ask how you partner with FDE:

| You (Architect) | FDE |
|-----------------|-----|
| Industry framing, ROI, buy vs build, POC **scope** | Sit with the client’s eng, wire CRM/auth/network |
| Reference architecture, model routing, eval bar | Production hardening, on-call during pilot |
| Demo narrative for the business sponsor | Make the demo survive real tickets |
| Feed gaps back to MiniMax product | Feed integration pain back to the platform |

One line: **you own whether it should be built and whether it pays; the FDE owns making it run in their VPC.**

## Business questions they will recycle

Practice 60-second answers.

**“Client wants a chatbot next week.”**  
POC: 3 intents, mock tools, 10 docs, handoff rules, 20 gold tickets. Not Salesforce rewrite.

**“Why not dump the whole knowledge base into M3’s 1M window?”**  
Works for a workshop. In production: cost, cache, stale docs, PII. Retrieve top-k + cache the prefix.

**“Hallucinations on refund policy.”**  
Retrieval required, answer-only-from-sources, cite chunk ids, escalate if score 0 or confidence &lt; threshold. Eval set on policy questions.

**“Latency 3s, SLA is 800ms for FAQ.”**  
Split traffic: FAQ → M3 thinking off or M2.7-highspeed; tools/long-doc stay on M3 adaptive. Stream tokens. Don’t TTS until first sentence.

**“How do you know it made money?”**  
Deflection × (human cost − model cost) − engineering. Track: cache hit, tokens/ticket, handoff rate, CSAT, refund error rate.

## STAR bank (fill with your real projects)

Keep 3 stories. Each: Situation, Task, Action, Result **with a number**.

1. **LLM in production** — RAG / agent / multimodal you shipped. Your role, latency/cost, what broke, what you changed.
2. **Ambiguous business → architecture** — stakeholder conflict, you cut scope, POC landed, then production.
3. **Pressure / resilience** — incident, wrong retrieval, runaway tool loop; you stopped the bleed, then fixed the design.

Map each story to MiniMax capabilities *after* the result (“today I would put that orchestrator on M3 tools + cache”). Do not fake MiniMax production experience.

## Values / soft skills

They called this a hiring factor. Concrete behaviors:

- **Client first, not model worship** — recommend thinking-off / smaller model when M3 is waste.
- **Scope discipline** — write the out-of-scope list in the POC doc.
- **Honest demos** — show a failure + handoff, not only the happy path.
- **Credit the FDE and the client’s engineers** in the room.
- **Close the loop** — one written product insight after every POC.

Avoid: overselling 1M context as a RAG replacement; promising “no hallucinations”; disappearing after the slide deck.

## 5-minute architecture sketch (draw this)

1. Box: channels → PII → router
2. Box: FAQ path (retrieve + M3 thinking off + cache)
3. Box: agent path (M3 tools, max 4 hops)
4. Box: human queue
5. Side notes: eval set, idempotency, cost

Then offer to implement **one function** from `coding/` on the whiteboard — that is the “hands-on” signal.
