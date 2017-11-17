'use strict';

class StreamError extends Error {
  constructor(err, source) {
    const message = err && err.message || err;
    super(message);
    this.source = source;
    this.originalError = err;
  }
}

// TODO: only remove the handlers we installed
function cleanupEventHandlers(streams) {
  const lastStream = streams[streams.length - 1];
  streams.forEach(s => s.removeAllListeners('error'));
  lastStream.removeAllListeners('finish');
}

// Returns a promise that is accepted when the pipe operation is done.
function streamPromise(streams) {
  // There only two events that interest us:
  // * A 'finish' event emitted by the last stream in the chain, which means
  // the chained pipe operations are done, and the last stream has been
  // flushed and ended.
  // * An 'error' event from any stream, when something goes wrong.
  return Promise.race([
    new Promise((accept, reject) => {
      const stream = streams[streams.length - 1];
      if (stream === process.stdout || stream === process.stderr) {
        accept();
      }
      stream.once('finish', accept);
    }),
    Promise.all(streams.map(
      stream => new Promise((accept, reject) => {
        if (stream === process.stdout || stream === process.stderr) {
          accept();
        }
        stream.once('error', err => reject(new StreamError(err, stream)));
      })
    ))
  ]).then(() => {
    cleanupEventHandlers(streams);
    return streams;
  });
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
  const promise = streamPromise(streams);
  allStreams.reduce((current, next) => current.pipe(next));
  return promise;
}

module.exports = Object.assign(promisePipe, {
  __esModule: true,
  default: promisePipe,
  justPromise: streamPromise,
  StreamError,
});
