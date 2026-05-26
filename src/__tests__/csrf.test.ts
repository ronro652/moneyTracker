import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

function makeRequest(method: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL("http://localhost:3000/api/holdings"), {
    method,
    headers,
  });
}

describe("CSRF middleware", () => {
  it("allows GET requests without origin", () => {
    const res = middleware(makeRequest("GET"));
    expect(res.status).toBe(200);
  });

  it("allows POST with matching origin and host", () => {
    const res = middleware(
      makeRequest("POST", { origin: "http://localhost:3000", host: "localhost:3000" }),
    );
    expect(res.status).toBe(200);
  });

  it("blocks POST without origin header", () => {
    const res = middleware(makeRequest("POST", { host: "localhost:3000" }));
    expect(res.status).toBe(403);
  });

  it("blocks POST with mismatched origin", () => {
    const res = middleware(
      makeRequest("POST", { origin: "http://evil.com", host: "localhost:3000" }),
    );
    expect(res.status).toBe(403);
  });

  it("blocks PUT with mismatched origin", () => {
    const res = middleware(
      makeRequest("PUT", { origin: "http://attacker.site", host: "localhost:3000" }),
    );
    expect(res.status).toBe(403);
  });

  it("blocks DELETE without origin", () => {
    const res = middleware(makeRequest("DELETE", { host: "localhost:3000" }));
    expect(res.status).toBe(403);
  });

  it("allows cron endpoint without origin", () => {
    const req = new NextRequest(new URL("http://localhost:3000/api/cron/snapshots"), {
      method: "GET",
      headers: { authorization: "Bearer secret" },
    });
    const res = middleware(req);
    expect(res.status).toBe(200);
  });
});
