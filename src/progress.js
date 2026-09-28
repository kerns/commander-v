const PROGRESS_DELAY_MS = 1000;

async function withDelayedProgress(api, title, task) {
  const source = new api.CancellationTokenSource();
  let reporter;
  let latest;
  let finished = false;
  let finishNotification;
  let notification = Promise.resolve();
  // Only the notification waits for this signal; the copy starts immediately.
  const completion = new Promise(resolve => { finishNotification = resolve; });
  const timer = setTimeout(() => {
    notification = Promise.resolve().then(() => {
      if (finished) return;
      return api.window.withProgress({
        location: api.ProgressLocation.Notification, title, cancellable: true,
      }, async (progress, token) => {
        reporter = progress;
        const cancellation = token.onCancellationRequested(() => source.cancel());
        if (token.isCancellationRequested) source.cancel();
        try {
          if (latest) reporter.report(latest);
          await completion;
        } finally {
          cancellation.dispose();
          reporter = undefined;
        }
      });
    }).catch(error => {
      // A notification failure must not discard a successful copy or mask its error.
      console.warn('Commander V: could not show progress:', error.message);
    });
  }, PROGRESS_DELAY_MS);
  try {
    return await task({ report(update) {
      latest = update;
      reporter?.report(update);
    } }, source.token);
  } finally {
    finished = true;
    clearTimeout(timer);
    finishNotification();
    await notification;
    source.dispose();
  }
}

module.exports = { withDelayedProgress };
