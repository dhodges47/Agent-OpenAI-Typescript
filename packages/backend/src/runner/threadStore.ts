export type ThreadMessage = { role: "user" | "assistant"; content: string };

type ThreadState = {
  createdAt: number;
  messages: ThreadMessage[];
};

const threads = new Map<string, ThreadState>();

export function getOrCreateThread(threadId: string): ThreadState {
  const t = threads.get(threadId);
  if (t) return t;

  const created: ThreadState = { createdAt: Date.now(), messages: [] };
  threads.set(threadId, created);
  return created;
}

export function appendMessage(threadId: string, msg: ThreadMessage) {
  const t = getOrCreateThread(threadId);
  t.messages.push(msg);
}

export function getMessages(threadId: string): ThreadMessage[] {
  return getOrCreateThread(threadId).messages;
}

export function clearThread(threadId: string) {
  threads.delete(threadId);
}
