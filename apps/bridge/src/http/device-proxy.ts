import fastifyHttpProxy from "@fastify/http-proxy";
import Fastify, { type FastifyInstance } from "fastify";
import type { Config } from "../config.js";

export const buildDeviceProxy = async (
  config: Pick<Config, "DEVICE_URL" | "LOG_LEVEL" | "DEVICE_PROXY_PORT">,
): Promise<FastifyInstance> => {
  const upstream = new URL(config.DEVICE_URL);
  const proxy = Fastify({
    logger: { level: config.LOG_LEVEL },
    forceCloseConnections: true,
  });

  await proxy.register(fastifyHttpProxy, {
    upstream: upstream.origin,
    http2: false,
    websocket: false,
    replyOptions: {
      rewriteRequestHeaders: (_request, headers) => ({
        ...headers,
        host: upstream.host,
      }),
    },
  });

  proxy.log.info(
    { port: config.DEVICE_PROXY_PORT, upstream: upstream.origin },
    "device web proxy configured",
  );
  return proxy;
};