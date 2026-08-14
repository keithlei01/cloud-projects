/**
 * Implement removeDuplicatesSortedIds — LC #26 (see problem.md)
 * Run: node attempt.js
 */
function removeDuplicatesSortedIds(ids) {
  if (ids.length === 0) return 0;

  let write = 1;
  for (let i = 1; i < ids.length; i++) {
    if (ids[i] !== ids[write]) {
      ids[write] = ids[i];
      write++;
    }
  }
  return write;
}

function check(label, input, expectedCount, expectedPrefix) {
  const arr = [...input];
  const count = removeDuplicatesSortedIds(arr);
  const ok = count === expectedCount && JSON.stringify(arr.slice(0, count)) === JSON.stringify(expectedPrefix);
  console.log(label + " =>", count, arr.slice(0, count), ok ? "OK" : "expected count " + expectedCount + " prefix " + JSON.stringify(expectedPrefix));
}

check("example", [1, 1, 2, 2, 3], 3, [1, 2, 3]);
check("empty", [], 0, []);
check("no dupes", [1, 2, 3], 3, [1, 2, 3]);
check("all same", [7, 7, 7], 1, [7]);

module.exports = { removeDuplicatesSortedIds };
