/*********************************************************************
 *                                                                   *
 *   Copyright 2017 Simon M. Werner                                  *
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

var Objects = require('./Objects');
var Physics = require('./Physics');
var constants = require('./Constants');
var Vector = require('./Vector');
var FPSTimer = require('./FPSTimer');

//
// Some global constants.
//

var COL_BACKGROUND = constants.COL_BACKGROUND;
var GROUND_PLANE = constants.GROUND_PLANE;
var EPSILON = constants.EPSILON;
var Ray = Objects.Ray;

/**
 * The Ray Tracer
 * @param {number} cols
 * @param {number} rows
 * @param {boolean} do_physics
 * @constructor
 * @struct
 */
function RayTracer(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.depth = constants.DEPTH;
    this.timers = {
        raytrace: new FPSTimer(),
        intersect: new FPSTimer(),
        getShadeAtPoint: new FPSTimer()
    };


    /**************************************/
    /* Create the scene, add our objects. */
    /**************************************/


    // set up the Physics
    this.physics = new Physics(GROUND_PLANE, {
        bouncing: false
    });

    // Init the eye and scene
    var eye = new Objects.Eye(new Vector(0.0, 2, -15.0), 0.75, 0.75, 2.0);
    this.scene = new Objects.Scene(eye);
    this.scene.ambient_light = 0.3;

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
    this.scene.add_object(disc);

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
    this.scene.add_object(sph);
    this.physics.add_object(sph);

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
    this.scene.add_object(sph2);
    this.physics.add_object(sph2);

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
    this.scene.add_object(sph3);
    this.physics.add_object(sph3);

    // Add a light
    var light_c = new Vector(5, 7.5, -2.0);
    var light_col = constants.COL_WHITE;
    var light = new Objects.Light(light_c, light_col);
    this.scene.add_light(light);


    /**************************************/
    /*     Do some pre-calculations.      */
    /**************************************/

    // Start in the top left
    var xDirectionStart = -this.scene.eye.w / 2.0;
    var yDirectionStart = this.scene.eye.h / 2.0;
    var direction = new Vector(xDirectionStart, yDirectionStart, this.scene.eye.d);
    var origin = this.scene.eye.c;
    var dnx = new Vector(this.scene.eye.w / (this.cols - 1.0), 0, 0);
    var dny = new Vector(0, this.scene.eye.h / (this.rows - 1.0), 0);

    // Prepare the strips
    this.strips = [];
    var strip;
    var pnt = 0;
    for (var row = 0; row < this.rows; row++) {

        if (row % constants.SQUARE_SIZE === 0) {
            strip = [];
        }

        for (var col = 0; col < this.cols; col++) {
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
            this.strips.push(strip);
        }
    }

    // Prepare the result strip, this will be copied, it means we don't have
    // do the 255 copy.
    var len = this.strips[0].length * 4;
    this.preparedStripBuf = new Uint8ClampedArray(len);
    for (let i = 3; i < len; i += 4) {
        this.preparedStripBuf[i] = 255;
    }

    // We create this line so we don't have to copy too many items too many times
    let staticBackgroundLine = new Uint8ClampedArray(constants.SQUARE_SIZE * 4);
    const background = COL_BACKGROUND.copy();
    background.scaleInplace(255);
    background.maxValInplace(255);
    for (let i = 0; i < staticBackgroundLine.length * 4; i += 4) {
        staticBackgroundLine[i] = background.x;
        staticBackgroundLine[i + 1] = background.y;
        staticBackgroundLine[i + 2] = background.z;
        staticBackgroundLine[i + 3] = 255;
    }
    this.staticBackgroundLine = staticBackgroundLine;
}

RayTracer.prototype.getNumStrips = function() {
    return this.strips.length;
};
RayTracer.prototype.increment = function() {
    this.physics.apply_forces();
};


/**
 * Render the scene.  This will update the data object that was provided.
 */
