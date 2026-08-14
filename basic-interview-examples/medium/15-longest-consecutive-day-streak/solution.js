/** LeetCode #128 */
function longestConsecutiveDayStreak(activeDays) {
  const set = new Set(activeDays);
  let best = 0;

  for (const day of set) {
    if (set.has(day - 1)) continue; // not a streak start

    let len = 1;
    while (set.has(day + len)) {
      len++;
    }
    best = Math.max(best, len);
  }

  return best;
}

module.exports = { longestConsecutiveDayStreak };
