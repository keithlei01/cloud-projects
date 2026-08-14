/**
 * Implement groupBySignature — LC #49 style (see problem.md)
 * Run: node attempt.js
 */
function groupBySignature(records) {
  // TODO
}

function signature(tag) {
  return tag.split("").sort().join("");
}

console.log("example =>", groupBySignature([
  { id: "t2", tag: "pay" },
  { id: "t1", tag: "yap" },
  { id: "t3", tag: "now" },
]));
// expected: [["t1", "t2"], ["t3"]]

console.log("empty =>", groupBySignature([]));
// expected: []

console.log("singletons =>", groupBySignature([
  { id: "a", tag: "x" },
  { id: "b", tag: "y" },
]));
// expected: [["a"], ["b"]]

module.exports = { groupBySignature, signature };
