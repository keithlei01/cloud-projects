function redactPii(text) {
  let out = text;
  out = out.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[EMAIL]");
  out = out.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, "[CARD]");
  out = out.replace(/\b1[3-9]\d{9}\b/g, "[PHONE]");
  out = out.replace(/\b\d{3}[-. ]\d{3}[-. ]\d{4}\b/g, "[PHONE]");
  return out;
}

module.exports = { redactPii };
