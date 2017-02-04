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

const FPSTimer = require('./src/FPSTimer');
const RayTracer = require('./src/RayTracer');
const constants = require('./src/Constants');

const imageData = new Array(constants.WIDTH * constants.HEIGHT * 4);
for (let p = 0; p < imageData.length; p++) {
    imageData[p] = 255;
}

const rt = new RayTracer(constants.WIDTH, constants.HEIGHT, imageData, true);
const timer = new FPSTimer();
let frames = 0;


console.log(new Date());
console.log('FPS,FPS(avg)');

let startTime = new Date().getTime();
while (true) {

    timer.start();
    rt.render();
    const fps = timer.stop();
    frames++;

    console.log(`${fps.toFixed(2)},${timer.average().toFixed(2)}`);

    if (new Date().getTime() - startTime > 60000) {
        console.log(`frames,${frames}`);
        let exit = process.exit;
        exit();
    } 

}
