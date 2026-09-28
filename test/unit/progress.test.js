const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setImmediate: nextTurn } = require('node:timers/promises');
const { withDelayedProgress } = require('../../src/progress');
const { checkCancellation } = require('../../src/files');

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function fixture(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  class CancellationTokenSource {
    listeners = new Set();
    disposed = false;
    token = {
      isCancellationRequested: false,
      onCancellationRequested: listener => {
        this.listeners.add(listener);
        return { dispose: () => this.listeners.delete(listener) };
      },
    };
    cancel() {
      if (this.token.isCancellationRequested) return;
      this.token.isCancellationRequested = true;
      for (const listener of this.listeners) listener();
    }
    dispose() { this.disposed = true; this.listeners.clear(); }
  }
  const sources = [];
  const notices = [];
  const api = {
    CancellationTokenSource: class extends CancellationTokenSource {
      constructor() { super(); sources.push(this); }
    },
    ProgressLocation: { Notification: 15 },
    window: {
      async withProgress(options, task) {
        const source = new CancellationTokenSource();
        const notice = { options, source, reports: [], closed: false };
        notices.push(notice);
        try { return await task({ report: update => notice.reports.push(update) }, source.token); }
        finally { notice.closed = true; }
      },
    },
  };
  return { api, sources, notices };
}

test('quick copies start immediately and never show a late progress notification', async t => {
  const { api, sources, notices } = fixture(t);
  const work = deferred();
  let started = false;
  const result = withDelayedProgress(api, 'Copy', async (progress, token) => {
    started = true;
    assert.equal(token.isCancellationRequested, false);
    progress.report({ message: 'One file' });
    await work.promise;
    return 'copied';
  });
  assert.ok(started);
  t.mock.timers.tick(500);
  work.resolve();
  assert.equal(await result, 'copied');
  t.mock.timers.tick(2000);
  await nextTurn();
  assert.equal(notices.length, 0);
  assert.ok(sources[0].disposed);
});

test('slow copies reveal progress after one second and close it before returning', async t => {
  const { api, sources, notices } = fixture(t);
  const work = deferred();
  let report;
  const result = withDelayedProgress(api, 'Copy Project Tree', async progress => {
    report = progress.report;
    report({ message: 'First folder' });
    report({ message: 'Second folder' });
    await work.promise;
    return 42;
  });
  t.mock.timers.tick(999);
  await nextTurn();
  assert.equal(notices.length, 0);
  t.mock.timers.tick(1);
  await nextTurn();
  assert.equal(notices.length, 1);
  const notice = notices[0];
  assert.deepEqual(notice.options, { location: 15, title: 'Copy Project Tree', cancellable: true });
  assert.deepEqual(notice.reports, [{ message: 'Second folder' }]);
  report({ message: 'Third folder' });
  assert.deepEqual(notice.reports.at(-1), { message: 'Third folder' });
  assert.equal(notice.closed, false);
  work.resolve();
  assert.equal(await result, 42);
  assert.ok(notice.closed);
  assert.equal(notice.source.listeners.size, 0);
  assert.ok(sources[0].disposed);
});

test('Cancel on the delayed notification reaches the running copy before clipboard work', async t => {
  const { api, sources, notices } = fixture(t);
  const work = deferred();
  let wroteClipboard = false;
  const result = withDelayedProgress(api, 'Copy', async (_progress, token) => {
    await work.promise;
    checkCancellation(token);
    wroteClipboard = true;
  });
  const rejected = assert.rejects(result, { name: 'CancellationError' });
  t.mock.timers.tick(1000);
  await nextTurn();
  notices[0].source.cancel();
  assert.ok(sources[0].token.isCancellationRequested);
  work.resolve();
  await rejected;
  assert.equal(wroteClipboard, false);
  assert.ok(notices[0].closed);
  assert.equal(notices[0].source.listeners.size, 0);
  assert.ok(sources[0].disposed);
});

test('synchronous and quick async failures preserve the error without a stray notification', async t => {
  const { api, sources, notices } = fixture(t);
  const error = new Error('Could not read file');
  await assert.rejects(withDelayedProgress(api, 'Copy', () => { throw error; }), actual => actual === error);
  await assert.rejects(withDelayedProgress(api, 'Copy', async () => { throw error; }), actual => actual === error);
  t.mock.timers.tick(2000);
  await nextTurn();
  assert.equal(notices.length, 0);
  assert.ok(sources.every(source => source.disposed));
});

test('a slow failure closes progress and preserves the original error', async t => {
  const { api, sources, notices } = fixture(t);
  const work = deferred();
  const error = new Error('Provider disconnected');
  const result = withDelayedProgress(api, 'Copy', () => work.promise);
  const rejected = assert.rejects(result, actual => actual === error);
  t.mock.timers.tick(1000);
  await nextTurn();
  work.reject(error);
  await rejected;
  assert.ok(notices[0].closed);
  assert.equal(notices[0].source.listeners.size, 0);
  assert.ok(sources[0].disposed);
});

test('notification failures do not discard a successful copy', async t => {
  const { api, sources } = fixture(t);
  const warning = t.mock.method(console, 'warn', () => {});
  api.window.withProgress = () => { throw new Error('Notification unavailable'); };
  const work = deferred();
  const result = withDelayedProgress(api, 'Copy', () => work.promise);
  t.mock.timers.tick(1000);
  await nextTurn();
  work.resolve('copied');
  assert.equal(await result, 'copied');
  assert.equal(warning.mock.callCount(), 1);
  assert.ok(sources[0].disposed);
});

test('completion at the delay boundary does not open progress after the copy returns', async t => {
  const { api, notices } = fixture(t);
  const work = deferred();
  const result = withDelayedProgress(api, 'Copy', () => work.promise);
  work.resolve('copied');
  t.mock.timers.tick(1000);
  assert.equal(await result, 'copied');
  await nextTurn();
  assert.equal(notices.length, 0);
});
