// const threads = require('threads');
// const config = threads.config;
// const spawn = threads.spawn;
//
// // Set base paths to thread scripts
// config.set({
//     basepath: {
//         node: __dirname + '/'
//     }
// });
//
// console.log({
//     node: __dirname + '/'
// });
//
// const thread = spawn('worker.js');
//
// thread
//     .send({
//         do: 'Something awesome!'
//     })
//     .on('message', function(message) {
//         console.log('worker.js replied:', message);
//     });

var worker = new Worker('www/worker.js');

worker.addEventListener('message', function(e) {
  console.log('Worker said: ', e.data);
}, false);

worker.postMessage('Hello World'); // Send data to our worker.
