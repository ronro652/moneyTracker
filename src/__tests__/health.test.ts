import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { GET } from "@/app/api/health/route";
import { db } from "@/lib/db";

describe("GET /api/health", () => {
  it("returns ok when database is reachable", async () => {
    vi.mocked(db.execute).mockResolvedValueOnce({ rows: [{ "?column?": 1 }] } as never);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });

  it("returns 503 when database is unreachable", async () => {
    vi.mocked(db.execute).mockRejectedValueOnce(new Error("connection refused"));
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.error).toBe("database unreachable");
  });
});
