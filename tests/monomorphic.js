
'use strict';

function add(x, y) {
    return x + y;
}

var result = 0;
for (let i = 0; i < 300000000; i++) {
    result = add(result, i / 100000);
    if (i === 1234567) {
        console.log(add('hello', 'world'));
    }
}
console.log(result);
