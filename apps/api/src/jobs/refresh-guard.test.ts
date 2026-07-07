import { describe, it, expect } from "vitest";
import { RefreshGuard } from "./refresh-guard";

const defer = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
};

describe("RefreshGuard", () => {
  it("rejects a concurrent run (single-flight)", async () => {
    const g = new RefreshGuard({ cooldownMs: 0, now: () => 0 });
    let release: () => void = () => {};
    const slow = g.run(() => new Promise<string>((res) => { release = () => res("done"); }));
    const second = await g.run(async () => "x");
    expect(second).toEqual({ ok: false, reason: "running" });
    release();
    expect(await slow).toEqual({ ok: true, result: "done" });
  });

  it("enforces cooldown after a completed run", async () => {
    let t = 0;
    const g = new RefreshGuard({ cooldownMs: 60_000, now: () => t });
    expect(await g.run(async () => "a")).toEqual({ ok: true, result: "a" });
    t = 30_000;
    const r = await g.run(async () => "b");
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.reason).toBe("cooldown"); expect(r.retryAfterMs).toBe(30_000); }
    t = 61_000;
    expect(await g.run(async () => "c")).toEqual({ ok: true, result: "c" });
  });

  it("releases the lock when fn throws (no deadlock)", async () => {
    let t = 0;
    const g = new RefreshGuard({ cooldownMs: 0, now: () => t });
    await expect(g.run(async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    // lock released → a subsequent run proceeds (cooldownMs = 0)
    expect(await g.run(async () => "ok")).toEqual({ ok: true, result: "ok" });
  });
});

describe("RefreshGuard.runImmediate", () => {
  it("runs even within the cooldown window (unlike run)", async () => {
    const guard = new RefreshGuard({ cooldownMs: 10_000, now: () => 1000 });
    await guard.run(async () => "first"); // sets lastFinishedAt, starts cooldown

    const manual = await guard.run(async () => "manual");
    expect(manual).toEqual({ ok: false, reason: "cooldown", retryAfterMs: 10_000 });

    const auto = await guard.runImmediate(async () => "auto");
    expect(auto).toEqual({ ok: true, result: "auto" });
  });

  it("still refuses to overlap a running task", async () => {
    const guard = new RefreshGuard({ cooldownMs: 0, now: () => Date.now() });
    const gate = defer();
    const first = guard.runImmediate(async () => {
      await gate.promise;
      return "first";
    });
    const second = await guard.runImmediate(async () => "second");
    expect(second).toEqual({ ok: false, reason: "running" });
    gate.resolve();
    expect(await first).toEqual({ ok: true, result: "first" });
  });
});
