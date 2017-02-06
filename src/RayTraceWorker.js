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

const isNodeJS = new Function('try {return this===global;}catch(e){return false;}')();

var path = isNodeJS ?  __dirname + '/../../src/' : '';
var RayTracer;
var constants;

if (isNodeJS) {
    RayTracer = require(path + 'RayTracer');
    constants = require(path + 'Constants');
} else {
    RayTracer = require('./RayTracer');
    constants = require('./Constants');
}

var rt = new RayTracer(constants.WIDTH, constants.HEIGHT);

self.addEventListener('message', function(e) {
    var msg = e.data;
    switch (true) {
        case msg === 'inc':
            rt.increment();
            break;

        case !isNaN(msg):
            var stripID = parseInt(msg);
            var data = rt.render(stripID);
            self.postMessage(data, [data]);
            break;

        default:
            console.error('Unexpected value: ', msg);
    }
}, false);
