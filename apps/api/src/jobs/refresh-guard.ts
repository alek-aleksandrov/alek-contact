type Deps = { cooldownMs: number; now: () => number };
type RunResult<T> =
  | { ok: true; result: T }
  | { ok: false; reason: "running" | "cooldown"; retryAfterMs?: number };

export class RefreshGuard {
  private running = false;
  private lastFinishedAt: number | null = null;
  constructor(private readonly deps: Deps) {}

  async run<T>(fn: () => Promise<T>): Promise<RunResult<T>> {
    if (this.running) return { ok: false, reason: "running" };
    const now = this.deps.now();
    if (this.lastFinishedAt !== null) {
      const elapsed = now - this.lastFinishedAt;
      if (elapsed < this.deps.cooldownMs) {
        return { ok: false, reason: "cooldown", retryAfterMs: this.deps.cooldownMs - elapsed };
      }
    }
    this.running = true;
    try {
      const result = await fn();
      return { ok: true, result };
    } finally {
      this.running = false;
      this.lastFinishedAt = this.deps.now();
    }
  }

  /**
   * Like run(), but for automatic (boot/cron) ingests: it respects the
   * `running` lock so it can't overlap a manual refresh, but ignores the
   * cooldown window (which only exists to rate-limit user clicks).
   */
  async runImmediate<T>(fn: () => Promise<T>): Promise<RunResult<T>> {
    if (this.running) return { ok: false, reason: "running" };
    this.running = true;
    try {
      const result = await fn();
      return { ok: true, result };
    } finally {
      this.running = false;
      this.lastFinishedAt = this.deps.now();
    }
  }
}
