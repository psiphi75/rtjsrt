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

/**
 * General vector object. Stores vector information and has vector operators.
 * @type {{make: make, dot: dot, scale: scale, add: add, sub: sub, modv: modv, max_val: max_val, normalise: normalise}}
 */
module.exports = {
    make: function (x, y, z) {
        return [x, y, z];
    },

    dot: function (v, w) {
        return (v[0] * w[0] + v[1] * w[1] + v[2] * w[2]);
    },

    scale: function (f, v) {
        return [v[0] * f, v[1] * f, v[2] * f];
    },
    add: function (v, w) {
        return [v[0] + w[0], v[1] + w[1], v[2] + w[2]];
    },
    sub: function (v, w) {
        return [v[0] - w[0], v[1] - w[1], v[2] - w[2]];
    },
    modv: function (v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    },
    max_val: function (max, v) {
        return [Math.min(v[0], max), Math.min(v[1], max), Math.min(v[2], max)];
    },
    normalise: function (v) {
        var s = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return [v[0] / s, v[1] / s, v[2] / s];
    }

};
