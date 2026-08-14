function decideHandoff(ticket, policy) {
  const reasons = [];
  if (ticket.confidence < policy.minConfidence) reasons.push("low_confidence");
  if (ticket.sentiment === "angry" && ticket.vip) reasons.push("angry_vip");
  if (ticket.slaMinutesLeft < policy.minSlaMinutes) reasons.push("sla_risk");
  if (ticket.intent === "refund" && ticket.amountCents > policy.maxAutoRefundCents) {
    reasons.push("refund_over_limit");
  }
  return {
    action: reasons.length > 0 ? "escalate" : "resolve",
    reasons,
  };
}

module.exports = { decideHandoff };
