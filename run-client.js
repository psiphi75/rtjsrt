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

var animationIsRunning = true;

// Let the page load.
window.onload = function() {

    // Attach runPause
    document.getElementById('run_button').addEventListener('click', function runPause() {
        animationIsRunning = !animationIsRunning;
        if (animationIsRunning) {
            generate();
        }
    }, false);

    var constants = require('./src/Constants');
    var ManageRayTracing = require('./src/ManageRayTracing');
    var FPSTimer = require('./src/FPSTimer');
    var timer = new FPSTimer();

    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    context.canvas.height = constants.HEIGHT;
    context.canvas.width = constants.WIDTH;
    var image = context.getImageData(0, 0, constants.WIDTH, constants.HEIGHT);
    var imageData = image.data;

    // Set the colour to white
    for (var p = 0; p < imageData.length; p += 4) {
        imageData[p + 3] = 255;
    }

    var rt = new ManageRayTracing(constants.NUM_WORKERS, constants.WIDTH, constants.HEIGHT, imageData);
    generate();

    function generate() {

        timer.start();
        rt.renderFrame(done);

        function done() {

            var fps = timer.stop();

            context.putImageData(image, 0, 0);

            document.getElementById('fps').innerHTML = '<p>FPS: ' + fps.toFixed(1) + ' (' + timer.average().toFixed(2) + ')</p>';
            if (animationIsRunning) setTimeout(generate, 0);

        }

    }

};
