/**
 * Implement classifySupportIntent — see problem.md
 * Run: node attempt.js
 */
function classifySupportIntent(message, intents) {
  // parse input - message
  // check with rules - intents
  // sort result
  
  const tokens = new Set(message.toLowerCase().match(/[0-9a-z]+/g) || []);
  let best = { intent: "unknown", score: 0 };

  for (const {name, keywords} of intents) {
    let score = 0
    for (const keyword of keywords) {
      const parts = keyword.toLowerCase().match(/[0-9a-z]+/g);
      if (parts.length > 0 && parts.every((p) => tokens.has(p))) {
        score += 1;
      }
    }
    if (score > best.score || (score > 0 && score === best.score && name < best.intent)) {
      best = { intent: name, score: score };
    }
  }

  return best;
}

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(label + " =>", actual, ok ? "OK" : "expected " + JSON.stringify(expected));
}

const intents = [
  { name: "track_order", keywords: ["track", "where is", "shipping"] },
  { name: "refund", keywords: ["refund", "money back"] },
];

check(
  "example",
  classifySupportIntent("Where is my shipping?", intents),
  { intent: "track_order", score: 2 }
);
check(
  "refund",
  classifySupportIntent("I want my money back please", intents),
  { intent: "refund", score: 1 }
);
check(
  "unknown",
  classifySupportIntent("hello there", intents),
  { intent: "unknown", score: 0 }
);
check(
  "tie → name asc",
  classifySupportIntent("help", [
    { name: "zeta", keywords: ["help"] },
    { name: "alpha", keywords: ["help"] },
  ]),
  { intent: "alpha", score: 1 }
);

module.exports = { classifySupportIntent };