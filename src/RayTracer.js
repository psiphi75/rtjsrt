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

/*********************************************************************/
/**                                                                 **/
/**      Javascript    Ray    Tracer                                **/
/**                                                                 **/
/*********************************************************************/

/*********************************************************************

         Coordinate system used:

         +y

         ^  ^  +z (depth)
         | /
         |/
         +----->  +x

 *********************************************************************/

'use strict';

// TODO: Break up shade() - allows better analysis

// TODO (perf): See how ASM.js makes performance improvements

var Objects = require('./Objects');
var Physics = require('./Physics');
var constants = require('./Constants');
var Vector = require('./Vector');

//
// Some global constants.
//

var COL_BACKGROUND = constants.COL_BACKGROUND;
var GROUND_PLANE = constants.GROUND_PLANE;
var EPSILON = constants.EPSILON;

/**
 * A ray that gets cast.
 * @param {vector} origin
 * @param {vector} direction (must be normalised)
 * @constructor
 */
function Ray(origin, direction) {
    this.origin = origin;
    this.direction = direction;
    this.dotDD = direction.dot(direction);
    this.dotDO = direction.dot(origin);
    this.dotOO = origin.dot(origin);
}


function RayTracer(cols, rows, grid, do_physics) {
    this.cols = cols;
    this.rows = rows;
    this.grid = grid;
    this.do_physics = do_physics;
    this.depth = 9;
    var self = this;

    init_scene();
    init_calcs();

    /**************************************/
    /* Create the scene, add our objects. */
    /**************************************/
    function init_scene() {

        // set up the Physics
        self.physics = new Physics(GROUND_PLANE, {
            bouncing: false
        });

        // Init the eye and scene
        var eye = new Objects.Eye(new Vector(0.0, 2, -15.0), 0.75, 0.75, 2.0);
        self.scene = new Objects.Scene(eye);
        self.scene.ambient_light = 0.3;

        // Add a disc
        var disc_center = new Vector(0.0, 0.0, 0);
        var disc_normal = new Vector(0.0, 1.0, 0.0);
        var disc = new Objects.Disc(disc_center, disc_normal);
        disc.r = 6;
        disc.rfl = 0.7; // Reflectivity -> 0.0 to 1.0
        disc.rfr = 0; // Refractivity
        disc.ambient_light = 0.6;
        disc.set_diffuse(0.2);
        disc.canCreateShadow = false;
        disc.canReceiveShadow = true;
        self.scene.add_object(disc);

        // Add a sphere
        var sph_center = new Vector(0.7, 1.2, 0.4);
        var sph = new Objects.Sphere(sph_center);
        sph.r = 1.0; // Radius
        sph.col = constants.COL_RED; // Colour of sphere
        sph.rfl = 0.9; // Reflectivity -> 0.0 to 1.0
        sph.rfr = 0; // Refractivity
        sph.ambient_light = 0.2;
        sph.set_diffuse(0.2);
        sph.canCreateShadow = true;
        sph.canReceiveShadow = false;
        self.scene.add_object(sph);
        self.physics.add_object(sph);

        // ... and another sphere
        var sph2_center = new Vector(-1.5, 1.6, 0.4);
        var sph2 = new Objects.Sphere(sph2_center);
        sph2.r = 0.8;
        sph2.col = constants.COL_WHITE;
        sph2.rfl = 0.6;
        sph2.rfr = 0; // Refractivity
        sph2.ambient_light = 0.2;
        sph2.set_diffuse(0.7);
        sph2.canCreateShadow = true;
        sph2.canReceiveShadow = false;
        self.scene.add_object(sph2);
        self.physics.add_object(sph2);

        // ... and another sphere
        var sph3_center = new Vector(1.2, 0.8, -1.8);
        var sph3 = new Objects.Sphere(sph3_center);
        sph3.r = 0.8;
        sph3.col = constants.COL_WHITE;
        sph3.rfl = 0.4;
        sph3.rfr = 1.12; // Refractivity
        sph3.ambient_light = 0.05;
        sph3.set_diffuse(0);
        sph3.canCreateShadow = true;
        sph3.canReceiveShadow = false;
        self.scene.add_object(sph3);
        self.physics.add_object(sph3);

        // Add a light
        var light_c = new Vector(5, 7.5, -2.0);
        var light_col = constants.COL_WHITE;
        var light = new Objects.Light(light_c, light_col);
        self.scene.add_light(light);
    }

    function init_calcs() {
        // Start in the top left
        var xDirectionStart = -self.scene.eye.w / 2.0;
        var yDirectionStart = self.scene.eye.h / 2.0;
        var direction = new Vector(xDirectionStart, yDirectionStart, self.scene.eye.d);
        var origin = self.scene.eye.c;
        var dnx = new Vector(self.scene.eye.w / (self.cols - 1.0), 0, 0);
        var dny = new Vector(0, self.scene.eye.h / (self.rows - 1.0), 0);

        self.preCalcs = [];
        var strip;
        var pnt = 0;
        for (var row = 0; row < self.rows; row++) {

            if (row % constants.SQUARE_SIZE === 0) {
                strip = [];
            }

            for (var col = 0; col < self.cols; col++) {
                direction.addInplace(dnx);
                var firstRay = new Ray(origin, direction.normalise());
                strip.push({
                    firstRay: firstRay,
                    pnt: pnt,
                    pixel_col: new Vector(0, 0, 0)
                });
                pnt++;
            }

            direction.x = xDirectionStart;
            direction.subInplace(dny);

            if ((row + 1) % constants.SQUARE_SIZE === 0) {
                self.preCalcs.push(strip);
            }

        }

    }
}
/**
 * Render the scene.  This will update the data object that was provided.
 */
