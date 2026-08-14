function runToolCallLoop(assistantMessage, toolFns) {
  const calls = assistantMessage.tool_calls || [];
  if (calls.length === 0) {
    return { done: true, content: assistantMessage.content || "", messages: [] };
  }

  const messages = [];
  for (const call of calls) {
    let result;
    try {
      const args = JSON.parse(call.function.arguments);
      const fn = toolFns[call.function.name];
      result = fn ? fn(args) : { error: "unknown_tool" };
    } catch (err) {
      result = { error: "invalid_arguments" };
    }
    messages.push({
      role: "tool",
      tool_call_id: call.id,
      content: JSON.stringify(result),
    });
  }

  return { done: false, content: null, messages };
}

module.exports = { runToolCallLoop };
