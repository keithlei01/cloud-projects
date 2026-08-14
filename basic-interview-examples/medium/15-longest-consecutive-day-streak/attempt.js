/**
 * Implement longestConsecutiveDayStreak — LC #128 (see problem.md)
 * Run: node attempt.js
 */
function longestConsecutiveDayStreak(activeDays) {
  // TODO
}

console.log("example =>", longestConsecutiveDayStreak([100, 4, 200, 1, 3, 2]));
// expected: 4

console.log("empty =>", longestConsecutiveDayStreak([]));
// expected: 0

console.log("duplicates =>", longestConsecutiveDayStreak([1, 2, 2, 3]));
// expected: 3

console.log("no streak =>", longestConsecutiveDayStreak([10, 30, 50]));
// expected: 1

module.exports = { longestConsecutiveDayStreak };
