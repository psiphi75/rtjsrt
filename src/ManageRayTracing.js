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
    this.rt = new RayTracer(width, height);
    this.numStrips = this.rt.getNumStrips();
    this.numWorkers = numWorkers;
    this.grid = grid;

    if (this.numWorkers > 1) {
        // Create an array ['0', '1', '2', ...]
        this.stripIDs = [...Array(this.numStrips).keys()].map((i) => i.toFixed(0));
        this.workerManager = new WorkerManager(numWorkers);
    }

}

ManageRayTracing.prototype.renderFrame = function(callback) {

    var self = this;
    if (this.numWorkers > 1) {
        this.workerManager.addWorkToQueue(this.stripIDs, function(err, rtData, stripID) {
            applyData(rtData.data, stripID);
        }, callback);
    } else {
        for (let stripID = 0; stripID < this.numStrips; stripID++) {
            applyData(this.rt.render(stripID), stripID);
        }
        this.rt.increment();
        callback();
    }

    // Copy the data accross
    function applyData(gridBuf, stripID) {
        let startPnt = stripID * gridBuf.byteLength;
        self.grid.set(new Uint8ClampedArray(gridBuf), startPnt);
    }

};

ManageRayTracing.prototype.shutDown = function() {
    if (this.numWorkers > 1) {
        this.workerManager.terminateAll();
    }
};

module.exports = ManageRayTracing;
