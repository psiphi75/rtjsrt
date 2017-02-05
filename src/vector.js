/*********************************************************************
 *                                                                   *
 *   Copyright 2016 Simon M. Werner                                  *
 *                                                                   *
 *   Licensed to the Apache Software Foundation (ASF) under one      *
 *   or more contributor license agreements.  See the NOTICE file    *
 *   distributed with this work for additional information           *
 *   regarding copyright ownership.  The ASF licenses this file      *
 *   to you under the Apache License, Version 2.0 (the               *
 *   "License"); you may not use this file except in compliance      *
 *   with the License.  You may obtain a copy of the License at      *
 *                                                                   *
 *      http://www.apache.org/licenses/LICENSE-2.0                   *
 *                                                                   *
 *   Unless required by applicable law or agreed to in writing,      *
 *   software distributed under the License is distributed on an     *
 *   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY          *
 *   KIND, either express or implied.  See the License for the       *
 *   specific language governing permissions and limitations         *
 *   under the License.                                              *
 *                                                                   *
 *********************************************************************/

'use strict';
/* global SIMD */

/**
 * General vector object. Stores vector information and has vector operators.
 * @type {{make: make, dot: dot, scale: scale, add: add, sub: sub, length: length, max_val: max_val, normalise: normalise}}
 */

const TYPE = SIMD.Float32x4;

const GET = TYPE.extractLane;
const MUL = TYPE.mul;
const ADD = TYPE.add;
const SUB = TYPE.sub;
const SPLAT = TYPE.splat;
const MIN = TYPE.min;

var vector = {
    make: function (x, y, z) {
        if (typeof x === 'number') {
            return TYPE(x, y, z, 0);
        } else {
            return TYPE(GET(x, 0), GET(x, 1), GET(x, 2), 0);
        }
    },
    dot: function (v, w) {
        var m = MUL(v, w);
        return GET(m, 0) + GET(m, 1) + GET(m, 2);
    },
    scale: function (f, v) {
        return MUL(SPLAT(f), v);
    },
    add: function (v, w) {
        return ADD(v, w);
    },
    sub: function (v, w) {
        return SUB(v, w);
    },
    product: function (v, w) {
        return MUL(v, w);
    },
    length: function (v) {
        return Math.sqrt(vector.dot(v, v));
    },
    max_val: function (max, v) {
        return MIN(SPLAT(max), v);
    },
    normalise: function (v) {
        var s = 1 / vector.length(v);
        return MUL(SPLAT(s), v);
    },
    get: function(v, i) {
        return GET(v, i);
    },
    set: function(v, i, val) {
        TYPE.replaceLane(v, i, val);
    }
};

// var vector = {
//     make: function (x, y, z) {
//         if (typeof x === 'number') {
//             return [x, y, z];
//         } else {
//             return [x[0], x[1], x[2]];
//         }
//     },
//     dot: function (v, w) {
//         return v[0] * w[0] + v[1] * w[1] + v[2] * w[2];
//     },
//     scale: function (f, v) {
//         return [v[0] * f, v[1] * f, v[2] * f];
//     },
//     add: function (v, w) {
//         return [v[0] + w[0], v[1] + w[1], v[2] + w[2]];
//     },
//     sub: function (v, w) {
//         return [v[0] - w[0], v[1] - w[1], v[2] - w[2]];
//     },
//     product: function (v, w) {
//         return [v[0] * w[0], v[1] * w[1], v[2] * w[2]];
//     },
//     length: function (v) {
//         return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
//     },
//     max_val: function (max, v) {
//         return [Math.min(v[0], max), Math.min(v[1], max), Math.min(v[2], max)];
//     },
//     normalise: function (v) {
//         var s = vector.length(v);
//         return [v[0] / s, v[1] / s, v[2] / s];
//     },
//     get: function(v, i) {
//         return v[i];
//     },
//     set: function(v, i, val) {
//         v[i] = val;
//     }
// };

module.exports = vector;
