function createRequestAbortController(req, res) {
  const controller = new AbortController();

  const abort = () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };

  const onRequestAborted = () => abort();
  const onResponseClose = () => {
    if (!res.writableEnded) {
      abort();
    }
  };

  req.once("aborted", onRequestAborted);
  res.once("close", onResponseClose);

  return {
    signal: controller.signal,
    isAborted: () =>
      controller.signal.aborted || res.destroyed || res.writableEnded,
    cleanup: () => {
      req.off("aborted", onRequestAborted);
      res.off("close", onResponseClose);
    },
  };
}

module.exports = { createRequestAbortController };
