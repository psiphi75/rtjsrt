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
 * A simple timer that stores the FPS (Frames Per Second) as a list.
 */
function FPSTimer() {
    var fpsTimes = [];
    var times = [];
    var startTime;
    var now;
    var pauseStart = 0;
    var counter = 0;

    if (typeof performance === 'undefined') {
        // We are using NodeJS
        now = require('performance-now');
    } else {
        // We are in a browser
        now = performance.now.bind(performance);
    }

    return {
        count: function() {
            counter++;
        },
        start: function() {
            startTime = now();
        },
        pause: function() {
            pauseStart = now();
        },
        resume: function() {
            var pausedTime = pauseStart - now();
            startTime -= pausedTime;
        },
        stop: function() {
            if (startTime === undefined) return NaN;
            var stopTime = now();
            times.push(stopTime - startTime);
            var fpsTime = 1000 / (stopTime - startTime);
            startTime = undefined;
            fpsTimes.push(fpsTime);
            return fpsTime;
        },
        getFPSList: function() {
            return fpsTimes;
        },
        average: function() {
            var sum = fpsTimes.reduce(function(a, b) { return a + b; });
            return sum / fpsTimes.length;
        },
        totalTime: function() {
            return times.reduce(function(a, b) { return a + b; });
        },
        getCounter: function() { return counter; }
    };
}

module.exports = FPSTimer;
