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

// TODO (perf): use const/let
// TODO (perf): Make array a typed array OR make vector a proper object
// TODO (perf): See how ASM.js makes performance improvements

const Objects = require('./Objects');
const Physics = require('./Physics');
const constants = require('./Constants');
const vector = require('./vector');

//
// Some global constants.
//

const COL_BACKGROUND = constants.COL_BACKGROUND;
const GROUND_PLANE = constants.GROUND_PLANE;
const EPSILON = constants.EPSILON;

const vMAKE = vector.make;
const vADD = vector.add;
const vADD_IP = vector.addInplace;
const vPRODUCT = vector.product;
const vPRODUCT_IP = vector.productInplace;
const vSUB = vector.sub;
const vSUB_IP = vector.subInplace;
const vDOT = vector.dot;
const vNORM = vector.normalise;
const vNORM_IP = vector.normaliseInplace;
const vSCALE = vector.scale;
const vSCALE_IP = vector.scaleInplace;
const vLENGTH = vector.length;
const vMAXVAL_IP = vector.max_valInplace;
const vSET = vector.set;
const vGET = vector.get;

/**
 * A ray that gets cast.
 * @param {vector} origin
 * @param {vector} direction (must be normalised)
 * @constructor
 */
function Ray(origin, direction) {
    this.origin = origin;
    this.direction = direction;
}


function RayTracer(cols, rows, grid, do_physics) {
    this.cols = cols;
    this.rows = rows;
    this.grid = grid;
    this.do_physics = do_physics;
    this.depth = 9;
    const self = this;

    init_scene();

    /**************************************/
    /* Create the scene, add our objects. */
    /**************************************/
    function init_scene() {

        // set up the Physics
        self.physics = new Physics(GROUND_PLANE, {
            bouncing: false
        });

        // Init the eye and scene
        let eye = new Objects.Eye(vMAKE(0.0, 2, -15.0), 0.75, 0.75, 2.0);
        self.scene = new Objects.Scene(eye);
        self.scene.ambient_light = 0.3;

        // Add a disc
        let disc_center = vMAKE(0.0, 0.0, 0);
        let disc_normal = vMAKE(0.0, 1.0, 0.0);
        let disc = new Objects.Disc(disc_center, disc_normal);
        disc.r = 6;
        disc.rfl = 0.7; // Reflectivity -> 0.0 to 1.0
        disc.rfr = 0; // Refractivity
        disc.ambient_light = 0.6;
        disc.set_diffuse(0.2);
        self.scene.add_object(disc);

        // Add a sphere
        let sph_center = vMAKE(0.7, 1.2, 0.4);
        let sph = new Objects.Sphere(sph_center);
        sph.r = 1.0; // Radius
        sph.col = vMAKE(constants.COL_RED); // Colour of sphere
        sph.rfl = 0.9; // Reflectivity -> 0.0 to 1.0
        sph.rfr = 0; // Refractivity
        sph.ambient_light = 0.2;
        sph.set_diffuse(0.2);
        self.scene.add_object(sph);
        self.physics.add_object(sph);

        // ... and another sphere
        let sph2_center = vMAKE(-1.5, 1.6, 0.4);
        let sph2 = new Objects.Sphere(sph2_center);
        sph2.r = 0.8;
        sph2.col = vMAKE(constants.COL_WHITE);
        sph2.rfl = 0.6;
        sph2.rfr = 0; // Refractivity
        sph2.ambient_light = 0.2;
        sph2.set_diffuse(0.7);
        self.scene.add_object(sph2);
        self.physics.add_object(sph2);

        // ... and another sphere
        let sph3_center = vMAKE(1.2, 0.8, -1.8);
        let sph3 = new Objects.Sphere(sph3_center);
        sph3.r = 0.8;
        sph3.col = vMAKE(constants.COL_WHITE);
        sph3.rfl = 0.4;
        sph3.rfr = 1.12; // Refractivity
        sph3.ambient_light = 0.05;
        sph3.set_diffuse(0);
        self.scene.add_object(sph3);
        self.physics.add_object(sph3);

        // Add a light
        const light_c = vMAKE(5, 7.5, -2.0);
        const light_col = vMAKE(constants.COL_WHITE);
        const light = new Objects.Light(light_c, light_col);
        self.scene.add_light(light);
    }
}
/**
 * Render the scene.  This will update the data object that was provided.
 */
