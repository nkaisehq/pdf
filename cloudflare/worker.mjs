import { DurableObject } from 'cloudflare:workers';

const CONTAINER_PORT = 3002;
const DEFAULT_INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const STARTUP_TIMEOUT_MS = 60 * 1000;

const FORWARDED_ENV_KEYS = [
  'API_KEY',
  'OFFICIAL_OC_KEY',
  'API_URL',
  'WEBSITE_URL',
  'IMAGES_URL',
  'OC_ENV',
  'OC_SECRET',
  'SENTRY_DSN',
  'SENTRY_ENVIRONMENT',
  'SENTRY_TRACES_SAMPLE_RATE',
  'SENTRY_PROFILES_SAMPLE_RATE',
  'DEBUG_SENTRY_KEY',
  'HYPERWATCH_ENABLED',
  'HYPERWATCH_PATH',
  'HYPERWATCH_USERNAME',
  'HYPERWATCH_SECRET',
  'FETCH_AGENT_KEEP_ALIVE',
  'FETCH_AGENT_KEEP_ALIVE_MSECS',
];

function buildContainerEnv(workerEnv) {
  const env = {
    PORT: String(CONTAINER_PORT),
    HOSTNAME: '0.0.0.0',
  };
  for (const key of FORWARDED_ENV_KEYS) {
    if (workerEnv[key] !== undefined && workerEnv[key] !== '') {
      env[key] = String(workerEnv[key]);
    }
  }
  return env;
}

export class BetterlifePdfContainer extends DurableObject {
  #startupPromise = null;

  async #waitForPortReady() {
    const port = this.ctx.container.getTcpPort(CONTAINER_PORT);
    const deadline = Date.now() + STARTUP_TIMEOUT_MS;
    let lastError;

    while (Date.now() < deadline) {
      try {
        const res = await port.fetch('http://container/', {
          method: 'GET',
          signal: AbortSignal.timeout(1000),
        });
        if (res.ok || res.status < 500) {
          return;
        }
      } catch (err) {
        lastError = err;
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    throw new Error(
      `Container did not start listening on port ${CONTAINER_PORT} within ${STARTUP_TIMEOUT_MS}ms` +
        (lastError ? `: ${lastError.message}` : ''),
    );
  }

  async #ensureContainerReady() {
    if (!this.ctx.container) {
      throw new Error('Container binding is unavailable on this Durable Object context.');
    }

    const timeoutMs = Number(this.env.CONTAINER_INACTIVITY_TIMEOUT_MS) || DEFAULT_INACTIVITY_TIMEOUT_MS;

    if (!this.ctx.container.running) {
      if (!this.#startupPromise) {
        this.#startupPromise = (async () => {
          this.ctx.container.start({
            enableInternet: true,
            env: buildContainerEnv(this.env),
          });
          this.ctx.container.setInactivityTimeout(timeoutMs);
          this.ctx.waitUntil(this.ctx.container.monitor().catch(() => {}));
          await this.#waitForPortReady();
        })().finally(() => {
          this.#startupPromise = null;
        });
      }
      await this.#startupPromise;
    } else {
      this.ctx.container.setInactivityTimeout(timeoutMs);
    }
  }

  async fetch(request) {
    await this.#ensureContainerReady();

    const url = new URL(request.url);
    const headers = new Headers(request.headers);
    if (!headers.has('x-forwarded-host')) {
      headers.set('x-forwarded-host', url.host);
    }
    if (!headers.has('x-forwarded-proto')) {
      headers.set('x-forwarded-proto', url.protocol.replace(':', ''));
    }
    const cfConnectingIp = headers.get('cf-connecting-ip');
    if (cfConnectingIp && !headers.has('x-forwarded-for')) {
      headers.set('x-forwarded-for', cfConnectingIp);
    }

    const forwarded = new Request(request, { headers });
    return this.ctx.container.getTcpPort(CONTAINER_PORT).fetch(forwarded);
  }
}

export default {
  async fetch(request, env) {
    const poolSize = Math.max(1, Number(env.CONTAINER_POOL_SIZE) || 1);
    const instanceIndex = poolSize === 1 ? 0 : Math.floor(Math.random() * poolSize);
    const id = env.PDF_CONTAINER.idFromName(`pdf-${instanceIndex}`);
    return env.PDF_CONTAINER.get(id).fetch(request);
  },
};