RayTracer.prototype.render = function(stripID) {

    var self = this;
    var objs = self.scene.objs;
    var resultGrid = new Uint8ClampedArray(this.preparedStripBuf);
    var static_colour = COL_BACKGROUND.copy();

    // The "main loop"
    raytraceStrip(self.strips[stripID]);
    return resultGrid.buffer;

    function raytraceAndSave(sPnt, strip) {
        raytrace(static_colour, self.depth, strip[sPnt].firstRay, -1, 1);
        static_colour.scaleInplace(255);
        static_colour.maxValInplace(255);

        var p = sPnt * 4;
        resultGrid[p] = static_colour.x;
        resultGrid[p + 1] = static_colour.y;
        resultGrid[p + 2] = static_colour.z;
        // resultGrid[p + 3] = 255;
    }


    function raytraceStrip(strip) {

        // TopLeft (TL), TopRight (TR), ...
        var sPntTL = 0;
        var sPntTR = constants.SQUARE_SIZE - 1;
        var sPntBL = (constants.SQUARE_SIZE - 1) * self.cols;
        var sPntBR = sPntBL + constants.SQUARE_SIZE - 1;

        // For Each Square
        for (; sPntTL < self.cols;) {

            var pixSum = 0;
            raytraceAndSave(sPntTL, strip);
            pixSum += static_colour.sumElements();
            raytraceAndSave(sPntTR, strip);
            pixSum += static_colour.sumElements();
            raytraceAndSave(sPntBL, strip);
            pixSum += static_colour.sumElements();
            raytraceAndSave(sPntBR, strip);
            pixSum += static_colour.sumElements();

            // Check to see if we can fill the square with black
            const allElementsAreZero = (pixSum === 0);

            var sPnt = sPntTL;

            // Fill the square with colour (or black)
            if (allElementsAreZero) {
                for (let r = 0; r < constants.SQUARE_SIZE; r++) {
                    resultGrid.set(new Uint8ClampedArray(self.staticBackgroundLine), sPnt * 4);
                    sPnt += self.cols;
                }
            } else {

                for (let r = 0; r < constants.SQUARE_SIZE; r++) {
                    for (let c = 0; c < constants.SQUARE_SIZE; c++) {
                        // Don't need to calculate those that have already be calculated
                        if (sPnt !== sPntTL && sPnt !== sPntTR && sPnt !== sPntBL && sPnt !== sPntBR) {
                            raytraceAndSave(sPnt, strip);
                        }
                        sPnt++;
                    }
                    sPnt += self.cols - constants.SQUARE_SIZE;
                }
            }

            sPntTL += constants.SQUARE_SIZE;
            sPntTR += constants.SQUARE_SIZE;
            sPntBL += constants.SQUARE_SIZE;
            sPntBR += constants.SQUARE_SIZE;

        }
    }


    /**
     * Recursive function that returns the shade of a pixel.
     * @param {Object} colour    The colour - this value gets changed in place
     * @param {number} depth     How many iterations left
     * @param {Ray} ray          The ray
     * @param {number} objID  The ID of the object the ray comes from
     * @param {number} rindex    Refractivity
     */
    function raytrace(colour, depth, ray, objID, rindex) {

        if (depth === 0) {
            colour.set(COL_BACKGROUND);
            return;
        }

        var closestObjId = -1;
        var closestInt;
        var len = objs.length;

        for (var i = 0; i < len; i++) {
            // Don't intersect object with itself
            if (i !== objID) {

                var obj = objs[i];
                var intersection = obj.intersect(ray);
                if (intersection !== null) {
                    if (closestObjId === -1 || intersection.t < closestInt.t) {
                        closestInt = intersection;
                        closestObjId = i;
                    }
                }
            }
        }

        if (closestObjId === -1) {
            colour.set(COL_BACKGROUND);
        } else {
            colour.set(closestInt.col);
            // If we found an object, get the shade for the object.  Otherwise return the background
            getShadeAtPoint(colour, depth, ray, closestObjId, closestInt.pi, rindex);
        }
    }

    /**
     * Get the shade of the pixel - where the work is done
     * @param {Object} colour    The colour - this value gets changed in place
     * @param {number} depth     How many iterations left
     * @param {Ray} ray          The ray
     * @param {number} objID     The ID of the object the ray just hit
     * @param {Object} pi        The intersection point
     * @param {number} rindex    Refractivity
     */
    function getShadeAtPoint(colour, depth, ray, objID, pi, rindex) {

        var obj = objs[objID];
        colour.scaleInplace(obj.ambient_light);

        var light = self.scene.lights[0];

        // handle point light source -
        var L = light.c.sub(pi);
        var shade = getShading(L, pi, objID);

        // calculate diffuse shading
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

            var R = L; // NOTE: don't use L after this;
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

                var rcol = COL_BACKGROUND.copy();
                raytrace(rcol, depth - 1, newRay, objID, 1);
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
                var rfrCol = COL_BACKGROUND.copy();
                raytrace(rfrCol, depth - 1, refrRay, objID, obj.rfr);
                colour.addInplace(rfrCol);
            }
        }

    }

    function getShading(L, pi, objID) {
        var tdist = L.length();
        var Lt = L.scale(1 / tdist);
        var r = new Ray(pi.add(Lt.scale(EPSILON)), Lt);
        for (var i = 0; i < objs.length; i++) {

            // Don't intersect with self...
            // ... and check if an object is in the way of the light source

            if (objID !== i
                && objs[objID].canReceiveShadow
                && objs[i].canCreateShadow
                && objs[i].intersect(r) !== null) {
                return 0;
            }
        }
        return 1;
    }

};

module.exports = RayTracer;
