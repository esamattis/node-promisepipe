class StreamError extends Error {
  constructor(err, source) {
    const { message = err } = err || {};
    super(message);
    this.source = source;
    this.originalError = err;
  }
}

function streamPromise(stream) {
  if (stream === process.stdout || stream === process.stderr) {
    return Promise.resolve(stream);
  }

  function on(evt) {
    function executor(resolve, reject) {
      const fn = evt === 'error' ?
        err => reject(new StreamError(err, stream)) :
        () => resolve(stream);
      stream.on(evt, fn);
    }

    return new Promise(executor);
  }

  return Promise.race(['error', 'end', 'close', 'finish'].map(on));
}

function promisePipe(...streams) {
  const allStreams = streams
    .reduce((current, next) => current.concat(next), []);

  allStreams.reduce((current, next) => current.pipe(next));
  return Promise.all(allStreams.map(streamPromise));
}

module.exports = Object.assign(promisePipe, {
  __esModule: true,
  default: promisePipe,
  justPromise: streams => Promise.all(streams.map(streamPromise)),
  StreamError,
});
