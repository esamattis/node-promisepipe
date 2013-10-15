
var Q = require("q");


function promiseFromStreams(streams) {
    return Q.all(streams.map(function(stream) {
        return Q.promise(function(resolve, reject) {
            stream.on("error", function(streamErr) {
                var err = new Error(streamErr.message);
                err.source = stream;
                err.originalError = streamErr;
                reject(err);
            });

            // This event fires when no more data will be provided.
            stream.on("end", resolve);

            // Emitted when the underlying resource (for example, the backing file
            // descriptor) has been closed. Not all streams will emit this.
            stream.on("close", resolve);

            // When the end() method has been called, and all data has been flushed
            // to the underlying system, this event is emitted.
            stream.on("finish", resolve);
        });
    }));
}

function promisePipe() {
    var streams = Array.prototype.slice.call(arguments);
    var promise = promiseFromStreams(streams);

    var current = streams.shift();
    var next;
    while (next = streams.shift()) {
        current.pipe(next);
        current = next;
    }

    return promise;
}

promisePipe.justPromise = promiseFromStreams;

module.exports = promisePipe;
