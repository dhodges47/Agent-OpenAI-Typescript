type ThreadMsg = { role: "user" | "assistant"; content: string };

export function normalizeMessagesForAgent(messages: ThreadMsg[]) {
  return messages.map((m) => {
    if (m.role === "user") {
      return {
        role: "user",
        content: [{ type: "input_text", text: m.content }],
      };
    }

    // assistant
    return {
      role: "assistant",
      content: [{ type: "output_text", text: m.content }],
    };
  });
}
