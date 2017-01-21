/****************************************************************************/
/**                                                                        **/
/**                       Javascript    Ray    Tracer                      **/
/**                                                                        **/
/**                         simon.werner@gmail.com                         **/
/**                                                                        **/
/****************************************************************************/

/****************************************************************************

 Coordinate system used:

 +y

 ^  ^  +z (depth)
 | /
 |/
 +----->  +x

 ****************************************************************************/

'use strict';

// TODO: Before first publish: Turn into server-client model
// TODO: Before first publish: Make the physics repeatable
// TODO: Before first publish: Allow 3 objects
// TODO: Before first publish: Change timing to FPS + have only following details: FPS, run/pause, reset,

// TODO: Break up shade() - allows better analysis
// TODO: Remove global objects
// TODO: Turn Raytrace into an object
// TODO: Create a change of object structure
// TODO: Make array a typed array


//
// Some global constants.
//

var COL_SQUARE_1 = vector.make(5, 5, 5);
var COL_SQUARE_2 = vector.make(0, 125, 0);
var COL_WHITE = vector.make(255, 255, 255);
var COL_BACKGROUND = COL_WHITE;
var GROUND_PLANE = vector.make(0, 0, 0);


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
        self.fizix = new Physics(GROUND_PLANE, { bouncing: false });

        // Init the eye and scene
        var eye = new Eye(vector.make(0.0, 1.5, -10.0), 0.75, 0.75, 2.0);
        self.scene = new Scene(eye);
        self.scene.ambiant_light = 0.3;

        // Add a sphere
        var sph_center = vector.make(0.0, 1.5, 0.0);
        var sph = new Sphere(sph_center);
        sph.r = 1.0;            // Radius
        sph.col = vector.make(200, 100, 255);   // Colour of sphere
        sph.rf = 0.8;           // Reflectivity -> 0.0 to 1.0
        sph.spec = 0.5;         // the specular amount -> 0.0 to 1.0
        sph.diff = 40.0;         // diffuse amount
        self.scene.add_object(sph);
        self.fizix.add_object(sph);

        // ... and another sphere
        var sph2_center = vector.make(-1.5, 1, -0.75);
        var sph2 = new Sphere(sph2_center);
        sph2.r = 0.5;            // Radius
        sph2.col = vector.make(100, 255, 55);   // Colour of sphere
        sph2.rf = 0.1;           // Reflectivity -> 0.0 to 1.0
        sph2.spec = 0.5;         // the specular amount -> 0.0 to 1.0
        sph2.diff = 0.4;         // diffuse amount
        self.scene.add_object(sph2);
        self.fizix.add_object(sph2);

        // ... and another sphere
        var sph3_center = vector.make(1.2, 0.7, -0.25);
        var sph3 = new Sphere(sph3_center);
        sph3.r = 0.3;            // Radius
        sph3.col = vector.make(255, 100, 55);   // Colour of sphere
        sph3.rf = 0.7;           // Reflectivity -> 0.0 to 1.0
        sph3.spec = 0.1;         // the specular amount -> 0.0 to 1.0
        sph3.diff = 40;         // diffuse amount
        self.scene.add_object(sph3);
        self.fizix.add_object(sph3);

        // Add a disc
        var disc_center = vector.make(0.0, 0.0, 2.0);
        var disc_normal = vector.make(0.0, 1.0, 0.0);
        var disc = new Disc(disc_center, disc_normal);
        disc.r = 3;
        disc.rf = 0.0;           // Reflectivity -> 0.0 to 1.0
        disc.diff = 40.0;
        self.scene.add_object(disc);

        // Add a light
        var light_p = vector.make(5, 7.5, 2.0);
        var light_col = vector.make(255, 255, 255);
        var light = new Light(light_p, light_col);
        self.scene.add_light(light);
    }
}
RayTracer.prototype.raytrace = function() {

    var self = this;
    if (this.do_physics) {
        this.fizix.apply_forces();
    }

    var row = -1;
    var col = 0;

    // TODO: Create a rotation around the center of the disc
    this.scene.eye.c = vector.make(cursorX / 200, cursorY / 400 + 1, -10.0);

    // Start in the top left
    var scene_eye_w = this.scene.eye.w;
    var n = vector.make(-scene_eye_w / 2.0, this.scene.eye.h / 2.0, this.scene.eye.d);

    var p0 = this.scene.eye.c;
    var dnx = scene_eye_w / (this.cols - 1.0);
    var dny = this.scene.eye.h / (this.rows - 1.0);

    for (var p = 0; p < this.grid.length; p += 4) {
        row += 1;
        n[0] += dnx;
        if (row === this.rows) {
            row = 0;
            col += 1;
            n[1] -= dny;
            n[0] = -scene_eye_w / 2.0;
        }

        var colour = shade(this.depth, p0, n, -1);

        // limit the colour - extreme intensities become white
        vector.max_val(255, colour);

        /* Set the colour value of the pixel */
        this.grid[p] = Math.round(colour[0]);
        this.grid[p + 1] = Math.round(colour[1]);
        this.grid[p + 2] = Math.round(colour[2]);
        //this.grid[p+3] = 255     <-- only need to do this once at startup.

    }   // end: for p


    function shade(depth, p, v, source_i) {

        if (depth > 0) {
            depth--;

            for (var i = 0; i < self.scene.objs.length; i++) {
                if (i === source_i) {
                    // Don't intersect object with itself
                    continue;
                }
                var obj = self.scene.objs[i];
                var ret_val = obj.intersect(v, p);

                if (ret_val[1] !== -1) {
                    // object found, return the colour

                    var pi;     // intersection point
                    var norm;   // the object normal at the intersection point
                    var colour = ret_val[0];
                    var t = ret_val[1];
                    if (self.scene.ambiant_light > 0.0) {
                        colour = vector.scale(self.scene.ambiant_light, colour);
                    }

                    if (obj.rf > 0.0 || obj.spec > 0.0 || obj.diff > 0.0) {
                        // Can calculate some items here that are shared.
                        pi = vector.add(p, vector.scale(t, v));             // the position of the intersection
                        norm = obj.get_norm(pi);
                    }

                    if (obj.rf > 0.0) {
                        // We have a reflection Jim.
                        var vi = vector.sub(v, vector.scale(2 * vector.dot(v, norm), norm));
                        colour = vector.add(colour, vector.scale(obj.rf, shade(depth, pi, vi, i)));
                    }

                    if (obj.spec > 0.0) {
                        // Phong shading (for specular shading)
                        var r = vector.sub(self.scene.lights[0].p, vector.scale(2.0 * vector.dot(self.scene.lights[0].p, norm), norm));
                        var v_dot_r = vector.dot(vector.normalise(v), vector.normalise(r));
                        if (v_dot_r > 0.0) {
                            var spec = obj.spec * Math.pow(v_dot_r, 50);
                            colour = vector.add(colour, vector.scale(spec, self.scene.lights[0].col));
                        }
                    }

                    if (obj.diff > 0.0) {
                        // Phong shading (for diffuse shading)

                        // vector to the light source
                        var l = vector.sub(self.scene.lights[0].p, pi);
                        var object_found = false;

                        // create shadow, look for all objects for an intersection
                        for (var d = 0; d < self.scene.objs.length; d++) {
                            if (i === d) {
                                // Don't intersect object with itself
                                continue;
                            }
                            obj = self.scene.objs[d];
                            ret_val = obj.intersect(l, pi);

                            object_found = ret_val[1] !== -1;
                            if (object_found) {
                                break;
                            }
                        }

                        // if no object found, then we can do the test for the light.
                        if (!object_found) {
                            var diff = obj.diff * vector.dot(vector.normalise(l), vector.normalise(norm));
                            if (diff > 0.0) {
                                var dist = vector.modv(l);  // distance from light source
                                colour = vector.add(colour, vector.scale(diff / (dist * dist), self.scene.lights[0].col));
                            }
                        }
                    }

                    return colour;
                }
            }
        }
        return vector.scale(self.scene.ambiant_light, COL_BACKGROUND);
    }

};