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

// TODO: only remove the handlers we installed
function cleanupEventHandlers(streams) {
  streams.forEach(s => events.map(e => s.removeAllListeners(e)));
}

function streamPromise(streams, i) {
  const stream = streams[i];

  if (stream === process.stdout || stream === process.stderr) {
    return Promise.resolve(stream);
  }

  function on(evt) {
    function executor(resolve, reject) {
      const fn = evt === 'error' ?
        err => {
          cleanupEventHandlers(streams);
          reject(new StreamError(err, stream))
        }
        : () => resolve(stream);
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
  return Promise.all(allStreams.map(
    (value, i) => streamPromise(allStreams, i)
  )).then((streams) => {
    cleanupEventHandlers(streams);
    return streams;
  });
}

module.exports = Object.assign(promisePipe, {
  __esModule: true,
  default: promisePipe,
  justPromise: streams => Promise.all(streams.map((_, i) => {
    return streamPromise(streams, i)
  })),
  StreamError,
});
