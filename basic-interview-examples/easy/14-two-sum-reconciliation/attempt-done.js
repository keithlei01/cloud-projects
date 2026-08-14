/**
 * Implement twoSumReconciliation — LeetCode #1 style (see problem.md)
 * Run: node attempt.js
 */
function twoSumReconciliation(amountsCents, targetCents) {
  const seen = new Map();
  for (let i = 0; i < amountsCents.length; i++) {
    const need = targetCents - amountsCents[i];
    if (seen.has(need)) {
      return [seen.get(need), i];
    }
    seen.set(amountsCents[i], i);
  }

  return [];
}

// --- tests ---
console.log("example =>", twoSumReconciliation([200, 700, 1100, 1500], 900));
// expected: [0, 1]

console.log("negative amounts =>", twoSumReconciliation([500, -200, 300, 800], 100));
// expected: [1, 2] — -200 + 300 = 100

console.log("no pair =>", twoSumReconciliation([1, 2, 3], 100));
// expected: []

console.log("duplicate values =>", twoSumReconciliation([3, 3], 6));
// expected: [0, 1]

console.log("first pair wins =>", twoSumReconciliation([400, 500, 100, 800], 900));
// expected: [0, 1] — 400 + 500 = 900

module.exports = { twoSumReconciliation };
