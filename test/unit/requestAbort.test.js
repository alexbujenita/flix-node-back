const { EventEmitter } = require("events");
const { createRequestAbortController } = require("../../src/utils/requestAbort");

function createRequestResponse() {
  return {
    req: new EventEmitter(),
    res: Object.assign(new EventEmitter(), {
      destroyed: false,
      writableEnded: false,
    }),
  };
}

describe("requestAbort", () => {
  test("starts with a non-aborted signal", () => {
    const { req, res } = createRequestResponse();

    const { signal, isAborted } = createRequestAbortController(req, res);

    expect(signal.aborted).toBe(false);
    expect(isAborted()).toBe(false);
  });

  test("aborts when the request emits aborted", () => {
    const { req, res } = createRequestResponse();
    const { signal } = createRequestAbortController(req, res);

    req.emit("aborted");

    expect(signal.aborted).toBe(true);
  });

  test("aborts when the response closes before it has ended", () => {
    const { req, res } = createRequestResponse();
    const { signal } = createRequestAbortController(req, res);

    res.emit("close");

    expect(signal.aborted).toBe(true);
  });

  test("does not abort when the response closes after it has ended", () => {
    const { req, res } = createRequestResponse();
    res.writableEnded = true;
    const { signal } = createRequestAbortController(req, res);

    res.emit("close");

    expect(signal.aborted).toBe(false);
  });

  test.each(["destroyed", "writableEnded"])("reports an aborted request when response.%s is true", (property) => {
    const { req, res } = createRequestResponse();
    const controller = createRequestAbortController(req, res);
    res[property] = true;

    expect(controller.isAborted()).toBe(true);
  });

  test("aborts only once when multiple abort lifecycle events occur", () => {
    const { req, res } = createRequestResponse();
    const { signal } = createRequestAbortController(req, res);
    const onAbort = jest.fn();
    signal.addEventListener("abort", onAbort);

    req.emit("aborted");
    res.emit("close");

    expect(signal.aborted).toBe(true);
    expect(onAbort).toHaveBeenCalledTimes(1);
  });

  test("removes lifecycle listeners during cleanup", () => {
    const { req, res } = createRequestResponse();
    const { signal, cleanup } = createRequestAbortController(req, res);

    cleanup();
    req.emit("aborted");
    res.emit("close");

    expect(req.listenerCount("aborted")).toBe(0);
    expect(res.listenerCount("close")).toBe(0);
    expect(signal.aborted).toBe(false);
  });
});
