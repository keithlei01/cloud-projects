/** LeetCode #560 */
function countSubarraysSumToTarget(dailyRevenueCents, targetCents) {
  const freq = new Map([[0, 1]]);   // previous sum -> count
  let prefix = 0;   // previous sum
  let count = 0;    // how many times previous sum happens

  for (const x of dailyRevenueCents) {
    prefix += x;
    const need = prefix - targetCents;    // need this for target, was it seen before?
    count += freq.get(need) || 0;         // if yes from freq, count
    freq.set(prefix, (freq.get(prefix) || 0) + 1);
  }

  return count;
}

module.exports = { countSubarraysSumToTarget };
