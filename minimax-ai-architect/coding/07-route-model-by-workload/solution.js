function routeModel(workload) {
  const heavy =
    workload.needsTools ||
    workload.hasImage ||
    workload.complexity === "agent" ||
    workload.inputTokens > 200_000;

  if (heavy) {
    return { model: "MiniMax-M3", thinking: { type: "adaptive" } };
  }
  if (workload.complexity === "faq") {
    return { model: "MiniMax-M3", thinking: { type: "disabled" } };
  }
  if (workload.latencyMsSla !== null && workload.latencyMsSla < 1000) {
    return { model: "MiniMax-M2.7-highspeed", thinking: null };
  }
  return { model: "MiniMax-M2.7", thinking: null };
}

module.exports = { routeModel };
