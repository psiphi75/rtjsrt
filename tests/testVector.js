
'use strict';
var Vector = require('../src/Vector');
var test = require('tape');

const vZeros = new Vector(0, 0, 0, 0);
const vOnes = new Vector(1, 1, 1, 1);
const vTwos = new Vector(2, 2, 2, 2);
const vStraight = new Vector(1, 2, 3, 4);
const vRevStraight = new Vector(4, 3, 2, 1);
const v045 = new Vector(0, 0, 0.45, 0);

const s = 1 / Math.sqrt(3);
const vOnesNorm = new Vector(s, s, s, 0);

test('Test mul, add, sub', function(t) {

    t.true(vZeros.product(vOnes).equals(vZeros), 'mul');
    t.true(vOnes.product(vOnes).equals(vOnes), 'mul');
    t.true(vOnes.product(vStraight).equals(vStraight), 'mul');

    t.true(vZeros.add(vOnes).equals(vOnes), 'add');
    t.true(vZeros.add(vStraight).equals(vStraight), 'add');
    t.true(vOnes.add(vOnes).equals(vTwos), 'add');

    t.true(vZeros.sub(vZeros).equals(vZeros), 'sub');
    t.true(vOnes.sub(vOnes).equals(vZeros), 'sub');
    t.true(vTwos.sub(vOnes).equals(vOnes), 'sub');

    t.end();
});

test('Test dot, norm, scale', function(t) {

    t.equal(vZeros.dot(vOnes), 0, 'dot');
    t.equal(vOnes.dot(vOnes), 3, 'dot');
    t.equal(vOnes.dot(vStraight), 6, 'dot');

    t.true(vOnes.normalise().equals(vOnesNorm), 'normalise');

    t.true(vOnes.scale(0).equals(vZeros), 'scale');
    t.true(vTwos.scale(0.5).equals(vOnes), 'scale');

    t.end();
});

test('Test length, maxval', function(t) {

    t.equal(vZeros.length(), 0, 'length');
    t.equal(vOnes.length(), Math.sqrt(3), 'length');

    t.end();
});
