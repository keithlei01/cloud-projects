function signature(tag) {
  return tag.split("").sort().join("");
}

function groupBySignature(records) {
  const groups = new Map();

  for (const { id, tag } of records) {
    const key = signature(tag);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(id);
  }

  const result = [...groups.values()].map((ids) => ids.sort());
  result.sort((a, b) => a[0].localeCompare(b[0]));
  return result;
}

module.exports = { groupBySignature, signature };
