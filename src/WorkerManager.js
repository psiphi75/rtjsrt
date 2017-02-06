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

var parallelLimit = require('async').parallelLimit;

function WorkerManager(numWorkers, uri) {
    this.activeWorkers = [];
    this.idleWorkers = [];
    this.numWorkers = numWorkers;

    for (var i = 0; i < numWorkers; i++ ) {
        var worker = new Worker(uri);
        this.idleWorkers.push(worker);
    }
}
WorkerManager.prototype.addWorkToQueue = function (messages, intermediateCallback, finalCallback) {

    var self = this;
    var work = messages.map(function(message) {
        return function(asyncDoneCallback) {
            self.assignWorker(message, function(err, result) {
                intermediateCallback(null, result, message);
                asyncDoneCallback(null, null);
            });
        };
    });
    parallelLimit(work, this.numWorkers, function() {
        self.nextFrame();
        finalCallback();
    });
};

WorkerManager.prototype.assignWorker = function (message, callback) {
    if (this.idleWorkers.length === 0) throw new Error('WorkerManager.assignWorker: no more idle workers');

    var self = this;
    var worker = this.idleWorkers.shift();
    this.activeWorkers.push(worker);

    worker.addEventListener('message', waitForResult, { once: true });
    worker.postMessage(message);

    function waitForResult(data) {

        // Remove the active worker
        var index = self.activeWorkers.indexOf(worker);
        if (index > -1) {
            self.activeWorkers.splice(index, 1);
        }

        self.idleWorkers.push(worker);
        callback(null, data);
    }
};

WorkerManager.prototype.nextFrame = function() {
    if (this.activeWorkers.length > 0) throw new Error('There are active workers when there should be none.');
    this.idleWorkers.forEach(function(worker) {
        worker.postMessage('inc');
    });
};

module.exports = WorkerManager;
