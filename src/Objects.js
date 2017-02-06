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
var constants = require('./Constants');

var COL_WHITE = constants.COL_WHITE;
var COL_SQUARE_1 = constants.COL_SQUARE_1;
var COL_SQUARE_2 = constants.COL_SQUARE_2;

/**
 * Make a sphere.
 * @param {Vector} center_v    the center point of the Sphere
 * @constructor
 */
function Sphere(center_v) {
    this.c = center_v;      // Center position Vector
    this.r = 1.0;           // Radius
    this.col = COL_WHITE;   // Colour of sphere
    this.rf = 0.0;          // Reflectivity -> 0.0 to 1.0
    this.spec = 0.0;        // the specular amount -> 0.0 to 1.0
    this.diff = 0.0;
    this.d = new Vector(0, 0, 0);  // like .n above.
    this.canCreateShadow = true;
    this.canReceiveShadow = true;
    this.type = 'sphere';
}
Sphere.prototype.intersect = function (ray) {
    // Intersection with a circle from a ray coming from [px, py, pz] direction [vx, vy, vz]
    //A=vx * vx + vy * vy + vz * vz
    //B=2*(vx*px + vy*py + vz*pz - vx*cx - vy*cy - vz*cz)
    //C=px*px + py*py + pz*pz - 2 * (px

    var A = ray.direction.dot(ray.direction);
    var B = 2.0 * (ray.direction.dot(ray.origin) - ray.direction.dot(this.c));
    var C = ray.origin.dot(ray.origin) - 2.0 * ray.origin.dot(this.c) + this.c.dot(this.c) - this.r * this.r;
    var D = B * B - 4.0 * A * C;
    if (D > 0.0) {
        var sqrtD = Math.sqrt(D);
        if (-B > sqrtD) {
            var t = (-B - sqrtD) / (2.0 * A);
            var pi = ray.origin.add(ray.direction.scale(t));
            return {
                hit: true,
                col: this.col,
                t: t,
                pi: pi
            };
        }
    }

    // No hit, or ray is in wrong direction (when t < zero)
    return null;
};
/**
 * Get the normal at point p.
 * @param {Vector} p  The point to get the normal at.
 * @returns {Vector}  The normal Vector.
 */
Sphere.prototype.get_norm = function (p) {
    return p.sub(this.c);
};
Sphere.prototype.set_diffuse = function (diff) {
    this.diff = diff;
    this.spec = 1.0 - diff;
};

/**
 * Make a disc. This is just a circle on a plane.
 * @param {Vector} center_v  the center of the disc.
 * @param {Vector} norm_v    the normal of the disc.
 */
function Disc(center_v, norm_v) {
    // Plane equation is a*x + b*y + c*z = d.
    this.c = center_v;      // center of disc
    this.n = norm_v.normalise();        // normal Vector
    this.r = 1.0;           // radius
    this.col = COL_WHITE;
    this.rf = 0.0;          // Reflectivity -> 0.0 to 1.0.
    this.spec = 0.0;        // specular intensity
    this.diff = 0.0;        // diffuse intensity
    this.d = this.c.dot(this.n);    // solve plane equation for d
    this.canCreateShadow = true;
    this.canReceiveShadow = true;
    this.type = 'disc';
}
/**
 * Intersection with a disc from a ray coming from [px, py, pz] with direction Vector [vx, vy, vz].
 * @param {Ray} ray    the incoming ray
 * @returns {object}      And array with {col, t}
 */
Disc.prototype.intersect = function (ray) {

    var d = this.n.dot(ray.direction);
    var t = (this.d - this.n.dot(ray.origin)) / d;
    if (t > 0.0) {
        var pi = ray.origin.add(ray.direction.scale(t)).sub(this.c);
        var pi_sub_c = pi.length();
        if (pi_sub_c < this.r) {
            if (Math.sin(pi.x * 5.0) * Math.sin(pi.z * 5.0) > 0.0) {
                return {
                    hit: true,
                    col: COL_SQUARE_1,
                    t: t,
                    pi: pi
                };
            } else {
                return {
                    hit: true,
                    col: COL_SQUARE_2,
                    t: t,
                    pi: pi
                };
            }
        }
    }

    // No intersection
    return null;
};
/**
 * Return a copy of the normal Vector for this disc.
 * @returns {Vector} the normal Vector.
 */
Disc.prototype.get_norm = function () {
    return this.n.copy();
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
 * @param {Vector} center
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
