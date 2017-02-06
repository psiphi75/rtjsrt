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

var RayTracer = require('./RayTracer');
var WorkerManager = require('./WorkerManager');

function ManageRayTracing(numWorkers, width, height, grid) {
    var rt = new RayTracer(width, height);
    var numStrips = rt.getNumStrips();

    // Create an array ['0', '1', '2', ...]
    this.stripIDs = [...Array(numStrips).keys()].map((i) => i.toFixed(0));

    this.grid = grid;
    this.workerManager = new WorkerManager(numWorkers);
}

ManageRayTracing.prototype.renderFrame = function(callback) {

    var self = this;
    this.workerManager.addWorkToQueue(this.stripIDs, applyData, callback);

    function applyData(err, rtData, stripID) {

        var startPnt = stripID * rtData.data.byteLength;
        var endPnt = startPnt + rtData.data.byteLength - 1;
        var grid = new Uint8ClampedArray(rtData.data);
        for (let i = 0, pnt = startPnt; pnt < endPnt; pnt++, i++) {
            self.grid[pnt] = grid[i];
        }
    }

};

ManageRayTracing.prototype.shutDown = function() {
    this.workerManager.terminateAll();
};

module.exports = ManageRayTracing;
