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

var vector = require('./vector');
var constants = require('./Constants');

var COL_WHITE = constants.COL_WHITE;
var COL_SQUARE_1 = constants.COL_SQUARE_1;
var COL_SQUARE_2 = constants.COL_SQUARE_2;


/**
 * Make a sphere.
 * @param {vector} center_v    the center point of the Sphere
 * @constructor
 */
function Sphere(center_v) {
    this.c = center_v;      // Center position vector

    // TODO: Test this hypothosis
    this.n = vector.make(0, 0, 0); // only, for speed purposes, Chrome V8 likes objects with same parameter setup.
    this.r = 1.0;           // Radius
    this.col = COL_WHITE;   // Colour of sphere
    this.rf = 0.0;          // Reflectivity -> 0.0 to 1.0
    this.spec = 0.0;        // the specular amount -> 0.0 to 1.0
    this.diff = 0.0;
    this.d = vector.make(0, 0, 0);  // like .n above.
    this.type = 'sphere';
}
Sphere.prototype.intersect = function (ray) {
    // Intersection with a circle from a ray coming from [px, py, pz] direction [vx, vy, vz]
    //A=vx * vx + vy * vy + vz * vz
    //B=2*(vx*px + vy*py + vz*pz - vx*cx - vy*cy - vz*cz)
    //C=px*px + py*py + pz*pz - 2 * (px

    // FIXME (algo): Some of these ray dot products are done multiple times for the same ray
    var A = vector.dot(ray.direction, ray.direction);
    var B = 2.0 * (vector.dot(ray.direction, ray.origin) - vector.dot(ray.direction, this.c));
    var C = vector.dot(ray.origin, ray.origin) - 2.0 * vector.dot(ray.origin, this.c) + vector.dot(this.c, this.c) - this.r * this.r;
    var D = B * B - 4.0 * A * C;
    if (D > 0.0) {
        var sqrtD = Math.sqrt(D);
        if (-B > sqrtD) {
            return {
                col: this.col,
                t: (-B - sqrtD) / (2.0 * A)
            };
        }
    }

    // No hit, or ray is in wrong direction (when t < zero)
    return undefined;
};
/**
 * Get the normal at point p.
 * @param {vector} p  The point to get the normal at.
 * @returns {vector}  The normal vector.
 */
Sphere.prototype.get_norm = function (p) {
    return vector.sub(p, this.c);
};
Sphere.prototype.set_diffuse = function (diff) {
    this.diff = diff;
    this.spec = 1.0 - diff;
};

/**
 * Make a disc. This is just a circle on a plane.
 * @param {vector} center_v  the center of the disc.
 * @param {vector} norm_v    the normal of the disc.
 */
function Disc(center_v, norm_v) {
    // Plane equation is a*x + b*y + c*z = d.
    this.c = center_v;      // center of disc
    this.n = vector.normalise(norm_v);        // normal vector
    this.r = 1.0;           // radius
    this.col = COL_WHITE;
    this.rf = 0.0;          // Reflectivity -> 0.0 to 1.0.
    this.spec = 0.0;        // specular intensity
    this.diff = 0.0;        // diffuse intensity
    this.d = vector.dot(this.c, this.n);    // solve plane equation for d
    this.type = 'disc';
}
/**
 * Intersection with a disc from a ray coming from [px, py, pz] with direction vector [vx, vy, vz].
 * @param {Ray} ray    the incoming ray
 * @returns {object}      And array with {col, t}
 */
Disc.prototype.intersect = function (ray) {

    var d = vector.dot(this.n, ray.direction);
    var t = (this.d - vector.dot(this.n, ray.origin)) / d;
    if (t > 0.0) {
        // FIXME (algo): pi is a common calculation
        var pi = vector.add(ray.origin, vector.scale(t, ray.direction));
        vector.subInplace(pi, this.c);
        var pi_sub_c = vector.length(pi);
        if (pi_sub_c < this.r) {
            if (Math.sin(vector.get(pi, 0) * 5.0) * Math.sin(vector.get(pi, 2) * 5.0) > 0.0) {
                return {
                    col: COL_SQUARE_1,
                    t: t
                };
            } else {
                return {
                    col: COL_SQUARE_2,
                    t: t
                };
            }
        }
    }

    // No intersection
    return undefined;
};
/**
 * Return a copy of the normal vector for this disc.
 * @returns {vector} the normal vector.
 */
Disc.prototype.get_norm = function () {
    return vector.make(this.n);
};
Disc.prototype.set_diffuse = function (diff) {
    this.diff = diff;
    this.spec = 1.0 - diff;
};


/**
 * Light class, can have position and colour.
 */
function Light(c, colour) {
    this.c = c;
    this.col = colour;
}


/**
 * Make an eye, the observer. There can only be one observer.
 * @param {vector} center
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 */
function Eye(center, width, height, depth) {
    this.c = center;
    this.w = width;
    this.h = height;
    this.d = depth;
}


/**
 * Class to make the scene, can add objects, lights.  Requires an eye for constructor.
 * @param {Eye} eye    the observer for the scene.
 */
function Scene(eye) {
    this.eye = eye;
    this.lights = [];               // The list of lights for the scene
    this.objs = [];                 // The list of objects in the scene
}
Scene.prototype.add_light = function (light) {
    this.lights.push(light);
};
Scene.prototype.add_object = function (obj) {
    this.objs.push(obj);
    obj.rendered = false;            // Has this object been rendered in the last sequence
};


module.exports = {
    Scene: Scene,
    Eye: Eye,
    Light: Light,
    Disc: Disc,
    Sphere: Sphere
};
