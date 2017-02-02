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
 * A **very** simple physics implimentation.
 * @param ground_v
 * @param options
 * @constructor
 */
function Physics(ground_v, options) {
    this.obj_list = [];
    this.gravity = vector.make(0.0, -0.00981, 0.0);
    this.ground_vector = ground_v;
    this.options = options;
}

Physics.prototype.add_object = function (obj) {
    this.obj_list[this.obj_list.length] = obj;
    obj.velocity = vector.make(0, 0, 0);
};

Physics.prototype.apply_forces = function () {
    for (var i = 0; i < this.obj_list.length; i++) {
        var obj = this.obj_list[i];
        obj.c = vector.add(obj.c, obj.velocity);
        obj.velocity = vector.add(obj.velocity, this.gravity);

        var y_lowest_point = obj.c[1] - obj.r;
        if (y_lowest_point <= this.ground_vector[1]) {

            if (this.options.bouncing) {
                // bounce the sphere by reversing the velocity and adding some damping
                obj.c[1] -= y_lowest_point - this.ground_vector[1];
                obj.velocity[0] *= 0.9;
                obj.velocity[1] *= -0.6;
                obj.velocity[2] *= 0.9;
            } else {
                // no bouncing
                obj.velocity[1] = 0;
                obj.c[1] = obj.r;
            }
        }

    }
};

module.exports = Physics;
