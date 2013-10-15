

# promisePipe

Safely pipe node.js streams while capturing all errors to a single promise.


## API

```
promisePipe(<readable stream>, [transform streams...], <writeable stream>)
```

It returns a promise. On success the resolved value will be an array of the
streams passed in.

## Example

```javascript

var promisePipe = require("promisepipe");

promisePipe(
    fs.createReadStream(INPUT_FILE),
    new UpcaseTransform(),
    fs.createReadStream(OUTPUT_FILE),
).then(function(streams){
    console.log("Yay, all streams are now closed/ended/finished!");
}, function(err) {
    console.log("This stream failed:", err.source);
    console.log("Original error was:", err.originalError);
});

```

## Install

    npm instal promisepipe

## Why?

Stream piping in node.js is cool, but error handling is not because streams
do not bubble to the target streams.

For example if the previous example is written like this:

```javascript
fs.createReadStream(INPUT_FILE)
.pipe(new UpcaseTransform())
.pipe(fs.createReadStream(OUTPUT_FILE))
```

It might crash your program at any time. You must handle the errors
from each stream manually like this:

```javascript
fs.createReadStream(INPUT_FILE).on("error", function(err) {
    // handle the error
}).pipe(new UpcaseTransform()).on("error", function(err) {
    // handle the error
}).pipe(fs.createReadStream(OUTPUT_FILE)).on("error", function(err) {
    // handle the error
})
```

Which is imo repeative and cumbersome.

