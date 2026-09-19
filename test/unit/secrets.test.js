// Both this file and src/config/secrets.js sit two directories below the
// repository root, so "../../secrets" resolves to the same gitignored module
// from either one. It is mocked virtually because it does not exist on a fresh
// clone or in CI.
const SECRETS_MODULE = "../../secrets";
const CONFIG_MODULE = "../../src/config/secrets";
const ENV_KEYS = ["TMDB_API_KEY", "JWT_PRIVATE_KEY"];

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

function applyEnv(env) {
  for (const key of ENV_KEYS) {
    if (env[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = env[key];
    }
  }
}

function loadConfigSecrets({ env = {}, fallback } = {}) {
  let loaded;

  // process.env is shared by every test file in the worker, and routes read
  // these keys at require time. The originals go back immediately rather than
  // in afterEach so no other module can be required against a stripped env.
  applyEnv(env);

  try {
    jest.isolateModules(() => {
      jest.doMock(
        SECRETS_MODULE,
        () => {
          if (fallback === undefined) {
            throw new Error(`Cannot find module '${SECRETS_MODULE}'`);
          }

          return fallback;
        },
        { virtual: true },
      );

      loaded = require(CONFIG_MODULE);
    });
  } finally {
    applyEnv(originalEnv);
  }

  return { ...loaded };
}

afterEach(() => {
  jest.dontMock(SECRETS_MODULE);
  jest.resetModules();
  applyEnv(originalEnv);
});

describe("config/secrets", () => {
  test("prefers environment variables over the secrets module", () => {
    const secrets = loadConfigSecrets({
      env: {
        TMDB_API_KEY: "env-tmdb-key",
        JWT_PRIVATE_KEY: "env-jwt-key",
      },
      fallback: { API_KEY: "file-tmdb-key", PRIVATE_KEY: "file-jwt-key" },
    });

    expect(secrets).toEqual({
      API_KEY: "env-tmdb-key",
      PRIVATE_KEY: "env-jwt-key",
    });
  });

  test("falls back to the secrets module when the environment is unset", () => {
    const secrets = loadConfigSecrets({
      env: {},
      fallback: { API_KEY: "file-tmdb-key", PRIVATE_KEY: "file-jwt-key" },
    });

    expect(secrets).toEqual({
      API_KEY: "file-tmdb-key",
      PRIVATE_KEY: "file-jwt-key",
    });
  });

  test("mixes an environment variable with a secrets module value", () => {
    const secrets = loadConfigSecrets({
      env: { TMDB_API_KEY: "env-tmdb-key" },
      fallback: { API_KEY: "file-tmdb-key", PRIVATE_KEY: "file-jwt-key" },
    });

    expect(secrets).toEqual({
      API_KEY: "env-tmdb-key",
      PRIVATE_KEY: "file-jwt-key",
    });
  });

  test("loads without throwing when the secrets module is absent", () => {
    const secrets = loadConfigSecrets({
      env: {
        TMDB_API_KEY: "env-tmdb-key",
        JWT_PRIVATE_KEY: "env-jwt-key",
      },
    });

    expect(secrets).toEqual({
      API_KEY: "env-tmdb-key",
      PRIVATE_KEY: "env-jwt-key",
    });
  });

  test("exposes undefined keys when neither the environment nor the module supplies them", () => {
    const secrets = loadConfigSecrets({ env: {} });

    expect(secrets).toEqual({
      API_KEY: undefined,
      PRIVATE_KEY: undefined,
    });
  });
});
