// module.exports = function(input, done) {
//   done('Awesome thread script may run in browser and node.js!');
// };


self.addEventListener('message', function(e) {
  self.postMessage(e.data);
}, false);
