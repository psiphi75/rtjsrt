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
Sphere.prototype.intersect = function (v, p) {
    // Intersection with a circle from a ray coming from [px, py, pz] direction [vx, vy, vz]
    //A=vx * vx + vy * vy + vz * vz
    //B=2*(vx*px + vy*py + vz*pz - vx*cx - vy*cy - vz*cz)
    //C=px*px + py*py + pz*pz - 2 * (px
    var A = vector.dot(v, v);
    var B = 2.0 * (vector.dot(v, p) - vector.dot(v, this.c));
    var C = vector.dot(p, p) - 2.0 * vector.dot(p, this.c) + vector.dot(this.c, this.c) - this.r * this.r;
    var D = B * B - 4.0 * A * C;
    if (D >= 0.0) {
        var sqrtD = Math.sqrt(D);
        if (-B <= sqrtD) {
            // If t is less than zero then the ray is in the wrong direction.
            return [COL_WHITE, -1];
        }
        return [this.col, (-B - sqrtD) / (2.0 * A)];
    }
    else {
        return [COL_WHITE, -1];
    }
};
/**
 * Get the normal at point p.
 * @param {vector} p  The point to get the normal at.
 * @returns {vector}  The normal vector.
 */
Sphere.prototype.get_norm = function (p) {
    return vector.sub(p, this.c);
};


/**
 * Make a disc. This is just a circle on a plane.
 * @param {vector} center_v  the center of the disc.
 * @param {vector} norm_v    the normal of the disc.
 */
function Disc(center_v, norm_v) {
    // Plane equation is a*x + b*y + c*z = d.
    this.c = center_v;      // center of disc
    this.n = norm_v;        // normal vector
    this.r = 1.0;           // radius
    this.col = COL_WHITE;
    this.rf = 0.0;          // Reflectivity -> 0.0 to 1.0.
    this.spec = 0.0;        // specular intensity
    this.diff = 0.0;        // diffuse intesity
    this.d = vector.dot(this.c, this.n);    // solve plane equation for d
    this.type = 'disc';
}
/**
 * Intersection with a disc from a ray coming from [px, py, pz] with direction vector [vx, vy, vz].
 * @param {vector} v    the incoming ray source position
 * @param {vector} p    the incoming ray direction vector
 * @returns {[*,*]}     And array with [colour, intersection hit]
 */
Disc.prototype.intersect = function (v, p) {

    var d = vector.dot(this.n, v);
    var t = (this.d - vector.dot(this.n, p)) / d;
    if (t > 0.0) {
        var pi = vector.add(p, vector.scale(t, v));
        var pi_sub_c = vector.modv(vector.sub(pi, this.c));
        if (pi_sub_c < this.r) {
            if (Math.sin(pi[0] * 5.0) * Math.sin(pi[2] * 5.0) > 0.0) {
                return [COL_SQUARE_1, t];
            }
            else {
                return [COL_SQUARE_2, t];
            }
        }
    }
    return [COL_WHITE, -1];
};
/**
 * Return a copy of the normal vector for this disc.
 * @returns {vector} the normal vector.
 */
Disc.prototype.get_norm = function () {
    return vector.make(this.n[0], this.n[1], this.n[2]);
};

/**
 * Light class, can have position and colour.
 */
function Light(p, colour) {
    this.p = p;
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
    this.ambiant_light = 1.0;       // Default ambient light intensity -> 0.0 to 1.0
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