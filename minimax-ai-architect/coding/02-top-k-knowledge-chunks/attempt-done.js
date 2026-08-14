/**
 * Implement retrieveTopK — see problem.md
 * Run: node attempt.js
 */
function retrieveTopK(query, chunks, k) {
  // parse input
  // check with rules
  // return

  // "where is my order shipping"
  const queryTokens = new Set((query.toLowerCase().match(/[0-9a-z]+/g) || []).filter((t) => t.length > 2));

  // { id: "s2", title: "Refunds", text: "Refunds take 5 days." },
  const scored = [];
  for (const chunk of chunks) {
    const document = (chunk.title + " " + chunk.text).toLocaleLowerCase();
    let score = 0;
    for (const token of queryTokens) {
      if (document.includes(token)) {
        score += 1;
      }
    }
    if (score > 0) {
      scored.push({ id: chunk.id, title: chunk.title, score });
    }
  }

  scored.sort((a, b) => {
    b.score - a.score || a.id.localeCompare(b.id);
  });
  return scored.slice(0, k);
}

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(label + " =>", actual, ok ? "OK" : "expected " + JSON.stringify(expected));
}

const chunks = [
  { id: "s2", title: "Refunds", text: "Refunds take 5 days." },
  { id: "s1", title: "Shipping", text: "Track your order in the app." },
  { id: "s3", title: "Shipping delays", text: "Snow can delay an order." },
];

check(
  "example",
  retrieveTopK("where is my order shipping", [chunks[0], chunks[1]], 2),
  [{ id: "s1", title: "Shipping", score: 2 }]
);

check(
  "top 2 + id tie-break on score",
  retrieveTopK("order shipping delays", chunks, 2),
  [
    { id: "s3", title: "Shipping delays", score: 3 },
    { id: "s1", title: "Shipping", score: 2 },
  ]
);

check("k=1", retrieveTopK("order", chunks, 1), [{ id: "s1", title: "Shipping", score: 1 }]);

check("no hit", retrieveTopK("password reset", chunks, 3), []);

module.exports = { retrieveTopK };
