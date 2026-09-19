const nock = require('nock');
const { afterAll, afterEach, beforeAll } = require('@jest/globals');

beforeAll(() => {
  nock.disableNetConnect();
  nock.enableNetConnect(/^(127\.0\.0\.1|localhost)(:\d+)?$/);
});

afterEach(() => {
  const pendingMocks = nock.pendingMocks();

  try {
    if (pendingMocks.length === 0) {
      return;
    }
  } finally {
    nock.cleanAll();
  }

  throw new Error(`Unused nock interceptors: ${pendingMocks.join(', ')}`);
});

afterAll(() => {
  nock.enableNetConnect();
});
