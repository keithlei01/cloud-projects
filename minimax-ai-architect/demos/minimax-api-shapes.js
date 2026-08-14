/**
 * Copy-paste shapes for a live MiniMax client demo.
 * Not runnable as-is — fill MINIMAX_API_KEY and a real SDK call.
 *
 * International: https://api.minimax.io/v1
 * China:         https://api.minimaxi.com/v1
 */

const chatCompletionsBody = {
  model: "MiniMax-M3",
  messages: [
    {
      role: "system",
      content: "You are a retailer support agent. Answer only from retrieved sources. Cite [S1].",
    },
    { role: "user", content: "Where is my order ORD-1007?" },
  ],
  tools: [
    {
      type: "function",
      function: {
        name: "lookup_order",
        description: "Look up order status by id",
        parameters: {
          type: "object",
          properties: { orderId: { type: "string" } },
          required: ["orderId"],
        },
      },
    },
  ],
  extra_body: {
    thinking: { type: "adaptive" },
    reasoning_split: true,
    service_tier: "standard",
  },
};

const faqBodyThinkingOff = {
  model: "MiniMax-M3",
  messages: [{ role: "user", content: "What is the refund window?" }],
  extra_body: { thinking: { type: "disabled" } },
};

const t2aHttpBody = {
  model: "speech-2.8-turbo",
  text: "Your order shipped. It should arrive tomorrow.",
  stream: false,
  language_boost: "auto",
  voice_setting: { voice_id: "English_expressive_narrator", speed: 1, vol: 1, pitch: 0 },
  audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 },
};

module.exports = { chatCompletionsBody, faqBodyThinkingOff, t2aHttpBody };
