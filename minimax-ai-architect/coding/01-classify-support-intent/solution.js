function classifySupportIntent(message, intents) {
  const tokens = new Set(message.toLowerCase().match(/[a-z0-9]+/g) || []);
  let best = { intent: "unknown", score: 0 };

  for (const { name, keywords } of intents) {
    let score = 0;
    for (const keyword of keywords) {
      const parts = keyword.toLowerCase().match(/[a-z0-9]+/g) || [];
      if (parts.length > 0 && parts.every((p) => tokens.has(p))) score += 1;
    }
    if (score > best.score || (score > 0 && score === best.score && name < best.intent)) {
      best = { intent: name, score };
    }
  }

  return best;
}

module.exports = { classifySupportIntent };
