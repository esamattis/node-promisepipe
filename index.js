'use strict';

class StreamError extends Error {
  constructor(err, source) {
    const message = err && err.message || err;
    super(message);
    this.source = source;
    this.originalError = err;
  }
}

const events = ['error', 'end', 'close', 'finish'];

function cleanupEventHandlers(stream, listener) {
  events.map(e => stream.removeListener(e, listener));
}

function streamPromise(stream) {
  if (stream === process.stdout || stream === process.stderr) {
    return Promise.resolve(stream);
  }

  function on(evt) {
    function executor(resolve, reject) {
      const fn = evt === 'error' ?
        err => reject(new StreamError(err, stream)) :
        () => {
          cleanupEventHandlers(stream, on);
          resolve(stream);
        };
      stream.on(evt, fn);
    }

    return new Promise(executor);
  }

  return Promise.race(events.map(on));
}

/**
 * @param {...Stream} stream
 */
function promisePipe(stream) {
  let i = arguments.length;
  const streams = [];
  while ( i-- ) streams[i] = arguments[i];

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
