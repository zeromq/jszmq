jszmq
======

jszmq is port of zeromq to Javascript, supporting both browsers and NodeJS.
The library only support the WebSocket transport (ZWS 2.0).

The API of the library is similar to that of [zeromq.js](https://github.com/zeromq/zeromq.js).

## Compatibility with ZeroMQ

WebSocket transport added to [zeromq](https://github.com/zeromq/libzmq) recently, and it is only available when compiling from source.

Other ports of zeromq, like NetMQ (C#) and JeroMQ (C#) don't yet support the WebSocket transport.

## Compatibility with ZWS 1.0, zwssock, JSMQ and NetMQ.WebSockets

The library is currently not compatible with ZWS 1.0 and the implementation of it. 

## Installation

npm install --save jszmq

## Supported socket types

Following socket types are currently supported:
* Pub
* Sub
* XPub
* XSub
* Dealer
* Router
* Req
* Rep
* Push
* Pull

## How to use

Import jszmq with one of the following:

```js
import * as zmq from 'jszmq';
```

```js
const zmq = require('jszmq');
```

### Creating a socket

To create a socket you can either use the `socket` function, which is compatible with zeromq.js or use the socket type class.

Socket type class:

```js
const dealer = new zmq.Dealer();
```

with socket function:
```js
const dealer = zmq.socket('dealer');
```

### Bind

To bind call the `bind` function:

```js
const zmq = require('jszmq');

const router = new zmq.Router();
router.bind('ws://localhost:80');
```

You can also provide an http server and bind multiple sockets on the same port:

```js
const http = require('http');
const zmq = require('jszmq');

const server = http.createServer();

const rep = new zmq.Rep();
const pub = new zmq.Pub();

rep.bind('ws://localhost:80/reqrep', server);
pub.bind('ws://localhost:80/pubsub', server);

server.listen(80);
```

`bindSync` function is an alias for bind in order to be compatible with zeromq.js.

### Sending 

To send call the send method and provide with either array or a single frame.
Frame can either be Buffer of string, in case of string it would be converted to Buffer with utf8 encoding.

```js
socket.send('Hello'); // Single frame
socket.send(['Hello', 'World']); // Multiple frames
socket.send([Buffer.from('Hello', 'utf8')]); // Using Buffer
```

### Receiving

Socket emit messages through the on (and once) methods which listen to `message` event.
Each frame is a parameter to the callback function, all frames are always instances of Buffer.

```js
socket.on('message', msg => console.log(msg.toString())); // One frame
socket.on('message', (frame1, frame2) => console.log(frame1.toString(), frame2.toString())); // Multiple frames
socket.on('message', (...frames) => frames.forEach(f => console.log(f.toString()))); // All frames as array
```

## Examples

### Push/Pull

This example demonstrates how a producer pushes information onto a
socket and how a worker pulls information from the socket.

**producer.js**

```js
// producer.js
const zmq = require('jszmq'); // OR import * as zmq form 'jszmq'
const sock = zmq.socket('push'); // OR const sock = new zmq.Push();

sock.bind('tcp://127.0.0.1:3000');
console.log('Producer bound to port 3000');

setInterval(function(){
  console.log('sending work');
  sock.send('some work');
}, 500);
```

**worker.js**

```js
// worker.js
const zmq = require('jszmq'); // OR import * as zmq form 'jszmq'
const sock = zmq.socket('pull'); // OR const sock = new zmq.Pull(); 

sock.connect('tcp://127.0.0.1:3000');
console.log('Worker connected to port 3000');

sock.on('message', function(msg) {
  console.log('work: %s', msg.toString());
});
```

### Pub/Sub

This example demonstrates using `jszmq` in a classic Pub/Sub,
Publisher/Subscriber, application.

**Publisher: pubber.js**

```js
// pubber.js
const zmq = require('jszmq'); // OR import * as zmq form 'jszmq'
const sock = zmq.socket('pub'); // OR const sock = new zmq.Pub(); 

sock.bind('tcp://127.0.0.1:3000');
console.log('Publisher bound to port 3000');

setInterval(function() {
  console.log('sending a multipart message envelope');
  sock.send(['kitty cats', 'meow!']);
}, 500);
```

**Subscriber: subber.js**

```js
// subber.js
const zmq = require('jszmq'); // OR import * as zmq form 'jszmq'
const sock = zmq.socket('sub'); // OR const sock = new zmq.Sub();

sock.connect('tcp://127.0.0.1:3000');
sock.subscribe('kitty cats');
console.log('Subscriber connected to port 3000');

sock.on('message', function(topic, message) {
  console.log('received a message related to:', topic.toString(), 'containing message:', message.toString());
});
```


