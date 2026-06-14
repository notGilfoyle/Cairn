import { describe, it, expect } from "vitest";
import type { QuantityEntry } from "../data/types";
import {
  aggregateQuantity,
  periodRange,
  aggregateInPeriod,
  ledger,
  goalProgress,
} from "./aggregate";

function qe(date: string, amount: number, tags: string[] = []): QuantityEntry {
  return { id: `${date}-${amount}`, trackerId: "t", date, amount, note: null, tags, createdAt: date };
}

describe("aggregateQuantity", () => {
  it("sum / average / count / latest", () => {
    const a = [10, 20, 30];
    expect(aggregateQuantity(a, "sum")).toBe(60);
    expect(aggregateQuantity(a, "average")).toBe(20);
    expect(aggregateQuantity(a, "count")).toBe(3);
    expect(aggregateQuantity(a, "latest")).toBe(30); // last = most recent
    expect(aggregateQuantity([], "sum")).toBe(0);
  });
});

describe("periodRange (week start Monday)", () => {
  it("day/week/month around Sat 2026-06-13", () => {
    expect(periodRange("2026-06-13", "day", "monday")).toEqual({ from: "2026-06-13", to: "2026-06-13" });
    expect(periodRange("2026-06-13", "week", "monday")).toEqual({ from: "2026-06-08", to: "2026-06-14" });
    expect(periodRange("2026-06-13", "month", "monday")).toEqual({ from: "2026-06-01", to: "2026-06-30" });
  });
});

describe("aggregateInPeriod", () => {
  const entries = [qe("2026-06-08", 100), qe("2026-06-10", 200), qe("2026-06-01", 999)];
  it("sums entries within the week", () => {
    expect(aggregateInPeriod(entries, "sum", "2026-06-13", "week", "monday")).toBe(300);
  });
  it("sums entries within the month", () => {
    expect(aggregateInPeriod(entries, "sum", "2026-06-13", "month", "monday")).toBe(1299);
  });
});

describe("ledger", () => {
  it("computes in / out / net and by-tag", () => {
    const entries = [
      qe("2026-06-10", -250, ["food"]),
      qe("2026-06-11", -100, ["food"]),
      qe("2026-06-12", -500, ["rent"]),
      qe("2026-06-05", 50000, ["salary"]),
    ];
    const l = ledger(entries);
    expect(l.in).toBe(50000);
    expect(l.out).toBe(-850);
    expect(l.net).toBe(49150);
    // sorted by absolute net desc
    expect(l.byTag[0]).toEqual({ tag: "salary", net: 50000 });
    expect(l.byTag.find((b) => b.tag === "food")!.net).toBe(-350);
  });

  it("buckets untagged entries", () => {
    expect(ledger([qe("2026-06-10", -10)]).byTag[0].tag).toBe("untagged");
  });
});

describe("goalProgress", () => {
  it("fraction of target for the period", () => {
    const entries = [qe("2026-06-13", 1500)];
    const gp = goalProgress(entries, "sum", { period: "day", target: 2000 }, "2026-06-13", "monday");
    expect(gp).toEqual({ value: 1500, target: 2000, fraction: 0.75 });
  });
  it("null when no goal", () => {
    expect(goalProgress([], "sum", null, "2026-06-13", "monday")).toBeNull();
  });
});
