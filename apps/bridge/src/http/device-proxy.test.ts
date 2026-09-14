import Fastify from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { buildDeviceProxy } from "./device-proxy.js";

const servers: Array<{ close: () => Promise<void> }> = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe("device web proxy", () => {
  it("forwards paths, query strings, forms, and the upstream Host header", async () => {
    const upstream = Fastify();
    upstream.addContentTypeParser(
      "application/x-www-form-urlencoded",
      { parseAs: "string" },
      (_request, body, done) => done(null, body),
    );
    upstream.all("/*", async (request) => ({
      method: request.method,
      url: request.url,
      body: request.body,
      host: request.headers.host,
    }));
    const address = await upstream.listen({ port: 0, host: "127.0.0.1" });
    servers.push(upstream);

    const proxy = await buildDeviceProxy({
      DEVICE_URL: address,
      DEVICE_PROXY_PORT: 8092,
      LOG_LEVEL: "fatal",
    });
    servers.push(proxy);

    const response = await proxy.inject({
      method: "POST",
      url: "/user-menu.html?source=test",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      payload: "energyLevel=&energyL=4",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      method: "POST",
      url: "/user-menu.html?source=test",
      body: "energyLevel=&energyL=4",
      host: new URL(address).host,
    });
  });
});
