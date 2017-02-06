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

function WorkerManager(uri, numWorkers) {
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
            self.assignWorker(message, function(result) {
                intermediateCallback(null, result);
                asyncDoneCallback(null);
            });
        };
    });
    parallelLimit(work, this.numWorkers, finalCallback);
};

WorkerManager.prototype.assignWorker = function (message, callback) {
    if (this.idleWorkers.length === 0) throw new Error('WorkerManager.assignWorker: no more idle workers');

    var worker = this.idleWorkers.shift();
    this.activeWorkers.push(worker);

    worker.addEventListener('message', waitForResult, false);
    worker.postMessage(message);

    function waitForResult(data) {

        // Remove the active worker
        var index = this.activeWorkers.indexOf(worker);
        if (index > -1) {
            this.activeWorkers.splice(index, 1);
        }
        this.idleWorkers.push(worker);
        callback(null, data);
    }
};

module.exports = WorkerManager;