// var TRACE = false;
RayTracer.prototype.render = function() {

    const self = this;
    if (self.do_physics) {
        self.physics.apply_forces();
    }


    // Start in the top left
    const xDirectionStart = -self.scene.eye.w / 2.0;
    const yDirectionStart = self.scene.eye.h / 2.0;
    const direction = vMAKE(xDirectionStart, yDirectionStart, self.scene.eye.d);
    const origin = self.scene.eye.c;
    const dnx = vMAKE(self.scene.eye.w / (self.cols - 1.0), 0, 0);
    const dny = vMAKE(0, self.scene.eye.h / (self.rows - 1.0), 0);
    let gridPnt = 0;

    for (let row = 0; row < self.rows; row++) {

        for (let col = 0; col < self.cols; col++) {

            vADD_IP(direction, dnx);

            const firstRay = new Ray(origin, vNORM(direction));
            let pixel_col = raytrace(self.depth, firstRay, -1, COL_BACKGROUND, 1);
            // if (row === 400 && col === 233) TRACE = true; else TRACE = false;
            // if (TRACE) console.log('Tracing')
            // limit the colour - extreme intensities become white
            vSCALE_IP(255, pixel_col);
            // FIXME (perf): use & 255,  This will round numbers too
            vMAXVAL_IP(255, pixel_col);

            /* Set the pixel_col value of the pixel */
            self.grid[gridPnt] = Math.round(vGET(pixel_col, 0));
            self.grid[gridPnt + 1] = Math.round(vGET(pixel_col, 1));
            self.grid[gridPnt + 2] = Math.round(vGET(pixel_col, 2));
            gridPnt += 4;

        }

        vSET(direction, 0, xDirectionStart);
        vSUB_IP(direction, dny);

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

        let closestObj;
        let closestObjT = Infinity;
        for (let i = 0; i < self.scene.objs.length; i++) {
            // Don't intersect object with itself
            if (i !== source_i) {
                let obj = self.scene.objs[i];
                let intersection = obj.intersect(ray);
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
            return getShadeAtPoint(depth, ray, closestObj.i, closestObj.intersection, closestObj.obj, colour, rindex);
        } else {
            return colour;
        }

    }

    function getShadeAtPoint(depth, ray, source_i, intersection, obj, colour, rindex) {
        // object found, return the colour

        colour = vSCALE(obj.ambient_light, intersection.col);
        const pi = vADD(ray.origin, vSCALE(intersection.t, ray.direction)); // the position of the intersection

        const light = self.scene.lights[0];

        // handle point light source -
        let shade = 1;
        let L = vSUB(light.c, pi);
        const tdist = vLENGTH(L);
        L = vSCALE(1 / tdist, L);
        const r = new Ray(vADD(pi, vSCALE(EPSILON, L)), L);
        for (let i = 0; i < self.scene.objs.length; i++) {

            // FIXME (algo): Add "canCreateShadow" here for each object

            // Don't intersect with self...
            // ... and check if an object is in the way of the light source
            if (source_i !== i && self.scene.objs[i].intersect(r)) {
                shade = 0;
                break;
            }
        }

        // calculate diffuse shading
        L = vSUB(light.c, pi);
        vNORM_IP(L);
        const V = ray.direction;
        const N = obj.get_norm(pi);
        const dotLN = vDOT(L, N);
        const dotVN = vDOT(ray.direction, N);
        if (obj.diff > 0) {
            if (dotLN > 0) {
                const diff = dotLN * obj.diff * shade;
                // add diffuse component to ray color
                vADD_IP(colour, vSCALE(diff, vPRODUCT(light.col, obj.col)));
            }
        }

        // determine specular component
        if (obj.spec > 0) {
            // point light source: sample once for specular highlight

            const R = L;  // NOTE: don't use L after this;
            vSUB_IP(R, vSCALE(2 * dotLN, N));
            const dotVR = vDOT(V, R);
            if (dotVR > 0) {
                const spec = Math.pow(dotVR, 20) * obj.spec * shade;
                // add specular component to ray color
                vADD_IP(colour, vSCALE(spec, light.col));
            }
        }

        // calculate reflection
        if (obj.rfl > 0) {
            const R = vSUB(ray.direction, vSCALE(2 * dotVN, N));
            if (depth > 0) {
                const newRay = new Ray(vADD(pi, vSCALE(EPSILON, R)), R);
                const rcol = raytrace(depth - 1, newRay, source_i, COL_BACKGROUND, 1);
                vPRODUCT_IP(rcol, obj.col);
                vSCALE_IP(obj.rfl, rcol);
                vADD_IP(colour, rcol);
            }
        }

        // calculate refraction
        if (obj.rfr > 0) {
            const n = rindex / obj.rfr;
            const result = rindex === 1.0 ? 1 : -1;
            const rN = N;
            vSCALE_IP(result, rN); // NOTE: Don't use N after this point
            const cosI = -dotVN;
            const cosT2 = 1 - n * n * (1.0 - cosI * cosI);
            if (cosT2 > 0) {
                vSCALE_IP(n * cosI - Math.sqrt(cosT2), rN);
                const T = ray.direction;  // NOTE: Don't use ray after this point
                vSCALE_IP(n, T);
                vADD_IP(T, rN);
                const refrRay = new Ray(vADD(pi, vSCALE(EPSILON, T)), T);
                const rfrCol = raytrace(depth - 1, refrRay, source_i, COL_BACKGROUND, obj.rfr);
                vADD_IP(colour, rfrCol);
            }
        }

        return colour;

    }

};

module.exports = RayTracer;
