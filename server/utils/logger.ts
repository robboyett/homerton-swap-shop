/**
 * The one logger (AGENTS.md). Product code calls this and never console directly, so there is
 * one place to change when the output needs to go somewhere else. Never log an email, a number
 * or a password: ids only.
 */
export const log = {
  info(message: string, data: Record<string, unknown> = {}) {
    console.info(message, data);
  },
  warn(message: string, data: Record<string, unknown> = {}) {
    console.warn(message, data);
  },
  error(message: string, data: Record<string, unknown> = {}) {
    console.error(message, data);
  },
};