RayTracer.prototype.render = function() {

    var self = this;
    if (self.do_physics) {
        self.physics.apply_forces();
    }

    // The main loop
    for (let i = 0; i < self.preCalcs.length; i++) {
        let strip = self.preCalcs[i];
        raytraceStrip(strip);
        for (let sPnt = 0; sPnt < strip.length; sPnt++) {
            var point = strip[sPnt];
            var pixel_col = point.pixel_col;

            /* Set the pixel_col value of the pixel */
            var canvasPnt = point.pnt * 4;
            self.grid[canvasPnt] = pixel_col.x * 255;
            self.grid[canvasPnt + 1] = pixel_col.y * 255;
            self.grid[canvasPnt + 2] = pixel_col.z * 255;
        }
    }

    function raytraceStrip(strip) {

        function setRaytrace(s) {

            // Don't need to calculate those that have already be calculated
            if (s === sPntTL) return pixel_colTL;
            if (s === sPntTR) return pixel_colTR;
            if (s === sPntBL) return pixel_colBL;
            if (s === sPntBR) return pixel_colBR;
            return raytrace(self.depth, strip[s].firstRay, -1, COL_BACKGROUND, 1);
        }

        function setBlack() { return constants.COL_BLACK; }

        // TopLeft (TL), TopRight (TR), ...
        var sPntTL = 0;
        var sPntTR = constants.SQUARE_SIZE - 1;
        var sPntBL = (constants.SQUARE_SIZE - 1) * self.cols;
        var sPntBR = sPntBL + constants.SQUARE_SIZE - 1;

        // For Each Square
        for (; sPntTL < self.cols; ) {

            var pixel_colTL = raytrace(self.depth, strip[sPntTL].firstRay, -1, COL_BACKGROUND, 1);
            var pixel_colTR = raytrace(self.depth, strip[sPntTR].firstRay, -1, COL_BACKGROUND, 1);
            var pixel_colBL = raytrace(self.depth, strip[sPntBL].firstRay, -1, COL_BACKGROUND, 1);
            var pixel_colBR = raytrace(self.depth, strip[sPntBR].firstRay, -1, COL_BACKGROUND, 1);

            var sPnt = sPntTL;

            // Check to see if we can fill the square with black
            var pixSum = pixel_colTL.add(pixel_colTR).add(pixel_colBL).add(pixel_colBR);
            var fn;
            if (pixSum.sumElements() === 0) {
                fn = setBlack;
            } else {
                fn = setRaytrace;
            }

            // Fill the square with colour (or black)
            for (let r = 0; r < constants.SQUARE_SIZE; r++) {
                for (let c = 0; c < constants.SQUARE_SIZE; c++) {
                    strip[sPnt].pixel_col = fn(sPnt);
                    sPnt++;
                }
                sPnt += self.cols - constants.SQUARE_SIZE;
            }

            sPntTL += constants.SQUARE_SIZE;
            sPntTR += constants.SQUARE_SIZE;
            sPntBL += constants.SQUARE_SIZE;
            sPntBR += constants.SQUARE_SIZE;

        }
    }


    /**
     * Recursive function that returns the shade of a pixel.
     * @param {number} depth     How many iterations left
     * @param {Ray} ray          The ray
     * @param {number} source_i  The ID of the object the ray comes from
     * @returns {vector}         An RGB colour
     */
    function raytrace(depth, ray, source_i, colour, rindex) {

        if (depth === 0) {
            return colour;
        }

        var closestObj;
        var closestObjT = Infinity;
        for (var i = 0; i < self.scene.objs.length; i++) {
            // Don't intersect object with itself
            if (i !== source_i) {
                var obj = self.scene.objs[i];
                var intersection = obj.intersect(ray);
                if (intersection) {
                    if (intersection.t < closestObjT) {
                        closestObjT = intersection.t;
                        closestObj = {
                            i: i,
                            intersection: intersection,
                            obj: obj
                        };
                    }
                }
            }
        }

        // If we found an object, get the shade for the object.  Otherwise return the background
        if (closestObj) {
            return getShadeAtPoint(depth, ray, closestObj.i, closestObj.intersection, closestObj.obj, rindex);
        } else {
            return colour;
        }

    }

    function getShadeAtPoint(depth, ray, source_i, intersection, obj, rindex) {
        // object found, return the colour

        var colour = intersection.col.scale(obj.ambient_light);
        var pi = ray.origin.add(ray.direction.scale(intersection.t)); // the position of the intersection

        var light = self.scene.lights[0];

        // handle point light source -
        var shade = 1;
        var L = light.c.sub(pi);
        var tdist = L.length();
        L = L.scale(1 / tdist);
        var r = new Ray(pi.add(L.scale(EPSILON)), L);
        for (var i = 0; i < self.scene.objs.length; i++) {

            // Don't intersect with self...
            // ... and check if an object is in the way of the light source
            if (source_i !== i
                && self.scene.objs[source_i].canReceiveShadow
                && self.scene.objs[i].canCreateShadow
                && self.scene.objs[i].intersect(r)) {
                shade = 0;
                break;
            }
        }

        // calculate diffuse shading
        L = light.c.sub(pi);
        L.normaliseInplace();
        var V = ray.direction;
        var N = obj.get_norm(pi);
        var dotLN = L.dot(N);
        var dotVN = ray.direction.dot(N);
        if (obj.diff > 0) {
            if (dotLN > 0) {
                var diff = dotLN * obj.diff * shade;
                // add diffuse component to ray color
                colour.addInplace(light.col.product(obj.col).scale(diff));
            }
        }

        // determine specular component
        if (obj.spec > 0) {
            // point light source: sample once for specular highlight

            var R = L;  // NOTE: don't use L after this;
            R.subInplace(N.scale(2 * dotLN));
            var dotVR = V.dot(R);
            if (dotVR > 0) {
                var spec = Math.pow(dotVR, 20) * obj.spec * shade;
                // add specular component to ray color
                colour.addInplace(light.col.scale(spec));
            }
        }

        // calculate reflection
        if (obj.rfl > 0) {
            R = ray.direction.sub(N.scale(2 * dotVN));
            if (depth > 0) {
                var newRay = new Ray(pi.add(R.scale(EPSILON)), R);
                var rcol = raytrace(depth - 1, newRay, source_i, COL_BACKGROUND, 1);
                rcol.productInplace(obj.col);
                rcol.scaleInplace(obj.rfl);
                colour.addInplace(rcol);
            }
        }

        // calculate refraction
        if (obj.rfr > 0) {
            var n = rindex / obj.rfr;
            var result = rindex === 1.0 ? 1 : -1;
            var rN = N;
            rN.scaleInplace(result); // NOTE: Don't use N after this point
            var cosI = -dotVN;
            var cosT2 = 1 - n * n * (1.0 - cosI * cosI);
            if (cosT2 > 0) {
                rN.scaleInplace(n * cosI - Math.sqrt(cosT2));
                var T = ray.direction;
                T = T.scale(n);
                T.addInplace(rN);
                var refrRay = new Ray(pi.add(T.scale(EPSILON)), T);
                var rfrCol = raytrace(depth - 1, refrRay, source_i, COL_BACKGROUND, obj.rfr);
                colour.addInplace(rfrCol);
            }
        }

        return colour;

    }

};

module.exports = RayTracer;
