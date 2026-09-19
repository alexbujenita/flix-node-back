const nock = require("nock");
const { afterAll, afterEach, beforeAll } = require("@jest/globals");
const db = require("../models");
const { migrate, truncateAll } = require("./helpers/db");

beforeAll(async () => {
  await migrate(db.sequelize);
  nock.disableNetConnect();
  nock.enableNetConnect(/^(127\.0\.0\.1|localhost)(:\d+)?$/);
});

afterEach(async () => {
  await truncateAll(db);
  const pendingMocks = nock.pendingMocks();

  try {
    if (pendingMocks.length === 0) {
      return;
    }
  } finally {
    nock.cleanAll();
  }

  throw new Error(`Unused nock interceptors: ${pendingMocks.join(", ")}`);
});

afterAll(async () => {
  nock.enableNetConnect();
  await db.sequelize.close();
});
