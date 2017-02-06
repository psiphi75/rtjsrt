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

'use strict';

var profiler = require('v8-profiler');
var fs = require('fs');
const profiling = process.env.PROFILE === '1';

const FPSTimer = require('./src/FPSTimer');
const ManageRayTracing = require('./src/ManageRayTracing');
const constants = require('./src/Constants');

const imageData = new Uint8Array(constants.WIDTH * constants.HEIGHT * 4);

var rt = new ManageRayTracing(constants.NUM_WORKERS, constants.WIDTH, constants.HEIGHT, imageData);
const timer = new FPSTimer();
let frames = 0;


console.log(new Date());
console.log('FPS,FPS(avg)');

let processStartTime = new Date().getTime();
generate();

function generate() {

    timer.start();
    rt.renderFrame(done);

    function done() {

        const fps = timer.stop();
        frames++;

        if (profiling && frames > 10) {
            profiler.startProfiling();
        }

        console.log(`${fps.toFixed(2)},${timer.average().toFixed(2)}`);

        if (new Date().getTime() - processStartTime < 20000) {
            setTimeout(generate, 0);
        } else {
            console.log(`frames,${frames * 3}`);

            if (profiling) {
                profiler.stopProfiling().export(function(error, result) {
                    fs.writeFileSync('profile.json', result);
                });
            }
            rt.shutDown();
        }
    }
}
