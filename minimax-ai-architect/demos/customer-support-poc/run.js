/**
 * Client-demo pipeline: MiniMax customer support POC (mocked LLM, real glue).
 * Run: node demos/customer-support-poc/run.js
 */
const { redactPii } = require("../../coding/04-pii-redact-transcript/solution.js");
const { classifySupportIntent } = require("../../coding/01-classify-support-intent/solution.js");
const { retrieveTopK } = require("../../coding/02-top-k-knowledge-chunks/solution.js");
const { runToolCallLoop } = require("../../coding/05-run-tool-call-loop/solution.js");
const { decideHandoff } = require("../../coding/06-escalate-or-resolve/solution.js");
const { routeModel } = require("../../coding/07-route-model-by-workload/solution.js");
const { estimateRequestCostUsd } = require("../../coding/03-estimate-token-cost/solution.js");

const INTENTS = [
  { name: "shipping_policy", keywords: ["how long", "standard", "shipping"] },
  { name: "track_order", keywords: ["track", "where is", "shipping status"] },
  { name: "refund", keywords: ["refund", "money back"] },
];

const CHUNKS = [
  { id: "s1", title: "Shipping", text: "Standard orders ship in 2 days. Track in the app with ORD-id." },
  { id: "s2", title: "Refunds", text: "Refunds under $50 auto-approve. Over $50 needs a human." },
];

const POLICY = { minConfidence: 0.6, minSlaMinutes: 15, maxAutoRefundCents: 5000 };

const M3_PRICING = { inputPerMillion: 0.3, cacheReadPerMillion: 0.06, outputPerMillion: 1.2 };

const TOOLS = {
  lookup_order: ({ orderId }) => ({ orderId, status: "shipped", etaDays: 1 }),
};

function mockMinimaxChat({ model, thinking, messages, tools }) {
  const last = messages[messages.length - 1];
  if (last.role === "tool") {
    const data = JSON.parse(last.content);
    return {
      model,
      thinking,
      usage: { inputTokens: 2000, cachedInputTokens: 1400, outputTokens: 70 },
      message: {
        content: `Order ${data.orderId} is ${data.status}. ETA ${data.etaDays} day(s).`,
      },
    };
  }

  const userText = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  if (tools && /ORD-\d+/i.test(userText)) {
    const orderId = userText.match(/ORD-\d+/i)[0].toUpperCase();
    return {
      model,
      thinking,
      usage: { inputTokens: 1800, cachedInputTokens: 1400, outputTokens: 80 },
      message: {
        content: null,
        tool_calls: [
          { id: "call_1", function: { name: "lookup_order", arguments: JSON.stringify({ orderId }) } },
        ],
      },
    };
  }

  const sources = messages.find((m) => m.role === "system")?.content || "";
  const cited = /\[s1\]/i.test(sources) ? " [s1]" : "";
  return {
    model,
    thinking,
    usage: { inputTokens: 2200, cachedInputTokens: 1800, outputTokens: 120 },
    message: { content: "Standard shipping is 2 days." + cited },
  };
}

function t2aBody(replyText) {
  return {
    model: "speech-2.8-turbo",
    text: replyText,
    stream: false,
    voice_setting: { voice_id: "English_expressive_narrator", speed: 1, vol: 1, pitch: 0 },
    audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 },
  };
}

function handleTicket(ticket) {
  const redacted = redactPii(ticket.text);
  const { intent, score } = classifySupportIntent(redacted, INTENTS);
  const needsTools = intent === "track_order";
  const complexity = needsTools ? "agent" : "faq";
  const routed = routeModel({
    needsTools,
    hasImage: Boolean(ticket.hasImage),
    inputTokens: ticket.inputTokensHint || 1200,
    complexity,
    latencyMsSla: ticket.latencyMsSla ?? null,
  });

  const retrieved = retrieveTopK(redacted, CHUNKS, 2);
  const system =
    "Answer only from sources. Cite [id]. If nothing supports the answer, say you don't know.\n" +
    retrieved.map((c) => `[${c.id}] ${c.title}: ${CHUNKS.find((x) => x.id === c.id).text}`).join("\n");

  const first = mockMinimaxChat({
    model: routed.model,
    thinking: routed.thinking,
    tools: needsTools ? [{ name: "lookup_order" }] : undefined,
    messages: [
      { role: "system", content: system },
      { role: "user", content: redacted },
    ],
  });

  let reply = first.message.content;
  let toolMessages = [];
  if (!first.message.content) {
    const hop = runToolCallLoop(first.message, TOOLS);
    toolMessages = hop.messages;
    const second = mockMinimaxChat({
      model: routed.model,
      thinking: routed.thinking,
      messages: [
        { role: "system", content: system },
        { role: "user", content: redacted },
        first.message,
        ...hop.messages,
      ],
    });
    reply = second.message.content;
  }

  const confidence = score === 0 ? 0.35 : Math.min(0.5 + score * 0.2, 0.95);
  const handoff = decideHandoff(
    {
      intent,
      confidence,
      sentiment: ticket.sentiment,
      vip: ticket.vip,
      slaMinutesLeft: ticket.slaMinutesLeft,
      amountCents: ticket.amountCents || 0,
    },
    POLICY
  );

  const costUsd = estimateRequestCostUsd(first.usage, M3_PRICING);

  return {
    ticketId: ticket.id,
    redacted,
    intent,
    routed,
    retrieved: retrieved.map((c) => ({ id: c.id, score: c.score })),
    toolMessages,
    handoff,
    reply: handoff.action === "escalate" ? null : reply,
    costUsd,
    t2a: handoff.action === "resolve" ? t2aBody(reply) : null,
  };
}

const tickets = [
  {
    id: "T-faq",
    text: "How long does standard shipping take? email me at a.b@shop.com",
    sentiment: "neutral",
    vip: false,
    slaMinutesLeft: 90,
    latencyMsSla: 400,
  },
  {
    id: "T-order",
    text: "Track order ORD-1007 please",
    sentiment: "neutral",
    vip: false,
    slaMinutesLeft: 90,
    inputTokensHint: 1800,
  },
  {
    id: "T-vip-refund",
    text: "I want a refund of my order now",
    sentiment: "angry",
    vip: true,
    slaMinutesLeft: 40,
    amountCents: 8000,
  },
];

for (const ticket of tickets) {
  console.log("\n==== " + ticket.id + " ====");
  console.log(JSON.stringify(handleTicket(ticket), null, 2));
}
