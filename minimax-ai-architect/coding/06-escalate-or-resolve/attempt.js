/**
 * Implement decideHandoff — see problem.md
 * Run: node attempt.js
 */
function decideHandoff(ticket, policy) {
  // TODO
}

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(label + " =>", actual, ok ? "OK" : "expected " + JSON.stringify(expected));
}

const policy = { minConfidence: 0.6, minSlaMinutes: 15, maxAutoRefundCents: 5000 };

check(
  "example",
  decideHandoff(
    { intent: "refund", confidence: 0.91, sentiment: "angry", vip: true, slaMinutesLeft: 40, amountCents: 8000 },
    policy
  ),
  { action: "escalate", reasons: ["angry_vip", "refund_over_limit"] }
);

check(
  "resolve FAQ",
  decideHandoff(
    { intent: "track_order", confidence: 0.8, sentiment: "neutral", vip: false, slaMinutesLeft: 120, amountCents: 0 },
    policy
  ),
  { action: "resolve", reasons: [] }
);

check(
  "low confidence only",
  decideHandoff(
    { intent: "track_order", confidence: 0.2, sentiment: "neutral", vip: false, slaMinutesLeft: 120, amountCents: 0 },
    policy
  ),
  { action: "escalate", reasons: ["low_confidence"] }
);

check(
  "refund at cap is ok",
  decideHandoff(
    { intent: "refund", confidence: 0.9, sentiment: "neutral", vip: false, slaMinutesLeft: 120, amountCents: 5000 },
    policy
  ),
  { action: "resolve", reasons: [] }
);

module.exports = { decideHandoff };
