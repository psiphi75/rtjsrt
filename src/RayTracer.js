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

// TODO (perf): Make array a typed array OR make vector a proper object
// TODO (perf): See how ASM.js makes performance improvements

var Objects = require('./Objects');
var Physics = require('./Physics');
var constants = require('./Constants');
var vector = require('./vector');

//
// Some global constants.
//

var COL_BACKGROUND = constants.COL_BACKGROUND;
var GROUND_PLANE = constants.GROUND_PLANE;


function RayTracer(cols, rows, grid, do_physics) {
    this.cols = cols;
    this.rows = rows;
    this.grid = grid;
    this.do_physics = do_physics;
    this.depth = 9;
    var self = this;

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
        var eye = new Objects.Eye(vector.make(0.0, 2, -15.0), 0.75, 0.75, 2.0);
        self.scene = new Objects.Scene(eye);
        self.scene.ambiant_light = 0.3;

        // Add a disc
        var disc_center = vector.make(0.0, 0.0, 0.0);
        var disc_normal = vector.make(0.0, 1.0, 0.0);
        var disc = new Objects.Disc(disc_center, disc_normal);
        disc.r = 3;
        disc.rf = 0.0; // Reflectivity -> 0.0 to 1.0
        disc.diff = 40.0;
        self.scene.add_object(disc);

        // Add a sphere
        var sph_center = vector.make(0.7, 1.6, 0.4);
        var sph = new Objects.Sphere(sph_center);
        sph.r = 1.0; // Radius
        sph.col = vector.make(192, 192, 192); // Colour of sphere
        sph.rf = 1.0; // Reflectivity -> 0.0 to 1.0
        sph.spec = 1.0; // the specular amount -> 0.0 to 1.0
        sph.diff = 10.0; // diffuse amount
        self.scene.add_object(sph);
        self.physics.add_object(sph);

        // ... and another sphere
        var sph3_center = vector.make(1.2, 0.3, -1.25);
        var sph3 = new Objects.Sphere(sph3_center);
        sph3.r = 0.3; // Radius
        sph3.col = vector.make(255, 100, 55); // Colour of sphere
        sph3.rf = 0.7; // Reflectivity -> 0.0 to 1.0
        sph3.spec = 0.5; // the specular amount -> 0.0 to 1.0
        sph3.diff = 40; // diffuse amount
        self.scene.add_object(sph3);
        self.physics.add_object(sph3);

        // ... and another sphere
        var sph2_center = vector.make(-1.5, 1, -0.75);
        var sph2 = new Objects.Sphere(sph2_center);
        sph2.r = 0.5; // Radius
        sph2.col = vector.make(100, 100, 55); // Colour of sphere
        sph2.rf = 0.5; // Reflectivity -> 0.0 to 1.0
        sph2.spec = 0.5; // the specular amount -> 0.0 to 1.0
        sph2.diff = 0.4; // diffuse amount
        self.scene.add_object(sph2);
        self.physics.add_object(sph2);

        // Add a light
        var light_p = vector.make(5, 7.5, 2.0);
        var light_col = vector.make(255, 255, 255);
        var light = new Objects.Light(light_p, light_col);
        self.scene.add_light(light);
    }
}
/**
 * Render the scene.  This will update the data object that was provided.
 * @param angleX   The angle of x axis (radians)
 * @param angleY   The angle of y axis (radians)
 */
RayTracer.prototype.raytrace = function(angleX, angleY) {

    var self = this;
    if (self.do_physics) {
        self.physics.apply_forces();
    }

    var row = -1;

    // Start in the top left
    var scene_eye_w = self.scene.eye.w;
    var n = vector.make(-scene_eye_w / 2.0, self.scene.eye.h / 2.0, self.scene.eye.d);

    var dnx = scene_eye_w / (self.cols - 1.0);
    var dny = self.scene.eye.h / (self.rows - 1.0);

    // var col = 0;
    for (var p = 0; p < self.grid.length; p += 4) {
        row += 1;
        n[0] += dnx;

        if (row === self.rows) {
            // col++;
            row = 0;
            n[1] -= dny;
            n[0] = -scene_eye_w / 2.0;
        }

        var pixel_col = shade(self.depth, self.scene.eye.c, n, -1, self);

        // limit the colour - extreme intensities become white
        vector.max_val(255, pixel_col);

        /* Set the pixel_col value of the pixel */
        self.grid[p] = Math.round(pixel_col[0]);
        self.grid[p + 1] = Math.round(pixel_col[1]);
        self.grid[p + 2] = Math.round(pixel_col[2]);
        //self.grid[p+3] = 255     <-- only need to do this once at startup.

    }

};

