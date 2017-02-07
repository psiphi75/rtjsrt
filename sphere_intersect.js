
const cpp = require('./build/Release/sphere_intersect');

var x = {
    dir: {
        x: 0.09690059143094072,
        y: 0.026037001021610728,
        z: 0.9949534411007053
    },
    ori: {
        x: 0,
        y: 2,
        z: -15
    },
    c: {
        x: 1.5524163574746117,
        y: 1.6,
        z: 0.001858237138153862
    },
    radius: 0.8,
    col: {
        x: 1,
        y: 1,
        z: 1
    }
};

console.log('Expect: ');
console.log('A: 1');
console.log('B: -30.132331477446556');
console.log('C: 226.98574711414463');
console.log('D: 0.01441181013797177');
console.log('t: 15.006141139311929');
console.log('pi: Vector { 1.4541039514954965, 2.3907149121746993, -0.0695882357987383}');
console.log('\n\nStarting C++ code:');
console.log('C result:', cpp.intersect(x.dir, x.ori, x.c, x.radius, x.col));
