
'use strict';
var vector = require('./vector');
var test = require('tape');

var vMAKE = vector.make;
var vADD = vector.add;
var vPRODUCT = vector.product;
var vSUB = vector.sub;
var vDOT = vector.dot;
var vNORM = vector.normalise;
var vSCALE = vector.scale;
var vLENGTH = vector.length;
var vMAXVAL = vector.max_val;
var vSET = vector.set;
var vGET = vector.get;

function eq(a, b) {
    return vGET(a, 0) === vGET(b, 0)
        && vGET(a, 1) === vGET(b, 1)
        && vGET(a, 2) === vGET(b, 2)
        && vGET(a, 3) === vGET(b, 3);
}

const vZeros = vMAKE(0, 0, 0, 0);
const vOnes = vMAKE(1, 1, 1, 1);
const vTwos = vMAKE(2, 2, 2, 2);
const vStraight = vMAKE(1, 2, 3, 4);
const vRevStraight = vMAKE(4, 3, 2, 1);
const v045 = vMAKE(0, 0, 0.45, 0);

const s = 1 / Math.sqrt(3);
const vOnesNorm = vMAKE(s, s, s, 0);

test('Test mul, add, sub', function(t) {

    t.true(eq(vPRODUCT(vZeros, vOnes), vZeros), 'mul');
    t.true(eq(vPRODUCT(vOnes, vOnes), vOnes), 'mul');
    t.true(eq(vPRODUCT(vOnes, vStraight), vStraight), 'mul');

    t.true(eq(vADD(vZeros, vOnes), vOnes), 'add');
    t.true(eq(vADD(vZeros, vStraight), vStraight), 'add');
    t.true(eq(vADD(vOnes, vOnes), vTwos), 'add');

    t.true(eq(vSUB(vZeros, vZeros), vZeros), 'sub');
    t.true(eq(vSUB(vOnes, vOnes), vZeros), 'sub');
    t.true(eq(vSUB(vTwos, vOnes), vOnes), 'sub');

    t.end();
});

test('Test dot, norm, scale', function(t) {

    t.equal(vDOT(vZeros, vOnes), 0, 'dot');
    t.equal(vDOT(vOnes, vOnes), 3, 'dot');
    t.equal(vDOT(vOnes, vStraight), 6, 'dot');

    t.true(eq(vNORM(vOnes), vOnesNorm), 'normalise');

    t.true(eq(vSCALE(0, vOnes), vZeros), 'scale');
    t.true(eq(vSCALE(0.5, vTwos), vOnes), 'scale');

    t.end();
});

test('Test length, maxval', function(t) {

    t.equal(vLENGTH(vZeros), 0, 'length');
    t.equal(vLENGTH(vOnes), Math.sqrt(3), 'length');

    t.true(eq(vMAXVAL(1, vOnes), vOnes), 'maxval');
    t.true(eq(vMAXVAL(1, vTwos), vOnes), 'maxval');

    t.end();
});

test('Test get, set', function(t) {

    t.equal(vGET(vRevStraight, 0), 4, 'get');
    t.equal(vGET(vStraight, 2), 3, 'get');

    var v = vMAKE(vZeros);
    vSET(v, 2, 0.45);
    t.true(eq(v, v045), 'set');

    t.end();
});