/**
 * Recursive function that returns the shade of a pixel.
 * @param {number} depth     How many iterations left
 * @param {vector} src_p         The source position
 * @param {vector} v         The heading vector
 * @param {number} source_i  The ID of the object the ray comes from
 * @returns {vector}         An RGB colour
 */
function shade(depth, src_p, v, source_i, self) {

    if (depth === 0) {
        return COL_BACKGROUND;
    }

    depth--;

    var closestObj;
    var closestObjT = Infinity;
    for (var i = 0; i < self.scene.objs.length; i++) {
        // Don't intersect object with itself
        if (i !== source_i) {
            var obj = self.scene.objs[i];
            var intersection = obj.intersect(v, src_p);

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
        return getShadeAtPoint(depth, src_p, v, closestObj.i, self, closestObj.intersection, closestObj.obj);
    } else {
        return COL_BACKGROUND;
    }

}

function getShadeAtPoint(depth, src_p, v, source_i, self, intersection, obj) {
    // object found, return the colour

    var colour = intersection.col;
    var t = intersection.t;
    // if (self.scene.ambiant_light > 0.0) {
    //     colour = vector.scale(self.scene.ambiant_light, colour);
    // }

    if (obj.rf > 0 || obj.spec > 0 || obj.diff > 0) {


        var pi = vector.add(src_p, vector.scale(t, v));     // the position of the intersection
        var norm = obj.get_norm(pi);                        // the object normal at the intersection point

        if (obj.rf > 0) {
            // We have a reflection Jim.
            var vi = vector.sub(v, vector.scale(2 * vector.dot(v, norm), norm));
            colour = vector.add(colour, vector.scale(obj.rf, shade(depth, pi, vi, source_i, self)));
        }

        if (obj.spec > 0 || obj.diff > 0) {

            // vector to the light source
            var l = vector.sub(self.scene.lights[0].p, pi);
            var intersection2;

            // create shadow, look for all objects for an intersection
            for (var d = 0; d < self.scene.objs.length; d++) {

                // Don't intersect object with itself
                if (source_i !== d) {
                    var obj2 = self.scene.objs[d];
                    intersection2 = obj2.intersect(l, pi);

                    if (intersection2) {
                        break;
                    }
                }
            }


            // if no object found, then we can do the test for the light.
            if (intersection2 === undefined) {

                l = vector.normalise(l);

                // Phong shading (for specular shading)
                if (obj.spec > 0) {
                    // var r = vector.sub(self.scene.lights[0].p, vector.scale(2.0 * vector.dot(self.scene.lights[0].p, norm), norm));
                    // var v_dot_r = vector.dot(vector.normalise(v), vector.normalise(r));
                    // if (v_dot_r > 0) {
                    //     var spec = obj.spec * Math.pow(v_dot_r, 50);
                    //     colour = vector.add(colour, vector.scale(spec, self.scene.lights[0].col));
                    // }

                    // vector3 R = L - 2.0f * DOT( L, N ) * N;
                    // float dot = DOT( V, R );
                    // if (dot > 0)
                    // {
                    //     float spec = powf( dot, 20 ) * prim->GetMaterial()->GetSpecular() * shade;
                    //     // add specular component to ray color
                    //     a_Acc += spec * light->GetMaterial()->GetColor();
                    // }

                    var r = vector.sub(l, vector.scale(2.0 * vector.dot(l, norm), norm));
                    var v_dot_r = vector.dot(vector.normalise(v), vector.normalise(r));
                    if (v_dot_r > 0) {
                        var spec = obj.spec * Math.pow(v_dot_r, 20);
                        colour = vector.add(colour, vector.scale(spec, self.scene.lights[0].col));
                    }
                }

                // Phong shading (for diffuse shading)
                if (obj.diff > 0) {
                    var l_dot_n = vector.dot(l, vector.normalise(norm));  // FIXME (Algo): The norm should already be normalised
                    if (l_dot_n > 0) {
                        var dist = vector.modv(l); // distance from light source
                        var diff = l_dot_n * obj.diff / (dist * dist);
                        var c = vector.product(self.scene.lights[0].col, intersection.col);
                        colour = vector.add(colour, vector.scale(diff, obj.col));
                    }
                }
            }
        }

    }

    return colour;

}


module.exports = RayTracer;
