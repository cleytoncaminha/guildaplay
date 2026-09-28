export function logClientError(error: unknown, context: Record<string, unknown> = {}) {
  const normalized = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) };
  console.error("[GuildaPlay] client_error", { ...normalized, ...context });
}
