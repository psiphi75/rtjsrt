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

var Vector = require('./Vector');


/**
 * A **very** simple physics implimentation.
 * @param ground_v
 * @param options
 * @constructor
 */
function Physics(ground_v, options) {
    this.obj_list = [];
    this.gravity = new Vector(0.0, -0.00981, 0.0);
    this.ground_vector = ground_v;
    this.options = options;
}

Physics.prototype.add_object = function (obj) {
    this.obj_list[this.obj_list.length] = obj;
    obj.velocity = new Vector(0, 0, 0);
};

Physics.prototype.apply_forces = function () {
    for (var i = 0; i < this.obj_list.length; i++) {
        rotate3d(this.obj_list[i].c, 5 / 180 * Math.PI);
    }

    function rotate3d(p, angle) {
        var sin_t = Math.sin(angle);
        var cos_t = Math.cos(angle);

        var x = p.x;
        var z = p.z;
        p.x = x * cos_t - z * sin_t;
        p.z = z * cos_t + x * sin_t;
    }
};

module.exports = Physics;
