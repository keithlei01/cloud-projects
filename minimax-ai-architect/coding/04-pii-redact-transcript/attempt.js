/**
 * Implement redactPii — see problem.md
 * Run: node attempt.js
 */
function redactPii(text) {
  // TODO
}

function check(label, actual, expected) {
  const ok = actual === expected;
  console.log(label + " =>", ok ? "OK" : "FAIL");
  if (!ok) {
    console.log("  actual  ", actual);
    console.log("  expected", expected);
  }
}

check(
  "example",
  redactPii("Email me at a.b@shop.com card 4111-1111-1111-1111 phone 13812345678 or 555-010-9999 ORD-1007"),
  "Email me at [EMAIL] card [CARD] phone [PHONE] or [PHONE] ORD-1007"
);
check("plain card", redactPii("cc 4111111111111111"), "cc [CARD]");
check("no pii", redactPii("Where is order ORD-1007?"), "Where is order ORD-1007?");
check("two emails", redactPii("a@x.co and b@y.io"), "[EMAIL] and [EMAIL]");

module.exports = { redactPii };
