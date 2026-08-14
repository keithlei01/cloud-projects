/**
 * Implement topKFrequentErrors — LeetCode #347 style (see problem.md)
 * Run: node attempt.js
 */
function topKFrequentErrors(logs, k) {
  const errorCount = new Map();
  for (let i = 0; i < logs.length; i++) {
    if (!errorCount.has(logs[i])) {
      errorCount.set(logs[i], 0)
    }
    errorCount.set(logs[i], (errorCount.get(logs[i]) || 0) + 1)
  }

  let result = [...errorCount.entries()].map(([code, count]) => {
    return { code, count };
  });

  return result.sort((a, b) => {
    if (a.count === b.count) return a.code.localeCompare(b.code);
    return b.count - a.count;
  }).slice(0, k);
}

// --- tests ---
console.log("example =>", topKFrequentErrors(
  ["TIMEOUT", "OK", "TIMEOUT", "FAIL", "TIMEOUT", "FAIL"],
  2
));
// expected: [
//   { code: "TIMEOUT", count: 3 },
//   { code: "FAIL", count: 2 },
// ]

console.log("empty logs =>", topKFrequentErrors([], 1));
// expected: []

console.log("tie-break code asc =>", topKFrequentErrors(["B", "A", "A", "B"], 2));
// expected: [{ code: "A", count: 2 }, { code: "B", count: 2 }]

console.log("k equals distinct =>", topKFrequentErrors(["X", "Y"], 2));
// expected: [{ code: "X", count: 1 }, { code: "Y", count: 1 }]

console.log("single code =>", topKFrequentErrors(["ERR", "ERR", "ERR"], 1));
// expected: [{ code: "ERR", count: 3 }]

module.exports = { topKFrequentErrors };
