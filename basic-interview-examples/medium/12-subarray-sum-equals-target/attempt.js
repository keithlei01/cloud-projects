/**
 * Implement countSubarraysSumToTarget — LC #560 (see problem.md)
 * Run: node attempt.js
 */
function countSubarraysSumToTarget(dailyRevenueCents, targetCents) {
  // TODO
}

console.log("example =>", countSubarraysSumToTarget([1, 2, 3, 4, 5], 9));
// expected: 2  ([2,3,4] and [4,5])

console.log("ones =>", countSubarraysSumToTarget([1, 1, 1], 2));
// expected: 2

console.log("negative =>", countSubarraysSumToTarget([1, -1, 0], 0));
// expected: 3

console.log("empty =>", countSubarraysSumToTarget([], 5));
// expected: 0

module.exports = { countSubarraysSumToTarget };
