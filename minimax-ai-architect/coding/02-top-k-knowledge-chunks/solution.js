function retrieveTopK(query, chunks, k) {
  const queryTokens = new Set(
    (query.toLowerCase().match(/[a-z0-9]+/g) || []).filter((t) => t.length > 2)
  );

  const scored = [];
  for (const chunk of chunks) {
    const document = (chunk.title + " " + chunk.text).toLowerCase();
    let score = 0;
    for (const token of queryTokens) {
      if (document.includes(token)) score += 1;
    }
    if (score > 0) scored.push({ id: chunk.id, title: chunk.title, score });
  }

  scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return scored.slice(0, k);
}

module.exports = { retrieveTopK };
