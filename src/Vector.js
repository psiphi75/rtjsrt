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
 * @type {{make: make, dot: dot, scale: scale, add: add, sub: sub, length: length, max_val: max_val, normalise: normalise}}
 */

function Vector(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}
Vector.prototype.dot = function(w) {
    return this.x * w.x + this.y * w.y + this.z * w.z;
};
Vector.prototype.add = function(w) {
    return new Vector(this.x + w.x, this.y + w.y, this.z + w.z);
};
Vector.prototype.addInplace = function(w) {
    this.x += w.x;
    this.y += w.y;
    this.z += w.z;
};
Vector.prototype.sub = function(w) {
    return new Vector(this.x - w.x, this.y - w.y, this.z - w.z);
};
Vector.prototype.subInplace = function(w) {
    this.x -= w.x;
    this.y -= w.y;
    this.z -= w.z;
};
Vector.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};
Vector.prototype.normalise = function() {
    var s = 1 / this.length(this);
    return new Vector(this.x * s, this.y * s, this.z * s);
};
Vector.prototype.normaliseInplace = function() {
    var s = 1 / this.length(this);
    this.x *= s;
    this.y *= s;
    this.z *= s;
};
Vector.prototype.copy = function () {
    return new Vector(this.x, this.y, this.z);
};
Vector.prototype.scale = function (f) {
    var v = new Vector(this.x, this.y, this.z);
    v.x *= f;
    v.y *= f;
    v.z *= f;
    return v;
};
Vector.prototype.scaleInplace = function(f) {
    this.x *= f;
    this.y *= f;
    this.z *= f;
};
Vector.prototype.scaleThenAdd = function(v, f) {
    return new Vector(this.x + v.x * f, this.y + v.y * f, this.z + v.z * f);
};
Vector.prototype.product = function (w) {
    return new Vector(this.x * w.x, this.y * w.y, this.z * w.z);
};
Vector.prototype.productInplace = function(w) {
    this.x *= w.x;
    this.y *= w.y;
    this.z *= w.z;
};
Vector.prototype.equals = function(w) {
    return this.x === w.x && this.y === w.y && this.z === w.z;
};
Vector.prototype.sumElements = function () {
    return this.x + this.y + this.z;
};

module.exports = Vector;
