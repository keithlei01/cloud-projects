function estimateRequestCostUsd(usage, pricing) {
  const uncached = usage.inputTokens - usage.cachedInputTokens;
  const usd =
    (uncached * pricing.inputPerMillion +
      usage.cachedInputTokens * pricing.cacheReadPerMillion +
      usage.outputTokens * pricing.outputPerMillion) /
    1_000_000;
  return Math.round(usd * 1_000_000) / 1_000_000;
}

function estimateMonthlyUsd(ticketsPerDay, usage, pricing) {
  const per = estimateRequestCostUsd(usage, pricing);
  return Math.round(per * ticketsPerDay * 30 * 100) / 100;
}

module.exports = { estimateRequestCostUsd, estimateMonthlyUsd };
